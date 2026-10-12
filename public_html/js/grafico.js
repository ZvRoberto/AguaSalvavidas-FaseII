
const EPSILON_G = 1e-8;


// =====================================================
// GENERAR MODELO
// =====================================================

function generarModeloGrafico() {

    const cantidad = parseInt(
        document.getElementById(
            "numRestriccionesGrafico"
        ).value
    );


    if (
        !Number.isInteger(cantidad) ||
        cantidad < 1 ||
        cantidad > 10
    ) {

        alert(
            "El número de restricciones debe estar entre 1 y 10."
        );

        return;
    }


    const contenedor =
        document.getElementById(
            "restriccionesGrafico"
        );


    contenedor.innerHTML = "";


    for (let i = 0; i < cantidad; i++) {

        const fila =
            document.createElement("div");

        fila.className =
            "fila-restriccion";


        fila.innerHTML = `

            <input
                type="number"
                step="any"
                id="g_r_${i}_0"
                class="input-coeficiente"
                placeholder="0">

            <span>X1 +</span>

            <input
                type="number"
                step="any"
                id="g_r_${i}_1"
                class="input-coeficiente"
                placeholder="0">

            <span>X2</span>


            <select
                id="g_signo_${i}"
                class="select-signo">

                <option value="<=">≤</option>
                <option value=">=">≥</option>
                <option value="=">=</option>

            </select>


            <input
                type="number"
                step="any"
                id="g_rhs_${i}"
                class="input-coeficiente rhs"
                placeholder="0">

        `;


        contenedor.appendChild(fila);
    }


    document
        .getElementById(
            "panelModeloGrafico"
        )
        .classList.remove("oculto");


    document
        .getElementById(
            "panelResultadosGrafico"
        )
        .classList.add("oculto");


    ocultarErrorGrafico();
}


// =====================================================
// LEER DATOS
// =====================================================

function obtenerDatosGrafico() {

    const cantidad =
        parseInt(
            document.getElementById(
                "numRestriccionesGrafico"
            ).value
        );


    const tipo =
        document.getElementById(
            "tipoGrafico"
        ).value;


    const c1 =
        leerNumeroGrafico(
            document.getElementById(
                "g_fo_0"
            )
        );


    const c2 =
        leerNumeroGrafico(
            document.getElementById(
                "g_fo_1"
            )
        );


    const restricciones = [];


    for (let i = 0; i < cantidad; i++) {

        const a =
            leerNumeroGrafico(
                document.getElementById(
                    `g_r_${i}_0`
                )
            );


        const b =
            leerNumeroGrafico(
                document.getElementById(
                    `g_r_${i}_1`
                )
            );


        const signo =
            document.getElementById(
                `g_signo_${i}`
            ).value;


        const rhs =
            leerNumeroGrafico(
                document.getElementById(
                    `g_rhs_${i}`
                )
            );


        if (
            Math.abs(a) < EPSILON_G &&
            Math.abs(b) < EPSILON_G
        ) {

            throw new Error(
                `La restricción ${i + 1} no puede tener ambos coeficientes en cero.`
            );
        }


        restricciones.push({
            a,
            b,
            signo,
            rhs
        });
    }


    return {
        tipo,
        objetivo: [c1, c2],
        restricciones
    };
}


// =====================================================
// LEER NÚMERO
// =====================================================

