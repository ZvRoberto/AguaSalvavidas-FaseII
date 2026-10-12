const M_GRANDE = 1000000;
const EPSILON_M = 1e-8;
const MAX_ITERACIONES_M = 100;


// =====================================================
// GENERAR MODELO
// =====================================================

function generarModeloMGrande() {

    const n = parseInt(
        document.getElementById("numVariablesM").value
    );

    const m = parseInt(
        document.getElementById("numRestriccionesM").value
    );

    if (!Number.isInteger(n) || n < 1 || n > 10) {
        alert("El número de variables debe estar entre 1 y 10.");
        return;
    }

    if (!Number.isInteger(m) || m < 1 || m > 10) {
        alert("El número de restricciones debe estar entre 1 y 10.");
        return;
    }

    generarFuncionObjetivoM(n);
    generarRestriccionesM(n, m);

    document
        .getElementById("panelModeloM")
        .classList.remove("oculto");

    document
        .getElementById("panelResultadosM")
        .classList.add("oculto");

    ocultarErrorM();
}


// =====================================================
// FUNCIÓN OBJETIVO
// =====================================================

function generarFuncionObjetivoM(n) {

    const contenedor =
        document.getElementById("funcionObjetivoM");

    contenedor.innerHTML = "";

    const z = document.createElement("strong");
    z.textContent = "Z = ";

    contenedor.appendChild(z);

    for (let j = 0; j < n; j++) {

        const input =
            crearInputM("m_fo_" + j);

        contenedor.appendChild(input);

        const variable =
            document.createElement("span");

        variable.textContent = " X" + (j + 1);

        contenedor.appendChild(variable);

        if (j < n - 1) {

            const mas =
                document.createElement("span");

            mas.textContent = " + ";

            contenedor.appendChild(mas);
        }
    }
}


// =====================================================
// RESTRICCIONES
// =====================================================

function generarRestriccionesM(n, m) {

    const contenedor =
        document.getElementById("restriccionesM");

    contenedor.innerHTML = "";

    for (let i = 0; i < m; i++) {

        const fila =
            document.createElement("div");

        fila.className = "fila-restriccion";

        for (let j = 0; j < n; j++) {

            const input =
                crearInputM(
                    "m_r_" + i + "_" + j
                );

            fila.appendChild(input);

            const variable =
                document.createElement("span");

            variable.textContent =
                " X" + (j + 1);

            fila.appendChild(variable);

            if (j < n - 1) {

                const mas =
                    document.createElement("span");

                mas.textContent = " + ";

                fila.appendChild(mas);
            }
        }


        const select =
            document.createElement("select");

        select.id = "m_signo_" + i;
        select.className = "select-signo";

        select.innerHTML = `
            <option value="<=">≤</option>
            <option value=">=">≥</option>
            <option value="=">=</option>
        `;

        fila.appendChild(select);


        const rhs =
            crearInputM(
                "m_rhs_" + i
            );

        rhs.classList.add("rhs");

        fila.appendChild(rhs);

        contenedor.appendChild(fila);
    }
}


// =====================================================
// INPUT
// =====================================================

function crearInputM(id) {

    const input =
        document.createElement("input");

    input.type = "number";
    input.step = "any";
    input.id = id;
    input.placeholder = "0";
    input.className = "input-coeficiente";

    input.addEventListener(
        "input",
        function () {

            this.classList.remove(
                "campo-invalido"
            );

            ocultarErrorM();
        }
    );

    return input;
}


// =====================================================
// LEER DATOS
// =====================================================

