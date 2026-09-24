const API = ""

export default function JovemCard({ jovem, onClick }) {
    return (
        <div className="jovem-card" onClick={onClick}>
            <div className="jovem-foto">
                {jovem.foto ? (
                    <img src={
                        jovem.foto.startsWith("http")
                            ? jovem.foto
                            : `${API}${jovem.foto}`
                    } alt={jovem.nome} />
                ) : (
                    <div className="sem-foto">
                        ?
                    </div>
                )}

            </div>

            <div className="jovem-info">
                <h3>{jovem.nome}</h3>
                <p>Clique para ver informações</p>
            </div>
        </div>
    )
}
