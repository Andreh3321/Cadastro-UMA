const API = "http://localhost:3000";

/*
|--------------------------------------------------------------------------
| RENDERIZAR TELEFONE(S)
|--------------------------------------------------------------------------
| Se o campo tiver mais de um telefone separado por "/",
| mostra cada um em uma linha.
|--------------------------------------------------------------------------
*/

function renderizarTelefones(valor) {

    if (!valor) {
        return "N/A";
    }

    const numeros = valor
        .split("/")
        .map(numero => numero.trim())
        .filter(Boolean);

    if (numeros.length <= 1) {
        return valor;
    }

    return (
        <>
            {numeros.map((numero, index) => (
                <span key={index} className="telefone-linha">
                    {numero}
                </span>
            ))}
        </>
    );

}

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

                        <span className="telefone-multiplo">
                            {renderizarTelefones(jovem.telefone)}
                        </span>
                    </div>

                    <div>
                        <strong>
                            Telefone
                        </strong>

                        <span className="telefone-multiplo">
                            {renderizarTelefones(jovem.telefone_emergencia)}
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