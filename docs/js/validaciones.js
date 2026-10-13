/*
 * ==========================================================
 * VALIDACIONES GENERALES
 * Simulador de Investigación de Operaciones
 * Agua Salvavidas
 * ==========================================================
 */


/*
 * Comprueba si un texto representa
 * un número real válido.
 */
function esNumeroValido(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return false;
    }

    const texto =
        String(valor).trim();

    if (texto === "") {
        return false;
    }

    const numero =
        Number(texto);

    return Number.isFinite(numero);
}


/*
 * Convierte un valor a número.
 * Devuelve null si no es válido.
 */
function convertirANumero(valor) {

    if (!esNumeroValido(valor)) {
        return null;
    }

    return Number(valor);
}


/*
 * Comprueba que un número sea
 * mayor o igual que cero.
 */
function esNoNegativo(valor) {

    const numero =
        convertirANumero(valor);

    if (numero === null) {
        return false;
    }

    return numero >= 0;
}


/*
 * Comprueba que un número sea
 * estrictamente mayor que cero.
 */
function esPositivo(valor) {

    const numero =
        convertirANumero(valor);

    if (numero === null) {
        return false;
    }

    return numero > 0;
}


/*
 * Comprueba que sea un entero
 * dentro de un intervalo.
 */
function enteroEnRango(
    valor,
    minimo,
    maximo
) {

    const numero =
        Number(valor);

    return (
        Number.isInteger(numero) &&
        numero >= minimo &&
        numero <= maximo
    );
}


/*
 * Marca visualmente un campo
 * como incorrecto.
 */
function marcarCampoInvalido(input) {

    if (!input) {
        return;
    }

    input.classList.add(
        "campo-invalido"
    );
}


/*
 * Quita la marca de error.
 */
function limpiarCampoInvalido(input) {

    if (!input) {
        return;
    }

    input.classList.remove(
        "campo-invalido"
    );
}


/*
 * Valida un input numérico.
 */
function validarInputNumerico(
    input,
    permitirNegativos = true
) {

    if (!input) {
        return false;
    }

    const valor =
        input.value.trim();

    if (!esNumeroValido(valor)) {

        marcarCampoInvalido(input);

        return false;
    }

    const numero =
        Number(valor);

    if (
        !permitirNegativos &&
        numero < 0
    ) {

        marcarCampoInvalido(input);

        return false;
    }

    limpiarCampoInvalido(input);

    return true;
}


/*
 * Comprueba si dos números son
 * prácticamente iguales.
 *
 * Esto evita problemas con decimales
 * de JavaScript.
 */
function numerosIguales(
    a,
    b,
    tolerancia = 1e-9
) {

    return (
        Math.abs(a - b) <=
        tolerancia
    );
}


/*
 * Redondeo seguro para mostrar
 * resultados.
 */
function redondearNumero(
    numero,
    decimales = 4
) {

    if (!Number.isFinite(numero)) {
        return numero;
    }

    const factor =
        Math.pow(
            10,
            decimales
        );

    return (
        Math.round(
            (numero + Number.EPSILON) *
            factor
        ) /
        factor
    );
}


/*
 * Suma segura de un arreglo
 * de números.
 */
function sumarValores(valores) {

    return valores.reduce(
        (total, valor) => {

            const numero =
                Number(valor);

            if (
                Number.isFinite(numero)
            ) {

                return total + numero;
            }

            return total;

        },
        0
    );
}


/*
 * Evita resultados visuales como -0.
 */
function eliminarCeroNegativo(
    numero,
    tolerancia = 1e-9
) {

    if (
        Math.abs(numero) <
        tolerancia
    ) {

        return 0;
    }

    return numero;
}


/*
 * Escapa texto antes de insertarlo
 * dinámicamente dentro de HTML.
 */
function escaparHTML(texto) {

    return String(texto)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/*
 * Limpia las marcas rojas de todos
 * los inputs de una sección.
 */
function limpiarErroresSeccion(
    selector
) {

    document
        .querySelectorAll(
            selector
        )
        .forEach(
            elemento => {

                elemento.classList.remove(
                    "campo-invalido"
                );
            }
        );
}


/*
 * Comprueba que un arreglo no
 * contenga NaN o Infinity.
 */
function arregloNumericoValido(
    arreglo
) {

    return arreglo.every(
        valor =>
            Number.isFinite(
                Number(valor)
            )
    );
}


/*
 * Comprueba una matriz completa.
 */
function matrizNumericaValida(
    matriz
) {

    if (!Array.isArray(matriz)) {
        return false;
    }

    return matriz.every(
        fila =>
            Array.isArray(fila) &&
            arregloNumericoValido(fila)
    );
}
