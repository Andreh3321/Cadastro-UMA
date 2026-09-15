/*
|--------------------------------------------------------------------------
| PADRONIZAR TELEFONE
|--------------------------------------------------------------------------
| Suporta também campos com MAIS DE UM telefone, ex:
| "11999998888 / 11988887777" ou "11 99999-8888 e 11 98888-7777"
|--------------------------------------------------------------------------
*/

function formatarTelefone(valor) {

    if (!valor) {
        return null;
    }

    // Divide por separadores comuns entre múltiplos números
    const partes = String(valor)
        .split(/[\/,;]|\be\b|\bou\b/i)
        .map(parte => parte.trim())
        .filter(Boolean);

    if (partes.length > 1) {

        const formatados = partes
            .map(formatarUmTelefone)
            .filter(Boolean);

        return formatados.length > 0
            ? formatados.join(" / ")
            : null;

    }

    return formatarUmTelefone(valor);
}


function formatarUmTelefone(valor) {

    let digitos = String(valor || "").replace(/\D/g, "");

    if (digitos.length === 0) {
        return null;
    }

    if (digitos.length > 11 && digitos.startsWith("55")) {
        digitos = digitos.slice(2);
    }

    if (digitos.length === 11) {
        return digitos.replace(
            /(\d{2})(\d{5})(\d{4})/,
            "($1) $2-$3"
        );
    }

    if (digitos.length === 10) {
        return digitos.replace(
            /(\d{2})(\d{4})(\d{4})/,
            "($1) $2-$3"
        );
    }

    return digitos;
}

module.exports = { formatarTelefone };