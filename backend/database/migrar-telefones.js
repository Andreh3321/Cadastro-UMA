const { db } = require("./database");
const { formatarTelefone } = require("../utils/telefone");

const jovens = db.prepare(`
    SELECT id, telefone, telefone_emergencia
    FROM jovens
`).all();

const atualizar = db.prepare(`
    UPDATE jovens
    SET telefone = ?, telefone_emergencia = ?
    WHERE id = ?
`);

const transacao = db.transaction((lista) => {

    let atualizados = 0;

    lista.forEach(jovem => {

        const telefoneNovo =
            formatarTelefone(jovem.telefone);

        const emergenciaNovo =
            formatarTelefone(jovem.telefone_emergencia);

        if (
            telefoneNovo !== jovem.telefone ||
            emergenciaNovo !== jovem.telefone_emergencia
        ) {

            atualizar.run(
                telefoneNovo,
                emergenciaNovo,
                jovem.id
            );

            atualizados++;

        }

    });

    console.log(`${atualizados} jovem(ns) atualizado(s).`);

});

transacao(jovens);