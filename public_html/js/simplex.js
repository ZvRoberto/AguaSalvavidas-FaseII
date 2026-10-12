const EPSILON = 1e-9;
const MAX_ITERACIONES = 100;


// =====================================================
// GENERAR MODELO
// =====================================================

function generarModeloSimplex() {

    const numVariables =
        parseInt(document.getElementById("numVariables").value);

    const numRestricciones =
        parseInt(document.getElementById("numRestricciones").value);


    if (
        !Number.isInteger(numVariables) ||
        numVariables < 1 ||
        numVariables > 10
    ) {

        alert("El número de variables debe estar entre 1 y 10.");
        return;
    }


    if (
        !Number.isInteger(numRestricciones) ||
        numRestricciones < 1 ||
        numRestricciones > 10
    ) {

        alert("El número de restricciones debe estar entre 1 y 10.");
        return;
    }


    generarFuncionObjetivo(numVariables);

    generarRestricciones(
        numVariables,
        numRestricciones
    );


    document
        .getElementById("panelModelo")
        .classList.remove("oculto");


    document
        .getElementById("panelResultados")
        .classList.add("oculto");


    ocultarErrorSimplex();
}


// =====================================================
// FUNCIÓN OBJETIVO
// =====================================================

function generarFuncionObjetivo(numVariables) {

    const contenedor =
        document.getElementById("funcionObjetivo");

    contenedor.innerHTML = "";


    const z = document.createElement("strong");
    z.textContent = "Z = ";

    contenedor.appendChild(z);


    for (let i = 0; i < numVariables; i++) {

        const input = crearInputNumero(
            "fo_" + i
        );

        contenedor.appendChild(input);


        const variable =
            document.createElement("span");

        variable.textContent =
            " X" + (i + 1);

        contenedor.appendChild(variable);


        if (i < numVariables - 1) {

            const signo =
                document.createElement("span");

            signo.textContent = " + ";

            contenedor.appendChild(signo);
        }
    }
}


// =====================================================
// RESTRICCIONES
// =====================================================

function generarRestricciones(
    numVariables,
    numRestricciones
) {

    const contenedor =
        document.getElementById("restricciones");

    contenedor.innerHTML = "";


    for (let i = 0; i < numRestricciones; i++) {

        const fila =
            document.createElement("div");

        fila.className = "fila-restriccion";


        for (let j = 0; j < numVariables; j++) {

            const input =
                crearInputNumero(
                    "r_" + i + "_" + j
                );

            fila.appendChild(input);


            const variable =
                document.createElement("span");

            variable.textContent =
                " X" + (j + 1);

            fila.appendChild(variable);


            if (j < numVariables - 1) {

                const mas =
                    document.createElement("span");

                mas.textContent = " + ";

                fila.appendChild(mas);
            }
        }


        const signo =
            document.createElement("span");

        signo.className = "signo-restriccion";
        signo.textContent = " ≤ ";

        fila.appendChild(signo);


        const rhs =
            crearInputNumero(
                "rhs_" + i
            );

        rhs.classList.add("rhs");

        fila.appendChild(rhs);


        contenedor.appendChild(fila);
    }
}


// =====================================================
// CREAR INPUT
// =====================================================

function crearInputNumero(id) {

    const input =
        document.createElement("input");

    input.type = "number";
    input.step = "any";
    input.id = id;
    input.className = "input-coeficiente";
    input.placeholder = "0";

    input.addEventListener(
        "input",
        function () {

            this.classList.remove(
                "campo-invalido"
            );

            ocultarErrorSimplex();
        }
    );

    return input;
}


// =====================================================
// LEER Y VALIDAR DATOS
// =====================================================

