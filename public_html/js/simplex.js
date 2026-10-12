
/*
 * GREAT VALUE - FASE II
 * Método Simplex
 * Máximo: 20 variables y 20 restricciones
 */

"use strict";

const EPSILON = 1e-9;
const MAX_ITERACIONES = 1000;
const MAX_VARIABLES = 20;
const MAX_RESTRICCIONES = 20;

// =====================================================
// CONFIGURACIÓN DEL MODELO
// =====================================================

function generarModeloSimplex() {
    const n = Number(document.getElementById("numVariables").value);
    const m = Number(document.getElementById("numRestricciones").value);

    if (!Number.isInteger(n) || n < 1 || n > MAX_VARIABLES) {
        mostrarErrorSimplex("Ingresa entre 1 y 20 variables.");
        return;
    }

    if (!Number.isInteger(m) || m < 1 || m > MAX_RESTRICCIONES) {
        mostrarErrorSimplex("Ingresa entre 1 y 20 restricciones.");
        return;
    }

    ocultarErrorSimplex();
    generarFuncionObjetivo(n);
    generarRestricciones(n, m);

    document.getElementById("panelModelo").classList.remove("oculto");
    document.getElementById("panelResultados").classList.add("oculto");
    document.getElementById("procedimientoSimplex").innerHTML = "";
}

function crearInputNumero(id) {
    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.id = id;
    input.className = "input-coeficiente";
    input.placeholder = "0";

    input.addEventListener("input", () => {
        input.classList.remove("campo-invalido");
        ocultarErrorSimplex();
    });

    return input;
}

function generarFuncionObjetivo(n) {
    const contenedor = document.getElementById("funcionObjetivo");
    contenedor.innerHTML = "";

    const etiqueta = document.createElement("strong");
    etiqueta.textContent = "Z = ";
    contenedor.appendChild(etiqueta);

    for (let j = 0; j < n; j++) {
        contenedor.appendChild(crearInputNumero("fo_" + j));

        const variable = document.createElement("span");
        variable.textContent = " X" + (j + 1);
        contenedor.appendChild(variable);

        if (j < n - 1) {
            const signo = document.createElement("span");
            signo.textContent = " + ";
            contenedor.appendChild(signo);
        }
    }
}

function generarRestricciones(n, m) {
    const contenedor = document.getElementById("restricciones");
    contenedor.innerHTML = "";

    for (let i = 0; i < m; i++) {
        const fila = document.createElement("div");
        fila.className = "fila-restriccion";

        for (let j = 0; j < n; j++) {
            fila.appendChild(crearInputNumero("r_" + i + "_" + j));

            const variable = document.createElement("span");
            variable.textContent = " X" + (j + 1);
            fila.appendChild(variable);

            if (j < n - 1) {
                const signo = document.createElement("span");
                signo.textContent = " + ";
                fila.appendChild(signo);
            }
        }

        const desigualdad = document.createElement("span");
        desigualdad.textContent = " ≤ ";
        fila.appendChild(desigualdad);

        const rhs = crearInputNumero("rhs_" + i);
        rhs.classList.add("rhs");
        fila.appendChild(rhs);

        contenedor.appendChild(fila);
    }
}

// =====================================================
// VALIDACIÓN Y LECTURA
// =====================================================

function convertirNumero(input) {
    if (!input || input.value.trim() === "") {
        if (input) input.classList.add("campo-invalido");
        return null;
    }

    const numero = Number(input.value);

    if (!Number.isFinite(numero)) {
        input.classList.add("campo-invalido");
        return null;
    }

    input.classList.remove("campo-invalido");
    return numero;
}

