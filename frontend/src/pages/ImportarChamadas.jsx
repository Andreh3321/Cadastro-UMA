import { useState } from "react";
import * as XLSX from "xlsx";

import { importarChamadas } from "../api";


export default function ImportarChamadas() {

    const [preview, setPreview] = useState([]);

    const [arquivo, setArquivo] = useState(null);

    const [importando, setImportando] = useState(false);

    const [resultado, setResultado] = useState(null);


    /*
    |--------------------------------------------------------------------------
    | CONVERTER DATA
    |--------------------------------------------------------------------------
    */

    function converterData(valor) {

        if (!valor) {
            return null;
        }


        if (valor instanceof Date) {

            const ano =
                valor.getFullYear();

            const mes =
                String(
                    valor.getMonth() + 1
                ).padStart(2, "0");

            const dia =
                String(
                    valor.getDate()
                ).padStart(2, "0");


            return `${ano}-${mes}-${dia}`;

        }


        const texto =
            String(valor).trim();


        if (
            /^\d{4}-\d{2}-\d{2}$/.test(
                texto
            )
        ) {

            return texto;

        }


        const partes =
            texto.split("/");


        if (partes.length === 3) {

            const dia =
                partes[0].padStart(2, "0");

            const mes =
                partes[1].padStart(2, "0");

            const ano =
                partes[2];


            return `${ano}-${mes}-${dia}`;

        }


        return null;

    }


    /*
    |--------------------------------------------------------------------------
    | LER ARQUIVO
    |--------------------------------------------------------------------------
    */

    function processarArquivo(file) {

        const leitor =
            new FileReader();


        leitor.onload = (evento) => {

            const dados =
                new Uint8Array(
                    evento.target.result
                );


            const livro =
                XLSX.read(dados, {
                    type: "array",
                    cellDates: true
                });


            const nomeAba =
                livro.SheetNames[0];


            const aba =
                livro.Sheets[nomeAba];


            const linhas =
                XLSX.utils.sheet_to_json(
                    aba,
                    {
                        defval: ""
                    }
                );


            const processadas =
                linhas.map(linha => {

                    return {

                        data:
                            converterData(
                                linha.data
                            ),

                        tipo:
                            String(
                                linha.tipo || ""
                            ).trim(),

                        nome:
                            String(
                                linha.nome || ""
                            ).trim(),

                        presentes:
                            String(
                                linha.presentes || ""
                            ).trim(),

                        justificados:
                            String(
                                linha.justificados || ""
                            ).trim()

                    };

                });


            setPreview(processadas);

        };


        leitor.readAsArrayBuffer(file);

    }


    /*
    |--------------------------------------------------------------------------
    | SELECIONAR ARQUIVO
    |--------------------------------------------------------------------------
    */

    function selecionarArquivo(evento) {

        const file =
            evento.target.files[0];


        if (!file) {
            return;
        }


        setArquivo(file);

        setResultado(null);

        processarArquivo(file);

    }


    /*
    |--------------------------------------------------------------------------
    | IMPORTAR
    |--------------------------------------------------------------------------
    */

    async function confirmarImportacao() {

        if (preview.length === 0) {

            alert(
                "Nenhum registro encontrado."
            );

            return;

        }


        const confirmar =
            window.confirm(
                `Importar ${preview.length} evento(s)?`
            );


        if (!confirmar) {
            return;
        }


        setImportando(true);


        try {

            const resposta =
                await importarChamadas(
                    preview
                );


            setResultado(resposta);

        }

        catch (erro) {

            console.error(erro);

            alert(
                "Erro ao importar chamadas."
            );

        }

        finally {

            setImportando(false);

        }

    }


    return (

        <main className="pagina">

            <div className="pagina-header">

                <div>

                    <span className="eyebrow">
                        IMPORTAÇÃO
                    </span>

                    <h1>
                        Importar Chamadas
                    </h1>

                    <p>
                        Importe eventos e presenças
                        através de uma planilha Excel.
                    </p>

                </div>

            </div>


            <section className="card-importacao">

                <h2>
                    1. Selecione o Excel
                </h2>


                <p>
                    Utilize as colunas:
                    <strong>
                        {" data, tipo, nome, presentes, justificados "}
                    </strong>
                </p>


                <label className="btn-primary">

                    Selecionar Excel

                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={selecionarArquivo}
                        style={{
                            display: "none"
                        }}
                    />

                </label>


                {arquivo && (

                    <p>
                        Arquivo:
                        {" "}
                        <strong>
                            {arquivo.name}
                        </strong>
                    </p>

                )}

            </section>


            {preview.length > 0 && (

                <section className="card-importacao">

                    <h2>
                        2. Conferir dados
                    </h2>


                    <div className="tabela-importacao-wrapper">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Data
                                    </th>

                                    <th>
                                        Tipo
                                    </th>

                                    <th>
                                        Nome
                                    </th>

                                    <th>
                                        Presentes
                                    </th>

                                    <th>
                                        Justificados
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {preview.map(
                                    (evento, index) => (

                                        <tr key={index}>

                                            <td>
                                                {
                                                    evento.data
                                                }
                                            </td>

                                            <td>
                                                {
                                                    evento.tipo
                                                }
                                            </td>

                                            <td>
                                                {
                                                    evento.nome
                                                }
                                            </td>

                                            <td>
                                                {
                                                    evento.presentes
                                                }
                                            </td>

                                            <td>
                                                {
                                                    evento.justificados
                                                }
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>


                    <button
                        className="btn-primary"
                        onClick={
                            confirmarImportacao
                        }
                        disabled={
                            importando
                        }
                    >

                        {importando
                            ? "Importando..."
                            : "Importar chamadas"
                        }

                    </button>

                </section>

            )}


            {resultado && (

                <section className="card-importacao">

                    <h2>
                        Resultado
                    </h2>

                    <p>
                        Eventos criados:
                        {" "}
                        <strong>
                            {
                                resultado.eventosCriados
                            }
                        </strong>
                    </p>

                    <p>
                        Presenças processadas:
                        {" "}
                        <strong>
                            {
                                resultado.presencasCriadas
                            }
                        </strong>
                    </p>


                    {resultado.falhas?.length > 0 && (

                        <>

                            <h3>
                                Problemas encontrados
                            </h3>

                            <ul>

                                {
                                    resultado.falhas.map(
                                        (
                                            falha,
                                            index
                                        ) => (

                                            <li key={index}>

                                                Linha{" "}
                                                {
                                                    falha.linha
                                                }

                                                {" — "}

                                                {
                                                    falha.nome ||
                                                    falha.motivo
                                                }

                                                {" — "}

                                                {
                                                    falha.motivo
                                                }

                                            </li>

                                        )
                                    )
                                }

                            </ul>

                        </>

                    )}

                </section>

            )}

        </main>

    );

}