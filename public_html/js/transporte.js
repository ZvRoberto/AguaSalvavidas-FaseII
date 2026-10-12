
/*
 * GREAT VALUE - FASE II
 * MÉTODO DE COSTO MÍNIMO
 *
 * Hasta 20 orígenes y 20 destinos.
 * Balanceo automático con fila o columna ficticia.
 * Muestra procedimiento, asignaciones y costo total.
 */

"use strict";

const TRA_EPS = 1e-8;
const TRA_MAX = 20;

let traDimensiones = null;

function traEl(id) {
    return document.getElementById(id);
}

function traFmt(valor) {
    if (Math.abs(valor) < TRA_EPS) return "0";
    return Number(valor.toFixed(6)).toString();
}

function traMostrarError(mensaje) {
    const caja = traEl("traError");
    caja.textContent = mensaje;
    caja.classList.remove("oculto");
}

function traOcultarError() {
    const caja = traEl("traError");
    caja.textContent = "";
    caja.classList.add("oculto");
}

function traNumero(id) {
    const input = traEl(id);

    if (!input || input.value.trim() === "") {
        throw new Error("Completa todos los campos.");
    }

    const valor = Number(input.value);

    if (!Number.isFinite(valor) || valor < 0) {
        throw new Error(
            "Los costos, ofertas y demandas deben ser números no negativos."
        );
    }

    return valor;
}

function traCantidad(id) {
    const valor = traNumero(id);

    if (
        !Number.isInteger(valor) ||
        valor < 1 ||
        valor > TRA_MAX
    ) {
        throw new Error(
            "Debes ingresar entre 1 y 20 orígenes y destinos."
        );
    }

    return valor;
}

function traInput(id, valor = 0) {
    return `
        <input
            type="number"
            id="${id}"
            min="0"
            step="any"
            value="${valor}">
    `;
}

// =====================================================
// GENERAR MATRIZ
// =====================================================

