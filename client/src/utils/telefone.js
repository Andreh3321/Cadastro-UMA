export function formatarTelefone(valor) {

    const texto = String(valor || "");

    // Se já tem separador de múltiplos números, não mexe
    // (evita o auto-formatador brigar com o usuário)
    if (/[\/,;]/.test(texto)) {
        return texto;
    }

    let digitos = texto.replace(/\D/g, "");

    digitos = digitos.slice(0, 11);

    if (digitos.length > 6) {

        const ddd = digitos.slice(0, 2);
        const meio = digitos.length === 11
            ? digitos.slice(2, 7)
            : digitos.slice(2, 6);
        const fim = digitos.length === 11
            ? digitos.slice(7)
            : digitos.slice(6);

        return `(${ddd}) ${meio}${fim ? "-" + fim : ""}`;
    }

    if (digitos.length > 2) {
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    }

    return digitos;
}