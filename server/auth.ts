import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import type { Express, Request, Response, NextFunction } from "express";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "umadeb_session";
const SESSION_DAYS = 30;

export const ROLES = ["admin", "secretario", "lider", "eventos"] as const;
export type Role = (typeof ROLES)[number];
export type AuthUser = { id: number; nome: string; login: string; role: Role; ativo: number };
type DbRow = RowDataPacket & Record<string, any>;

let pool: Pool | null = null;
function getAuthPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
    pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 5, waitForConnections: true, charset: "utf8mb4" });
  }
  return pool;
}

export async function ensureAuthSchema() {
  const db = getAuthPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT NOT NULL AUTO_INCREMENT,
      nome VARCHAR(255) NOT NULL,
      login VARCHAR(120) NOT NULL,
      senha_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'secretario', 'lider', 'eventos') NOT NULL DEFAULT 'eventos',
      ativo TINYINT(1) NOT NULL DEFAULT 1,
      criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY usuarios_login_unico (login)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS sessoes (
      id BIGINT NOT NULL AUTO_INCREMENT,
      usuario_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expira_em DATETIME NOT NULL,
      criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY sessoes_token_unico (token_hash),
      INDEX sessoes_usuario_idx (usuario_id),
      CONSTRAINT sessoes_usuario_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// SHA-256 is used only for opaque session tokens; the raw token stays in the browser cookie.
import { createHash } from "node:crypto";
function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [, salt, expectedHex] = encoded.split("$");
  if (!salt || !expectedHex) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function readCookie(req: Request, name: string) {
  const header = req.headers.cookie || "";
  const part = header.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}

function setSessionCookie(res: Response, token: string) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60 * 1000;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${Math.floor(maxAge / 1000)}; Path=/; HttpOnly; SameSite=Lax${secure}`);
}

function clearSessionCookie(res: Response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`);
}

export async function getCurrentUser(req: Request) {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const [rows] = await getAuthPool().execute<DbRow[]>(
    `SELECT u.id, u.nome, u.login, u.role, u.ativo FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token_hash = ? AND s.expira_em > NOW() AND u.ativo = 1 LIMIT 1`,
    [hashSessionToken(token)],
  );
  return rows[0] ? ({ id: rows[0].id, nome: rows[0].nome, login: rows[0].login, role: rows[0].role, ativo: rows[0].ativo } satisfies AuthUser) : null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  getCurrentUser(req).then((user) => {
    if (!user) { res.status(401).json({ erro: "Login necessário" }); return; }
    res.locals.user = user;
    next();
  }).catch((error) => { console.error("[Auth]", error); res.status(500).json({ erro: "Erro ao validar sessão" }); });
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (!roles.includes(res.locals.user.role)) { res.status(403).json({ erro: "Você não tem permissão para esta ação" }); return; }
      next();
    });
  };
}

export function registerAuthRoutes(app: Express) {
  app.get("/api/auth/me", (req, res) => {
    getCurrentUser(req).then((user) => res.json({ user })).catch(() => res.status(500).json({ erro: "Erro ao consultar sessão" }));
  });

  app.post("/api/auth/login", async (req, res) => {
    const login = String(req.body.login || "").trim().toLowerCase();
    const senha = String(req.body.senha || "");
    if (!login || !senha) { res.status(400).json({ erro: "Informe login e senha" }); return; }
    const [rows] = await getAuthPool().execute<DbRow[]>("SELECT * FROM usuarios WHERE login = ? AND ativo = 1 LIMIT 1", [login]);
    if (!rows[0] || !(await verifyPassword(senha, rows[0].senha_hash))) { res.status(401).json({ erro: "Login ou senha inválidos" }); return; }
    const token = randomBytes(32).toString("hex");
    const expira = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await getAuthPool().execute("INSERT INTO sessoes (usuario_id, token_hash, expira_em) VALUES (?, ?, ?)", [rows[0].id, hashSessionToken(token), expira]);
    setSessionCookie(res, token);
    res.json({ user: { id: rows[0].id, nome: rows[0].nome, login: rows[0].login, role: rows[0].role, ativo: rows[0].ativo } });
  });

  app.post("/api/auth/logout", async (req, res) => {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) await getAuthPool().execute("DELETE FROM sessoes WHERE token_hash = ?", [hashSessionToken(token)]);
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get("/api/auth/usuarios", requireRoles("admin"), async (_req, res) => {
    const [rows] = await getAuthPool().query<DbRow[]>("SELECT id, nome, login, role, ativo, criado_em, atualizado_em FROM usuarios ORDER BY nome");
    res.json(rows);
  });

  app.post("/api/auth/usuarios", requireRoles("admin"), async (req, res) => {
    const nome = String(req.body.nome || "").trim();
    const login = String(req.body.login || "").trim().toLowerCase();
    const senha = String(req.body.senha || "");
    const role = String(req.body.role || "eventos") as Role;
    if (!nome || !login || senha.length < 8 || !ROLES.includes(role)) { res.status(400).json({ erro: "Nome, login, senha de 8 caracteres e nível válido são obrigatórios" }); return; }
    try {
      const passwordHash = await hashPassword(senha);
      const [result] = await getAuthPool().execute<ResultSetHeader>("INSERT INTO usuarios (nome, login, senha_hash, role) VALUES (?, ?, ?, ?)", [nome, login, passwordHash, role]);
      res.status(201).json({ id: result.insertId, mensagem: "Usuário criado com sucesso" });
    } catch (error: any) {
      if (error?.code === "ER_DUP_ENTRY") { res.status(409).json({ erro: "Este login já está cadastrado" }); return; }
      throw error;
    }
  });

  app.patch("/api/auth/usuarios/:id", requireRoles("admin"), async (req, res) => {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (req.body.nome !== undefined) { fields.push("nome = ?"); values.push(String(req.body.nome).trim()); }
    if (req.body.role !== undefined && ROLES.includes(req.body.role)) { fields.push("role = ?"); values.push(req.body.role); }
    if (req.body.ativo !== undefined) { fields.push("ativo = ?"); values.push(req.body.ativo ? 1 : 0); }
    if (req.body.senha) { fields.push("senha_hash = ?"); values.push(await hashPassword(String(req.body.senha))); }
    if (!fields.length) { res.status(400).json({ erro: "Nenhuma alteração informada" }); return; }
    values.push(req.params.id);
    await getAuthPool().execute(`UPDATE usuarios SET ${fields.join(", ")} WHERE id = ?`, values);
    res.json({ mensagem: "Usuário atualizado com sucesso" });
  });
}

export async function ensureInitialAdmin() {
  const login = process.env.ADMIN_LOGIN?.trim().toLowerCase();
  const senha = process.env.ADMIN_PASSWORD;
  const nome = process.env.ADMIN_NAME?.trim() || "Administrador";
  if (!login || !senha) return;
  const [rows] = await getAuthPool().execute<DbRow[]>("SELECT id FROM usuarios WHERE login = ? LIMIT 1", [login]);
  if (!rows[0]) {
    await getAuthPool().execute("INSERT INTO usuarios (nome, login, senha_hash, role) VALUES (?, ?, ?, 'admin')", [nome, login, await hashPassword(senha)]);
    console.log(`[Auth] Usuário administrador inicial criado: ${login}`);
  }
}
