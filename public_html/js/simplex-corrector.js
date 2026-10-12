
/*
 * AGUA SALVAVIDAS
 * Corrector y validación del Método Simplex
 *
 * Compatible con simplex.js original.
 */

(function () {
    "use strict";

    const EPS = 1e-8;
    const LIMITE = 100;

    const generarOriginal = window.generarModeloSimplex;
    const ejemploOriginal = window.cargarEjemploSimplex;
    const limpiarOriginal = window.limpiarSimplex;

    function campo(id) {
        return document.getElementById(id);
    }

    function error(mensaje) {
        window.mostrarErrorSimplex(mensaje);
    }

    function cantidad(id) {
        const input = campo(id);
        const valor = Number(input.value);

        if (
            input.value.trim() === "" ||
            !Number.isInteger(valor) ||
            valor < 1 ||
            valor > 10
        ) {
            input.classList.add("campo-invalido");

            throw new Error(
                "Las cantidades deben ser números " +
                "enteros entre 1 y 10."
            );
        }

        input.classList.remove("campo-invalido");
        return valor;
    }

    function dimensiones() {
        return {
            n: cantidad("numVariables"),
            m: cantidad("numRestricciones")
        };
    }

    /*
     * GENERACIÓN SEGURA
     */

    window.generarModeloSimplex = function () {
        try {
            const { n, m } = dimensiones();

            generarOriginal();

            const panel = campo("panelModelo");

            if (!panel.classList.contains("oculto")) {
                panel.dataset.dimension = n + "," + m;
            }

        } catch (e) {
            campo("panelResultados")
                .classList.add("oculto");

            error(e.message);
        }
    };

    /*
     * EVITAR MODELOS DESACTUALIZADOS
     */

    function verificarModelo() {
        const { n, m } = dimensiones();
        const panel = campo("panelModelo");

        if (
            panel.classList.contains("oculto") ||
            panel.dataset.dimension !== n + "," + m
        ) {
            throw new Error(
                "Cambiaste la configuración. " +
                "Presiona Generar modelo nuevamente."
            );
        }

        return { n, m };
    }

    /*
     * MOTOR SIMPLEX REVISADO
     *
     * Restricciones:
     * Ax <= b, b >= 0, x >= 0.
     */

    window.ejecutarSimplex = function (datos) {
        const n = datos.numVariables;
        const m = datos.numRestricciones;
        const rhs = n + m;
        const ancho = rhs + 1;

        const tabla = Array.from(
            { length: m + 1 },
            () => Array(ancho).fill(0)
        );

        const nombresColumnas = [
            ...Array.from(
                { length: n },
                (_, i) => "X" + (i + 1)
            ),
            ...Array.from(
                { length: m },
                (_, i) => "S" + (i + 1)
            ),
            "RHS"
        ];

        const base = Array.from(
            { length: m },
            (_, i) => "S" + (i + 1)
        );

        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                tabla[i][j] = datos.restricciones[i][j];
            }

            tabla[i][n + i] = 1;
            tabla[i][rhs] = datos.rhs[i];
        }

        for (let j = 0; j < n; j++) {
            const c = datos.tipo === "max"
                ? datos.objetivo[j]
                : -datos.objetivo[j];

            tabla[m][j] = -c;
        }

        function copia() {
            return tabla.map(fila => [...fila]);
        }

        const iteraciones = [];

        function guardar(numero) {
            const paso = {
                numero,
                tabla: copia(),
                base: [...base],
                entrante: null,
                saliente: null,
                pivote: null,
                razones: []
            };

            iteraciones.push(paso);
            return paso;
        }

        guardar(0);

        let estado = "limite_iteraciones";
        let contador = 0;

        while (contador < LIMITE) {
            let columna = -1;
            let menor = -EPS;

            for (let j = 0; j < rhs; j++) {
                if (tabla[m][j] < menor) {
                    menor = tabla[m][j];
                    columna = j;
                }
            }

            if (columna === -1) {
                estado = "optimo";
                break;
            }

            let filaPivote = -1;
            let mejorRazon = Infinity;
            const razones = [];

            for (let i = 0; i < m; i++) {
                const divisor = tabla[i][columna];

                if (divisor > EPS) {
                    const razon = tabla[i][rhs] / divisor;

                    razones.push({
                        variable: base[i],
                        razon
                    });

                    if (razon < mejorRazon - EPS) {
                        mejorRazon = razon;
                        filaPivote = i;
                    }
                } else {
                    razones.push({
                        variable: base[i],
                        razon: null
                    });
                }
            }

            const pasoActual =
                iteraciones[iteraciones.length - 1];

            pasoActual.entrante = nombresColumnas[columna];
            pasoActual.razones = razones;

            if (filaPivote === -1) {
                pasoActual.saliente = "No existe";
                pasoActual.mensaje =
                    "No existe una razón válida. " +
                    "La función objetivo no está acotada.";

                estado = "no_acotado";
                break;
            }

            const pivote = tabla[filaPivote][columna];

            pasoActual.saliente = base[filaPivote];
            pasoActual.pivote = pivote;
            pasoActual.filaPivote = filaPivote;
            pasoActual.columnaPivote = columna;

            // Convertir el pivote en 1.
            for (let j = 0; j < ancho; j++) {
                tabla[filaPivote][j] /= pivote;
            }

            // Convertir el resto de la columna en 0.
            for (let i = 0; i <= m; i++) {
                if (i === filaPivote) continue;

                const factor = tabla[i][columna];

                for (let j = 0; j < ancho; j++) {
                    tabla[i][j] -=
                        factor * tabla[filaPivote][j];

                    if (Math.abs(tabla[i][j]) < EPS) {
                        tabla[i][j] = 0;
                    }
                }
            }

            base[filaPivote] = nombresColumnas[columna];
            contador++;

            guardar(contador);
        }

        // Si la última operación llegó al límite,
        // todavía puede haber alcanzado el óptimo.
        if (estado === "limite_iteraciones") {
            const quedanNegativos =
                tabla[m].slice(0, rhs).some(
                    valor => valor < -EPS
                );

            if (!quedanNegativos) {
                estado = "optimo";
            }
        }

        const variables = Array(n).fill(0);

        for (let i = 0; i < m; i++) {
            const indice = nombresColumnas.indexOf(base[i]);

            if (indice >= 0 && indice < n) {
                variables[indice] =
                    Math.abs(tabla[i][rhs]) < EPS
                        ? 0
                        : tabla[i][rhs];
            }
        }

        // Evaluar siempre la función original.
        const valorObjetivo = variables.reduce(
            (total, x, j) => total + x * datos.objetivo[j],
            0
        );

        return {
            estado,
            iteraciones,
            nombresColumnas,
            solucion: {
                variables,
                valorObjetivo
            }
        };
    };

    /*
     * MOSTRAR RAZONES DE CADA ITERACIÓN
     */

    const mostrarOriginal = window.mostrarProcedimiento;

    window.mostrarProcedimiento = function (datos, resultado) {
        mostrarOriginal(datos, resultado);

        const bloques = document.querySelectorAll(
            "#procedimientoSimplex .iteracion-simplex"
        );

        resultado.iteraciones.forEach((iteracion, indice) => {
            const bloque = bloques[indice];

            if (!bloque || !iteracion.razones?.length) {
                return;
            }

            const contenedor = document.createElement("div");
            contenedor.className = "simplex-detalle-razones";

            const titulo = document.createElement("strong");
            titulo.textContent = "Prueba de razones";
            contenedor.appendChild(titulo);

            const lista = document.createElement("p");

            lista.textContent = iteracion.razones.map(item => {
                const valor = item.razon === null
                    ? "No aplica"
                    : Number(item.razon.toFixed(4));

                return item.variable + ": " + valor;
            }).join("  |  ");

            contenedor.appendChild(lista);

            const tabla = bloque.querySelector(".tabla-responsive");

            if (tabla) {
                bloque.insertBefore(contenedor, tabla);
            } else {
                bloque.appendChild(contenedor);
            }

            // Resaltado exacto según índices del algoritmo.
            if (
                iteracion.filaPivote !== undefined &&
                iteracion.columnaPivote !== undefined
            ) {
                const tablaHTML =
                    bloque.querySelector(".tabla-simplex");

                if (!tablaHTML) return;

                const filas = tablaHTML.querySelectorAll(
                    "tbody tr"
                );

                const encabezados = tablaHTML.querySelectorAll(
                    "thead th"
                );

                const columna = iteracion.columnaPivote + 1;
                const fila = iteracion.filaPivote;

                if (encabezados[columna]) {
                    encabezados[columna].classList.add(
                        "simplex-encabezado-entrante"
                    );
                }

                filas.forEach(tr => {
                    const celda = tr.children[columna];

                    if (celda) {
                        celda.classList.add(
                            "simplex-celda-entrante"
                        );
                    }
                });

                if (filas[fila]) {
                    filas[fila].classList.add(
                        "simplex-fila-saliente"
                    );

                    const pivoteHTML =
                        filas[fila].children[columna];

                    if (pivoteHTML) {
                        pivoteHTML.classList.add(
                            "simplex-celda-pivote"
                        );
                    }
                }
            }
        });
    };

    /*
     * RESOLVER CON VALIDACIONES
     */

    window.resolverSimplex = function () {
        window.ocultarErrorSimplex();

        try {
            verificarModelo();

            const datos = window.obtenerDatosSimplex();

            if (!["max", "min"].includes(datos.tipo)) {
                throw new Error(
                    "Selecciona una optimización válida."
                );
            }

            const resultado = window.ejecutarSimplex(datos);

            window.mostrarProcedimiento(datos, resultado);

        } catch (e) {
            campo("panelResultados")
                .classList.add("oculto");

            error(e.message);
        }
    };

    /*
     * BOTONES EXISTENTES
     */

    window.cargarEjemploSimplex = function () {
        ejemploOriginal();

        const panel = campo("panelModelo");

        if (!panel.classList.contains("oculto")) {
            panel.dataset.dimension =
                campo("numVariables").value + "," +
                campo("numRestricciones").value;
        }
    };

    window.limpiarSimplex = function () {
        limpiarOriginal();

        const panel = campo("panelModelo");

        if (panel) {
            delete panel.dataset.dimension;
        }
    };

})();