function obtenerDatosSimplex() {

    const numVariables =
        parseInt(
            document.getElementById(
                "numVariables"
            ).value
        );


    const numRestricciones =
        parseInt(
            document.getElementById(
                "numRestricciones"
            ).value
        );


    const tipo =
        document.getElementById(
            "tipoOptimizacion"
        ).value;


    const objetivo = [];


    for (let j = 0; j < numVariables; j++) {

        const input =
            document.getElementById(
                "fo_" + j
            );

        const valor =
            convertirNumero(input);

        if (valor === null) {

            throw new Error(
                "Todos los coeficientes de la función objetivo deben ser numéricos."
            );
        }

        objetivo.push(valor);
    }


    const restricciones = [];
    const rhs = [];


    for (let i = 0; i < numRestricciones; i++) {

        const fila = [];


        for (let j = 0; j < numVariables; j++) {

            const input =
                document.getElementById(
                    "r_" + i + "_" + j
                );

            const valor =
                convertirNumero(input);


            if (valor === null) {

                throw new Error(
                    "Todos los coeficientes de las restricciones deben ser numéricos."
                );
            }

            fila.push(valor);
        }


        const inputRhs =
            document.getElementById(
                "rhs_" + i
            );

        const valorRhs =
            convertirNumero(inputRhs);


        if (valorRhs === null) {

            throw new Error(
                "Todos los valores del lado derecho deben ser numéricos."
            );
        }


        if (valorRhs < 0) {

            inputRhs.classList.add(
                "campo-invalido"
            );

            throw new Error(
                "En esta sección de Simplex el lado derecho de cada restricción debe ser mayor o igual a 0. Para otros tipos de restricciones utiliza M Grande."
            );
        }


        restricciones.push(fila);
        rhs.push(valorRhs);
    }


    return {
        numVariables,
        numRestricciones,
        tipo,
        objetivo,
        restricciones,
        rhs
    };
}


// =====================================================
// CONVERTIR NÚMERO
// =====================================================

function convertirNumero(input) {

    const texto =
        input.value.trim();


    if (texto === "") {

        input.classList.add(
            "campo-invalido"
        );

        return null;
    }


    const valor =
        Number(texto);


    if (!Number.isFinite(valor)) {

        input.classList.add(
            "campo-invalido"
        );

        return null;
    }


    input.classList.remove(
        "campo-invalido"
    );

    return valor;
}


// =====================================================
// RESOLVER SIMPLEX
// =====================================================

function resolverSimplex() {

    ocultarErrorSimplex();


    let datos;


    try {

        datos =
            obtenerDatosSimplex();

    } catch (error) {

        mostrarErrorSimplex(
            error.message
        );

        return;
    }


    const resultado =
        ejecutarSimplex(datos);


    mostrarProcedimiento(
        datos,
        resultado
    );
}


// =====================================================
// ALGORITMO SIMPLEX
// =====================================================

function ejecutarSimplex(datos) {

    const n =
        datos.numVariables;

    const m =
        datos.numRestricciones;


    /*
        Columnas:

        X1 X2 ... Xn
        S1 S2 ... Sm
        RHS
    */

    const columnas =
        n + m + 1;


    const tabla =
        Array.from(
            { length: m + 1 },
            () =>
                Array(columnas).fill(0)
        );


    // Restricciones

    for (let i = 0; i < m; i++) {

        for (let j = 0; j < n; j++) {

            tabla[i][j] =
                datos.restricciones[i][j];
        }


        tabla[i][n + i] = 1;

        tabla[i][columnas - 1] =
            datos.rhs[i];
    }


    /*
        Para maximización:

        Z - C1X1 - C2X2 ... = 0

        Para minimización convertimos:
        Min Z = Cx
        a
        Max (-Z) = -Cx

        Esto permite utilizar el mismo
        algoritmo estándar.
    */

    const objetivoAlgoritmo =
        datos.objetivo.map(
            valor =>
                datos.tipo === "max"
                    ? valor
                    : -valor
        );


    for (let j = 0; j < n; j++) {

        tabla[m][j] =
            -objetivoAlgoritmo[j];
    }


    const nombresColumnas = [];


    for (let j = 0; j < n; j++) {

        nombresColumnas.push(
            "X" + (j + 1)
        );
    }


    for (let j = 0; j < m; j++) {

        nombresColumnas.push(
            "S" + (j + 1)
        );
    }


    nombresColumnas.push("RHS");


    const base = [];


    for (let i = 0; i < m; i++) {

        base.push(
            "S" + (i + 1)
        );
    }


    const iteraciones = [];


    iteraciones.push({
        numero: 0,
        tabla: copiarTabla(tabla),
        base: [...base],
        entrante: null,
        saliente: null,
        pivote: null
    });


    let contador = 0;
    let estado = "optimo";


    while (contador < MAX_ITERACIONES) {

        const filaZ =
            tabla[m];


        let columnaPivote = -1;
        let menor = -EPSILON;


        // Buscar valor más negativo en Z

        for (
            let j = 0;
            j < columnas - 1;
            j++
        ) {

            if (filaZ[j] < menor) {

                menor =
                    filaZ[j];

                columnaPivote = j;
            }
        }


        // No hay negativos:
        // solución óptima

        if (columnaPivote === -1) {

            estado = "optimo";
            break;
        }


        let filaPivote = -1;
        let mejorRazon = Infinity;


        for (let i = 0; i < m; i++) {

            const coeficiente =
                tabla[i][columnaPivote];


            if (coeficiente > EPSILON) {

                const razon =
                    tabla[i][columnas - 1] /
                    coeficiente;


                if (
                    razon >= -EPSILON &&
                    razon < mejorRazon - EPSILON
                ) {

                    mejorRazon = razon;
                    filaPivote = i;
                }
            }
        }


        // No existe fila pivote:
        // problema no acotado

        if (filaPivote === -1) {

            estado = "no_acotado";

            iteraciones.push({
                numero: contador,
                tabla: copiarTabla(tabla),
                base: [...base],
                entrante:
                    nombresColumnas[
                        columnaPivote
                    ],
                saliente: "No existe",
                pivote: null,
                mensaje:
                    "No existe una razón positiva válida para seleccionar la variable saliente."
            });

            break;
        }


        const variableEntrante =
            nombresColumnas[
                columnaPivote
            ];


        const variableSaliente =
            base[filaPivote];


        const pivote =
            tabla[filaPivote][
                columnaPivote
            ];


        // Guardamos información
        // del pivote utilizado

        iteraciones[
            iteraciones.length - 1
        ].entrante =
            variableEntrante;

        iteraciones[
            iteraciones.length - 1
        ].saliente =
            variableSaliente;

        iteraciones[
            iteraciones.length - 1
        ].pivote =
            pivote;


        // Dividir fila pivote

        for (
            let j = 0;
            j < columnas;
            j++
        ) {

            tabla[filaPivote][j] =
                tabla[filaPivote][j] /
                pivote;
        }


        // Hacer ceros

        for (
            let i = 0;
            i < m + 1;
            i++
        ) {

            if (i === filaPivote) {
                continue;
            }


            const factor =
                tabla[i][columnaPivote];


            for (
                let j = 0;
                j < columnas;
                j++
            ) {

                tabla[i][j] =
                    tabla[i][j] -
                    factor *
                    tabla[filaPivote][j];


                if (
                    Math.abs(
                        tabla[i][j]
                    ) < EPSILON
                ) {

                    tabla[i][j] = 0;
                }
            }
        }


        base[filaPivote] =
            variableEntrante;


        contador++;


        iteraciones.push({
            numero: contador,
            tabla: copiarTabla(tabla),
            base: [...base],
            entrante: null,
            saliente: null,
            pivote: null
        });
    }


    if (
        contador >= MAX_ITERACIONES
    ) {

        estado =
            "limite_iteraciones";
    }


    const solucion =
        obtenerSolucion(
            tabla,
            base,
            datos
        );


    return {
        estado,
        iteraciones,
        nombresColumnas,
        solucion
    };
}


