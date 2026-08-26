import { useEffect, useState } from "react";

import JovemCard from "../components/JovemCard";
import JovemModal from "../components/JovemModal";
import * as XLSX from "xlsx";

import {
    buscarJovens,
    cadastrarJovem,
    editarJovem,
    excluirJovem,
    importarJovens
} from "../api";

export default function Jovens() {

    const [jovens, setJovens] = useState([]);

    const [selecionado, setSelecionado] = useState(null);

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [editando, setEditando] = useState(null);

    const [busca, setBusca] = useState("");

    const [previewImportacao, setPreviewImportacao] = useState(null);
    const [importando, setImportando] = useState(null);

    async function carregar() {

        const dados = await buscarJovens();

        setJovens(dados);
    }

    useEffect(() => {
        carregar();
    }, []);

    function novoJovem() {

        setEditando(null);

        setMostrarFormulario(true);
    }

    function editar(jovem) {

        setSelecionado(null);

        setEditando(jovem);

        setMostrarFormulario(true);
    }

    async function excluir(id) {

        const confirmar = window.confirm(
            "Deseja realmente excluir este jovem?"
        );

        if (!confirmar) return;

        await excluirJovem(id);

        setSelecionado(null);

        carregar();
    }

    async function salvar(e) {

        e.preventDefault();

        const formData = new FormData(e.target);

        if (editando) {

            await editarJovem(
                editando.id,
                formData
            );

        } else {

            await cadastrarJovem(formData);

        }

        setMostrarFormulario(false);

        setEditando(null);

        carregar();
    }

    const MAPA_COLUNAS = {
        "nome": "nome",
        "nome completo": "nome"
        ,
        "data de nascimento": "data_nascimento",
        "nascimento": "data_nascimento",

        "telefone": "telefone",
        "telefone de emergencia": "telefone_emergencia",

        "endereco": "endereco",

        "data de batismo": "data_batismo",
        "batismo": "data_batismo",
        "instagram": "instagram"
    };

    function normalizarTexto(texto) {
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\r\n:]/g, "")
            .toLowerCase()
            .trim();
    }

    function paraDataISO(valor) {

        if (!valor) return null;

        if (valor instanceof Date) {
            const ano = valor.getFullYear();
            const mes = String(valor.getMonth() + 1).padStart(2, "0");
            const dia = String(valor.getDate()).padStart(2, "0");
            return `${ano}-${mes}-${dia}`;
        }

        if (typeof valor === "string") {

            const texto = valor.trim();

            if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

            const match = texto.match(
                /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
            );

            if (match) {
                const [, dia, mes, ano] = match;
                return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
            }
        }

        return null;
    }

    function processarPlanilha(arquivo) {

        const leitor = new FileReader();

        leitor.onload = (evento) => {

            const dados = new Uint8Array(evento.target.result);

            const livro = XLSX.read(dados, {
                type: "array",
                cellDates: true
            });

            const aba = livro.Sheets[livro.SheetNames[0]];

            const linhasBrutas = XLSX.utils.sheet_to_json(aba, {
                defval: ""
            });

            const jovensProcessados = linhasBrutas.map((linha) => {

                const jovem = {};

                Object.keys(linha).forEach((cabecalho) => {

                    const chave = MAPA_COLUNAS[
                        normalizarTexto(cabecalho)
                    ];

                    if (!chave) return;

                    let valor = linha[cabecalho];

                    if (
                        chave === "data_nascimento" ||
                        chave === "data_batismo"
                    ) {
                        valor = paraDataISO(valor);
                    } else if (typeof valor === "string") {
                        valor = valor.trim();
                    }

                    jovem[chave] = valor;
                });

                return jovem;
            });

            const nomesExistentes = new Set(
                jovens.map(j =>
                    `${j.nome?.toLowerCase()}|${j.data_nascimento}`
                )
            );

            const validos = [];
            const invalidos = [];

            jovensProcessados.forEach((jovem, index) => {

                const chaveDuplicidade =
                    `${jovem.nome?.toLowerCase()}|${jovem.data_nascimento}`;

                const duplicado = nomesExistentes.has(chaveDuplicidade);

                if (!jovem.nome || !jovem.data_nascimento) {
                    invalidos.push({
                        linha: index + 2,
                        jovem,
                        motivo: "Nome ou data de nascimento ausente/inválida"
                    });
                } else {
                    validos.push({ ...jovem, duplicado });
                }
            });

            setPreviewImportacao({
                validos,
                invalidos
            });
        };

        leitor.readAsArrayBuffer(arquivo);
    }

    function selecionarArquivo(e) {

        const arquivo = e.target.files[0];

        if (!arquivo) return;

        processarPlanilha(arquivo);

        e.target.value = "";
    }

    async function confirmarImportacao(pularDuplicados) {

        const listaFinal = pularDuplicados
            ? previewImportacao.validos.filter(j => !j.duplicado)
            : previewImportacao.validos;

        if (listaFinal.length === 0) {
            alert("Nenhum jovem para importar.");
            return;
        }

        setImportando(true);

        const resultado = await importarJovens(listaFinal);

        setImportando(false);
        setPreviewImportacao(null);

        alert(
            `${resultado.importados} jovem(ns) importado(s) com sucesso.` +
            (resultado.falhas.length > 0
                ? `\n${resultado.falhas.length} falharam.`
                : "")
        );

        carregar();
    }

    const jovensFiltrados = jovens.filter(jovem =>
        jovem.nome
            .toLowerCase()
            .includes(busca.toLowerCase())
    );

    return (
        <main className="pagina">

            <div className="pagina-header">

                <div>
                    <span className="eyebrow">
                        MEMBROS
                    </span>

                    <h1>
                        Jovens
                    </h1>

                    <p>
                        Cadastro dos jovens da igreja
                    </p>
                </div>

                <div className="header-acoes">

                    <label className="btn-primary btn-secundario">
                        Importar Excel
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={selecionarArquivo}
                            className="input-arquivo-oculto"
                        />
                    </label>

                    <button
                        className="btn-primary"
                        onClick={novoJovem}
                    >
                        + Novo Jovem
                    </button>
                </div>

            </div>

            <div className="barra-busca">

                <input
                    type="text"
                    placeholder="Pesquisar jovem..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                />

            </div>

            <div className="jovens-grid">

                {jovensFiltrados.map(jovem => (

                    <JovemCard
                        key={jovem.id}
                        jovem={jovem}
                        onClick={() =>
                            setSelecionado(jovem)
                        }
                    />

                ))}

            </div>

            {jovensFiltrados.length === 0 && (

                <div className="vazio">
                    Nenhum jovem encontrado.
                </div>

            )}

            {selecionado && (

                <JovemModal
                    jovem={selecionado}
                    fechar={() =>
                        setSelecionado(null)
                    }
                    editar={editar}
                    excluir={excluir}
                />

            )}

            {mostrarFormulario && (

                <div className="modal-overlay">

                    <div className="modal formulario">

                        <button
                            className="fechar"
                            onClick={() =>
                                setMostrarFormulario(false)
                            }
                        >
                            ×
                        </button>

                        <h2>
                            {editando
                                ? "Editar jovem"
                                : "Cadastrar jovem"
                            }
                        </h2>

                        <form onSubmit={salvar}>

                            <label>
                                Nome completo
                                <input
                                    name="nome"
                                    required
                                    defaultValue={
                                        editando?.nome || ""
                                    }
                                />
                            </label>

                            <label>
                                Data de nascimento
                                <input
                                    type="date"
                                    name="data_nascimento"
                                    required
                                    defaultValue={
                                        editando?.data_nascimento || ""
                                    }
                                />
                            </label>

                            <label>
                                Telefone
                                <input
                                    name="telefone"
                                    defaultValue={
                                        editando?.telefone || ""
                                    }
                                />
                            </label>

                            <label>
                                Telefone de emergência
                                <input
                                    name="telefone_emergencia"
                                    defaultValue={
                                        editando?.telefone_emergencia || ""
                                    }
                                />
                            </label>

                            <label>
                                Endereço
                                <input
                                    name="endereco"
                                    defaultValue={
                                        editando?.endereco || ""
                                    }
                                />
                            </label>

                            <label>
                                Data de batismo
                                <input
                                    type="date"
                                    name="data_batismo"
                                    defaultValue={
                                        editando?.data_batismo || ""
                                    }
                                />
                            </label>

                            <label>
                                Instagram
                                <input
                                    name="instagram"
                                    placeholder="@usuario"
                                    defaultValue={
                                        editando?.instagram || ""
                                    }
                                />
                            </label>

                            <label>
                                Foto
                                <input
                                    type="file"
                                    name="foto"
                                    accept="image/*"
                                />
                            </label>

                            <button
                                className="btn-primary"
                                type="submit"
                            >
                                Salvar
                            </button>

                        </form>

                    </div>

                </div>

            )}

            {previewImportacao && (

                <div className="modal-overlay">

                    <div className="modal formulario modal-importacao">

                        <button
                            className="fechar"
                            onClick={() => setPreviewImportacao(null)}
                        >
                            ×
                        </button>

                        <h2>Importar jovens</h2>

                        <p className="subtitulo-modal">
                            {previewImportacao.validos.length} linha(s) prontas para importar
                            {previewImportacao.invalidos.length > 0 &&
                                ` • ${previewImportacao.invalidos.length} com erro (serão ignoradas)`
                            }
                        </p>

                        <div className="tabela-preview-wrapper">

                            <table className="tabela-preview">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Nascimento</th>
                                        <th>Telefone</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewImportacao.validos.map((jovem, i) => (
                                        <tr key={i}>
                                            <td>{jovem.nome}</td>
                                            <td>{jovem.data_nascimento}</td>
                                            <td>{jovem.telefone || "-"}</td>
                                            <td>
                                                {jovem.duplicado
                                                    ? <span className="status-duplicado">Possível duplicado</span>
                                                    : <span className="status-novo">Novo</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}

                                    {previewImportacao.invalidos.map((item, i) => (
                                        <tr key={`err-${i}`} className="linha-invalida">
                                            <td>{item.jovem.nome || "(sem nome)"}</td>
                                            <td colSpan="3" className="status-erro">
                                                Erro: {item.motivo} (linha {item.linha})
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                        </div>

                        <div className="modal-acoes-importacao">

                            <button
                                className="btn-primary"
                                disabled={importando}
                                onClick={() => confirmarImportacao(true)}
                            >
                                Importar (pular duplicados)
                            </button>

                            <button
                                className="btn-lote justificado"
                                disabled={importando}
                                onClick={() => confirmarImportacao(false)}
                            >
                                Importar todos mesmo assim
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </main>
    );
}