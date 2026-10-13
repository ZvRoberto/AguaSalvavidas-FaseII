
/*
 * GREAT VALUE - FASE II
 * Módulo de Dualidad
 *
 * Hasta 20 variables y 20 restricciones.
 *
 * Convención:
 * Las variables del primal son no negativas.
 * Las restricciones pueden ser <=, >= o =.
 *
 * Este módulo construye el dual y verifica
 * soluciones propuestas. No ejecuta un
 * algoritmo de optimización automáticamente.
 */

"use strict";

const DUAL_EPS = 1e-7;
const DUAL_MAX = 20;

let modeloDualidad = null;
let problemaPrimal = null;
let problemaDual = null;

// =====================================================
// UTILIDADES
// =====================================================

function dualElemento(id) {
    return document.getElementById(id);
}

function dualMostrarError(mensaje) {
    const caja = dualElemento("dualError");
    caja.textContent = mensaje;
    caja.classList.remove("oculto");
}

function dualOcultarError() {
    const caja = dualElemento("dualError");
    caja.textContent = "";
    caja.classList.add("oculto");
}

function dualNumero(id) {
    const input = dualElemento(id);

    if (!input || input.value.trim() === "") {
        throw new Error(
            "Completa todos los campos numéricos."
        );
    }

    const valor = Number(input.value);

    if (!Number.isFinite(valor)) {
        throw new Error(
            "Todos los coeficientes deben ser números válidos."
        );
    }

    return valor;
}

function dualCantidad(id) {
    const valor = dualNumero(id);

    if (
        !Number.isInteger(valor) ||
        valor < 1 ||
        valor > DUAL_MAX
    ) {
        throw new Error(
            "Las dimensiones deben ser enteros entre 1 y 20."
        );
    }

    return valor;
}

function dualFormato(numero) {
    if (!Number.isFinite(numero)) {
        return String(numero);
    }

    const limpio = Math.abs(numero) < DUAL_EPS
        ? 0
        : numero;

    return Number(limpio.toFixed(6)).toString();
}

function dualCampo(id, valor = 0) {
    return `
        <input
            type="number"
            step="any"
            id="${id}"
            value="${valor}"
            class="dual-input">
    `;
}

function dualSimbolo(signo) {
    if (signo === "<=") return "≤";
    if (signo === ">=") return "≥";
    return "=";
}

function dualProductoPunto(a, b) {
    return a.reduce(
        (total, valor, i) => total + valor * b[i],
        0
    );
}

// =====================================================
// GENERAR FORMULARIO
// =====================================================