function leerNumeroGrafico(input) {

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
            "Se encontró un valor no numérico."
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

function resolverGrafico() {

    ocultarErrorGrafico();


    let datos;


    try {

        datos =
            obtenerDatosGrafico();

    } catch (error) {

        mostrarErrorGrafico(
            error.message
        );

        return;
    }


    const resultado =
        resolverProblemaGrafico(
            datos
        );


    mostrarResultadoGrafico(
        datos,
        resultado
    );
}


// =====================================================
// RESOLVER PROBLEMA
// =====================================================

function resolverProblemaGrafico(datos) {

    const candidatos = [];


    // Origen

    candidatos.push({
        x: 0,
        y: 0,
        origen: "Origen"
    });


    // Intersecciones con los ejes

    datos.restricciones.forEach(
        (r, i) => {

            if (
                Math.abs(r.a) >
                EPSILON_G
            ) {

                candidatos.push({
                    x: r.rhs / r.a,
                    y: 0,
                    origen:
                        `R${i + 1} con eje X1`
                });
            }


            if (
                Math.abs(r.b) >
                EPSILON_G
            ) {

                candidatos.push({
                    x: 0,
                    y: r.rhs / r.b,
                    origen:
                        `R${i + 1} con eje X2`
                });
            }
        }
    );


    // Intersecciones entre restricciones

    for (
        let i = 0;
        i < datos.restricciones.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < datos.restricciones.length;
            j++
        ) {

            const punto =
                interseccionLineas(
                    datos.restricciones[i],
                    datos.restricciones[j]
                );


            if (punto !== null) {

                candidatos.push({
                    x: punto.x,
                    y: punto.y,
                    origen:
                        `R${i + 1} ∩ R${j + 1}`
                });
            }
        }
    }


    // Filtrar puntos factibles

    let factibles =
        candidatos.filter(
            punto =>
                puntoFactible(
                    punto,
                    datos.restricciones
                )
        );


    // Eliminar repetidos

    factibles =
        eliminarPuntosRepetidos(
            factibles
        );


    // Evaluar Z

    factibles.forEach(
        punto => {

            punto.z =
                datos.objetivo[0] *
                punto.x +

                datos.objetivo[1] *
                punto.y;
        }
    );


    // Buscar óptimo

    let optimo = null;


    factibles.forEach(
        punto => {

            if (optimo === null) {

                optimo = punto;

                return;
            }


            if (
                datos.tipo === "max" &&
                punto.z >
                    optimo.z +
                    EPSILON_G
            ) {

                optimo = punto;
            }


            if (
                datos.tipo === "min" &&
                punto.z <
                    optimo.z -
                    EPSILON_G
            ) {

                optimo = punto;
            }
        }
    );


    return {
        candidatos,
        factibles,
        optimo
    };
}


// =====================================================
// INTERSECCIÓN DE DOS RECTAS
// =====================================================

function interseccionLineas(
    r1,
    r2
) {

    const determinante =
        r1.a * r2.b -
        r2.a * r1.b;


    if (
        Math.abs(determinante) <
        EPSILON_G
    ) {

        return null;
    }


    const x =
        (
            r1.rhs * r2.b -
            r2.rhs * r1.b
        ) /
        determinante;


    const y =
        (
            r1.a * r2.rhs -
            r2.a * r1.rhs
        ) /
        determinante;


    if (
        !Number.isFinite(x) ||
        !Number.isFinite(y)
    ) {

        return null;
    }


    return { x, y };
}


// =====================================================
// COMPROBAR FACTIBILIDAD
// =====================================================

function puntoFactible(
    punto,
    restricciones
) {

    if (
        punto.x < -EPSILON_G ||
        punto.y < -EPSILON_G
    ) {

        return false;
    }


    for (
        const r of restricciones
    ) {

        const izquierda =
            r.a * punto.x +
            r.b * punto.y;


        if (
            r.signo === "<=" &&
            izquierda >
                r.rhs +
                EPSILON_G
        ) {

            return false;
        }


        if (
            r.signo === ">=" &&
            izquierda <
                r.rhs -
                EPSILON_G
        ) {

            return false;
        }


        if (
            r.signo === "=" &&
            Math.abs(
                izquierda -
                r.rhs
            ) >
            EPSILON_G
        ) {

            return false;
        }
    }


    return true;
}


// =====================================================
// ELIMINAR PUNTOS REPETIDOS
// =====================================================

