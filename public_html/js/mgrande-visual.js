
/*
 * GREAT VALUE - FASE II
 * Visualización del Método M Grande
 * Compatible con hasta 20 variables y 20 restricciones
 */

(function () {
    "use strict";

    // =====================================================
    // FUNCIONES ORIGINALES
    // =====================================================

    const generarOriginal = window.generarModeloMGrande;
    const resolverOriginal = window.resolverMGrande;
    const limpiarOriginal = window.limpiarMGrande;
    const ejemploOriginal = window.cargarEjemploMGrande;
    const mostrarOriginal = window.mostrarMGrande;

    // =====================================================
    // CONTROL DE ETAPAS
    // =====================================================

    function actualizarEtapasM(etapaActual) {
        for (let i = 1; i <= 3; i++) {
            const etapa = document.getElementById("etapaM" + i);

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
    // RESALTAR ITERACIONES
    // =====================================================

    function resaltarTablasM() {
        const bloques = document.querySelectorAll(
            "#procedimientoMGrande .iteracion-simplex"
        );

        bloques.forEach(bloque => {
            const tabla = bloque.querySelector(".tabla-simplex");
            const detalle = bloque.querySelector(".texto-iteracion");

            if (!tabla || !detalle) {
                return;
            }

            const texto = detalle.textContent;

            const coincidenciaEntrante = texto.match(
                /Variable entrante:\s*([A-Za-z]\d+)/i
            );

            const coincidenciaSaliente = texto.match(
                /Variable saliente:\s*([A-Za-z]\d+)/i
            );

            if (!coincidenciaEntrante || !coincidenciaSaliente) {
                return;
            }

            const entrante = coincidenciaEntrante[1];
            const saliente = coincidenciaSaliente[1];

            const encabezados = Array.from(
                tabla.querySelectorAll("thead th")
            );

            const filas = Array.from(
                tabla.querySelectorAll("tbody tr")
            );

            const columnaEntrante = encabezados.findIndex(
                th => th.textContent.trim() === entrante
            );

            if (columnaEntrante === -1) {
                return;
            }

            // Resaltar encabezado de columna entrante.
            encabezados[columnaEntrante].classList.add(
                "simplex-encabezado-entrante"
            );

            // Resaltar toda la columna entrante.
            filas.forEach(fila => {
                const celdas = fila.children;

                if (celdas[columnaEntrante]) {
                    celdas[columnaEntrante].classList.add(
                        "simplex-celda-entrante"
                    );
                }
            });

            // Encontrar la fila saliente.
            const filaSaliente = filas.find(fila => {
                const primeraCelda = fila.querySelector("td");

                return primeraCelda &&
                    primeraCelda.textContent.trim() === saliente;
            });

            if (!filaSaliente) {
                return;
            }

            filaSaliente.classList.add(
                "simplex-fila-saliente"
            );

            // Resaltar elemento pivote.
            const celdaPivote =
                filaSaliente.children[columnaEntrante];

            if (celdaPivote) {
                celdaPivote.classList.add(
                    "simplex-celda-pivote"
                );
            }
        });
    }

    // =====================================================
    // MOSTRAR PRUEBA DE RAZONES
    // =====================================================

    function mostrarRazonesM(resultado) {
        if (!resultado || !Array.isArray(resultado.iteraciones)) {
            return;
        }

        const bloques = document.querySelectorAll(
            "#procedimientoMGrande .iteracion-simplex"
        );

        resultado.iteraciones.forEach((iteracion, indice) => {
            const bloque = bloques[indice];

            if (
                !bloque ||
                !Array.isArray(iteracion.razones) ||
                iteracion.razones.length === 0
            ) {
                return;
            }

            const contenedor = document.createElement("div");
            contenedor.className = "simplex-detalle-razones";

            const titulo = document.createElement("strong");
            titulo.textContent = "Prueba de la razón mínima";
            contenedor.appendChild(titulo);

            const descripcion = document.createElement("p");

            descripcion.textContent = iteracion.razones.map(
                item => {
                    if (item.razon === null) {
                        return item.variable + ": No aplica";
                    }

                    return (
                        item.variable + ": " +
                        Number(item.razon.toFixed(6))
                    );
                }
            ).join(" | ");

            contenedor.appendChild(descripcion);

            const tabla = bloque.querySelector(".tabla-responsive");

            if (tabla) {
                bloque.insertBefore(contenedor, tabla);
            } else {
                bloque.appendChild(contenedor);
            }
        });
    }

    // =====================================================
    // GENERAR MODELO
    // =====================================================

    window.generarModeloMGrande = function () {
        generarOriginal();

        const panel = document.getElementById("panelModeloM");

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasM(2);
        }
    };

    // =====================================================
    // MOSTRAR RESULTADOS
    // =====================================================

    window.mostrarMGrande = function (datos, resultado) {
        mostrarOriginal(datos, resultado);

        mostrarRazonesM(resultado);
        resaltarTablasM();

        actualizarEtapasM(3);
    };

    // =====================================================
    // RESOLVER
    // =====================================================

    window.resolverMGrande = function () {
        resolverOriginal();

        const panel = document.getElementById(
            "panelResultadosM"
        );

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasM(3);
        }
    };

    // =====================================================
    // CARGAR EJEMPLO
    // =====================================================

    window.cargarEjemploMGrande = function () {
        ejemploOriginal();

        const panel = document.getElementById("panelModeloM");

        if (panel && !panel.classList.contains("oculto")) {
            actualizarEtapasM(2);
        }
    };

    // =====================================================
    // LIMPIAR MODELO
    // =====================================================

    window.limpiarMGrande = function () {
        limpiarOriginal();

        const panelResultados = document.getElementById(
            "panelResultadosM"
        );

        if (panelResultados) {
            panelResultados.classList.add("oculto");
        }

        actualizarEtapasM(2);
    };

    // =====================================================
    // ESTADO INICIAL
    // =====================================================

    document.addEventListener("DOMContentLoaded", function () {
        actualizarEtapasM(1);
    });

})();
