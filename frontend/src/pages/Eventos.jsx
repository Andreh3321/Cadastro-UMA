import { useEffect, useMemo, useState } from "react";

import {
    buscarEventos,
    buscarEvento,
    cadastrarEvento,
    registrarChamada,
    gerarProgramacao,
    desmarcarChamada,
    excluirEvento,
    finalizarChamada
} from "../api";


const TIPOS_EVENTO = [

    {
        nome: "Culto das irmãs",
        pontos: 100
    },

    {
        nome: "Culto de doutrina",
        pontos: 200
    },

    {
        nome: "Culto de quinta-feira",
        pontos: 200
    },

    {
        nome: "EBD",
        pontos: 500
    },

    {
        nome: "Ensaio local",
        pontos: 500
    },

    {
        nome: "Culto de domingo",
        pontos: 300
    },

    {
        nome: "Santa Ceia",
        pontos: 500
    },

    {
        nome: "Culto no lar",
        pontos: 200
    },

    {
        nome: "Culto ao ar livre (missão)",
        pontos: 200
    },

    {
        nome: "Cooperação na Sede",
        pontos: 350
    },

    {
        nome: "Cooperação Belenzinho",
        pontos: 500
    },

    {
        nome: "Ensaio Sede",
        pontos: 300
    },

    {
        nome: "Eventos com a UMA local",
        pontos: 750
    },

    {
        nome: "Cultos na direção da UMA",
        pontos: 400
    }

];


