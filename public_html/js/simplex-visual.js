
/*
 * GREAT VALUE - FASE II
 * Mejoras visuales del Método Simplex
 * Compatible con hasta 20 variables y 20 restricciones
 */

(function () {
    "use strict";

    const originalGenerar = window.generarModeloSimplex;
    const originalResolver = window.resolverSimplex;
    const originalLimpiar = window.limpiarSimplex;

    // =====================================================
    // ACTUALIZAR ETAPAS DEL PROCEDIMIENTO
    // =====================================================

    function actualizarEtapas(etapa) {

        for (let i = 1; i <= 3; i++) {

            const elemento = document.getElementById(
                "etapaSimplex" + i
            );

            if (!elemento) {
                continue;
            }

            elemento.classList.remove(
                "activa",
                "completada"
            );

            if (i < etapa) {
                elemento.classList.add("completada");
            }

            if (i === etapa) {
                elemento.classList.add("activa");
            }
        }
    }

    // =====================================================
    // GENERAR MODELO
    // =====================================================

    window.generarModeloSimplex = function () {

        originalGenerar();

        const panel = document.getElementById(
            "panelModelo"
        );

        if (
            panel &&
            !panel.classList.contains("oculto")
        ) {
            actualizarEtapas(2);
        }
    };

    // =====================================================
    // RESOLVER SIMPLEX
    // =====================================================

    window.resolverSimplex = function () {

        originalResolver();

        const panel = document.getElementById(
            "panelResultados"
        );

        if (
            panel &&
            !panel.classList.contains("oculto")
        ) {
            actualizarEtapas(3);
            resaltarTablasSimplex();
        }
    };

    // =====================================================
    // LIMPIAR MODELO
    // =====================================================

    window.limpiarSimplex = function () {

        originalLimpiar();

        actualizarEtapas(2);
    };

    // =====================================================
    // RESALTAR TABLAS DEL MÉTODO SIMPLEX
    // =====================================================

    function resaltarTablasSimplex() {

        const bloques = document.querySelectorAll(
            "#procedimientoSimplex .iteracion-simplex"
        );

        bloques.forEach(bloque => {

            const descripcion = bloque.querySelector(
                ".texto-iteracion"
            );

            const tabla = bloque.querySelector(
                ".tabla-simplex"
            );

            if (!descripcion || !tabla) {
                return;
            }

            const texto = descripcion.textContent;

            const entrante = texto.match(
                /Variable entrante:\s*(X\d+|S\d+)/i
            );

            const saliente = texto.match(
                /Variable saliente:\s*(X\d+|S\d+)/i
            );

            if (!entrante || !saliente) {
                return;
            }

            const encabezados = Array.from(
                tabla.querySelectorAll("thead th")
            );

            const indiceColumna = encabezados.findIndex(
                th => th.textContent.trim() === entrante[1]
            );

            const filas = Array.from(
                tabla.querySelectorAll("tbody tr")
            );

            const filaSaliente = filas.find(tr => {

                const primeraCelda = tr.querySelector("td");

                return primeraCelda &&
                    primeraCelda.textContent.trim() === saliente[1];
            });

            if (indiceColumna < 0 || !filaSaliente) {
                return;
            }

            // Resaltar encabezado de variable entrante
            encabezados[indiceColumna].classList.add(
                "simplex-encabezado-entrante"
            );

            // Resaltar columna entrante
            filas.forEach(fila => {

                const celdas = fila.querySelectorAll("td");

                if (celdas[indiceColumna]) {
                    celdas[indiceColumna].classList.add(
                        "simplex-celda-entrante"
                    );
                }
            });

            // Resaltar fila saliente
            filaSaliente.classList.add(
                "simplex-fila-saliente"
            );

            // Resaltar elemento pivote
            const celdasPivote = filaSaliente.querySelectorAll(
                "td"
            );

            if (celdasPivote[indiceColumna]) {
                celdasPivote[indiceColumna].classList.add(
                    "simplex-celda-pivote"
                );
            }
        });
    }

})();
