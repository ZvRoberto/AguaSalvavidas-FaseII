
/*
 * GREAT VALUE - FASE II
 * Visualización del Método de la Esquina Noroeste
 * Compatible con hasta 20 orígenes y 20 destinos
 */

(function () {
    "use strict";

    const generarOriginal = window.generarMatrizNoroeste;
    const resolverOriginal = window.resolverNoroeste;
    const limpiarOriginal = window.limpiarNoroeste;
    const ejemploOriginal = window.cargarEjemploNoroeste;
    const mostrarOriginal = window.mostrarResultadoNoroeste;

    // =====================================================
    // CONTROL DE ETAPAS
    // =====================================================

    function actualizarEtapasNoroeste(etapaActual) {
        for (let i = 1; i <= 3; i++) {
            const etapa = document.getElementById("etapaN" + i);

            if (!etapa) {
                continue;
            }

            etapa.classList.remove("activa", "completada");

            if (i < etapaActual) {
                etapa.classList.add("completada");
            } else if (i === etapaActual) {
                etapa.classList.add("activa");
            }
        }
    }

    // =====================================================
    // MEJORAR TABLAS DE RESULTADOS
    // =====================================================

    function resaltarAsignacionesNoroeste() {
        const contenedor = document.getElementById(
            "procedimientoNoroeste"
        );

        if (!contenedor) {
            return;
        }

        const tablas = contenedor.querySelectorAll(
            ".tabla-transporte"
        );

        tablas.forEach(tabla => {
            const filas = tabla.querySelectorAll("tbody tr");

            filas.forEach(fila => {
                const celdas = fila.querySelectorAll("td");

                celdas.forEach(celda => {
                    if (
                        celda.classList.contains(
                            "noroeste-celda-asignada"
                        )
                    ) {
                        celda.classList.add(
                            "noroeste-asignacion-destacada"
                        );
                    }
                });
            });
        });
    }

    // =====================================================
    // ENUMERAR PASOS
    // =====================================================

    function mejorarPasosNoroeste() {
        const pasos = document.querySelectorAll(
            "#procedimientoNoroeste .noroeste-paso"
        );

        pasos.forEach((paso, indice) => {
            paso.classList.add("noroeste-paso-visual");

            const titulo = paso.querySelector("h4");

            if (!titulo) {
                return;
            }

            const numero = document.createElement("span");
            numero.className = "noroeste-numero-paso";
            numero.textContent = String(indice + 1);

            titulo.prepend(numero);
        });
    }

    // =====================================================
    // MEJORAR RESULTADO FINAL
    // =====================================================

    function destacarCostoTotal() {
        const resultado = document.querySelector(
            "#procedimientoNoroeste .resultado-final"
        );

        if (!resultado) {
            return;
        }

        resultado.classList.add(
            "noroeste-resultado-destacado"
        );
    }

    // =====================================================
    // GENERAR MATRIZ
    // =====================================================

    window.generarMatrizNoroeste = function () {
        generarOriginal();

        const panel = document.getElementById(
            "panelMatrizNoroeste"
        );

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasNoroeste(2);
        }
    };

    // =====================================================
    // MOSTRAR RESULTADOS
    // =====================================================

    window.mostrarResultadoNoroeste = function (
        datos,
        resultado
    ) {
        mostrarOriginal(datos, resultado);

        resaltarAsignacionesNoroeste();
        mejorarPasosNoroeste();
        destacarCostoTotal();

        actualizarEtapasNoroeste(3);
    };

    // =====================================================
    // RESOLVER
    // =====================================================

    window.resolverNoroeste = function () {
        resolverOriginal();

        const panel = document.getElementById(
            "panelResultadosNoroeste"
        );

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasNoroeste(3);
        }
    };

    // =====================================================
    // CARGAR EJEMPLO
    // =====================================================

    window.cargarEjemploNoroeste = function () {
        ejemploOriginal();

        const panel = document.getElementById(
            "panelMatrizNoroeste"
        );

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasNoroeste(2);
        }
    };

    // =====================================================
    // LIMPIAR DATOS
    // =====================================================

    window.limpiarNoroeste = function () {
        limpiarOriginal();

        const panel = document.getElementById(
            "panelResultadosNoroeste"
        );

        if (panel) {
            panel.classList.add("oculto");
        }

        actualizarEtapasNoroeste(2);
    };

    // =====================================================
    // ESTADO INICIAL
    // =====================================================

    document.addEventListener("DOMContentLoaded", function () {
        actualizarEtapasNoroeste(1);
    });

})();