// =====================================================
// OBTENER SOLUCIÓN
// =====================================================

function obtenerSolucion(
    tabla,
    base,
    datos
) {

    const n =
        datos.numVariables;

    const m =
        datos.numRestricciones;

    const ultimaColumna =
        n + m;


    const variables =
        Array(n).fill(0);


    for (let i = 0; i < m; i++) {

        const nombre =
            base[i];


        if (
            nombre.startsWith("X")
        ) {

            const indice =
                parseInt(
                    nombre.substring(1)
                ) - 1;


            if (
                indice >= 0 &&
                indice < n
            ) {

                variables[indice] =
                    tabla[i][ultimaColumna];
            }
        }
    }


    let valorObjetivo =
        tabla[m][ultimaColumna];


    if (
        datos.tipo === "min"
    ) {

        valorObjetivo =
            -valorObjetivo;
    }


    return {
        variables,
        valorObjetivo
    };
}


// =====================================================
// COPIAR TABLA
// =====================================================

function copiarTabla(tabla) {

    return tabla.map(
        fila => [...fila]
    );
}


// =====================================================
// MOSTRAR PROCEDIMIENTO
// =====================================================

function mostrarProcedimiento(
    datos,
    resultado
) {

    const contenedor =
        document.getElementById(
            "procedimientoSimplex"
        );


    contenedor.innerHTML = "";


    const resumen =
        document.createElement("div");

    resumen.className =
        "resumen-problema";


    resumen.innerHTML = `
        <h4>Modelo ingresado</h4>

        <p>
            <strong>Objetivo:</strong>
            ${
                datos.tipo === "max"
                    ? "Maximizar"
                    : "Minimizar"
            }
        </p>

        <p>
            <strong>Variables:</strong>
            ${datos.numVariables}
        </p>

        <p>
            <strong>Restricciones:</strong>
            ${datos.numRestricciones}
        </p>
    `;


    contenedor.appendChild(
        resumen
    );


    resultado.iteraciones.forEach(
        (iteracion, indice) => {

            const bloque =
                document.createElement(
                    "div"
                );

            bloque.className =
                "iteracion-simplex";


            const titulo =
                document.createElement(
                    "h4"
                );

            titulo.textContent =
                indice === 0
                    ? "Tabla inicial"
                    : "Iteración " + indice;


            bloque.appendChild(
                titulo
            );


            const descripcion =
                document.createElement(
                    "p"
                );

            descripcion.className =
                "texto-iteracion";


            if (
                iteracion.entrante !== null
            ) {

                descripcion.innerHTML = `
                    Variable entrante:
                    <strong>
                        ${iteracion.entrante}
                    </strong>

                    &nbsp; | &nbsp;

                    Variable saliente:
                    <strong>
                        ${iteracion.saliente}
                    </strong>

                    ${
                        iteracion.pivote !== null
                            ? `
                            &nbsp; | &nbsp;

                            Elemento pivote:
                            <strong>
                                ${formatearNumero(
                                    iteracion.pivote
                                )}
                            </strong>
                            `
                            : ""
                    }
                `;


                bloque.appendChild(
                    descripcion
                );
            }


            const tablaHTML =
                construirTablaHTML(
                    iteracion,
                    resultado.nombresColumnas
                );


            bloque.appendChild(
                tablaHTML
            );


            if (
                iteracion.mensaje
            ) {

                const mensaje =
                    document.createElement(
                        "div"
                    );

                mensaje.className =
                    "mensaje-advertencia";

                mensaje.textContent =
                    iteracion.mensaje;

                bloque.appendChild(
                    mensaje
                );
            }


            contenedor.appendChild(
                bloque
            );
        }
    );


    mostrarResultadoFinal(
        contenedor,
        datos,
        resultado
    );


    document
        .getElementById(
            "panelResultados"
        )
        .classList.remove(
            "oculto"
        );


    document
        .getElementById(
            "panelResultados"
        )
        .scrollIntoView({
            behavior: "smooth"
        });
}