function obtenerDatosSimplex() {
    const n = Number(document.getElementById("numVariables").value);
    const m = Number(document.getElementById("numRestricciones").value);
    const tipo = document.getElementById("tipoOptimizacion").value;

    if (!Number.isInteger(n) || n < 1 || n > 20 ||
        !Number.isInteger(m) || m < 1 || m > 20) {
        throw new Error("El modelo debe tener entre 1 y 20 variables y restricciones.");
    }

    if (tipo !== "max" && tipo !== "min") {
        throw new Error("Tipo de optimización no válido.");
    }

    const objetivo = [];
    const restricciones = [];
    const rhs = [];

    for (let j = 0; j < n; j++) {
        const valor = convertirNumero(
            document.getElementById("fo_" + j)
        );

        if (valor === null) {
            throw new Error("Completa todos los coeficientes de la función objetivo.");
        }

        objetivo.push(valor);
    }

    for (let i = 0; i < m; i++) {
        const fila = [];

        for (let j = 0; j < n; j++) {
            const valor = convertirNumero(
                document.getElementById("r_" + i + "_" + j)
            );

            if (valor === null) {
                throw new Error("Completa todos los coeficientes de las restricciones.");
            }

            fila.push(valor);
        }

        const limite = convertirNumero(
            document.getElementById("rhs_" + i)
        );

        if (limite === null) {
            throw new Error("Completa el lado derecho de todas las restricciones.");
        }

        if (limite < 0) {
            throw new Error(
                "Simplex requiere lados derechos no negativos. " +
                "Para restricciones generales utiliza M Grande."
            );
        }

        restricciones.push(fila);
        rhs.push(limite);
    }

    return {
        numVariables: n,
        numRestricciones: m,
        tipo,
        objetivo,
        restricciones,
        rhs
    };
}

// =====================================================
// ALGORITMO SIMPLEX
// =====================================================

function ejecutarSimplex(datos) {
    const n = datos.numVariables;
    const m = datos.numRestricciones;
    const total = n + m + 1;
    const ultima = total - 1;

    const tabla = Array.from(
        { length: m + 1 },
        () => Array(total).fill(0)
    );

    const nombresColumnas = [];

    for (let j = 0; j < n; j++) {
        nombresColumnas.push("X" + (j + 1));
    }

    for (let i = 0; i < m; i++) {
        nombresColumnas.push("S" + (i + 1));
    }

    nombresColumnas.push("RHS");

    const base = [];

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            tabla[i][j] = datos.restricciones[i][j];
        }

        tabla[i][n + i] = 1;
        tabla[i][ultima] = datos.rhs[i];
        base.push("S" + (i + 1));
    }

    const factor = datos.tipo === "max" ? 1 : -1;

    for (let j = 0; j < n; j++) {
        tabla[m][j] = -factor * datos.objetivo[j];
    }

    const iteraciones = [{
        numero: 0,
        tabla: copiarTabla(tabla),
        base: [...base],
        entrante: null,
        saliente: null,
        pivote: null,
        filaPivote: null,
        columnaPivote: null
    }];

    let estado = "optimo";
    let contador = 0;

    while (contador < MAX_ITERACIONES) {
        let columnaPivote = -1;
        let menor = -EPSILON;

        // Seleccionar columna entrante.
        for (let j = 0; j < ultima; j++) {
            if (tabla[m][j] < menor) {
                menor = tabla[m][j];
                columnaPivote = j;
            }
        }

        if (columnaPivote === -1) {
            estado = "optimo";
            break;
        }

        let filaPivote = -1;
        let menorRazon = Infinity;

        // Prueba de la razón mínima.
        for (let i = 0; i < m; i++) {
            const coeficiente = tabla[i][columnaPivote];

            if (coeficiente > EPSILON) {
                const razon = tabla[i][ultima] / coeficiente;

                if (razon < menorRazon - EPSILON) {
                    menorRazon = razon;
                    filaPivote = i;
                }
            }
        }

        if (filaPivote === -1) {
            estado = "no_acotado";
            break;
        }

        const entrante = nombresColumnas[columnaPivote];
        const saliente = base[filaPivote];
        const pivote = tabla[filaPivote][columnaPivote];

        // Normalizar la fila pivote.
        for (let j = 0; j < total; j++) {
            tabla[filaPivote][j] /= pivote;
        }

        // Convertir los demás elementos de la columna en cero.
        for (let i = 0; i <= m; i++) {
            if (i === filaPivote) continue;

            const multiplicador = tabla[i][columnaPivote];

            for (let j = 0; j < total; j++) {
                tabla[i][j] -= multiplicador * tabla[filaPivote][j];

                if (Math.abs(tabla[i][j]) < EPSILON) {
                    tabla[i][j] = 0;
                }
            }
        }

        base[filaPivote] = entrante;
        contador++;

        iteraciones.push({
            numero: contador,
            tabla: copiarTabla(tabla),
            base: [...base],
            entrante,
            saliente,
            pivote,
            filaPivote,
            columnaPivote
        });
    }

    if (contador >= MAX_ITERACIONES && estado === "optimo") {
        const hayNegativos = tabla[m]
            .slice(0, ultima)
            .some(valor => valor < -EPSILON);

        if (hayNegativos) {
            estado = "limite_iteraciones";
        }
    }

    const solucion = obtenerSolucion(tabla, base, datos);

    return {
        estado,
        iteraciones,
        nombresColumnas,
        solucion,
        tablaFinal: copiarTabla(tabla),
        baseFinal: [...base]
    };
}

