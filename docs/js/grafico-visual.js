
/*
 * Agua Salvavidas
 * Mejoras visuales del Método Gráfico
 */

(function () {

    const generarOriginal = generarModeloGrafico;
    const resolverOriginal = resolverGrafico;
    const limpiarOriginal = limpiarGrafico;

    function actualizarEtapasGrafico(etapa) {

        for (let i = 1; i <= 3; i++) {

            const elemento = document.getElementById(
                "etapaG" + i
            );

            if (!elemento) continue;

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

    generarModeloGrafico = function () {

        generarOriginal();

        const panel = document.getElementById(
            "panelModeloGrafico"
        );

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasGrafico(2);
        }
    };

    resolverGrafico = function () {

        resolverOriginal();

        const panel = document.getElementById(
            "panelResultadosGrafico"
        );

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasGrafico(3);
        }
    };

    limpiarGrafico = function () {

        limpiarOriginal();

        actualizarEtapasGrafico(1);
    };

})();
/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */


