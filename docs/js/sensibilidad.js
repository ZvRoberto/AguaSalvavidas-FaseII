
/*
 * GREAT VALUE - FASE II
 * ANÁLISIS DE SENSIBILIDAD
 *
 * Maximizar Z = c'x
 * Sujeto a Ax <= b, x >= 0, b >= 0
 *
 * Hasta 20 variables y 20 restricciones.
 */

"use strict";

const SEN_EPS = 1e-8;
const SEN_MAX_ITER = 1000;
const SEN_LIMITE = 20;

let senDimension = null;
let senModeloActual = null;
let senSolucionActual = null;

function senEl(id) {
    return document.getElementById(id);
}

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
        valor > SEN_LIMITE
    ) {
        throw new Error(
            "Las dimensiones deben estar entre 1 y 20."
        );
    }

    return valor;
}

function senFmt(valor) {
    if (valor === Infinity) return "+∞";
    if (valor === -Infinity) return "-∞";

    if (!Number.isFinite(valor)) {
        return String(valor);
    }

    if (Math.abs(valor) < SEN_EPS) return "0";

    return Number(valor.toFixed(6)).toString();
}

function senInput(id, valor = 0) {
    return `
        <input
            type="number"
            step="any"
            id="${id}"
            value="${valor}">
    `;
}

// =====================================================
// GENERAR FORMULARIO
// =====================================================

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
                Todas las variables son no negativas
                y los recursos disponibles deben ser
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

// =====================================================
// LEER MODELO
// =====================================================

function senLeer() {
    if (!senDimension) {
        throw new Error("Primero debes generar el modelo.");
    }

    const { n, m } = senDimension;

    if (
        senCantidad("senN") !== n ||
        senCantidad("senM") !== m
    ) {
        throw new Error(
            "Cambiaste las dimensiones. Genera nuevamente el modelo."
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
                " no puede ser negativo."
            );
        }

        A.push(fila);
        b.push(recurso);
    }

    return { n, m, c, A, b };
}

// =====================================================
// SIMPLEX
// =====================================================

