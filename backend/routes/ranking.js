const express = require("express");

const { db } = require("../database/database");

const router = express.Router();

router.get("/", (req, res) => {

    const ranking = db.prepare(`
        SELECT
            j.id,
            j.nome,
            j.foto,
            COALESCE(SUM(p.pontos), 0) AS pontos,
            COUNT(
                CASE
                    WHEN p.status = 'presente'
                    THEN 1
                END
            ) AS presencas,
            COUNT(
                CASE
                    WHEN p.status = 'justificado'
                    THEN 1
                END
            ) AS justificadas,
            COUNT(
                CASE
                    WHEN p.status = 'ausente'
                    THEN 1
                END
            ) AS ausencias

        FROM jovens j

        LEFT JOIN presencas p
            ON p.jovem_id = j.id

        GROUP BY j.id

        ORDER BY pontos DESC, j.nome COLLATE NOCASE ASC
    `).all();

    res.json(ranking);
});

/*
|--------------------------------------------------------------------------
| REGISTRAR CHAMADA EM LOTE (todos os jovens de uma vez)
|--------------------------------------------------------------------------
*/

router.post("/:eventoId/chamada/todos", (req, res) => {

    const { status } = req.body;

    if (
        !["presente", "ausente", "justificado"].includes(status)
    ) {
        return res.status(400).json({
            erro: "Status inválido"
        });
    }

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

    const jovens = db.prepare(`
        SELECT id
        FROM jovens
    `).all();

    const pontos = status === "ausente" ? 0 : PONTUACAO[evento.tipo];

    const upsert = db.prepare(`
        INSERT INTO presencas (jovem_id, evento_id, status, pontos)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(jovem_id, evento_id)
        DO UPDATE SET status = excluded.status, pontos = excluded.pontos
    `);

    const transacao = db.transaction((lista) => {
        for (const jovem of lista) {
            upsert.run(jovem.id, req.params.eventoId, status, pontos);
        }
    });

    transacao(jovens);

    res.json({
        mensagem: "Chamada em lote registrada com sucesso"
    });
});

module.exports = router;