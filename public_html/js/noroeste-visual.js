/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */



/*
 * Agua Salvavidas
 * Mejoras visuales de Esquina Noroeste
 *
 * Este archivo no modifica los cálculos.
 */

(function () {

    const generarOriginal = generarMatrizNoroeste;
    const resolverOriginal = resolverNoroeste;
    const limpiarOriginal = limpiarNoroeste;

    function actualizarEtapasNoroeste(etapa) {

        for (let i = 1; i <= 3; i++) {

            const elemento = document.getElementById(
                "etapaN" + i
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


    generarMatrizNoroeste = function () {

        generarOriginal();

        const panel = document.getElementById(
            "panelMatrizNoroeste"
        );

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasNoroeste(2);
        }
    };


    resolverNoroeste = function () {

        resolverOriginal();

        const panel = document.getElementById(
            "panelResultadosNoroeste"
        );

        if (panel && !panel.classList.contains("oculto")) {

            actualizarEtapasNoroeste(3);

            mejorarTablasNoroeste();
        }
    };


    limpiarNoroeste = function () {

        limpiarOriginal();

        actualizarEtapasNoroeste(1);
    };


    function mejorarTablasNoroeste() {

        const tablas = document.querySelectorAll(
            "#procedimientoNoroeste table"
        );

        tablas.forEach(tabla => {

            tabla.classList.add("noroeste-tabla-premium");

            const filas = tabla.querySelectorAll("tr");

            filas.forEach(fila => {

                const celdas = fila.querySelectorAll("td");

                celdas.forEach(celda => {

                    if (
                        celda.classList.contains(
                            "asignacion-activa"
                        )
                    ) {
                        celda.classList.add(
                            "noroeste-asignacion-premium"
                        );
                    }
                });
            });
        });
    }

})();
