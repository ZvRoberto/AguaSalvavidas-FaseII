/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */



/*
 * Agua Salvavidas
 * Mejoras visuales del método Simplex
 */

(function () {

    const originalGenerar = generarModeloSimplex;
    const originalResolver = resolverSimplex;
    const originalLimpiar = limpiarSimplex;

    function actualizarEtapas(etapa) {

        for (let i = 1; i <= 3; i++) {

            const elemento = document.getElementById(
                "etapaSimplex" + i
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


    generarModeloSimplex = function () {

        originalGenerar();

        const panel = document.getElementById(
            "panelModelo"
        );

        if (!panel.classList.contains("oculto")) {
            actualizarEtapas(2);
        }
    };


    resolverSimplex = function () {

        originalResolver();

        const panel = document.getElementById(
            "panelResultados"
        );

        if (!panel.classList.contains("oculto")) {

            actualizarEtapas(3);

            resaltarTablasSimplex();
        }
    };


    limpiarSimplex = function () {

        originalLimpiar();

        actualizarEtapas(2);
    };


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

            if (!descripcion || !tabla) return;

            const texto = descripcion.textContent;

            const entrante = texto.match(
                /Variable entrante:\s*(X\d+|S\d+)/i
            );

            const saliente = texto.match(
                /Variable saliente:\s*(X\d+|S\d+)/i
            );

            if (!entrante || !saliente) return;

            const encabezados = Array.from(
                tabla.querySelectorAll("thead th")
            );

            const indiceColumna = encabezados.findIndex(
                th => th.textContent.trim() === entrante[1]
            );

            const filas = Array.from(
                tabla.querySelectorAll("tbody tr")
            );

            const filaSaliente = filas.find(
                tr => {
                    const primeraCelda = tr.querySelector("td");

                    return primeraCelda &&
                        primeraCelda.textContent.trim() === saliente[1];
                }
            );

            if (indiceColumna < 0 || !filaSaliente) return;

            encabezados[indiceColumna].classList.add(
                "simplex-encabezado-entrante"
            );

            filas.forEach(fila => {

                const celdas = fila.querySelectorAll("td");

                if (celdas[indiceColumna]) {
                    celdas[indiceColumna].classList.add(
                        "simplex-celda-entrante"
                    );
                }
            });

            filaSaliente.classList.add(
                "simplex-fila-saliente"
            );

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
