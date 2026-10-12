
/*
 * AGUA SALVAVIDAS - FASE II
 * MÉTODO MODI (U-V)
 *
 * 1. Balanceo de oferta y demanda
 * 2. Solución inicial por Costo Mínimo
 * 3. Base de m+n-1 celdas independientes
 * 4. Potenciales U y V
 * 5. Costos de oportunidad
 * 6. Ciclo cerrado y ajuste
 * 7. Comprobación de optimalidad
 *
 * Minimización con costos no negativos.
 */

"use strict";

const MODI_EPS = 1e-8;
const MODI_MAX_ITER = 500;

let modiDimensiones = null;

function modiEl(id) {
    return document.getElementById(id);
}

function modiFmt(x) {
    if (!Number.isFinite(x)) return String(x);
    return Number(
        (Math.abs(x) < MODI_EPS ? 0 : x).toFixed(6)
    ).toString();
}

function modiMostrarError(mensaje) {
    modiEl("modiError").textContent = mensaje;
    modiEl("modiError").classList.remove("oculto");
}

function modiOcultarError() {
    modiEl("modiError").textContent = "";
    modiEl("modiError").classList.add("oculto");
}

function modiNumero(id) {
    const campo = modiEl(id);

    if (!campo || campo.value.trim() === "") {
        throw new Error("Completa todos los campos.");
    }

    const valor = Number(campo.value);

    if (!Number.isFinite(valor) || valor < 0) {
        throw new Error(
            "Ingresa únicamente números no negativos."
        );
    }

    return valor;
}

function modiDimension(id) {
    const valor = modiNumero(id);

    if (!Number.isInteger(valor) ||
        valor < 1 || valor > 10) {
        throw new Error(
            "Las dimensiones deben ser enteros entre 1 y 10."
        );
    }

    return valor;
}

function modiInput(id) {
    return `<input id="${id}" type="number"
                   min="0" step="any" value="0">`;
}

/* =========================================
   FORMULARIO
   ========================================= */

function modiGenerar() {
    modiOcultarError();

    try {
        const m = modiDimension("modiOrigenes");
        const n = modiDimension("modiDestinos");

        modiDimensiones = { m, n };

        let html = `
            <div class="modi-tabla-scroll">
            <table class="modi-tabla">
                <thead><tr><th>Origen / Destino</th>
        `;

        for (let j = 0; j < n; j++) {
            html += `<th>D${j + 1}</th>`;
        }

        html += `<th>Oferta</th></tr></thead><tbody>`;

        for (let i = 0; i < m; i++) {
            html += `<tr><th>O${i + 1}</th>`;

            for (let j = 0; j < n; j++) {
                html += `<td>${modiInput("modiC" + i + "_" + j)}</td>`;
            }

            html += `<td>${modiInput("modiO" + i)}</td></tr>`;
        }

        html += `<tr><th>Demanda</th>`;

        for (let j = 0; j < n; j++) {
            html += `<td>${modiInput("modiD" + j)}</td>`;
        }

        html += `
            <td>—</td></tr></tbody></table></div>
            <p class="modi-nota">
                Si oferta y demanda no coinciden,
                se agrega automáticamente un origen
                o destino ficticio con costo cero.
            </p>
        `;

        modiEl("modiFormulario").innerHTML = html;
        modiEl("modiPanelDatos").classList.remove("oculto");
        modiEl("modiPanelResultados").classList.add("oculto");

    } catch (e) {
        modiMostrarError(e.message);
    }
}

function modiLeer() {
    if (!modiDimensiones) {
        throw new Error("Primero genera la matriz.");
    }

    const { m, n } = modiDimensiones;

    if (modiDimension("modiOrigenes") !== m ||
        modiDimension("modiDestinos") !== n) {
        throw new Error(
            "Cambiaste las dimensiones. Genera nuevamente la matriz."
        );
    }

    const costos = [];
    const oferta = [];
    const demanda = [];

    for (let i = 0; i < m; i++) {
        const fila = [];

        for (let j = 0; j < n; j++) {
            fila.push(modiNumero("modiC" + i + "_" + j));
        }

        costos.push(fila);
        oferta.push(modiNumero("modiO" + i));
    }

    for (let j = 0; j < n; j++) {
        demanda.push(modiNumero("modiD" + j));
    }

    const totalO = oferta.reduce((a, b) => a + b, 0);
    const totalD = demanda.reduce((a, b) => a + b, 0);

    if (!Number.isFinite(totalO) ||
        !Number.isFinite(totalD) ||
        totalO <= MODI_EPS ||
        totalD <= MODI_EPS) {
        throw new Error(
            "La oferta y demanda totales deben ser positivas y finitas."
        );
    }

    return { costos, oferta, demanda };
}