function traGenerar() {
    traOcultarError();

    try {
        const origenes = traCantidad("traOrigenes");
        const destinos = traCantidad("traDestinos");

        traDimensiones = { origenes, destinos };

        let html = `
            <div class="tra-tabla-scroll">
                <table class="tra-tabla">
                    <thead>
                        <tr>
                            <th>Origen / Destino</th>
        `;

        for (let j = 0; j < destinos; j++) {
            html += `<th>D${j + 1}</th>`;
        }

        html += `
                            <th>Oferta</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (let i = 0; i < origenes; i++) {
            html += `<tr><th>O${i + 1}</th>`;

            for (let j = 0; j < destinos; j++) {
                html += `
                    <td>
                        ${traInput("traC" + i + "_" + j)}
                    </td>
                `;
            }

            html += `
                <td>
                    ${traInput("traO" + i)}
                </td>
                </tr>
            `;
        }

        html += `<tr><th>Demanda</th>`;

        for (let j = 0; j < destinos; j++) {
            html += `
                <td>
                    ${traInput("traD" + j)}
                </td>
            `;
        }

        html += `
                <td>—</td>
                </tr>
                </tbody>
                </table>
            </div>

            <p class="tra-nota">
                Si la oferta y la demanda totales son
                diferentes, se agregará automáticamente
                un origen o destino ficticio con costo cero.
            </p>
        `;

        traEl("traFormulario").innerHTML = html;
        traEl("traPanelMatriz").classList.remove("oculto");
        traEl("traPanelResultados").classList.add("oculto");

    } catch (error) {
        traMostrarError(error.message);
    }
}

// =====================================================
// LEER DATOS
// =====================================================

function traLeerDatos() {
    if (!traDimensiones) {
        throw new Error(
            "Primero debes generar la matriz."
        );
    }

    const { origenes, destinos } = traDimensiones;

    if (
        traCantidad("traOrigenes") !== origenes ||
        traCantidad("traDestinos") !== destinos
    ) {
        throw new Error(
            "Cambiaste las dimensiones. Genera nuevamente la matriz."
        );
    }

    const costos = [];
    const oferta = [];
    const demanda = [];

    for (let i = 0; i < origenes; i++) {
        const fila = [];

        for (let j = 0; j < destinos; j++) {
            fila.push(
                traNumero("traC" + i + "_" + j)
            );
        }

        costos.push(fila);
        oferta.push(traNumero("traO" + i));
    }

    for (let j = 0; j < destinos; j++) {
        demanda.push(traNumero("traD" + j));
    }

    const totalOferta = oferta.reduce(
        (suma, valor) => suma + valor, 0
    );

    const totalDemanda = demanda.reduce(
        (suma, valor) => suma + valor, 0
    );

    if (
        totalOferta <= TRA_EPS ||
        totalDemanda <= TRA_EPS
    ) {
        throw new Error(
            "La oferta y la demanda totales deben ser mayores que cero."
        );
    }

    return {
        costos,
        oferta,
        demanda,
        origenes,
        destinos,
        totalOferta,
        totalDemanda
    };
}

// =====================================================
// BALANCEAR PROBLEMA
// =====================================================

function traBalancear(datos) {
    const costos = datos.costos.map(
        fila => [...fila]
    );

    const oferta = [...datos.oferta];
    const demanda = [...datos.demanda];

    const nombresOrigenes = oferta.map(
        (_, i) => "O" + (i + 1)
    );

    const nombresDestinos = demanda.map(
        (_, j) => "D" + (j + 1)
    );

    let mensaje = "El problema ya está balanceado.";

    const diferencia =
        datos.totalOferta - datos.totalDemanda;

    const tolerancia = TRA_EPS * Math.max(
        1,
        datos.totalOferta,
        datos.totalDemanda
    );

    if (diferencia > tolerancia) {
        // Sobra oferta: agregar destino ficticio.
        demanda.push(diferencia);
        nombresDestinos.push("Destino ficticio");

        for (const fila of costos) {
            fila.push(0);
        }

        mensaje =
            "La oferta supera la demanda en " +
            traFmt(diferencia) +
            ". Se agregó un destino ficticio.";

    } else if (diferencia < -tolerancia) {
        // Falta oferta: agregar origen ficticio.
        const faltante = -diferencia;

        oferta.push(faltante);
        nombresOrigenes.push("Origen ficticio");

        costos.push(
            Array(demanda.length).fill(0)
        );

        mensaje =
            "La demanda supera la oferta en " +
            traFmt(faltante) +
            ". Se agregó un origen ficticio.";
    }

    return {
        costos,
        oferta,
        demanda,
        nombresOrigenes,
        nombresDestinos,
        mensaje
    };
}

// =====================================================
// MÉTODO DE COSTO MÍNIMO
// =====================================================

function traCostoMinimo(datos) {
    const balanceado = traBalancear(datos);

    const {
        costos,
        oferta,
        demanda,
        nombresOrigenes,
        nombresDestinos
    } = balanceado;

    const m = oferta.length;
    const n = demanda.length;

    const restanteOferta = [...oferta];
    const restanteDemanda = [...demanda];

    const asignaciones = Array.from(
        { length: m },
        () => Array(n).fill(0)
    );

    const pasos = [];
    let costoTotal = 0;

    /*
     * Se selecciona la celda de menor costo
     * entre las que todavía tienen oferta
     * y demanda disponibles.
     *
     * En empates, se elige la primera celda
     * por orden de origen y destino.
     */

    let contador = 0;
    const maxPasos = m + n + 5;

    while (contador < maxPasos) {
        let mejorI = -1;
        let mejorJ = -1;
        let menorCosto = Infinity;

        for (let i = 0; i < m; i++) {
            if (restanteOferta[i] <= TRA_EPS) {
                continue;
            }

            for (let j = 0; j < n; j++) {
                if (restanteDemanda[j] <= TRA_EPS) {
                    continue;
                }

                const costo = costos[i][j];

                if (costo < menorCosto - TRA_EPS) {
                    menorCosto = costo;
                    mejorI = i;
                    mejorJ = j;
                }
            }
        }

        if (mejorI === -1 || mejorJ === -1) {
            break;
        }

        const cantidad = Math.min(
            restanteOferta[mejorI],
            restanteDemanda[mejorJ]
        );

        if (cantidad <= TRA_EPS) {
            break;
        }

        asignaciones[mejorI][mejorJ] += cantidad;

        const costoPaso =
            cantidad * costos[mejorI][mejorJ];

        costoTotal += costoPaso;

        restanteOferta[mejorI] -= cantidad;
        restanteDemanda[mejorJ] -= cantidad;

        if (
            Math.abs(restanteOferta[mejorI]) < TRA_EPS
        ) {
            restanteOferta[mejorI] = 0;
        }

        if (
            Math.abs(restanteDemanda[mejorJ]) < TRA_EPS
        ) {
            restanteDemanda[mejorJ] = 0;
        }

        pasos.push({
            numero: contador + 1,
            origen: nombresOrigenes[mejorI],
            destino: nombresDestinos[mejorJ],
            cantidad,
            costoUnitario: costos[mejorI][mejorJ],
            costoPaso,
            costoAcumulado: costoTotal
        });

        contador++;
    }

    // Verificar que toda la oferta fue distribuida.
    for (let i = 0; i < m; i++) {
        if (restanteOferta[i] > TRA_EPS) {
            throw new Error(
                "No se logró distribuir toda la oferta."
            );
        }
    }

    // Verificar que toda la demanda fue satisfecha.
    for (let j = 0; j < n; j++) {
        if (restanteDemanda[j] > TRA_EPS) {
            throw new Error(
                "No se logró satisfacer toda la demanda."
            );
        }
    }

    // Comprobación independiente del costo.
    let costoVerificado = 0;

    for (let i = 0; i < m; i++) {
        let sumaOrigen = 0;

        for (let j = 0; j < n; j++) {
            sumaOrigen += asignaciones[i][j];

            costoVerificado +=
                asignaciones[i][j] * costos[i][j];
        }

        if (
            Math.abs(sumaOrigen - oferta[i]) >
            TRA_EPS * Math.max(1, oferta[i])
        ) {
            throw new Error(
                "La oferta de " + nombresOrigenes[i] +
                " no coincide con sus asignaciones."
            );
        }
    }

    for (let j = 0; j < n; j++) {
        let sumaDestino = 0;

        for (let i = 0; i < m; i++) {
            sumaDestino += asignaciones[i][j];
        }

        if (
            Math.abs(sumaDestino - demanda[j]) >
            TRA_EPS * Math.max(1, demanda[j])
        ) {
            throw new Error(
                "La demanda de " + nombresDestinos[j] +
                " no coincide con sus asignaciones."
            );
        }
    }

    if (
        Math.abs(costoVerificado - costoTotal) >
        TRA_EPS * Math.max(1, Math.abs(costoTotal))
    ) {
        throw new Error(
            "El costo total calculado no coincide."
        );
    }

    const asignacionesPositivas =
        asignaciones.flat().filter(
            cantidad => cantidad > TRA_EPS
        ).length;

    return {
        ...balanceado,
        asignaciones,
        pasos,
        costoTotal: costoVerificado,
        asignacionesPositivas,
        basicasRequeridas: m + n - 1
    };
}

// =====================================================
// MOSTRAR MATRIZ DE ASIGNACIONES
// =====================================================

function traTablaResultado(resultado) {
    const {
        asignaciones,
        costos,
        oferta,
        demanda,
        nombresOrigenes,
        nombresDestinos
    } = resultado;

    let html = `
        <div class="tra-tabla-scroll">
            <table class="tra-tabla">
                <thead>
                    <tr>
                        <th>Origen / Destino</th>
    `;

    nombresDestinos.forEach(nombre => {
        html += `<th>${nombre}</th>`;
    });

    html += `
                        <th>Oferta</th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (let i = 0; i < oferta.length; i++) {
        html += `<tr><th>${nombresOrigenes[i]}</th>`;

        for (let j = 0; j < demanda.length; j++) {
            const cantidad = asignaciones[i][j];
            const costo = costos[i][j];

            const clase = cantidad > TRA_EPS
                ? ' class="tra-asignada"'
                : "";

            html += `
                <td${clase}>
                    <strong>
                        ${traFmt(cantidad)}
                    </strong>
                    <small>
                        Costo: ${traFmt(costo)}
                    </small>
                </td>
            `;
        }

        html += `
            <td>${traFmt(oferta[i])}</td>
            </tr>
        `;
    }

    html += `<tr><th>Demanda</th>`;

    demanda.forEach(valor => {
        html += `<td>${traFmt(valor)}</td>`;
    });

    html += `
                <td>—</td>
            </tr>
            </tbody>
            </table>
        </div>
    `;

    return html;
}

// =====================================================
// MOSTRAR PROCEDIMIENTO
// =====================================================

function traMostrarResultado(resultado) {
    let html = `
        <div class="tra-resumen">
            <h3>Resultado del Método de Costo Mínimo</h3>

            <p>${resultado.mensaje}</p>

            <p>
                <strong>Costo total de transporte:</strong>
                ${traFmt(resultado.costoTotal)}
            </p>

            <p>
                <strong>Asignaciones realizadas:</strong>
                ${resultado.pasos.length}
            </p>
        </div>

        <h3>Matriz final de asignaciones</h3>
        ${traTablaResultado(resultado)}

        <h3>Procedimiento paso a paso</h3>

        <div class="tra-tabla-scroll">
            <table class="tra-tabla">
                <thead>
                    <tr>
                        <th>Paso</th>
                        <th>Origen</th>
                        <th>Destino</th>
                        <th>Cantidad</th>
                        <th>Costo unitario</th>
                        <th>Costo del paso</th>
                        <th>Acumulado</th>
                    </tr>
                </thead>
                <tbody>
    `;

    resultado.pasos.forEach(paso => {
        html += `
            <tr>
                <td>${paso.numero}</td>
                <td>${paso.origen}</td>
                <td>${paso.destino}</td>
                <td>${traFmt(paso.cantidad)}</td>
                <td>${traFmt(paso.costoUnitario)}</td>
                <td>${traFmt(paso.costoPaso)}</td>
                <td>${traFmt(paso.costoAcumulado)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>

        <h3>Comprobación del costo</h3>
        <p>
            El costo total se obtiene multiplicando
            cada cantidad asignada por su costo
            unitario y sumando todos los productos.
        </p>
    `;

    const terminos = [];

    for (
        let i = 0;
        i < resultado.oferta.length;
        i++
    ) {
        for (
            let j = 0;
            j < resultado.demanda.length;
            j++
        ) {
            const cantidad =
                resultado.asignaciones[i][j];

            if (cantidad > TRA_EPS) {
                terminos.push(
                    "(" + traFmt(cantidad) +
                    " × " +
                    traFmt(resultado.costos[i][j]) +
                    ")"
                );
            }
        }
    }

    html += `
        <p class="tra-formula">
            Z = ${terminos.join(" + ") || "0"}
        </p>

        <p>
            <strong>
                Z = ${traFmt(resultado.costoTotal)}
            </strong>
        </p>
    `;

    if (
        resultado.asignacionesPositivas <
        resultado.basicasRequeridas
    ) {
        html += `
            <p class="tra-nota">
                La solución presenta menos asignaciones
                positivas que m + n - 1. Si se utiliza
                posteriormente el método MODI, puede
                ser necesario incorporar variables
                básicas de valor cero para completar
                una base válida.
            </p>
        `;
    }

    html += `
        <p class="tra-nota">
            El Método de Costo Mínimo proporciona
            una solución inicial factible. Para
            determinar si es óptima, se puede
            aplicar el método MODI.
        </p>
    `;

    traEl("traResultados").innerHTML = html;

    traEl("traPanelResultados")
        .classList.remove("oculto");
}

// =====================================================
// RESOLVER
// =====================================================

function traResolver() {
    traOcultarError();

    try {
        const datos = traLeerDatos();
        const resultado = traCostoMinimo(datos);

        traMostrarResultado(resultado);

    } catch (error) {
        traEl("traPanelResultados")
            .classList.add("oculto");

        traMostrarError(error.message);
    }
}

// =====================================================
// EJEMPLO
// =====================================================

function traEjemplo() {
    traEl("traOrigenes").value = 3;
    traEl("traDestinos").value = 4;

    traGenerar();

    const costos = [
        [8, 6, 10, 9],
        [9, 12, 13, 7],
        [14, 9, 16, 5]
    ];

    const oferta = [20, 30, 25];
    const demanda = [10, 25, 20, 20];

    costos.forEach((fila, i) => {
        fila.forEach((valor, j) => {
            traEl("traC" + i + "_" + j).value = valor;
        });

        traEl("traO" + i).value = oferta[i];
    });

    demanda.forEach((valor, j) => {
        traEl("traD" + j).value = valor;
    });
}

// =====================================================
// LIMPIAR
// =====================================================

function traLimpiar() {
    traDimensiones = null;

    traEl("traOrigenes").value = 3;
    traEl("traDestinos").value = 4;

    traEl("traFormulario").innerHTML = "";
    traEl("traResultados").innerHTML = "";

    traEl("traPanelMatriz").classList.add("oculto");
    traEl("traPanelResultados").classList.add("oculto");

    traOcultarError();
}