function obtenerSolucion(tabla, base, datos) {
    const n = datos.numVariables;
    const m = datos.numRestricciones;
    const ultima = n + m;
    const variables = Array(n).fill(0);

    for (let i = 0; i < m; i++) {
        const nombre = base[i];

        if (nombre.startsWith("X")) {
            const indice = Number(nombre.substring(1)) - 1;

            if (indice >= 0 && indice < n) {
                variables[indice] = tabla[i][ultima];
            }
        }
    }

    let valorObjetivo = tabla[m][ultima];

    if (datos.tipo === "min") {
        valorObjetivo = -valorObjetivo;
    }

    return { variables, valorObjetivo };
}

function copiarTabla(tabla) {
    return tabla.map(fila => [...fila]);
}

// =====================================================
// PRESENTACIÓN DE RESULTADOS
// =====================================================

function mostrarProcedimiento(datos, resultado) {
    const contenedor = document.getElementById("procedimientoSimplex");
    contenedor.innerHTML = "";

    const resumen = document.createElement("div");
    resumen.className = "resumen-problema";

    resumen.innerHTML = `
        <h4>Modelo ingresado</h4>
        <p><strong>Objetivo:</strong>
        ${datos.tipo === "max" ? "Maximizar" : "Minimizar"}</p>
        <p><strong>Variables:</strong> ${datos.numVariables}</p>
        <p><strong>Restricciones:</strong> ${datos.numRestricciones}</p>
    `;

    contenedor.appendChild(resumen);

    resultado.iteraciones.forEach(iteracion => {
        const bloque = document.createElement("div");
        bloque.className = "iteracion-simplex";

        const titulo = document.createElement("h4");
        titulo.textContent = iteracion.numero === 0
            ? "Tabla inicial"
            : "Iteración " + iteracion.numero;

        bloque.appendChild(titulo);

        if (iteracion.entrante !== null) {
            const descripcion = document.createElement("p");
            descripcion.className = "texto-iteracion";

            descripcion.textContent =
                "Variable entrante: " + iteracion.entrante +
                " | Variable saliente: " + iteracion.saliente +
                " | Pivote: " + formatearNumero(iteracion.pivote);

            bloque.appendChild(descripcion);
        }

        bloque.appendChild(
            construirTablaHTML(iteracion, resultado.nombresColumnas)
        );

        contenedor.appendChild(bloque);
    });

    mostrarResultadoFinal(contenedor, datos, resultado);

    document.getElementById("panelResultados").classList.remove("oculto");
}

