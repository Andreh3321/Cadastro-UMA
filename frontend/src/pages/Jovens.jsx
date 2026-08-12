import { useEffect, useState } from "react";

import JovemCard from "../components/JovemCard";
import JovemModal from "../components/JovemModal";

import {
    buscarJovens,
    cadastrarJovem,
    editarJovem,
    excluirJovem
} from "../api";

export default function Jovens() {

    const [jovens, setJovens] = useState([]);

    const [selecionado, setSelecionado] = useState(null);

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [editando, setEditando] = useState(null);

    const [busca, setBusca] = useState("");

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

                <button
                    className="btn-primary"
                    onClick={novoJovem}
                >
                    + Novo jovem
                </button>

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

        </main>
    );
}