/* =========================================
   BALANCEO
   ========================================= */

function modiBalancear(datos) {
    const costos = datos.costos.map(fila => [...fila]);
    const oferta = [...datos.oferta];
    const demanda = [...datos.demanda];

    const totalO = oferta.reduce((a, b) => a + b, 0);
    const totalD = demanda.reduce((a, b) => a + b, 0);

    let mensaje = "El problema está balanceado.";
    let origenFicticio = false;
    let destinoFicticio = false;

    if (totalO > totalD + MODI_EPS) {
        const sobrante = totalO - totalD;
        demanda.push(sobrante);
        costos.forEach(fila => fila.push(0));
        destinoFicticio = true;

        mensaje =
            "Se agregó un destino ficticio con demanda " +
            modiFmt(sobrante) + ".";
    } else if (totalD > totalO + MODI_EPS) {
        const faltante = totalD - totalO;
        oferta.push(faltante);
        costos.push(Array(demanda.length).fill(0));
        origenFicticio = true;

        mensaje =
            "Se agregó un origen ficticio con oferta " +
            modiFmt(faltante) + ".";
    }

    return {
        costos,
        oferta,
        demanda,
        mensaje,
        origenFicticio,
        destinoFicticio
    };
}

/* =========================================
   ESTRUCTURA DE BASE
   ========================================= */

function modiClave(i, j) {
    return i + "," + j;
}

function modiSeparar(clave) {
    return clave.split(",").map(Number);
}

/*
 * Una base de transporte corresponde a
 * un árbol bipartito con m+n-1 aristas.
 * Union-Find evita ciclos al completarla.
 */

function modiUnionFind(total) {
    const padre = Array.from(
        { length: total }, (_, i) => i
    );

    function buscar(x) {
        while (padre[x] !== x) {
            padre[x] = padre[padre[x]];
            x = padre[x];
        }
        return x;
    }

    function unir(a, b) {
        const ra = buscar(a);
        const rb = buscar(b);

        if (ra === rb) return false;

        padre[ra] = rb;
        return true;
    }

    return { unir };
}

function modiCompletarBase(base, costos, m, n) {
    const uf = modiUnionFind(m + n);
    const nueva = new Set();

    // Conservar las celdas básicas existentes.
    for (const clave of base) {
        const [i, j] = modiSeparar(clave);

        if (!uf.unir(i, m + j)) {
            throw new Error(
                "La base contiene un ciclo inválido."
            );
        }

        nueva.add(clave);
    }

    // Añadir celdas de valor cero sin formar ciclos.
    const candidatas = [];

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (!nueva.has(modiClave(i, j))) {
                candidatas.push({ i, j, costo: costos[i][j] });
            }
        }
    }

    candidatas.sort((a, b) =>
        a.costo - b.costo ||
        a.i - b.i ||
        a.j - b.j
    );

    for (const celda of candidatas) {
        if (nueva.size === m + n - 1) break;

        if (uf.unir(celda.i, m + celda.j)) {
            nueva.add(modiClave(celda.i, celda.j));
        }
    }

    if (nueva.size !== m + n - 1) {
        throw new Error("No se pudo completar la base.");
    }

    return nueva;
}

/* =========================================
   SOLUCIÓN INICIAL - COSTO MÍNIMO
   ========================================= */

function modiInicial(datos) {
    const { costos, oferta, demanda } = datos;
    const m = oferta.length;
    const n = demanda.length;

    const restanteO = [...oferta];
    const restanteD = [...demanda];

    const x = Array.from(
        { length: m }, () => Array(n).fill(0)
    );

    const base = new Set();
    const pasos = [];

    while (restanteD.some(v => v > MODI_EPS)) {
        let mejor = null;

        for (let i = 0; i < m; i++) {
            if (restanteO[i] <= MODI_EPS) continue;

            for (let j = 0; j < n; j++) {
                if (restanteD[j] <= MODI_EPS) continue;

                if (!mejor ||
                    costos[i][j] < mejor.costo - MODI_EPS) {
                    mejor = { i, j, costo: costos[i][j] };
                }
            }
        }

        if (!mejor) {
            throw new Error(
                "No se pudo construir la solución inicial."
            );
        }

        const { i, j } = mejor;
        const cantidad = Math.min(
            restanteO[i], restanteD[j]
        );

        x[i][j] = cantidad;
        base.add(modiClave(i, j));

        restanteO[i] -= cantidad;
        restanteD[j] -= cantidad;

        if (Math.abs(restanteO[i]) < MODI_EPS) {
            restanteO[i] = 0;
        }

        if (Math.abs(restanteD[j]) < MODI_EPS) {
            restanteD[j] = 0;
        }

        pasos.push({
            i, j, cantidad,
            costo: costos[i][j]
        });
    }

    return {
        x,
        base: modiCompletarBase(base, costos, m, n),
        pasos
    };
}