// =====================================================
// CONSTRUIR TABLA HTML
// =====================================================

function construirTablaHTML(
    iteracion,
    nombresColumnas
) {

    const contenedor =
        document.createElement(
            "div"
        );

    contenedor.className =
        "tabla-responsive";


    const tabla =
        document.createElement(
            "table"
        );

    tabla.className =
        "tabla-simplex";


    const thead =
        document.createElement(
            "thead"
        );


    const filaCabecera =
        document.createElement(
            "tr"
        );


    const thBase =
        document.createElement(
            "th"
        );

    thBase.textContent = "Base";

    filaCabecera.appendChild(
        thBase
    );


    nombresColumnas.forEach(
        nombre => {

            const th =
                document.createElement(
                    "th"
                );

            th.textContent =
                nombre;

            filaCabecera.appendChild(
                th
            );
        }
    );


    thead.appendChild(
        filaCabecera
    );

    tabla.appendChild(
        thead
    );


    const tbody =
        document.createElement(
            "tbody"
        );


    iteracion.tabla.forEach(
        (fila, indice) => {

            const tr =
                document.createElement(
                    "tr"
                );


            const tdBase =
                document.createElement(
                    "td"
                );


            if (
                indice <
                iteracion.base.length
            ) {

                tdBase.textContent =
                    iteracion.base[indice];

            } else {

                tdBase.textContent = "Z";

                tr.classList.add(
                    "fila-z"
                );
            }


            tr.appendChild(
                tdBase
            );


            fila.forEach(
                valor => {

                    const td =
                        document.createElement(
                            "td"
                        );

                    td.textContent =
                        formatearNumero(
                            valor
                        );

                    tr.appendChild(
                        td
                    );
                }
            );


            tbody.appendChild(
                tr
            );
        }
    );


    tabla.appendChild(
        tbody
    );


    contenedor.appendChild(
        tabla
    );


    return contenedor;
}


// =====================================================
// RESULTADO FINAL
// =====================================================

