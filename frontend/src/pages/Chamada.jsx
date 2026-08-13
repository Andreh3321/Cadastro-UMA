import { useEffect, useState } from "react";

import {
    buscarEventos,
    buscarEvento,
    registrarChamada,
    registrarChamadaEmLote
} from "../api";

export default function Chamada() {

    const [eventos, setEventos] = useState([]);
    const [eventoId, setEventoId] = useState("");
    const [detalhe, setDetalhe] = useState(null);
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        buscarEventos().then(setEventos);
    }, []);

    async function selecionarEvento(id) {

        setEventoId(id);

        if (!id) {
            setDetalhe(null);
            return;
        }

        const dados = await buscarEvento(id);
        setDetalhe(dados);
    }

    async function marcarTodos(status) {

        if (!eventoId) return;

        const confirmar = window.confirm(
            `Marcar TODOS os jovens como "${status}" neste evento?`
        );

        if (!confirmar) return;

        setCarregando(true);

        await registrarChamadaEmLote(eventoId, status);

        const dados = await buscarEvento(eventoId);
        setDetalhe(dados);

        setCarregando(false);
    }

    async function marcarIndividual(jovemId, status) {

        await registrarChamada(eventoId, jovemId, status);

        const dados = await buscarEvento(eventoId);
        setDetalhe(dados);
    }

    return (
        <main className="pagina">

            <div className="pagina-header">
                <div>
                    <span className="eyebrow">FREQUÊNCIA</span>
                    <h1>Chamada</h1>
                    <p>Selecione o culto e a data para fazer a chamada de todos de uma vez</p>
                </div>
            </div>

            <div className="chamada-selecao">
                <label>
                    Culto / Evento
                    <select
                        value={eventoId}
                        onChange={(e) => selecionarEvento(e.target.value)}
                    >
                        <option value="">Selecione um evento</option>

                        {eventos.map(evento => (
                            <option key={evento.id} value={evento.id}>
                                {evento.tipo} — {new Date(evento.data + "T00:00:00").toLocaleDateString("pt-BR")}
                                {evento.nome ? ` (${evento.nome})` : ""}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {detalhe && (
                <div className="chamada chamada-pagina">

                    <div className="chamada-header">
                        <span className="evento-tipo">{detalhe.evento.tipo}</span>
                        <h2>{detalhe.evento.nome}</h2>
                        <p>
                            {new Date(detalhe.evento.data + "T00:00:00").toLocaleDateString("pt-BR")}
                        </p>
                    </div>

                    <div className="chamada-lote">
                        <button
                            className="btn-primary"
                            disabled={carregando}
                            onClick={() => marcarTodos("presente")}
                        >
                            Marcar todos Presentes
                        </button>

                        <button
                            className="btn-lote justificado"
                            disabled={carregando}
                            onClick={() => marcarTodos("justificado")}
                        >
                            Marcar todos Justificados
                        </button>

                        <button
                            className="btn-lote ausente"
                            disabled={carregando}
                            onClick={() => marcarTodos("ausente")}
                        >
                            Marcar todos Ausentes
                        </button>
                    </div>

                    <div className="legenda">
                        <span className="presente">✓ Presente</span>
                        <span className="justificado">J Justificado</span>
                        <span className="ausente">✕ Ausente</span>
                    </div>

                    <div className="chamada-lista">
                        {detalhe.jovens.map(jovem => (
                            <div className="chamada-jovem" key={jovem.id}>
                                <div>
                                    <strong>{jovem.nome}</strong>
                                    <small>
                                        {jovem.status ? jovem.status : "Não marcado"}
                                        {jovem.status && jovem.pontos !== null && ` • ${jovem.pontos} pts`}
                                    </small>
                                </div>

                                <div className="chamada-botoes">
                                    <button
                                        className={jovem.status === "presente" ? "ativo presente" : "presente"}
                                        onClick={() => marcarIndividual(jovem.id, "presente")}
                                    >
                                        P
                                    </button>

                                    <button
                                        className={jovem.status === "justificado" ? "ativo justificado" : "justificado"}
                                        onClick={() => marcarIndividual(jovem.id, "justificado")}
                                    >
                                        J
                                    </button>

                                    <button
                                        className={jovem.status === "ausente" ? "ativo ausente" : "ausente"}
                                        onClick={() => marcarIndividual(jovem.id, "ausente")}
                                    >
                                        A
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!detalhe && eventoId === "" && (
                <div className="vazio">
                    Selecione um evento acima para começar a chamada.
                </div>
            )}
        </main>
    );
}