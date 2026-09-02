const API = "http://localhost:3000/api";


/*
|--------------------------------------------------------------------------
| JOVENS
|--------------------------------------------------------------------------
*/

export async function buscarJovens() {

    const response = await fetch(
        `${API}/jovens`
    );

    return response.json();
}


export async function cadastrarJovem(formData) {

    const response = await fetch(
        `${API}/jovens`,
        {
            method: "POST",
            body: formData
        }
    );

    return response.json();
}


export async function editarJovem(
    id,
    formData
) {

    const response = await fetch(
        `${API}/jovens/${id}`,
        {
            method: "PUT",
            body: formData
        }
    );

    return response.json();
}


export async function excluirJovem(id) {

    const response = await fetch(
        `${API}/jovens/${id}`,
        {
            method: "DELETE"
        }
    );

    return response.json();
}


/*
|--------------------------------------------------------------------------
| EVENTOS
|--------------------------------------------------------------------------
*/

export async function buscarEventos() {

    const response = await fetch(
        `${API}/eventos`
    );

    return response.json();
}


export async function buscarEvento(id) {

    const response = await fetch(
        `${API}/eventos/${id}`
    );

    return response.json();
}


export async function cadastrarEvento(
    dados
) {

    const response = await fetch(
        `${API}/eventos`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(dados)
        }
    );

    return response.json();
}


export async function editarEvento(
    id,
    dados
) {

    const response = await fetch(
        `${API}/eventos/${id}`,
        {
            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(dados)
        }
    );

    return response.json();
}


export async function excluirEvento(id) {

    const response = await fetch(
        `${API}/eventos/${id}`,
        {
            method: "DELETE"
        }
    );

    return response.json();
}


/*
|--------------------------------------------------------------------------
| CHAMADA
|--------------------------------------------------------------------------
*/

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
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                jovem_id: jovemId,
                status
            })
        }
    );

    return response.json();
}

export async function registrarChamadaEmLote(eventoId, status) {

    const response = await fetch(
        `${API}/eventos/${eventoId}/chamada/todos`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        }
    );

    return response.json();
}

export async function desmarcarChamada(eventoId, jovemId) {
    const response = await fetch(
        `${API}/eventos/${eventoId}/chamada/${jovemId}`,
        {
            method: "DELETE"
        }
    );

    return response.json();
}


/*
|--------------------------------------------------------------------------
| RANKING
|--------------------------------------------------------------------------
*/

export async function buscarRanking() {

    const response = await fetch(
        `${API}/ranking`
    );

    return response.json();
}

/*
|--------------------------------------------------------------------------
| IMPORTAÇÃO
|--------------------------------------------------------------------------
*/

export async function importarJovens(jovens) {

    const response = await fetch(
        `${API}/jovens/importar`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ jovens })
        }
    );

    return response.json();
}

/*
|--------------------------------------------------------------------------
| IMPORTAÇÃO DE CHAMADAS
|--------------------------------------------------------------------------
*/

export async function importarChamadas(eventos) {
    const repsonse = await fetch(
        `${API}/importacao/chamadas`,
        {
            method: "POST",

            headers: {
                "Content=Type": "application/json"
            },

            body: JSON.stringify({
                eventos
            })
        }
    );

    return response.json();
}

export async function finalizarChamada(eventoId) {
    const response = await fetch(
        `${API}/eventos/${eventoId}/finalizar-chamada`,
        {
            method: "POST"
        }
    );

    return response.json();
}

/*
|--------------------------------------------------------------------------
| PROGRAMAÇÃO
|--------------------------------------------------------------------------
*/

export async function gerarProgramacao() {

    const response = await fetch(
        `${API}/eventos/gerar-programacao`,
        {
            method: "POST"
        }
    );

    return response.json();
}


export { API };