function generarDualidad() {
    dualOcultarError();

    try {
        const n = dualCantidad("dualVariables");
        const m = dualCantidad("dualRestricciones");
        const tipo = dualElemento("dualTipo").value;

        if (tipo !== "max" && tipo !== "min") {
            throw new Error(
                "Selecciona un tipo de optimización válido."
            );
        }

        modeloDualidad = { n, m, tipo };
        problemaPrimal = null;
        problemaDual = null;

        let html = `
            <h3>Función objetivo</h3>
            <p class="dual-ayuda">
                Ingresa los coeficientes de las
                ${n} variables de decisión.
            </p>
            <div class="dual-fila">
        `;

        for (let j = 0; j < n; j++) {
            html += `
                <label>
                    X${j + 1}
                    ${dualCampo("dualC" + j)}
                </label>
            `;
        }

        html += `
            </div>
            <h3>Restricciones del primal</h3>
            <div class="dual-tabla-scroll">
                <table class="dual-tabla">
                    <thead>
                        <tr>
                            <th>Restricción</th>
        `;

        for (let j = 0; j < n; j++) {
            html += `<th>X${j + 1}</th>`;
        }

        html += `
                            <th>Signo</th>
                            <th>Resultado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (let i = 0; i < m; i++) {
            html += `<tr><th>R${i + 1}</th>`;

            for (let j = 0; j < n; j++) {
                html += `
                    <td>
                        ${dualCampo(
                            "dualA" + i + "_" + j
                        )}
                    </td>
                `;
            }

            html += `
                <td>
                    <select id="dualSigno${i}">
                        <option value="<=">≤</option>
                        <option value=">=">≥</option>
                        <option value="=">=</option>
                    </select>
                </td>
                <td>
                    ${dualCampo("dualB" + i)}
                </td>
            </tr>
            `;
        }

        html += `
                    </tbody>
                </table>
            </div>

            <p class="dual-ayuda">
                Se supone que X1, X2, ..., X${n} ≥ 0.
                Los coeficientes pueden ser positivos,
                negativos o cero.
            </p>
        `;

        dualElemento("dualFormulario").innerHTML = html;

        dualElemento("dualPanelModelo")
            .classList.remove("oculto");

        dualElemento("dualResultados")
            .classList.add("oculto");

    } catch (error) {
        dualMostrarError(error.message);
    }
}

// =====================================================
// LEER PROBLEMA PRIMAL
// =====================================================

function dualLeerDatos() {
    if (!modeloDualidad) {
        throw new Error(
            "Primero debes generar el modelo."
        );
    }

    const { n, m, tipo } = modeloDualidad;

    if (
        dualCantidad("dualVariables") !== n ||
        dualCantidad("dualRestricciones") !== m ||
        dualElemento("dualTipo").value !== tipo
    ) {
        throw new Error(
            "Cambiaste la configuración. " +
            "Genera nuevamente el modelo."
        );
    }

    const c = [];
    const A = [];
    const b = [];
    const signos = [];

    for (let j = 0; j < n; j++) {
        c.push(dualNumero("dualC" + j));
    }

    for (let i = 0; i < m; i++) {
        const fila = [];

        for (let j = 0; j < n; j++) {
            fila.push(
                dualNumero("dualA" + i + "_" + j)
            );
        }

        A.push(fila);
        b.push(dualNumero("dualB" + i));

        const signo = dualElemento(
            "dualSigno" + i
        ).value;

        if (!["<=", ">=", "="].includes(signo)) {
            throw new Error(
                "Signo no válido en la restricción " +
                (i + 1)
            );
        }

        signos.push(signo);
    }

    return { n, m, tipo, c, A, b, signos };
}

// =====================================================
// CONSTRUIR DUAL
// =====================================================

function dualConstruir(primal) {
    const { n, m, tipo, c, A, b, signos } = primal;

    const tipoDual =
        tipo === "max" ? "min" : "max";

    const signoDual =
        tipo === "max" ? ">=" : "<=";

    // Signos de las variables duales.
    const signosVariables = signos.map(signo => {
        if (signo === "=") {
            return "libre";
        }

        if (tipo === "max") {
            return signo === "<="
                ? ">=0"
                : "<=0";
        }

        return signo === ">="
            ? ">=0"
            : "<=0";
    });

    // Transponer matriz A.
    const AT = [];

    for (let j = 0; j < n; j++) {
        const fila = [];

        for (let i = 0; i < m; i++) {
            fila.push(A[i][j]);
        }

        AT.push(fila);
    }

    return {
        n: m,
        m: n,
        tipo: tipoDual,
        c: [...b],
        A: AT,
        b: [...c],
        signos: Array(n).fill(signoDual),
        signosVariables
    };
}

// =====================================================
// FORMATEAR EXPRESIONES
// =====================================================

function dualExpresion(coeficientes, letra) {
    let texto = "";

    coeficientes.forEach((coeficiente, i) => {
        if (Math.abs(coeficiente) < DUAL_EPS) {
            return;
        }

        const negativo = coeficiente < 0;
        const magnitud = Math.abs(coeficiente);

        const numero =
            Math.abs(magnitud - 1) < DUAL_EPS
                ? ""
                : dualFormato(magnitud);

        const termino =
            numero + letra + (i + 1);

        if (texto === "") {
            texto = negativo
                ? "-" + termino
                : termino;
        } else {
            texto += negativo
                ? " - " + termino
                : " + " + termino;
        }
    });

    return texto || "0";
}

// =====================================================
// MOSTRAR MODELO
// =====================================================

function dualMostrarModelo(modelo, letra) {
    const tipo = modelo.tipo === "max"
        ? "Maximizar"
        : "Minimizar";

    let html = `
        <p>
            <strong>${tipo}</strong>
            Z = ${dualExpresion(modelo.c, letra)}
        </p>
        <p><strong>Sujeto a:</strong></p>
        <div class="dual-ecuaciones">
    `;

    modelo.A.forEach((fila, i) => {
        html += `
            <p>
                ${dualExpresion(fila, letra)}
                ${dualSimbolo(modelo.signos[i])}
                ${dualFormato(modelo.b[i])}
            </p>
        `;
    });

    html += `</div>`;

    if (modelo.signosVariables) {
        html += `
            <p>
                <strong>Signos de las variables:</strong>
            </p>
        `;

        modelo.signosVariables.forEach((signo, i) => {
            const descripcion =
                signo === "libre"
                    ? "libre (sin restricción de signo)"
                    : signo === ">=0"
                        ? "≥ 0"
                        : "≤ 0";

            html += `
                <p>Y${i + 1}: ${descripcion}</p>
            `;
        });
    } else {
        html += `
            <p>
                Todas las variables X son ≥ 0.
            </p>
        `;
    }

    return html;
}

// =====================================================
// FORMULARIO DE COMPROBACIÓN
// =====================================================

function dualFormularioVerificacion(primal, dual) {
    let html = `
        <div class="dual-verificacion">
            <h3>Comprobar soluciones propuestas</h3>

            <p class="dual-ayuda">
                Ingresa los valores de las variables
                del primal y del dual. Se verificará
                si cumplen las restricciones y
                se calculará la brecha de dualidad.
            </p>

            <h4>Variables del primal</h4>
            <div class="dual-fila">
    `;

    for (let j = 0; j < primal.n; j++) {
        html += `
            <label>
                X${j + 1}
                ${dualCampo("dualVerX" + j)}
            </label>
        `;
    }

    html += `
            </div>
            <h4>Variables del dual</h4>
            <div class="dual-fila">
    `;

    for (let i = 0; i < dual.n; i++) {
        html += `
            <label>
                Y${i + 1}
                ${dualCampo("dualVerY" + i)}
            </label>
        `;
    }

    html += `
            </div>

            <button
                type="button"
                class="dual-btn"
                onclick="dualVerificarSoluciones()">
                Comprobar soluciones
            </button>

            <div id="dualComprobacion"></div>
        </div>
    `;

    return html;
}

// =====================================================
// VERIFICAR FACTIBILIDAD
// =====================================================

function dualEsFactible(modelo, valores, esDual = false) {
    if (
        !Array.isArray(valores) ||
        valores.length !== modelo.n
    ) {
        return false;
    }

    for (let j = 0; j < valores.length; j++) {
        const valor = valores[j];

        if (!Number.isFinite(valor)) {
            return false;
        }

        if (!esDual && valor < -DUAL_EPS) {
            return false;
        }

        if (esDual) {
            const signo = modelo.signosVariables[j];

            if (signo === ">=0" && valor < -DUAL_EPS) {
                return false;
            }

            if (signo === "<=0" && valor > DUAL_EPS) {
                return false;
            }
        }
    }

    for (let i = 0; i < modelo.m; i++) {
        const izquierda = dualProductoPunto(
            modelo.A[i],
            valores
        );

        const derecha = modelo.b[i];

        const tolerancia = DUAL_EPS * Math.max(
            1,
            Math.abs(izquierda),
            Math.abs(derecha)
        );

        const signo = modelo.signos[i];

        if (
            signo === "<=" &&
            izquierda > derecha + tolerancia
        ) {
            return false;
        }

        if (
            signo === ">=" &&
            izquierda < derecha - tolerancia
        ) {
            return false;
        }

        if (
            signo === "=" &&
            Math.abs(izquierda - derecha) > tolerancia
        ) {
            return false;
        }
    }

    return true;
}

// =====================================================
// COMPROBAR SOLUCIONES
// =====================================================

function dualVerificarSoluciones() {
    const contenedor = dualElemento(
        "dualComprobacion"
    );

    if (!problemaPrimal || !problemaDual) {
        contenedor.textContent =
            "Primero debes construir el problema dual.";
        return;
    }

    try {
        const x = [];
        const y = [];

        for (let j = 0; j < problemaPrimal.n; j++) {
            x.push(
                dualNumero("dualVerX" + j)
            );
        }

        for (let i = 0; i < problemaDual.n; i++) {
            y.push(
                dualNumero("dualVerY" + i)
            );
        }

        const primalFactible = dualEsFactible(
            problemaPrimal,
            x,
            false
        );

        const dualFactible = dualEsFactible(
            problemaDual,
            y,
            true
        );

        const valorPrimal = dualProductoPunto(
            problemaPrimal.c,
            x
        );

        const valorDual = dualProductoPunto(
            problemaDual.c,
            y
        );

        const brecha = problemaPrimal.tipo === "max"
            ? valorDual - valorPrimal
            : valorPrimal - valorDual;

        const tolerancia = DUAL_EPS * Math.max(
            1,
            Math.abs(valorPrimal),
            Math.abs(valorDual)
        );

        let conclusion = "";

        if (!primalFactible || !dualFactible) {
            conclusion =
                "No se puede confirmar optimalidad porque " +
                "una o ambas soluciones no son factibles.";
        } else if (Math.abs(brecha) <= tolerancia) {
            conclusion =
                "Ambas soluciones son factibles y sus " +
                "valores objetivos coinciden. Por dualidad " +
                "fuerte, ambas son óptimas.";
        } else {
            conclusion =
                "Ambas soluciones son factibles, pero " +
                "sus valores objetivos son diferentes. " +
                "La brecha indica que todavía no se " +
                "ha demostrado optimalidad.";
        }

        contenedor.innerHTML = `
            <div class="dual-resumen">
                <h4>Resultado de la comprobación</h4>

                <p>
                    <strong>Primal factible:</strong>
                    ${primalFactible ? "Sí" : "No"}
                </p>

                <p>
                    <strong>Dual factible:</strong>
                    ${dualFactible ? "Sí" : "No"}
                </p>

                <p>
                    <strong>Valor del primal:</strong>
                    ${dualFormato(valorPrimal)}
                </p>

                <p>
                    <strong>Valor del dual:</strong>
                    ${dualFormato(valorDual)}
                </p>

                <p>
                    <strong>Brecha de dualidad:</strong>
                    ${dualFormato(brecha)}
                </p>

                <p><strong>${conclusion}</strong></p>
            </div>
        `;

    } catch (error) {
        contenedor.textContent = error.message;
    }
}

// =====================================================
// RESOLVER: CONSTRUIR EL DUAL
// =====================================================

function resolverDualidad() {
    dualOcultarError();

    try {
        problemaPrimal = dualLeerDatos();
        problemaDual = dualConstruir(
            problemaPrimal
        );

        const contenedor = dualElemento(
            "dualContenido"
        );

        contenedor.innerHTML = `
            <div class="dual-modelos">

                <div class="dual-modelo">
                    <h3>Problema primal</h3>
                    ${dualMostrarModelo(
                        problemaPrimal,
                        "X"
                    )}
                </div>

                <div class="dual-modelo">
                    <h3>Problema dual</h3>
                    ${dualMostrarModelo(
                        problemaDual,
                        "Y"
                    )}
                </div>

            </div>

            <div class="dual-explicacion">
                <h3>Relación entre primal y dual</h3>

                <p>
                    El problema primal tiene
                    ${problemaPrimal.n} variables y
                    ${problemaPrimal.m} restricciones.
                    Su dual tiene
                    ${problemaDual.n} variables y
                    ${problemaDual.m} restricciones.
                </p>

                <p>
                    La matriz de coeficientes del dual
                    es la transpuesta de la matriz del
                    primal. Los coeficientes de la
                    función objetivo y los términos
                    independientes intercambian sus
                    posiciones.
                </p>

                <p>
                    Si ambos problemas tienen soluciones
                    óptimas finitas, sus valores objetivos
                    son iguales.
                </p>
            </div>

            ${dualFormularioVerificacion(
                problemaPrimal,
                problemaDual
            )}
        `;

        dualElemento("dualResultados")
            .classList.remove("oculto");

    } catch (error) {
        dualElemento("dualResultados")
            .classList.add("oculto");

        dualMostrarError(error.message);
    }
}

// =====================================================
// CARGAR EJEMPLO
// =====================================================

function ejemploDualidad() {
    dualElemento("dualVariables").value = 2;
    dualElemento("dualRestricciones").value = 2;
    dualElemento("dualTipo").value = "max";

    generarDualidad();

    const valores = {
        dualC0: 3,
        dualC1: 5,

        dualA0_0: 1,
        dualA0_1: 2,
        dualB0: 8,

        dualA1_0: 3,
        dualA1_1: 2,
        dualB1: 12
    };

    Object.entries(valores).forEach(([id, valor]) => {
        dualElemento(id).value = valor;
    });

    dualElemento("dualSigno0").value = "<=";
    dualElemento("dualSigno1").value = "<=";
}

// =====================================================
// LIMPIAR
// =====================================================

function limpiarDualidad() {
    modeloDualidad = null;
    problemaPrimal = null;
    problemaDual = null;

    dualElemento("dualVariables").value = 2;
    dualElemento("dualRestricciones").value = 2;
    dualElemento("dualTipo").value = "max";

    dualElemento("dualFormulario").innerHTML = "";
    dualElemento("dualContenido").innerHTML = "";

    dualElemento("dualPanelModelo")
        .classList.add("oculto");

    dualElemento("dualResultados")
        .classList.add("oculto");

    dualOcultarError();
}