function obtenerDatosMGrande() {

    const n =
        parseInt(
            document.getElementById(
                "numVariablesM"
            ).value
        );

    const m =
        parseInt(
            document.getElementById(
                "numRestriccionesM"
            ).value
        );

    const tipo =
        document.getElementById(
            "tipoOptimizacionM"
        ).value;


    const objetivo = [];

    for (let j = 0; j < n; j++) {

        objetivo.push(
            leerNumeroM(
                document.getElementById(
                    "m_fo_" + j
                )
            )
        );
    }


    const restricciones = [];

    for (let i = 0; i < m; i++) {

        const coeficientes = [];

        for (let j = 0; j < n; j++) {

            coeficientes.push(
                leerNumeroM(
                    document.getElementById(
                        "m_r_" + i + "_" + j
                    )
                )
            );
        }

        let signo =
            document.getElementById(
                "m_signo_" + i
            ).value;

        let rhsInput =
            document.getElementById(
                "m_rhs_" + i
            );

        let rhs =
            leerNumeroM(rhsInput);


        /*
         * Si RHS es negativo, multiplicamos
         * toda la restricción por -1.
         */

        if (rhs < 0) {

            for (
                let j = 0;
                j < coeficientes.length;
                j++
            ) {
                coeficientes[j] *= -1;
            }

            rhs *= -1;

            if (signo === "<=") {
                signo = ">=";
            } else if (signo === ">=") {
                signo = "<=";
            }
        }


        restricciones.push({
            coeficientes,
            signo,
            rhs
        });
    }


    return {
        n,
        m,
        tipo,
        objetivo,
        restricciones
    };
}


// =====================================================
// VALIDAR NÚMERO
// =====================================================

function leerNumeroM(input) {

    const texto =
        input.value.trim();

    if (texto === "") {

        input.classList.add(
            "campo-invalido"
        );

        throw new Error(
            "Todos los campos deben contener valores numéricos."
        );
    }

    const valor =
        Number(texto);

    if (!Number.isFinite(valor)) {

        input.classList.add(
            "campo-invalido"
        );

        throw new Error(
            "Se encontró un valor que no es numérico."
        );
    }

    input.classList.remove(
        "campo-invalido"
    );

    return valor;
}


// =====================================================
// RESOLVER
// =====================================================

function resolverMGrande() {

    ocultarErrorM();

    let datos;

    try {

        datos =
            obtenerDatosMGrande();

    } catch (error) {

        mostrarErrorM(
            error.message
        );

        return;
    }


    const resultado =
        ejecutarMGrande(datos);


    mostrarMGrande(
        datos,
        resultado
    );
}


// =====================================================
// PREPARAR M GRANDE
// =====================================================

