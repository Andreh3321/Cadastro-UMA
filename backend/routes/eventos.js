const express = require("express");

const {
    db,
    PONTUACAO
} = require("../database/database");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| LISTAR EVENTOS
|--------------------------------------------------------------------------
*/

router.get("/", (req, res) => {

    const eventos = db.prepare(`
        SELECT *
        FROM eventos
        ORDER BY data DESC
    `).all();

    res.json(eventos);
});

/*
|--------------------------------------------------------------------------
| BUSCAR EVENTO + CHAMADA
|--------------------------------------------------------------------------
*/

router.get("/:id", (req, res) => {

    const evento = db.prepare(`
        SELECT *
        FROM eventos
        WHERE id = ?
    `).get(req.params.id);

    if (!evento) {

        return res.status(404).json({
            erro: "Evento não encontrado"
        });

    }

    const jovens = db.prepare(`
        SELECT
            j.id,
            j.nome,
            j.foto,
            p.status,
            p.pontos

        FROM jovens j

        LEFT JOIN presencas p
            ON p.jovem_id = j.id
            AND p.evento_id = ?

        ORDER BY j.nome COLLATE NOCASE ASC

    `).all(req.params.id);

    res.json({
        evento,
        jovens
    });
});

/*
|--------------------------------------------------------------------------
| CADASTRAR EVENTO
|--------------------------------------------------------------------------
*/

router.post("/", (req, res) => {

    const {
        nome,
        tipo,
        data,
        horario,
        local,
        descricao
    } = req.body;

    if (!nome || !tipo || !data) {

        return res.status(400).json({
            erro: "Nome, tipo e data são obrigatórios"
        });

    }

    if (!PONTUACAO[tipo]) {

        return res.status(400).json({
            erro: "Tipo de evento inválido"
        });

    }

    const resultado = db.prepare(`
        INSERT INTO eventos (
            nome,
            tipo,
            data,
            horario,
            local,
            descricao
        )

        VALUES (?, ?, ?, ?, ?, ?)

    `).run(
        nome,
        tipo,
        data,
        horario,
        local,
        descricao
    );

    res.status(201).json({
        id: resultado.lastInsertRowid,
        mensagem: "Evento criado com sucesso"
    });
});

/*
|--------------------------------------------------------------------------
| EDITAR EVENTO
|--------------------------------------------------------------------------
*/

router.put("/:id", (req, res) => {

    const {
        nome,
        tipo,
        data,
        horario,
        local,
        descricao
    } = req.body;

    if (!nome || !tipo || !data) {

        return res.status(400).json({
            erro: "Nome, tipo e data são obrigatórios"
        });

    }

    if (!PONTUACAO[tipo]) {

        return res.status(400).json({
            erro: "Tipo de evento inválido"
        });

    }

    const evento = db.prepare(`
        SELECT *
        FROM eventos
        WHERE id = ?
    `).get(req.params.id);

    if (!evento) {

        return res.status(404).json({
            erro: "Evento não encontrado"
        });

    }

    db.prepare(`
        UPDATE eventos

        SET
            nome = ?,
            tipo = ?,
            data = ?,
            horario = ?,
            local = ?,
            descricao = ?

        WHERE id = ?

    `).run(
        nome,
        tipo,
        data,
        horario,
        local,
        descricao,
        req.params.id
    );

    /*
    |--------------------------------------------------------------------------
    | Atualiza os pontos das chamadas caso o tipo do evento tenha mudado
    |--------------------------------------------------------------------------
    */

    db.prepare(`
        UPDATE presencas

        SET pontos =
            CASE
                WHEN status = 'presente'
                    THEN ?

                WHEN status = 'justificado'
                    THEN ?

                WHEN status = 'ausente'
                    THEN 0
            END

        WHERE evento_id = ?

    `).run(
        PONTUACAO[tipo],
        PONTUACAO[tipo],
        req.params.id
    );

    res.json({
        mensagem: "Evento atualizado com sucesso"
    });
});

/*
|--------------------------------------------------------------------------
| EXCLUIR EVENTO
|--------------------------------------------------------------------------
*/

router.delete("/:id", (req, res) => {

    const evento = db.prepare(`
        SELECT *
        FROM eventos
        WHERE id = ?
    `).get(req.params.id);

    if (!evento) {

        return res.status(404).json({
            erro: "Evento não encontrado"
        });

    }

    db.prepare(`
        DELETE FROM eventos
        WHERE id = ?
    `).run(req.params.id);

    res.json({
        mensagem: "Evento excluído com sucesso"
    });
});

/*
|--------------------------------------------------------------------------
| REGISTRAR CHAMADA
|--------------------------------------------------------------------------
*/

router.post("/:eventoId/chamada", (req, res) => {

    const {
        jovem_id,
        status
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validar status
    |--------------------------------------------------------------------------
    */

    if (
        ![
            "presente",
            "ausente",
            "justificado"
        ].includes(status)
    ) {

        return res.status(400).json({
            erro: "Status inválido"
        });

    }

    /*
    |--------------------------------------------------------------------------
    | Buscar evento
    |--------------------------------------------------------------------------
    */

    const evento = db.prepare(`
        SELECT *
        FROM eventos
        WHERE id = ?
    `).get(req.params.eventoId);

    if (!evento) {

        return res.status(404).json({
            erro: "Evento não encontrado"
        });

    }

    /*
    |--------------------------------------------------------------------------
    | Verificar jovem
    |--------------------------------------------------------------------------
    */

    const jovem = db.prepare(`
        SELECT *
        FROM jovens
        WHERE id = ?
    `).get(jovem_id);

    if (!jovem) {

        return res.status(404).json({
            erro: "Jovem não encontrado"
        });

    }

    /*
    |--------------------------------------------------------------------------
    | CALCULAR PONTOS
    |--------------------------------------------------------------------------
    |
    | Presente    = pontuação do evento
    | Justificado = pontuação do evento
    | Ausente     = 0
    |
    */

    let pontos = 0;

    if (
        status === "presente" ||
        status === "justificado"
    ) {

        pontos = PONTUACAO[evento.tipo];

    }

    /*
    |--------------------------------------------------------------------------
    | Verificar se já existe chamada
    |--------------------------------------------------------------------------
    */

    const existente = db.prepare(`
        SELECT id
        FROM presencas

        WHERE jovem_id = ?
        AND evento_id = ?

    `).get(
        jovem_id,
        req.params.eventoId
    );

    /*
    |--------------------------------------------------------------------------
    | ATUALIZAR CHAMADA
    |--------------------------------------------------------------------------
    */

    if (existente) {

        db.prepare(`
            UPDATE presencas

            SET
                status = ?,
                pontos = ?

            WHERE id = ?

        `).run(
            status,
            pontos,
            existente.id
        );

    }

    /*
    |--------------------------------------------------------------------------
    | NOVA CHAMADA
    |--------------------------------------------------------------------------
    */

    else {

        db.prepare(`
            INSERT INTO presencas (
                jovem_id,
                evento_id,
                status,
                pontos
            )

            VALUES (?, ?, ?, ?)

        `).run(
            jovem_id,
            req.params.eventoId,
            status,
            pontos
        );

    }

    res.json({
        mensagem: "Chamada registrada com sucesso",
        status,
        pontos
    });
});

module.exports = router;