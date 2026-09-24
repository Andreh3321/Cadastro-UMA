import { useEffect, useState } from "react";
import { buscarRanking } from "../api";

const API = "http://localhost:3000";

export default function Ranking() {

    const [ranking, setRanking] = useState([]);

    useEffect(() => {

        buscarRanking()
            .then(setRanking);

    }, []);

    const top3 = ranking.slice(0, 3);

    return (
        <main className="pagina">

            <div className="pagina-header">

                <div>
                    <span className="eyebrow">
                        DESEMPENHO
                    </span>

                    <h1>
                        Ranking
                    </h1>

                    <p>
                        Pontuação dos jovens
                    </p>
                </div>

            </div>

            <section className="podio">

                {top3.map((jovem, index) => (

                    <div
                        className={`podio-card lugar-${index + 1}`}
                        key={jovem.id}
                    >

                        <div className="posicao">
                            {index + 1}º
                        </div>

                        {jovem.foto ? (

                            <img
                                src={
                                    jovem.foto.startsWith("http")
                                        ? jovem.foto
                                        : `${API}${jovem.foto}`
                                }
                                alt={jovem.nome}
                            />

                        ) : (

                            <div className="ranking-sem-foto">
                                ?
                            </div>

                        )}

                        <h2>
                            {jovem.nome}
                        </h2>

                        <strong>
                            {jovem.pontos} pontos
                        </strong>

                    </div>

                ))}

            </section>

            <section className="ranking-list">

                <h2>
                    Classificação geral
                </h2>

                {ranking.map((jovem, index) => (

                    <div
                        className="ranking-row"
                        key={jovem.id}
                    >

                        <span className="ranking-pos">
                            {index + 1}
                        </span>

                        <div className="ranking-nome">

                            {jovem.foto ? (

                                <img
                                    src={
                                        jovem.foto.startsWith("http")
                                            ? jovem.foto
                                            : `${API}${jovem.foto}`
                                    }
                                    alt={jovem.nome}
                                />

                            ) : (

                                <div className="mini-foto">
                                    ?
                                </div>

                            )}

                            <strong>
                                {jovem.nome}
                            </strong>

                        </div>

                        <div className="ranking-stats">

                            <span>
                                P: {jovem.presencas}
                            </span>

                            <span>
                                J: {jovem.justificadas}
                            </span>

                            <span>
                                A: {jovem.ausencias}
                            </span>

                        </div>

                        <strong className="pontos">
                            {jovem.pontos} pts
                        </strong>

                    </div>

                ))}

            </section>

        </main>
    );
}