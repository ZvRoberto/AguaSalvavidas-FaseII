
/*
 * AGUA SALVAVIDAS
 * FASE II - MÉTODO DE TRANSPORTE
 *
 * Solución básica factible inicial:
 * MÉTODO DEL COSTO MÍNIMO
 *
 * Incluye:
 * - Matriz dinámica
 * - Validaciones
 * - Balanceo automático
 * - Origen o destino ficticio
 * - Asignaciones paso a paso
 * - Cálculo y verificación del costo
 * - Detección de degeneración
 *
 * IMPORTANTE:
 * El Costo Mínimo no garantiza
 * la solución óptima global.
 */

"use strict";

const TRA_EPS = 1e-8;
let traDimensiones = null;

function traEl(id) {
    return document.getElementById(id);
}

function traError(mensaje) {
    traEl("traError").textContent = mensaje;
    traEl("traError").classList.remove("oculto");
}

function traOcultarError() {
    traEl("traError").textContent = "";
    traEl("traError").classList.add("oculto");
}

function traNumero(id) {
    const campo = traEl(id);

    if (!campo || campo.value.trim() === "") {
        throw new Error("Completa todos los campos.");
    }

    const valor = Number(campo.value);

    if (!Number.isFinite(valor)) {
        throw new Error("Ingresa números válidos.");
    }

    if (valor < 0) {
        throw new Error(
            "Los costos, ofertas y demandas " +
            "deben ser no negativos."
        );
    }

    return valor;
}

function traCantidad(id) {
    const valor = traNumero(id);

    if (!Number.isInteger(valor) ||
        valor < 1 || valor > 10) {
        throw new Error(
            "La cantidad de orígenes y destinos " +
            "debe ser un entero entre 1 y 10."
        );
    }

    return valor;
}

function traFmt(valor) {
    if (Math.abs(valor) < TRA_EPS) {
        return "0";
    }

    return Number(valor.toFixed(6)).toString();
}

function traInput(id, valor = 0) {
    return `
        <input type="number"
               step="any"
               min="0"
               id="${id}"
               value="${valor}">
    `;
}

/* ==========================================
   GENERAR MATRIZ
   ========================================== */