/* =========================================
   POTENCIALES U Y V
   ========================================= */

function modiPotenciales(base, costos, m, n) {
    const u = Array(m).fill(null);
    const v = Array(n).fill(null);

    // Fijamos U1 = 0.
    u[0] = 0;

    let cambios = true;

    while (cambios) {
        cambios = false;

        for (const clave of base) {
            const [i, j] = modiSeparar(clave);

            // En cada celda básica:
            // Ui + Vj = Cij.
            if (u[i] !== null && v[j] === null) {
                v[j] = costos[i][j] - u[i];
                cambios = true;
            } else if (v[j] !== null && u[i] === null) {
                u[i] = costos[i][j] - v[j];
                cambios = true;
            }
        }
    }

    if (u.some(x => x === null) ||
        v.some(x => x === null)) {
        throw new Error(
            "No se pudieron calcular los potenciales."
        );
    }

    return { u, v };
}

/* =========================================
   COSTOS DE OPORTUNIDAD
   ========================================= */

function modiOportunidades(base, costos, u, v) {
    const m = costos.length;
    const n = costos[0].length;

    const delta = Array.from(
        { length: m }, () => Array(n).fill(null)
    );

    let entrante = null;

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (base.has(modiClave(i, j))) continue;

            // Para minimización:
            // Delta = Cij - Ui - Vj.
            const valor = costos[i][j] - u[i] - v[j];

            delta[i][j] = valor;

            if (valor < -MODI_EPS &&
                (!entrante ||
                 valor < entrante.delta - MODI_EPS)) {
                entrante = { i, j, delta: valor };
            }
        }
    }

    return { delta, entrante };
}

/* =========================================
   CICLO CERRADO
   ========================================= */

/*
 * Las celdas básicas forman un árbol.
 * Al introducir una celda no básica
 * aparece un único ciclo.
 *
 * Encontramos el camino entre su fila
 * y su columna en ese árbol.
 */

function modiCiclo(base, entrada, m, n) {
    const total = m + n;

    const vecinos = Array.from(
        { length: total }, () => []
    );

    for (const clave of base) {
        const [i, j] = modiSeparar(clave);

        vecinos[i].push({
            nodo: m + j,
            celda: [i, j]
        });

        vecinos[m + j].push({
            nodo: i,
            celda: [i, j]
        });
    }

    const inicio = entrada.i;
    const final = m + entrada.j;

    const cola = [inicio];
    const visitados = new Set([inicio]);
    const anterior = Array(total).fill(null);

    for (let k = 0; k < cola.length; k++) {
        const actual = cola[k];

        if (actual === final) break;

        for (const vecino of vecinos[actual]) {
            if (visitados.has(vecino.nodo)) continue;

            visitados.add(vecino.nodo);

            anterior[vecino.nodo] = {
                nodo: actual,
                celda: vecino.celda
            };

            cola.push(vecino.nodo);
        }
    }

    if (!visitados.has(final)) {
        throw new Error(
            "No se encontró un ciclo de ajuste."
        );
    }

    const camino = [];
    let actual = final;

    while (actual !== inicio) {
        const paso = anterior[actual];
        camino.push(paso.celda);
        actual = paso.nodo;
    }

    camino.reverse();

    // El ciclo inicia en la celda entrante (+).
    // Después alterna -, +, -, ...
    return [
        [entrada.i, entrada.j],
        ...camino
    ];
}

/* =========================================
   COSTO Y VERIFICACIÓN
   ========================================= */

function modiCosto(x, costos) {
    let total = 0;

    for (let i = 0; i < x.length; i++) {
        for (let j = 0; j < x[i].length; j++) {
            total += x[i][j] * costos[i][j];
        }
    }

    return total;
}

