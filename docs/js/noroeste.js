
/*
 * GREAT VALUE - FASE II
 * Método de la Esquina Noroeste
 * Hasta 20 orígenes y 20 destinos
 */

"use strict";

const EPSILON_N = 1e-8;
const MAX_NOROESTE = 20;

function elementoN(id) {
    return document.getElementById(id);
}

function formatoN(numero) {
    if (Math.abs(numero) < EPSILON_N) return "0";
    return Number(numero.toFixed(6)).toString();
}

function formatearNoroeste(numero) {
    return formatoN(numero);
}

function mostrarErrorNoroeste(mensaje) {
    const elemento = elementoN("mensajeErrorNoroeste");
    elemento.textContent = "⚠ " + mensaje;
    elemento.classList.remove("oculto");
}

function ocultarErrorNoroeste() {
    const elemento = elementoN("mensajeErrorNoroeste");
    elemento.textContent = "";
    elemento.classList.add("oculto");
}

function crearInputN(id, tipo) {
    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.min = "0";
    input.id = id;
    input.className = "input-matriz";
    input.placeholder = "0";
    input.setAttribute("aria-label", tipo);

    input.addEventListener("input", function () {
        input.classList.remove("campo-invalido");
        actualizarBalanceVisual();
        ocultarErrorNoroeste();
    });

    return input;
}

// =====================================================
// GENERAR MATRIZ
// =====================================================

function generarMatrizNoroeste() {
    ocultarErrorNoroeste();

    const origenes = Number(elementoN("numOrigenes").value);
    const destinos = Number(elementoN("numDestinos").value);

    if (
        !Number.isInteger(origenes) ||
        !Number.isInteger(destinos) ||
        origenes < 1 ||
        destinos < 1 ||
        origenes > MAX_NOROESTE ||
        destinos > MAX_NOROESTE
    ) {
        mostrarErrorNoroeste(
            "Ingresa entre 1 y 20 orígenes y destinos."
        );
        return;
    }

    const contenedor = elementoN("matrizEntradaNoroeste");
    contenedor.innerHTML = "";

    const envoltura = document.createElement("div");
    envoltura.className = "tabla-responsive";

    const tabla = document.createElement("table");
    tabla.className = "tabla-simplex tabla-transporte";

    const thead = document.createElement("thead");
    const encabezado = document.createElement("tr");

    ["Origen / Destino"].concat(
        Array.from({ length: destinos }, (_, j) => "D" + (j + 1)),
        ["Oferta"]
    ).forEach(texto => {
        const th = document.createElement("th");
        th.textContent = texto;
        encabezado.appendChild(th);
    });

    thead.appendChild(encabezado);
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (let i = 0; i < origenes; i++) {
        const tr = document.createElement("tr");

        const nombre = document.createElement("th");
        nombre.textContent = "O" + (i + 1);
        tr.appendChild(nombre);

        for (let j = 0; j < destinos; j++) {
            const td = document.createElement("td");

            td.appendChild(
                crearInputN(
                    `n_costo_${i}_${j}`,
                    `Costo del origen ${i + 1} al destino ${j + 1}`
                )
            );

            tr.appendChild(td);
        }

        const oferta = document.createElement("td");
        oferta.appendChild(
            crearInputN(
                `n_oferta_${i}`,
                `Oferta del origen ${i + 1}`
            )
        );

        tr.appendChild(oferta);
        tbody.appendChild(tr);
    }

    const filaDemanda = document.createElement("tr");
    const etiqueta = document.createElement("th");
    etiqueta.textContent = "Demanda";
    filaDemanda.appendChild(etiqueta);

    for (let j = 0; j < destinos; j++) {
        const td = document.createElement("td");
        td.appendChild(
            crearInputN(
                `n_demanda_${j}`,
                `Demanda del destino ${j + 1}`
            )
        );
        filaDemanda.appendChild(td);
    }

    const vacia = document.createElement("td");
    vacia.textContent = "—";
    filaDemanda.appendChild(vacia);

    tbody.appendChild(filaDemanda);
    tabla.appendChild(tbody);
    envoltura.appendChild(tabla);
    contenedor.appendChild(envoltura);

    elementoN("panelMatrizNoroeste")
        .classList.remove("oculto");

    elementoN("panelResultadosNoroeste")
        .classList.add("oculto");

    elementoN("procedimientoNoroeste").innerHTML = "";
    actualizarBalanceVisual();
}

// =====================================================
// LEER DATOS
// =====================================================

