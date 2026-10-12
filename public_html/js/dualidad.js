
/*
 * AGUA SALVAVIDAS
 * Módulo de Dualidad
 *
 * Convención:
 * Todas las variables del primal son >= 0.
 * Las restricciones pueden ser <=, >= o =.
 *
 * El dual se construye automáticamente.
 */

"use strict";

const DUAL_EPS = 1e-7;

let modeloDualidad = null;

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
        valor > 6
    ) {
        throw new Error(
            "Las dimensiones deben ser enteros entre 1 y 6."
        );
    }

    return valor;
}

function dualFormato(numero) {
    const limpio = Math.abs(numero) < DUAL_EPS
        ? 0
        : numero;

    return Number(limpio.toFixed(6)).toString();
}

function dualCampo(id, valor = 0) {
    return `
        <input type="number"
               step="any"
               id="${id}"
               value="${valor}"
               class="dual-input">
    `;
}

/*
 * PASO 1:
 * GENERAR FORMULARIO DINÁMICO
 */

function generarDualidad() {
    dualOcultarError();

    try {
        const n = dualCantidad("dualVariables");
        const m = dualCantidad("dualRestricciones");
        const tipo = dualElemento("dualTipo").value;

        modeloDualidad = { n, m, tipo };

        let html = `
            <h3>Función objetivo</h3>
            <p class="dual-ayuda">
                Coeficientes de X1, X2, ... X${n}.
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
            <h3>Restricciones</h3>
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
                        ${dualCampo("dualA" + i + "_" + j)}
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
                Se considera X1, X2, ..., X${n} ≥ 0.
                Los coeficientes pueden ser negativos,
                cero o positivos.
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

/*
 * PASO 2:
 * LEER LOS DATOS DEL PRIMAL
 */

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
        signos.push(
            dualElemento("dualSigno" + i).value
        );
    }

    return { n, m, tipo, c, A, b, signos };
}

/*
 * PASO 3:
 * CONSTRUIR EL PROBLEMA DUAL
 *
 * Si primal es MAX:
 *   dual es MIN
 *   restricciones duales >=
 *
 * Si primal es MIN:
 *   dual es MAX
 *   restricciones duales <=
 *
 * Cada restricción primal genera
 * una variable dual.
 *
 * Cada variable primal genera
 * una restricción dual.
 */

function dualConstruir(primal) {
    const {
        n, m, tipo, c, A, b, signos
    } = primal;

    const tipoDual =
        tipo === "max" ? "min" : "max";

    const signoDual =
        tipo === "max" ? ">=" : "<=";

    const signosVariables = signos.map(signo => {
        if (signo === "=") {
            return "libre";
        }

        if (tipo === "max") {
            return signo === "<=" ? ">=0" : "<=0";
        }

        return signo === ">=" ? ">=0" : "<=0";
    });

    // Transpuesta de la matriz A.
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

function dualSimbolo(signo) {
    if (signo === "<=") return "≤";
    if (signo === ">=") return "≥";
    return "=";
}

/*
 * FORMATO DE EXPRESIONES
 */

function dualExpresion(coeficientes, letra) {
    let texto = "";

    coeficientes.forEach((coeficiente, i) => {
        if (Math.abs(coeficiente) < DUAL_EPS) {
            return;
        }

        const negativo = coeficiente < 0;
        const magnitud = Math.abs(coeficiente);

        const numero = Math.abs(magnitud - 1) < DUAL_EPS
            ? ""
            : dualFormato(magnitud);

        const termino = numero + letra + (i + 1);

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
        html += `<p><strong>Signos de las variables:</strong></p>`;

        modelo.signosVariables.forEach((signo, i) => {
            const descripcion = signo === "libre"
                ? "libre (sin restricción de signo)"
                : signo === ">=0"
                    ? "≥ 0"
                    : "≤ 0";

            html += `<p>Y${i + 1} ${descripcion}</p>`;
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

/*
 * PASO 4:
 * CREAR CAMPOS PARA COMPROBAR
 * SOLUCIONES PROPUESTAS
 */

function dualFormularioVerificacion(primal, dual) {
    let html = `
        <div class="dual-verificacion">
            <h3>Comprobar soluciones propuestas</h3>

            <p class="dual-ayuda">
                Introduce valores para las variables
                del primal y del dual. El simulador
                comprobará su factibilidad y calculará
                la brecha de dualidad.
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

            <button class="dual-btn"
                    onclick="dualVerificarSoluciones()">
                Comprobar soluciones
            </button>

            <div id="dualComprobacion"></div>
        </div>
    `;

    return html;
}

/*
 * VERIFICAR RESTRICCIONES
 */

function dualEsFactible(modelo, valores, dual = false) {
    for (let j = 0; j < valores.length; j++) {
        const x = valores[j];

        if (!dual && x < -DUAL_EPS) {
            return false;
        }

        if (dual) {
            const signo = modelo.signosVariables[j];

            if (signo === ">=0" && x < -DUAL_EPS) {
                return false;
            }

            if (signo === "<=0" && x > DUAL_EPS) {
                return false;
            }
        }
    }

    for (let i = 0; i < modelo.m; i++) {
        const izquierda = modelo.A[i].reduce(
            (suma, a, j) => suma + a * valores[j],
            0
        );

        const derecha = modelo.b[i];

        const tolerancia = DUAL_EPS *
            Math.max(
                1,
                Math.abs(izquierda),
                Math.abs(derecha)
            );

        if (
            modelo.signos[i] === "<=" &&
            izquierda > derecha + tolerancia
        ) {
            return false;
        }

        if (
            modelo.signos[i] === ">=" &&
            izquierda < derecha - tolerancia
        ) {
            return false;
        }

        if (
            modelo.signos[i] === "=" &&
            Math.abs(izquierda - derecha) > tolerancia
        ) {
            return false;
        }
    }

    return true;
}

function dualEvaluar(c, valores) {
    return c.reduce(
        (suma, coeficiente, j) =>
            suma + coeficiente * valores[j],
        0
    );
}

let dualPrimalActual = null;
let dualModeloActual = null;

function dualVerificarSoluciones() {
    dualOcultarError();

    try {
        const primal = dualPrimalActual;
        const dual = dualModeloActual;

        if (!primal || !dual) {
            throw new Error(
                "Primero debes construir el dual."
            );
        }

        const x = [];
        const y = [];

        for (let j = 0; j < primal.n; j++) {
            x.push(dualNumero("dualVerX" + j));
        }

        for (let i = 0; i < dual.n; i++) {
            y.push(dualNumero("dualVerY" + i));
        }

        const factiblePrimal =
            dualEsFactible(primal, x, false);

        const factibleDual =
            dualEsFactible(dual, y, true);

        const zp = dualEvaluar(primal.c, x);
        const zd = dualEvaluar(dual.c, y);

        const brecha = primal.tipo === "max"
            ? zd - zp
            : zp - zd;

        const tolerancia = DUAL_EPS *
            Math.max(1, Math.abs(zp), Math.abs(zd));

        let mensaje = `
            <p>Valor primal: <strong>${dualFormato(zp)}</strong></p>
            <p>Valor dual: <strong>${dualFormato(zd)}</strong></p>
            <p>Brecha: <strong>${dualFormato(brecha)}</strong></p>
            <p>Primal factible:
                <strong>${factiblePrimal ? "Sí" : "No"}</strong>
            </p>
            <p>Dual factible:
                <strong>${factibleDual ? "Sí" : "No"}</strong>
            </p>
        `;

        if (!factiblePrimal || !factibleDual) {
            mensaje += `
                <p>
                    Las soluciones propuestas no permiten
                    certificar optimalidad porque alguna
                    no cumple las restricciones.
                </p>
            `;
        } else if (Math.abs(brecha) <= tolerancia) {
            mensaje += `
                <p class="dual-exito">
                    ✓ Dualidad fuerte:
                    ambas soluciones son óptimas.
                    La brecha es cero.
                </p>
            `;
        } else {
            mensaje += `
                <p>
                    Las soluciones son factibles,
                    pero la brecha no es cero.
                    No se ha certificado optimalidad.
                </p>
            `;
        }

        dualElemento("dualComprobacion").innerHTML = mensaje;

    } catch (error) {
        dualMostrarError(error.message);
    }
}

/*
 * PASO 5:
 * RESOLVER LA TRANSFORMACIÓN
 */

function resolverDualidad() {
    dualOcultarError();

    try {
        const primal = dualLeerDatos();
        const dual = dualConstruir(primal);

        dualPrimalActual = primal;
        dualModeloActual = dual;

        let html = `
            <div class="dual-resultado-grid">
                <div class="dual-modelo">
                    <h3>Problema primal</h3>
                    ${dualMostrarModelo(primal, "X")}
                </div>

                <div class="dual-modelo">
                    <h3>Problema dual</h3>
                    ${dualMostrarModelo(dual, "Y")}
                </div>
            </div>

            <div class="dual-procedimiento">
                <h3>Procedimiento de transformación</h3>

                <ol>
                    <li>
                        Se cambia el tipo de optimización:
                        ${primal.tipo === "max"
                            ? "MAX → MIN"
                            : "MIN → MAX"}.
                    </li>
                    <li>
                        Las ${primal.m} restricciones
                        del primal generan
                        ${dual.n} variables duales.
                    </li>
                    <li>
                        Las ${primal.n} variables
                        del primal generan
                        ${dual.m} restricciones duales.
                    </li>
                    <li>
                        La matriz de coeficientes
                        se transpone: A → Aᵀ.
                    </li>
                    <li>
                        Los resultados del primal
                        se convierten en coeficientes
                        de la función objetivo dual.
                    </li>
                    <li>
                        Los coeficientes de la función
                        objetivo primal se convierten
                        en resultados del dual.
                    </li>
                    <li>
                        Los signos de las variables duales
                        dependen de las restricciones
                        originales.
                    </li>
                </ol>
            </div>
        `;

        html += dualFormularioVerificacion(primal, dual);

        dualElemento("dualContenido").innerHTML = html;

        dualElemento("dualResultados")
            .classList.remove("oculto");

    } catch (error) {
        dualElemento("dualResultados")
            .classList.add("oculto");

        dualMostrarError(error.message);
    }
}

/*
 * EJEMPLO:
 *
 * Max Z = 3X1 + 5X2
 *
 * X1       <= 4
 *      2X2 <= 12
 * 3X1 + 2X2 <= 18
 *
 * Óptimo:
 * X1 = 2, X2 = 6, Z = 36
 */

function ejemploDualidad() {
    dualElemento("dualVariables").value = 2;
    dualElemento("dualRestricciones").value = 3;
    dualElemento("dualTipo").value = "max";

    generarDualidad();

    const c = [3, 5];
    const A = [
        [1, 0],
        [0, 2],
        [3, 2]
    ];
    const b = [4, 12, 18];

    c.forEach((valor, j) => {
        dualElemento("dualC" + j).value = valor;
    });

    A.forEach((fila, i) => {
        fila.forEach((valor, j) => {
            dualElemento(
                "dualA" + i + "_" + j
            ).value = valor;
        });

        dualElemento("dualB" + i).value = b[i];
        dualElemento("dualSigno" + i).value = "<=";
    });
}

function limpiarDualidad() {
    modeloDualidad = null;
    dualPrimalActual = null;
    dualModeloActual = null;

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