function senSimplex(modelo) {
    const { n, m, c, A, b } = modelo;
    const columnas = n + m;
    const rhs = columnas;

    const T = Array.from(
        { length: m + 1 },
        () => Array(columnas + 1).fill(0)
    );

    const base = [];

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            T[i][j] = A[i][j];
        }

        T[i][n + i] = 1;
        T[i][rhs] = b[i];
        base.push(n + i);
    }

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

    guardar("Tabla inicial con variables de holgura.");

    let estado = "limite_iteraciones";
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

        if (entrante === -1) {
            estado = "optimo";
            break;
        }

        let saliente = -1;
        let mejorRazon = Infinity;

        for (let i = 0; i < m; i++) {
            const divisor = T[i][entrante];

            if (divisor <= SEN_EPS) continue;

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

        const nombre = indice => indice < n
            ? "X" + (indice + 1)
            : "S" + (indice - n + 1);

        const entra = nombre(entrante);
        const sale = nombre(base[saliente]);
        const pivote = T[saliente][entrante];

        for (let j = 0; j <= rhs; j++) {
            T[saliente][j] /= pivote;
        }

        for (let i = 0; i <= m; i++) {
            if (i === saliente) continue;

            const factor = T[i][entrante];

            for (let j = 0; j <= rhs; j++) {
                T[i][j] -= factor * T[saliente][j];

                if (Math.abs(T[i][j]) < SEN_EPS) {
                    T[i][j] = 0;
                }
            }
        }

        base[saliente] = entrante;
        iteraciones++;

        guardar(
            "Iteración " + iteraciones +
            ": entra " + entra +
            ", sale " + sale +
            ". Pivote = " + senFmt(pivote)
        );
    }

    if (estado === "limite_iteraciones") {
        const negativos = T[m]
            .slice(0, columnas)
            .some(valor => valor < -SEN_EPS);

        if (!negativos) estado = "optimo";
    }

    const x = Array(n).fill(0);

    for (let i = 0; i < m; i++) {
        if (base[i] < n) {
            x[base[i]] = T[i][rhs];
        }
    }

    const z = x.reduce(
        (total, valor, j) => total + valor * c[j],
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

// =====================================================
// RANGOS DE RECURSOS
// =====================================================

function senRangosRHS(modelo, sol) {
    const { n, m, b } = modelo;
    const rhs = n + m;
    const rangos = [];

    for (let k = 0; k < m; k++) {
        let inferior = -Infinity;
        let superior = Infinity;

        for (let i = 0; i < m; i++) {
            const basica = sol.T[i][rhs];
            const coef = sol.T[i][n + k];

            if (coef > SEN_EPS) {
                inferior = Math.max(
                    inferior,
                    -basica / coef
                );
            } else if (coef < -SEN_EPS) {
                superior = Math.min(
                    superior,
                    -basica / coef
                );
            }
        }

        rangos.push({
            recurso: k + 1,
            actual: b[k],
            precioSombra: sol.T[m][n + k],
            minimo: b[k] + inferior,
            maximo: b[k] + superior
        });
    }

    return rangos;
}

// =====================================================
// RANGOS DE COEFICIENTES OBJETIVO
// =====================================================

function senRangosObjetivo(modelo, sol) {
    const { n, m, c } = modelo;
    const columnas = n + m;
    const rangos = [];

    for (let k = 0; k < n; k++) {
        let inferior = -Infinity;
        let superior = Infinity;

        const filaBasica = sol.base.indexOf(k);

        if (filaBasica === -1) {
            // Variable no básica.
            // Su costo reducido es c - z.
            superior = sol.T[m][k];
        } else {
            // Variable básica.
            // La base permanece óptima si todos
            // los costos reducidos siguen >= 0.
            for (let j = 0; j < columnas; j++) {
                if (sol.base.includes(j)) continue;

                const coef = sol.T[filaBasica][j];
                const reducido = sol.T[m][j];

                if (coef > SEN_EPS) {
                    inferior = Math.max(
                        inferior,
                        -reducido / coef
                    );
                } else if (coef < -SEN_EPS) {
                    superior = Math.min(
                        superior,
                        -reducido / coef
                    );
                }
            }
        }

        rangos.push({
            variable: k + 1,
            actual: c[k],
            minimo: c[k] + inferior,
            maximo: c[k] + superior
        });
    }

    return rangos;
}

// =====================================================
// TABLAS DEL PROCEDIMIENTO
// =====================================================

function senMostrarPasos(modelo, solucion) {
    const { n, m } = modelo;

    const nombres = [
        ...Array.from(
            { length: n },
            (_, j) => "X" + (j + 1)
        ),
        ...Array.from(
            { length: m },
            (_, i) => "S" + (i + 1)
        ),
        "RHS"
    ];

    const nombreBase = indice => indice < n
        ? "X" + (indice + 1)
        : "S" + (indice - n + 1);

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

        nombres.forEach(nombre => {
            html += `<th>${nombre}</th>`;
        });

        html += `
                            </tr>
                        </thead>
                        <tbody>
        `;

        paso.tabla.forEach((fila, i) => {
            const base = i < m
                ? nombreBase(paso.base[i])
                : "Z";

            html += `<tr><th>${base}</th>`;

            fila.forEach(valor => {
                html += `<td>${senFmt(valor)}</td>`;
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

// =====================================================
// RESOLVER Y MOSTRAR RESULTADOS
// =====================================================

function senResolver() {
    senOcultarError();

    try {
        const modelo = senLeer();
        const solucion = senSimplex(modelo);

        if (solucion.estado !== "optimo") {
            throw new Error(
                solucion.estado === "no_acotado"
                    ? "El modelo no tiene un óptimo finito."
                    : "Se alcanzó el límite de iteraciones."
            );
        }

        senModeloActual = modelo;
        senSolucionActual = solucion;

        const rangosRHS = senRangosRHS(
            modelo,
            solucion
        );

        const rangosObjetivo = senRangosObjetivo(
            modelo,
            solucion
        );

        let html = `
            <div class="sen-resumen">
                <h3>Solución óptima</h3>
                <p>
                    <strong>Valor óptimo:</strong>
                    Z = ${senFmt(solucion.z)}
                </p>
                <p>
                    <strong>Iteraciones:</strong>
                    ${solucion.iteraciones}
                </p>
        `;

        solucion.x.forEach((valor, j) => {
            html += `
                <p>
                    X${j + 1} = ${senFmt(valor)}
                </p>
            `;
        });

        html += `
            </div>

            <h3>Precios sombra y rangos de recursos</h3>
            <p class="sen-nota">
                Los rangos muestran cuánto puede variar
                un recurso manteniendo factible la base
                actual. Se modifica un recurso a la vez.
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
                Estos intervalos mantienen óptima
                la base actual al cambiar un
                coeficiente a la vez.
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
                    Modifica un recurso o beneficio
                    y vuelve a calcular el óptimo.
                </p>

                <div class="sen-config">
                    <label>
                        Cambiar
                        <select
                            id="senCambioTipo"
                            onchange="senActualizarOpciones()">
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
                            onchange="senActualizarValor()">
                        </select>
                    </label>

                    <label>
                        Nuevo valor
                        <input
                            type="number"
                            step="any"
                            id="senCambioValor"
                            value="0">
                    </label>
                </div>

                <button onclick="senSimularCambio()">
                    Calcular escenario
                </button>

                <div id="senComparacion"></div>
            </div>

            <h3>Procedimiento Simplex</h3>

            ${senMostrarPasos(modelo, solucion)}
        `;

        senEl("senContenido").innerHTML = html;
        senEl("senResultados").classList.remove("oculto");

        senActualizarOpciones();

    } catch (error) {
        senEl("senResultados").classList.add("oculto");
        senError(error.message);
    }
}

// =====================================================
// OPCIONES DE SIMULACIÓN
// =====================================================

function senActualizarOpciones() {
    if (!senModeloActual) return;

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

function senActualizarValor() {
    if (!senModeloActual) return;

    const tipo = senEl("senCambioTipo").value;
    const indice = Number(
        senEl("senCambioIndice").value
    );

    const valor = tipo === "b"
        ? senModeloActual.b[indice]
        : senModeloActual.c[indice];

    senEl("senCambioValor").value = valor;
}

// =====================================================
// SIMULACIÓN DE ESCENARIOS
// =====================================================

function senSimularCambio() {
    senOcultarError();

    try {
        if (!senModeloActual || !senSolucionActual) {
            throw new Error(
                "Primero debes resolver el modelo."
            );
        }

        const tipo = senEl("senCambioTipo").value;
        const indice = Number(
            senEl("senCambioIndice").value
        );

        const nuevoValor = senNumero("senCambioValor");

        if (tipo !== "b" && tipo !== "c") {
            throw new Error("Tipo de cambio inválido.");
        }

        const limite = tipo === "b"
            ? senModeloActual.m
            : senModeloActual.n;

        if (
            !Number.isInteger(indice) ||
            indice < 0 ||
            indice >= limite
        ) {
            throw new Error("Selecciona un elemento válido.");
        }

        if (tipo === "b" && nuevoValor < 0) {
            throw new Error(
                "El recurso disponible debe ser no negativo."
            );
        }

        const modificado = {
            n: senModeloActual.n,
            m: senModeloActual.m,
            c: [...senModeloActual.c],
            A: senModeloActual.A.map(fila => [...fila]),
            b: [...senModeloActual.b]
        };

        modificado[tipo][indice] = nuevoValor;

        const nueva = senSimplex(modificado);
        const contenedor = senEl("senComparacion");

        if (nueva.estado !== "optimo") {
            contenedor.textContent =
                "El escenario no produjo un óptimo finito. " +
                "Estado: " + nueva.estado;
            return;
        }

        const variacion =
            nueva.z - senSolucionActual.z;

        const variables = nueva.x.map(
            (valor, j) =>
                "X" + (j + 1) + " = " + senFmt(valor)
        ).join(", ");

        contenedor.innerHTML = `
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
                        Z = ${senFmt(nueva.z)}
                    </strong>
                </p>
                <p>
                    Variación:
                    <strong>${senFmt(variacion)}</strong>
                </p>
                <p>
                    Nueva solución:
                    <strong>${variables}</strong>
                </p>
            </div>
        `;

    } catch (error) {
        senError(error.message);
    }
}

// =====================================================
// EJEMPLO GREAT VALUE
// =====================================================

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
            senEl("senA" + i + "_" + j).value = valor;
        });

        senEl("senB" + i).value = b[i];
    });
}

// =====================================================
// LIMPIAR
// =====================================================

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
