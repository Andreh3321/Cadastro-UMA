const express = require("express");

const db = require("../database/database");

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

module.exports = router;