
"use strict";

/* =========================================================
   GREAT VALUE - TEORÍA DE COLAS M/M/1 Y M/M/2
   Resultados decimales y porcentuales
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const $ = (id) => document.getElementById(id);

    const formulario = $("colasFormulario");
    const lambdaInput = $("colasLambda");
    const muInput = $("colasMu");
    const unidadInput = $("colasUnidad");
    const modeloInput = $("colasModelo");
    const nInput = $("colasN");

    const botonEjemplo = $("colasEjemplo");
    const botonImprimir = $("colasImprimir");

    const errorDiv = $("colasError");
    const resultadosDiv = $("colasResultados");
    const estadoDiv = $("colasEstado");
    const kpisDiv = $("colasKpis");
    const comparacionDiv = $("colasComparacion");
    const tablaDiv = $("colasTabla");
    const procedimientoDiv = $("colasProcedimiento");
    const pasosDiv = $("colasPasos");

    /* =========================
       FORMATOS
       ========================= */

    function decimal(valor, cifras = 4) {
        if (!Number.isFinite(valor)) return "No definido";
        return valor.toFixed(cifras);
    }

    function porcentaje(valor) {
        if (!Number.isFinite(valor)) return "No definido";

        return `${decimal(valor)} (${(valor * 100).toFixed(2)}%)`;
    }

    function numero(valor) {
        if (!Number.isFinite(valor)) return "No definido";
        return valor.toFixed(6);
    }

    function textoUnidad(unidad) {
        const valor = String(unidad || "horas").toLowerCase();

        if (valor.includes("min")) return "minutos";
        if (valor.includes("seg")) return "segundos";
        if (valor.includes("día") || valor.includes("dia")) return "días";

        return "horas";
    }

    function mostrar(elemento) {
        if (elemento) elemento.style.display = "";
    }

    function ocultar(elemento) {
        if (elemento) elemento.style.display = "none";
    }

    function mostrarError(mensaje) {
        if (errorDiv) {
            errorDiv.textContent = mensaje;
            mostrar(errorDiv);
        }

        ocultar(resultadosDiv);
        ocultar(comparacionDiv);
        ocultar(procedimientoDiv);
    }

    function limpiarError() {
        if (errorDiv) {
            errorDiv.textContent = "";
            ocultar(errorDiv);
        }
    }

    /* =========================
       MODELO M/M/1
       ========================= */

    function calcularMM1(lambda, mu, n) {

        const estable = lambda < mu;
        const rho = lambda / mu;

        if (!estable) {
            return {
                modelo: "M/M/1",
                estable: false,
                rho,
                P0: null,
                L: null,
                Lq: null,
                W: null,
                Wq: null,
                Pn: null
            };
        }

        const P0 = 1 - rho;
        const L = lambda / (mu - lambda);
        const Lq = (lambda * lambda) / (mu * (mu - lambda));

        const W = 1 / (mu - lambda);
        const Wq = lambda / (mu * (mu - lambda));

        const Pn = P0 * Math.pow(rho, n);

        return {
            modelo: "M/M/1",
            estable: true,
            rho,
            P0,
            L,
            Lq,
            W,
            Wq,
            Pn
        };
    }

    /* =========================
       MODELO M/M/2
       ========================= */

    function calcularMM2(lambda, mu, n) {

        const c = 2;
        const rho = lambda / (c * mu);
        const a = lambda / mu;

        const estable = lambda < c * mu;

        if (!estable) {
            return {
                modelo: "M/M/2",
                estable: false,
                rho,
                P0: null,
                L: null,
                Lq: null,
                W: null,
                Wq: null,
                Pn: null
            };
        }

        const suma = 1 + a;
        const terminoFinal = (a * a) / (2 * (1 - rho));

        const P0 = 1 / (suma + terminoFinal);

        const Lq = (
            P0 * a * a * rho
        ) / (
            2 * Math.pow(1 - rho, 2)
        );

        const L = Lq + a;

        // Para lambda = 0 no hay clientes ni espera.
        // W y Wq representan los tiempos de un cliente hipotético.
        const Wq = lambda === 0 ? 0 : Lq / lambda;
        const W = Wq + 1 / mu;

        let Pn;

        if (n < c) {
            Pn = P0 * Math.pow(a, n) / factorial(n);
        } else {
            Pn = P0 *
                Math.pow(a, n) /
                (factorial(c) * Math.pow(c, n - c));
        }

        return {
            modelo: "M/M/2",
            estable: true,
            rho,
            P0,
            L,
            Lq,
            W,
            Wq,
            Pn
        };
    }

    function factorial(n) {
        let resultado = 1;

        for (let i = 2; i <= n; i++) {
            resultado *= i;
        }

        return resultado;
    }

    /* =========================
       TARJETAS DE RESULTADOS
       ========================= */

    function crearKPI(titulo, valor, descripcion) {
        return `
            <div class="pert-kpi">
                <span>${titulo}</span>
                <strong>${valor}</strong>
                <small>${descripcion}</small>
            </div>
        `;
    }

    function mostrarResultados(resultado, unidad, n) {

        if (!resultado.estable) {

            estadoDiv.innerHTML = `
                <div class="mensaje-error">
                    <strong>Sistema inestable</strong>
                    <p>
                        El modelo ${resultado.modelo}
                        no cumple la condición de estabilidad.
                    </p>
                    <p>
                        Utilización:
                        <strong>${porcentaje(resultado.rho)}</strong>
                    </p>
                    <p>
                        No existen resultados estacionarios
                        finitos para los demás indicadores.
                    </p>
                </div>
            `;

            kpisDiv.innerHTML = "";
            mostrar(resultadosDiv);
            return;
        }

        estadoDiv.innerHTML = `
            <div class="mensaje-exito">
                <strong>Sistema estable</strong>
                <p>
                    El modelo ${resultado.modelo}
                    cumple la condición de estabilidad.
                </p>
            </div>
        `;

        kpisDiv.innerHTML = `
            ${crearKPI(
                "ρ - Utilización",
                porcentaje(resultado.rho),
                "Porcentaje de ocupación por servidor"
            )}

            ${crearKPI(
                "P₀ - Sistema vacío",
                porcentaje(resultado.P0),
                "Probabilidad de cero clientes"
            )}

            ${crearKPI(
                "L - Clientes en sistema",
                numero(resultado.L),
                "Promedio de clientes en el sistema"
            )}

            ${crearKPI(
                "Lq - Clientes en cola",
                numero(resultado.Lq),
                "Promedio de clientes esperando"
            )}

            ${crearKPI(
                "W - Tiempo en sistema",
                numero(resultado.W) + " " + unidad,
                "Tiempo promedio total"
            )}

            ${crearKPI(
                "Wq - Tiempo en cola",
                numero(resultado.Wq) + " " + unidad,
                "Tiempo promedio de espera"
            )}

            ${crearKPI(
                "P" + n + " - Probabilidad",
                porcentaje(resultado.Pn),
                "Probabilidad de exactamente " + n + " clientes"
            )}
        `;

        mostrar(resultadosDiv);
    }

    /* =========================
       TABLA COMPARATIVA
       ========================= */

    function mostrarComparacion(mm1, mm2, unidad, n) {

        function valor(resultado, propiedad, esPorcentaje = false) {

            if (!resultado.estable) {
                return "Inestable";
            }

            if (esPorcentaje) {
                return porcentaje(resultado[propiedad]);
            }

            return numero(resultado[propiedad]);
        }

        tablaDiv.innerHTML = `
            <div class="sen-tabla-scroll">
                <table class="sen-tabla">
                    <thead>
                        <tr>
                            <th>Indicador</th>
                            <th>M/M/1</th>
                            <th>M/M/2</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td>Estado</td>
                            <td>${mm1.estable ? "Estable" : "Inestable"}</td>
                            <td>${mm2.estable ? "Estable" : "Inestable"}</td>
                        </tr>

                        <tr>
                            <td>ρ - Utilización</td>
                            <td>${porcentaje(mm1.rho)}</td>
                            <td>${porcentaje(mm2.rho)}</td>
                        </tr>

                        <tr>
                            <td>P₀ - Sistema vacío</td>
                            <td>${valor(mm1, "P0", true)}</td>
                            <td>${valor(mm2, "P0", true)}</td>
                        </tr>

                        <tr>
                            <td>L - Clientes en sistema</td>
                            <td>${valor(mm1, "L")}</td>
                            <td>${valor(mm2, "L")}</td>
                        </tr>

                        <tr>
                            <td>Lq - Clientes en cola</td>
                            <td>${valor(mm1, "Lq")}</td>
                            <td>${valor(mm2, "Lq")}</td>
                        </tr>

                        <tr>
                            <td>W - Tiempo en sistema (${unidad})</td>
                            <td>${valor(mm1, "W")}</td>
                            <td>${valor(mm2, "W")}</td>
                        </tr>

                        <tr>
                            <td>Wq - Tiempo en cola (${unidad})</td>
                            <td>${valor(mm1, "Wq")}</td>
                            <td>${valor(mm2, "Wq")}</td>
                        </tr>

                        <tr>
                            <td>P${n} - Probabilidad</td>
                            <td>${valor(mm1, "Pn", true)}</td>
                            <td>${valor(mm2, "Pn", true)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        mostrar(comparacionDiv);
    }

    /* =========================
       PROCEDIMIENTO MATEMÁTICO
       ========================= */

    function paso(titulo, formula, sustitucion, resultado) {

        return `
            <div class="sen-iteracion">
                <h4>${titulo}</h4>

                <p><strong>Fórmula:</strong></p>
                <p>${formula}</p>

                <p><strong>Sustitución:</strong></p>
                <p>${sustitucion}</p>

                <p><strong>Resultado:</strong></p>
                <p><strong>${resultado}</strong></p>
            </div>
        `;
    }

    function procedimientoMM1(r, lambda, mu, n, unidad) {

        let html = "";

        html += paso(
            "1. Factor de utilización (ρ)",
            "ρ = λ / μ",
            `ρ = ${lambda} / ${mu}`,
            porcentaje(r.rho)
        );

        if (!r.estable) {
            html += `
                <div class="mensaje-error">
                    M/M/1 es inestable porque λ ≥ μ.
                    No se calculan indicadores estacionarios.
                </div>
            `;
            return html;
        }

        html += paso(
            "2. Probabilidad de sistema vacío (P₀)",
            "P₀ = 1 - ρ",
            `P₀ = 1 - ${numero(r.rho)}`,
            porcentaje(r.P0)
        );

        html += paso(
            "3. Número promedio en el sistema (L)",
            "L = λ / (μ - λ)",
            `L = ${lambda} / (${mu} - ${lambda})`,
            numero(r.L) + " clientes"
        );

        html += paso(
            "4. Número promedio en cola (Lq)",
            "Lq = λ² / [μ(μ - λ)]",
            `Lq = ${lambda}² / [${mu}(${mu} - ${lambda})]`,
            numero(r.Lq) + " clientes"
        );

        html += paso(
            "5. Tiempo promedio en el sistema (W)",
            "W = 1 / (μ - λ)",
            `W = 1 / (${mu} - ${lambda})`,
            numero(r.W) + " " + unidad
        );

        html += paso(
            "6. Tiempo promedio en cola (Wq)",
            "Wq = λ / [μ(μ - λ)]",
            `Wq = ${lambda} / [${mu}(${mu} - ${lambda})]`,
            numero(r.Wq) + " " + unidad
        );

        html += paso(
            `7. Probabilidad de ${n} clientes (P${n})`,
            "Pn = (1 - ρ)ρⁿ",
            `P${n} = (1 - ${numero(r.rho)}) × ${numero(r.rho)}^${n}`,
            porcentaje(r.Pn)
        );

        return html;
    }

    function procedimientoMM2(r, lambda, mu, n, unidad) {

        let html = "";

        const a = lambda / mu;
        const rho = lambda / (2 * mu);

        html += paso(
            "1. Factor de utilización (ρ)",
            "ρ = λ / (2μ)",
            `ρ = ${lambda} / (2 × ${mu})`,
            porcentaje(rho)
        );

        if (!r.estable) {
            html += `
                <div class="mensaje-error">
                    M/M/2 es inestable porque λ ≥ 2μ.
                    No se calculan indicadores estacionarios.
                </div>
            `;
            return html;
        }

        html += paso(
            "2. Carga ofrecida (a)",
            "a = λ / μ",
            `a = ${lambda} / ${mu}`,
            numero(a)
        );

        const termino1 = 1 + a;
        const termino2 = a * a / (2 * (1 - rho));
        const denominador = termino1 + termino2;

        html += paso(
            "3. Probabilidad de sistema vacío (P₀)",
            "P₀ = 1 / [1 + a + a² / (2(1 - ρ))]",
            `P₀ = 1 / [1 + ${numero(a)} + ${numero(a)}² / (2(1 - ${numero(rho)}))]` +
            `<p>Primer término: 1 + a = ${numero(termino1)}</p>` +
            `<p>Segundo término: a² / [2(1 - ρ)] = ${numero(termino2)}</p>` +
            `<p>Denominador = ${numero(denominador)}</p>`,
            porcentaje(r.P0)
        );

        const numeradorLq = r.P0 * a * a * rho;
        const denominadorLq = 2 * Math.pow(1 - rho, 2);

        html += paso(
            "4. Número promedio en cola (Lq)",
            "Lq = [P₀ × a² × ρ] / [2(1 - ρ)²]",
            `Lq = [${numero(r.P0)} × ${numero(a)}² × ${numero(rho)}] / [2(1 - ${numero(rho)})²]` +
            `<p>Numerador = ${numero(numeradorLq)}</p>` +
            `<p>Denominador = ${numero(denominadorLq)}</p>`,
            numero(r.Lq) + " clientes"
        );

        html += paso(
            "5. Número promedio en el sistema (L)",
            "L = Lq + λ / μ",
            `L = ${numero(r.Lq)} + ${lambda} / ${mu}`,
            numero(r.L) + " clientes"
        );

        html += paso(
            "6. Tiempo promedio en cola (Wq)",
            "Wq = Lq / λ, para λ > 0",
            lambda === 0
                ? "Como λ = 0, no hay llegadas ni espera."
                : `Wq = ${numero(r.Lq)} / ${lambda}`,
            numero(r.Wq) + " " + unidad
        );

        html += paso(
            "7. Tiempo promedio en el sistema (W)",
            "W = Wq + 1 / μ",
            `W = ${numero(r.Wq)} + 1 / ${mu}`,
            numero(r.W) + " " + unidad
        );

        let formulaPn;
        let sustitucionPn;

        if (n < 2) {
            formulaPn = "Pn = P₀ × aⁿ / n!";
            sustitucionPn =
                `P${n} = ${numero(r.P0)} × ${numero(a)}^${n} / ${n}!`;
        } else {
            formulaPn = "Pn = P₀ × aⁿ / [2! × 2⁽ⁿ⁻²⁾]";
            sustitucionPn =
                `P${n} = ${numero(r.P0)} × ${numero(a)}^${n} / ` +
                `[2! × 2^(${n} - 2)]`;
        }

        html += paso(
            `8. Probabilidad de ${n} clientes (P${n})`,
            formulaPn,
            sustitucionPn,
            porcentaje(r.Pn)
        );

        return html;
    }

    /* =========================
       RESOLVER EJERCICIO
       ========================= */

    function resolver() {

        limpiarError();

        const lambdaTexto = lambdaInput.value.trim();
        const muTexto = muInput.value.trim();
        const nTexto = nInput.value.trim();

        if (
            lambdaTexto === "" ||
            muTexto === "" ||
            nTexto === ""
        ) {
            mostrarError("Completa todos los campos.");
            return;
        }

        const lambda = Number(lambdaTexto);
        const mu = Number(muTexto);
        const n = Number(nTexto);

        if (
            !Number.isFinite(lambda) ||
            !Number.isFinite(mu) ||
            !Number.isSafeInteger(n)
        ) {
            mostrarError("Ingresa valores numéricos válidos.");
            return;
        }

        if (lambda < 0) {
            mostrarError("La tasa de llegadas λ no puede ser negativa.");
            return;
        }

        if (mu <= 0) {
            mostrarError("La tasa de servicio μ debe ser mayor que cero.");
            return;
        }

        if (n < 0) {
            mostrarError("El número de clientes n debe ser un entero no negativo.");
            return;
        }

        const unidad = textoUnidad(unidadInput.value);
        const modeloTexto = String(modeloInput.value).toUpperCase();
        const modelo = modeloTexto.includes("2") ? "MM2" : "MM1";

        const mm1 = calcularMM1(lambda, mu, n);
        const mm2 = calcularMM2(lambda, mu, n);

        const seleccionado = modelo === "MM2" ? mm2 : mm1;

        mostrarResultados(seleccionado, unidad, n);
        mostrarComparacion(mm1, mm2, unidad, n);

        pasosDiv.innerHTML = modelo === "MM2"
            ? procedimientoMM2(mm2, lambda, mu, n, unidad)
            : procedimientoMM1(mm1, lambda, mu, n, unidad);

        mostrar(procedimientoDiv);
    }

    /* =========================
       CARGAR EJEMPLO
       ========================= */

    if (botonEjemplo) {

        botonEjemplo.addEventListener("click", (evento) => {

            evento.preventDefault();

            lambdaInput.value = 8;
            muInput.value = 5;
            nInput.value = 2;

            // Seleccionar M/M/2 según el valor real del HTML.
            const opcionMM2 = Array.from(modeloInput.options)
                .find(opcion => opcion.value.toUpperCase().includes("2"));

            if (opcionMM2) {
                modeloInput.value = opcionMM2.value;
            }

            const opcionHoras = Array.from(unidadInput.options)
                .find(opcion =>
                    opcion.value.toLowerCase().includes("hora")
                );

            if (opcionHoras) {
                unidadInput.value = opcionHoras.value;
            }

            resolver();
        });
    }

    /* =========================
       FORMULARIO
       ========================= */

    if (formulario) {
        formulario.addEventListener("submit", (evento) => {
            evento.preventDefault();
            resolver();
        });
    }

    /* =========================
       IMPRIMIR
       ========================= */

    if (botonImprimir) {
        botonImprimir.addEventListener("click", (evento) => {
            evento.preventDefault();
            window.print();
        });
    }

    /* =========================
       ESTADO INICIAL
       ========================= */

    limpiarError();
    ocultar(resultadosDiv);
    ocultar(comparacionDiv);
    ocultar(procedimientoDiv);

});
