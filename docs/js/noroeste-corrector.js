
/*
 * GREAT VALUE - FASE II
 * Corrector del Método de la Esquina Noroeste
 * Compatible con hasta 20 orígenes y 20 destinos
 */

(function () {
    "use strict";

    const EPS = 1e-7;
    const MAX_DIMENSION = 20;

    const generarOriginal = window.generarMatrizNoroeste;
    const ejecutarOriginal = window.ejecutarNoroeste;
    const resolverOriginal = window.resolverNoroeste;
    const ejemploOriginal = window.cargarEjemploNoroeste;

    function obtenerElemento(id) {
        return document.getElementById(id);
    }

    function numeroCercano(a, b) {
        return Math.abs(a - b) <=
            EPS * Math.max(1, Math.abs(a), Math.abs(b));
    }

    // =====================================================
    // VALIDAR DIMENSIONES
    // =====================================================

    function validarDimensiones() {
        const origenes = Number(
            obtenerElemento("numOrigenes").value
        );

        const destinos = Number(
            obtenerElemento("numDestinos").value
        );

        if (
            !Number.isInteger(origenes) ||
            !Number.isInteger(destinos) ||
            origenes < 1 ||
            destinos < 1 ||
            origenes > MAX_DIMENSION ||
            destinos > MAX_DIMENSION
        ) {
            throw new Error(
                "Debes ingresar entre 1 y 20 orígenes y destinos."
            );
        }

        return { origenes, destinos };
    }

    // =====================================================
    // GENERAR MATRIZ Y GUARDAR DIMENSIONES
    // =====================================================

    window.generarMatrizNoroeste = function () {
        try {
            const dimensiones = validarDimensiones();

            generarOriginal();

            const panel = obtenerElemento(
                "panelMatrizNoroeste"
            );

            if (panel && !panel.classList.contains("oculto")) {
                panel.dataset.dimension =
                    dimensiones.origenes + "," +
                    dimensiones.destinos;
            }

        } catch (error) {
            window.mostrarErrorNoroeste(error.message);
        }
    };

    // =====================================================
    // VERIFICAR QUE LA MATRIZ ESTÉ ACTUALIZADA
    // =====================================================

    function verificarMatrizActual() {
        const dimensiones = validarDimensiones();

        const panel = obtenerElemento(
            "panelMatrizNoroeste"
        );

        if (
            !panel ||
            panel.classList.contains("oculto")
        ) {
            throw new Error(
                "Primero debes generar la matriz de transporte."
            );
        }

        const dimensionActual =
            dimensiones.origenes + "," +
            dimensiones.destinos;

        if (panel.dataset.dimension !== dimensionActual) {
            throw new Error(
                "Cambiaste el número de orígenes o destinos. " +
                "Presiona Generar matriz nuevamente."
            );
        }

        return dimensiones;
    }

    // =====================================================
    // VALIDAR DATOS DE ENTRADA
    // =====================================================

    function validarDatos(datos) {
        if (!datos || typeof datos !== "object") {
            throw new Error(
                "No se encontraron datos de transporte."
            );
        }

        const {
            origenes,
            destinos,
            costos,
            oferta,
            demanda
        } = datos;

        if (
            !Array.isArray(costos) ||
            !Array.isArray(oferta) ||
            !Array.isArray(demanda) ||
            costos.length !== origenes ||
            oferta.length !== origenes ||
            demanda.length !== destinos
        ) {
            throw new Error(
                "Las dimensiones de la matriz son incorrectas."
            );
        }

        for (let i = 0; i < origenes; i++) {
            if (
                !Array.isArray(costos[i]) ||
                costos[i].length !== destinos
            ) {
                throw new Error(
                    "La fila " + (i + 1) +
                    " de costos está incompleta."
                );
            }

            if (
                !Number.isFinite(oferta[i]) ||
                oferta[i] < 0
            ) {
                throw new Error(
                    "La oferta del origen " + (i + 1) +
                    " debe ser no negativa."
                );
            }

            for (let j = 0; j < destinos; j++) {
                if (
                    !Number.isFinite(costos[i][j]) ||
                    costos[i][j] < 0
                ) {
                    throw new Error(
                        "El costo de O" + (i + 1) +
                        " a D" + (j + 1) +
                        " debe ser no negativo."
                    );
                }
            }
        }

        for (let j = 0; j < destinos; j++) {
            if (
                !Number.isFinite(demanda[j]) ||
                demanda[j] < 0
            ) {
                throw new Error(
                    "La demanda del destino " + (j + 1) +
                    " debe ser no negativa."
                );
            }
        }

        const totalOferta = oferta.reduce(
            (total, valor) => total + valor,
            0
        );

        const totalDemanda = demanda.reduce(
            (total, valor) => total + valor,
            0
        );

        if (
            !Number.isFinite(totalOferta) ||
            !Number.isFinite(totalDemanda) ||
            totalOferta <= EPS ||
            totalDemanda <= EPS
        ) {
            throw new Error(
                "La oferta y la demanda totales deben ser " +
                "mayores que cero."
            );
        }
    }

    // =====================================================
    // VALIDAR SOLUCIÓN
    // =====================================================

    function validarResultado(resultado) {
        if (
            !resultado ||
            !Array.isArray(resultado.asignaciones) ||
            !Array.isArray(resultado.oferta) ||
            !Array.isArray(resultado.demanda) ||
            !Array.isArray(resultado.costos)
        ) {
            throw new Error(
                "El algoritmo no devolvió una solución válida."
            );
        }

        const filas = resultado.oferta.length;
        const columnas = resultado.demanda.length;

        if (
            resultado.asignaciones.length !== filas ||
            resultado.costos.length !== filas
        ) {
            throw new Error(
                "La matriz de resultados tiene dimensiones incorrectas."
            );
        }

        let costoCalculado = 0;

        // Comprobar cada origen.
        for (let i = 0; i < filas; i++) {
            const fila = resultado.asignaciones[i];
            const filaCostos = resultado.costos[i];

            if (
                !Array.isArray(fila) ||
                !Array.isArray(filaCostos) ||
                fila.length !== columnas ||
                filaCostos.length !== columnas
            ) {
                throw new Error(
                    "La fila " + (i + 1) +
                    " de resultados está incompleta."
                );
            }

            let sumaFila = 0;

            for (let j = 0; j < columnas; j++) {
                const cantidad = fila[j];
                const costo = filaCostos[j];

                if (
                    !Number.isFinite(cantidad) ||
                    cantidad < -EPS ||
                    !Number.isFinite(costo)
                ) {
                    throw new Error(
                        "Se encontró una asignación o costo inválido."
                    );
                }

                sumaFila += cantidad;
                costoCalculado += cantidad * costo;
            }

            if (!numeroCercano(sumaFila, resultado.oferta[i])) {
                throw new Error(
                    "La asignación del origen " + (i + 1) +
                    " no coincide con su oferta."
                );
            }
        }

        // Comprobar cada destino.
        for (let j = 0; j < columnas; j++) {
            let sumaColumna = 0;

            for (let i = 0; i < filas; i++) {
                sumaColumna += resultado.asignaciones[i][j];
            }

            if (
                !numeroCercano(
                    sumaColumna,
                    resultado.demanda[j]
                )
            ) {
                throw new Error(
                    "La asignación del destino " + (j + 1) +
                    " no coincide con su demanda."
                );
            }
        }

        if (
            !Number.isFinite(resultado.costoTotal) ||
            !numeroCercano(
                costoCalculado,
                resultado.costoTotal
            )
        ) {
            throw new Error(
                "El costo total no coincide con las asignaciones."
            );
        }

        return true;
    }

    // =====================================================
    // EJECUTAR CON VERIFICACIÓN
    // =====================================================

    window.ejecutarNoroeste = function (datos) {
        validarDatos(datos);

        const resultado = ejecutarOriginal(datos);

        validarResultado(resultado);

        return resultado;
    };

    // =====================================================
    // RESOLVER CON CONTROL DE ERRORES
    // =====================================================

    window.resolverNoroeste = function () {
        window.ocultarErrorNoroeste();

        try {
            verificarMatrizActual();

            // Resolver usando el motor y el corrector.
            resolverOriginal();

        } catch (error) {
            const panel = obtenerElemento(
                "panelResultadosNoroeste"
            );

            if (panel) {
                panel.classList.add("oculto");
            }

            window.mostrarErrorNoroeste(error.message);
        }
    };

    // =====================================================
    // CARGAR EJEMPLO
    // =====================================================

    window.cargarEjemploNoroeste = function () {
        ejemploOriginal();

        const panel = obtenerElemento(
            "panelMatrizNoroeste"
        );

        if (panel && !panel.classList.contains("oculto")) {
            const dimensiones = validarDimensiones();

            panel.dataset.dimension =
                dimensiones.origenes + "," +
                dimensiones.destinos;
        }
    };

})();
