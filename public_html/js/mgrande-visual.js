
/*
 * GREAT VALUE - PRESENTACIÓN M GRANDE
 */

(function () {
    "use strict";

    function actualizarEtapasM(etapa) {
        for (let i = 1; i <= 3; i++) {
            const elemento = document.getElementById("etapaM" + i);

            if (!elemento) continue;

            elemento.classList.remove("activa", "completada");

            if (i < etapa) {
                elemento.classList.add("completada");
            } else if (i === etapa) {
                elemento.classList.add("activa");
            }
        }
    }

    const generarOriginal = window.generarModeloMGrande;
    const resolverOriginal = window.resolverMGrande;
    const limpiarOriginal = window.limpiarMGrande;
    const ejemploOriginal = window.cargarEjemploMGrande;

    window.generarModeloMGrande = function () {
        generarOriginal();

        const panel = document.getElementById("panelModeloM");

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasM(2);
        }
    };

    window.resolverMGrande = function () {
        resolverOriginal();

        const panel = document.getElementById("panelResultadosM");

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasM(3);
        }
    };

    window.limpiarMGrande = function () {
        limpiarOriginal();
        actualizarEtapasM(2);
    };

    window.cargarEjemploMGrande = function () {
        ejemploOriginal();
        actualizarEtapasM(2);
    };
})();