function mostrarResultadoFinal(
    contenedor,
    datos,
    resultado
) {

    const resultadoDiv =
        document.createElement(
            "div"
        );


    if (
        resultado.estado ===
        "no_acotado"
    ) {

        resultadoDiv.className =
            "resultado-error";


        resultadoDiv.innerHTML = `
            <h3>Problema no acotado</h3>

            <p>
                El algoritmo encontró una variable
                entrante para la cual no existe una
                variable saliente válida.
            </p>
        `;


        contenedor.appendChild(
            resultadoDiv
        );

        return;
    }


    if (
        resultado.estado ===
        "limite_iteraciones"
    ) {

        resultadoDiv.className =
            "resultado-error";


        resultadoDiv.innerHTML = `
            <h3>No se pudo finalizar</h3>

            <p>
                Se alcanzó el límite de iteraciones
                establecido para proteger el simulador.
            </p>
        `;


        contenedor.appendChild(
            resultadoDiv
        );

        return;
    }


    resultadoDiv.className =
        "resultado-final";


    let variablesHTML = "";


    resultado.solucion.variables.forEach(
        (valor, indice) => {

            variablesHTML += `
                <div class="resultado-variable">

                    <span>
                        X${indice + 1}
                    </span>

                    <strong>
                        ${formatearNumero(valor)}
                    </strong>

                </div>
            `;
        }
    );


    resultadoDiv.innerHTML = `

        <div class="resultado-titulo">

            <span>✓</span>

            <div>
                <h3>Solución óptima encontrada</h3>

                <p>
                    El método Simplex terminó
                    correctamente.
                </p>
            </div>

        </div>


        <div class="variables-resultado">

            ${variablesHTML}

            <div class="resultado-variable destacado">

                <span>
                    ${
                        datos.tipo === "max"
                            ? "Z máximo"
                            : "Z mínimo"
                    }
                </span>

                <strong>
                    ${formatearNumero(
                        resultado.solucion
                            .valorObjetivo
                    )}
                </strong>

            </div>

        </div>


        <div class="interpretacion">

            <h4>
                Interpretación
            </h4>

            <p>
                De acuerdo con los datos ingresados,
                la combinación óptima se obtiene con
                los valores mostrados para las variables
                de decisión y un valor de la función
                objetivo de

                <strong>
                    ${formatearNumero(
                        resultado.solucion
                            .valorObjetivo
                    )}
                </strong>.
            </p>

        </div>
    `;


    contenedor.appendChild(
        resultadoDiv
    );
}


// =====================================================
// FORMATEAR NÚMEROS
// =====================================================

function formatearNumero(numero) {

    if (
        Math.abs(numero) <
        EPSILON
    ) {

        return "0";
    }


    if (
        Math.abs(
            numero -
            Math.round(numero)
        ) < EPSILON
    ) {

        return String(
            Math.round(numero)
        );
    }


    return Number(
        numero.toFixed(4)
    ).toString();
}


// =====================================================
// CARGAR EJEMPLO AGUA SALVAVIDAS
// =====================================================

function cargarEjemploSimplex() {

    document.getElementById(
        "tipoOptimizacion"
    ).value = "max";


    document.getElementById(
        "numVariables"
    ).value = 2;


    document.getElementById(
        "numRestricciones"
    ).value = 3;


    generarModeloSimplex();


    /*
        Ejemplo:

        Max Z = 40X1 + 30X2

        2X1 + X2 <= 100
        X1 + X2 <= 80
        X1 <= 40
    */


    document.getElementById(
        "fo_0"
    ).value = 40;


    document.getElementById(
        "fo_1"
    ).value = 30;


    document.getElementById(
        "r_0_0"
    ).value = 2;

    document.getElementById(
        "r_0_1"
    ).value = 1;

    document.getElementById(
        "rhs_0"
    ).value = 100;


    document.getElementById(
        "r_1_0"
    ).value = 1;

    document.getElementById(
        "r_1_1"
    ).value = 1;

    document.getElementById(
        "rhs_1"
    ).value = 80;


    document.getElementById(
        "r_2_0"
    ).value = 1;

    document.getElementById(
        "r_2_1"
    ).value = 0;

    document.getElementById(
        "rhs_2"
    ).value = 40;
}


// =====================================================
// LIMPIAR
// =====================================================

function limpiarSimplex() {

    const inputs =
        document.querySelectorAll(
            "#panelModelo input"
        );


    inputs.forEach(
        input => {

            input.value = "";

            input.classList.remove(
                "campo-invalido"
            );
        }
    );


    document
        .getElementById(
            "panelResultados"
        )
        .classList.add(
            "oculto"
        );


    document.getElementById(
        "procedimientoSimplex"
    ).innerHTML = "";


    ocultarErrorSimplex();
}


// =====================================================
// MENSAJES DE ERROR
// =====================================================

function mostrarErrorSimplex(
    mensaje
) {

    const error =
        document.getElementById(
            "mensajeErrorSimplex"
        );


    error.textContent =
        "⚠ " + mensaje;


    error.classList.remove(
        "oculto"
    );
}


function ocultarErrorSimplex() {

    const error =
        document.getElementById(
            "mensajeErrorSimplex"
        );


    if (!error) {
        return;
    }


    error.classList.add(
        "oculto"
    );

    error.textContent = "";
}