function ejecutarMGrande(datos) {

    const nombres = [];

    // Variables originales

    for (let j = 0; j < datos.n; j++) {
        nombres.push("X" + (j + 1));
    }


    /*
     * Primero contamos cuántas variables
     * adicionales necesitaremos.
     */

    let cantidadHolgura = 0;
    let cantidadExceso = 0;
    let cantidadArtificial = 0;


    datos.restricciones.forEach(r => {

        if (r.signo === "<=") {
            cantidadHolgura++;
        }

        if (r.signo === ">=") {
            cantidadExceso++;
            cantidadArtificial++;
        }

        if (r.signo === "=") {
            cantidadArtificial++;
        }
    });


    for (
        let i = 0;
        i < cantidadHolgura;
        i++
    ) {
        nombres.push("S" + (i + 1));
    }


    for (
        let i = 0;
        i < cantidadExceso;
        i++
    ) {
        nombres.push("E" + (i + 1));
    }


    for (
        let i = 0;
        i < cantidadArtificial;
        i++
    ) {
        nombres.push("A" + (i + 1));
    }


    const totalVariables =
        nombres.length;

    const RHS =
        totalVariables;


    const tabla =
        Array.from(
            { length: datos.m + 1 },
            () =>
                Array(
                    totalVariables + 1
                ).fill(0)
        );


    const base = [];

    const artificiales =
        new Set();


    let contadorS = 0;
    let contadorE = 0;
    let contadorA = 0;


    // Índices de inicio

    const inicioS =
        datos.n;

    const inicioE =
        inicioS +
        cantidadHolgura;

    const inicioA =
        inicioE +
        cantidadExceso;


    // =================================================
    // CREAR RESTRICCIONES
    // =================================================

    for (
        let i = 0;
        i < datos.m;
        i++
    ) {

        const r =
            datos.restricciones[i];


        for (
            let j = 0;
            j < datos.n;
            j++
        ) {

            tabla[i][j] =
                r.coeficientes[j];
        }


        if (r.signo === "<=") {

            const columna =
                inicioS +
                contadorS;

            tabla[i][columna] = 1;

            base.push(
                nombres[columna]
            );

            contadorS++;
        }


        else if (r.signo === ">=") {

            const columnaE =
                inicioE +
                contadorE;

            tabla[i][columnaE] = -1;

            contadorE++;


            const columnaA =
                inicioA +
                contadorA;

            tabla[i][columnaA] = 1;

            artificiales.add(
                columnaA
            );

            base.push(
                nombres[columnaA]
            );

            contadorA++;
        }


        else {

            const columnaA =
                inicioA +
                contadorA;

            tabla[i][columnaA] = 1;

            artificiales.add(
                columnaA
            );

            base.push(
                nombres[columnaA]
            );

            contadorA++;
        }


        tabla[i][RHS] =
            r.rhs;
    }


    // =================================================
    // COEFICIENTES FUNCIÓN OBJETIVO
    // =================================================

    const costos =
        Array(
            totalVariables
        ).fill(0);


    for (
        let j = 0;
        j < datos.n;
        j++
    ) {

        costos[j] =
            datos.tipo === "max"
                ? datos.objetivo[j]
                : -datos.objetivo[j];
    }


    artificiales.forEach(
        columna => {

            costos[columna] =
                -M_GRANDE;
        }
    );


    /*
     * Fila Z inicialmente = -Cj
     */

    for (
        let j = 0;
        j < totalVariables;
        j++
    ) {

        tabla[datos.m][j] =
            -costos[j];
    }


    /*
     * Como las artificiales están
     * inicialmente en la base,
     * debemos hacer canónica la fila Z.
     */

    for (
        let i = 0;
        i < datos.m;
        i++
    ) {

        if (
            base[i].startsWith("A")
        ) {

            for (
                let j = 0;
                j <= RHS;
                j++
            ) {

                tabla[datos.m][j] -=
                    M_GRANDE *
                    tabla[i][j];
            }
        }
    }


    const iteraciones = [];


    iteraciones.push({
        numero: 0,
        tabla: copiarTablaM(tabla),
        base: [...base],
        entrante: null,
        saliente: null,
        pivote: null
    });


    let contador = 0;
    let estado = "optimo";


    // =================================================
    // ITERACIONES
    // =================================================

    while (
        contador <
        MAX_ITERACIONES_M
    ) {

        let columnaPivote = -1;

        let menor =
            -EPSILON_M;


        for (
            let j = 0;
            j < totalVariables;
            j++
        ) {

            if (
                tabla[datos.m][j] <
                menor
            ) {

                menor =
                    tabla[datos.m][j];

                columnaPivote = j;
            }
        }


        if (
            columnaPivote === -1
        ) {

            estado = "optimo";
            break;
        }


        let filaPivote = -1;

        let mejorRazon =
            Infinity;


        for (
            let i = 0;
            i < datos.m;
            i++
        ) {

            const coef =
                tabla[i][
                    columnaPivote
                ];


            if (
                coef >
                EPSILON_M
            ) {

                const razon =
                    tabla[i][RHS] /
                    coef;


                if (
                    razon >=
                        -EPSILON_M &&
                    razon <
                        mejorRazon -
                        EPSILON_M
                ) {

                    mejorRazon =
                        razon;

                    filaPivote = i;
                }
            }
        }


        if (
            filaPivote === -1
        ) {

            estado =
                "no_acotado";

            break;
        }


        const entrante =
            nombres[
                columnaPivote
            ];

        const saliente =
            base[
                filaPivote
            ];

        const pivote =
            tabla[filaPivote][
                columnaPivote
            ];


        iteraciones[
            iteraciones.length - 1
        ].entrante =
            entrante;

        iteraciones[
            iteraciones.length - 1
        ].saliente =
            saliente;

        iteraciones[
            iteraciones.length - 1
        ].pivote =
            pivote;


        // Normalizar fila pivote

        for (
            let j = 0;
            j <= RHS;
            j++
        ) {

            tabla[filaPivote][j] /=
                pivote;
        }


        // Hacer ceros

        for (
            let i = 0;
            i <= datos.m;
            i++
        ) {

            if (
                i === filaPivote
            ) {
                continue;
            }


            const factor =
                tabla[i][
                    columnaPivote
                ];


            for (
                let j = 0;
                j <= RHS;
                j++
            ) {

                tabla[i][j] -=
                    factor *
                    tabla[filaPivote][j];


                if (
                    Math.abs(
                        tabla[i][j]
                    ) <
                    EPSILON_M
                ) {

                    tabla[i][j] = 0;
                }
            }
        }


        base[filaPivote] =
            entrante;


        contador++;


        iteraciones.push({
            numero: contador,
            tabla:
                copiarTablaM(
                    tabla
                ),
            base: [...base],
            entrante: null,
            saliente: null,
            pivote: null
        });
    }


    if (
        contador >=
        MAX_ITERACIONES_M
    ) {

        estado =
            "limite";
    }


    /*
     * Comprobar si quedó una
     * artificial positiva en la base.
     */

    if (
        estado === "optimo"
    ) {

        for (
            let i = 0;
            i < datos.m;
            i++
        ) {

            if (
                base[i].startsWith("A") &&
                tabla[i][RHS] >
                    EPSILON_M
            ) {

                estado =
                    "no_factible";

                break;
            }
        }
    }


    // =================================================
    // SOLUCIÓN
    // =================================================

    const variables =
        Array(datos.n).fill(0);


    for (
        let i = 0;
        i < datos.m;
        i++
    ) {

        if (
            base[i].startsWith("X")
        ) {

            const indice =
                parseInt(
                    base[i].substring(1)
                ) - 1;


            if (
                indice >= 0 &&
                indice < datos.n
            ) {

                variables[indice] =
                    tabla[i][RHS];
            }
        }
    }


    /*
     * Calculamos Z con la función
     * ORIGINAL para no contaminar
     * el resultado con la penalización M.
     */

    let valorZ = 0;


    for (
        let j = 0;
        j < datos.n;
        j++
    ) {

        valorZ +=
            datos.objetivo[j] *
            variables[j];
    }


    return {
        estado,
        nombres:
            [...nombres, "RHS"],
        iteraciones,
        variables,
        valorZ,
        artificiales:
            [...artificiales].map(
                i => nombres[i]
            )
    };
}