function eliminarPuntosRepetidos(
    puntos
) {

    const resultado = [];


    puntos.forEach(
        punto => {

            const existe =
                resultado.some(
                    existente =>

                        Math.abs(
                            existente.x -
                            punto.x
                        ) < EPSILON_G

                        &&

                        Math.abs(
                            existente.y -
                            punto.y
                        ) < EPSILON_G
                );


            if (!existe) {

                resultado.push(
                    punto
                );
            }
        }
    );


    return resultado;
}


// =====================================================
// MOSTRAR RESULTADOS
// =====================================================

function mostrarResultadoGrafico(
    datos,
    resultado
) {

    const panel =
        document.getElementById(
            "panelResultadosGrafico"
        );


    const procedimiento =
        document.getElementById(
            "procedimientoGrafico"
        );


    procedimiento.innerHTML = "";


    panel.classList.remove(
        "oculto"
    );


    if (
        resultado.factibles.length === 0
    ) {

        procedimiento.innerHTML = `

            <div class="resultado-error">

                <h3>
                    No se encontró una región factible
                </h3>

                <p>
                    No existen puntos que cumplan
                    simultáneamente todas las restricciones
                    ingresadas.
                </p>

            </div>

        `;


        dibujarGrafica(
            datos,
            resultado
        );


        return;
    }


    // TABLA DE VÉRTICES

    const bloque =
        document.createElement(
            "div"
        );

    bloque.className =
        "iteracion-simplex";


    bloque.innerHTML = `

        <h4>
            Evaluación de vértices factibles
        </h4>

        <p class="texto-iteracion">
            Cada vértice de la región factible se
            sustituye en la función objetivo.
        </p>

    `;


    const responsive =
        document.createElement(
            "div"
        );

    responsive.className =
        "tabla-responsive";


    const tabla =
        document.createElement(
            "table"
        );

    tabla.className =
        "tabla-simplex";


    tabla.innerHTML = `

        <thead>

            <tr>
                <th>Punto</th>
                <th>X1</th>
                <th>X2</th>
                <th>Z</th>
            </tr>

        </thead>

        <tbody></tbody>

    `;


    const tbody =
        tabla.querySelector("tbody");


    resultado.factibles.forEach(
        (punto, indice) => {

            const tr =
                document.createElement(
                    "tr"
                );


            if (
                resultado.optimo &&
                Math.abs(
                    punto.x -
                    resultado.optimo.x
                ) < EPSILON_G &&
                Math.abs(
                    punto.y -
                    resultado.optimo.y
                ) < EPSILON_G
            ) {

                tr.classList.add(
                    "fila-optima"
                );
            }


            tr.innerHTML = `

                <td>
                    P${indice + 1}
                </td>

                <td>
                    ${formatearGrafico(
                        punto.x
                    )}
                </td>

                <td>
                    ${formatearGrafico(
                        punto.y
                    )}
                </td>

                <td>
                    ${formatearGrafico(
                        punto.z
                    )}
                </td>

            `;


            tbody.appendChild(
                tr
            );
        }
    );


    responsive.appendChild(
        tabla
    );

    bloque.appendChild(
        responsive
    );

    procedimiento.appendChild(
        bloque
    );


    // RESULTADO FINAL

    if (resultado.optimo) {

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
                        El mejor vértice de la región
                        factible fue identificado.
                    </p>

                </div>

            </div>


            <div class="variables-resultado">

                <div class="resultado-variable">

                    <span>X1</span>

                    <strong>
                        ${formatearGrafico(
                            resultado.optimo.x
                        )}
                    </strong>

                </div>


                <div class="resultado-variable">

                    <span>X2</span>

                    <strong>
                        ${formatearGrafico(
                            resultado.optimo.y
                        )}
                    </strong>

                </div>


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
                        ${formatearGrafico(
                            resultado.optimo.z
                        )}
                    </strong>

                </div>

            </div>


            <div class="interpretacion">

                <h4>Interpretación</h4>

                <p>
                    La solución óptima se encuentra
                    en el punto

                    <strong>
                        (${formatearGrafico(
                            resultado.optimo.x
                        )},
                        ${formatearGrafico(
                            resultado.optimo.y
                        )})
                    </strong>

                    y produce un valor de la función
                    objetivo de

                    <strong>
                        ${formatearGrafico(
                            resultado.optimo.z
                        )}
                    </strong>.
                </p>

            </div>

        `;


        procedimiento.appendChild(
            final
        );
    }


    dibujarGrafica(
        datos,
        resultado
    );


    panel.scrollIntoView({
        behavior: "smooth"
    });
}


// =====================================================
// DIBUJAR GRÁFICA
// =====================================================

function dibujarGrafica(
    datos,
    resultado
) {

    const canvas =
        document.getElementById(
            "canvasGrafico"
        );


    const ctx =
        canvas.getContext("2d");


    const W =
        canvas.width;

    const H =
        canvas.height;


    ctx.clearRect(
        0,
        0,
        W,
        H
    );


    const margen = 65;


    let maxX = 10;
    let maxY = 10;


    resultado.candidatos.forEach(
        punto => {

            if (
                punto.x >= 0 &&
                Number.isFinite(punto.x)
            ) {

                maxX =
                    Math.max(
                        maxX,
                        punto.x
                    );
            }


            if (
                punto.y >= 0 &&
                Number.isFinite(punto.y)
            ) {

                maxY =
                    Math.max(
                        maxY,
                        punto.y
                    );
            }
        }
    );


    maxX *= 1.20;
    maxY *= 1.20;


    const anchoUtil =
        W - margen * 2;


    const altoUtil =
        H - margen * 2;


    const escalaX =
        anchoUtil / maxX;


    const escalaY =
        altoUtil / maxY;


    function px(x) {

        return margen +
            x * escalaX;
    }


    function py(y) {

        return H -
            margen -
            y * escalaY;
    }


    // FONDO

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    // CUADRÍCULA

    ctx.strokeStyle =
        "#e7edf2";

    ctx.lineWidth = 1;


    const divisiones = 10;


    for (
        let i = 0;
        i <= divisiones;
        i++
    ) {

        const x =
            margen +
            (
                anchoUtil /
                divisiones
            ) * i;


        ctx.beginPath();

        ctx.moveTo(
            x,
            margen
        );

        ctx.lineTo(
            x,
            H - margen
        );

        ctx.stroke();


        const y =
            margen +
            (
                altoUtil /
                divisiones
            ) * i;


        ctx.beginPath();

        ctx.moveTo(
            margen,
            y
        );

        ctx.lineTo(
            W - margen,
            y
        );

        ctx.stroke();
    }


    // REGIÓN FACTIBLE

    const ordenados =
        ordenarVertices(
            resultado.factibles
        );


    if (
        ordenados.length >= 3
    ) {

        ctx.beginPath();


        ordenados.forEach(
            (p, i) => {

                if (i === 0) {

                    ctx.moveTo(
                        px(p.x),
                        py(p.y)
                    );

                } else {

                    ctx.lineTo(
                        px(p.x),
                        py(p.y)
                    );
                }
            }
        );


        ctx.closePath();


        ctx.fillStyle =
            "rgba(0,119,182,0.13)";

        ctx.fill();


        ctx.strokeStyle =
            "rgba(0,119,182,0.55)";

        ctx.lineWidth = 2;

        ctx.stroke();
    }


    // EJES

    ctx.strokeStyle =
        "#17212b";

    ctx.lineWidth = 2;


    ctx.beginPath();

    ctx.moveTo(
        margen,
        H - margen
    );

    ctx.lineTo(
        W - margen,
        H - margen
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(
        margen,
        H - margen
    );

    ctx.lineTo(
        margen,
        margen
    );

    ctx.stroke();


    // NÚMEROS EJES

    ctx.fillStyle =
        "#52606d";

    ctx.font =
        "12px Arial";


    for (
        let i = 0;
        i <= divisiones;
        i++
    ) {

        const valorX =
            maxX /
            divisiones *
            i;


        const x =
            margen +
            anchoUtil /
            divisiones *
            i;


        ctx.fillText(
            formatearGrafico(valorX),
            x - 8,
            H - margen + 22
        );


        const valorY =
            maxY -
            maxY /
            divisiones *
            i;


        const y =
            margen +
            altoUtil /
            divisiones *
            i;


        ctx.fillText(
            formatearGrafico(valorY),
            10,
            y + 4
        );
    }


    ctx.font =
        "bold 14px Arial";


    ctx.fillText(
        "X1",
        W - margen + 15,
        H - margen + 5
    );


    ctx.fillText(
        "X2",
        margen - 8,
        margen - 15
    );


    // RESTRICCIONES

    datos.restricciones.forEach(
        (r, indice) => {

            const puntosLinea = [];


            if (
                Math.abs(r.b) >
                EPSILON_G
            ) {

                let y0 =
                    r.rhs /
                    r.b;


                let yMax =
                    (
                        r.rhs -
                        r.a * maxX
                    ) /
                    r.b;


                if (
                    Number.isFinite(y0)
                ) {

                    puntosLinea.push({
                        x: 0,
                        y: y0
                    });
                }


                if (
                    Number.isFinite(yMax)
                ) {

                    puntosLinea.push({
                        x: maxX,
                        y: yMax
                    });
                }
            }


            if (
                Math.abs(r.a) >
                EPSILON_G
            ) {

                let x0 =
                    r.rhs /
                    r.a;


                let xMax =
                    (
                        r.rhs -
                        r.b * maxY
                    ) /
                    r.a;


                if (
                    Number.isFinite(x0)
                ) {

                    puntosLinea.push({
                        x: x0,
                        y: 0
                    });
                }


                if (
                    Number.isFinite(xMax)
                ) {

                    puntosLinea.push({
                        x: xMax,
                        y: maxY
                    });
                }
            }


            const visibles =
                puntosLinea.filter(
                    p =>
                        p.x >= -EPSILON_G &&
                        p.y >= -EPSILON_G &&
                        p.x <= maxX + EPSILON_G &&
                        p.y <= maxY + EPSILON_G
                );


            if (
                visibles.length >= 2
            ) {

                ctx.strokeStyle =
                    colorRestriccion(
                        indice
                    );

                ctx.lineWidth = 2;


                ctx.beginPath();

                ctx.moveTo(
                    px(visibles[0].x),
                    py(visibles[0].y)
                );

                ctx.lineTo(
                    px(visibles[1].x),
                    py(visibles[1].y)
                );

                ctx.stroke();


                ctx.fillStyle =
                    colorRestriccion(
                        indice
                    );


                ctx.font =
                    "bold 12px Arial";


                ctx.fillText(
                    "R" + (indice + 1),
                    px(visibles[0].x) + 5,
                    py(visibles[0].y) - 5
                );
            }
        }
    );


    // VÉRTICES

    resultado.factibles.forEach(
        (punto, indice) => {

            ctx.beginPath();

            ctx.arc(
                px(punto.x),
                py(punto.y),
                5,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "#17212b";

            ctx.fill();


            ctx.fillStyle =
                "#17212b";

            ctx.font =
                "bold 12px Arial";


            ctx.fillText(
                "P" + (indice + 1),
                px(punto.x) + 8,
                py(punto.y) - 8
            );
        }
    );


    // PUNTO ÓPTIMO

    if (resultado.optimo) {

        ctx.beginPath();

        ctx.arc(
            px(resultado.optimo.x),
            py(resultado.optimo.y),
            9,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#2f9e68";

        ctx.fill();


        ctx.strokeStyle =
            "#ffffff";

        ctx.lineWidth = 3;

        ctx.stroke();


        ctx.fillStyle =
            "#22754d";

        ctx.font =
            "bold 13px Arial";


        ctx.fillText(
            "ÓPTIMO",
            px(resultado.optimo.x) + 12,
            py(resultado.optimo.y) + 5
        );
    }
}


// =====================================================
// ORDENAR VÉRTICES
// =====================================================

function ordenarVertices(
    puntos
) {

    if (
        puntos.length < 3
    ) {

        return [...puntos];
    }


    const centroX =
        puntos.reduce(
            (suma, p) =>
                suma + p.x,
            0
        ) /
        puntos.length;


    const centroY =
        puntos.reduce(
            (suma, p) =>
                suma + p.y,
            0
        ) /
        puntos.length;


    return [...puntos].sort(
        (a, b) => {

            const anguloA =
                Math.atan2(
                    a.y - centroY,
                    a.x - centroX
                );


            const anguloB =
                Math.atan2(
                    b.y - centroY,
                    b.x - centroX
                );


            return anguloA -
                anguloB;
        }
    );
}


// =====================================================
// COLORES DE RESTRICCIONES
// =====================================================

function colorRestriccion(
    indice
) {

    const colores = [
        "#0077b6",
        "#d97706",
        "#7c3aed",
        "#dc2626",
        "#0891b2",
        "#65a30d",
        "#9333ea",
        "#c2410c",
        "#0369a1",
        "#4d7c0f"
    ];


    return colores[
        indice %
        colores.length
    ];
}


// =====================================================
// EJEMPLO AGUA SALVAVIDAS
// =====================================================

function cargarEjemploGrafico() {

    document.getElementById(
        "tipoGrafico"
    ).value = "max";


    document.getElementById(
        "numRestriccionesGrafico"
    ).value = 3;


    generarModeloGrafico();


    /*
        Max Z = 40X1 + 30X2

        2X1 + X2 <= 100
        X1 + X2 <= 80
        X1 <= 40
    */


    document.getElementById(
        "g_fo_0"
    ).value = 40;


    document.getElementById(
        "g_fo_1"
    ).value = 30;


    document.getElementById(
        "g_r_0_0"
    ).value = 2;

    document.getElementById(
        "g_r_0_1"
    ).value = 1;

    document.getElementById(
        "g_signo_0"
    ).value = "<=";

    document.getElementById(
        "g_rhs_0"
    ).value = 100;


    document.getElementById(
        "g_r_1_0"
    ).value = 1;

    document.getElementById(
        "g_r_1_1"
    ).value = 1;

    document.getElementById(
        "g_signo_1"
    ).value = "<=";

    document.getElementById(
        "g_rhs_1"
    ).value = 80;


    document.getElementById(
        "g_r_2_0"
    ).value = 1;

    document.getElementById(
        "g_r_2_1"
    ).value = 0;

    document.getElementById(
        "g_signo_2"
    ).value = "<=";

    document.getElementById(
        "g_rhs_2"
    ).value = 40;
}


// =====================================================
// LIMPIAR
// =====================================================

function limpiarGrafico() {

    document
        .querySelectorAll(
            "#panelModeloGrafico input"
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
            "panelResultadosGrafico"
        )
        .classList.add(
            "oculto"
        );


    document.getElementById(
        "procedimientoGrafico"
    ).innerHTML = "";


    ocultarErrorGrafico();
}


// =====================================================
// FORMATEAR
// =====================================================

function formatearGrafico(
    numero
) {

    if (
        Math.abs(numero) <
        EPSILON_G
    ) {

        return "0";
    }


    if (
        Math.abs(
            numero -
            Math.round(numero)
        ) <
        EPSILON_G
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

function mostrarErrorGrafico(
    mensaje
) {

    const elemento =
        document.getElementById(
            "mensajeErrorGrafico"
        );


    elemento.textContent =
        "⚠ " + mensaje;


    elemento.classList.remove(
        "oculto"
    );
}


function ocultarErrorGrafico() {

    const elemento =
        document.getElementById(
            "mensajeErrorGrafico"
        );


    if (!elemento) {
        return;
    }


    elemento.classList.add(
        "oculto"
    );


    elemento.textContent = "";
}