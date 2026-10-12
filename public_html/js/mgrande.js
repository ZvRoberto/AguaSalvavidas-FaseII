
/*
 * GREAT VALUE - FASE II
 * Método M Grande
 * Hasta 20 variables y 20 restricciones
 */

"use strict";

const M_GRANDE = 1000000;
const EPSILON_M = 1e-8;
const MAX_ITERACIONES_M = 1000;

// =====================================================
// GENERAR MODELO
// =====================================================

function generarModeloMGrande() {
    const n = Number(
        document.getElementById("numVariablesM").value
    );

    const m = Number(
        document.getElementById("numRestriccionesM").value
    );

    if (!Number.isInteger(n) || n < 1 || n > 20) {
        mostrarErrorM("Debes ingresar entre 1 y 20 variables.");
        return;
    }

    if (!Number.isInteger(m) || m < 1 || m > 20) {
        mostrarErrorM("Debes ingresar entre 1 y 20 restricciones.");
        return;
    }

    generarFuncionObjetivoM(n);
    generarRestriccionesM(n, m);

    document.getElementById("panelModeloM")
        .classList.remove("oculto");

    document.getElementById("panelResultadosM")
        .classList.add("oculto");

    ocultarErrorM();
}

// =====================================================
// CREAR ENTRADAS
// =====================================================

function crearInputM(id) {
    const input = document.createElement("input");

    input.type = "number";
    input.step = "any";
    input.id = id;
    input.placeholder = "0";
    input.className = "input-coeficiente";

    input.addEventListener("input", function () {
        this.classList.remove("campo-invalido");
        ocultarErrorM();
    });

    return input;
}

// =====================================================
// FUNCIÓN OBJETIVO
// =====================================================

function generarFuncionObjetivoM(n) {
    const contenedor = document.getElementById("funcionObjetivoM");
    contenedor.innerHTML = "";

    const titulo = document.createElement("strong");
    titulo.textContent = "Z = ";
    contenedor.appendChild(titulo);

    for (let j = 0; j < n; j++) {
        contenedor.appendChild(crearInputM("m_fo_" + j));

        const variable = document.createElement("span");
        variable.textContent = " X" + (j + 1);
        contenedor.appendChild(variable);

        if (j < n - 1) {
            const mas = document.createElement("span");
            mas.textContent = " + ";
            contenedor.appendChild(mas);
        }
    }
}

// =====================================================
// RESTRICCIONES
// =====================================================

function generarRestriccionesM(n, m) {
    const contenedor = document.getElementById("restriccionesM");
    contenedor.innerHTML = "";

    for (let i = 0; i < m; i++) {
        const fila = document.createElement("div");
        fila.className = "fila-restriccion";

        for (let j = 0; j < n; j++) {
            fila.appendChild(
                crearInputM("m_r_" + i + "_" + j)
            );

            const variable = document.createElement("span");
            variable.textContent = " X" + (j + 1);
            fila.appendChild(variable);

            if (j < n - 1) {
                const mas = document.createElement("span");
                mas.textContent = " + ";
                fila.appendChild(mas);
            }
        }

        const signo = document.createElement("select");
        signo.id = "m_signo_" + i;
        signo.className = "select-signo";

        [
            ["<=", "≤"],
            [">=", "≥"],
            ["=", "="]
        ].forEach(([valor, texto]) => {
            const opcion = document.createElement("option");
            opcion.value = valor;
            opcion.textContent = texto;
            signo.appendChild(opcion);
        });

        fila.appendChild(signo);

        const rhs = crearInputM("m_rhs_" + i);
        rhs.classList.add("rhs");
        fila.appendChild(rhs);

        contenedor.appendChild(fila);
    }
}

// =====================================================
// VALIDACIÓN DE NÚMEROS
// =====================================================

function leerNumeroM(input) {
    if (!input || input.value.trim() === "") {
        if (input) input.classList.add("campo-invalido");
        throw new Error("Completa todos los coeficientes del modelo.");
    }

    const valor = Number(input.value);

    if (!Number.isFinite(valor)) {
        input.classList.add("campo-invalido");
        throw new Error("Los coeficientes deben ser números válidos.");
    }

    input.classList.remove("campo-invalido");
    return valor;
}

// =====================================================
// OBTENER DATOS
// =====================================================