// =====================================================
// MOSTRAR RESULTADOS
// =====================================================

function mostrarMGrande(
    datos,
    resultado
) {

    const contenedor =
        document.getElementById(
            "procedimientoMGrande"
        );

    contenedor.innerHTML = "";


    // FORMA ESTÁNDAR

    const forma =
        document.createElement("div");

    forma.className =
        "resumen-problema";


    let artificiales =
        resultado.artificiales.length > 0
            ? resultado.artificiales.join(", ")
            : "No se necesitaron";


    forma.innerHTML = `

        <h4>Preparación del modelo</h4>

        <p>
            <strong>Objetivo:</strong>
            ${
                datos.tipo === "max"
                    ? "Maximizar"
                    : "Minimizar"
            }
        </p>

        <p>
            <strong>
                Variables de decisión:
            </strong>
            ${datos.n}
        </p>

        <p>
            <strong>
                Variables artificiales:
            </strong>
            ${artificiales}
        </p>

        <p>
            <strong>
                Penalización utilizada:
            </strong>
            M
        </p>

    `;


    contenedor.appendChild(
        forma
    );


    // ITERACIONES

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
                    ? "Tabla inicial M Grande"
                    : "Iteración " + indice;


            bloque.appendChild(
                titulo
            );


            if (
                iteracion.entrante
            ) {

                const info =
                    document.createElement(
                        "p"
                    );

                info.className =
                    "texto-iteracion";


                info.innerHTML = `

                    Variable entrante:
                    <strong>
                        ${iteracion.entrante}
                    </strong>

                    &nbsp; | &nbsp;

                    Variable saliente:
                    <strong>
                        ${iteracion.saliente}
                    </strong>

                    &nbsp; | &nbsp;

                    Pivote:
                    <strong>
                        ${formatearM(
                            iteracion.pivote
                        )}
                    </strong>

                `;


                bloque.appendChild(
                    info
                );
            }


            bloque.appendChild(
                construirTablaM(
                    iteracion,
                    resultado.nombres
                )
            );


            contenedor.appendChild(
                bloque
            );
        }
    );


    mostrarResultadoM(
        contenedor,
        datos,
        resultado
    );


    document
        .getElementById(
            "panelResultadosM"
        )
        .classList.remove(
            "oculto"
        );


    document
        .getElementById(
            "panelResultadosM"
        )
        .scrollIntoView({
            behavior: "smooth"
        });
}