export default function Eventos() {

    const [eventos, setEventos] = useState([]);

    const [eventoSelecionado, setEventoSelecionado] =
        useState(null);

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [carregando, setCarregando] = useState(false);

    const [finalizando, setFinalizando] = useState(false);

    const [busca, setBusca] = useState("");


    /*
    |--------------------------------------------------------------------------
    | CARREGAR EVENTOS
    |--------------------------------------------------------------------------
    */

    async function carregarEventos() {

        try {
            await gerarProgramacao();

            const dados = await buscarEventos();

            setEventos(dados);
        }

        catch (erro) {
            console.error(
                "Erro ao carregar programação: ",
                erro
            )
        }

    }


    useEffect(() => {

        carregarEventos();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | ABRIR CHAMADA
    |--------------------------------------------------------------------------
    */

    async function abrirChamada(id) {

        const dados = await buscarEvento(id);

        setEventoSelecionado(dados);
        setBusca("");

    }


    /*
    |--------------------------------------------------------------------------
    | CADASTRAR EVENTO
    |--------------------------------------------------------------------------
    */

    async function salvarEvento(e) {

        e.preventDefault();

        const dados = {

            nome: e.target.nome.value,

            tipo: e.target.tipo.value,

            data: e.target.data.value,

            horario: e.target.horario.value,

            local: e.target.local.value,

            descricao: e.target.descricao.value

        };

        await cadastrarEvento(dados);

        setMostrarFormulario(false);

        e.target.reset();

        carregarEventos();

    }

    /*
    |--------------------------------------------------------------------------
    | EXCLUIR EVENTO
    |--------------------------------------------------------------------------
    */

    async function excluir(id) {
        const confirmar = window.confirm(
            "Deseja realmente excluir este evento?"
        );

        if (!confirmar) {
            return;
        }

        try {
            await excluirEvento(id);

            // Remove imediatamente da tela
            setEventos(eventosAtuais =>
                eventosAtuais.filter(evento => evento.id !== id)
            );

            // Fecha o modal, caso esteja aberto
            setEventoSelecionado(null);

        } catch (erro) {
            console.error(
                "Erro ao excluir evento:",
                erro
            );

            alert(
                erro.message ||
                "Não foi possível excluir o evento."
            );
        }
    }



    /*
    |--------------------------------------------------------------------------
    | REGISTRAR CHAMADA
    |--------------------------------------------------------------------------
    */

    async function marcar(
        jovemId,
        status
    ) {
        setCarregando(true);

        try {
            await registrarChamada(
                eventoSelecionado.evento.id,
                jovemId,
                status
            );

            const dados = await buscarEvento(
                eventoSelecionado.evento.id
            );

            setEventoSelecionado(dados);
        } finally {
            setCarregando(false);
        }

    }

    async function desmarcar(jovemId) {
        setCarregando(true);

        try {
            await desmarcarChamada(
                eventoSelecionado.evento.id,
                jovemId
            );

            const dados = await buscarEvento(
                eventoSelecionado.evento.id
            );

            setEventoSelecionado(dados);
        } finally {
            setCarregando(false);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PESQUISA E CONTADORES
    |--------------------------------------------------------------------------
    */

    const jovensFiltrados = useMemo(() => {
        if (!eventoSelecionado) {
            return [];
        }

        return eventoSelecionado.jovens.filter(jovem =>
            jovem.nome
                .toLowerCase()
                .includes(busca.toLowerCase())
        );
    }, [eventoSelecionado, busca]);

    const estatisticas = useMemo(() => {
        if (!eventoSelecionado) {
            return {
                presentes: 0,
                justificados: 0,
                ausentes: 0,
                naoMarcados: 0
            };
        }

        return {
            presentes: eventoSelecionado.jovens.filter(
                jovem => jovem.status == "presente"
            ).length,

            justificados: eventoSelecionado.jovens.filter(
                jovem => jovem.status == "justificado"
            ).length,

            ausentes: eventoSelecionado.jovens.filter(
                jovem => jovem.status == "ausente"
            ).length,

            naoMarcados: eventoSelecionado.jovens.filter(
                jovem => !jovem.status
            ).length
        };
    }, [eventoSelecionado]);

    async function finalizar() {
        if (!eventoSelecionado) {
            return;
        }

        const naoMarcados =
            eventoSelecionado.jovens.filter(
                jovem => !jovem.status
            ).length;

        const confirmar = window.confirm(
            naoMarcados > 0 ?
                `Existem ${naoMarcados} jovem(ns) sem marcação.\n\n` +
                `Eles serão regustrados como ausentes.\n\n` +
                `Deseja finalizar a chamada?`
                : `Deseja salvar as alterações?`
        );

        if (!confirmar) {
            return;
        }

        setFinalizando(true);

        try {
            const resposta = await finalizarChamada(
                eventoSelecionado.evento.id
            );

            const dados = await buscarEvento(
                eventoSelecionado.evento.id
            );

            setEventoSelecionado(dados);
            setEventoSelecionado(null);

            alert(
                `Chamada finalizada!\n\n` +
                `${resposta.ausentes} jovem(ns) registrado(s) como ausente.`
            );
        } finally {
            setFinalizando(false);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ORGANIZAR EVENTOS POR DATA
    |--------------------------------------------------------------------------
    */

    const eventosOrdenados = [...eventos].sort(
        (a, b) =>
            new Date(a.data) -
            new Date(b.data)
    );

    const eventosPorData =
        eventosOrdenados.reduce(
            (grupos, evento) => {
                if (!grupos[evento.data]) {

                    grupos[evento.data] = [];
                }

                grupos[evento.data].push(evento);

                return grupos;
            },
            {}
        );

    const hoje = new Date();


    const dataHoje = `${hoje.getFullYear()}-${String(
        hoje.getMonth() + 1
    ).padStart(2, "0")}-${String(
        hoje.getDate()
    ).padStart(2, "0")}`;

    const eventosDeHoje = eventos.filter(
        evento => evento.data == dataHoje
    )


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <main className="pagina">
            <section className="eventos-hoje">

                <div className="eventos-hoje-header">

                    <div>
                        <span className="eyebrow">
                            HOJE
                        </span>

                        <h2>
                            {hoje.toLocaleDateString(
                                "pt-BR",
                                {
                                    weekday: "long",
                                    day: "2-digit",
                                    month: "long"
                                }
                            )}
                        </h2>
                    </div>

                </div>

                {eventosDeHoje.length === 0 ? (

                    <p className="eventos-hoje-vazio">
                        Não há eventos programados para hoje.
                    </p>

                ) : (

                    <div className="eventos-hoje-lista">

                        {eventosDeHoje.map(evento => (

                            <div
                                className="evento-hoje-card"
                                key={evento.id}
                            >

                                <div>
                                    <strong>
                                        {evento.nome}
                                    </strong>

                                    <span>
                                        {evento.horario ||
                                            "Horário não informado"
                                        }

                                        {" • "}

                                        {evento.local ||
                                            "Local não informado"
                                        }
                                    </span>
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

                )}

            </section>

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


            {/* =========================================================
                LISTA DE EVENTOS
            ========================================================= */}

            <div className="eventos-agenda">

                {Object.entries(eventosPorData).map(
                    ([data, eventosDoDia]) => {

                        const dataObj =
                            new Date(
                                data + "T00:00:00"
                            );


                        const hoje = new Date();

                        hoje.setHours(0, 0, 0, 0);


                        const amanha =
                            new Date(hoje);

                        amanha.setDate(
                            hoje.getDate() + 1
                        );


                        let tituloData;


                        if (
                            dataObj.getTime() ===
                            hoje.getTime()
                        ) {

                            tituloData = "Hoje";

                        } else if (
                            dataObj.getTime() ===
                            amanha.getTime()
                        ) {

                            tituloData = "Amanhã";

                        } else {

                            tituloData =
                                dataObj.toLocaleDateString(
                                    "pt-BR",
                                    {
                                        weekday: "long"
                                    }
                                );

                        }


                        return (

                            <section
                                className="dia-eventos"
                                key={data}
                            >

                                <div className="dia-eventos-header">

                                    <div>

                                        <span>
                                            {tituloData}
                                        </span>

                                        <strong>
                                            {
                                                dataObj.toLocaleDateString(
                                                    "pt-BR",
                                                    {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric"
                                                    }
                                                )
                                            }
                                        </strong>

                                    </div>

                                </div>


                                <div className="eventos-do-dia">

                                    {eventosDoDia.map(
                                        evento => (

                                            <div
                                                className="evento-card"
                                                key={evento.id}
                                            >

                                                <div className="evento-data">

                                                    <strong>
                                                        {
                                                            dataObj.getDate()
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            dataObj.toLocaleDateString(
                                                                "pt-BR",
                                                                {
                                                                    month: "short"
                                                                }
                                                            )
                                                        }
                                                    </span>

                                                </div>


                                                <div className="evento-info">

                                                    <h2>
                                                        {evento.nome}
                                                    </h2>


                                                    <p>
                                                        {
                                                            evento.horario ||
                                                            "Horário não informado"
                                                        }

                                                        {" • "}

                                                        {
                                                            evento.local ||
                                                            "Local não informado"
                                                        }
                                                    </p>


                                                    <span className="evento-tipo">

                                                        {evento.tipo}

                                                        {" — "}

                                                        {
                                                            TIPOS_EVENTO.find(
                                                                tipo =>
                                                                    tipo.nome ===
                                                                    evento.tipo
                                                            )?.pontos || 0
                                                        }

                                                        {" pontos"}

                                                    </span>


                                                    <small>
                                                        {evento.descricao}
                                                    </small>

                                                </div>

                                                <div className="evento-acoes">
                                                    <button
                                                        className="btn-primary"
                                                        onClick={() =>
                                                            abrirChamada(
                                                                evento.id
                                                            )
                                                        }
                                                    >
                                                        Fazer chamada
                                                    </button>

                                                    <button
                                                        className="btn-excluir"
                                                        onClick={() =>
                                                            excluir(evento.id)
                                                        }
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            </section>

                        );

                    }
                )}

            </div>


            {/* =========================================================
                MODAL - NOVO EVENTO
            ========================================================= */}

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


                        <p className="subtitulo-modal">
                            Cadastre o evento e selecione
                            a pontuação correspondente.
                        </p>


                        <form
                            onSubmit={salvarEvento}
                        >

                            {/* NOME */}

                            <label>

                                Nome do evento

                                <input

                                    name="nome"

                                    required

                                    placeholder="Ex: Culto de domingo"

                                />

                            </label>


                            {/* TIPO */}

                            <label>

                                Tipo de evento

                                <select
                                    name="tipo"
                                    required
                                    defaultValue=""
                                >

                                    <option
                                        value=""
                                        disabled
                                    >
                                        Selecione o tipo
                                    </option>


                                    {TIPOS_EVENTO.map(
                                        tipo => (

                                            <option
                                                key={
                                                    tipo.nome
                                                }
                                                value={
                                                    tipo.nome
                                                }
                                            >

                                                {tipo.nome}

                                                {" — "}

                                                {tipo.pontos}

                                                {" pontos"}

                                            </option>

                                        )
                                    )}

                                </select>

                            </label>


                            {/* DATA */}

                            <label>

                                Data

                                <input

                                    name="data"

                                    type="date"

                                    required

                                />

                            </label>


                            {/* HORÁRIO */}

                            <label>

                                Horário

                                <input

                                    name="horario"

                                    type="time"

                                />

                            </label>


                            {/* LOCAL */}

                            <label>

                                Local

                                <input

                                    name="local"

                                    placeholder="Ex: Templo principal"

                                />

                            </label>


                            {/* DESCRIÇÃO */}

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


            {/* =========================================================
                MODAL - CHAMADA
            ========================================================= */}

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

                        <div className="chamada-header">

                            <span className="evento-tipo">
                                {eventoSelecionado.evento.tipo}
                                {" — "}
                                {
                                    TIPOS_EVENTO.find(
                                        tipo =>
                                            tipo.nome ===
                                            eventoSelecionado.evento.tipo
                                    )?.pontos
                                }
                                {" pontos"}
                            </span>

                            <h2>
                                {eventoSelecionado.evento.nome}
                            </h2>

                            <p>
                                Faça a chamada dos jovens
                            </p>

                        </div>


                        {/* CONTADORES */}

                        <div className="chamada-contadores">

                            <div className="contador presente">
                                <strong>
                                    {estatisticas.presentes}
                                </strong>

                                <span>
                                    Presentes
                                </span>
                            </div>

                            <div className="contador justificado">
                                <strong>
                                    {estatisticas.justificados}
                                </strong>

                                <span>
                                    Justificados
                                </span>
                            </div>

                            <div className="contador ausente">
                                <strong>
                                    {estatisticas.ausentes}
                                </strong>

                                <span>
                                    Ausentes
                                </span>
                            </div>

                            <div className="contador nao-marcado">
                                <strong>
                                    {estatisticas.naoMarcados}
                                </strong>

                                <span>
                                    Não marcados
                                </span>
                            </div>

                        </div>


                        {/* PESQUISA */}

                        <div className="chamada-busca">

                            <input
                                type="text"
                                placeholder="Pesquisar jovem..."
                                value={busca}
                                onChange={e =>
                                    setBusca(e.target.value)
                                }
                            />

                        </div>


                        {/* LEGENDA */}

                        <div className="legenda">

                            <span className="presente">
                                ✓ Presente
                            </span>

                            <span className="justificado">
                                J Justificado
                            </span>

                            <span className="ausente">
                                ✕ Ausente
                            </span>

                        </div>


                        {/* LISTA */}

                        <div className="chamada-lista">

                            {jovensFiltrados.map(jovem => (

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

                                        {/* PRESENTE */}

                                        <button
                                            type="button"
                                            className={
                                                jovem.status === "presente"
                                                    ? "ativo presente"
                                                    : "presente"
                                            }
                                            disabled={carregando}
                                            onClick={() =>
                                                marcar(
                                                    jovem.id,
                                                    "presente"
                                                )
                                            }
                                            title="Presente"
                                        >
                                            P
                                        </button>


                                        {/* JUSTIFICADO */}

                                        <button
                                            type="button"
                                            className={
                                                jovem.status === "justificado"
                                                    ? "ativo justificado"
                                                    : "justificado"
                                            }
                                            disabled={carregando}
                                            onClick={() =>
                                                marcar(
                                                    jovem.id,
                                                    "justificado"
                                                )
                                            }
                                            title="Justificado"
                                        >
                                            J
                                        </button>


                                        {/* AUSENTE */}

                                        <button
                                            type="button"
                                            className={
                                                jovem.status === "ausente"
                                                    ? "ativo ausente"
                                                    : "ausente"
                                            }
                                            disabled={carregando}
                                            onClick={() =>
                                                marcar(
                                                    jovem.id,
                                                    "ausente"
                                                )
                                            }
                                            title="Ausente"
                                        >
                                            A
                                        </button>


                                        {/* DESMARCAR */}

                                        <button
                                            type="button"
                                            className="desmarcar"
                                            disabled={
                                                carregando ||
                                                !jovem.status
                                            }
                                            title="Desmarcar chamada"
                                            onClick={() =>
                                                desmarcar(jovem.id)
                                            }
                                        >
                                            -
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>


                        {/* FINALIZAR */}

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
                                        {estatisticas.naoMarcados}
                                    </strong>{" "}
                                    jovens sem marcação.
                                </p>
                            )}

                        </section>

                    </div>

                </div>

            )}

        </main>

    );

}