function obtenerDatosMGrande() {
    const n = Number(
        document.getElementById("numVariablesM").value
    );

    const m = Number(
        document.getElementById("numRestriccionesM").value
    );

    const tipo = document.getElementById("tipoOptimizacionM").value;

    if (
        !Number.isInteger(n) || n < 1 || n > 20 ||
        !Number.isInteger(m) || m < 1 || m > 20
    ) {
        throw new Error(
            "El modelo debe contener entre 1 y 20 variables y restricciones."
        );
    }

    if (tipo !== "max" && tipo !== "min") {
        throw new Error("Selecciona Maximizar o Minimizar.");
    }

    const objetivo = [];

    for (let j = 0; j < n; j++) {
        objetivo.push(
            leerNumeroM(
                document.getElementById("m_fo_" + j)
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

        let signo = document.getElementById(
            "m_signo_" + i
        ).value;

        let rhs = leerNumeroM(
            document.getElementById("m_rhs_" + i)
        );

        if (rhs < 0) {
            rhs = -rhs;

            for (let j = 0; j < n; j++) {
                coeficientes[j] = -coeficientes[j];
            }

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
// ALGORITMO
// =====================================================

/*
 * El algoritmo simbólico de M Grande se implementa
 * en mgrande-corrector.js, que se carga después
 * de este archivo.
 *
 * Este controlador evita mostrar una solución
 * incorrecta si dicho corrector no está cargado.
 */

function ejecutarMGrande(datos) {
    throw new Error(
        "No se ha cargado el algoritmo de M Grande. " +
        "Comprueba el archivo mgrande-corrector.js."
    );
}

// =====================================================
// FORMATO DE NÚMEROS
// =====================================================

function formatearM(valor) {
    if (typeof valor === "number") {
        if (!Number.isFinite(valor)) return String(valor);
        if (Math.abs(valor) < EPSILON_M) return "0";
        return Number(valor.toFixed(6)).toString();
    }

    if (valor && typeof valor === "object") {
        const m = Number(valor.m || 0);
        const c = Number(valor.c || 0);

        const partes = [];

        if (Math.abs(m) > EPSILON_M) {
            partes.push(formatearM(m) + "M");
        }

        if (Math.abs(c) > EPSILON_M || partes.length === 0) {
            partes.push(
                (c >= 0 && partes.length ? "+ " : "") +
                formatearM(c)
            );
        }

        return partes.join(" ");
    }

    return String(valor);
}

// =====================================================
// TABLAS
// =====================================================

function copiarTablaM(tabla) {
    return tabla.map(fila =>
        fila.map(valor =>
            valor && typeof valor === "object"
                ? { ...valor }
                : valor
        )
    );
}

function construirTablaM(iteracion, nombres) {
    const contenedor = document.createElement("div");
    contenedor.className = "tabla-responsive";

    const tablaHTML = document.createElement("table");
    tablaHTML.className = "tabla-simplex";

    const encabezado = document.createElement("thead");
    const filaEncabezado = document.createElement("tr");

    ["Base", ...nombres].forEach(nombre => {
        const th = document.createElement("th");
        th.textContent = nombre;
        filaEncabezado.appendChild(th);
    });

    encabezado.appendChild(filaEncabezado);
    tablaHTML.appendChild(encabezado);

    const cuerpo = document.createElement("tbody");
    const filas = iteracion.tabla || [];

    filas.forEach((fila, i) => {
        const tr = document.createElement("tr");
        const celdaBase = document.createElement("td");

        celdaBase.textContent =
            i < iteracion.base.length
                ? iteracion.base[i]
                : "Z";

        tr.appendChild(celdaBase);

        fila.forEach(valor => {
            const td = document.createElement("td");
            td.textContent = formatearM(valor);
            tr.appendChild(td);
        });

        cuerpo.appendChild(tr);
    });

    tablaHTML.appendChild(cuerpo);
    contenedor.appendChild(tablaHTML);

    return contenedor;
}

// =====================================================
// MOSTRAR RESULTADOS
// =====================================================

function mostrarMGrande(datos, resultado) {
    const contenedor = document.getElementById(
        "procedimientoMGrande"
    );

    contenedor.innerHTML = "";

    const resumen = document.createElement("div");
    resumen.className = "resumen-problema";

    const titulo = document.createElement("h4");
    titulo.textContent = "Preparación del modelo";
    resumen.appendChild(titulo);

    const descripcion = document.createElement("p");
    descripcion.textContent =
        "Objetivo: " +
        (datos.tipo === "max" ? "Maximizar" : "Minimizar") +
        " | Variables: " + datos.n +
        " | Restricciones: " + datos.m;

    resumen.appendChild(descripcion);
    contenedor.appendChild(resumen);

    if (Array.isArray(resultado.iteraciones)) {
        resultado.iteraciones.forEach((iteracion, indice) => {
            const bloque = document.createElement("div");
            bloque.className = "iteracion-simplex";

            const encabezado = document.createElement("h4");
            encabezado.textContent =
                indice === 0
                    ? "Tabla inicial"
                    : "Iteración " + indice;

            bloque.appendChild(encabezado);

            if (iteracion.entrante) {
                const detalle = document.createElement("p");
                detalle.className = "texto-iteracion";

                detalle.textContent =
                    "Variable entrante: " + iteracion.entrante +
                    " | Variable saliente: " +
                    (iteracion.saliente || "Ninguna");

                bloque.appendChild(detalle);
            }

            bloque.appendChild(
                construirTablaM(iteracion, resultado.nombres)
            );

            contenedor.appendChild(bloque);
        });
    }

    mostrarResultadoM(contenedor, datos, resultado);

    document.getElementById("panelResultadosM")
        .classList.remove("oculto");
}

function mostrarResultadoM(contenedor, datos, resultado) {
    const bloque = document.createElement("div");

    if (resultado.estado !== "optimo") {
        bloque.className = "resultado-error";

        const titulo = document.createElement("h3");

        const mensajes = {
            no_factible: "El problema no tiene solución factible",
            no_acotado: "El problema no está acotado",
            limite_iteraciones: "Se alcanzó el límite de iteraciones"
        };

        titulo.textContent =
            mensajes[resultado.estado] ||
            "No se pudo determinar una solución óptima";

        bloque.appendChild(titulo);
        contenedor.appendChild(bloque);
        return;
    }

    bloque.className = "resultado-final";

    const titulo = document.createElement("h3");
    titulo.textContent = "Solución óptima encontrada";
    bloque.appendChild(titulo);

    const variables = document.createElement("div");
    variables.className = "variables-resultado";

    resultado.variables.forEach((valor, indice) => {
        const elemento = document.createElement("div");
        elemento.className = "resultado-variable";

        const nombre = document.createElement("span");
        nombre.textContent = "X" + (indice + 1);

        const numero = document.createElement("strong");
        numero.textContent = formatearM(valor);

        elemento.appendChild(nombre);
        elemento.appendChild(numero);
        variables.appendChild(elemento);
    });

    const z = document.createElement("div");
    z.className = "resultado-variable destacado";

    const etiqueta = document.createElement("span");
    etiqueta.textContent = "Valor óptimo de Z";

    const valor = document.createElement("strong");
    valor.textContent = formatearM(resultado.valorZ);

    z.appendChild(etiqueta);
    z.appendChild(valor);
    variables.appendChild(z);

    bloque.appendChild(variables);
    contenedor.appendChild(bloque);
}

// =====================================================
// RESOLVER
// =====================================================

function resolverMGrande() {
    ocultarErrorM();

    try {
        const datos = obtenerDatosMGrande();
        const resultado = ejecutarMGrande(datos);

        mostrarMGrande(datos, resultado);
    } catch (error) {
        document.getElementById("panelResultadosM")
            .classList.add("oculto");

        mostrarErrorM(error.message);
    }
}

// =====================================================
// EJEMPLO
// =====================================================

function cargarEjemploMGrande() {
    document.getElementById("tipoOptimizacionM").value = "min";
    document.getElementById("numVariablesM").value = 2;
    document.getElementById("numRestriccionesM").value = 2;

    generarModeloMGrande();

    const valores = {
        m_fo_0: 3,
        m_fo_1: 2,
        m_r_0_0: 1,
        m_r_0_1: 1,
        m_rhs_0: 4,
        m_r_1_0: 2,
        m_r_1_1: 1,
        m_rhs_1: 5
    };

    Object.entries(valores).forEach(([id, valor]) => {
        document.getElementById(id).value = valor;
    });

    document.getElementById("m_signo_0").value = ">=";
    document.getElementById("m_signo_1").value = ">=";
}

// =====================================================
// LIMPIAR
// =====================================================

function limpiarMGrande() {
    document.querySelectorAll(
        "#panelModeloM input"
    ).forEach(input => {
        input.value = "";
        input.classList.remove("campo-invalido");
    });

    document.getElementById("panelResultadosM")
        .classList.add("oculto");

    document.getElementById("procedimientoMGrande")
        .innerHTML = "";

    ocultarErrorM();
}

// =====================================================
// MENSAJES
// =====================================================

function mostrarErrorM(mensaje) {
    const elemento = document.getElementById("mensajeErrorM");

    elemento.textContent = "⚠ " + mensaje;
    elemento.classList.remove("oculto");
}

function ocultarErrorM() {
    const elemento = document.getElementById("mensajeErrorM");

    elemento.textContent = "";
    elemento.classList.add("oculto");
}
