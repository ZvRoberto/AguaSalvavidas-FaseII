
/*
 * GREAT VALUE - FASE II
 * Método M Grande: corrector simbólico
 * Capacidad: 20 variables y 20 restricciones
 *
 * Expresiones: aM + b
 */

(function () {
    "use strict";

    const EPS = 1e-9;
    const MAX_ITER = 1000;

    function par(m = 0, c = 0) {
        return { m, c };
    }

    function resta(a, b) {
        return par(a.m - b.m, a.c - b.c);
    }

    function producto(a, numero) {
        return par(a.m * numero, a.c * numero);
    }

    function comparar(a, b) {
        if (Math.abs(a.m - b.m) > EPS) {
            return a.m < b.m ? -1 : 1;
        }

        if (Math.abs(a.c - b.c) > EPS) {
            return a.c < b.c ? -1 : 1;
        }

        return 0;
    }

    function limpiar(numero) {
        return Math.abs(numero) < EPS ? 0 : numero;
    }

    function copiarTabla(tabla, z) {
        return [
            ...tabla.map(fila => [...fila]),
            z.map(valor => ({ ...valor }))
        ];
    }

    // =================================================
    // ALGORITMO M GRANDE
    // =================================================

    window.ejecutarMGrande = function (datos) {
        const { n, m } = datos;

        if (
            !Number.isInteger(n) || n < 1 || n > 20 ||
            !Number.isInteger(m) || m < 1 || m > 20
        ) {
            throw new Error(
                "Se permiten entre 1 y 20 variables y restricciones."
            );
        }

        const nombres = Array.from(
            { length: n },
            (_, i) => "X" + (i + 1)
        );

        const extras = [];
        const base = [];
        const artificiales = new Set();

        let s = 0;
        let e = 0;
        let a = 0;

        // Crear variables de holgura, exceso y artificiales.
        datos.restricciones.forEach((r, i) => {
            if (r.signo === "<=") {
                extras.push({
                    nombre: "S" + (++s),
                    fila: i,
                    valor: 1,
                    basica: true,
                    artificial: false
                });
            } else if (r.signo === ">=") {
                extras.push({
                    nombre: "E" + (++e),
                    fila: i,
                    valor: -1,
                    basica: false,
                    artificial: false
                });

                extras.push({
                    nombre: "A" + (++a),
                    fila: i,
                    valor: 1,
                    basica: true,
                    artificial: true
                });
            } else if (r.signo === "=") {
                extras.push({
                    nombre: "A" + (++a),
                    fila: i,
                    valor: 1,
                    basica: true,
                    artificial: true
                });
            } else {
                throw new Error(
                    "Se encontró un signo de restricción no válido."
                );
            }
        });

        extras.forEach(extra => {
            nombres.push(extra.nombre);

            if (extra.artificial) {
                artificiales.add(extra.nombre);
            }
        });

        const N = nombres.length;
        const RHS = N;

        // =================================================
        // TABLA INICIAL
        // =================================================

        const tabla = datos.restricciones.map((r, i) => {
            const fila = Array(N + 1).fill(0);

            r.coeficientes.forEach((valor, j) => {
                fila[j] = valor;
            });

            extras.forEach((extra, k) => {
                if (extra.fila === i) {
                    fila[n + k] = extra.valor;
                }
            });

            fila[RHS] = r.rhs;

            const basica = extras.find(
                extra => extra.fila === i && extra.basica
            );

            if (!basica) {
                throw new Error(
                    "No fue posible construir la base inicial."
                );
            }

            base.push(basica.nombre);

            return fila;
        });

        // =================================================
        // FUNCIÓN OBJETIVO SIMBÓLICA
        //
        // Max: penalización -M por artificial.
        // Min: transformar a maximización de -Z.
        // =================================================

        const coeficientes = nombres.map((nombre, j) => {
            if (j < n) {
                const c = datos.tipo === "max"
                    ? datos.objetivo[j]
                    : -datos.objetivo[j];

                return par(0, c);
            }

            return artificiales.has(nombre)
                ? par(-1, 0)
                : par(0, 0);
        });

        // Fila Z = -C.
        const z = coeficientes.map(valor =>
            par(-valor.m, -valor.c)
        );

        z.push(par());

        // Canonizar la fila Z usando las variables básicas.
        for (let i = 0; i < m; i++) {
            const indice = nombres.indexOf(base[i]);
            const costoBasico = coeficientes[indice];

            for (let j = 0; j <= RHS; j++) {
                z[j] = resta(
                    z[j],
                    producto(costoBasico, -tabla[i][j])
                );
            }
        }

        const iteraciones = [];

        function guardar(numero) {
            const paso = {
                numero,
                tabla: copiarTabla(tabla, z),
                base: [...base],
                entrante: null,
                saliente: null,
                pivote: null,
                filaPivote: null,
                columnaPivote: null,
                razones: []
            };

            iteraciones.push(paso);
            return paso;
        }

        guardar(0);

        let estado = "limite_iteraciones";
        let contador = 0;

        // =================================================
        // ITERACIONES SIMPLEX CON M SIMBÓLICA
        // =================================================

        while (contador < MAX_ITER) {
            let columna = -1;

            // Regla de Bland: elegir la primera columna
            // elegible para reducir problemas de ciclaje.
            for (let j = 0; j < N; j++) {
                if (
                    !artificiales.has(nombres[j]) &&
                    comparar(z[j], par()) < 0
                ) {
                    columna = j;
                    break;
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
                    const razon = tabla[i][RHS] / divisor;

                    razones.push({
                        variable: base[i],
                        razon
                    });

                    if (
                        razon < mejorRazon - EPS ||
                        (
                            Math.abs(razon - mejorRazon) <= EPS &&
                            (
                                filaPivote === -1 ||
                                nombres.indexOf(base[i]) <
                                nombres.indexOf(base[filaPivote])
                            )
                        )
                    ) {
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

            const actual = iteraciones[iteraciones.length - 1];
            actual.entrante = nombres[columna];
            actual.razones = razones;

            if (filaPivote === -1) {
                estado = "no_acotado";
                break;
            }

            const pivote = tabla[filaPivote][columna];
            const factorZ = { ...z[columna] };

            actual.saliente = base[filaPivote];
            actual.pivote = pivote;
            actual.filaPivote = filaPivote;
            actual.columnaPivote = columna;

            // Normalizar fila pivote.
            for (let j = 0; j <= RHS; j++) {
                tabla[filaPivote][j] = limpiar(
                    tabla[filaPivote][j] / pivote
                );
            }

            // Eliminar la columna entrante de las demás filas.
            for (let i = 0; i < m; i++) {
                if (i === filaPivote) continue;

                const factor = tabla[i][columna];

                for (let j = 0; j <= RHS; j++) {
                    tabla[i][j] = limpiar(
                        tabla[i][j] -
                        factor * tabla[filaPivote][j]
                    );
                }
            }

            // Actualizar fila Z simbólica.
            for (let j = 0; j <= RHS; j++) {
                z[j] = resta(
                    z[j],
                    producto(factorZ, tabla[filaPivote][j])
                );

                z[j].m = limpiar(z[j].m);
                z[j].c = limpiar(z[j].c);
            }

            base[filaPivote] = nombres[columna];
            contador++;

            guardar(contador);
        }

        // =================================================
        // ESTADO FINAL
        // =================================================

        if (estado === "limite_iteraciones") {
            const hayNegativos = z.slice(0, N).some(
                (valor, j) =>
                    !artificiales.has(nombres[j]) &&
                    comparar(valor, par()) < 0
            );

            if (!hayNegativos) {
                estado = "optimo";
            }
        }

        if (estado === "optimo") {
            const artificialPositiva = base.some(
                (nombre, i) =>
                    artificiales.has(nombre) &&
                    tabla[i][RHS] > 1e-7
            );

            if (artificialPositiva) {
                estado = "no_factible";
            }
        }

        // =================================================
        // RECUPERAR SOLUCIÓN
        // =================================================

        const variables = Array(n).fill(0);

        for (let i = 0; i < m; i++) {
            const indice = nombres.indexOf(base[i]);

            if (indice >= 0 && indice < n) {
                variables[indice] = limpiar(tabla[i][RHS]);
            }
        }

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
            artificiales: [...artificiales],
            baseFinal: [...base]
        };
    };

    // =================================================
    // FORMATO SIMBÓLICO
    // =================================================

    window.formatearM = function (valor) {
        function numero(x) {
            if (Math.abs(x) < EPS) return "0";
            return Number(x.toFixed(6)).toString();
        }

        if (typeof valor === "number") {
            return numero(valor);
        }

        if (!valor || typeof valor !== "object") {
            return String(valor);
        }

        const m = limpiar(valor.m || 0);
        const c = limpiar(valor.c || 0);

        if (m === 0) {
            return numero(c);
        }

        let resultado = "";

        if (m === 1) {
            resultado = "M";
        } else if (m === -1) {
            resultado = "-M";
        } else {
            resultado = numero(m) + "M";
        }

        if (c > 0) {
            resultado += " + " + numero(c);
        } else if (c < 0) {
            resultado += " - " + numero(-c);
        }

        return resultado;
    };

    // =================================================
    // VALIDAR DIMENSIONES DEL MODELO
    // =================================================

    const generarOriginal = window.generarModeloMGrande;

    window.generarModeloMGrande = function () {
        const n = Number(
            document.getElementById("numVariablesM").value
        );

        const m = Number(
            document.getElementById("numRestriccionesM").value
        );

        if (
            !Number.isInteger(n) || n < 1 || n > 20 ||
            !Number.isInteger(m) || m < 1 || m > 20
        ) {
            window.mostrarErrorM(
                "Ingresa entre 1 y 20 variables y restricciones."
            );
            return;
        }

        generarOriginal();

        const panel = document.getElementById("panelModeloM");

        if (!panel.classList.contains("oculto")) {
            panel.dataset.dimension = n + "," + m;
        }
    };

    // =================================================
    // VALIDAR ANTES DE RESOLVER
    // =================================================

    const resolverOriginal = window.resolverMGrande;

    window.resolverMGrande = function () {
        const n = document.getElementById("numVariablesM").value;
        const m = document.getElementById("numRestriccionesM").value;

        const panel = document.getElementById("panelModeloM");

        if (
            panel.classList.contains("oculto") ||
            panel.dataset.dimension !== n + "," + m
        ) {
            window.mostrarErrorM(
                "Cambiaste la cantidad de variables o restricciones. " +
                "Presiona Generar modelo nuevamente."
            );

            return;
        }

        resolverOriginal();
    };

})();