function modiVerificar(x, oferta, demanda) {
    const m = oferta.length;
    const n = demanda.length;

    for (let i = 0; i < m; i++) {
        const suma = x[i].reduce((a, b) => a + b, 0);

        if (Math.abs(suma - oferta[i]) >
            MODI_EPS * Math.max(1, oferta[i])) {
            throw new Error(
                "La solución no satisface la oferta O" + (i + 1)
            );
        }
    }

    for (let j = 0; j < n; j++) {
        let suma = 0;

        for (let i = 0; i < m; i++) {
            suma += x[i][j];

            if (x[i][j] < -MODI_EPS) {
                throw new Error(
                    "Se detectó una asignación negativa."
                );
            }
        }

        if (Math.abs(suma - demanda[j]) >
            MODI_EPS * Math.max(1, demanda[j])) {
            throw new Error(
                "La solución no satisface la demanda D" + (j + 1)
            );
        }
    }
}

/* =========================================
   ALGORITMO MODI
   ========================================= */

function modiOptimizar(datos) {
    const balanceado = modiBalancear(datos);

    const {
        costos, oferta, demanda
    } = balanceado;

    const m = oferta.length;
    const n = demanda.length;

    const inicial = modiInicial(balanceado);

    let x = inicial.x;
    let base = inicial.base;

    modiVerificar(x, oferta, demanda);

    const costoInicial = modiCosto(x, costos);
    const iteraciones = [];

    let estado = "limite";
    const basesVisitadas = new Set();

    for (let numero = 0; numero < MODI_MAX_ITER; numero++) {
        const firma = [...base].sort().join("|");

        if (basesVisitadas.has(firma)) {
            estado = "ciclo";
            break;
        }

        basesVisitadas.add(firma);

        const { u, v } =
            modiPotenciales(base, costos, m, n);

        const { delta, entrante } =
            modiOportunidades(base, costos, u, v);

        const registro = {
            numero: numero + 1,
            costoAntes: modiCosto(x, costos),
            xAntes: x.map(fila => [...fila]),
            baseAntes: [...base],
            u: [...u],
            v: [...v],
            delta,
            entrante,
            ciclo: null,
            theta: null,
            costoDespues: null
        };

        if (!entrante) {
            registro.costoDespues = registro.costoAntes;
            iteraciones.push(registro);
            estado = "optimo";
            break;
        }

        const ciclo = modiCiclo(
            base, entrante, m, n
        );

        /*
         * Posiciones del ciclo:
         * 0 = +
         * 1 = -
         * 2 = +
         * 3 = -
         */

        let theta = Infinity;
        let saliente = null;

        for (let k = 1; k < ciclo.length; k += 2) {
            const [i, j] = ciclo[k];
            const cantidad = x[i][j];

            if (cantidad < theta - MODI_EPS) {
                theta = cantidad;
                saliente = [i, j];
            }
        }

        if (!Number.isFinite(theta) || !saliente) {
            throw new Error(
                "No se pudo determinar el ajuste del ciclo."
            );
        }

        // Aplicar signos alternados.
        for (let k = 0; k < ciclo.length; k++) {
            const [i, j] = ciclo[k];

            x[i][j] +=
                k % 2 === 0 ? theta : -theta;

            if (Math.abs(x[i][j]) < MODI_EPS) {
                x[i][j] = 0;
            }
        }

        base.add(modiClave(entrante.i, entrante.j));
        base.delete(modiClave(saliente[0], saliente[1]));

        modiVerificar(x, oferta, demanda);

        registro.ciclo = ciclo;
        registro.theta = theta;
        registro.saliente = saliente;
        registro.costoDespues = modiCosto(x, costos);

        if (registro.costoDespues >
            registro.costoAntes +
            MODI_EPS * Math.max(1, registro.costoAntes)) {
            throw new Error(
                "El costo aumentó durante la optimización."
            );
        }

        iteraciones.push(registro);
    }

    return {
        ...balanceado,
        x,
        base,
        costoInicial,
        costoFinal: modiCosto(x, costos),
        pasosIniciales: inicial.pasos,
        iteraciones,
        estado
    };
}

/* =========================================
   TABLAS DE RESULTADOS
   ========================================= */

function modiNombreOrigen(i, resultado) {
    return resultado.origenFicticio &&
           i === resultado.oferta.length - 1
        ? "Origen ficticio"
        : "O" + (i + 1);
}

function modiNombreDestino(j, resultado) {
    return resultado.destinoFicticio &&
           j === resultado.demanda.length - 1
        ? "Destino ficticio"
        : "D" + (j + 1);
}

