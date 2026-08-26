const express = require("express");

const {
    db,
    PONTUACAO
} = require("../database/database");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| NORMALIZAR TEXTO
|--------------------------------------------------------------------------
| Remove diferenças de maiúsculas, acentos e espaços.
|--------------------------------------------------------------------------
*/

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}


/*
|--------------------------------------------------------------------------
| CONVERTER LISTA DO EXCEL
|--------------------------------------------------------------------------
| Exemplo:
|
| "João; Maria; Pedro"
|
| vira:
|
| ["João", "Maria", "Pedro"]
|--------------------------------------------------------------------------
*/

function converterLista(valor) {

    if (!valor) {
        return [];
    }

    return String(valor)
        .split(";")
        .map(nome => nome.trim())
        .filter(Boolean);

}


/*
|--------------------------------------------------------------------------
| IMPORTAR CHAMADAS
|--------------------------------------------------------------------------
*/

router.post("/chamadas", (req, res) => {

    const { eventos } = req.body;

    if (!Array.isArray(eventos) || eventos.length === 0) {

        return res.status(400).json({
            erro: "Nenhum evento foi enviado"
        });

    }


    /*
    |--------------------------------------------------------------------------
    | Buscar todos os jovens uma única vez
    |--------------------------------------------------------------------------
    */

    const jovens = db.prepare(`
        SELECT id, nome
        FROM jovens
    `).all();


    /*
    |--------------------------------------------------------------------------
    | Criar mapa para busca rápida
    |--------------------------------------------------------------------------
    */

    const mapaJovens = new Map();

    jovens.forEach(jovem => {

        mapaJovens.set(
            normalizarTexto(jovem.nome),
            jovem
        );

    });


    const resultado = {

        eventosCriados: 0,

        presencasCriadas: 0,

        falhas: []

    };


    /*
    |--------------------------------------------------------------------------
    | Statements
    |--------------------------------------------------------------------------
    */

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


    const inserirPresenca = db.prepare(`
        INSERT INTO presencas (
            jovem_id,
            evento_id,
            status,
            pontos
        )

        VALUES (?, ?, ?, ?)

        ON CONFLICT(jovem_id, evento_id)

        DO UPDATE SET
            status = excluded.status,
            pontos = excluded.pontos
    `);


    /*
    |--------------------------------------------------------------------------
    | TRANSAÇÃO
    |--------------------------------------------------------------------------
    */

    const transacao = db.transaction((lista) => {

        lista.forEach((item, indice) => {

            try {

                if (!item.data) {

                    throw new Error(
                        "Data não informada"
                    );

                }


                if (!item.tipo) {

                    throw new Error(
                        "Tipo do evento não informado"
                    );

                }


                if (!PONTUACAO[item.tipo]) {

                    throw new Error(
                        `Tipo de evento inválido: ${item.tipo}`
                    );

                }


                /*
                |--------------------------------------------------------------------------
                | Criar evento
                |--------------------------------------------------------------------------
                */

                const evento = inserirEvento.run(

                    item.nome || item.tipo,

                    item.tipo,

                    item.data,

                    item.horario || null,

                    item.local || null,

                    item.descricao || null

                );


                const eventoId =
                    evento.lastInsertRowid;


                resultado.eventosCriados++;


                /*
                |--------------------------------------------------------------------------
                | Presentes
                |--------------------------------------------------------------------------
                */

                const presentes =
                    converterLista(item.presentes);


                presentes.forEach(nome => {

                    const jovem =
                        mapaJovens.get(
                            normalizarTexto(nome)
                        );


                    if (!jovem) {

                        resultado.falhas.push({

                            linha: indice + 2,

                            nome,

                            motivo:
                                "Jovem não encontrado"

                        });

                        return;

                    }


                    inserirPresenca.run(

                        jovem.id,

                        eventoId,

                        "presente",

                        PONTUACAO[item.tipo]

                    );


                    resultado.presencasCriadas++;

                });


                /*
                |--------------------------------------------------------------------------
                | Justificados
                |--------------------------------------------------------------------------
                */

                const justificados =
                    converterLista(item.justificados);


                justificados.forEach(nome => {

                    const jovem =
                        mapaJovens.get(
                            normalizarTexto(nome)
                        );


                    if (!jovem) {

                        resultado.falhas.push({

                            linha: indice + 2,

                            nome,

                            motivo:
                                "Jovem não encontrado"

                        });

                        return;

                    }


                    inserirPresenca.run(

                        jovem.id,

                        eventoId,

                        "justificado",

                        PONTUACAO[item.tipo]

                    );


                    resultado.presencasCriadas++;

                });

            }

            catch (erro) {

                resultado.falhas.push({

                    linha: indice + 2,

                    motivo: erro.message

                });

            }

        });

    });


    transacao(eventos);


    res.json({

        mensagem:
            "Importação concluída",

        ...resultado

    });

});


module.exports = router;