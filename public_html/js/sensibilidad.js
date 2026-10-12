
/*
 * AGUA SALVAVIDAS
 * FASE II - ANÁLISIS DE SENSIBILIDAD
 *
 * Modelo:
 * Maximizar Z = c'x
 * Sujeto a Ax <= b
 * x >= 0, b >= 0
 *
 * Funcionalidades:
 * 1. Generación del modelo
 * 2. Validación de datos
 * 3. Resolución por Simplex
 * 4. Precios sombra
 * 5. Rangos de recursos
 * 6. Rangos de coeficientes objetivo
 * 7. Simulación de escenarios
 * 8. Procedimiento paso a paso
 */

"use strict";

const SEN_EPS = 1e-8;
const SEN_MAX_ITER = 300;

let senDimension = null;
let senModeloActual = null;
let senSolucionActual = null;

function senEl(id) {
    return document.getElementById(id);
}

/* ==========================================
   VALIDACIONES
   ========================================== */

function senError(mensaje) {
    const caja = senEl("senError");
    caja.textContent = mensaje;
    caja.classList.remove("oculto");
}

function senOcultarError() {
    const caja = senEl("senError");
    caja.textContent = "";
    caja.classList.add("oculto");
}

function senNumero(id) {
    const elemento = senEl(id);

    if (!elemento || elemento.value.trim() === "") {
        throw new Error("Completa todos los campos.");
    }

    const valor = Number(elemento.value);

    if (!Number.isFinite(valor)) {
        throw new Error("Ingresa números válidos.");
    }

    return valor;
}