function modiTablaAsignaciones(x, resultado, base = null) {
    let html = `
        <div class="modi-tabla-scroll">
        <table class="modi-tabla">
        <thead><tr><th>Origen / Destino</th>
    `;

    for (let j = 0; j < resultado.demanda.length; j++) {
        html += `<th>${modiNombreDestino(j, resultado)}</th>`;
    }

    html += `<th>Oferta</th></tr></thead><tbody>`;

    for (let i = 0; i < resultado.oferta.length; i++) {
        html += `<tr><th>${modiNombreOrigen(i, resultado)}</th>`;

        for (let j = 0; j < resultado.demanda.length; j++) {
            const valor = x[i][j];
            const basica = base && base.includes(modiClave(i, j));

            html += `
                <td class="${valor > MODI_EPS ? "modi-activa" : ""}">
                    <strong>${modiFmt(valor)}</strong>
                    ${basica && valor <= MODI_EPS
                        ? "<small>Básica de valor 0</small>"
                        : ""}
                    <small>
                        Costo: ${modiFmt(resultado.costos[i][j])}
                    </small>
                </td>
            `;
        }

        html += `<td>${modiFmt(resultado.oferta[i])}</td></tr>`;
    }

    html += `<tr><th>Demanda</th>`;

    resultado.demanda.forEach(d => {
        html += `<td>${modiFmt(d)}</td>`;
    });

    html += `<td>—</td></tr></tbody></table></div>`;

    return html;
}

function modiTablaDelta(iteracion, resultado) {
    let html = `
        <div class="modi-tabla-scroll">
        <table class="modi-tabla">
        <thead><tr><th>Origen / Destino</th>
    `;

    for (let j = 0; j < resultado.demanda.length; j++) {
        html += `<th>${modiNombreDestino(j, resultado)}</th>`;
    }

    html += `</tr></thead><tbody>`;

    for (let i = 0; i < resultado.oferta.length; i++) {
        html += `<tr><th>${modiNombreOrigen(i, resultado)}</th>`;

        for (let j = 0; j < resultado.demanda.length; j++) {
            const valor = iteracion.delta[i][j];

            html += `
                <td class="${valor !== null && valor < -MODI_EPS
                    ? "modi-negativa"
                    : ""}">
                    ${valor === null
                        ? "Básica"
                        : modiFmt(valor)}
                </td>
            `;
        }

        html += "</tr>";
    }

    html += `</tbody></table></div>`;
    return html;
}

/* =========================================
   PRESENTAR RESULTADOS
   ========================================= */

