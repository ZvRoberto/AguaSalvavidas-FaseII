
/*
 * AGUA SALVAVIDAS
 * Corrector del Método Esquina Noroeste
 *
 * Funciones:
 * - Validar dimensiones.
 * - Evitar matrices desactualizadas.
 * - Verificar oferta y demanda.
 * - Comprobar asignaciones y costo total.
 * - Detectar degeneración.
 */

(function () {
    "use strict";

    const EPS = 1e-7;

    const generarOriginal = window.generarMatrizNoroeste;
    const resolverOriginal = window.resolverNoroeste;
    const ejecutarOriginal = window.ejecutarNoroeste;
    const ejemploOriginal = window.cargarEjemploNoroeste;
    const limpiarOriginal = window.limpiarNoroeste;

    function elemento(id) {
        return document.getElementById(id);
    }

    function mostrarError(mensaje) {
        window.mostrarErrorNoroeste(mensaje);
    }

    function dimensiones() {
        const origenInput = elemento("numOrigenes");
        const destinoInput = elemento("numDestinos");

        const origenes = Number(origenInput.value);
        const destinos = Number(destinoInput.value);

        if (
            origenInput.value.trim() === "" ||
            destinoInput.value.trim() === "" ||
            !Number.isInteger(origenes) ||
            !Number.isInteger(destinos) ||
            origenes < 1 ||
            destinos < 1 ||
            origenes > 10 ||
            destinos > 10
        ) {
            throw new Error(
                "Los orígenes y destinos deben ser " +
                "números enteros entre 1 y 10."
            );
        }

        return { origenes, destinos };
    }

    function firmaDimensiones() {
        const { origenes, destinos } = dimensiones();
        return origenes + "," + destinos;
    }

    function ocultarResultados() {
        const panel = elemento("panelResultadosNoroeste");

        if (panel) {
            panel.classList.add("oculto");
        }
    }

    /*
     * VALIDAR GENERACIÓN DE MATRIZ
     */

    window.generarMatrizNoroeste = function () {
        try {
            const firma = firmaDimensiones();

            generarOriginal();

            const panel = elemento("panelMatrizNoroeste");

            if (panel && !panel.classList.contains("oculto")) {
                panel.dataset.dimension = firma;
            }

        } catch (error) {
            ocultarResultados();
            mostrarError(error.message);
        }
    };

    /*
     * COMPROBAR CONSERVACIÓN DE UNIDADES
     *
     * Cada origen debe distribuir toda su oferta.
     * Cada destino debe recibir toda su demanda.
     */

    function verificarAsignaciones(resultado) {
        const {
            asignaciones,
            oferta,
            demanda,
            costos
        } = resultado;

        if (
            asignaciones.length !== oferta.length ||
            costos.length !== oferta.length
        ) {
            throw new Error(
                "La matriz resultante tiene dimensiones incorrectas."
            );
        }

        for (let i = 0; i < oferta.length; i++) {
            if (
                asignaciones[i].length !== demanda.length ||
                costos[i].length !== demanda.length
            ) {
                throw new Error(
                    "Una fila tiene una cantidad incorrecta de destinos."
                );
            }

            let enviado = 0;

            for (let j = 0; j < demanda.length; j++) {
                const cantidad = asignaciones[i][j];

                if (
                    !Number.isFinite(cantidad) ||
                    cantidad < -EPS
                ) {
                    throw new Error(
                        "Existe una asignación inválida."
                    );
                }

                enviado += cantidad;
            }

            if (Math.abs(enviado - oferta[i]) > EPS) {
                throw new Error(
                    "La oferta del origen " + (i + 1) +
                    " no coincide con sus asignaciones."
                );
            }
        }

        for (let j = 0; j < demanda.length; j++) {
            let recibido = 0;

            for (let i = 0; i < oferta.length; i++) {
                recibido += asignaciones[i][j];
            }

            if (Math.abs(recibido - demanda[j]) > EPS) {
                throw new Error(
                    "La demanda del destino " + (j + 1) +
                    " no coincide con sus asignaciones."
                );
            }
        }

        /*
         * RECALCULAR COSTO INDEPENDIENTEMENTE
         */

        let costoVerificado = 0;

        for (let i = 0; i < oferta.length; i++) {
            for (let j = 0; j < demanda.length; j++) {
                costoVerificado +=
                    asignaciones[i][j] * costos[i][j];
            }
        }

        if (
            Math.abs(costoVerificado - resultado.costoTotal) >
            EPS * Math.max(1, Math.abs(costoVerificado))
        ) {
            throw new Error(
                "El costo total calculado no coincide " +
                "con las asignaciones."
            );
        }

        return costoVerificado;
    }

    /*
     * DETECTAR DEGENERACIÓN
     *
     * En un problema de transporte con:
     * m orígenes y n destinos,
     *
     * una solución básica no degenerada
     * tiene m + n - 1 variables básicas.
     *
     * Las asignaciones positivas pueden ser
     * menos que esa cantidad.
     */

    function analizarDegeneracion(resultado) {
        const m = resultado.oferta.length;
        const n = resultado.demanda.length;

        let positivas = 0;

        resultado.asignaciones.forEach(fila => {
            fila.forEach(cantidad => {
                if (cantidad > EPS) {
                    positivas++;
                }
            });
        });

        return {
            positivas,
            requeridas: m + n - 1,
            degenerada: positivas < m + n - 1
        };
    }

    /*
     * REVISAR EL ALGORITMO ORIGINAL
     */

    window.ejecutarNoroeste = function (datos) {
        const resultado = ejecutarOriginal(datos);

        const costoVerificado =
            verificarAsignaciones(resultado);

        const degeneracion =
            analizarDegeneracion(resultado);

        resultado.verificacion = {
            correcta: true,
            costoVerificado,
            ...degeneracion
        };

        return resultado;
    };

    /*
     * MOSTRAR INFORMACIÓN DE VERIFICACIÓN
     */

    const mostrarOriginal = window.mostrarResultadoNoroeste;

    window.mostrarResultadoNoroeste = function (
        datos,
        resultado
    ) {
        mostrarOriginal(datos, resultado);

        const contenedor = elemento("procedimientoNoroeste");

        if (!contenedor || !resultado.verificacion) {
            return;
        }

        const v = resultado.verificacion;

        const bloque = document.createElement("section");
        bloque.className = "noroeste-verificacion";

        const titulo = document.createElement("h4");
        titulo.textContent = "Verificación matemática";
        bloque.appendChild(titulo);

        const parrafo = document.createElement("p");
        parrafo.textContent =
            "Todas las ofertas y demandas se cumplen. " +
            "El costo total se recalculó de manera independiente: " +
            Number(v.costoVerificado.toFixed(6)) + ".";
        bloque.appendChild(parrafo);

        const basicas = document.createElement("p");
        basicas.textContent =
            "Asignaciones positivas: " + v.positivas +
            ". Cantidad de variables básicas requerida: " +
            v.requeridas + ".";
        bloque.appendChild(basicas);

        if (v.degenerada) {
            const aviso = document.createElement("p");
            aviso.className = "noroeste-aviso";
            aviso.textContent =
                "Solución degenerada: para aplicar MODI " +
                "será necesario completar una base válida " +
                "con asignaciones básicas de valor cero.";
            bloque.appendChild(aviso);
        }

        const nota = document.createElement("p");
        nota.textContent =
            "La Esquina Noroeste proporciona una solución " +
            "factible inicial. No garantiza el costo mínimo.";
        bloque.appendChild(nota);

        contenedor.appendChild(bloque);
    };

    /*
     * RESOLVER CON MATRIZ ACTUALIZADA
     */

    window.resolverNoroeste = function () {
        window.ocultarErrorNoroeste();

        try {
            const firma = firmaDimensiones();
            const panel = elemento("panelMatrizNoroeste");

            if (
                !panel ||
                panel.classList.contains("oculto") ||
                panel.dataset.dimension !== firma
            ) {
                throw new Error(
                    "Cambiaste la cantidad de orígenes o " +
                    "destinos. Genera nuevamente la matriz."
                );
            }

            ocultarResultados();

            resolverOriginal();

        } catch (error) {
            ocultarResultados();
            mostrarError(error.message);
        }
    };

    /*
     * CONSERVAR BOTONES EXISTENTES
     */

    window.cargarEjemploNoroeste = function () {
        ejemploOriginal();

        const panel = elemento("panelMatrizNoroeste");

        if (panel && !panel.classList.contains("oculto")) {
            panel.dataset.dimension = firmaDimensiones();
        }
    };

    window.limpiarNoroeste = function () {
        limpiarOriginal();
        ocultarResultados();

        const panel = elemento("panelMatrizNoroeste");

        if (panel) {
            delete panel.dataset.dimension;
        }
    };

})();
