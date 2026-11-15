
"use strict";

/* ==========================================================
   GREAT VALUE - FASE III
   TEORÍA DE COLAS M/M/1 Y M/M/2
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const $ = id => document.getElementById(id);

    const formulario = $("colasFormulario");
    const lambdaInput = $("colasLambda");
    const muInput = $("colasMu");
    const unidadInput = $("colasUnidad");
    const modeloInput = $("colasModelo");
    const nInput = $("colasN");

    const botonResolver = $("colasResolver");
    const botonEjemplo = $("colasEjemplo");
    const botonLimpiar = $("colasLimpiar");
    const botonImprimir = $("colasImprimir");

    const errorDiv = $("colasError");
    const resultadosDiv = $("colasResultados");
    const estadoDiv = $("colasEstado");
    const kpisDiv = $("colasKpis");
    const comparacionDiv = $("colasComparacion");
    const tablaDiv = $("colasTabla");
    const procedimientoDiv = $("colasProcedimiento");
    const pasosDiv = $("colasPasos");

    /* FORMATO DE RESULTADOS */

    function numero(valor) {
        return Number.isFinite(valor)
            ? valor.toFixed(6)
            : "No definido";
    }

    function porcentaje(valor) {
        return Number.isFinite(valor)
            ? `${valor.toFixed(4)} (${(valor * 100).toFixed(2)}%)`
            : "No definido";
    }

    function mostrar(elemento) {
        if (elemento) elemento.style.display = "block";
    }

    function ocultar(elemento) {
        if (elemento) elemento.style.display = "none";
    }

    function limpiarError() {
        if (errorDiv) {
            errorDiv.textContent = "";
            ocultar(errorDiv);
        }
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

    /* CÁLCULO M/M/1 */

    function calcularMM1(lambda, mu, n) {

        const rho = lambda / mu;
        const estable = lambda < mu;

        if (!estable) {
            return { modelo: "M/M/1", estable, rho };
        }

        const P0 = 1 - rho;
        const L = lambda / (mu - lambda);
        const Lq = lambda * lambda / (mu * (mu - lambda));
        const W = 1 / (mu - lambda);
        const Wq = lambda / (mu * (mu - lambda));
        const Pn = P0 * Math.pow(rho, n);

        return {
            modelo: "M/M/1",
            estable,
            rho, P0, L, Lq, W, Wq, Pn
        };
    }

    /* CÁLCULO M/M/2 */

    function calcularMM2(lambda, mu, n) {

        const a = lambda / mu;
        const rho = lambda / (2 * mu);
        const estable = lambda < 2 * mu;

        if (!estable) {
            return { modelo: "M/M/2", estable, rho };
        }

        const P0 = 1 / (
            1 + a + (a * a) / (2 * (1 - rho))
        );

        const Lq = (
            P0 * a * a * rho
        ) / (
            2 * Math.pow(1 - rho, 2)
        );

        const L = Lq + a;
        const Wq = lambda === 0 ? 0 : Lq / lambda;
        const W = Wq + 1 / mu;

        let Pn;

        if (n === 0) {
            Pn = P0;
        } else if (n === 1) {
            Pn = P0 * a;
        } else {
            Pn = P0 * (a * a / 2) *
                Math.pow(rho, n - 2);
        }

        return {
            modelo: "M/M/2",
            estable,
            rho, P0, L, Lq, W, Wq, Pn
        };
    }

    /* TARJETAS DE RESULTADOS */

    function tarjeta(titulo, valor, descripcion) {
        return `
            <div class="pert-kpi">
                <span>${titulo}</span>
                <strong>${valor}</strong>
                <small>${descripcion}</small>
            </div>
        `;
    }

    function mostrarResultados(r, unidad, n) {

        if (!r.estable) {
            estadoDiv.innerHTML = `
                <div class="mensaje-error">
                    <strong>${r.modelo}: sistema inestable</strong>
                    <p>Utilización: ${porcentaje(r.rho)}</p>
                    <p>
                        No existen indicadores estacionarios
                        finitos porque la tasa de llegadas
                        supera o iguala la capacidad.
                    </p>
                </div>
            `;

            kpisDiv.innerHTML = "";
            mostrar(resultadosDiv);
            return;
        }

        estadoDiv.innerHTML = `
            <div class="mensaje-exito">
                <strong>${r.modelo}: sistema estable</strong>
                <p>El modelo cumple la condición de estabilidad.</p>
            </div>
        `;

        kpisDiv.innerHTML =
            tarjeta("ρ - Utilización", porcentaje(r.rho),
                "Ocupación por servidor") +
            tarjeta("P₀ - Sistema vacío", porcentaje(r.P0),
                "Probabilidad de cero clientes") +
            tarjeta("L - Clientes en sistema", numero(r.L),
                "Promedio de clientes") +
            tarjeta("Lq - Clientes en cola", numero(r.Lq),
                "Promedio de clientes esperando") +
            tarjeta("W - Tiempo en sistema",
                numero(r.W) + " " + unidad,
                "Tiempo promedio total") +
            tarjeta("Wq - Tiempo en cola",
                numero(r.Wq) + " " + unidad,
                "Tiempo promedio de espera") +
            tarjeta("P" + n + " - Probabilidad",
                porcentaje(r.Pn),
                "Probabilidad de exactamente " + n + " clientes");

        mostrar(resultadosDiv);
    }

    /* COMPARACIÓN M/M/1 Y M/M/2 */

    function mostrarComparacion(mm1, mm2, unidad, n) {

        function valor(r, campo, esPorcentaje = false) {
            if (!r.estable) return "Inestable";
            return esPorcentaje
                ? porcentaje(r[campo])
                : numero(r[campo]);
        }

        const filas = [
            ["Estado",
                mm1.estable ? "Estable" : "Inestable",
                mm2.estable ? "Estable" : "Inestable"],
            ["ρ - Utilización",
                porcentaje(mm1.rho), porcentaje(mm2.rho)],
            ["P₀ - Sistema vacío",
                valor(mm1, "P0", true),
                valor(mm2, "P0", true)],
            ["L - Clientes en sistema",
                valor(mm1, "L"), valor(mm2, "L")],
            ["Lq - Clientes en cola",
                valor(mm1, "Lq"), valor(mm2, "Lq")],
            [`W - Tiempo en sistema (${unidad})`,
                valor(mm1, "W"), valor(mm2, "W")],
            [`Wq - Tiempo en cola (${unidad})`,
                valor(mm1, "Wq"), valor(mm2, "Wq")],
            [`P${n} - Probabilidad`,
                valor(mm1, "Pn", true),
                valor(mm2, "Pn", true)]
        ];

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
                        ${filas.map(f => `
                            <tr>
                                <td>${f[0]}</td>
                                <td>${f[1]}</td>
                                <td>${f[2]}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;

        mostrar(comparacionDiv);
    }

    /* PROCEDIMIENTO PASO A PASO */

    function paso(titulo, formula, sustitucion, resultado) {
        return `
            <div class="sen-iteracion">
                <h4>${titulo}</h4>
                <p><strong>Fórmula:</strong> ${formula}</p>
                <p><strong>Sustitución:</strong> ${sustitucion}</p>
                <p><strong>Resultado:</strong> ${resultado}</p>
            </div>
        `;
    }

    function procedimientoMM1(r, lambda, mu, n, unidad) {

        let html = paso(
            "1. Factor de utilización (ρ)",
            "ρ = λ / μ",
            `${lambda} / ${mu}`,
            porcentaje(r.rho)
        );

        if (!r.estable) {
            return html + `
                <div class="mensaje-error">
                    M/M/1 inestable: λ ≥ μ.
                    No se calculan resultados estacionarios.
                </div>
            `;
        }

        html += paso(
            "2. Probabilidad de sistema vacío (P₀)",
            "P₀ = 1 - ρ",
            `1 - ${numero(r.rho)}`,
            porcentaje(r.P0)
        );

        html += paso(
            "3. Número promedio en sistema (L)",
            "L = λ / (μ - λ)",
            `${lambda} / (${mu} - ${lambda})`,
            numero(r.L) + " clientes"
        );

        html += paso(
            "4. Número promedio en cola (Lq)",
            "Lq = λ² / [μ(μ - λ)]",
            `${lambda}² / [${mu}(${mu} - ${lambda})]`,
            numero(r.Lq) + " clientes"
        );

        html += paso(
            "5. Tiempo promedio en sistema (W)",
            "W = 1 / (μ - λ)",
            `1 / (${mu} - ${lambda})`,
            numero(r.W) + " " + unidad
        );

        html += paso(
            "6. Tiempo promedio en cola (Wq)",
            "Wq = λ / [μ(μ - λ)]",
            `${lambda} / [${mu}(${mu} - ${lambda})]`,
            numero(r.Wq) + " " + unidad
        );

        html += paso(
            `7. Probabilidad P${n}`,
            "Pn = (1 - ρ)ρⁿ",
            `(1 - ${numero(r.rho)}) × ${numero(r.rho)}^${n}`,
            porcentaje(r.Pn)
        );

        return html;
    }

    function procedimientoMM2(r, lambda, mu, n, unidad) {

        const a = lambda / mu;

        let html = paso(
            "1. Factor de utilización (ρ)",
            "ρ = λ / (2μ)",
            `${lambda} / (2 × ${mu})`,
            porcentaje(r.rho)
        );

        if (!r.estable) {
            return html + `
                <div class="mensaje-error">
                    M/M/2 inestable: λ ≥ 2μ.
                    No se calculan resultados estacionarios.
                </div>
            `;
        }

        html += paso(
            "2. Carga ofrecida (a)",
            "a = λ / μ",
            `${lambda} / ${mu}`,
            numero(a)
        );

        const termino1 = 1 + a;
        const termino2 = a * a / (2 * (1 - r.rho));

        html += paso(
            "3. Probabilidad de sistema vacío (P₀)",
            "P₀ = 1 / [1 + a + a² / (2(1 - ρ))]",
            `1 / [1 + ${numero(a)} +
             ${numero(a)}² / (2(1 - ${numero(r.rho)}))]
             <p>Primer término = ${numero(termino1)}</p>
             <p>Segundo término = ${numero(termino2)}</p>
             <p>Denominador = ${numero(termino1 + termino2)}</p>`,
            porcentaje(r.P0)
        );

        const numerador = r.P0 * a * a * r.rho;
        const denominador = 2 * Math.pow(1 - r.rho, 2);

        html += paso(
            "4. Número promedio en cola (Lq)",
            "Lq = [P₀ × a² × ρ] / [2(1 - ρ)²]",
            `${numero(r.P0)} × ${numero(a)}² ×
             ${numero(r.rho)} / [2(1 - ${numero(r.rho)})²]
             <p>Numerador = ${numero(numerador)}</p>
             <p>Denominador = ${numero(denominador)}</p>`,
            numero(r.Lq) + " clientes"
        );

        html += paso(
            "5. Número promedio en sistema (L)",
            "L = Lq + λ / μ",
            `${numero(r.Lq)} + ${lambda} / ${mu}`,
            numero(r.L) + " clientes"
        );

        html += paso(
            "6. Tiempo promedio en cola (Wq)",
            "Wq = Lq / λ, para λ > 0",
            lambda === 0
                ? "λ = 0: no hay llegadas ni espera."
                : `${numero(r.Lq)} / ${lambda}`,
            numero(r.Wq) + " " + unidad
        );

        html += paso(
            "7. Tiempo promedio en sistema (W)",
            "W = Wq + 1 / μ",
            `${numero(r.Wq)} + 1 / ${mu}`,
            numero(r.W) + " " + unidad
        );

        const formulaPn = n < 2
            ? "Pn = P₀ × aⁿ / n!"
            : "Pn = P₀ × a² / 2! × ρ⁽ⁿ⁻²⁾";

        const sustitucionPn = n < 2
            ? `${numero(r.P0)} × ${numero(a)}^${n} / ${n}!`
            : `${numero(r.P0)} × ${numero(a)}² / 2 ×
               ${numero(r.rho)}^(${n} - 2)`;

        html += paso(
            `8. Probabilidad P${n}`,
            formulaPn,
            sustitucionPn,
            porcentaje(r.Pn)
        );

        return html;
    }

    /* RESOLVER */

    function resolver() {

        limpiarError();

        const lambdaTexto = lambdaInput.value.trim();
        const muTexto = muInput.value.trim();
        const nTexto = nInput.value.trim();

        if (!lambdaTexto || !muTexto || !nTexto) {
            mostrarError("Completa todos los campos.");
            return;
        }

        const lambda = Number(lambdaTexto);
        const mu = Number(muTexto);
        const n = Number(nTexto);

        if (!Number.isFinite(lambda) ||
            !Number.isFinite(mu) ||
            !Number.isSafeInteger(n)) {
            mostrarError("Ingresa valores numéricos válidos.");
            return;
        }

        if (lambda < 0) {
            mostrarError("λ no puede ser negativa.");
            return;
        }

        if (mu <= 0) {
            mostrarError("μ debe ser mayor que cero.");
            return;
        }

        if (n < 0) {
            mostrarError("n debe ser un entero no negativo.");
            return;
        }

        const unidad = unidadInput.value;
        const modelo = modeloInput.value;

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

    /* BOTÓN RESOLVER */

    formulario.addEventListener("submit", function (evento) {
        evento.preventDefault();
        resolver();
    });

    /* BOTÓN CARGAR EJEMPLO */

    botonEjemplo.addEventListener("click", function () {
        lambdaInput.value = "8";
        muInput.value = "5";
        unidadInput.value = "horas";
        modeloInput.value = "MM2";
        nInput.value = "2";

        resolver();
    });

    /* BOTÓN LIMPIAR */

    botonLimpiar.addEventListener("click", function () {
        limpiarError();

        ocultar(resultadosDiv);
        ocultar(comparacionDiv);
        ocultar(procedimientoDiv);

        estadoDiv.innerHTML = "";
        kpisDiv.innerHTML = "";
        tablaDiv.innerHTML = "";
        pasosDiv.innerHTML = "";
    });

    /* BOTÓN IMPRIMIR */

    botonImprimir.addEventListener("click", function () {
        window.print();
    });

    /* ESTADO INICIAL */

    limpiarError();
    ocultar(resultadosDiv);
    ocultar(comparacionDiv);
    ocultar(procedimientoDiv);

});
