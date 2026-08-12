const API = "http://localhost:3000";

export default function JovemModal({
    jovem,
    fechar,
    editar,
    excluir
}) {

    if (!jovem) return null;

    return (
        <div
            className="modal-overlay"
            onClick={fechar}
        >

            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
            >

                <button
                    className="fechar"
                    onClick={fechar}
                >
                    ×
                </button>

                <div className="modal-header">

                    {jovem.foto ? (

                        <img
                            src={`${API}${jovem.foto}`}
                            alt={jovem.nome}
                        />

                    ) : (

                        <div className="modal-sem-foto">
                            ?
                        </div>

                    )}

                    <div>
                        <h2>{jovem.nome}</h2>

                        <p>
                            Jovem cadastrado
                        </p>
                    </div>

                </div>

                <div className="dados">

                    <div>
                        <strong>
                            Data de nascimento
                        </strong>

                        <span>
                            {jovem.data_nascimento || "N/A"}
                        </span>
                    </div>

                    <div>
                        <strong>
                            Telefone
                        </strong>

                        <span>
                            {jovem.telefone || "N/A"}
                        </span>
                    </div>

                    <div>
                        <strong>
                            Telefone de emergência
                        </strong>

                        <span>
                            {jovem.telefone_emergencia || "N/A"}
                        </span>
                    </div>

                    <div>
                        <strong>
                            Endereço
                        </strong>

                        <span>
                            {jovem.endereco || "N/A"}
                        </span>
                    </div>

                    <div>
                        <strong>
                            Data de batismo
                        </strong>

                        <span>
                            {jovem.data_batismo || "N/A"}
                        </span>
                    </div>

                    <div>
                        <strong>
                            Instagram
                        </strong>

                        <span>
                            {jovem.instagram || "N/A"}
                        </span>
                    </div>

                </div>

                <div className="modal-actions">

                    <button
                        className="btn-edit"
                        onClick={() => editar(jovem)}
                    >
                        Editar
                    </button>

                    <button
                        className="btn-delete"
                        onClick={() => excluir(jovem.id)}
                    >
                        Excluir
                    </button>

                </div>

            </div>

        </div>
    );
}