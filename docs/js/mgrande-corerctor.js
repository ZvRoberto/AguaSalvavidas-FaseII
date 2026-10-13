
/*
 * GREAT VALUE - MOTOR M GRANDE
 * Resolución mediante penalización Big M
 */

(function () {
    "use strict";

    const EPS = 1e-8;
    const MAX_ITERACIONES = 1000;

    function limpiar(valor) {
        return Math.abs(valor) < EPS ? 0 : valor;
    }

    function copiarTabla(tabla) {
        return tabla.map(fila => [...fila]);
    }

    window.ejecutarMGrande = function (datos) {
        const n = datos.n;
        const m = datos.m;

        if (!n || !m) {
            throw new Error("El modelo está vacío.");
        }

        const filas = datos.restricciones.map(r => {
            let coeficientes = [...r.coeficientes];
            let signo = r.signo;
            let rhs = r.rhs;

            // Normalizar términos independientes negativos.
            if (rhs < 0) {
                coeficientes = coeficientes.map(v => -v);
                rhs = -rhs;

                if (signo === "<=") signo = ">=";
                else if (signo === ">=") signo = "<=";
            }

            return { coeficientes, signo, rhs };
        });

        const nombres = Array.from(
            { length: n },
            (_, i) => "X" + (i + 1)
        );

        const adicionales = [];
        const artificiales = [];
        const base = [];

        let contadorS = 0;
        let contadorE = 0;
        let contadorA = 0;

        function agregarVariable(nombre, fila, valor, artificial) {
            const indice = n + adicionales.length;

            adicionales.push({
                nombre,
                fila,
                valor,
                indice,
                artificial
            });

            nombres.push(nombre);

            if (artificial) {
                artificiales.push(indice);
            }

            return indice;
        }

        filas.forEach((r, i) => {
            if (r.signo === "<=") {
                const indice = agregarVariable(
                    "S" + (++contadorS), i, 1, false
                );
                base[i] = indice;

            } else if (r.signo === ">=") {
                agregarVariable(
                    "E" + (++contadorE), i, -1, false
                );

                const indice = agregarVariable(
                    "A" + (++contadorA), i, 1, true
                );
                base[i] = indice;

            } else if (r.signo === "=") {
                const indice = agregarVariable(
                    "A" + (++contadorA), i, 1, true
                );
                base[i] = indice;

            } else {
                throw new Error("Signo de restricción no válido.");
            }
        });

        const N = nombres.length;
        const RHS = N;

        const tabla = filas.map((r, i) => {
            const fila = Array(N + 1).fill(0);

            for (let j = 0; j < n; j++) {
                fila[j] = r.coeficientes[j];
            }

            adicionales.forEach(v => {
                if (v.fila === i) {
                    fila[v.indice] = v.valor;
                }
            });

            fila[RHS] = r.rhs;

            return fila;
        });

        // Maximización equivalente.
        const signoObjetivo = datos.tipo === "max" ? 1 : -1;

        // Penalización grande respecto a los coeficientes originales.
        const maxCoeficiente = Math.max(
            1,
            ...datos.objetivo.map(v => Math.abs(v))
        );

        const M = 1000000 * maxCoeficiente;

        const costos = Array(N).fill(0);

        for (let j = 0; j < n; j++) {
            costos[j] = signoObjetivo * datos.objetivo[j];
        }

        artificiales.forEach(j => {
            costos[j] = -M;
        });

        /*
         * Fila de evaluación:
         * Zj - Cj
         *
         * Un coeficiente negativo indica
         * posibilidad de mejorar la solución.
         */
        const z = Array(N + 1).fill(0);

        function recalcularZ() {
            for (let j = 0; j <= RHS; j++) {
                z[j] = j === RHS ? 0 : -costos[j];

                for (let i = 0; i < m; i++) {
                    z[j] += costos[base[i]] * tabla[i][j];
                }

                z[j] = limpiar(z[j]);
            }
        }

        recalcularZ();

        const iteraciones = [];

        function guardarIteracion(numero) {
            return {
                numero,
                tabla: copiarTabla([...tabla, z]),
                base: base.map(indice => nombres[indice]),
                entrante: null,
                saliente: null,
                pivote: null
            };
        }

        iteraciones.push(guardarIteracion(0));

        let estado = "optimo";
        let contador = 0;

        while (contador < MAX_ITERACIONES) {
            let columna = -1;
            let minimo = -EPS;

            // Seleccionar variable entrante.
            // Se omiten las artificiales para evitar su reingreso.
            for (let j = 0; j < N; j++) {
                if (artificiales.includes(j)) continue;

                if (z[j] < minimo) {
                    minimo = z[j];
                    columna = j;
                }
            }

            if (columna === -1) {
                estado = "optimo";
                break;
            }

            // Prueba de razón mínima.
            let filaPivote = -1;
            let mejorRazon = Infinity;

            for (let i = 0; i < m; i++) {
                const coeficiente = tabla[i][columna];

                if (coeficiente > EPS) {
                    const razon = tabla[i][RHS] / coeficiente;

                    if (razon < mejorRazon - EPS) {
                        mejorRazon = razon;
                        filaPivote = i;
                    }
                }
            }

            if (filaPivote === -1) {
                estado = "no_acotado";
                break;
            }

            const saliente = nombres[base[filaPivote]];
            const entrante = nombres[columna];
            const pivote = tabla[filaPivote][columna];

            // Normalizar fila pivote.
            for (let j = 0; j <= RHS; j++) {
                tabla[filaPivote][j] /= pivote;
                tabla[filaPivote][j] =
                    limpiar(tabla[filaPivote][j]);
            }

            // Hacer ceros en las demás filas.
            for (let i = 0; i < m; i++) {
                if (i === filaPivote) continue;

                const factor = tabla[i][columna];

                for (let j = 0; j <= RHS; j++) {
                    tabla[i][j] -=
                        factor * tabla[filaPivote][j];

                    tabla[i][j] = limpiar(tabla[i][j]);
                }
            }

            base[filaPivote] = columna;

            recalcularZ();
            contador++;

            const anterior =
                iteraciones[iteraciones.length - 1];

            anterior.entrante = entrante;
            anterior.saliente = saliente;
            anterior.pivote = pivote;

            iteraciones.push(guardarIteracion(contador));
        }

        if (contador >= MAX_ITERACIONES) {
            estado = "limite";
        }

        // Comprobar si alguna artificial permanece positiva.
        const artificialPositiva = base.some((indice, i) =>
            artificiales.includes(indice) &&
            tabla[i][RHS] > 1e-6
        );

        if (artificialPositiva) {
            estado = "no_factible";
        }

        const variables = Array(n).fill(0);

        for (let i = 0; i < m; i++) {
            if (base[i] < n) {
                variables[base[i]] = limpiar(tabla[i][RHS]);
            }
        }

        const valorZ = variables.reduce(
            (suma, valor, j) =>
                suma + valor * datos.objetivo[j],
            0
        );

        return {
            estado,
            nombres: [...nombres, "RHS"],
            iteraciones,
            variables,
            valorZ: limpiar(valorZ),
            artificiales: artificiales.map(j => nombres[j])
        };
    };

})();
