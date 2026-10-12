
/*
 * Agua Salvavidas
 * Mejoras visuales para M Grande
 */

(function () {

    const generarOriginal = generarModeloMGrande;
    const resolverOriginal = resolverMGrande;
    const limpiarOriginal = limpiarMGrande;

    function actualizarEtapasM(etapa) {

        for (let i = 1; i <= 3; i++) {

            const elemento = document.getElementById("etapaM" + i);

            if (!elemento) continue;

            elemento.classList.remove("activa", "completada");

            if (i < etapa) {
                elemento.classList.add("completada");
            }

            if (i === etapa) {
                elemento.classList.add("activa");
            }
        }
    }

    generarModeloMGrande = function () {

        generarOriginal();

        const panel = document.getElementById("panelModeloM");

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasM(2);
        }
    };

    resolverMGrande = function () {

        resolverOriginal();

        const panel = document.getElementById("panelResultadosM");

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasM(3);
            mejorarTablasM();
        }
    };

    limpiarMGrande = function () {

        limpiarOriginal();

        actualizarEtapasM(1);
    };

    function mejorarTablasM() {

        const tablas = document.querySelectorAll(
            "#procedimientoMGrande .tabla-simplex"
        );

        tablas.forEach(tabla => {

            const encabezados = tabla.querySelectorAll("thead th");

            encabezados.forEach(th => {

                const texto = th.textContent.trim();

                if (/^A\d+$/i.test(texto)) {
                    th.classList.add("m-columna-artificial");
                }

                if (/^E\d+$/i.test(texto)) {
                    th.classList.add("m-columna-exceso");
                }
            });

            const filas = tabla.querySelectorAll("tbody tr");

            filas.forEach(fila => {

                const primeraCelda = fila.querySelector("td");

                if (!primeraCelda) return;

                const nombre = primeraCelda.textContent.trim();

                if (/^A\d+$/i.test(nombre)) {
                    fila.classList.add("m-fila-artificial");
                }
            });
        });
    }

})();
/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */


