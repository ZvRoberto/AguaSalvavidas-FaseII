
const EPSILON_N = 1e-9;


// =====================================================
// GENERAR MATRIZ
// =====================================================

function generarMatrizNoroeste() {

    const origenes =
        parseInt(
            document.getElementById(
                "numOrigenes"
            ).value
        );


    const destinos =
        parseInt(
            document.getElementById(
                "numDestinos"
            ).value
        );


    if (
        !Number.isInteger(origenes) ||
        origenes < 1 ||
        origenes > 10
    ) {

        alert(
            "El número de orígenes debe estar entre 1 y 10."
        );

        return;
    }


    if (
        !Number.isInteger(destinos) ||
        destinos < 1 ||
        destinos > 10
    ) {

        alert(
            "El número de destinos debe estar entre 1 y 10."
        );

        return;
    }


    construirMatrizEntrada(
        origenes,
        destinos
    );


    document
        .getElementById(
            "panelMatrizNoroeste"
        )
        .classList.remove(
            "oculto"
        );


    document
        .getElementById(
            "panelResultadosNoroeste"
        )
        .classList.add(
            "oculto"
        );


    document.getElementById(
        "resumenBalance"
    ).innerHTML = "";


    ocultarErrorNoroeste();
}


// =====================================================
// CONSTRUIR MATRIZ
// =====================================================

function construirMatrizEntrada(
    origenes,
    destinos
) {

    const contenedor =
        document.getElementById(
            "matrizEntradaNoroeste"
        );


    let html = `

        <table class="tabla-transporte">

            <thead>

                <tr>

                    <th>Origen / Destino</th>

    `;


    for (
        let j = 0;
        j < destinos;
        j++
    ) {

        html += `
            <th>
                Destino ${j + 1}
            </th>
        `;
    }


    html += `

                    <th class="columna-oferta">
                        Oferta
                    </th>

                </tr>

            </thead>

            <tbody>

    `;


    for (
        let i = 0;
        i < origenes;
        i++
    ) {

        html += `

            <tr>

                <th>
                    Origen ${i + 1}
                </th>

        `;


        for (
            let j = 0;
            j < destinos;
            j++
        ) {

            html += `

                <td>

                    <input
                        type="number"
                        step="any"
                        min="0"
                        id="n_costo_${i}_${j}"
                        class="input-matriz"
                        placeholder="Costo">

                </td>

            `;
        }


        html += `

                <td class="celda-oferta">

                    <input
                        type="number"
                        step="any"
                        min="0"
                        id="n_oferta_${i}"
                        class="input-matriz"
                        placeholder="Oferta">

                </td>

            </tr>

        `;
    }


    html += `

            <tr class="fila-demanda">

                <th>
                    Demanda
                </th>

    `;


    for (
        let j = 0;
        j < destinos;
        j++
    ) {

        html += `

            <td>

                <input
                    type="number"
                    step="any"
                    min="0"
                    id="n_demanda_${j}"
                    class="input-matriz"
                    placeholder="Demanda">

            </td>

        `;
    }


    html += `

                <td class="celda-bloqueada">
                    —
                </td>

            </tr>

            </tbody>

        </table>

    `;


    contenedor.innerHTML =
        html;


    document
        .querySelectorAll(
            ".input-matriz"
        )
        .forEach(
            input => {

                input.addEventListener(
                    "input",
                    function () {

                        this.classList.remove(
                            "campo-invalido"
                        );

                        ocultarErrorNoroeste();

                        actualizarBalanceVisual();
                    }
                );
            }
        );
}


// =====================================================
// LEER DATOS
// =====================================================

function obtenerDatosNoroeste() {

    const origenes =
        parseInt(
            document.getElementById(
                "numOrigenes"
            ).value
        );


    const destinos =
        parseInt(
            document.getElementById(
                "numDestinos"
            ).value
        );


    const costos = [];


    for (
        let i = 0;
        i < origenes;
        i++
    ) {

        const fila = [];


        for (
            let j = 0;
            j < destinos;
            j++
        ) {

            const valor =
                leerNumeroNoroeste(
                    document.getElementById(
                        `n_costo_${i}_${j}`
                    ),
                    "Los costos"
                );


            if (valor < 0) {

                throw new Error(
                    "Los costos de transporte no pueden ser negativos."
                );
            }


            fila.push(valor);
        }


        costos.push(fila);
    }


    const oferta = [];


    for (
        let i = 0;
        i < origenes;
        i++
    ) {

        const valor =
            leerNumeroNoroeste(
                document.getElementById(
                    `n_oferta_${i}`
                ),
                "La oferta"
            );


        if (valor < 0) {

            throw new Error(
                "La oferta no puede ser negativa."
            );
        }


        oferta.push(valor);
    }


    const demanda = [];


    for (
        let j = 0;
        j < destinos;
        j++
    ) {

        const valor =
            leerNumeroNoroeste(
                document.getElementById(
                    `n_demanda_${j}`
                ),
                "La demanda"
            );


        if (valor < 0) {

            throw new Error(
                "La demanda no puede ser negativa."
            );
        }


        demanda.push(valor);
    }


    const totalOferta =
        oferta.reduce(
            (a, b) => a + b,
            0
        );


    const totalDemanda =
        demanda.reduce(
            (a, b) => a + b,
            0
        );


    if (
        totalOferta <= EPSILON_N ||
        totalDemanda <= EPSILON_N
    ) {

        throw new Error(
            "La oferta y la demanda total deben ser mayores que cero."
        );
    }


    return {
        origenes,
        destinos,
        costos,
        oferta,
        demanda,
        totalOferta,
        totalDemanda
    };
}


// =====================================================
// LEER NÚMERO
// =====================================================

function leerNumeroNoroeste(
    input,
    nombre
) {

    const texto =
        input.value.trim();


    if (texto === "") {

        input.classList.add(
            "campo-invalido"
        );


        throw new Error(
            `${nombre} deben contener valores numéricos.`
        );
    }


    const valor =
        Number(texto);


    if (!Number.isFinite(valor)) {

        input.classList.add(
            "campo-invalido"
        );


        throw new Error(
            "Se encontró un valor no válido."
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

function resolverNoroeste() {

    ocultarErrorNoroeste();


    let datos;


    try {

        datos =
            obtenerDatosNoroeste();

    } catch (error) {

        mostrarErrorNoroeste(
            error.message
        );

        return;
    }


    const resultado =
        ejecutarNoroeste(datos);


    mostrarResultadoNoroeste(
        datos,
        resultado
    );
}


// =====================================================
// ALGORITMO ESQUINA NOROESTE
// =====================================================

function ejecutarNoroeste(
    datosOriginales
) {

    /*
     * Copiamos los datos porque, si el problema
     * no está balanceado, agregaremos un origen
     * o destino ficticio.
     */

    const costos =
        datosOriginales.costos.map(
            fila => [...fila]
        );


    const oferta =
        [...datosOriginales.oferta];


    const demanda =
        [...datosOriginales.demanda];


    const nombresOrigenes = [];


    for (
        let i = 0;
        i < oferta.length;
        i++
    ) {

        nombresOrigenes.push(
            "Origen " + (i + 1)
        );
    }


    const nombresDestinos = [];


    for (
        let j = 0;
        j < demanda.length;
        j++
    ) {

        nombresDestinos.push(
            "Destino " + (j + 1)
        );
    }


    let balanceo = null;


    const diferencia =
        datosOriginales.totalOferta -
        datosOriginales.totalDemanda;


    // SOBRA OFERTA:
    // agregar destino ficticio

    if (
        diferencia >
        EPSILON_N
    ) {

        for (
            let i = 0;
            i < costos.length;
            i++
        ) {

            costos[i].push(0);
        }


        demanda.push(
            diferencia
        );


        nombresDestinos.push(
            "Destino ficticio"
        );


        balanceo = {
            tipo: "destino",
            cantidad: diferencia
        };
    }


    // SOBRA DEMANDA:
    // agregar origen ficticio

    else if (
        diferencia <
        -EPSILON_N
    ) {

        const faltante =
            Math.abs(diferencia);


        costos.push(
            Array(
                demanda.length
            ).fill(0)
        );


        oferta.push(
            faltante
        );


        nombresOrigenes.push(
            "Origen ficticio"
        );


        balanceo = {
            tipo: "origen",
            cantidad: faltante
        };
    }


    const ofertaRestante =
        [...oferta];


    const demandaRestante =
        [...demanda];


    const asignaciones =
        Array.from(
            {
                length:
                    oferta.length
            },
            () =>
                Array(
                    demanda.length
                ).fill(0)
        );


    const pasos = [];


    let i = 0;
    let j = 0;
    let numeroPaso = 1;


    while (
        i < oferta.length &&
        j < demanda.length
    ) {

        const cantidad =
            Math.min(
                ofertaRestante[i],
                demandaRestante[j]
            );


        asignaciones[i][j] =
            cantidad;


        const costoUnitario =
            costos[i][j];


        const costoPaso =
            cantidad *
            costoUnitario;


        pasos.push({

            numero: numeroPaso,

            fila: i,

            columna: j,

            origen:
                nombresOrigenes[i],

            destino:
                nombresDestinos[j],

            cantidad,

            costoUnitario,

            costoPaso,

            ofertaAntes:
                ofertaRestante[i],

            demandaAntes:
                demandaRestante[j]

        });


        ofertaRestante[i] -=
            cantidad;


        demandaRestante[j] -=
            cantidad;


        if (
            Math.abs(
                ofertaRestante[i]
            ) <
            EPSILON_N
        ) {

            ofertaRestante[i] = 0;
        }


        if (
            Math.abs(
                demandaRestante[j]
            ) <
            EPSILON_N
        ) {

            demandaRestante[j] = 0;
        }


        /*
         * Si oferta y demanda se agotan al mismo
         * tiempo avanzamos diagonalmente.
         */

        if (
            ofertaRestante[i] === 0 &&
            demandaRestante[j] === 0
        ) {

            i++;
            j++;
        }


        else if (
            ofertaRestante[i] === 0
        ) {

            i++;
        }


        else {

            j++;
        }


        numeroPaso++;
    }


    let costoTotal = 0;


    for (
        let fila = 0;
        fila < asignaciones.length;
        fila++
    ) {

        for (
            let columna = 0;
            columna <
            asignaciones[fila].length;
            columna++
        ) {

            costoTotal +=
                asignaciones[fila][columna] *
                costos[fila][columna];
        }
    }


    return {

        costos,
        oferta,
        demanda,

        nombresOrigenes,
        nombresDestinos,

        asignaciones,

        pasos,

        costoTotal,

        balanceo

    };
}


// =====================================================
// MOSTRAR RESULTADO
// =====================================================

function mostrarResultadoNoroeste(
    datos,
    resultado
) {

    const contenedor =
        document.getElementById(
            "procedimientoNoroeste"
        );


    contenedor.innerHTML = "";


    // BALANCE

    const balance =
        document.createElement(
            "div"
        );


    if (
        resultado.balanceo === null
    ) {

        balance.className =
            "balance-correcto";


        balance.innerHTML = `

            <strong>
                ✓ Problema balanceado
            </strong>

            <p>
                Oferta total =
                ${formatearNoroeste(
                    datos.totalOferta
                )}

                &nbsp; | &nbsp;

                Demanda total =
                ${formatearNoroeste(
                    datos.totalDemanda
                )}
            </p>

        `;

    } else {

        balance.className =
            "balance-ajustado";


        if (
            resultado.balanceo.tipo ===
            "destino"
        ) {

            balance.innerHTML = `

                <strong>
                    Problema balanceado automáticamente
                </strong>

                <p>
                    La oferta era mayor que la demanda.
                    Se agregó un

                    <strong>
                        destino ficticio
                    </strong>

                    con demanda de

                    <strong>
                        ${formatearNoroeste(
                            resultado.balanceo
                                .cantidad
                        )}
                    </strong>

                    y costo cero.
                </p>

            `;

        } else {

            balance.innerHTML = `

                <strong>
                    Problema balanceado automáticamente
                </strong>

                <p>
                    La demanda era mayor que la oferta.
                    Se agregó un

                    <strong>
                        origen ficticio
                    </strong>

                    con oferta de

                    <strong>
                        ${formatearNoroeste(
                            resultado.balanceo
                                .cantidad
                        )}
                    </strong>

                    y costo cero.
                </p>

            `;
        }
    }


    contenedor.appendChild(
        balance
    );


    // PASOS

    const titulo =
        document.createElement(
            "div"
        );


    titulo.className =
        "subtitulo-procedimiento";


    titulo.innerHTML = `

        <h3>
            Asignaciones paso a paso
        </h3>

        <p>
            Se comienza en la celda ubicada
            en la esquina superior izquierda.
        </p>

    `;


    contenedor.appendChild(
        titulo
    );


    resultado.pasos.forEach(
        paso => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "paso-noroeste";


            div.innerHTML = `

                <div class="numero-paso-noroeste">
                    ${paso.numero}
                </div>


                <div class="detalle-paso-noroeste">

                    <h4>

                        ${paso.origen}

                        →

                        ${paso.destino}

                    </h4>


                    <p>

                        Oferta disponible:

                        <strong>
                            ${formatearNoroeste(
                                paso.ofertaAntes
                            )}
                        </strong>

                        &nbsp; | &nbsp;

                        Demanda pendiente:

                        <strong>
                            ${formatearNoroeste(
                                paso.demandaAntes
                            )}
                        </strong>

                    </p>


                    <p>

                        Se asigna el menor valor:

                        <strong>
                            ${formatearNoroeste(
                                paso.cantidad
                            )}
                        </strong>

                    </p>


                    <div class="calculo-costo">

                        ${formatearNoroeste(
                            paso.cantidad
                        )}

                        ×

                        ${formatearNoroeste(
                            paso.costoUnitario
                        )}

                        =

                        <strong>

                            ${formatearNoroeste(
                                paso.costoPaso
                            )}

                        </strong>

                    </div>

                </div>

            `;


            contenedor.appendChild(
                div
            );
        }
    );


    // MATRIZ FINAL

    const matrizFinal =
        document.createElement(
            "div"
        );


    matrizFinal.className =
        "iteracion-simplex";


    matrizFinal.innerHTML = `

        <h4>
            Matriz de asignaciones final
        </h4>

        <p class="texto-iteracion">
            Los valores muestran cuántas unidades
            deben enviarse desde cada origen hacia
            cada destino.
        </p>

    `;


    matrizFinal.appendChild(
        construirMatrizResultado(
            resultado
        )
    );


    contenedor.appendChild(
        matrizFinal
    );


    // COSTO

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
                    Solución inicial encontrada
                </h3>

                <p>
                    El método de Esquina Noroeste
                    terminó correctamente.
                </p>

            </div>

        </div>


        <div class="variables-resultado">

            <div
                class="resultado-variable destacado">

                <span>
                    Costo total de transporte
                </span>

                <strong>
                    ${formatearNoroeste(
                        resultado.costoTotal
                    )}
                </strong>

            </div>

        </div>


        <div class="interpretacion">

            <h4>
                Interpretación
            </h4>

            <p>
                Utilizando el método de Esquina
                Noroeste se obtuvo una solución
                básica factible inicial con un costo
                total de

                <strong>
                    ${formatearNoroeste(
                        resultado.costoTotal
                    )}
                </strong>.

                Este valor corresponde a la solución
                inicial del problema de transporte y
                no necesariamente representa el costo
                mínimo posible.
            </p>

        </div>

    `;


    contenedor.appendChild(
        final
    );


    document
        .getElementById(
            "panelResultadosNoroeste"
        )
        .classList.remove(
            "oculto"
        );


    document
        .getElementById(
            "panelResultadosNoroeste"
        )
        .scrollIntoView({
            behavior: "smooth"
        });
}


// =====================================================
// MATRIZ RESULTADO
// =====================================================

function construirMatrizResultado(
    resultado
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
        "tabla-transporte";


    let html = `

        <thead>

            <tr>

                <th>
                    Origen / Destino
                </th>

    `;


    resultado.nombresDestinos.forEach(
        nombre => {

            html += `
                <th>
                    ${nombre}
                </th>
            `;
        }
    );


    html += `

                <th>
                    Oferta
                </th>

            </tr>

        </thead>

        <tbody>

    `;


    resultado.asignaciones.forEach(
        (fila, i) => {

            html += `

                <tr>

                    <th>
                        ${resultado
                            .nombresOrigenes[i]}
                    </th>

            `;


            fila.forEach(
                (valor, j) => {

                    const clase =
                        valor >
                        EPSILON_N
                            ? "asignacion-activa"
                            : "";


                    html += `

                        <td class="${clase}">

                            ${formatearNoroeste(
                                valor
                            )}

                            ${
                                valor >
                                EPSILON_N
                                    ? `
                                    <small>
                                        Costo:
                                        ${formatearNoroeste(
                                            resultado
                                                .costos[i][j]
                                        )}
                                    </small>
                                    `
                                    : ""
                            }

                        </td>

                    `;
                }
            );


            html += `

                    <td class="celda-oferta">
                        ${formatearNoroeste(
                            resultado.oferta[i]
                        )}
                    </td>

                </tr>

            `;
        }
    );


    html += `

        <tr class="fila-demanda">

            <th>
                Demanda
            </th>

    `;


    resultado.demanda.forEach(
        valor => {

            html += `

                <td>
                    ${formatearNoroeste(
                        valor
                    )}
                </td>

            `;
        }
    );


    html += `

                <td>—</td>

            </tr>

        </tbody>

    `;


    table.innerHTML =
        html;


    responsive.appendChild(
        table
    );


    return responsive;
}


// =====================================================
// BALANCE EN TIEMPO REAL
// =====================================================

function actualizarBalanceVisual() {

    const origenes =
        parseInt(
            document.getElementById(
                "numOrigenes"
            ).value
        );


    const destinos =
        parseInt(
            document.getElementById(
                "numDestinos"
            ).value
        );


    let oferta = 0;
    let demanda = 0;
    let completo = true;


    for (
        let i = 0;
        i < origenes;
        i++
    ) {

        const input =
            document.getElementById(
                `n_oferta_${i}`
            );


        if (
            !input ||
            input.value.trim() === ""
        ) {

            completo = false;
            continue;
        }


        const valor =
            Number(input.value);


        if (
            Number.isFinite(valor)
        ) {

            oferta += valor;
        }
    }


    for (
        let j = 0;
        j < destinos;
        j++
    ) {

        const input =
            document.getElementById(
                `n_demanda_${j}`
            );


        if (
            !input ||
            input.value.trim() === ""
        ) {

            completo = false;
            continue;
        }


        const valor =
            Number(input.value);


        if (
            Number.isFinite(valor)
        ) {

            demanda += valor;
        }
    }


    const resumen =
        document.getElementById(
            "resumenBalance"
        );


    if (!completo) {

        resumen.innerHTML = "";

        return;
    }


    const diferencia =
        oferta - demanda;


    if (
        Math.abs(diferencia) <
        EPSILON_N
    ) {

        resumen.className =
            "balance-transporte balance-ok";


        resumen.innerHTML = `

            ✓ Problema balanceado:

            Oferta =

            <strong>
                ${formatearNoroeste(
                    oferta
                )}
            </strong>

            |

            Demanda =

            <strong>
                ${formatearNoroeste(
                    demanda
                )}
            </strong>

        `;

    } else {

        resumen.className =
            "balance-transporte balance-pendiente";


        resumen.innerHTML = `

            ⚠ Problema no balanceado:

            Oferta =

            <strong>
                ${formatearNoroeste(
                    oferta
                )}
            </strong>

            |

            Demanda =

            <strong>
                ${formatearNoroeste(
                    demanda
                )}
            </strong>

            <br>

            El simulador agregará automáticamente
            ${
                diferencia > 0
                    ? "un destino ficticio"
                    : "un origen ficticio"
            }.

        `;
    }
}


// =====================================================
// EJEMPLO AGUA SALVAVIDAS
// =====================================================

function cargarEjemploNoroeste() {

    document.getElementById(
        "numOrigenes"
    ).value = 3;


    document.getElementById(
        "numDestinos"
    ).value = 4;


    generarMatrizNoroeste();


    /*
        Costos:

                 D1   D2   D3   D4   Oferta

        O1        8    6   10    9      35
        O2        9   12   13    7      50
        O3       14    9   16    5      40

        Demanda  30   25   35   35

        Oferta total  = 125
        Demanda total = 125
    */


    const costos = [

        [8, 6, 10, 9],

        [9, 12, 13, 7],

        [14, 9, 16, 5]

    ];


    const oferta =
        [35, 50, 40];


    const demanda =
        [30, 25, 35, 35];


    for (
        let i = 0;
        i < costos.length;
        i++
    ) {

        for (
            let j = 0;
            j < costos[i].length;
            j++
        ) {

            document.getElementById(
                `n_costo_${i}_${j}`
            ).value =
                costos[i][j];
        }
    }


    oferta.forEach(
        (valor, i) => {

            document.getElementById(
                `n_oferta_${i}`
            ).value =
                valor;
        }
    );


    demanda.forEach(
        (valor, j) => {

            document.getElementById(
                `n_demanda_${j}`
            ).value =
                valor;
        }
    );


    actualizarBalanceVisual();
}


// =====================================================
// LIMPIAR
// =====================================================

function limpiarNoroeste() {

    document
        .querySelectorAll(
            ".input-matriz"
        )
        .forEach(
            input => {

                input.value = "";

                input.classList.remove(
                    "campo-invalido"
                );
            }
        );


    document.getElementById(
        "resumenBalance"
    ).innerHTML = "";


    document
        .getElementById(
            "panelResultadosNoroeste"
        )
        .classList.add(
            "oculto"
        );


    document.getElementById(
        "procedimientoNoroeste"
    ).innerHTML = "";


    ocultarErrorNoroeste();
}


// =====================================================
// FORMATEAR
// =====================================================

function formatearNoroeste(
    numero
) {

    if (
        Math.abs(numero) <
        EPSILON_N
    ) {

        return "0";
    }


    if (
        Math.abs(
            numero -
            Math.round(numero)
        ) <
        EPSILON_N
    ) {

        return String(
            Math.round(numero)
        );
    }


    return Number(
        numero.toFixed(3)
    ).toString();
}


// =====================================================
// ERRORES
// =====================================================

function mostrarErrorNoroeste(
    mensaje
) {

    const elemento =
        document.getElementById(
            "mensajeErrorNoroeste"
        );


    elemento.textContent =
        "⚠ " + mensaje;


    elemento.classList.remove(
        "oculto"
    );
}


function ocultarErrorNoroeste() {

    const elemento =
        document.getElementById(
            "mensajeErrorNoroeste"
        );


    if (!elemento) {
        return;
    }


    elemento.classList.add(
        "oculto"
    );


    elemento.textContent = "";
}