import express, { type Express, type Request, type Response } from "express";
import multer from "multer";
import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { storagePut } from "./storage";

const PONTUACAO: Record<string, number> = {
  "Culto das irmãs": 100,
  "Culto de doutrina": 200,
  "Culto de quinta-feira": 200,
  EBD: 500,
  "Ensaio local": 500,
  "Culto de domingo": 300,
  "Santa Ceia": 500,
  "Culto no lar": 200,
  "Culto ao ar livre (missão)": 200,
  "Cooperação na Sede": 350,
  "Cooperação Belenzinho": 500,
  "Ensaio Sede": 300,
  "Eventos com a UMA local": 750,
  "Cultos na direção da UMA": 400,
};

let pool: Pool | null = null;
type DbRow = RowDataPacket & Record<string, any>;

type AsyncRoute = (req: Request, res: Response) => Promise<void>;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 5,
      waitForConnections: true,
      charset: "utf8mb4",
    });
  }
  return pool;
}

async function withTransaction<T>(work: (connection: PoolConnection) => Promise<T>) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function query<T extends RowDataPacket[] | ResultSetHeader>(sql: string, params: unknown[] = []) {
  const [rows] = await getPool().query<T>(sql, params);
  return rows;
}

export async function ensureLegacySchema() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS jovens (
      id INT NOT NULL AUTO_INCREMENT,
      nome VARCHAR(255) NOT NULL,
      data_nascimento VARCHAR(32) NOT NULL,
      telefone VARCHAR(255) NULL,
      telefone_emergencia VARCHAR(255) NULL,
      endereco TEXT NULL,
      data_batismo VARCHAR(32) NULL,
      instagram VARCHAR(255) NULL,
      foto TEXT NULL,
      PRIMARY KEY (id),
      INDEX jovens_nome_idx (nome)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS eventos (
      id INT NOT NULL AUTO_INCREMENT,
      nome VARCHAR(255) NOT NULL,
      tipo VARCHAR(255) NOT NULL,
      data VARCHAR(32) NOT NULL,
      horario VARCHAR(32) NULL,
      local VARCHAR(255) NULL,
      descricao TEXT NULL,
      PRIMARY KEY (id),
      INDEX eventos_data_idx (data)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS presencas (
      id INT NOT NULL AUTO_INCREMENT,
      jovem_id INT NOT NULL,
      evento_id INT NOT NULL,
      status ENUM('presente', 'ausente', 'justificado') NOT NULL,
      pontos INT NOT NULL DEFAULT 0,
      PRIMARY KEY (id),
      UNIQUE KEY presenca_unica (jovem_id, evento_id),
      CONSTRAINT presenca_jovem_fk FOREIGN KEY (jovem_id) REFERENCES jovens(id) ON DELETE CASCADE,
      CONSTRAINT presenca_evento_fk FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

function formatarTelefone(valor: unknown) {
  if (!valor) return null;
  const partes = String(valor).split(/[\/,;]|\be\b|\bou\b/i).map((parte) => parte.trim()).filter(Boolean);
  const formatarUm = (parte: string) => {
    let digitos = parte.replace(/\D/g, "");
    if (!digitos) return null;
    if (digitos.length > 11 && digitos.startsWith("55")) digitos = digitos.slice(2);
    if (digitos.length === 11) return digitos.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (digitos.length === 10) return digitos.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return digitos;
  };
  const formatados = partes.map(formatarUm).filter(Boolean) as string[];
  return formatados.length ? formatados.join(" / ") : null;
}

function normalizarTexto(texto: unknown) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function converterLista(valor: unknown) {
  if (!valor) return [];
  return String(valor).split(";").map((nome) => nome.trim()).filter(Boolean);
}

function dataISO(data: Date) {
  return data.toISOString().slice(0, 10);
}

function pontosDoStatus(tipo: string, status: string) {
  return status === "ausente" ? 0 : (PONTUACAO[tipo] || 0);
}

export { PONTUACAO, formatarTelefone, pontosDoStatus };

async function salvarFoto(file?: Express.Multer.File) {
  if (!file) return null;
  const extension = file.originalname.includes(".") ? file.originalname.slice(file.originalname.lastIndexOf(".")) : "";
  const uploaded = await storagePut(`umadeb-jovens/fotos/${Date.now()}${extension}`, file.buffer, file.mimetype || "application/octet-stream");
  return uploaded.url;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

async function handler(fn: AsyncRoute, req: Request, res: Response) {
  try {
    await fn(req, res);
  } catch (error) {
    console.error("[UMADEB API]", error);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
}

export function registerLegacyRoutes(app: Express) {
  const jovens = express.Router();
  const eventos = express.Router();
  const ranking = express.Router();
  const importacao = express.Router();

  jovens.get("/", (req, res) => void handler(async (_req, response) => {
    const rows = await query<DbRow[]>("SELECT * FROM jovens ORDER BY nome ASC");
    response.json(rows);
  }, req, res));

  jovens.get("/:id", (req, res) => void handler(async (request, response) => {
    const rows = await query<DbRow[]>("SELECT * FROM jovens WHERE id = ? LIMIT 1", [request.params.id]);
    if (!rows[0]) { response.status(404).json({ erro: "Jovem não encontrado" }); return; }
    response.json(rows[0]);
  }, req, res));

  jovens.post("/", upload.single("foto"), (req, res) => void handler(async (request, response) => {
    const { nome, data_nascimento, telefone, telefone_emergencia, endereco, data_batismo, instagram } = request.body;
    if (!nome || !data_nascimento) { response.status(400).json({ erro: "Nome e data de nascimento são obrigatórios" }); return; }
    const foto = await salvarFoto(request.file);
    const result = await query<ResultSetHeader>(
      `INSERT INTO jovens (nome, data_nascimento, telefone, telefone_emergencia, endereco, data_batismo, instagram, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, data_nascimento, formatarTelefone(telefone), formatarTelefone(telefone_emergencia), endereco || null, data_batismo || null, instagram || null, foto],
    );
    response.status(201).json({ id: result.insertId, mensagem: "Jovem cadastrado com sucesso" });
  }, req, res));

  jovens.put("/:id", upload.single("foto"), (req, res) => void handler(async (request, response) => {
    const current = await query<DbRow[]>("SELECT * FROM jovens WHERE id = ? LIMIT 1", [request.params.id]);
    if (!current[0]) { response.status(404).json({ erro: "Jovem não encontrado" }); return; }
    const { nome, data_nascimento, telefone, telefone_emergencia, endereco, data_batismo, instagram } = request.body;
    const foto = request.file ? await salvarFoto(request.file) : current[0].foto;
    await query<ResultSetHeader>(
      `UPDATE jovens SET nome = ?, data_nascimento = ?, telefone = ?, telefone_emergencia = ?, endereco = ?, data_batismo = ?, instagram = ?, foto = ? WHERE id = ?`,
      [nome, data_nascimento, formatarTelefone(telefone), formatarTelefone(telefone_emergencia), endereco || null, data_batismo || null, instagram || null, foto, request.params.id],
    );
    response.json({ mensagem: "Jovem atualizado com sucesso" });
  }, req, res));

  jovens.delete("/:id", (req, res) => void handler(async (request, response) => {
    const result = await query<ResultSetHeader>("DELETE FROM jovens WHERE id = ?", [request.params.id]);
    if (!result.affectedRows) { response.status(404).json({ erro: "Jovem não encontrado" }); return; }
    response.json({ mensagem: "Jovem excluído com sucesso" });
  }, req, res));

  jovens.post("/importar", (req, res) => void handler(async (request, response) => {
    const lista = request.body.jovens;
    if (!Array.isArray(lista) || !lista.length) { response.status(400).json({ erro: "Nenhum jovem para importar" }); return; }
    const resultado = { importados: 0, falhas: [] as Array<Record<string, unknown>> };
    await withTransaction(async (connection) => {
      for (let index = 0; index < lista.length; index += 1) {
        const jovem = lista[index];
        if (!jovem.nome || !jovem.data_nascimento) {
          resultado.falhas.push({ linha: index + 1, motivo: "Nome ou data de nascimento ausente", nome: jovem.nome || "(sem nome)" });
          continue;
        }
        try {
          await connection.execute(
            `INSERT INTO jovens (nome, data_nascimento, telefone, telefone_emergencia, endereco, data_batismo, instagram, foto) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
            [jovem.nome, jovem.data_nascimento, formatarTelefone(jovem.telefone), formatarTelefone(jovem.telefone_emergencia), jovem.endereco || null, jovem.data_batismo || null, jovem.instagram || null],
          );
          resultado.importados += 1;
        } catch (error) {
          resultado.falhas.push({ linha: index + 1, motivo: error instanceof Error ? error.message : String(error), nome: jovem.nome });
        }
      }
    });
    response.json(resultado);
  }, req, res));

  eventos.get("/", (req, res) => void handler(async (_req, response) => {
    const rows = await query<DbRow[]>("SELECT * FROM eventos ORDER BY data DESC, id DESC");
    response.json(rows);
  }, req, res));

  eventos.post("/gerar-programacao", (req, res) => void handler(async (_request, response) => {
    const criados: Array<Record<string, unknown>> = [];
    await withTransaction(async (connection) => {
      const inserir = async (nome: string, tipo: string, date: Date) => {
        const data = dataISO(date);
        const [existing] = await connection.execute<RowDataPacket[]>("SELECT id FROM eventos WHERE data = ? AND tipo = ? AND nome = ? LIMIT 1", [data, tipo, nome]);
        if (existing.length) return;
        const [result] = await connection.execute<ResultSetHeader>("INSERT INTO eventos (nome, tipo, data, horario, local, descricao) VALUES (?, ?, ?, NULL, NULL, ?)", [nome, tipo, data, "Evento da programação padrão"]);
        criados.push({ id: result.insertId, nome, tipo, data });
      };
      const inicio = new Date(Date.UTC(2026, 1, 1));
      const fim = new Date(Date.UTC(2026, 11, 31));
      for (const date = new Date(inicio); date <= fim; date.setUTCDate(date.getUTCDate() + 1)) {
        const weekday = date.getUTCDay();
        if (weekday === 0) {
          await inserir("EBD", "EBD", date);
          const domingo = Math.ceil(date.getUTCDate() / 7);
          if (domingo !== 4) await inserir("Ensaio local", "Ensaio local", date);
          await inserir(domingo === 3 ? "Santa Ceia" : "Culto de domingo", domingo === 3 ? "Santa Ceia" : "Culto de domingo", date);
        }
        if (weekday === 1) await inserir("Culto das irmãs", "Culto das irmãs", date);
        if (weekday === 2) await inserir("Culto de doutrina", "Culto de doutrina", date);
        if (weekday === 4) await inserir("Culto de quinta-feira", "Culto de quinta-feira", date);
      }
    });
    response.json({ mensagem: "Programação gerada com sucesso", criados: criados.length, eventos: criados });
  }, req, res));

  eventos.get("/:id", (req, res) => void handler(async (request, response) => {
    const eventosRows = await query<DbRow[]>("SELECT * FROM eventos WHERE id = ? LIMIT 1", [request.params.id]);
    if (!eventosRows[0]) { response.status(404).json({ erro: "Evento não encontrado" }); return; }
    const jovensRows = await query<DbRow[]>(
      `SELECT j.id, j.nome, j.foto, p.status, p.pontos FROM jovens j LEFT JOIN presencas p ON p.jovem_id = j.id AND p.evento_id = ? ORDER BY j.nome ASC`,
      [request.params.id],
    );
    response.json({ evento: eventosRows[0], jovens: jovensRows });
  }, req, res));

  eventos.post("/", (req, res) => void handler(async (request, response) => {
    const { nome, tipo, data, horario, local, descricao } = request.body;
    if (!nome || !tipo || !data) { response.status(400).json({ erro: "Nome, tipo e data são obrigatórios" }); return; }
    if (!PONTUACAO[tipo]) { response.status(400).json({ erro: "Tipo de evento inválido" }); return; }
    const result = await query<ResultSetHeader>("INSERT INTO eventos (nome, tipo, data, horario, local, descricao) VALUES (?, ?, ?, ?, ?, ?)", [nome, tipo, data, horario || null, local || null, descricao || null]);
    response.status(201).json({ id: result.insertId, mensagem: "Evento criado com sucesso" });
  }, req, res));

  eventos.put("/:id", (req, res) => void handler(async (request, response) => {
    const { nome, tipo, data, horario, local, descricao } = request.body;
    if (!nome || !tipo || !data) { response.status(400).json({ erro: "Nome, tipo e data são obrigatórios" }); return; }
    if (!PONTUACAO[tipo]) { response.status(400).json({ erro: "Tipo de evento inválido" }); return; }
    const current = await query<DbRow[]>("SELECT id FROM eventos WHERE id = ? LIMIT 1", [request.params.id]);
    if (!current[0]) { response.status(404).json({ erro: "Evento não encontrado" }); return; }
    await withTransaction(async (connection) => {
      await connection.execute("UPDATE eventos SET nome = ?, tipo = ?, data = ?, horario = ?, local = ?, descricao = ? WHERE id = ?", [nome, tipo, data, horario || null, local || null, descricao || null, request.params.id]);
      await connection.execute("UPDATE presencas SET pontos = CASE WHEN status = 'ausente' THEN 0 ELSE ? END WHERE evento_id = ?", [PONTUACAO[tipo], request.params.id]);
    });
    response.json({ mensagem: "Evento atualizado com sucesso" });
  }, req, res));

  eventos.delete("/:id", (req, res) => void handler(async (request, response) => {
    const result = await query<ResultSetHeader>("DELETE FROM eventos WHERE id = ?", [request.params.id]);
    if (!result.affectedRows) { response.status(404).json({ erro: "Evento não encontrado" }); return; }
    response.json({ mensagem: "Evento excluído com sucesso" });
  }, req, res));

  eventos.post("/:eventoId/chamada", (req, res) => void handler(async (request, response) => {
    const { jovem_id, status } = request.body;
    if (!["presente", "ausente", "justificado"].includes(status)) { response.status(400).json({ erro: "Status inválido" }); return; }
    const eventoRows = await query<DbRow[]>("SELECT * FROM eventos WHERE id = ? LIMIT 1", [request.params.eventoId]);
    if (!eventoRows[0]) { response.status(404).json({ erro: "Evento não encontrado" }); return; }
    const jovemRows = await query<DbRow[]>("SELECT id FROM jovens WHERE id = ? LIMIT 1", [jovem_id]);
    if (!jovemRows[0]) { response.status(404).json({ erro: "Jovem não encontrado" }); return; }
    const pontos = pontosDoStatus(eventoRows[0].tipo, status);
    await query<ResultSetHeader>(
      `INSERT INTO presencas (jovem_id, evento_id, status, pontos) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), pontos = VALUES(pontos)`,
      [jovem_id, request.params.eventoId, status, pontos],
    );
    response.json({ mensagem: "Chamada registrada com sucesso", status, pontos });
  }, req, res));

  eventos.post("/:eventoId/finalizar-chamada", (req, res) => void handler(async (request, response) => {
    const eventRows = await query<DbRow[]>("SELECT id FROM eventos WHERE id = ? LIMIT 1", [request.params.eventoId]);
    if (!eventRows[0]) { response.status(404).json({ erro: "Evento não encontrado" }); return; }
    const result = await query<ResultSetHeader>(
      `INSERT INTO presencas (jovem_id, evento_id, status, pontos) SELECT j.id, ?, 'ausente', 0 FROM jovens j LEFT JOIN presencas p ON p.jovem_id = j.id AND p.evento_id = ? WHERE p.id IS NULL`,
      [request.params.eventoId, request.params.eventoId],
    );
    response.json({ mensagem: "Chamada finalizada com sucesso", ausentes: result.affectedRows });
  }, req, res));

  eventos.delete("/:eventoId/chamada/:jovemId", (req, res) => void handler(async (request, response) => {
    await query<ResultSetHeader>("DELETE FROM presencas WHERE evento_id = ? AND jovem_id = ?", [request.params.eventoId, request.params.jovemId]);
    response.json({ mensagem: "Chamada desmarcada com sucesso" });
  }, req, res));

  ranking.get("/", (req, res) => void handler(async (_req, response) => {
    const rows = await query<DbRow[]>(
      `SELECT j.id, j.nome, j.foto, COALESCE(SUM(p.pontos), 0) AS pontos, COUNT(CASE WHEN p.status = 'presente' THEN 1 END) AS presencas, COUNT(CASE WHEN p.status = 'justificado' THEN 1 END) AS justificadas, COUNT(CASE WHEN p.status = 'ausente' THEN 1 END) AS ausencias FROM jovens j LEFT JOIN presencas p ON p.jovem_id = j.id GROUP BY j.id, j.nome, j.foto ORDER BY pontos DESC, j.nome ASC`,
    );
    response.json(rows);
  }, req, res));

  ranking.post("/:eventoId/chamada/todos", (req, res) => void handler(async (request, response) => {
    const { status } = request.body;
    if (!["presente", "ausente", "justificado"].includes(status)) { response.status(400).json({ erro: "Status inválido" }); return; }
    const eventRows = await query<DbRow[]>("SELECT tipo FROM eventos WHERE id = ? LIMIT 1", [request.params.eventoId]);
    if (!eventRows[0]) { response.status(404).json({ erro: "Evento não encontrado" }); return; }
    const pontos = pontosDoStatus(eventRows[0].tipo, status);
    await withTransaction(async (connection) => {
      const [jovensRows] = await connection.query<DbRow[]>("SELECT id FROM jovens");
      for (const jovem of jovensRows) {
        await connection.execute(`INSERT INTO presencas (jovem_id, evento_id, status, pontos) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), pontos = VALUES(pontos)`, [jovem.id, request.params.eventoId, status, pontos]);
      }
    });
    response.json({ mensagem: "Chamada em lote registrada com sucesso" });
  }, req, res));

  importacao.post("/chamadas", (req, res) => void handler(async (request, response) => {
    const eventosLista = request.body.eventos;
    if (!Array.isArray(eventosLista) || !eventosLista.length) { response.status(400).json({ erro: "Nenhum evento foi enviado" }); return; }
    const jovensRows = await query<DbRow[]>("SELECT id, nome FROM jovens");
    const mapa = new Map(jovensRows.map((jovem) => [normalizarTexto(jovem.nome), jovem]));
    const resultado = { eventosCriados: 0, presencasCriadas: 0, falhas: [] as Array<Record<string, unknown>> };
    await withTransaction(async (connection) => {
      for (let index = 0; index < eventosLista.length; index += 1) {
        const item = eventosLista[index];
        try {
          if (!item.data) throw new Error("Data não informada");
          if (!item.tipo) throw new Error("Tipo do evento não informado");
          if (!PONTUACAO[item.tipo]) throw new Error(`Tipo de evento inválido: ${item.tipo}`);
          const [eventResult] = await connection.execute<ResultSetHeader>("INSERT INTO eventos (nome, tipo, data, horario, local, descricao) VALUES (?, ?, ?, ?, ?, ?)", [item.nome || item.tipo, item.tipo, item.data, item.horario || null, item.local || null, item.descricao || null]);
          resultado.eventosCriados += 1;
          for (const [field, status] of [["presentes", "presente"], ["justificados", "justificado"]] as const) {
            for (const nome of converterLista(item[field])) {
              const jovem = mapa.get(normalizarTexto(nome));
              if (!jovem) { resultado.falhas.push({ linha: index + 2, nome, motivo: "Jovem não encontrado" }); continue; }
              await connection.execute(`INSERT INTO presencas (jovem_id, evento_id, status, pontos) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), pontos = VALUES(pontos)`, [jovem.id, eventResult.insertId, status, PONTUACAO[item.tipo]]);
              resultado.presencasCriadas += 1;
            }
          }
        } catch (error) {
          resultado.falhas.push({ linha: index + 2, motivo: error instanceof Error ? error.message : String(error) });
        }
      }
    });
    response.json({ mensagem: "Importação concluída", ...resultado });
  }, req, res));

  app.get("/api/health", (_req, res) => res.json({ ok: true, app: "UMADEB Jovens" }));
  app.use("/api/jovens", jovens);
  app.use("/api/eventos", eventos);
  app.use("/api/ranking", ranking);
  app.use("/api/importacao", importacao);
}
