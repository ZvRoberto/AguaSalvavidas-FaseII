
/*
 * GREAT VALUE - MÉTODO M GRANDE
 * Versión independiente
 * Formularios, algoritmo y resultados
 */

(() => {
    "use strict";

    const $ = id => document.getElementById(id);
    const EPS = 1e-8;

    const fmt = x =>
        Math.abs(x) < EPS
            ? "0"
            : Number(x.toFixed(6)).toString();

    function mostrarErrorM(mensaje) {
        const caja = $("mensajeErrorM");

        if (caja) {
            caja.textContent = "⚠ " + mensaje;
            caja.classList.remove("oculto");
        }
    }

    function ocultarErrorM() {
        const caja = $("mensajeErrorM");

        if (caja) {
            caja.textContent = "";
            caja.classList.add("oculto");
        }
    }

    function actualizarEtapasM(etapa) {
        for (let i = 1; i <= 3; i++) {
            const elemento = $("etapaM" + i);

            if (!elemento) continue;

            elemento.classList.toggle("activa", i === etapa);
            elemento.classList.toggle("completada", i < etapa);
        }
    }

    function crearCampoM(id) {
        return `
            <input
                type="number"
                step="any"
                id="${id}"
                placeholder="0"
                style="
                    width:85px;
                    padding:9px;
                    margin:5px;
                    border:1px solid #cbd9e8;
                    border-radius:8px;
                    text-align:center;
                ">
        `;
    }

    function generarModeloMGrande() {
        ocultarErrorM();

        const n = Number($("numVariablesM").value);
        const m = Number($("numRestriccionesM").value);

        if (
            !Number.isInteger(n) ||
            !Number.isInteger(m) ||
            n < 1 || n > 20 ||
            m < 1 || m > 20
        ) {
            mostrarErrorM(
                "Ingresa entre 1 y 20 variables y restricciones."
            );
            return;
        }

        let objetivo = "<strong>Z = </strong>";

        for (let j = 0; j < n; j++) {
            objetivo += crearCampoM("m_fo_" + j);
            objetivo += " X" + (j + 1);

            if (j < n - 1) objetivo += " + ";
        }

        $("funcionObjetivoM").innerHTML = objetivo;

        let html = "";

        for (let i = 0; i < m; i++) {
            html += `
                <div style="
                    margin:12px 0;
                    display:flex;
                    align-items:center;
                    flex-wrap:wrap;
                    gap:5px;
                ">
            `;

            for (let j = 0; j < n; j++) {
                html += crearCampoM(
                    "m_r_" + i + "_" + j
                );

                html += " X" + (j + 1);

                if (j < n - 1) html += " + ";
            }

            html += `
                <select
                    id="m_signo_${i}"
                    style="
                        padding:9px;
                        border:1px solid #cbd9e8;
                        border-radius:8px;
                    ">
                    <option value="<=">≤</option>
                    <option value=">=">≥</option>
                    <option value="=">=</option>
                </select>
            `;

            html += crearCampoM("m_rhs_" + i);
            html += "</div>";
        }

        $("restriccionesM").innerHTML = html;

        $("panelModeloM").classList.remove("oculto");
        $("panelResultadosM").classList.add("oculto");

        $("panelModeloM").dataset.dimension =
            n + "," + m;

        actualizarEtapasM(2);
    }

    function leerNumeroM(id) {
        const campo = $(id);

        if (!campo || campo.value.trim() === "") {
            throw new Error(
                "Completa todos los coeficientes y cantidades."
            );
        }

        const valor = Number(campo.value);

        if (!Number.isFinite(valor)) {
            throw new Error(
                "Ingresa solamente números válidos."
            );
        }

        return valor;
    }

    function obtenerDatosMGrande() {
        const n = Number($("numVariablesM").value);
        const m = Number($("numRestriccionesM").value);

        if (
            $("panelModeloM").dataset.dimension !==
            n + "," + m
        ) {
            throw new Error(
                "Pulsa Generar modelo nuevamente."
            );
        }

        const c = [];

        for (let j = 0; j < n; j++) {
            c.push(leerNumeroM("m_fo_" + j));
        }

        const restricciones = [];

        for (let i = 0; i < m; i++) {
            const a = [];

            for (let j = 0; j < n; j++) {
                a.push(
                    leerNumeroM("m_r_" + i + "_" + j)
                );
            }

            restricciones.push({
                a: a,
                s: $("m_signo_" + i).value,
                b: leerNumeroM("m_rhs_" + i)
            });
        }

        return {
            n: n,
            m: m,
            tipo: $("tipoOptimizacionM").value,
            c: c,
            r: restricciones
        };
    }

    function cargarEjemploMGrande() {
        $("tipoOptimizacionM").value = "max";
        $("numVariablesM").value = 2;
        $("numRestriccionesM").value = 2;

        generarModeloMGrande();

        const valores = {
            m_fo_0: 3,
            m_fo_1: 2,
            m_r_0_0: 1,
            m_r_0_1: 1,
            m_rhs_0: 4,
            m_r_1_0: 1,
            m_r_1_1: 3,
            m_rhs_1: 9
        };

        for (const [id, valor] of Object.entries(valores)) {
            $(id).value = valor;
        }

        $("m_signo_0").value = ">=";
        $("m_signo_1").value = "<=";

        ocultarErrorM();
    }

    function limpiarMGrande() {
        document.querySelectorAll(
            "#funcionObjetivoM input, #restriccionesM input"
        ).forEach(campo => {
            campo.value = "";
        });

        $("panelResultadosM").classList.add("oculto");

        ocultarErrorM();
        actualizarEtapasM(2);
    }

    /*
     * ALGORITMO M GRANDE
     *
     * Convierte minimización en maximización.
     * Agrega holguras, excesos y artificiales.
     * Penaliza artificiales con -M.
     */

    function ejecutarMGrande(datos) {
        const n = datos.n;
        const m = datos.m;

        const filas = datos.r.map(restriccion => {
            let a = [...restriccion.a];
            let s = restriccion.s;
            let b = restriccion.b;

            if (b < 0) {
                a = a.map(valor => -valor);
                b = -b;

                if (s === "<=") s = ">=";
                else if (s === ">=") s = "<=";
            }

            return { a, s, b };
        });

        const nombres = Array.from(
            { length: n },
            (_, i) => "X" + (i + 1)
        );

        const base = [];
        const artificiales = [];
        const adicionales = [];

        let contadorS = 0;
        let contadorE = 0;
        let contadorA = 0;

        function agregarVariable(nombre, fila, valor, artificial) {
            const indice = nombres.length;

            nombres.push(nombre);

            adicionales.push({
                indice: indice,
                fila: fila,
                valor: valor
            });

            if (artificial) {
                artificiales.push(indice);
            }

            return indice;
        }

        filas.forEach((restriccion, i) => {
            if (restriccion.s === "<=") {
                base.push(
                    agregarVariable(
                        "S" + (++contadorS),
                        i,
                        1,
                        false
                    )
                );

            } else if (restriccion.s === ">=") {
                agregarVariable(
                    "E" + (++contadorE),
                    i,
                    -1,
                    false
                );

                base.push(
                    agregarVariable(
                        "A" + (++contadorA),
                        i,
                        1,
                        true
                    )
                );

            } else if (restriccion.s === "=") {
                base.push(
                    agregarVariable(
                        "A" + (++contadorA),
                        i,
                        1,
                        true
                    )
                );

            } else {
                throw new Error(
                    "Signo de restricción inválido."
                );
            }
        });

        const N = nombres.length;

        const tabla = filas.map((restriccion, i) => {
            const fila = Array(N + 1).fill(0);

            restriccion.a.forEach((valor, j) => {
                fila[j] = valor;
            });

            adicionales.forEach(variable => {
                if (variable.fila === i) {
                    fila[variable.indice] = variable.valor;
                }
            });

            fila[N] = restriccion.b;

            return fila;
        });

        const escala = Math.max(
            1,
            ...datos.c.map(Math.abs)
        );

        const GRAN_M = 1000000 * escala;

        const costos = Array(N).fill(0);

        datos.c.forEach((valor, j) => {
            costos[j] =
                (datos.tipo === "max" ? 1 : -1) * valor;
        });

        artificiales.forEach(indice => {
            costos[indice] = -GRAN_M;
        });

        const z = Array(N + 1).fill(0);

        function recalcularZ() {
            for (let j = 0; j <= N; j++) {
                let valor = j === N ? 0 : -costos[j];

                for (let i = 0; i < m; i++) {
                    valor +=
                        costos[base[i]] * tabla[i][j];
                }

                z[j] =
                    Math.abs(valor) < EPS ? 0 : valor;
            }
        }

        recalcularZ();

        const iteraciones = [];

        function guardarIteracion(descripcion) {
            iteraciones.push({
                descripcion: descripcion,
                base: base.map(indice => nombres[indice]),
                tabla: [
                    ...tabla.map(fila => [...fila]),
                    [...z]
                ]
            });
        }

        guardarIteracion("Tabla inicial");

        let estado = "optimo";
        let contador = 0;

        while (contador < 500) {
            let columna = -1;
            let minimo = -EPS;

            for (let j = 0; j < N; j++) {
                if (artificiales.includes(j)) {
                    continue;
                }

                if (z[j] < minimo) {
                    minimo = z[j];
                    columna = j;
                }
            }

            if (columna < 0) {
                break;
            }

            let filaPivote = -1;
            let mejorRazon = Infinity;

            for (let i = 0; i < m; i++) {
                if (tabla[i][columna] > EPS) {
                    const razon =
                        tabla[i][N] / tabla[i][columna];

                    if (
                        razon < mejorRazon - EPS ||
                        (
                            Math.abs(razon - mejorRazon) <= EPS &&
                            (
                                filaPivote < 0 ||
                                base[i] < base[filaPivote]
                            )
                        )
                    ) {
                        mejorRazon = razon;
                        filaPivote = i;
                    }
                }
            }

            if (filaPivote < 0) {
                estado = "no_acotado";
                break;
            }

            const entrante = nombres[columna];
            const saliente = nombres[base[filaPivote]];
            const pivote = tabla[filaPivote][columna];

            for (let j = 0; j <= N; j++) {
                tabla[filaPivote][j] /= pivote;
            }

            for (let i = 0; i < m; i++) {
                if (i === filaPivote) continue;

                const factor = tabla[i][columna];

                for (let j = 0; j <= N; j++) {
                    tabla[i][j] -=
                        factor * tabla[filaPivote][j];
                }
            }

            base[filaPivote] = columna;

            recalcularZ();

            contador++;

            guardarIteracion(
                "Entra " + entrante +
                ", sale " + saliente +
                ", pivote = " + fmt(pivote)
            );
        }

        if (contador >= 500) {
            estado = "limite";
        }

        const artificialPositiva = base.some(
            (indice, i) =>
                artificiales.includes(indice) &&
                tabla[i][N] > 1e-6
        );

        if (artificialPositiva) {
            estado = "no_factible";
        }

        const variables = Array(n).fill(0);

        base.forEach((indice, i) => {
            if (indice < n) {
                variables[indice] = tabla[i][N];
            }
        });

        const valorZ = variables.reduce(
            (suma, valor, j) =>
                suma + valor * datos.c[j],
            0
        );

        return {
            estado: estado,
            nombres: [...nombres, "RHS"],
            iteraciones: iteraciones,
            variables: variables,
            valorZ: valorZ,
            artificiales: artificiales.map(
                indice => nombres[indice]
            )
        };
    }

    /*
     * PRESENTACIÓN DE RESULTADOS
     */

    function mostrarMGrande(datos, resultado) {
        const contenedor = $("procedimientoMGrande");

        let html = `
            <h3>Modelo de ${
                datos.tipo === "max"
                    ? "maximización"
                    : "minimización"
            }</h3>

            <p>
                <strong>Variables artificiales:</strong>
                ${
                    resultado.artificiales.join(", ") ||
                    "Ninguna"
                }
            </p>
        `;

        resultado.iteraciones.forEach(
            (iteracion, indice) => {
                html += `
                    <h4>
                        Iteración ${indice}:
                        ${iteracion.descripcion}
                    </h4>

                    <div style="overflow-x:auto">
                        <table style="
                            border-collapse:collapse;
                            width:100%;
                            min-width:500px;
                        ">
                            <thead>
                                <tr>
                                    <th>Base</th>
                `;

                resultado.nombres.forEach(nombre => {
                    html += `<th>${nombre}</th>`;
                });

                html += `
                                </tr>
                            </thead>
                            <tbody>
                `;

                iteracion.tabla.forEach((fila, i) => {
                    const nombreBase =
                        i < datos.m
                            ? iteracion.base[i]
                            : "Zj - Cj";

                    html += `<tr><th>${nombreBase}</th>`;

                    fila.forEach(valor => {
                        html += `<td>${fmt(valor)}</td>`;
                    });

                    html += "</tr>";
                });

                html += `
                            </tbody>
                        </table>
                    </div>
                `;
            }
        );

        if (resultado.estado === "optimo") {
            html += `
                <div style="
                    margin-top:20px;
                    padding:20px;
                    background:#e8f8ef;
                    border-radius:12px;
                ">
                    <h3>✓ Solución óptima</h3>
            `;

            resultado.variables.forEach((valor, i) => {
                html += `
                    <p>
                        <strong>X${i + 1} =</strong>
                        ${fmt(valor)}
                    </p>
                `;
            });

            html += `
                    <h3>
                        Valor óptimo Z =
                        ${fmt(resultado.valorZ)}
                    </h3>
                </div>
            `;

        } else {
            const mensajes = {
                no_factible:
                    "El problema no tiene solución factible.",
                no_acotado:
                    "El problema es no acotado.",
                limite:
                    "Se alcanzó el límite de iteraciones."
            };

            html += `
                <div style="
                    padding:18px;
                    background:#fff0f2;
                    border-radius:12px;
                ">
                    <strong>
                        ${mensajes[resultado.estado]}
                    </strong>
                </div>
            `;
        }

        contenedor.innerHTML = html;

        $("panelResultadosM").classList.remove("oculto");

        actualizarEtapasM(3);
    }

    function resolverMGrande() {
        ocultarErrorM();

        try {
            const datos = obtenerDatosMGrande();
            const resultado = ejecutarMGrande(datos);

            mostrarMGrande(datos, resultado);

            $("panelResultadosM").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {
            console.error("Error en M Grande:", error);
            mostrarErrorM(error.message);
        }
    }

    window.generarModeloMGrande = generarModeloMGrande;
    window.cargarEjemploMGrande = cargarEjemploMGrande;
    window.limpiarMGrande = limpiarMGrande;
    window.resolverMGrande = resolverMGrande;
})();
