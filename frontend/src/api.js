const API = "http://localhost:3000/api";

export async function buscarJovens() {
    const response = await fetch(`${API}/jovens`);
    return response.json();
}

export async function buscarRanking() {
    const response = await fetch(`${API}/ranking`);
    return response.json();
}

export async function buscarEventos() {
    const response = await fetch(`${API}/eventos`);
    return response.json();
}

export async function buscarEvento(id) {
    const response = await fetch(`${API}/eventos/${id}`);
    return response.json();
}

export async function cadastrarJovem(formData) {
    const response = await fetch(`${API}/jovens`, {
        method: "POST",
        body: formData
    });

    return response.json();
}

export async function editarJovem(id, formData) {
    const response = await fetch(`${API}/jovens/${id}`, {
        method: "PUT",
        body: formData
    });

    return response.json();
}

export async function excluirJovem(id) {
    const response = await fetch(`${API}/jovens/${id}`, {
        method: "DELETE"
    });

    return response.json();
}

export async function cadastrarEvento(dados) {
    const response = await fetch(`${API}/eventos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
    });

    return response.json();
}

export async function registrarChamada(
    eventoId,
    jovemId,
    status
) {
    const response = await fetch(
        `${API}/eventos/${eventoId}/chamada`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                jovem_id: jovemId,
                status
            })
        }
    );

    return response.json();
}

export { API };