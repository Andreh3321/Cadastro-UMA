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

    const [textoAssistente, setTextoAssistente] = useState("");

    const [processandoAssistente, setProcessandoAssistente] =
        useState(false);

    const [resultadoAssistente, setResultadoAssistente] =
        useState(null);


    /*
    |--------------------------------------------------------------------------
    | NAVEGAÇÃO POR MÊS
    |--------------------------------------------------------------------------
    */

    const dataAtual = new Date();

    const [mesSelecionado, setMesSelecionado] =
        useState(dataAtual.getMonth());

    const [anoSelecionado, setAnoSelecionado] =
        useState(dataAtual.getFullYear());


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
                "Erro ao carregar programação:",
                erro
            );

        }

    }


    useEffect(() => {

        carregarEventos();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | NAVEGAÇÃO DOS MESES
    |--------------------------------------------------------------------------
    */

    function mudarMes(direcao) {

        let novoMes = mesSelecionado + direcao;
        let novoAno = anoSelecionado;

        if (novoMes < 0) {

            novoMes = 11;
            novoAno--;

        }

        if (novoMes > 11) {

            novoMes = 0;
            novoAno++;

        }

        setMesSelecionado(novoMes);
        setAnoSelecionado(novoAno);

    }


    function irParaHoje() {

        const hoje = new Date();

        setMesSelecionado(
            hoje.getMonth()
        );

        setAnoSelecionado(
            hoje.getFullYear()
        );

    }


    function nomeMes(mes) {

        return new Intl.DateTimeFormat(
            "pt-BR",
            {
                month: "long"
            }
        ).format(
            new Date(2026, mes, 1)
        );

    }


    /*
    |--------------------------------------------------------------------------
    | EVENTOS DO MÊS SELECIONADO
    |--------------------------------------------------------------------------
    */

    const eventosDoMes = useMemo(() => {

        return eventos.filter(evento => {

            const data = new Date(
                `${evento.data}T00:00:00`
            );

            return (
                data.getMonth() === mesSelecionado &&
                data.getFullYear() === anoSelecionado
            );

        });

    }, [
        eventos,
        mesSelecionado,
        anoSelecionado
    ]);


    /*
    |--------------------------------------------------------------------------
    | ORGANIZAR EVENTOS POR DIA
    |--------------------------------------------------------------------------
    */

    const eventosPorData = useMemo(() => {

        const grupos = {};

        const eventosOrdenados = [
            ...eventosDoMes
        ].sort(
            (a, b) =>
                new Date(`${a.data}T00:00:00`) -
                new Date(`${b.data}T00:00:00`)
        );


        eventosOrdenados.forEach(evento => {

            if (!grupos[evento.data]) {

                grupos[evento.data] = [];

            }

            grupos[evento.data].push(evento);

        });


        return grupos;

    }, [eventosDoMes]);


    /*
    |--------------------------------------------------------------------------
    | ABRIR CHAMADA
    |--------------------------------------------------------------------------
    */

    async function abrirChamada(id) {

        const dados = await buscarEvento(id);

        setEventoSelecionado(dados);

        setBusca("");

        setTextoAssistente("");

        setResultadoAssistente(null);

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

        await carregarEventos();

        /*
        | Depois de cadastrar, mostra o mês do evento criado
        */

        const dataEvento =
            new Date(`${dados.data}T00:00:00`);

        setMesSelecionado(
            dataEvento.getMonth()
        );

        setAnoSelecionado(
            dataEvento.getFullYear()
        );

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

            /*
            | Remove imediatamente da tela
            */

            setEventos(eventosAtuais =>
                eventosAtuais.filter(
                    evento => evento.id !== id
                )
            );


            /*
            | Fecha o modal caso esteja aberto
            */

            setEventoSelecionado(null);

        }
        catch (erro) {

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


            const dados =
                await buscarEvento(
                    eventoSelecionado.evento.id
                );


            setEventoSelecionado(dados);

        }
        finally {

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


            const dados =
                await buscarEvento(
                    eventoSelecionado.evento.id
                );


            setEventoSelecionado(dados);

        }
        finally {

            setCarregando(false);

        }

    }


    /*
    |--------------------------------------------------------------------------
    | ROBÔ ASSISTENTE
    |--------------------------------------------------------------------------
    */

    function normalizarNome(nome) {

        return String(nome || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    }


    function extrairNome(nome) {

        const partes =
            normalizarNome(nome)
                .split(" ")
                .filter(Boolean);


        return {

            primeiroNome:
                partes[0] || "",

            sobrenomes:
                partes.slice(1)

        };

    }


    function limparLinha(linha) {

        return linha
            .replace(
                /^\s*[-•*✓✔️❌✕]\s*/,
                ""
            )
            .replace(
                /^\s*\d+[\).\-\s]+/,
                ""
            )
            .trim();

    }


    function identificarStatus(linha) {

        const texto =
            normalizarNome(linha)
                .replace(/:$/, "")
                .trim();


        if (
            /^(presentes?|presenca|presencas|p)$/
                .test(texto)
        ) {

            return "presente";

        }


        if (
            /^(justificados?|justificadas?|j)$/
                .test(texto)
        ) {

            return "justificado";

        }


        if (
            /^(ausentes?|a)$/
                .test(texto)
        ) {

            return "ausente";

        }


        return null;

    }


    function distanciaLevenshtein(a, b) {

        const matriz = [];


        for (
            let i = 0;
            i <= b.length;
            i++
        ) {

            matriz[i] = [i];

        }


        for (
            let j = 0;
            j <= a.length;
            j++
        ) {

            matriz[0][j] = j;

        }


        for (
            let i = 1;
            i <= b.length;
            i++
        ) {

            for (
                let j = 1;
                j <= a.length;
                j++
            ) {

                if (
                    b[i - 1] ===
                    a[j - 1]
                ) {

                    matriz[i][j] =
                        matriz[i - 1][j - 1];

                }
                else {

                    matriz[i][j] =
                        Math.min(
                            matriz[i - 1][j - 1] + 1,
                            matriz[i][j - 1] + 1,
                            matriz[i - 1][j] + 1
                        );

                }

            }

        }


        return matriz[
            b.length
        ][
            a.length
        ];

    }


    async function processarAssistente() {

        if (
            !eventoSelecionado ||
            !textoAssistente.trim()
        ) {

            return;

        }


        setProcessandoAssistente(true);

        setResultadoAssistente(null);


        try {

            const jovens =
                eventoSelecionado.jovens;


            /*
            | Mapa para encontrar nome completo rapidamente
            */

            const mapaJovens =
                new Map(
                    jovens.map(jovem => [
                        normalizarNome(
                            jovem.nome
                        ),
                        jovem
                    ])
                );


            /*
            | Mapa agrupando jovens pelo primeiro nome
            */

            const jovensPorPrimeiroNome =
                new Map();


            jovens.forEach(jovem => {

                const {
                    primeiroNome
                } =
                    extrairNome(
                        jovem.nome
                    );


                if (
                    !jovensPorPrimeiroNome
                        .has(primeiroNome)
                ) {

                    jovensPorPrimeiroNome.set(
                        primeiroNome,
                        []
                    );

                }


                jovensPorPrimeiroNome
                    .get(primeiroNome)
                    .push(jovem);

            });


            /*
            | Separar texto por linhas
            */

            const linhas =
                textoAssistente
                    .split(/\r?\n/)
                    .map(
                        linha =>
                            limparLinha(linha)
                    )
                    .filter(Boolean);


            let statusAtual =
                "presente";


            const entradas = [];


            for (
                const linha
                of linhas
            ) {

                const novoStatus =
                    identificarStatus(
                        linha
                    );


                if (novoStatus) {

                    statusAtual =
                        novoStatus;

                    continue;

                }


                const nomes =
                    linha
                        .split(/[;,]/)
                        .map(
                            nome =>
                                nome.trim()
                        )
                        .filter(Boolean);


                for (
                    const nome
                    of nomes
                ) {

                    entradas.push({

                        nome,

                        status:
                            statusAtual

                    });

                }

            }


            const encontrados = [];

            const naoEncontrados = [];

            const processados =
                new Set();


            /*
            | Procurar cada nome
            */

            for (
                const entrada
                of entradas
            ) {

                const nomeNormalizado =
                    normalizarNome(
                        entrada.nome
                    );


                const {
                    primeiroNome,
                    sobrenomes
                } =
                    extrairNome(
                        entrada.nome
                    );


                /*
                |--------------------------------------------------------------------------
                | 1. Tentar nome completo
                |--------------------------------------------------------------------------
                */

                let jovem =
                    mapaJovens.get(
                        nomeNormalizado
                    );


                /*
                |--------------------------------------------------------------------------
                | 2. Tentar pelo primeiro nome
                |--------------------------------------------------------------------------
                */

                if (!jovem) {

                    const candidatos =
                        jovensPorPrimeiroNome.get(
                            primeiroNome
                        ) || [];


                    /*
                    | Primeiro nome único
                    */

                    if (
                        candidatos.length === 1
                    ) {

                        jovem =
                            candidatos[0];

                    }


                    /*
                    | Primeiro nome duplicado
                    | Procurar qualquer sobrenome
                    */

                    else if (
                        candidatos.length > 1
                    ) {

                        const candidatosSobrenome =
                            candidatos.filter(
                                candidato => {

                                    const partes =
                                        extrairNome(
                                            candidato.nome
                                        );


                                    return sobrenomes.some(
                                        sobrenome =>
                                            partes.sobrenomes
                                                .includes(
                                                    sobrenome
                                                )
                                    );

                                }
                            );


                        if (
                            candidatosSobrenome.length === 1
                        ) {

                            jovem =
                                candidatosSobrenome[0];

                        }

                    }

                }


                /*
                |--------------------------------------------------------------------------
                | JOVEM ENCONTRADO
                |--------------------------------------------------------------------------
                */

                if (jovem) {

                    if (
                        processados.has(
                            jovem.id
                        )
                    ) {

                        continue;

                    }


                    await registrarChamada(
                        eventoSelecionado.evento.id,
                        jovem.id,
                        entrada.status
                    );


                    processados.add(
                        jovem.id
                    );


                    encontrados.push({

                        nome:
                            jovem.nome,

                        status:
                            entrada.status

                    });


                    continue;

                }


                /*
                |--------------------------------------------------------------------------
                | SUGESTÃO PARA NOME NÃO ENCONTRADO
                |--------------------------------------------------------------------------
                */

                let melhorSugestao =
                    null;

                let menorDistancia =
                    Infinity;


                for (
                    const cadastrado
                    of jovens
                ) {

                    const distancia =
                        distanciaLevenshtein(
                            nomeNormalizado,
                            normalizarNome(
                                cadastrado.nome
                            )
                        );


                    if (
                        distancia <
                        menorDistancia
                    ) {

                        menorDistancia =
                            distancia;

                        melhorSugestao =
                            cadastrado;

                    }

                }


                const limite =
                    Math.max(
                        2,
                        Math.floor(
                            nomeNormalizado.length *
                            0.25
                        )
                    );


                naoEncontrados.push({

                    nome:
                        entrada.nome,

                    status:
                        entrada.status,

                    sugestao:
                        menorDistancia <= limite
                            ? melhorSugestao?.nome
                            : null

                });

            }


            /*
            |--------------------------------------------------------------------------
            | Atualizar chamada
            |--------------------------------------------------------------------------
            */

            const dados =
                await buscarEvento(
                    eventoSelecionado.evento.id
                );


            setEventoSelecionado(
                dados
            );


            setResultadoAssistente({

                encontrados,

                naoEncontrados

            });

        }
        catch (erro) {

            console.error(
                "Erro no assistente de chamada:",
                erro
            );


            alert(
                "Não foi possível processar a chamada."
            );

        }
        finally {

            setProcessandoAssistente(false);

        }

    }


    /*
    |--------------------------------------------------------------------------
    | PESQUISA E CONTADORES
    |--------------------------------------------------------------------------
    */

    const jovensFiltrados =
        useMemo(() => {

            if (!eventoSelecionado) {

                return [];

            }


            return eventoSelecionado.jovens.filter(
                jovem =>
                    jovem.nome
                        .toLowerCase()
                        .includes(
                            busca.toLowerCase()
                        )
            );

        }, [
            eventoSelecionado,
            busca
        ]);


    const estatisticas =
        useMemo(() => {

            if (!eventoSelecionado) {

                return {

                    presentes: 0,

                    justificados: 0,

                    ausentes: 0,

                    naoMarcados: 0

                };

            }


            return {

                presentes:
                    eventoSelecionado.jovens.filter(
                        jovem =>
                            jovem.status ==
                            "presente"
                    ).length,


                justificados:
                    eventoSelecionado.jovens.filter(
                        jovem =>
                            jovem.status ==
                            "justificado"
                    ).length,


                ausentes:
                    eventoSelecionado.jovens.filter(
                        jovem =>
                            jovem.status ==
                            "ausente"
                    ).length,


                naoMarcados:
                    eventoSelecionado.jovens.filter(
                        jovem =>
                            !jovem.status
                    ).length

            };

        }, [
            eventoSelecionado
        ]);


    /*
    |--------------------------------------------------------------------------
    | FINALIZAR CHAMADA
    |--------------------------------------------------------------------------
    */

    async function finalizar() {

        if (!eventoSelecionado) {

            return;

        }


        const naoMarcados =
            eventoSelecionado.jovens.filter(
                jovem =>
                    !jovem.status
            ).length;


        const confirmar =
            window.confirm(

                naoMarcados > 0

                    ? `Existem ${naoMarcados} jovem(ns) sem marcação.\n\n` +
                    `Eles serão registrados como ausentes.\n\n` +
                    `Deseja finalizar a chamada?`

                    : `Deseja salvar as alterações?`

            );


        if (!confirmar) {

            return;

        }


        setFinalizando(true);


        try {

            const resposta =
                await finalizarChamada(
                    eventoSelecionado.evento.id
                );


            const dados =
                await buscarEvento(
                    eventoSelecionado.evento.id
                );


            setEventoSelecionado(
                dados
            );


            setEventoSelecionado(
                null
            );


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
    | EVENTOS DE HOJE
    |--------------------------------------------------------------------------
    */

    const hoje = new Date();


    const dataHoje =
        `${hoje.getFullYear()}-${String(
            hoje.getMonth() + 1
        ).padStart(2, "0")}-${String(
            hoje.getDate()
        ).padStart(2, "0")}`;


    const eventosDeHoje =
        eventos.filter(
            evento =>
                evento.data == dataHoje
        );


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <main className="pagina">

            {/* =========================================================
                EVENTOS DE HOJE
            ========================================================= */}

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

                    {eventosDeHoje.length > 0 && (
                        <span className="hoje-indicador">
                            {eventosDeHoje.length}{" "}
                            {eventosDeHoje.length === 1
                                ? "evento hoje"
                                : "eventos hoje"}
                        </span>
                    )}
                </div>

                {eventosDeHoje.length === 0 ? (
                    <div className="eventos-hoje-vazio">
                        <span className="hoje-icone-vazio">
                            ✓
                        </span>

                        <p>
                            Não há eventos programados para hoje.
                        </p>
                    </div>
                ) : (
                    <div className="eventos-hoje-lista">
                        {eventosDeHoje.map(evento => (
                            <div
                                className="evento-hoje-card"
                                key={evento.id}
                            >
                                <div className="eventos-hoje-info">
                                    <div>
                                        <strong>
                                            {evento.nome}
                                        </strong>

                                        <span className="evento-hoje-tipo">
                                            {evento.tipo}
                                        </span>
                                    </div>
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


            {/* =========================================================
                CABEÇALHO
            ========================================================= */}

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
                NAVEGAÇÃO POR MÊS
            ========================================================= */}

            <div className="navegacao-meses">

                <button
                    type="button"
                    className="btn-mes"
                    onClick={() =>
                        mudarMes(-1)
                    }
                    aria-label="Mês anterior"
                >
                    ‹
                </button>


                <div className="mes-atual">

                    <strong>
                        {nomeMes(
                            mesSelecionado
                        )}
                    </strong>

                    <span>
                        {anoSelecionado}
                    </span>

                </div>


                <button
                    type="button"
                    className="btn-mes"
                    onClick={() =>
                        mudarMes(1)
                    }
                    aria-label="Próximo mês"
                >
                    ›
                </button>


                <button
                    type="button"
                    className="btn-hoje"
                    onClick={irParaHoje}
                >
                    Hoje
                </button>

            </div>


            {/* =========================================================
                LISTA DE EVENTOS DO MÊS
            ========================================================= */}

            <div className="eventos-agenda">

                {Object.keys(eventosPorData).length === 0 ? (

                    <div className="agenda-vazia">

                        <p>
                            Nenhum evento neste mês.
                        </p>

                    </div>

                ) : (

                    Object.entries(
                        eventosPorData
                    ).map(
                        ([data, eventosDoDia]) => {

                            const dataObj =
                                new Date(
                                    `${data}T00:00:00`
                                );


                            const hojeComparacao =
                                new Date();

                            hojeComparacao.setHours(
                                0,
                                0,
                                0,
                                0
                            );


                            const amanha =
                                new Date(
                                    hojeComparacao
                                );

                            amanha.setDate(
                                amanha.getDate() + 1
                            );


                            let tituloData;


                            if (
                                dataObj.getTime() ===
                                hojeComparacao.getTime()
                            ) {

                                tituloData =
                                    "Hoje";

                            }
                            else if (
                                dataObj.getTime() ===
                                amanha.getTime()
                            ) {

                                tituloData =
                                    "Amanhã";

                            }
                            else {

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

                                    {/* CABEÇALHO DO DIA */}

                                    <div className="dia-eventos-header">

                                        <div>

                                            <span>
                                                {tituloData}
                                            </span>

                                            <strong>
                                                {dataObj.toLocaleDateString(
                                                    "pt-BR",
                                                    {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric"
                                                    }
                                                )}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* EVENTOS DO DIA */}

                                    <div className="eventos-do-dia">

                                        {eventosDoDia.map(
                                            evento => (

                                                <div
                                                    className="evento-card"
                                                    key={evento.id}
                                                >

                                                    <div className="evento-data">

                                                        <strong>
                                                            {dataObj.getDate()}
                                                        </strong>

                                                        <span>
                                                            {dataObj.toLocaleDateString(
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
                                                                excluir(
                                                                    evento.id
                                                                )
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
                    )

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


                        {/* =================================================
                            ASSISTENTE
                        ================================================= */}

                        <section className="assistente-chamada">

                            <div className="assistente-header">

                                <div>

                                    <span className="eyebrow">
                                        ASSISTENTE
                                    </span>

                                    <h3>
                                        🤖 Chamada automática
                                    </h3>

                                    <p>
                                        Cole os nomes abaixo.
                                        O assistente identifica
                                        os jovens e marca a chamada.
                                    </p>

                                </div>

                            </div>


                            <textarea
                                value={
                                    textoAssistente
                                }
                                onChange={e =>
                                    setTextoAssistente(
                                        e.target.value
                                    )
                                }
                                placeholder={
                                    "Exemplo:\n" +
                                    "João da Silva\n" +
                                    "Maria Santos\n" +
                                    "Pedro Oliveira"
                                }
                            />


                            <button
                                type="button"
                                className="btn-assistente"
                                disabled={
                                    processandoAssistente ||
                                    !textoAssistente.trim()
                                }
                                onClick={
                                    processarAssistente
                                }
                            >

                                {processandoAssistente
                                    ? "Processando..."
                                    : "🤖 Processar chamada"}

                            </button>


                            {resultadoAssistente && (

                                <div className="assistente-resultado">

                                    <strong>

                                        {
                                            resultadoAssistente
                                                .encontrados
                                                .length
                                        }

                                        {" "}
                                        jovem(ns)
                                        {" "}
                                        identificado(s)

                                    </strong>


                                    {resultadoAssistente.naoEncontrados.length > 0 && (

                                        <div className="assistente-erros">

                                            <strong>
                                                Não encontrados:
                                            </strong>


                                            {
                                                resultadoAssistente
                                                    .naoEncontrados
                                                    .map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (

                                                            <div
                                                                key={
                                                                    index
                                                                }
                                                            >

                                                                <span>
                                                                    {
                                                                        item.nome
                                                                    }
                                                                </span>


                                                                {item.sugestao && (

                                                                    <small>
                                                                        Sugestão:
                                                                        {" "}
                                                                        {
                                                                            item.sugestao
                                                                        }
                                                                    </small>

                                                                )}

                                                            </div>

                                                        )
                                                    )
                                            }

                                        </div>

                                    )}

                                </div>

                            )}

                        </section>


                        {/* =================================================
                            CONTADORES
                        ================================================= */}

                        <div className="chamada-contadores">

                            <div className="contador presente">

                                <strong>
                                    {
                                        estatisticas.presentes
                                    }
                                </strong>

                                <span>
                                    Presentes
                                </span>

                            </div>


                            <div className="contador justificado">

                                <strong>
                                    {
                                        estatisticas.justificados
                                    }
                                </strong>

                                <span>
                                    Justificados
                                </span>

                            </div>


                            <div className="contador ausente">

                                <strong>
                                    {
                                        estatisticas.ausentes
                                    }
                                </strong>

                                <span>
                                    Ausentes
                                </span>

                            </div>


                            <div className="contador nao-marcado">

                                <strong>
                                    {
                                        estatisticas.naoMarcados
                                    }
                                </strong>

                                <span>
                                    Não marcados
                                </span>

                            </div>

                        </div>


                        {/* =================================================
                            PESQUISA
                        ================================================= */}

                        <div className="chamada-busca">

                            <input
                                type="text"
                                placeholder="Pesquisar jovem..."
                                value={busca}
                                onChange={e =>
                                    setBusca(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        {/* =================================================
                            LEGENDA
                        ================================================= */}

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


                        {/* =================================================
                            LISTA DE JOVENS
                        ================================================= */}

                        <div className="chamada-lista">

                            {jovensFiltrados.map(
                                jovem => (

                                    <div
                                        className="chamada-jovem"
                                        key={
                                            jovem.id
                                        }
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
                                                    jovem.status ===
                                                        "presente"
                                                        ? "ativo presente"
                                                        : "presente"
                                                }
                                                disabled={
                                                    carregando
                                                }
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
                                                    jovem.status ===
                                                        "justificado"
                                                        ? "ativo justificado"
                                                        : "justificado"
                                                }
                                                disabled={
                                                    carregando
                                                }
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
                                                    jovem.status ===
                                                        "ausente"
                                                        ? "ativo ausente"
                                                        : "ausente"
                                                }
                                                disabled={
                                                    carregando
                                                }
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
                                                    desmarcar(
                                                        jovem.id
                                                    )
                                                }
                                            >
                                                -
                                            </button>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>


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
                                onClick={
                                    finalizar
                                }
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
                                            estatisticas.naoMarcados
                                        }
                                    </strong>

                                    {" "}
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