function traGenerar() {
    traOcultarError();

    try {
        const m = traCantidad("traOrigenes");
        const n = traCantidad("traDestinos");

        traDimensiones = { m, n };

        let html = `
            <div class="tra-tabla-scroll">
            <table class="tra-tabla">
                <thead>
                    <tr>
                        <th>Origen / Destino</th>
        `;

        for (let j = 0; j < n; j++) {
            html += `<th>D${j + 1}</th>`;
        }

        html += `
                        <th>Oferta</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (let i = 0; i < m; i++) {
            html += `<tr><th>O${i + 1}</th>`;

            for (let j = 0; j < n; j++) {
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

        html += `
                <tr>
                    <th>Demanda</th>
        `;

        for (let j = 0; j < n; j++) {
            html += `
                <td>${traInput("traD" + j)}</td>
            `;
        }

        html += `
                    <td>—</td>
                </tr>
                </tbody>
            </table>
            </div>

            <p class="tra-nota">
                Los costos representan el gasto por
                transportar una unidad desde un origen
                hasta un destino. Si la oferta y la
                demanda no coinciden, el sistema
                agregará una fila o columna ficticia
                con costo cero.
            </p>
        `;

        traEl("traFormulario").innerHTML = html;

        traEl("traPanelMatriz")
            .classList.remove("oculto");

        traEl("traPanelResultados")
            .classList.add("oculto");

    } catch (error) {
        traError(error.message);
    }
}

/* ==========================================
   LEER MATRIZ
   ========================================== */

function traLeer() {
    if (!traDimensiones) {
        throw new Error(
            "Primero debes generar la matriz."
        );
    }

    const { m, n } = traDimensiones;

    if (
        traCantidad("traOrigenes") !== m ||
        traCantidad("traDestinos") !== n
    ) {
        throw new Error(
            "Cambiaste las dimensiones. " +
            "Genera nuevamente la matriz."
        );
    }

    const costos = [];
    const oferta = [];
    const demanda = [];

    for (let i = 0; i < m; i++) {
        const fila = [];

        for (let j = 0; j < n; j++) {
            fila.push(
                traNumero("traC" + i + "_" + j)
            );
        }

        costos.push(fila);
        oferta.push(traNumero("traO" + i));
    }

    for (let j = 0; j < n; j++) {
        demanda.push(traNumero("traD" + j));
    }

    const totalOferta = oferta.reduce(
        (suma, valor) => suma + valor, 0
    );

    const totalDemanda = demanda.reduce(
        (suma, valor) => suma + valor, 0
    );

    if (
        !Number.isFinite(totalOferta) ||
        !Number.isFinite(totalDemanda)
    ) {
        throw new Error(
            "Los totales exceden el rango numérico permitido."
        );
    }

    if (totalOferta <= TRA_EPS ||
        totalDemanda <= TRA_EPS) {
        throw new Error(
            "La oferta y la demanda total " +
            "deben ser mayores que cero."
        );
    }

    return {
        costos,
        oferta,
        demanda,
        totalOferta,
        totalDemanda
    };
}

/* ==========================================
   BALANCEAR PROBLEMA
   ========================================== */

function traBalancear(datos) {
    const costos = datos.costos.map(
        fila => [...fila]
    );

    const oferta = [...datos.oferta];
    const demanda = [...datos.demanda];

    let mensaje = "El problema ya está balanceado.";
    let origenFicticio = false;
    let destinoFicticio = false;

    const diferencia =
        datos.totalOferta - datos.totalDemanda;

    if (diferencia > TRA_EPS) {
        // Existe oferta sobrante.
        demanda.push(diferencia);

        costos.forEach(fila => {
            fila.push(0);
        });

        destinoFicticio = true;

        mensaje =
            "Se agregó un destino ficticio con " +
            traFmt(diferencia) +
            " unidades de demanda y costo cero.";

    } else if (diferencia < -TRA_EPS) {
        // Existe demanda sin cubrir.
        oferta.push(-diferencia);

        costos.push(
            Array(demanda.length).fill(0)
        );

        origenFicticio = true;

        mensaje =
            "Se agregó un origen ficticio con " +
            traFmt(-diferencia) +
            " unidades de oferta y costo cero.";
    }

    return {
        costos,
        oferta,
        demanda,
        origenFicticio,
        destinoFicticio,
        mensaje
    };
}

/* ==========================================
   MÉTODO DEL COSTO MÍNIMO
   ========================================== */

function traCostoMinimo(datos) {
    const balanceado = traBalancear(datos);

    const {
        costos,
        oferta,
        demanda
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
    let numeroPaso = 0;

    /*
     * Mientras exista demanda pendiente,
     * seleccionar la celda disponible
     * de menor costo.
     *
     * Empates: primero la fila menor
     * y luego la columna menor.
     */

    while (
        restanteDemanda.some(
            cantidad => cantidad > TRA_EPS
        )
    ) {
        let mejorFila = -1;
        let mejorColumna = -1;
        let menorCosto = Infinity;

        for (let i = 0; i < m; i++) {
            if (restanteOferta[i] <= TRA_EPS) {
                continue;
            }

            for (let j = 0; j < n; j++) {
                if (restanteDemanda[j] <= TRA_EPS) {
                    continue;
                }

                if (
                    costos[i][j] <
                    menorCosto - TRA_EPS
                ) {
                    menorCosto = costos[i][j];
                    mejorFila = i;
                    mejorColumna = j;
                }
            }
        }

        if (mejorFila === -1) {
            throw new Error(
                "No se pudo completar la distribución."
            );
        }

        const i = mejorFila;
        const j = mejorColumna;

        const cantidad = Math.min(
            restanteOferta[i],
            restanteDemanda[j]
        );

        if (cantidad <= TRA_EPS) {
            throw new Error(
                "Se detectó una asignación inválida."
            );
        }

        asignaciones[i][j] += cantidad;

        restanteOferta[i] -= cantidad;
        restanteDemanda[j] -= cantidad;

        if (Math.abs(restanteOferta[i]) < TRA_EPS) {
            restanteOferta[i] = 0;
        }

        if (Math.abs(restanteDemanda[j]) < TRA_EPS) {
            restanteDemanda[j] = 0;
        }

        numeroPaso++;

        pasos.push({
            numero: numeroPaso,
            origen: i,
            destino: j,
            cantidad,
            costoUnitario: costos[i][j],
            costoParcial:
                cantidad * costos[i][j],
            ofertaRestante: [...restanteOferta],
            demandaRestante: [...restanteDemanda]
        });

        if (numeroPaso > m * n) {
            throw new Error(
                "Se excedió el número esperado de asignaciones."
            );
        }
    }

    /*
     * COMPROBAR OFERTA Y DEMANDA
     */

    for (let i = 0; i < m; i++) {
        const enviado = asignaciones[i].reduce(
            (suma, valor) => suma + valor, 0
        );

        if (
            Math.abs(enviado - oferta[i]) >
            TRA_EPS * Math.max(1, oferta[i])
        ) {
            throw new Error(
                "La oferta del origen " +
                (i + 1) + " no coincide."
            );
        }
    }

    for (let j = 0; j < n; j++) {
        let recibido = 0;

        for (let i = 0; i < m; i++) {
            recibido += asignaciones[i][j];
        }

        if (
            Math.abs(recibido - demanda[j]) >
            TRA_EPS * Math.max(1, demanda[j])
        ) {
            throw new Error(
                "La demanda del destino " +
                (j + 1) + " no coincide."
            );
        }
    }

    /*
     * CALCULAR COSTO TOTAL
     */

    let costoTotal = 0;
    let asignacionesPositivas = 0;

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            const cantidad = asignaciones[i][j];

            costoTotal +=
                cantidad * costos[i][j];

            if (cantidad > TRA_EPS) {
                asignacionesPositivas++;
            }
        }
    }

    const basicasNecesarias = m + n - 1;

    return {
        ...balanceado,
        asignaciones,
        pasos,
        costoTotal,
        asignacionesPositivas,
        basicasNecesarias,
        degenerada:
            asignacionesPositivas < basicasNecesarias
    };
}

/* ==========================================
   MOSTRAR RESULTADOS
   ========================================== */

function traMostrar(resultado) {
    const {
        costos,
        oferta,
        demanda,
        asignaciones,
        pasos
    } = resultado;

    const m = oferta.length;
    const n = demanda.length;

    let html = `
        <div class="tra-resumen">
            <div>
                <small>Costo total de distribución</small>
                <strong>${traFmt(resultado.costoTotal)}</strong>
            </div>
            <div>
                <small>Asignaciones realizadas</small>
                <strong>${pasos.length}</strong>
            </div>
        </div>

        <div class="tra-informacion">
            <h3>Balance del problema</h3>
            <p>${resultado.mensaje}</p>
        </div>

        <h3>Matriz de asignaciones</h3>

        <div class="tra-tabla-scroll">
        <table class="tra-tabla">
            <thead>
                <tr>
                    <th>Origen / Destino</th>
    `;

    for (let j = 0; j < n; j++) {
        const nombre =
            resultado.destinoFicticio && j === n - 1
                ? "Destino ficticio"
                : "D" + (j + 1);

        html += `<th>${nombre}</th>`;
    }

    html += `<th>Oferta</th></tr></thead><tbody>`;

    for (let i = 0; i < m; i++) {
        const nombre =
            resultado.origenFicticio && i === m - 1
                ? "Origen ficticio"
                : "O" + (i + 1);

        html += `<tr><th>${nombre}</th>`;

        for (let j = 0; j < n; j++) {
            const cantidad = asignaciones[i][j];

            html += `
                <td class="${cantidad > TRA_EPS
                    ? "tra-asignada"
                    : ""}">
                    <strong>${traFmt(cantidad)}</strong>
                    <small>
                        Costo: ${traFmt(costos[i][j])}
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
            </tr></tbody>
        </table>
        </div>

        <h3>Procedimiento paso a paso</h3>
        <p class="tra-nota">
            En cada paso se selecciona la celda
            disponible con el costo unitario menor
            y se asigna la máxima cantidad posible.
        </p>
    `;

    pasos.forEach(paso => {
        const origen =
            resultado.origenFicticio &&
            paso.origen === m - 1
                ? "Origen ficticio"
                : "O" + (paso.origen + 1);

        const destino =
            resultado.destinoFicticio &&
            paso.destino === n - 1
                ? "Destino ficticio"
                : "D" + (paso.destino + 1);

        html += `
            <div class="tra-paso">
                <h4>Paso ${paso.numero}</h4>

                <p>
                    Se selecciona
                    <strong>${origen} → ${destino}</strong>
                    porque tiene el menor costo
                    disponible según el criterio
                    de desempate.
                </p>

                <p>
                    Cantidad asignada:
                    <strong>${traFmt(paso.cantidad)}</strong>
                </p>

                <p>
                    Costo parcial:
                    ${traFmt(paso.cantidad)}
                    × ${traFmt(paso.costoUnitario)}
                    =
                    <strong>${traFmt(paso.costoParcial)}</strong>
                </p>
            </div>
        `;
    });

    html += `
        <div class="tra-informacion">
            <h3>Verificación matemática</h3>
            <p>
                Todas las ofertas y demandas
                quedaron satisfechas después
                del balanceo.
            </p>
            <p>
                Asignaciones positivas:
                <strong>
                    ${resultado.asignacionesPositivas}
                </strong>
            </p>
            <p>
                Variables básicas necesarias:
                <strong>
                    ${resultado.basicasNecesarias}
                </strong>
            </p>
    `;

    if (resultado.degenerada) {
        html += `
            <p class="tra-advertencia">
                Se detectó degeneración.
                Para aplicar MODI será necesario
                completar una base independiente
                con variables básicas de valor cero.
            </p>
        `;
    }

    html += `
            <p>
                <strong>Interpretación:</strong>
                esta distribución satisface
                la oferta y la demanda,
                con un costo inicial de
                ${traFmt(resultado.costoTotal)}.
                Para comprobar si es óptima
                debe aplicarse MODI.
            </p>
        </div>
    `;

    traEl("traResultados").innerHTML = html;
    traEl("traPanelResultados")
        .classList.remove("oculto");
}

/* ==========================================
   RESOLVER
   ========================================== */

function traResolver() {
    traOcultarError();

    traEl("traPanelResultados")
        .classList.add("oculto");

    try {
        const datos = traLeer();
        const resultado = traCostoMinimo(datos);

        traMostrar(resultado);

    } catch (error) {
        traError(error.message);
    }
}

/* ==========================================
   EJEMPLO DE PRUEBA
   ========================================== */

function traEjemplo() {
    traEl("traOrigenes").value = 3;
    traEl("traDestinos").value = 4;

    traGenerar();

    const costos = [
        [8, 6, 10, 9],
        [9, 12, 13, 7],
        [14, 9, 16, 5]
    ];

    const oferta = [35, 50, 40];
    const demanda = [30, 25, 35, 35];

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

/* ==========================================
   LIMPIAR
   ========================================== */

function traLimpiar() {
    traDimensiones = null;

    traEl("traOrigenes").value = 3;
    traEl("traDestinos").value = 4;

    traEl("traFormulario").innerHTML = "";
    traEl("traResultados").innerHTML = "";

    traEl("traPanelMatriz")
        .classList.add("oculto");

    traEl("traPanelResultados")
        .classList.add("oculto");

    traOcultarError();
}