function modiMostrar(resultado) {
    let html = `
        <div class="modi-resumen">
            <div>
                <small>Costo inicial</small>
                <strong>${modiFmt(resultado.costoInicial)}</strong>
            </div>
            <div>
                <small>Costo final</small>
                <strong>${modiFmt(resultado.costoFinal)}</strong>
            </div>
            <div>
                <small>Ahorro</small>
                <strong>
                    ${modiFmt(
                        resultado.costoInicial - resultado.costoFinal
                    )}
                </strong>
            </div>
        </div>

        <div class="modi-info">
            <h3>Balanceo</h3>
            <p>${resultado.mensaje}</p>
        </div>

        <h3>Solución inicial por Costo Mínimo</h3>
        <p class="modi-nota">
            Se asignan primero las rutas con menor costo.
            En caso de degeneración se completan
            las variables básicas con valor cero.
        </p>
    `;

    resultado.pasosIniciales.forEach((paso, k) => {
        html += `
            <p class="modi-paso-inicial">
                <strong>Paso ${k + 1}:</strong>
                ${modiNombreOrigen(paso.i, resultado)}
                →
                ${modiNombreDestino(paso.j, resultado)}.
                Se asignan ${modiFmt(paso.cantidad)}
                unidades a costo ${modiFmt(paso.costo)}
                por unidad.
            </p>
        `;
    });

    html += `<h3>Iteraciones MODI</h3>`;

    resultado.iteraciones.forEach(iter => {
        html += `
            <div class="modi-iteracion">
                <h3>Iteración ${iter.numero}</h3>

                <p>
                    Costo al inicio:
                    <strong>${modiFmt(iter.costoAntes)}</strong>
                </p>

                <h4>Asignaciones actuales</h4>
                ${modiTablaAsignaciones(
                    iter.xAntes,
                    resultado,
                    iter.baseAntes
                )}

                <h4>Potenciales U y V</h4>
                <p>
                    ${iter.u.map(
                        (valor, i) =>
                            "U" + (i + 1) + " = " + modiFmt(valor)
                    ).join(" · ")}
                </p>
                <p>
                    ${iter.v.map(
                        (valor, j) =>
                            "V" + (j + 1) + " = " + modiFmt(valor)
                    ).join(" · ")}
                </p>

                <h4>Costos de oportunidad</h4>
                <p class="modi-nota">
                    Δij = Cij − Ui − Vj.
                    Los valores negativos indican
                    rutas que pueden mejorar el costo.
                </p>

                ${modiTablaDelta(iter, resultado)}
        `;

        if (iter.entrante) {
            const ruta =
                modiNombreOrigen(iter.entrante.i, resultado) +
                " → " +
                modiNombreDestino(iter.entrante.j, resultado);

            const cicloTexto = iter.ciclo.map(
                ([i, j], k) =>
                    (k % 2 === 0 ? "(+) " : "(−) ") +
                    modiNombreOrigen(i, resultado) +
                    "-" +
                    modiNombreDestino(j, resultado)
            ).join(" → ");

            html += `
                <h4>Ruta entrante</h4>
                <p>
                    <strong>${ruta}</strong>,
                    con Δ =
                    ${modiFmt(iter.entrante.delta)}.
                </p>

                <h4>Ciclo de ajuste</h4>
                <p>${cicloTexto}</p>

                <p>
                    Ajuste θ =
                    <strong>${modiFmt(iter.theta)}</strong>
                </p>

                <p>
                    Costo después del ajuste:
                    <strong>${modiFmt(iter.costoDespues)}</strong>
                </p>
            `;
        } else {
            html += `
                <p class="modi-exito">
                    Todos los costos de oportunidad
                    no básicos son mayores o iguales
                    que cero. Se cumple la condición
                    de optimalidad.
                </p>
            `;
        }

        html += `</div>`;
    });

    html += `
        <h3>Distribución final</h3>
        ${modiTablaAsignaciones(
            resultado.x,
            resultado,
            [...resultado.base]
        )}
    `;

    if (resultado.estado === "optimo") {
        html += `
            <div class="modi-exito">
                <h3>Solución óptima verificada</h3>
                <p>
                    El costo mínimo es
                    <strong>${modiFmt(resultado.costoFinal)}</strong>.
                    Se satisfacen todas las ofertas
                    y demandas del modelo balanceado.
                </p>
            </div>
        `;
    } else {
        html += `
            <div class="modi-error">
                No se pudo certificar el óptimo.
                Estado: ${resultado.estado}.
                Revisa las iteraciones antes de
                utilizar este resultado.
            </div>
        `;
    }

    modiEl("modiResultados").innerHTML = html;
    modiEl("modiPanelResultados").classList.remove("oculto");
}

/* =========================================
   RESOLVER
   ========================================= */

function modiResolver() {
    modiOcultarError();
    modiEl("modiPanelResultados").classList.add("oculto");

    try {
        const datos = modiLeer();
        const resultado = modiOptimizar(datos);
        modiMostrar(resultado);
    } catch (e) {
        modiMostrarError(e.message);
    }
}

/* =========================================
   EJEMPLO
   ========================================= */

function modiEjemplo() {
    modiEl("modiOrigenes").value = 3;
    modiEl("modiDestinos").value = 4;

    modiGenerar();

    const costos = [
        [8, 6, 10, 9],
        [9, 12, 13, 7],
        [14, 9, 16, 5]
    ];

    const oferta = [35, 50, 40];
    const demanda = [30, 25, 35, 35];

    costos.forEach((fila, i) => {
        fila.forEach((valor, j) => {
            modiEl("modiC" + i + "_" + j).value = valor;
        });

        modiEl("modiO" + i).value = oferta[i];
    });

    demanda.forEach((valor, j) => {
        modiEl("modiD" + j).value = valor;
    });
}

/* =========================================
   LIMPIAR
   ========================================= */

function modiLimpiar() {
    modiDimensiones = null;

    modiEl("modiOrigenes").value = 3;
    modiEl("modiDestinos").value = 4;

    modiEl("modiFormulario").innerHTML = "";
    modiEl("modiResultados").innerHTML = "";

    modiEl("modiPanelDatos").classList.add("oculto");
    modiEl("modiPanelResultados").classList.add("oculto");

    modiOcultarError();
}
