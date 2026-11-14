"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const $ = id => document.getElementById(id);

    const fmt = n => Number.isFinite(n)
        ? Number(n.toPrecision(12)).toLocaleString("es-GT", {
            maximumFractionDigits: 6
        })
        : "No definido";

    const indicadores = [
        ["rho", "ρ - Utilización"],
        ["P0", "P₀ - Sistema vacío"],
        ["L", "L - Clientes en el sistema"],
        ["Lq", "Lq - Clientes en cola"],
        ["W", "W - Tiempo en el sistema"],
        ["Wq", "Wq - Tiempo en cola"],
        ["Pn", "Pn - Exactamente n clientes"]
    ];

    function calcular(lambda, mu, n, servidores) {
        const capacidad = servidores * mu;

        if (lambda >= capacidad) {
            return {
                estable: false,
                capacidad,
                servidores
            };
        }

        const a = lambda / mu;
        const rho = lambda / capacidad;

        if (servidores === 1) {
            const P0 = 1 - rho;
            const L = rho / (1 - rho);
            const Lq = rho * L;
            const W = 1 / (mu - lambda);
            const Wq = rho / (mu - lambda);
            const Pn = P0 * Math.pow(rho, n);

            return {
                estable: true, servidores, capacidad,
                a, rho, P0, L, Lq, W, Wq, Pn
            };
        }

        const P0 = 1 / (
            1 + a + (a * a) / (2 * (1 - rho))
        );

        const Lq = P0 * a * a * rho /
                   (2 * Math.pow(1 - rho, 2));

        const L = Lq + a;
        const Wq = lambda === 0 ? 0 : Lq / lambda;
        const W = Wq + 1 / mu;

        // Para n=0 y n=1 se utiliza n!.
        // Para n>=2 se utiliza 2! * 2^(n-2).
        let Pn;

        if (n === 0) {
            Pn = P0;
        } else if (n === 1) {
            Pn = P0 * a;
        } else {
            Pn = P0 * a * a / 2 *
                 Math.pow(rho, n - 2);
        }

        return {
            estable: true, servidores, capacidad,
            a, rho, P0, L, Lq, W, Wq, Pn
        };
    }

    function valor(resultado, clave, unidad) {
        if (!resultado.estable) return "Inestable";

        if (clave === "rho") {
            return fmt(resultado.rho * 100) + " %";
        }

        if (clave === "W" || clave === "Wq") {
            return fmt(resultado[clave]) + " " + unidad + "(s)";
        }

        return fmt(resultado[clave]);
    }

    function paso(titulo, formula, sustitucion, resultado) {
        return `
            <article class="sen-iteracion">
                <h3>${titulo}</h3>
                <p class="colas-formula">
                    <strong>Fórmula:</strong> ${formula}
                </p>
                <p class="colas-formula">
                    <strong>Sustitución:</strong> ${sustitucion}
                </p>
                <p class="colas-formula">
                    <strong>Resultado:</strong> ${resultado}
                </p>
            </article>
        `;
    }

    function procedimiento(l, m, n, r, unidad) {
        const c = r.servidores;
        const a = r.a;
        const rho = r.rho;
        let html = "";

        html += paso(
            "1. Condición de estabilidad",
            "λ < cμ",
            `${fmt(l)} < ${c} × ${fmt(m)}`,
            "Sistema estable"
        );

        html += paso(
            "2. Utilización del sistema (ρ)",
            "ρ = λ / (cμ)",
            `${fmt(l)} / (${c} × ${fmt(m)})`,
            `${fmt(rho)} = ${fmt(rho * 100)} %`
        );

        if (c === 1) {
            html += paso(
                "3. Probabilidad del sistema vacío (P₀)",
                "P₀ = 1 - ρ",
                `1 - ${fmt(rho)}`,
                fmt(r.P0)
            );

            html += paso(
                "4. Clientes promedio en el sistema (L)",
                "L = λ / (μ - λ)",
                `${fmt(l)} / (${fmt(m)} - ${fmt(l)})`,
                fmt(r.L)
            );

            html += paso(
                "5. Clientes promedio en cola (Lq)",
                "Lq = λ² / [μ(μ - λ)]",
                `${fmt(l)}² / [${fmt(m)} × (${fmt(m)} - ${fmt(l)})]`,
                fmt(r.Lq)
            );

            html += paso(
                "6. Tiempo promedio en el sistema (W)",
                "W = 1 / (μ - λ)",
                `1 / (${fmt(m)} - ${fmt(l)})`,
                fmt(r.W) + " " + unidad + "(s)"
            );

            html += paso(
                "7. Tiempo promedio en cola (Wq)",
                "Wq = λ / [μ(μ - λ)]",
                `${fmt(l)} / [${fmt(m)} × (${fmt(m)} - ${fmt(l)})]`,
                fmt(r.Wq) + " " + unidad + "(s)"
            );

            html += paso(
                `8. Probabilidad de ${n} clientes (Pn)`,
                "Pn = (1 - ρ) × ρⁿ",
                `${fmt(r.P0)} × ${fmt(rho)}^${n}`,
                fmt(r.Pn)
            );

        } else {
            html += paso(
                "3. Carga ofrecida (a)",
                "a = λ / μ",
                `${fmt(l)} / ${fmt(m)}`,
                fmt(a)
            );

            html += paso(
                "4. Probabilidad del sistema vacío (P₀)",
                "P₀ = 1 / [1 + a + a² / (2(1-ρ))]",
                `1 / [1 + ${fmt(a)} + ${fmt(a)}² / (2(1-${fmt(rho)}))]`,
                fmt(r.P0)
            );

            html += paso(
                "5. Clientes promedio en cola (Lq)",
                "Lq = P₀ × a² × ρ / [2(1-ρ)²]",
                `${fmt(r.P0)} × ${fmt(a)}² × ${fmt(rho)} / [2(1-${fmt(rho)})²]`,
                fmt(r.Lq)
            );

            html += paso(
                "6. Clientes promedio en el sistema (L)",
                "L = Lq + λ/μ",
                `${fmt(r.Lq)} + ${fmt(l)}/${fmt(m)}`,
                fmt(r.L)
            );

            html += paso(
                "7. Tiempo promedio en cola (Wq)",
                "Wq = Lq / λ, para λ > 0",
                l === 0
                    ? "λ = 0: no existen llegadas ni espera en cola"
                    : `${fmt(r.Lq)} / ${fmt(l)}`,
                fmt(r.Wq) + " " + unidad + "(s)"
            );

            html += paso(
                "8. Tiempo promedio en el sistema (W)",
                "W = Wq + 1/μ",
                `${fmt(r.Wq)} + 1/${fmt(m)}`,
                fmt(r.W) + " " + unidad + "(s)"
            );

            const formulaPn = n < 2
                ? "Pn = P₀ × aⁿ / n!"
                : "Pn = P₀ × a² / 2! × ρ⁽ⁿ⁻²⁾";

            const sustitucionPn = n < 2
                ? `${fmt(r.P0)} × ${fmt(a)}^${n} / ${n}!`
                : `${fmt(r.P0)} × ${fmt(a)}² / 2 × ${fmt(rho)}^${n - 2}`;

            html += paso(
                `9. Probabilidad de ${n} clientes (Pn)`,
                formulaPn,
                sustitucionPn,
                fmt(r.Pn)
            );
        }

        return html;
    }

    function ejecutar(evento) {
        evento.preventDefault();

        const lambdaTexto = $("colasLambda").value.trim();
        const muTexto = $("colasMu").value.trim();
        const nTexto = $("colasN").value.trim();

        const l = Number(lambdaTexto);
        const m = Number(muTexto);
        const n = Number(nTexto);
        const unidad = $("colasUnidad").value;
        const modelo = $("colasModelo").value;

        const error = $("colasError");
        error.classList.add("oculto");

        ["colasResultados", "colasComparacion",
         "colasProcedimiento"].forEach(id => {
            $(id).classList.add("oculto");
        });

        if (
            !lambdaTexto || !muTexto || !nTexto ||
            !Number.isFinite(l) || !Number.isFinite(m) ||
            l < 0 || m <= 0 ||
            !Number.isSafeInteger(n) || n < 0 ||
            !Number.isFinite(2 * m)
        ) {
            error.textContent =
                "Datos inválidos: λ debe ser mayor o igual a 0, " +
                "μ debe ser mayor que 0 y n debe ser un entero no negativo.";
            error.classList.remove("oculto");
            return;
        }

        const mm1 = calcular(l, m, n, 1);
        const mm2 = calcular(l, m, n, 2);
        const seleccionado = modelo === "MM1" ? mm1 : mm2;

        $("colasResultados").classList.remove("oculto");
        $("colasComparacion").classList.remove("oculto");
        $("colasProcedimiento").classList.remove("oculto");

        if (!seleccionado.estable) {
            $("colasEstado").innerHTML = `
                <div class="mensaje-error">
                    <strong>Sistema inestable.</strong>
                    λ = ${fmt(l)} y la capacidad es
                    ${fmt(seleccionado.capacidad)}.
                    No se cumple λ &lt; cμ.
                    No existen resultados de estado estable.
                </div>
            `;

            $("colasKpis").innerHTML = "";

            $("colasPasos").innerHTML = paso(
                "Validación de estabilidad",
                "λ < cμ",
                `${fmt(l)} < ${fmt(seleccionado.capacidad)}`,
                "Condición incumplida. Sistema inestable."
            );
        } else {
            $("colasEstado").innerHTML = `
                <div class="mensaje-exito">
                    <strong>Sistema estable.</strong>
                    La tasa de llegadas es menor que
                    la capacidad total de atención.
                </div>
            `;

            $("colasKpis").innerHTML = indicadores.map(
                ([clave, nombre]) => `
                    <article class="pert-kpi">
                        <span>${nombre}</span>
                        <strong>${valor(seleccionado, clave, unidad)}</strong>
                    </article>
                `
            ).join("");

            $("colasPasos").innerHTML =
                procedimiento(l, m, n, seleccionado, unidad);
        }

        let tabla = `
            <tr>
                <th>Estabilidad</th>
                <td>${mm1.estable ? "Estable" : "Inestable"}</td>
                <td>${mm2.estable ? "Estable" : "Inestable"}</td>
            </tr>
        `;

        indicadores.forEach(([clave, nombre]) => {
            tabla += `
                <tr>
                    <th>${nombre}</th>
                    <td>${valor(mm1, clave, unidad)}</td>
                    <td>${valor(mm2, clave, unidad)}</td>
                </tr>
            `;
        });

        $("colasTabla").innerHTML = tabla;
    }

    $("colasFormulario").addEventListener("submit", ejecutar);

    $("colasEjemplo").addEventListener("click", () => {
        $("colasLambda").value = 8;
        $("colasMu").value = 5;
        $("colasN").value = 2;
        $("colasUnidad").value = "hora";
        $("colasModelo").value = "MM2";
        $("colasFormulario").requestSubmit();
    });

    $("colasFormulario").addEventListener("reset", () => {
        $("colasError").classList.add("oculto");

        ["colasResultados", "colasComparacion",
         "colasProcedimiento"].forEach(id => {
            $(id).classList.add("oculto");
        });
    });

    $("colasImprimir").addEventListener("click", () => {
        window.print();
    });

});