function construirTablaHTML(iteracion, nombresColumnas) {
    const contenedor = document.createElement("div");
    contenedor.className = "tabla-responsive";

    const tabla = document.createElement("table");
    tabla.className = "tabla-simplex";

    const thead = document.createElement("thead");
    const encabezado = document.createElement("tr");

    const thBase = document.createElement("th");
    thBase.textContent = "Base";
    encabezado.appendChild(thBase);

    nombresColumnas.forEach(nombre => {
        const th = document.createElement("th");
        th.textContent = nombre;
        encabezado.appendChild(th);
    });

    thead.appendChild(encabezado);
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");

    iteracion.tabla.forEach((fila, i) => {
        const tr = document.createElement("tr");

        if (i === iteracion.base.length) {
            tr.classList.add("fila-z");
        }

        if (i === iteracion.filaPivote) {
            tr.classList.add("simplex-fila-saliente");
        }

        const tdBase = document.createElement("td");
        tdBase.textContent = i < iteracion.base.length
            ? iteracion.base[i]
            : "Z";

        tr.appendChild(tdBase);

        fila.forEach((valor, j) => {
            const td = document.createElement("td");
            td.textContent = formatearNumero(valor);

            if (j === iteracion.columnaPivote) {
                td.classList.add("simplex-columna-entrante");
            }

            if (i === iteracion.filaPivote &&
                j === iteracion.columnaPivote) {
                td.classList.add("simplex-celda-pivote");
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    tabla.appendChild(tbody);
    contenedor.appendChild(tabla);

    return contenedor;
}

function mostrarResultadoFinal(contenedor, datos, resultado) {
    const bloque = document.createElement("div");

    if (resultado.estado !== "optimo") {
        bloque.className = "resultado-error";

        if (resultado.estado === "no_acotado") {
            bloque.innerHTML = `
                <h3>Problema no acotado</h3>
                <p>No existe una solución óptima finita
                para el modelo ingresado.</p>
            `;
        } else {
            bloque.innerHTML = `
                <h3>Límite de iteraciones alcanzado</h3>
                <p>El algoritmo no terminó dentro del
                límite de seguridad establecido.</p>
            `;
        }

        contenedor.appendChild(bloque);
        return;
    }

    bloque.className = "resultado-final";

    const titulo = document.createElement("h3");
    titulo.textContent = "✓ Solución óptima encontrada";
    bloque.appendChild(titulo);

    const variables = document.createElement("div");
    variables.className = "variables-resultado";

    resultado.solucion.variables.forEach((valor, indice) => {
        const elemento = document.createElement("div");
        elemento.className = "resultado-variable";

        const nombre = document.createElement("span");
        nombre.textContent = "X" + (indice + 1);

        const numero = document.createElement("strong");
        numero.textContent = formatearNumero(valor);

        elemento.appendChild(nombre);
        elemento.appendChild(numero);
        variables.appendChild(elemento);
    });

    const objetivo = document.createElement("div");
    objetivo.className = "resultado-variable destacado";

    const etiqueta = document.createElement("span");
    etiqueta.textContent = "Valor óptimo de Z";

    const valor = document.createElement("strong");
    valor.textContent = formatearNumero(
        resultado.solucion.valorObjetivo
    );

    objetivo.appendChild(etiqueta);
    objetivo.appendChild(valor);
    variables.appendChild(objetivo);

    bloque.appendChild(variables);
    contenedor.appendChild(bloque);
}

function formatearNumero(numero) {
    if (!Number.isFinite(numero)) {
        return String(numero);
    }

    if (Math.abs(numero) < EPSILON) {
        return "0";
    }

    return Number(numero.toFixed(6)).toString();
}

// =====================================================
// EJEMPLO
// =====================================================

function cargarEjemploSimplex() {
    document.getElementById("tipoOptimizacion").value = "max";
    document.getElementById("numVariables").value = 2;
    document.getElementById("numRestricciones").value = 3;

    generarModeloSimplex();

    const valores = {
        fo_0: 40,
        fo_1: 30,
        r_0_0: 2,
        r_0_1: 1,
        rhs_0: 100,
        r_1_0: 1,
        r_1_1: 1,
        rhs_1: 80,
        r_2_0: 1,
        r_2_1: 0,
        rhs_2: 40
    };

    Object.entries(valores).forEach(([id, valor]) => {
        document.getElementById(id).value = valor;
    });
}

// =====================================================
// LIMPIAR
// =====================================================

function limpiarSimplex() {
    document.querySelectorAll("#panelModelo input").forEach(input => {
        input.value = "";
        input.classList.remove("campo-invalido");
    });

    document.getElementById("panelResultados").classList.add("oculto");
    document.getElementById("procedimientoSimplex").innerHTML = "";

    ocultarErrorSimplex();
}

// =====================================================
// ERRORES
// =====================================================

function mostrarErrorSimplex(mensaje) {
    const elemento = document.getElementById("mensajeErrorSimplex");

    elemento.textContent = "⚠ " + mensaje;
    elemento.classList.remove("oculto");
}

function ocultarErrorSimplex() {
    const elemento = document.getElementById("mensajeErrorSimplex");

    elemento.textContent = "";
    elemento.classList.add("oculto");
}

// =====================================================
// EJECUTAR DESDE EL FORMULARIO
// =====================================================

function resolverSimplex() {
    ocultarErrorSimplex();

    try {
        const datos = obtenerDatosSimplex();
        const resultado = ejecutarSimplex(datos);
        mostrarProcedimiento(datos, resultado);
    } catch (error) {
        mostrarErrorSimplex(error.message);
    }
}
