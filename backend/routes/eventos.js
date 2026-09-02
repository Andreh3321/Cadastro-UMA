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

/*
|--------------------------------------------------------------------------
| GERAR PROGRAMAÇÃO PADRÃO
|--------------------------------------------------------------------------
|
| Gera os eventos fixos dos próximos 45 dias.
|
| Domingo:
| - EBD
| - Ensaio local
| - Culto de domingo
|
| Segunda:
| - Culto das irmãs
|
| Terça:
| - Culto de doutrina
|
| Quinta:
| - Culto de quinta-feira
|
| Terceiro domingo:
| - Santa Ceia
|
| Quarto domingo:
| - Não possui Ensaio local
|--------------------------------------------------------------------------
*/

router.post("/gerar-programacao", (req, res) => {

    const quantidadeDias = 45;

    const eventosCriados = [];

    const inserirEvento = db.prepare(`
        INSERT INTO eventos (
            nome,
            tipo,
            data,
            horario,
            local,
            descricao
        )

        VALUES (?, ?, ?, ?, ?, ?)
    `);


    /*
    |--------------------------------------------------------------------------
    | Retorna YYYY-MM-DD
    |--------------------------------------------------------------------------
    */

    function formatarData(data) {

        const ano =
            data.getFullYear();

        const mes =
            String(
                data.getMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                data.getDate()
            ).padStart(2, "0");


        return `${ano}-${mes}-${dia}`;
    }


    /*
    |--------------------------------------------------------------------------
    | Descobre se o domingo é o 3º ou 4º do mês
    |--------------------------------------------------------------------------
    */

    function numeroDoDomingo(data) {

        return Math.ceil(
            data.getDate() / 7
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Verifica se evento já existe
    |--------------------------------------------------------------------------
    */

    const eventoExiste = db.prepare(`
        SELECT id

        FROM eventos

        WHERE data = ?
        AND tipo = ?
        AND nome = ?

        LIMIT 1
    `);


    /*
    |--------------------------------------------------------------------------
    | Lista de eventos
    |--------------------------------------------------------------------------
    */

    function adicionarEvento({
        nome,
        tipo,
        data,
        descricao
    }) {

        const dataISO =
            formatarData(data);


        const existente =
            eventoExiste.get(
                dataISO,
                tipo,
                nome
            );


        if (existente) {
            return;
        }


        const resultado =
            inserirEvento.run(
                nome,
                tipo,
                dataISO,
                null,
                null,
                descricao || "Evento da programação padrão"
            );


        eventosCriados.push({
            id: resultado.lastInsertRowid,
            nome,
            tipo,
            data: dataISO
        });

    }


    /*
    |--------------------------------------------------------------------------
    | TRANSAÇÃO
    |--------------------------------------------------------------------------
    */

    const gerar = db.transaction(() => {

        const hoje =
            new Date();

        hoje.setHours(0, 0, 0, 0);


        for (
            let i = 0;
            i < quantidadeDias;
            i++
        ) {

            const data =
                new Date(hoje);

            data.setDate(
                hoje.getDate() + i
            );


            /*
            |--------------------------------------------------------------------------
            | 0 = Domingo
            | 1 = Segunda
            | 2 = Terça
            | 4 = Quinta
            |--------------------------------------------------------------------------
            */

            const diaSemana =
                data.getDay();


            if (diaSemana === 0) {

                /*
                |--------------------------------------------------------------------------
                | DOMINGO
                |--------------------------------------------------------------------------
                */

                adicionarEvento({
                    nome: "EBD",
                    tipo: "EBD",
                    data
                });


                /*
                |--------------------------------------------------------------------------
                | ENSAIO
                |--------------------------------------------------------------------------
                | O quarto domingo não possui ensaio.
                |--------------------------------------------------------------------------
                */

                const numeroDomingo =
                    numeroDoDomingo(data);


                if (
                    numeroDomingo !== 4
                ) {

                    adicionarEvento({
                        nome: "Ensaio local",
                        tipo: "Ensaio local",
                        data
                    });

                }

                /*
                |--------------------------------------------------------------------------
                | CULTO / SANTA CEIA
                |--------------------------------------------------------------------------
                | No terceiro domingo a Santa Ceia substitui o culto normal.
                |--------------------------------------------------------------------------
                */

                if (numeroDomingo == 3) {
                    adicionarEvento({
                        nome: "Santa Ceia",
                        tipo: "Santa Ceia",
                        data
                    })
                } else {
                    adicionarEvento({
                        nome: "Culto de domingo",
                        tipo: "Culto de domingo",
                        data
                    });

                }

            }


            /*
            |--------------------------------------------------------------------------
            | SEGUNDA
            |--------------------------------------------------------------------------
            */

            if (diaSemana === 1) {

                adicionarEvento({
                    nome: "Culto das irmãs",
                    tipo: "Culto das irmãs",
                    data
                });

            }


            /*
            |--------------------------------------------------------------------------
            | TERÇA
            |--------------------------------------------------------------------------
            */

            if (diaSemana === 2) {

                adicionarEvento({
                    nome: "Culto de doutrina",
                    tipo: "Culto de doutrina",
                    data
                });

            }


            /*
            |--------------------------------------------------------------------------
            | QUINTA
            |--------------------------------------------------------------------------
            */

            if (diaSemana === 4) {

                adicionarEvento({
                    nome: "Culto de quinta-feira",
                    tipo: "Culto de quinta-feira",
                    data
                });

            }

        }

    });


    gerar();


    res.json({

        mensagem:
            "Programação gerada com sucesso",

        criados:
            eventosCriados.length,

        eventos:
            eventosCriados

    });

});

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

/*
|--------------------------------------------------------------------------
| FINALIZAR CHAMADA
|--------------------------------------------------------------------------
| Todos os jovens que ainda não possuem registro neste evento
| serão considerados ausentes.
|--------------------------------------------------------------------------
*/

router.post("/:eventosId/finalizar-chamada", (req, res) => {
    const evento = db.prepare(`
        SELECT * FROM eventos WHERE id = ?`).get(req.params.eventosId);

    if (!evento) {

        return res.status(404).strictContentLength({
            erro: "Evento não encontrado"
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Pontos para ausência
    |--------------------------------------------------------------------------
    */

    const pontos = 0;

    /*
    |--------------------------------------------------------------------------
    | Buscar jovens ainda não marcados
    |--------------------------------------------------------------------------
    */

    const jovensNaoMarcados = db.preapare(`
        SELECT j.id FROM jovens j 
        LEFT JOIN presencas p
            ON p.jovem_id = j.id
            AND p.evento_id - ?
        WHERE p.id IS NULL
        `).all(req.params.eventoId);


    /*
    |--------------------------------------------------------------------------
    | Inserir ausências
    |--------------------------------------------------------------------------
    */

    const inserirAusente = db.prepare(`
        INSERT INTO presencas (
            jovem_id,
            evento_id,
            status,
            pontos
        )
        VALUES (?,?, 'ausente', ?)
        `);

    const transacao = db.transaction((lista) => {
        for (const jovem of lista) {

            inserirAusente.run(
                jovem.id,
                req.params.eventosId,
                pontos
            );
        }
    });

    transacao(jovensNaoMarcados);

    res.json({
        mensagem: "Chamada finalizada com sucesso",

        ausentes: jovensNaoMarcados.length
    });


});

router.delete(
    "/:eventoId/chamada/:jovemId",
    (req, res) => {

        const {
            eventoId,
            jovemId
        } = req.params;

        const resultado = db.prepare(`
        DELETE FROM presencas

        WHERE evento_id = ?
        AND jovem_id = ?
        `).run(
            eventoId,
            jovemId
        );

        if (resultado.changes == 0) {
            return res.status(404).json({
                erro: "Chamada não encontrada"
            });
        }
        res.json({
            mensagem: "Chamada desmarcada com sucesso"
        });
    });


module.exports = router;