import { useEffect, useMemo, useState } from "react";

import {
    buscarEventos,
    buscarEvento,
    registrarChamada,
    registrarChamadaEmLote,
    finalizarChamada
} from "../api";


export default function Chamada() {

    const [eventos, setEventos] = useState([]);

    const [eventoId, setEventoId] = useState("");

    const [detalhe, setDetalhe] = useState(null);

    const [carregando, setCarregando] =
        useState(false);

    const [busca, setBusca] =
        useState("");

    const [finalizando, setFinalizando] =
        useState(false);


    /*
    |--------------------------------------------------------------------------
    | CARREGAR EVENTOS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        async function carregarEventos() {

            const dados =
                await buscarEventos();

            setEventos(dados);

        }

        carregarEventos();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | SELECIONAR EVENTO
    |--------------------------------------------------------------------------
    */

    async function selecionarEvento(id) {

        setEventoId(id);

        setBusca("");

        if (!id) {

            setDetalhe(null);

            return;

        }


        const dados =
            await buscarEvento(id);

        setDetalhe(dados);

    }


    /*
    |--------------------------------------------------------------------------
    | ATUALIZAR CHAMADA
    |--------------------------------------------------------------------------
    */

    async function recarregarEvento() {

        if (!eventoId) {
            return;
        }


        const dados =
            await buscarEvento(eventoId);

        setDetalhe(dados);

    }


    /*
    |--------------------------------------------------------------------------
    | MARCAR TODOS
    |--------------------------------------------------------------------------
    */

    async function marcarTodos(status) {

        if (!eventoId) {
            return;
        }


        let mensagem = "";

        if (status === "presente") {
            mensagem =
                "Marcar TODOS os jovens como presentes?";
        }

        if (status === "justificado") {
            mensagem =
                "Marcar TODOS os jovens como justificados?";
        }

        if (status === "ausente") {
            mensagem =
                "Marcar TODOS os jovens como ausentes?";
        }


        const confirmar =
            window.confirm(mensagem);


        if (!confirmar) {
            return;
        }


        setCarregando(true);


        try {

            await registrarChamadaEmLote(
                eventoId,
                status
            );

            await recarregarEvento();

        }

        finally {

            setCarregando(false);

        }

    }


    /*
    |--------------------------------------------------------------------------
    | MARCAR INDIVIDUAL
    |--------------------------------------------------------------------------
    */

    async function marcarIndividual(
        jovemId,
        status
    ) {

        setCarregando(true);


        try {

            await registrarChamada(
                eventoId,
                jovemId,
                status
            );

            await recarregarEvento();

        }

        finally {

            setCarregando(false);

        }

    }


    /*
    |--------------------------------------------------------------------------
    | FINALIZAR CHAMADA
    |--------------------------------------------------------------------------
    */

    async function finalizar() {

        if (!eventoId || !detalhe) {
            return;
        }


        const naoMarcados =
            detalhe.jovens.filter(
                jovem => !jovem.status
            ).length;


        if (naoMarcados === 0) {

            alert(
                "Todos os jovens já estão marcados."
            );

            return;

        }


        const confirmar =
            window.confirm(
                `Existem ${naoMarcados} jovem(ns) sem marcação.\n\n` +
                "Eles serão registrados como ausentes.\n\n" +
                "Deseja finalizar a chamada?"
            );


        if (!confirmar) {
            return;
        }


        setFinalizando(true);


        try {

            const resposta =
                await finalizarChamada(
                    eventoId
                );


            await recarregarEvento();


            alert(
                `Chamada finalizada!\n\n` +
                `${resposta.ausentes} jovem(ns) registrado(s) como ausente.`
            );

        }

        finally {

            setFinalizando(false);

        }

    }


    /*
    |--------------------------------------------------------------------------
    | FILTRAR JOVENS
    |--------------------------------------------------------------------------
    */

    const jovensFiltrados =
        useMemo(() => {

            if (!detalhe) {
                return [];
            }


            return detalhe.jovens.filter(
                jovem =>
                    jovem.nome
                        .toLowerCase()
                        .includes(
                            busca.toLowerCase()
                        )
            );

        }, [detalhe, busca]);


    /*
    |--------------------------------------------------------------------------
    | CONTADORES
    |--------------------------------------------------------------------------
    */

    const estatisticas =
        useMemo(() => {

            if (!detalhe) {

                return {

                    presentes: 0,

                    justificados: 0,

                    ausentes: 0,

                    naoMarcados: 0

                };

            }


            return {

                presentes:
                    detalhe.jovens.filter(
                        jovem =>
                            jovem.status ===
                            "presente"
                    ).length,

                justificados:
                    detalhe.jovens.filter(
                        jovem =>
                            jovem.status ===
                            "justificado"
                    ).length,

                ausentes:
                    detalhe.jovens.filter(
                        jovem =>
                            jovem.status ===
                            "ausente"
                    ).length,

                naoMarcados:
                    detalhe.jovens.filter(
                        jovem =>
                            !jovem.status
                    ).length

            };

        }, [detalhe]);


    return (

        <main className="pagina chamada-mobile">

            {/* =====================================================
                CABEÇALHO
            ====================================================== */}

            <div className="pagina-header">

                <div>

                    <span className="eyebrow">
                        FREQUÊNCIA
                    </span>

                    <h1>
                        Chamada
                    </h1>

                    <p>
                        Faça a chamada diretamente
                        pelo celular.
                    </p>

                </div>

            </div>


            {/* =====================================================
                SELEÇÃO DO EVENTO
            ====================================================== */}

            <section className="chamada-controle">

                <label>

                    Culto / Evento

                    <select
                        value={eventoId}
                        onChange={
                            e =>
                                selecionarEvento(
                                    e.target.value
                                )
                        }
                    >

                        <option value="">
                            Selecione um evento
                        </option>

                        {eventos.map(evento => (

                            <option
                                key={evento.id}
                                value={evento.id}
                            >

                                {evento.tipo}
                                {" — "}
                                {
                                    new Date(
                                        evento.data +
                                        "T00:00:00"
                                    ).toLocaleDateString(
                                        "pt-BR"
                                    )
                                }

                                {evento.nome
                                    ? ` (${evento.nome})`
                                    : ""
                                }

                            </option>

                        ))}

                    </select>

                </label>

            </section>


            {/* =====================================================
                EVENTO SELECIONADO
            ====================================================== */}

            {detalhe && (

                <>

                    <section className="chamada-evento">

                        <span className="evento-tipo">
                            {detalhe.evento.tipo}
                        </span>

                        <h2>
                            {detalhe.evento.nome}
                        </h2>

                        <p>
                            {
                                new Date(
                                    detalhe.evento.data +
                                    "T00:00:00"
                                ).toLocaleDateString(
                                    "pt-BR"
                                )
                            }
                        </p>

                    </section>


                    {/* =================================================
                        CONTADORES
                    ================================================= */}

                    <section className="chamada-contadores">

                        <div className="contador presente">

                            <strong>
                                {
                                    estatisticas
                                        .presentes
                                }
                            </strong>

                            <span>
                                Presentes
                            </span>

                        </div>


                        <div className="contador justificado">

                            <strong>
                                {
                                    estatisticas
                                        .justificados
                                }
                            </strong>

                            <span>
                                Justificados
                            </span>

                        </div>


                        <div className="contador ausente">

                            <strong>
                                {
                                    estatisticas
                                        .ausentes
                                }
                            </strong>

                            <span>
                                Ausentes
                            </span>

                        </div>


                        <div className="contador nao-marcado">

                            <strong>
                                {
                                    estatisticas
                                        .naoMarcados
                                }
                            </strong>

                            <span>
                                Não marcados
                            </span>

                        </div>

                    </section>


                    {/* =================================================
                        AÇÕES EM LOTE
                    ================================================= */}

                    <section className="chamada-lote">

                        <button
                            className="btn-lote presente"
                            disabled={carregando}
                            onClick={() =>
                                marcarTodos(
                                    "presente"
                                )
                            }
                        >
                            Todos Presentes
                        </button>


                        <button
                            className="btn-lote justificado"
                            disabled={carregando}
                            onClick={() =>
                                marcarTodos(
                                    "justificado"
                                )
                            }
                        >
                            Todos Justificados
                        </button>


                        <button
                            className="btn-lote ausente"
                            disabled={carregando}
                            onClick={() =>
                                marcarTodos(
                                    "ausente"
                                )
                            }
                        >
                            Todos Ausentes
                        </button>

                    </section>


                    {/* =================================================
                        PESQUISA
                    ================================================= */}

                    <section className="chamada-busca">

                        <input
                            type="text"
                            placeholder="Pesquisar jovem..."
                            value={busca}
                            onChange={
                                e =>
                                    setBusca(
                                        e.target.value
                                    )
                            }
                        />

                    </section>


                    {/* =================================================
                        LISTA
                    ================================================= */}

                    <section className="chamada-lista">

                        {jovensFiltrados.map(
                            jovem => (

                                <div
                                    className="chamada-jovem"
                                    key={jovem.id}
                                >

                                    <div className="chamada-jovem-info">

                                        <strong>
                                            {jovem.nome}
                                        </strong>

                                        <small>

                                            {jovem.status
                                                ? jovem.status
                                                : "Não marcado"
                                            }

                                            {jovem.status &&
                                                jovem.pontos !== null &&
                                                ` • ${jovem.pontos} pts`
                                            }

                                        </small>

                                    </div>


                                    <div className="chamada-botoes">

                                        <button
                                            type="button"
                                            className={
                                                jovem.status ===
                                                    "presente"
                                                    ? "ativo presente"
                                                    : "presente"
                                            }
                                            disabled={
                                                carregando
                                            }
                                            onClick={() =>
                                                marcarIndividual(
                                                    jovem.id,
                                                    "presente"
                                                )
                                            }
                                        >
                                            P
                                        </button>


                                        <button
                                            type="button"
                                            className={
                                                jovem.status ===
                                                    "justificado"
                                                    ? "ativo justificado"
                                                    : "justificado"
                                            }
                                            disabled={
                                                carregando
                                            }
                                            onClick={() =>
                                                marcarIndividual(
                                                    jovem.id,
                                                    "justificado"
                                                )
                                            }
                                        >
                                            J
                                        </button>


                                        <button
                                            type="button"
                                            className={
                                                jovem.status ===
                                                    "ausente"
                                                    ? "ativo ausente"
                                                    : "ausente"
                                            }
                                            disabled={
                                                carregando
                                            }
                                            onClick={() =>
                                                marcarIndividual(
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

                    </section>


                    {/* =================================================
                        FINALIZAR
                    ================================================= */}

                    <section className="chamada-finalizar">

                        <button
                            className="btn-finalizar-chamada"
                            disabled={
                                finalizando ||
                                carregando
                            }
                            onClick={finalizar}
                        >

                            {finalizando
                                ? "Finalizando..."
                                : "Finalizar chamada"
                            }

                        </button>


                        {estatisticas.naoMarcados > 0 && (

                            <p>

                                Ainda existem{" "}

                                <strong>
                                    {
                                        estatisticas
                                            .naoMarcados
                                    }
                                </strong>

                                {" "}
                                jovens sem marcação.

                            </p>

                        )}

                    </section>

                </>

            )}


            {!detalhe && (

                <div className="vazio">

                    Selecione um evento acima
                    para começar a chamada.

                </div>

            )}

        </main>

    );

}