function senCantidad(id) {
    const valor = senNumero(id);

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

function senFmt(valor) {
    if (valor === Infinity) return "+∞";
    if (valor === -Infinity) return "-∞";

    const limpio =
        Math.abs(valor) < SEN_EPS ? 0 : valor;

    return Number(limpio.toFixed(5)).toString();
}

function senInput(id, valor = 0) {
    return `
        <input
            type="number"
            step="any"
            id="${id}"
            value="${valor}"
        >
    `;
}

/* ==========================================
   GENERAR MODELO
   ========================================== */

function senGenerar() {
    senOcultarError();

    try {
        const n = senCantidad("senN");
        const m = senCantidad("senM");

        senDimension = { n, m };
        senModeloActual = null;
        senSolucionActual = null;

        let html = `
            <h3>Función objetivo: Maximizar Z</h3>
            <div class="sen-campos">
        `;

        for (let j = 0; j < n; j++) {
            html += `
                <label>
                    Beneficio de X${j + 1}
                    ${senInput("senC" + j)}
                </label>
            `;
        }

        html += `
            </div>

            <h3>Restricciones (≤)</h3>

            <div class="sen-tabla-scroll">
                <table class="sen-tabla">
                    <thead>
                        <tr>
                            <th>Recurso</th>
        `;

        for (let j = 0; j < n; j++) {
            html += `<th>X${j + 1}</th>`;
        }

        html += `
                            <th>Signo</th>
                            <th>Disponible</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (let i = 0; i < m; i++) {
            html += `<tr><th>R${i + 1}</th>`;

            for (let j = 0; j < n; j++) {
                html += `
                    <td>
                        ${senInput("senA" + i + "_" + j)}
                    </td>
                `;
            }

            html += `
                <td>≤</td>
                <td>${senInput("senB" + i)}</td>
                </tr>
            `;
        }

        html += `
                    </tbody>
                </table>
            </div>

            <p class="sen-nota">
                Todas las variables son no negativas.
                Los recursos disponibles deben ser
                mayores o iguales que cero.
            </p>
        `;

        senEl("senFormulario").innerHTML = html;

        senEl("senModelo").classList.remove("oculto");
        senEl("senResultados").classList.add("oculto");

    } catch (error) {
        senError(error.message);
    }
}

/* ==========================================
   LEER DATOS
   ========================================== */

function senLeer() {
    if (!senDimension) {
        throw new Error(
            "Primero debes generar el modelo."
        );
    }

    const { n, m } = senDimension;

    if (
        senCantidad("senN") !== n ||
        senCantidad("senM") !== m
    ) {
        throw new Error(
            "Cambiaste las dimensiones. " +
            "Genera nuevamente el modelo."
        );
    }

    const c = [];
    const A = [];
    const b = [];

    for (let j = 0; j < n; j++) {
        c.push(senNumero("senC" + j));
    }

    for (let i = 0; i < m; i++) {
        const fila = [];

        for (let j = 0; j < n; j++) {
            fila.push(
                senNumero("senA" + i + "_" + j)
            );
        }

        const recurso = senNumero("senB" + i);

        if (recurso < 0) {
            throw new Error(
                "El recurso R" + (i + 1) +
                " debe ser no negativo."
            );
        }

        A.push(fila);
        b.push(recurso);
    }

    return { n, m, c, A, b };
}

/* ==========================================
   MÉTODO SIMPLEX
   ========================================== */

function senSimplex(modelo) {
    const { n, m, c, A, b } = modelo;

    const columnas = n + m;
    const rhs = columnas;

    const T = Array.from(
        { length: m + 1 },
        () => Array(columnas + 1).fill(0)
    );

    const base = [];

    // Construcción del tableau inicial.
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            T[i][j] = A[i][j];
        }

        T[i][n + i] = 1;
        T[i][rhs] = b[i];

        base.push(n + i);
    }

    // Función objetivo.
    for (let j = 0; j < n; j++) {
        T[m][j] = -c[j];
    }

    const pasos = [];

    function guardar(descripcion) {
        pasos.push({
            descripcion,
            base: [...base],
            tabla: T.map(fila => [...fila])
        });
    }

    guardar(
        "Tabla inicial con variables de holgura."
    );

    let estado = "limite";
    let iteraciones = 0;

    while (iteraciones < SEN_MAX_ITER) {

        let entrante = -1;

        // Regla de Bland.
        for (let j = 0; j < columnas; j++) {
            if (T[m][j] < -SEN_EPS) {
                entrante = j;
                break;
            }
        }

        // Si no hay negativos, alcanzamos el óptimo.
        if (entrante === -1) {
            estado = "optimo";
            break;
        }

        let saliente = -1;
        let mejorRazon = Infinity;

        // Prueba de razones.
        for (let i = 0; i < m; i++) {
            const divisor = T[i][entrante];

            if (divisor <= SEN_EPS) {
                continue;
            }

            const razon = T[i][rhs] / divisor;

            if (
                razon < mejorRazon - SEN_EPS ||
                (
                    Math.abs(razon - mejorRazon) <= SEN_EPS &&
                    (
                        saliente === -1 ||
                        base[i] < base[saliente]
                    )
                )
            ) {
                mejorRazon = razon;
                saliente = i;
            }
        }

        if (saliente === -1) {
            estado = "no_acotado";
            break;
        }

        const nombreVariable = indice => {
            return indice < n
                ? "X" + (indice + 1)
                : "S" + (indice - n + 1);
        };

        const variableEntrante =
            nombreVariable(entrante);

        const variableSaliente =
            nombreVariable(base[saliente]);

        const pivote = T[saliente][entrante];

        // Normalizar fila pivote.
        for (let j = 0; j <= rhs; j++) {
            T[saliente][j] /= pivote;
        }

        // Eliminar columna pivote.
        for (let i = 0; i <= m; i++) {
            if (i === saliente) {
                continue;
            }

            const factor = T[i][entrante];

            for (let j = 0; j <= rhs; j++) {
                T[i][j] -=
                    factor * T[saliente][j];

                if (Math.abs(T[i][j]) < SEN_EPS) {
                    T[i][j] = 0;
                }
            }
        }

        base[saliente] = entrante;
        iteraciones++;

        guardar(
            "Iteración " + iteraciones +
            ": entra " + variableEntrante +
            ", sale " + variableSaliente +
            ". Pivote = " + senFmt(pivote)
        );
    }

    // Comprobar optimalidad al alcanzar el límite.
    if (estado === "limite") {
        const existenNegativos = T[m]
            .slice(0, columnas)
            .some(valor => valor < -SEN_EPS);

        if (!existenNegativos) {
            estado = "optimo";
        }
    }

    // Obtener valores de las variables originales.
    const x = Array(n).fill(0);

    for (let i = 0; i < m; i++) {
        if (base[i] < n) {
            x[base[i]] = T[i][rhs];
        }
    }

    // Evaluar la función objetivo original.
    const z = x.reduce(
        (total, valor, j) =>
            total + valor * c[j],
        0
    );

    return {
        estado,
        x,
        z,
        T,
        base,
        pasos,
        iteraciones
    };
}

/* ==========================================
   PRECIOS SOMBRA Y RANGOS DE RECURSOS
   ========================================== */

function senRangosRHS(modelo, sol) {
    const { n, m, b } = modelo;

    const rhs = n + m;
    const rangos = [];

    for (let k = 0; k < m; k++) {

        let inferior = -Infinity;
        let superior = Infinity;

        for (let i = 0; i < m; i++) {

            const xBasica = sol.T[i][rhs];

            // Columna de B^-1 correspondiente
            // al recurso que se modifica.
            const direccion = sol.T[i][n + k];

            if (direccion > SEN_EPS) {
                inferior = Math.max(
                    inferior,
                    -xBasica / direccion
                );
            } else if (direccion < -SEN_EPS) {
                superior = Math.min(
                    superior,
                    -xBasica / direccion
                );
            }
        }

        rangos.push({
            recurso: k + 1,
            actual: b[k],

            deltaMin: inferior,
            deltaMax: superior,

            minimo: b[k] + inferior,
            maximo: b[k] + superior,

            precioSombra: sol.T[m][n + k]
        });
    }

    return rangos;
}

/* ==========================================
   RANGOS DE COEFICIENTES OBJETIVO
   FUNCIÓN CORREGIDA
   ========================================== */

function senRangosObjetivo(modelo, sol) {

    const { n, m, c } = modelo;

    const columnas = n + m;
    const resultados = [];

    // Analizar cada variable de decisión.
    for (let variable = 0; variable < n; variable++) {

        let inferior = -Infinity;
        let superior = Infinity;

        // Determinar si pertenece a la base.
        const posicionBasica =
            sol.base.indexOf(variable);

        // Analizar las columnas no básicas.
        for (let j = 0; j < columnas; j++) {

            if (sol.base.includes(j)) {
                continue;
            }

            /*
             * Tableau final:
             *
             * T[m][j] = Zj - Cj
             *
             * En maximización:
             *
             * Zj - Cj >= 0
             */

            const actual = sol.T[m][j];

            let pendiente = 0;

            if (posicionBasica >= 0) {

                /*
                 * VARIABLE BÁSICA
                 *
                 * Cambiar su coeficiente
                 * modifica los costos reducidos
                 * según la fila correspondiente.
                 *
                 * CORRECCIÓN:
                 * La pendiente es positiva.
                 */

                pendiente =
                    sol.T[posicionBasica][j];

            } else {

                /*
                 * VARIABLE NO BÁSICA
                 *
                 * Solo cambia directamente
                 * su propio costo reducido.
                 */

                pendiente =
                    j === variable ? -1 : 0;
            }

            /*
             * Condición:
             *
             * actual + pendiente * delta >= 0
             */

            if (pendiente > SEN_EPS) {

                inferior = Math.max(
                    inferior,
                    -actual / pendiente
                );

            } else if (pendiente < -SEN_EPS) {

                superior = Math.min(
                    superior,
                    -actual / pendiente
                );

            } else if (actual < -SEN_EPS) {

                throw new Error(
                    "La base actual no cumple " +
                    "las condiciones de optimalidad."
                );
            }
        }

        if (inferior > superior + SEN_EPS) {
            throw new Error(
                "No se pudo determinar un rango " +
                "válido para X" + (variable + 1)
            );
        }

        resultados.push({

            variable: variable + 1,

            actual: c[variable],

            minimo: c[variable] + inferior,

            maximo: c[variable] + superior,

            disminucionPermitida:
                inferior === -Infinity
                    ? Infinity
                    : Math.max(0, -inferior),

            aumentoPermitido:
                superior === Infinity
                    ? Infinity
                    : Math.max(0, superior)
        });
    }

    return resultados;
}

/* ==========================================
   NOMBRES DE COLUMNAS
   ========================================== */

function senNombreColumna(indice, n, m) {
    if (indice < n) {
        return "X" + (indice + 1);
    }

    if (indice < n + m) {
        return "S" + (indice - n + 1);
    }

    return "RHS";
}

/* ==========================================
   MOSTRAR PROCEDIMIENTO SIMPLEX
   ========================================== */

function senMostrarPasos(modelo, solucion) {
    const { n, m } = modelo;

    let html = "";

    solucion.pasos.forEach((paso, indice) => {

        html += `
            <div class="sen-iteracion">
                <h4>Tabla ${indice}</h4>
                <p>${paso.descripcion}</p>

                <div class="sen-tabla-scroll">
                    <table class="sen-tabla">
                        <thead>
                            <tr>
                                <th>Base</th>
        `;

        for (let j = 0; j <= n + m; j++) {
            html += `
                <th>
                    ${senNombreColumna(j, n, m)}
                </th>
            `;
        }

        html += `
                            </tr>
                        </thead>
                        <tbody>
        `;

        paso.tabla.forEach((fila, i) => {

            const nombre = i < m
                ? senNombreColumna(
                    paso.base[i], n, m
                )
                : "Z";

            html += `<tr><th>${nombre}</th>`;

            fila.forEach(valor => {
                html += `
                    <td>${senFmt(valor)}</td>
                `;
            });

            html += "</tr>";
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    return html;
}

/* ==========================================
   RESOLVER MODELO Y MOSTRAR RESULTADOS
   ========================================== */

function senResolver() {
    senOcultarError();

    senEl("senResultados").classList.add("oculto");

    // Invalidar análisis anterior hasta resolver
    // correctamente el modelo actual.
    senModeloActual = null;
    senSolucionActual = null;

    try {
        const modelo = senLeer();
        const solucion = senSimplex(modelo);

        if (solucion.estado !== "optimo") {

            if (solucion.estado === "no_acotado") {
                throw new Error(
                    "El problema es no acotado. " +
                    "No existe una solución óptima finita."
                );
            }

            throw new Error(
                "No se alcanzó el óptimo dentro " +
                "del límite de iteraciones."
            );
        }

        const rangosRHS =
            senRangosRHS(modelo, solucion);

        const rangosObjetivo =
            senRangosObjetivo(modelo, solucion);

        senModeloActual = modelo;
        senSolucionActual = solucion;

        let html = `
            <div class="sen-resumen">

                <div>
                    <small>Valor óptimo</small>
                    <strong>
                        Z = ${senFmt(solucion.z)}
                    </strong>
                </div>

                <div>
                    <small>Iteraciones</small>
                    <strong>
                        ${solucion.iteraciones}
                    </strong>
                </div>

            </div>

            <h3>Solución óptima</h3>

            <div class="sen-tabla-scroll">
                <table class="sen-tabla">
                    <thead>
                        <tr>
                            <th>Variable</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        solucion.x.forEach((valor, j) => {
            html += `
                <tr>
                    <td>X${j + 1}</td>
                    <td>${senFmt(valor)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>

            <h3>Precios sombra y rangos de recursos</h3>

            <p class="sen-nota">
                El precio sombra representa el cambio
                marginal del valor óptimo al aumentar
                una unidad de recurso, siempre que
                se mantenga la base óptima.

                Los rangos se calculan modificando
                un recurso a la vez.
            </p>

            <div class="sen-tabla-scroll">
                <table class="sen-tabla">
                    <thead>
                        <tr>
                            <th>Recurso</th>
                            <th>Disponible</th>
                            <th>Precio sombra</th>
                            <th>Mínimo</th>
                            <th>Máximo</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        rangosRHS.forEach(r => {
            html += `
                <tr>
                    <td>R${r.recurso}</td>
                    <td>${senFmt(r.actual)}</td>
                    <td>${senFmt(r.precioSombra)}</td>
                    <td>${senFmt(r.minimo)}</td>
                    <td>${senFmt(r.maximo)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>

            <h3>Rangos de coeficientes objetivo</h3>

            <p class="sen-nota">
                Los siguientes intervalos indican
                cuánto puede cambiar cada coeficiente
                de la función objetivo manteniendo
                óptima la base actual.

                Se modifica un coeficiente a la vez.
            </p>

            <div class="sen-tabla-scroll">
                <table class="sen-tabla">
                    <thead>
                        <tr>
                            <th>Variable</th>
                            <th>Actual</th>
                            <th>Mínimo</th>
                            <th>Máximo</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        rangosObjetivo.forEach(r => {
            html += `
                <tr>
                    <td>X${r.variable}</td>
                    <td>${senFmt(r.actual)}</td>
                    <td>${senFmt(r.minimo)}</td>
                    <td>${senFmt(r.maximo)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>

            <div class="sen-escenario">

                <h3>Simular un cambio</h3>

                <p>
                    Modifica un recurso disponible
                    o un beneficio unitario.
                    El simulador resolverá nuevamente
                    el problema.
                </p>

                <div class="sen-config">

                    <label>
                        Cambiar

                        <select
                            id="senCambioTipo"
                            onchange="senActualizarOpciones()"
                        >
                            <option value="b">
                                Recurso disponible
                            </option>

                            <option value="c">
                                Beneficio unitario
                            </option>
                        </select>
                    </label>

                    <label>
                        Elemento

                        <select
                            id="senCambioIndice"
                            onchange="senActualizarValor()"
                        ></select>
                    </label>

                    <label>
                        Nuevo valor

                        <input
                            type="number"
                            step="any"
                            id="senCambioValor"
                            value="0"
                        >
                    </label>

                </div>

                <button onclick="senSimularCambio()">
                    Calcular escenario
                </button>

                <div id="senComparacion"></div>

            </div>

            <h3>Procedimiento Simplex</h3>

            <p class="sen-nota">
                Las tablas muestran las iteraciones
                realizadas para encontrar la solución
                óptima del problema original.
            </p>

            ${senMostrarPasos(modelo, solucion)}
        `;

        senEl("senContenido").innerHTML = html;

        senEl("senResultados")
            .classList.remove("oculto");

        senActualizarOpciones();

    } catch (error) {
        senError(error.message);
    }
}

/* ==========================================
   ACTUALIZAR OPCIONES DE ESCENARIO
   ========================================== */

function senActualizarOpciones() {
    if (!senModeloActual) {
        return;
    }

    const tipo = senEl("senCambioTipo").value;

    const cantidad = tipo === "b"
        ? senModeloActual.m
        : senModeloActual.n;

    let html = "";

    for (let i = 0; i < cantidad; i++) {

        const nombre = tipo === "b"
            ? "Recurso R" + (i + 1)
            : "Variable X" + (i + 1);

        html += `
            <option value="${i}">
                ${nombre}
            </option>
        `;
    }

    senEl("senCambioIndice").innerHTML = html;

    senActualizarValor();
}

/* ==========================================
   ACTUALIZAR VALOR DEL ESCENARIO
   ========================================== */

function senActualizarValor() {
    if (!senModeloActual) {
        return;
    }

    const tipo = senEl("senCambioTipo").value;

    const indice = Number(
        senEl("senCambioIndice").value
    );

    const valor = tipo === "b"
        ? senModeloActual.b[indice]
        : senModeloActual.c[indice];

    senEl("senCambioValor").value = valor;
}

/* ==========================================
   SIMULAR CAMBIO
   ========================================== */

function senSimularCambio() {
    senOcultarError();

    try {
        if (
            !senModeloActual ||
            !senSolucionActual
        ) {
            throw new Error(
                "Primero debes resolver el modelo."
            );
        }

        const tipo =
            senEl("senCambioTipo").value;

        const indice = Number(
            senEl("senCambioIndice").value
        );

        const nuevoValor =
            senNumero("senCambioValor");

        if (
            tipo === "b" &&
            nuevoValor < 0
        ) {
            throw new Error(
                "El recurso disponible " +
                "debe ser no negativo."
            );
        }

        const original = senModeloActual;

        // Crear una copia independiente.
        const modificado = {
            n: original.n,
            m: original.m,

            c: [...original.c],

            A: original.A.map(
                fila => [...fila]
            ),

            b: [...original.b]
        };

        // Aplicar modificación.
        if (tipo === "b") {
            modificado.b[indice] = nuevoValor;
        } else {
            modificado.c[indice] = nuevoValor;
        }

        // Resolver nuevamente.
        const nuevaSolucion =
            senSimplex(modificado);

        let html = "";

        if (nuevaSolucion.estado !== "optimo") {

            html = `
                <p class="sen-advertencia">
                    El nuevo escenario no produjo
                    un óptimo finito verificable.

                    Estado:
                    ${nuevaSolucion.estado}
                </p>
            `;

        } else {

            const variacion =
                nuevaSolucion.z -
                senSolucionActual.z;

            const nuevasVariables =
                nuevaSolucion.x.map(
                    (valor, j) =>
                        "X" + (j + 1) +
                        " = " + senFmt(valor)
                ).join(", ");

            html = `
                <div class="sen-comparacion">

                    <h4>Comparación de escenarios</h4>

                    <p>
                        Valor original:
                        <strong>
                            Z = ${senFmt(senSolucionActual.z)}
                        </strong>
                    </p>

                    <p>
                        Nuevo valor:
                        <strong>
                            Z = ${senFmt(nuevaSolucion.z)}
                        </strong>
                    </p>

                    <p>
                        Variación:
                        <strong>
                            ${senFmt(variacion)}
                        </strong>
                    </p>

                    <p>
                        Nueva solución:
                        <strong>
                            ${nuevasVariables}
                        </strong>
                    </p>

                </div>
            `;
        }

        senEl("senComparacion").innerHTML = html;

    } catch (error) {
        senError(error.message);
    }
}

/* ==========================================
   CARGAR EJEMPLO
   ========================================== */

function senEjemplo() {
    senEl("senN").value = 2;
    senEl("senM").value = 3;

    senGenerar();

    const c = [40, 30];

    const A = [
        [2, 1],
        [1, 1],
        [1, 0]
    ];

    const b = [100, 80, 40];

    c.forEach((valor, j) => {
        senEl("senC" + j).value = valor;
    });

    A.forEach((fila, i) => {

        fila.forEach((valor, j) => {
            senEl(
                "senA" + i + "_" + j
            ).value = valor;
        });

        senEl("senB" + i).value = b[i];
    });
}

/* ==========================================
   LIMPIAR FORMULARIO
   ========================================== */

function senLimpiar() {
    senDimension = null;
    senModeloActual = null;
    senSolucionActual = null;

    senEl("senN").value = 2;
    senEl("senM").value = 3;

    senEl("senFormulario").innerHTML = "";
    senEl("senContenido").innerHTML = "";

    senEl("senModelo").classList.add("oculto");

    senEl("senResultados").classList.add("oculto");

    senOcultarError();
}
