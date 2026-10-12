
/*
 * AGUA SALVAVIDAS
 * Método M Grande - Motor simbólico
 *
 * Representa los coeficientes como:
 * aM + b
 *
 * Evita sustituir M por un número fijo.
 */

(function () {
    "use strict";

    const EPS = 1e-9;
    const MAX_ITERACIONES = 300;

    // Representa una expresión aM + b.
    function par(m = 0, c = 0) {
        return { m, c };
    }

    // Resta dos expresiones simbólicas.
    function restar(a, b) {
        return par(a.m - b.m, a.c - b.c);
    }

    // Multiplica una expresión por un número.
    function multiplicar(a, numero) {
        return par(a.m * numero, a.c * numero);
    }

    // Compara expresiones dando prioridad a M.
    function comparar(a, b) {
        if (Math.abs(a.m - b.m) > EPS) {
            return Math.sign(a.m - b.m);
        }

        if (Math.abs(a.c - b.c) > EPS) {
            return Math.sign(a.c - b.c);
        }

        return 0;
    }

    // Copia una tabla sin compartir sus objetos.
    function copiarTabla(tabla) {
        return tabla.map(fila =>
            fila.map(valor =>
                typeof valor === "number"
                    ? valor
                    : par(valor.m, valor.c)
            )
        );
    }

    // Elimina errores numéricos muy pequeños.
    function limpiarNumero(numero) {
        return Math.abs(numero) < EPS ? 0 : numero;
    }

    /*
     * RESOLUCIÓN DEL MÉTODO M GRANDE
     */
    window.ejecutarMGrande = function (datos) {

        const { n, m } = datos;

        const nombres = Array.from(
            { length: n },
            (_, j) => "X" + (j + 1)
        );

        const extras = [];
        const base = [];
        const artificiales = [];

        const filas = datos.restricciones.map(r => ({
            a: [...r.coeficientes],
            signo: r.signo,
            rhs: r.rhs
        }));

        let contadorS = 0;
        let contadorE = 0;
        let contadorA = 0;

        /*
         * AGREGAR VARIABLES AUXILIARES
         *
         * <= : holgura
         * >= : exceso y artificial
         *  = : artificial
         */

        filas.forEach((restriccion, i) => {

            if (restriccion.signo === "<=") {

                extras.push({
                    nombre: "S" + (++contadorS),
                    fila: i,
                    valor: 1,
                    basica: true
                });

            } else if (restriccion.signo === ">=") {

                extras.push({
                    nombre: "E" + (++contadorE),
                    fila: i,
                    valor: -1,
                    basica: false
                });

                extras.push({
                    nombre: "A" + (++contadorA),
                    fila: i,
                    valor: 1,
                    basica: true,
                    artificial: true
                });

            } else if (restriccion.signo === "=") {

                extras.push({
                    nombre: "A" + (++contadorA),
                    fila: i,
                    valor: 1,
                    basica: true,
                    artificial: true
                });

            } else {
                throw new Error(
                    "Signo de restricción no válido."
                );
            }
        });

        extras.forEach(variable => {
            nombres.push(variable.nombre);
        });

        const N = nombres.length;
        const RHS = N;

        /*
         * CONSTRUIR TABLA INICIAL
         */

        const tabla = filas.map((restriccion, i) => {

            const fila = Array(N + 1).fill(0);

            restriccion.a.forEach((valor, j) => {
                fila[j] = valor;
            });

            extras.forEach((variable, k) => {

                if (variable.fila === i) {
                    fila[n + k] = variable.valor;
                }
            });

            fila[RHS] = restriccion.rhs;

            const variableBasica = extras.find(
                variable =>
                    variable.fila === i &&
                    variable.basica
            );

            base.push(variableBasica.nombre);

            return fila;
        });

        extras.forEach((variable, k) => {

            if (variable.artificial) {
                artificiales.push(n + k);
            }
        });

        /*
         * CONSTRUIR FILA Z
         *
         * Las variables artificiales reciben
         * penalización simbólica M.
         */

        const z = Array.from(
            { length: N + 1 },
            (_, j) => {

                if (j < n) {

                    const coeficiente =
                        datos.tipo === "max"
                            ? datos.objetivo[j]
                            : -datos.objetivo[j];

                    return par(0, -coeficiente);
                }

                return par(0, 0);
            }
        );

        artificiales.forEach(j => {
            z[j] = par(1, 0);
        });

        /*
         * CANONIZAR LA FILA Z
         */

        for (let i = 0; i < m; i++) {

            if (base[i].startsWith("A")) {

                for (let j = 0; j <= RHS; j++) {

                    z[j] = restar(
                        z[j],
                        par(tabla[i][j], 0)
                    );
                }
            }
        }

        /*
         * GUARDAR ITERACIONES
         */

        function guardarIteracion(
            numero,
            entrante = null,
            saliente = null,
            pivote = null
        ) {
            return {
                numero,
                tabla: copiarTabla([...tabla, z]),
                base: [...base],
                entrante,
                saliente,
                pivote
            };
        }

        const iteraciones = [guardarIteracion(0)];

        let estado = "optimo";
        let contador = 0;

        /*
         * ALGORITMO SIMPLEX CON M SIMBÓLICA
         */

        while (contador < MAX_ITERACIONES) {

            let columna = -1;

            // Elegir columna entrante.
            for (let j = 0; j < N; j++) {

                if (
                    comparar(z[j], par()) < 0 &&
                    (
                        columna < 0 ||
                        comparar(z[j], z[columna]) < 0
                    )
                ) {
                    columna = j;
                }
            }

            // Si no hay coeficientes negativos,
            // se alcanzó la condición de optimalidad.
            if (columna < 0) {
                break;
            }

            let filaPivote = -1;
            let menorRatio = Infinity;

            /*
             * PRUEBA DE RAZONES
             */

            for (let i = 0; i < m; i++) {

                const valor = tabla[i][columna];

                if (valor > EPS) {

                    const ratio =
                        tabla[i][RHS] / valor;

                    if (
                        ratio < menorRatio - EPS ||
                        (
                            Math.abs(
                                ratio - menorRatio
                            ) < EPS &&
                            filaPivote >= 0 &&
                            base[i].startsWith("A") &&
                            !base[filaPivote].startsWith("A")
                        )
                    ) {
                        menorRatio = ratio;
                        filaPivote = i;
                    }
                }
            }

            // No existe fila saliente.
            if (filaPivote < 0) {
                estado = "no_acotado";
                break;
            }

            const entrante = nombres[columna];
            const saliente = base[filaPivote];

            const pivote =
                tabla[filaPivote][columna];

            const factorZ = par(
                z[columna].m,
                z[columna].c
            );

            /*
             * NORMALIZAR FILA PIVOTE
             */

            for (let j = 0; j <= RHS; j++) {

                tabla[filaPivote][j] =
                    limpiarNumero(
                        tabla[filaPivote][j] / pivote
                    );
            }

            /*
             * HACER CEROS EN LAS OTRAS FILAS
             */

            for (let i = 0; i < m; i++) {

                if (i === filaPivote) {
                    continue;
                }

                const factor = tabla[i][columna];

                for (let j = 0; j <= RHS; j++) {

                    tabla[i][j] = limpiarNumero(
                        tabla[i][j] -
                        factor * tabla[filaPivote][j]
                    );
                }
            }

            /*
             * ACTUALIZAR FILA Z SIMBÓLICA
             */

            for (let j = 0; j <= RHS; j++) {

                z[j] = restar(
                    z[j],
                    multiplicar(
                        factorZ,
                        tabla[filaPivote][j]
                    )
                );
            }

            base[filaPivote] = entrante;

            contador++;

            const anterior =
                iteraciones[iteraciones.length - 1];

            anterior.entrante = entrante;
            anterior.saliente = saliente;
            anterior.pivote = pivote;

            iteraciones.push(
                guardarIteracion(contador)
            );
        }

        /*
         * VERIFICAR ESTADO FINAL
         */

        if (
            contador >= MAX_ITERACIONES &&
            estado === "optimo"
        ) {
            estado = "limite";
        }

        if (estado === "optimo") {

            const artificialPositiva = base.some(
                (nombre, i) =>
                    nombre.startsWith("A") &&
                    tabla[i][RHS] > 1e-7
            );

            if (artificialPositiva) {
                estado = "no_factible";
            }
        }

        /*
         * OBTENER VARIABLES ORIGINALES
         */

        const variables = Array(n).fill(0);

        for (let i = 0; i < m; i++) {

            const indice = nombres.indexOf(base[i]);

            if (indice >= 0 && indice < n) {

                variables[indice] =
                    limpiarNumero(tabla[i][RHS]);
            }
        }

        /*
         * EVALUAR FUNCIÓN OBJETIVO ORIGINAL
         */

        const valorZ = variables.reduce(
            (total, valor, j) =>
                total + valor * datos.objetivo[j],
            0
        );

        return {
            estado,
            nombres: [...nombres, "RHS"],
            iteraciones,
            variables,
            valorZ,
            artificiales: artificiales.map(
                j => nombres[j]
            )
        };
    };


    /*
     * MOSTRAR EXPRESIONES CON M
     */

    window.formatearM = function (valor) {

        function formato(numero) {
            return Number(
                limpiarNumero(numero).toFixed(6)
            ).toString();
        }

        if (typeof valor === "number") {
            return formato(valor);
        }

        if (!valor || typeof valor.m !== "number") {
            return String(valor);
        }

        const m = limpiarNumero(valor.m);
        const c = limpiarNumero(valor.c);

        if (m === 0) {
            return formato(c);
        }

        const magnitud =
            Math.abs(Math.abs(m) - 1) < EPS
                ? ""
                : formato(Math.abs(m));

        const terminoM =
            (m < 0 ? "-" : "") +
            magnitud + "M";

        if (c === 0) {
            return terminoM;
        }

        return terminoM +
            (c < 0 ? " - " : " + ") +
            formato(Math.abs(c));
    };


    /*
     * VALIDAR DIMENSIONES DEL MODELO
     */

    const generarOriginal =
        window.generarModeloMGrande;

    window.generarModeloMGrande = function () {

        const n = Number(
            document.getElementById(
                "numVariablesM"
            ).value
        );

        const m = Number(
            document.getElementById(
                "numRestriccionesM"
            ).value
        );

        if (
            !Number.isInteger(n) ||
            !Number.isInteger(m) ||
            n < 1 || m < 1 ||
            n > 10 || m > 10
        ) {

            window.mostrarErrorM(
                "Las cantidades deben ser números " +
                "enteros entre 1 y 10."
            );

            return;
        }

        generarOriginal();

        document.getElementById(
            "panelModeloM"
        ).dataset.dim = n + "," + m;
    };


    /*
     * EVITAR RESOLVER UN MODELO DESACTUALIZADO
     */

    const resolverOriginal =
        window.resolverMGrande;

    window.resolverMGrande = function () {

        const panel = document.getElementById(
            "panelModeloM"
        );

        const actual =
            document.getElementById(
                "numVariablesM"
            ).value +
            "," +
            document.getElementById(
                "numRestriccionesM"
            ).value;

        if (
            panel.classList.contains("oculto") ||
            panel.dataset.dim !== actual
        ) {

            window.mostrarErrorM(
                "La configuración cambió. " +
                "Pulsa Generar modelo nuevamente."
            );

            return;
        }

        resolverOriginal();
    };

})();
