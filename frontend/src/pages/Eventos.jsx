import { useEffect, useState } from "react";

import {
    buscarEventos,
    buscarEvento,
    cadastrarEvento,
    registrarChamada
} from "../api";

export default function Eventos() {

    const [eventos, setEventos] = useState([]);

    const [eventoSelecionado, setEventoSelecionado] =
        useState(null);

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    async function carregarEventos() {

        const dados = await buscarEventos();

        setEventos(dados);
    }

    useEffect(() => {
        carregarEventos();
    }, []);

    async function abrirChamada(id) {

        const dados = await buscarEvento(id);

        setEventoSelecionado(dados);
    }

    async function salvarEvento(e) {

        e.preventDefault();

        const dados = {
            nome: e.target.nome.value,
            data: e.target.data.value,
            horario: e.target.horario.value,
            local: e.target.local.value,
            descricao: e.target.descricao.value
        };

        await cadastrarEvento(dados);

        setMostrarFormulario(false);

        carregarEventos();
    }

    async function marcar(
        jovemId,
        status
    ) {

        await registrarChamada(
            eventoSelecionado.evento.id,
            jovemId,
            status
        );

        const dados = await buscarEvento(
            eventoSelecionado.evento.id
        );

        setEventoSelecionado(dados);
    }

    return (
        <main className="pagina">

            <div className="pagina-header">

                <div>

                    <span className="eyebrow">
                        CALENDÁRIO
                    </span>

                    <h1>
                        Eventos
                    </h1>

                    <p>
                        Cultos, eventos e chamadas
                    </p>

                </div>

                <button
                    className="btn-primary"
                    onClick={() =>
                        setMostrarFormulario(true)
                    }
                >
                    + Novo evento
                </button>

            </div>

            <div className="eventos-lista">

                {eventos.map(evento => (

                    <div
                        className="evento-card"
                        key={evento.id}
                    >

                        <div className="evento-data">

                            <strong>
                                {new Date(
                                    evento.data + "T00:00:00"
                                ).getDate()}
                            </strong>

                            <span>
                                {new Date(
                                    evento.data + "T00:00:00"
                                ).toLocaleDateString(
                                    "pt-BR",
                                    {
                                        month: "short"
                                    }
                                )}
                            </span>

                        </div>

                        <div className="evento-info">

                            <h2>
                                {evento.nome}
                            </h2>

                            <p>
                                {evento.horario}
                                {" • "}
                                {evento.local}
                            </p>

                            <small>
                                {evento.descricao}
                            </small>

                        </div>

                        <button
                            className="btn-primary"
                            onClick={() =>
                                abrirChamada(evento.id)
                            }
                        >
                            Fazer chamada
                        </button>

                    </div>

                ))}

            </div>

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
                            Novo evento
                        </h2>

                        <form onSubmit={salvarEvento}>

                            <label>
                                Nome do evento
                                <input
                                    name="nome"
                                    required
                                    placeholder="Culto de jovens"
                                />
                            </label>

                            <label>
                                Data
                                <input
                                    name="data"
                                    type="date"
                                    required
                                />
                            </label>

                            <label>
                                Horário
                                <input
                                    name="horario"
                                    type="time"
                                />
                            </label>

                            <label>
                                Local
                                <input
                                    name="local"
                                    placeholder="Templo principal"
                                />
                            </label>

                            <label>
                                Descrição
                                <textarea
                                    name="descricao"
                                    placeholder="Informações sobre o evento..."
                                />
                            </label>

                            <button
                                className="btn-primary"
                                type="submit"
                            >
                                Criar evento
                            </button>

                        </form>

                    </div>

                </div>

            )}

            {eventoSelecionado && (

                <div className="modal-overlay">

                    <div className="modal chamada">

                        <button
                            className="fechar"
                            onClick={() =>
                                setEventoSelecionado(null)
                            }
                        >
                            ×
                        </button>

                        <h2>
                            {eventoSelecionado.evento.nome}
                        </h2>

                        <p>
                            Faça a chamada dos jovens
                        </p>

                        <div className="legenda">

                            <span className="presente">
                                Presente
                            </span>

                            <span className="justificado">
                                Justificado
                            </span>

                            <span className="ausente">
                                Ausente
                            </span>

                        </div>

                        <div className="chamada-lista">

                            {eventoSelecionado.jovens.map(
                                jovem => (

                                    <div
                                        className="chamada-jovem"
                                        key={jovem.id}
                                    >

                                        <div>
                                            <strong>
                                                {jovem.nome}
                                            </strong>

                                            <small>
                                                {jovem.status
                                                    ? jovem.status
                                                    : "Não marcado"}
                                            </small>
                                        </div>

                                        <div className="chamada-botoes">

                                            <button
                                                className={
                                                    jovem.status ===
                                                    "presente"
                                                        ? "ativo presente"
                                                        : "presente"
                                                }
                                                onClick={() =>
                                                    marcar(
                                                        jovem.id,
                                                        "presente"
                                                    )
                                                }
                                            >
                                                P
                                            </button>

                                            <button
                                                className={
                                                    jovem.status ===
                                                    "justificado"
                                                        ? "ativo justificado"
                                                        : "justificado"
                                                }
                                                onClick={() =>
                                                    marcar(
                                                        jovem.id,
                                                        "justificado"
                                                    )
                                                }
                                            >
                                                J
                                            </button>

                                            <button
                                                className={
                                                    jovem.status ===
                                                    "ausente"
                                                        ? "ativo ausente"
                                                        : "ausente"
                                                }
                                                onClick={() =>
                                                    marcar(
                                                        jovem.id,
                                                        "ausente"
                                                    )
                                                }
                                            >
                                                A
                                            </button>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    </div>

                </div>

            )}

        </main>
    );
}