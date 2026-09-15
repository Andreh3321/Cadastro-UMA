import { useEffect, useState } from "react";
import { buscarEventos } from "../api";

export default function Home() {

    const [eventos, setEventos] = useState([]);

    useEffect(() => {
        buscarEventos()
            .then(setEventos)
            .catch(erro => {
                console.error("Erro ao carregar eventos:", erro);
            });
    }, []);

    const hoje = new Date();

    const dataHoje =
        `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

    const eventosDeHoje = eventos.filter(evento => evento.data == dataHoje);

    return (
        <main className="home">

            <section className="hero">
                <div className="hero-inner">

                    {/* TEXTO */}
                    <div className="hero-content">
                        <span className="hero-label">
                            FESTIVIDADE DOS JOVENS 2026
                        </span>

                        <h1>Caminho de Emaús</h1>

                        <p>Lucas 24:32</p>

                        <div className="versiculo">
                            <strong>
                                Então, perguntaram um ao outro: ― Não ardia o nosso coração enquanto ele nos falava no caminho e nos explicava as Escrituras?
                            </strong>
                            <span>Lucas 24:32</span>
                        </div>
                    </div>

                    {/* CARDS NO CANTO */}
                    <aside className="hero-sidebar">

                        <div className="home-eventos-hoje">

                            <div className="home-eventos-header">
                                <span className="home-hoje-label">HOJE</span>
                                <h2>
                                    {hoje.toLocaleDateString("pt-BR", {
                                        weekday: "long",
                                        day: "2-digit",
                                        month: "long"
                                    })}
                                </h2>
                            </div>

                            {eventosDeHoje.length === 0 ? (
                                <p className="home-eventos-vazio">
                                    Não há eventos programados para hoje.
                                </p>
                            ) : (
                                <div className="home-eventos-lista">
                                    {eventosDeHoje.map(evento => (
                                        <div className="home-evento-card" key={evento.id}>
                                            <strong>{evento.nome}</strong>
                                            <span>{evento.tipo}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>

                        <div className="info-box">
                            <h3>Queimando pela Palavra</h3>
                            <p>Que a Palavra de Deus queime dentro de nós sempre que for falada!</p>
                        </div>

                    </aside>

                </div>
            </section>

        </main>
    );
}