// =====================================================
// TABLA HTML
// =====================================================

function construirTablaM(
    iteracion,
    nombres
) {

    const responsive =
        document.createElement(
            "div"
        );

    responsive.className =
        "tabla-responsive";


    const table =
        document.createElement(
            "table"
        );

    table.className =
        "tabla-simplex";


    const thead =
        document.createElement(
            "thead"
        );

    const trHead =
        document.createElement(
            "tr"
        );


    const thBase =
        document.createElement(
            "th"
        );

    thBase.textContent =
        "Base";

    trHead.appendChild(
        thBase
    );


    nombres.forEach(
        nombre => {

            const th =
                document.createElement(
                    "th"
                );

            th.textContent =
                nombre;

            trHead.appendChild(
                th
            );
        }
    );


    thead.appendChild(
        trHead
    );

    table.appendChild(
        thead
    );


    const tbody =
        document.createElement(
            "tbody"
        );


    iteracion.tabla.forEach(
        (fila, i) => {

            const tr =
                document.createElement(
                    "tr"
                );


            const tdBase =
                document.createElement(
                    "td"
                );


            if (
                i <
                iteracion.base.length
            ) {

                tdBase.textContent =
                    iteracion.base[i];

            } else {

                tdBase.textContent =
                    "Z";

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
                        formatearM(valor);

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


    table.appendChild(
        tbody
    );

    responsive.appendChild(
        table
    );


    return responsive;
}


// =====================================================
// RESULTADO FINAL
// =====================================================

function mostrarResultadoM(
    contenedor,
    datos,
    resultado
) {

    if (
        resultado.estado ===
        "no_factible"
    ) {

        const error =
            document.createElement(
                "div"
            );

        error.className =
            "resultado-error";


        error.innerHTML = `

            <h3>
                El problema no tiene solución factible
            </h3>

            <p>
                Una o más variables artificiales
                permanecieron en la base con un valor
                positivo. Esto indica que las
                restricciones originales son
                incompatibles.
            </p>

        `;


        contenedor.appendChild(
            error
        );

        return;
    }


    if (
        resultado.estado ===
        "no_acotado"
    ) {

        const error =
            document.createElement(
                "div"
            );

        error.className =
            "resultado-error";


        error.innerHTML = `

            <h3>
                Problema no acotado
            </h3>

            <p>
                No fue posible encontrar una variable
                saliente válida para continuar con el
                procedimiento.
            </p>

        `;


        contenedor.appendChild(
            error
        );

        return;
    }


    if (
        resultado.estado ===
        "limite"
    ) {

        const error =
            document.createElement(
                "div"
            );

        error.className =
            "resultado-error";


        error.innerHTML = `

            <h3>
                Límite de iteraciones alcanzado
            </h3>

            <p>
                El simulador detuvo el procedimiento
                después del número máximo de
                iteraciones permitido.
            </p>

        `;


        contenedor.appendChild(
            error
        );

        return;
    }


    let variablesHTML = "";


    resultado.variables.forEach(
        (valor, i) => {

            variablesHTML += `

                <div class="resultado-variable">

                    <span>
                        X${i + 1}
                    </span>

                    <strong>
                        ${formatearM(valor)}
                    </strong>

                </div>

            `;
        }
    );


    const final =
        document.createElement(
            "div"
        );

    final.className =
        "resultado-final";


    final.innerHTML = `

        <div class="resultado-titulo">

            <span>✓</span>

            <div>

                <h3>
                    Solución óptima encontrada
                </h3>

                <p>
                    El procedimiento M Grande
                    terminó correctamente.
                </p>

            </div>

        </div>


        <div class="variables-resultado">

            ${variablesHTML}

            <div
                class="resultado-variable destacado">

                <span>
                    ${
                        datos.tipo === "max"
                            ? "Z máximo"
                            : "Z mínimo"
                    }
                </span>

                <strong>
                    ${formatearM(
                        resultado.valorZ
                    )}
                </strong>

            </div>

        </div>


        <div class="interpretacion">

            <h4>
                Interpretación
            </h4>

            <p>
                La combinación óptima de las
                variables de decisión produce un
                valor de la función objetivo de

                <strong>
                    ${formatearM(
                        resultado.valorZ
                    )}
                </strong>.

                Las variables artificiales fueron
                utilizadas únicamente para obtener
                una base inicial factible mediante
                el método de la M Grande.
            </p>

        </div>

    `;


    contenedor.appendChild(
        final
    );
}


// =====================================================
// EJEMPLO AGUA SALVAVIDAS
// =====================================================

function cargarEjemploMGrande() {

    document.getElementById(
        "tipoOptimizacionM"
    ).value = "max";


    document.getElementById(
        "numVariablesM"
    ).value = 2;


    document.getElementById(
        "numRestriccionesM"
    ).value = 2;


    generarModeloMGrande();


    /*
        Ejemplo:

        Max Z = 3X1 + 2X2

        X1 + X2 >= 4
        X1 + 3X2 <= 9
    */


    document.getElementById(
        "m_fo_0"
    ).value = 3;

    document.getElementById(
        "m_fo_1"
    ).value = 2;


    document.getElementById(
        "m_r_0_0"
    ).value = 1;

    document.getElementById(
        "m_r_0_1"
    ).value = 1;

    document.getElementById(
        "m_signo_0"
    ).value = ">=";

    document.getElementById(
        "m_rhs_0"
    ).value = 4;


    document.getElementById(
        "m_r_1_0"
    ).value = 1;

    document.getElementById(
        "m_r_1_1"
    ).value = 3;

    document.getElementById(
        "m_signo_1"
    ).value = "<=";

    document.getElementById(
        "m_rhs_1"
    ).value = 9;
}


// =====================================================
// LIMPIAR
// =====================================================

function limpiarMGrande() {

    document
        .querySelectorAll(
            "#panelModeloM input"
        )
        .forEach(
            input => {

                input.value = "";

                input.classList.remove(
                    "campo-invalido"
                );
            }
        );


    document
        .getElementById(
            "panelResultadosM"
        )
        .classList.add(
            "oculto"
        );


    document.getElementById(
        "procedimientoMGrande"
    ).innerHTML = "";


    ocultarErrorM();
}


// =====================================================
// UTILIDADES
// =====================================================

function copiarTablaM(tabla) {

    return tabla.map(
        fila => [...fila]
    );
}


function formatearM(numero) {

    if (
        Math.abs(numero) <
        EPSILON_M
    ) {
        return "0";
    }


    /*
     * Para que los números de penalización
     * sean fáciles de reconocer.
     */

    if (
        Math.abs(numero) >=
        M_GRANDE * 0.9
    ) {

        const vecesM =
            numero /
            M_GRANDE;

        if (
            Math.abs(
                vecesM -
                Math.round(vecesM)
            ) < 0.0001
        ) {

            const entero =
                Math.round(vecesM);

            if (entero === 1) {
                return "M";
            }

            if (entero === -1) {
                return "-M";
            }

            return entero + "M";
        }
    }


    if (
        Math.abs(
            numero -
            Math.round(numero)
        ) <
        EPSILON_M
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
// ERRORES
// =====================================================

function mostrarErrorM(mensaje) {

    const elemento =
        document.getElementById(
            "mensajeErrorM"
        );

    elemento.textContent =
        "⚠ " + mensaje;

    elemento.classList.remove(
        "oculto"
    );
}


function ocultarErrorM() {

    const elemento =
        document.getElementById(
            "mensajeErrorM"
        );

    if (!elemento) {
        return;
    }

    elemento.classList.add(
        "oculto"
    );

    elemento.textContent = "";
}