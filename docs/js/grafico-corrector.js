/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */



/*
 * AGUA SALVAVIDAS
 * Corrección matemática del Método Gráfico
 *
 * Verifica:
 * 1. Datos válidos
 * 2. Existencia de región factible
 * 3. Objetivo no acotado
 * 4. Configuración del modelo
 *
 * No modifica el diseño existente.
 */

(function () {
    "use strict";

    const EPS = 1e-8;

    const generarOriginal = window.generarModeloGrafico;
    const resolverOriginal = window.resolverGrafico;
    const ejemploOriginal = window.cargarEjemploGrafico;
    const limpiarOriginal = window.limpiarGrafico;

    function elemento(id) {
        return document.getElementById(id);
    }

    function numero(id) {
        const campo = elemento(id);

        if (!campo) {
            throw new Error("No existe el campo " + id);
        }

        const texto = campo.value.trim();

        if (texto === "") {
            throw new Error(
                "Completa todos los coeficientes."
            );
        }

        const valor = Number(texto);

        if (!Number.isFinite(valor)) {
            throw new Error(
                "Ingresa solamente números válidos."
            );
        }

        return valor;
    }

    function mostrarError(texto) {
        const error = elemento("mensajeErrorGrafico");

        if (error) {
            error.textContent = texto;
            error.classList.remove("oculto");
        }
    }

    function ocultarError() {
        const error = elemento("mensajeErrorGrafico");

        if (error) {
            error.textContent = "";
            error.classList.add("oculto");
        }
    }

    function leerModelo() {
        const cantidad = numero(
            "numRestriccionesGrafico"
        );

        if (
            !Number.isInteger(cantidad) ||
            cantidad < 1 ||
            cantidad > 10
        ) {
            throw new Error(
                "La cantidad de restricciones debe " +
                "ser un entero entre 1 y 10."
            );
        }

        const objetivo = [
            numero("g_fo_0"),
            numero("g_fo_1")
        ];

        const restricciones = [];

        for (let i = 0; i < cantidad; i++) {
            const a = numero("g_r_" + i + "_0");
            const b = numero("g_r_" + i + "_1");
            const rhs = numero("g_rhs_" + i);

            const selector = elemento("g_signo_" + i);

            if (!selector) {
                throw new Error(
                    "Debes generar nuevamente el modelo."
                );
            }

            const signo = selector.value;

            if (
                signo !== "<=" &&
                signo !== ">=" &&
                signo !== "="
            ) {
                throw new Error(
                    "El signo de una restricción no es válido."
                );
            }

            restricciones.push({
                a, b, rhs, signo
            });
        }

        return {
            tipo: elemento("tipoGrafico").value,
            objetivo,
            restricciones
        };
    }

    /*
     * COMPROBAR SI UN PUNTO ES FACTIBLE
     */

    function cumple(punto, restricciones) {
        const [x, y] = punto;

        if (x < -EPS || y < -EPS) {
            return false;
        }

        return restricciones.every(r => {
            const valor = r.a * x + r.b * y;
            const tolerancia = EPS * (
                1 +
                Math.abs(valor) +
                Math.abs(r.rhs)
            );

            if (r.signo === "<=") {
                return valor <= r.rhs + tolerancia;
            }

            if (r.signo === ">=") {
                return valor >= r.rhs - tolerancia;
            }

            return Math.abs(valor - r.rhs)
                <= tolerancia;
        });
    }

    /*
     * INTERSECCIÓN ENTRE DOS RECTAS
     */

    function interseccion(r1, r2) {
        const det = r1.a * r2.b - r2.a * r1.b;

        if (Math.abs(det) < EPS) {
            return null;
        }

        const x = (
            r1.rhs * r2.b -
            r2.rhs * r1.b
        ) / det;

        const y = (
            r1.a * r2.rhs -
            r2.a * r1.rhs
        ) / det;

        return [x, y];
    }

    /*
     * BUSCAR VÉRTICES FACTIBLES
     *
     * Incluye:
     * - Todas las restricciones
     * - Eje X
     * - Eje Y
     */

    function buscarVertices(restricciones) {
        const rectas = [
            ...restricciones,
            { a: 1, b: 0, rhs: 0 },
            { a: 0, b: 1, rhs: 0 }
        ];

        const puntos = [];

        for (let i = 0; i < rectas.length; i++) {
            for (let j = i + 1; j < rectas.length; j++) {

                const punto = interseccion(
                    rectas[i],
                    rectas[j]
                );

                if (!punto) continue;

                if (!cumple(punto, restricciones)) {
                    continue;
                }

                const repetido = puntos.some(p =>
                    Math.abs(p[0] - punto[0]) < EPS &&
                    Math.abs(p[1] - punto[1]) < EPS
                );

                if (!repetido) {
                    puntos.push(punto);
                }
            }
        }

        return puntos;
    }

    /*
     * ANALIZAR DIRECCIONES NO ACOTADAS
     *
     * Toda dirección de crecimiento posible
     * satisface:
     *
     * d1 >= 0
     * d2 >= 0
     * d1 + d2 = 1
     *
     * Definimos:
     *
     * d1 = t
     * d2 = 1 - t
     *
     * con 0 <= t <= 1.
     */

    function analizarDirecciones(restricciones) {
        let minimo = 0;
        let maximo = 1;

        function aplicar(a, b, signo) {
            // a*t + b*(1-t) [signo] 0
            const pendiente = a - b;
            const constante = b;

            if (signo === "=") {
                return (
                    aplicar(a, b, "<=") &&
                    aplicar(a, b, ">=")
                );
            }

            if (Math.abs(pendiente) < EPS) {
                return signo === "<="
                    ? constante <= EPS
                    : constante >= -EPS;
            }

            const limite = -constante / pendiente;

            if (signo === "<=") {
                if (pendiente > 0) {
                    maximo = Math.min(maximo, limite);
                } else {
                    minimo = Math.max(minimo, limite);
                }
            } else {
                if (pendiente > 0) {
                    minimo = Math.max(minimo, limite);
                } else {
                    maximo = Math.min(maximo, limite);
                }
            }

            return minimo <= maximo + EPS;
        }

        for (const r of restricciones) {
            if (!aplicar(r.a, r.b, r.signo)) {
                return {
                    existe: false,
                    minimo: 0,
                    maximo: 0
                };
            }
        }

        return {
            existe: minimo <= maximo + EPS,
            minimo,
            maximo
        };
    }

    /*
     * VERIFICAR SI LA FUNCIÓN OBJETIVO
     * PUEDE CRECER O DECRECER SIN LÍMITE
     */

    function objetivoNoAcotado(modelo) {
        const direcciones = analizarDirecciones(
            modelo.restricciones
        );

        if (!direcciones.existe) {
            return false;
        }

        const [c1, c2] = modelo.objetivo;

        function evaluar(t) {
            return c1 * t + c2 * (1 - t);
        }

        const v1 = evaluar(direcciones.minimo);
        const v2 = evaluar(direcciones.maximo);

        if (modelo.tipo === "max") {
            return Math.max(v1, v2) > EPS;
        }

        return Math.min(v1, v2) < -EPS;
    }

    /*
     * VALIDACIÓN AL GENERAR EL MODELO
     */

    window.generarModeloGrafico = function () {
        ocultarError();

        const cantidad = Number(
            elemento("numRestriccionesGrafico").value
        );

        if (
            !Number.isInteger(cantidad) ||
            cantidad < 1 ||
            cantidad > 10
        ) {
            mostrarError(
                "Ingresa una cantidad entera " +
                "de restricciones entre 1 y 10."
            );
            return;
        }

        generarOriginal();

        const panel = elemento("panelModeloGrafico");

        if (
            panel &&
            !panel.classList.contains("oculto")
        ) {
            panel.dataset.cantidad = String(cantidad);
        }
    };

    /*
     * VALIDACIÓN ANTES DE RESOLVER
     */

    window.resolverGrafico = function () {
        ocultarError();

        try {
            const panel = elemento("panelModeloGrafico");

            const cantidadActual = elemento(
                "numRestriccionesGrafico"
            ).value;

            if (
                !panel ||
                panel.classList.contains("oculto") ||
                panel.dataset.cantidad !== cantidadActual
            ) {
                throw new Error(
                    "La configuración cambió. " +
                    "Genera nuevamente el modelo."
                );
            }

            const modelo = leerModelo();

            const vertices = buscarVertices(
                modelo.restricciones
            );

            if (vertices.length === 0) {
                elemento("panelResultadosGrafico")
                    .classList.add("oculto");

                mostrarError(
                    "Problema infactible: no existe " +
                    "un punto que cumpla todas " +
                    "las restricciones."
                );
                return;
            }

            if (objetivoNoAcotado(modelo)) {
                elemento("panelResultadosGrafico")
                    .classList.add("oculto");

                mostrarError(
                    "Problema no acotado: existen " +
                    "soluciones factibles que mejoran " +
                    "indefinidamente la función objetivo. " +
                    "No hay un óptimo finito."
                );
                return;
            }

            /*
             * El problema tiene un óptimo finito.
             * Ejecutar el algoritmo original.
             */

            resolverOriginal();

        } catch (error) {
            const resultados = elemento(
                "panelResultadosGrafico"
            );

            if (resultados) {
                resultados.classList.add("oculto");
            }

            mostrarError(error.message);
        }
    };

    /*
     * COMPATIBILIDAD CON LOS BOTONES
     */

    window.cargarEjemploGrafico = function () {
        ejemploOriginal();

        const panel = elemento("panelModeloGrafico");

        if (
            panel &&
            !panel.classList.contains("oculto")
        ) {
            panel.dataset.cantidad = elemento(
                "numRestriccionesGrafico"
            ).value;
        }
    };

    window.limpiarGrafico = function () {
        limpiarOriginal();
        ocultarError();
    };

})();