function leerNumeroNoroeste(input, descripcion) {
    if (!input || input.value.trim() === "") {
        if (input) input.classList.add("campo-invalido");
        throw new Error(
            "Completa el valor de " + descripcion + "."
        );
    }

    const valor = Number(input.value);

    if (!Number.isFinite(valor) || valor < 0) {
        input.classList.add("campo-invalido");
        throw new Error(
            "El valor de " + descripcion +
            " debe ser un número no negativo."
        );
    }

    input.classList.remove("campo-invalido");
    return valor;
}

function obtenerDatosNoroeste() {
    const origenes = Number(elementoN("numOrigenes").value);
    const destinos = Number(elementoN("numDestinos").value);

    if (
        !Number.isInteger(origenes) ||
        !Number.isInteger(destinos) ||
        origenes < 1 ||
        destinos < 1 ||
        origenes > 20 ||
        destinos > 20
    ) {
        throw new Error("Las dimensiones deben estar entre 1 y 20.");
    }

    const costos = [];

    for (let i = 0; i < origenes; i++) {
        const fila = [];

        for (let j = 0; j < destinos; j++) {
            fila.push(
                leerNumeroNoroeste(
                    elementoN(`n_costo_${i}_${j}`),
                    `costo O${i + 1} → D${j + 1}`
                )
            );
        }

        costos.push(fila);
    }

    const oferta = [];
    const demanda = [];

    for (let i = 0; i < origenes; i++) {
        oferta.push(
            leerNumeroNoroeste(
                elementoN(`n_oferta_${i}`),
                `oferta O${i + 1}`
            )
        );
    }

    for (let j = 0; j < destinos; j++) {
        demanda.push(
            leerNumeroNoroeste(
                elementoN(`n_demanda_${j}`),
                `demanda D${j + 1}`
            )
        );
    }

    const totalOferta = oferta.reduce((a, b) => a + b, 0);
    const totalDemanda = demanda.reduce((a, b) => a + b, 0);

    if (totalOferta <= EPSILON_N || totalDemanda <= EPSILON_N) {
        throw new Error(
            "La oferta y demanda totales deben ser mayores que cero."
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
// ALGORITMO ESQUINA NOROESTE
// =====================================================

function ejecutarNoroeste(datos) {
    const costos = datos.costos.map(fila => [...fila]);
    const oferta = [...datos.oferta];
    const demanda = [...datos.demanda];

    const nombresOrigenes = oferta.map(
        (_, i) => "Origen " + (i + 1)
    );

    const nombresDestinos = demanda.map(
        (_, j) => "Destino " + (j + 1)
    );

    const diferencia = datos.totalOferta - datos.totalDemanda;
    let balanceo = null;

    if (diferencia > EPSILON_N) {
        // Sobra oferta: destino ficticio.
        costos.forEach(fila => fila.push(0));
        demanda.push(diferencia);
        nombresDestinos.push("Destino ficticio");

        balanceo = {
            tipo: "destino",
            cantidad: diferencia
        };
    } else if (diferencia < -EPSILON_N) {
        // Falta oferta: origen ficticio.
        const faltante = -diferencia;
        costos.push(Array(demanda.length).fill(0));
        oferta.push(faltante);
        nombresOrigenes.push("Origen ficticio");

        balanceo = {
            tipo: "origen",
            cantidad: faltante
        };
    }

    const ofertaRestante = [...oferta];
    const demandaRestante = [...demanda];

    const asignaciones = Array.from(
        { length: oferta.length },
        () => Array(demanda.length).fill(0)
    );

    const pasos = [];

    let i = 0;
    let j = 0;

    while (i < oferta.length && j < demanda.length) {
        const ofertaAntes = ofertaRestante[i];
        const demandaAntes = demandaRestante[j];

        const cantidad = Math.min(ofertaAntes, demandaAntes);
        const costoUnitario = costos[i][j];
        const costoPaso = cantidad * costoUnitario;

        asignaciones[i][j] = cantidad;

        ofertaRestante[i] = Math.max(
            0,
            ofertaRestante[i] - cantidad
        );

        demandaRestante[j] = Math.max(
            0,
            demandaRestante[j] - cantidad
        );

        pasos.push({
            numero: pasos.length + 1,
            fila: i,
            columna: j,
            origen: nombresOrigenes[i],
            destino: nombresDestinos[j],
            cantidad,
            costoUnitario,
            costoPaso,
            ofertaAntes,
            demandaAntes,
            ofertaDespues: ofertaRestante[i],
            demandaDespues: demandaRestante[j]
        });

        const ofertaAgotada =
            ofertaRestante[i] <= EPSILON_N;

        const demandaSatisfecha =
            demandaRestante[j] <= EPSILON_N;

        if (ofertaAgotada && demandaSatisfecha) {
            i++;
            j++;
        } else if (ofertaAgotada) {
            i++;
        } else if (demandaSatisfecha) {
            j++;
        } else {
            throw new Error(
                "No se pudo avanzar en las asignaciones."
            );
        }
    }

    let costoTotal = 0;

    for (let fila = 0; fila < oferta.length; fila++) {
        for (let columna = 0; columna < demanda.length; columna++) {
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
// TABLA DE RESULTADOS
// =====================================================

function construirMatrizResultado(resultado) {
    const envoltura = document.createElement("div");
    envoltura.className = "tabla-responsive";

    const tabla = document.createElement("table");
    tabla.className = "tabla-simplex tabla-transporte";

    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");

    ["Origen / Destino", ...resultado.nombresDestinos, "Oferta"]
        .forEach(texto => {
            const th = document.createElement("th");
            th.textContent = texto;
            trHead.appendChild(th);
        });

    thead.appendChild(trHead);
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");

    resultado.oferta.forEach((oferta, i) => {
        const tr = document.createElement("tr");

        const nombre = document.createElement("th");
        nombre.textContent = resultado.nombresOrigenes[i];
        tr.appendChild(nombre);

        resultado.demanda.forEach((_, j) => {
            const td = document.createElement("td");
            const asignado = resultado.asignaciones[i][j];
            const costo = resultado.costos[i][j];

            if (asignado > EPSILON_N) {
                td.classList.add("noroeste-celda-asignada");
            }

            const cantidad = document.createElement("strong");
            cantidad.textContent = formatoN(asignado);

            const detalle = document.createElement("small");
            detalle.textContent = "Costo: " + formatoN(costo);

            td.appendChild(cantidad);
            td.appendChild(document.createElement("br"));
            td.appendChild(detalle);
            tr.appendChild(td);
        });

        const total = document.createElement("td");
        total.textContent = formatoN(oferta);
        tr.appendChild(total);
        tbody.appendChild(tr);
    });

    const filaDemanda = document.createElement("tr");
    const etiqueta = document.createElement("th");
    etiqueta.textContent = "Demanda";
    filaDemanda.appendChild(etiqueta);

    resultado.demanda.forEach(valor => {
        const td = document.createElement("td");
        td.textContent = formatoN(valor);
        filaDemanda.appendChild(td);
    });

    const vacia = document.createElement("td");
    vacia.textContent = "—";
    filaDemanda.appendChild(vacia);

    tbody.appendChild(filaDemanda);
    tabla.appendChild(tbody);
    envoltura.appendChild(tabla);

    return envoltura;
}

// =====================================================
// MOSTRAR PROCEDIMIENTO Y COSTO
// =====================================================

function mostrarResultadoNoroeste(datos, resultado) {
    const contenedor = elementoN("procedimientoNoroeste");
    contenedor.innerHTML = "";

    const balance = document.createElement("div");
    balance.className = resultado.balanceo
        ? "balance-ajustado"
        : "balance-correcto";

    const tituloBalance = document.createElement("h4");
    tituloBalance.textContent = resultado.balanceo
        ? "Problema balanceado automáticamente"
        : "Problema balanceado";

    balance.appendChild(tituloBalance);

    const detalleBalance = document.createElement("p");

    if (resultado.balanceo) {
        detalleBalance.textContent =
            "Se agregó un " +
            resultado.balanceo.tipo +
            " ficticio con cantidad " +
            formatoN(resultado.balanceo.cantidad) +
            " y costo unitario cero.";
    } else {
        detalleBalance.textContent =
            "Oferta total: " + formatoN(datos.totalOferta) +
            " | Demanda total: " + formatoN(datos.totalDemanda);
    }

    balance.appendChild(detalleBalance);
    contenedor.appendChild(balance);

    const tituloPasos = document.createElement("h3");
    tituloPasos.textContent = "Asignaciones paso a paso";
    contenedor.appendChild(tituloPasos);

    resultado.pasos.forEach(paso => {
        const bloque = document.createElement("div");
        bloque.className = "noroeste-paso";

        const titulo = document.createElement("h4");
        titulo.textContent =
            "Paso " + paso.numero + ": " +
            paso.origen + " → " + paso.destino;

        const detalle = document.createElement("p");
        detalle.textContent =
            "Asignación: " + formatoN(paso.cantidad) +
            " | Costo unitario: " +
            formatoN(paso.costoUnitario) +
            " | Costo parcial: " +
            formatoN(paso.costoPaso);

        const restantes = document.createElement("p");
        restantes.textContent =
            "Oferta restante: " +
            formatoN(paso.ofertaDespues) +
            " | Demanda restante: " +
            formatoN(paso.demandaDespues);

        bloque.appendChild(titulo);
        bloque.appendChild(detalle);
        bloque.appendChild(restantes);
        contenedor.appendChild(bloque);
    });

    const tituloMatriz = document.createElement("h3");
    tituloMatriz.textContent = "Matriz de asignaciones";
    contenedor.appendChild(tituloMatriz);

    contenedor.appendChild(
        construirMatrizResultado(resultado)
    );

    const final = document.createElement("div");
    final.className = "resultado-final";

    const tituloFinal = document.createElement("h3");
    tituloFinal.textContent = "Costo total de transporte";

    const costoFinal = document.createElement("strong");
    costoFinal.textContent = formatoN(resultado.costoTotal);

    const nota = document.createElement("p");
    nota.textContent =
        "Este resultado es una solución inicial factible. " +
        "El Método de la Esquina Noroeste no garantiza " +
        "el costo mínimo.";

    final.appendChild(tituloFinal);
    final.appendChild(costoFinal);
    final.appendChild(nota);
    contenedor.appendChild(final);

    elementoN("panelResultadosNoroeste")
        .classList.remove("oculto");
}

// =====================================================
// RESOLVER
// =====================================================

function resolverNoroeste() {
    ocultarErrorNoroeste();

    try {
        const datos = obtenerDatosNoroeste();
        const resultado = ejecutarNoroeste(datos);

        mostrarResultadoNoroeste(datos, resultado);
    } catch (error) {
        elementoN("panelResultadosNoroeste")
            .classList.add("oculto");

        mostrarErrorNoroeste(error.message);
    }
}

// =====================================================
// BALANCE VISUAL
// =====================================================

function actualizarBalanceVisual() {
    const contenedor = elementoN("resumenBalance");
    if (!contenedor) return;

    const origenes = Number(elementoN("numOrigenes").value);
    const destinos = Number(elementoN("numDestinos").value);

    let totalOferta = 0;
    let totalDemanda = 0;
    let completo = true;

    for (let i = 0; i < origenes; i++) {
        const input = elementoN(`n_oferta_${i}`);

        if (!input || input.value.trim() === "") {
            completo = false;
            continue;
        }

        const valor = Number(input.value);

        if (!Number.isFinite(valor) || valor < 0) {
            completo = false;
        } else {
            totalOferta += valor;
        }
    }

    for (let j = 0; j < destinos; j++) {
        const input = elementoN(`n_demanda_${j}`);

        if (!input || input.value.trim() === "") {
            completo = false;
            continue;
        }

        const valor = Number(input.value);

        if (!Number.isFinite(valor) || valor < 0) {
            completo = false;
        } else {
            totalDemanda += valor;
        }
    }

    if (!completo) {
        contenedor.textContent =
            "Ingresa todas las ofertas y demandas " +
            "para comprobar el balance.";
        return;
    }

    const diferencia = totalOferta - totalDemanda;

    contenedor.textContent =
        "Oferta total: " + formatoN(totalOferta) +
        " | Demanda total: " + formatoN(totalDemanda) +
        (Math.abs(diferencia) <= EPSILON_N
            ? " | Problema balanceado."
            : " | Se agregará un origen o destino ficticio.");
}

// =====================================================
// EJEMPLO GREAT VALUE
// =====================================================

function cargarEjemploNoroeste() {
    elementoN("numOrigenes").value = 3;
    elementoN("numDestinos").value = 4;

    generarMatrizNoroeste();

    const costos = [
        [8, 6, 10, 9],
        [9, 12, 13, 7],
        [14, 9, 16, 5]
    ];

    const oferta = [35, 50, 40];
    const demanda = [30, 25, 35, 35];

    costos.forEach((fila, i) => {
        fila.forEach((valor, j) => {
            elementoN(`n_costo_${i}_${j}`).value = valor;
        });
    });

    oferta.forEach((valor, i) => {
        elementoN(`n_oferta_${i}`).value = valor;
    });

    demanda.forEach((valor, j) => {
        elementoN(`n_demanda_${j}`).value = valor;
    });

    actualizarBalanceVisual();
}

// =====================================================
// LIMPIAR
// =====================================================

function limpiarNoroeste() {
    document.querySelectorAll(
        "#panelMatrizNoroeste .input-matriz"
    ).forEach(input => {
        input.value = "";
        input.classList.remove("campo-invalido");
    });

    elementoN("procedimientoNoroeste").innerHTML = "";

    elementoN("panelResultadosNoroeste")
        .classList.add("oculto");

    ocultarErrorNoroeste();
    actualizarBalanceVisual();
}
