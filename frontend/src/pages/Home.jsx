import { useEffect, useState } from "react";

import { buscarEventos } from "../api";

export default function Home() {

    const [eventos, setEventos] = useState([]);

    useEffect(() => {
        buscarEventos()
            .then(setEventos)
            .catch(erro => {
                console.error(
                    "Erro ao carregar eventos:",
                    erro
                );
            });
    }, []);

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

    return (
        <main className="home">

            <section className="hero">
                <div className="hero-content">

                    <span className="hero-label">
                        FESTIVIDADE DOS JOVENS 2026
                    </span>

                    <h1>
                        Caminho de Emaús
                    </h1>

                    <p>
                        Lucas 24:32
                    </p>

                    <div className="versiculo">
                        <strong>
                            Então, perguntaram um ao outro: ― Não ardia o nosso coração enquanto ele nos falava no caminho e nos explicava as Escrituras?
                        </strong>

                        <span>
                            Lucas 6:32
                        </span>
                    </div>

                </div>

                <section className="home-eventos-hoje">

                    <div className="home-eventos-header">

                        <div>
                            <span className="home-hoje-label">
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

                        <p className="home-eventos-vazio">
                            Não há eventos programados para hoje.
                        </p>

                    ) : (

                        <div className="home-eventos-lista">

                            {eventosDeHoje.map(evento => (

                                <div
                                    className="home-evento-card"
                                    key={evento.id}
                                >

                                    <strong>
                                        {evento.nome}
                                    </strong>

                                    <span>
                                        {evento.tipo}
                                    </span>

                                </div>

                            ))}

                        </div>

                    )}

                </section>


                <section className="home-info">

                    <div className="info-box">
                        <h3>
                            Queimando pela Palavra
                        </h3>

                        <p>
                            Que a Palavra de Deus queime dentro de nós sempre que for falada!
                        </p>
                    </div>

                </section>
            </section>

        </main>
    );
}