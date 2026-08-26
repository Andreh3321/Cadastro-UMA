const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { db } = require("../database/database");

const router = express.Router();

const uploadPath = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const extensao = path.extname(file.originalname);

        const nomeArquivo =
            `${Date.now()}-${Math.round(Math.random() * 1E9)}${extensao}`;

        cb(null, nomeArquivo);
    }
});

const upload = multer({
    storage
});

// LISTAR JOVENS
router.get("/", (req, res) => {

    const jovens = db.prepare(`
        SELECT *
        FROM jovens
        ORDER BY nome COLLATE NOCASE ASC
    `).all();

    res.json(jovens);
});

// BUSCAR JOVEM
router.get("/:id", (req, res) => {

    const jovem = db.prepare(`
        SELECT *
        FROM jovens
        WHERE id = ?
    `).get(req.params.id);

    if (!jovem) {
        return res.status(404).json({
            erro: "Jovem não encontrado"
        });
    }

    res.json(jovem);
});

// CADASTRAR
router.post("/", upload.single("foto"), (req, res) => {

    const {
        nome,
        data_nascimento,
        telefone,
        telefone_emergencia,
        endereco,
        data_batismo,
        instagram
    } = req.body;

    if (!nome || !data_nascimento) {
        return res.status(400).json({
            erro: "Nome e data de nascimento são obrigatórios"
        });
    }

    const foto = req.file
        ? `/uploads/${req.file.filename}`
        : null;

    const resultado = db.prepare(`
        INSERT INTO jovens (
            nome,
            data_nascimento,
            telefone,
            telefone_emergencia,
            endereco,
            data_batismo,
            instagram,
            foto
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        nome,
        data_nascimento,
        telefone,
        telefone_emergencia,
        endereco,
        data_batismo || null,
        instagram,
        foto
    );

    res.status(201).json({
        id: resultado.lastInsertRowid,
        mensagem: "Jovem cadastrado com sucesso"
    });
});

// EDITAR
router.put("/:id", upload.single("foto"), (req, res) => {

    const jovem = db.prepare(`
        SELECT *
        FROM jovens
        WHERE id = ?
    `).get(req.params.id);

    if (!jovem) {
        return res.status(404).json({
            erro: "Jovem não encontrado"
        });
    }

    const {
        nome,
        data_nascimento,
        telefone,
        telefone_emergencia,
        endereco,
        data_batismo,
        instagram
    } = req.body;

    let foto = jovem.foto;

    if (req.file) {
        foto = `/uploads/${req.file.filename}`;
    }

    db.prepare(`
        UPDATE jovens
        SET
            nome = ?,
            data_nascimento = ?,
            telefone = ?,
            telefone_emergencia = ?,
            endereco = ?,
            data_batismo = ?,
            instagram = ?,
            foto = ?
        WHERE id = ?
    `).run(
        nome,
        data_nascimento,
        telefone,
        telefone_emergencia,
        endereco,
        data_batismo || null,
        instagram,
        foto,
        req.params.id
    );

    res.json({
        mensagem: "Jovem atualizado com sucesso"
    });
});

// EXCLUIR
router.delete("/:id", (req, res) => {

    const jovem = db.prepare(`
        SELECT *
        FROM jovens
        WHERE id = ?
    `).get(req.params.id);

    if (!jovem) {
        return res.status(404).json({
            erro: "Jovem não encontrado"
        });
    }

    db.prepare(`
        DELETE FROM jovens
        WHERE id = ?
    `).run(req.params.id);

    res.json({
        mensagem: "Jovem excluído com sucesso"
    });
});

router.post("/importar", (req, res) => {

    const { jovens } = req.body;

    if (!Array.isArray(jovens) || jovens.length == 0) {
        return res.status(400).json({
            erro: "Nenhum jovem para importar"
        });
    };

    const inserir = db.prepare(`
        INSERT INTO jovens (
        nome,
        data_nascimento,
        telefone,
        telefone_emergencia,
        endereco,
        data_batismo,
        instagram,
        foto
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        `);

    const resultado = {
        importados: 0,
        falhas: []
    };

    const transacao = db.transaction((lista) => {

        lista.forEach((jovem, index) => {
            if (!jovem.nome || !jovem.data_nascimento) {
                resultado.falhas.push({
                    linha: index + 1,
                    motivo: "Nome ou data de nascimento ausente",
                    nome: jovem.nome || "(sem nome)"
                });
                return;
            }

            try {
                inserir.run(
                    jovem.nome,
                    jovem.data_nascimento,
                    jovem.telefone || null,
                    jovem.telefone_emergencia || null,
                    jovem.endereco || null,
                    jovem.data_batismo || null,
                    jovem.instagram || null,
                );
                resultado.importados++;
            } catch (erro) {
                resultado.falhas.push({
                    linha: index + 1,
                    motivo: erro.message,
                    nome: jovem.nome
                });
            }
        });
    });
    transacao(jovens);

    res.json(resultado);
});



module.exports = router;