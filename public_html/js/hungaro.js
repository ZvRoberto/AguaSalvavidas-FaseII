/*
 * GREAT VALUE
 * MÓDULO MÉTODO HÚNGARO
 * FASE III - 2026
 */

"use strict";

const HUN_MAX = 20;
const HUN_EPS = 1e-9;

/* ========== UTILIDADES ========== */

function hunEsc(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
        return {
            "&": "&amp;", "<": "&lt;", ">": "&gt;",
            "\"": "&quot;", "'": "&#39;"
        }[c];
    });
}

function hunRed(x) {
    return Math.round(x * 1e9) / 1e9;
}

function hunFmt(x) {
    const v = hunRed(x);
    if (Math.abs(v) < HUN_EPS) { return "0"; }
    return String(parseFloat(v.toFixed(4)));
}

function hunCopiar(M) {
    return M.map(function (fila) { return fila.slice(); });
}

function hunNumero(texto) {
    const t = String(texto).trim().replace(",", ".");
    if (t === "") { return null; }
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
}

/* ========== NÚCLEO DEL MÉTODO ========== */

/* Máxima asignación posible usando solo ceros */
function hunAsignacionCeros(M, N) {
    const matchRow = new Array(N).fill(-1);
    const matchCol = new Array(N).fill(-1);

    function intentar(i, visto) {
        for (let j = 0; j < N; j++) {
            if (Math.abs(M[i][j]) < HUN_EPS && !visto[j]) {
                visto[j] = true;

                if (matchCol[j] === -1 ||
                    intentar(matchCol[j], visto)) {
                    matchCol[j] = i;
                    matchRow[i] = j;
                    return true;
                }
            }
        }
        return false;
    }

    let tam = 0;

    for (let i = 0; i < N; i++) {
        if (intentar(i, new Array(N).fill(false))) { tam++; }
    }

    return { matchRow: matchRow, matchCol: matchCol, tam: tam };
}

/* Mínimo de líneas que cubren todos los ceros (marcado) */
function hunCobertura(M, N, asig) {
    const filaMarc = new Array(N).fill(false);
    const colMarc = new Array(N).fill(false);

    for (let i = 0; i < N; i++) {
        if (asig.matchRow[i] === -1) { filaMarc[i] = true; }
    }

    let cambio = true;

    while (cambio) {
        cambio = false;

        for (let i = 0; i < N; i++) {
            if (!filaMarc[i]) { continue; }

            for (let j = 0; j < N; j++) {
                if (Math.abs(M[i][j]) < HUN_EPS && !colMarc[j]) {
                    colMarc[j] = true;
                    cambio = true;

                    const k = asig.matchCol[j];

                    if (k !== -1 && !filaMarc[k]) {
                        filaMarc[k] = true;
                    }
                }
            }
        }
    }

    const filasLinea = filaMarc.map(function (m) { return !m; });
    const colsLinea = colMarc.slice();

    const lineas =
        filasLinea.filter(Boolean).length +
        colsLinea.filter(Boolean).length;

    return {
        filasLinea: filasLinea,
        colsLinea: colsLinea,
        lineas: lineas
    };
}

function hunValidar(crudo, objetivo) {
    const n = crudo.valores.length;
    const m = n > 0 ? crudo.valores[0].length : 0;

    if (n < 1 || m < 1) {
        return { error: "La matriz debe tener al menos una fila " +
            "y una columna." };
    }

    const costos = [];

    for (let i = 0; i < n; i++) {
        const fila = [];

        for (let j = 0; j < m; j++) {
            const v = hunNumero(crudo.valores[i][j]);

            if (v === null) {
                return { error: "La celda de la fila " + (i + 1) +
                    ", columna " + (j + 1) + " debe ser un número." };
            }

            fila.push(v);
        }

        costos.push(fila);
    }

    const filas = crudo.filas.map(function (t, i) {
        return t.trim() || "Trabajador " + (i + 1);
    });

    const cols = crudo.cols.map(function (t, j) {
        return t.trim() || "Tarea " + (j + 1);
    });

    return {
        datos: {
            costos: costos,
            filas: filas,
            cols: cols,
            objetivo: objetivo === "max" ? "max" : "min"
        }
    };
}

function hunCalcular(d) {
    const n0 = d.costos.length;
    const m0 = d.costos[0].length;
    const N = Math.max(n0, m0);

    const R = {
        objetivo: d.objetivo,
        n0: n0,
        m0: m0,
        N: N,
        costos: hunCopiar(d.costos),
        filasNombres: d.filas.slice(),
        colsNombres: d.cols.slice(),
        conversion: null,
        balanceo: null
    };

    let W = hunCopiar(d.costos);

    /* Maximizar → matriz de pérdida de oportunidad */
    if (d.objetivo === "max") {
        let mx = -Infinity;

        W.forEach(function (fila) {
            fila.forEach(function (v) {
                if (v > mx) { mx = v; }
            });
        });

        W = W.map(function (fila) {
            return fila.map(function (v) { return hunRed(mx - v); });
        });

        R.conversion = { maximo: mx, matriz: hunCopiar(W) };
    }

    /* Balanceo con filas o columnas ficticias */
    if (n0 !== m0) {
        if (m0 < N) {
            W.forEach(function (fila) {
                while (fila.length < N) { fila.push(0); }
            });

            for (let j = m0; j < N; j++) {
                R.colsNombres.push("Ficticia " + (j - m0 + 1));
            }
        }

        if (n0 < N) {
            for (let i = n0; i < N; i++) {
                W.push(new Array(N).fill(0));
                R.filasNombres.push("Ficticia " + (i - n0 + 1));
            }
        }

        R.balanceo = {
            filas: N - n0,
            cols: N - m0,
            matriz: hunCopiar(W)
        };
    }

    /* Reducción por filas */
    const minF = W.map(function (fila) {
        return Math.min.apply(null, fila);
    });

    W = W.map(function (fila, i) {
        return fila.map(function (v) { return hunRed(v - minF[i]); });
    });

    R.redFilas = { minimos: minF, matriz: hunCopiar(W) };

    /* Reducción por columnas */
    const minC = [];

    for (let j = 0; j < N; j++) {
        let mn = Infinity;

        for (let i = 0; i < N; i++) {
            if (W[i][j] < mn) { mn = W[i][j]; }
        }

        minC.push(mn);
    }

    W = W.map(function (fila) {
        return fila.map(function (v, j) { return hunRed(v - minC[j]); });
    });

    R.redCols = { minimos: minC, matriz: hunCopiar(W) };

    /* Cobertura de ceros y ajustes */
    R.iteraciones = [];

    let asig = null;

    for (let t = 0; t < 1000; t++) {
        asig = hunAsignacionCeros(W, N);

        const cub = hunCobertura(W, N, asig);

        const it = {
            matriz: hunCopiar(W),
            filasLinea: cub.filasLinea,
            colsLinea: cub.colsLinea,
            lineas: cub.lineas,
            k: null
        };

        R.iteraciones.push(it);

        if (cub.lineas >= N) { break; }

        let k = Infinity;

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (!cub.filasLinea[i] && !cub.colsLinea[j] &&
                    W[i][j] < k) {
                    k = W[i][j];
                }
            }
        }

        it.k = k;

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const fl = cub.filasLinea[i];
                const cl = cub.colsLinea[j];

                if (!fl && !cl) {
                    W[i][j] = hunRed(W[i][j] - k);
                } else if (fl && cl) {
                    W[i][j] = hunRed(W[i][j] + k);
                }
            }
        }
    }

    R.matrizFinal = hunCopiar(W);
    R.matchRow = asig.matchRow;

    /* Asignación final sobre la matriz original */
    R.asignacion = [];

    let total = 0;

    for (let i = 0; i < N; i++) {
        const j = asig.matchRow[i];
        const ficticia = i >= n0 || j >= m0;

        R.asignacion.push({
            fila: i,
            col: j,
            ficticia: ficticia,
            valor: ficticia ? null : d.costos[i][j]
        });

        if (!ficticia) { total += d.costos[i][j]; }
    }

    R.total = hunRed(total);

    return R;
}

/* ========== PRESENTACIÓN DE MATRICES ========== */

function hunMatrizHTML(M, filas, cols, opc) {
    const o = opc || {};
    const cubF = o.filasLinea || [];
    const cubC = o.colsLinea || [];

    let h = "<div class=\"sen-tabla-scroll\">" +
        "<table class=\"sen-tabla hun-matriz\"><thead><tr><th></th>";

    cols.forEach(function (c, j) {
        h += "<th" + (cubC[j] ? " class=\"hun-th-linea\"" : "") + ">" +
            hunEsc(c) +
            (cubC[j] ? "<small>línea</small>" : "") + "</th>";
    });

    if (o.extraCol) {
        h += "<th class=\"hun-extra\">" + o.extraCol.titulo + "</th>";
    }

    h += "</tr></thead><tbody>";

    M.forEach(function (fila, i) {
        h += "<tr><th" + (cubF[i] ? " class=\"hun-th-linea\"" : "") +
            ">" + hunEsc(filas[i]) +
            (cubF[i] ? "<small>línea</small>" : "") + "</th>";

        fila.forEach(function (v, j) {
            const clases = [];

            if (cubF[i] && cubC[j]) {
                clases.push("hun-inter");
            } else if (cubF[i]) {
                clases.push("hun-linea-f");
            } else if (cubC[j]) {
                clases.push("hun-linea-c");
            }

            if (Math.abs(v) < HUN_EPS) { clases.push("hun-cero"); }

            if (o.asignado && o.asignado[i] === j) {
                clases.push("hun-asig");
            }

            h += "<td" +
                (clases.length ? " class=\"" + clases.join(" ") + "\"" : "") +
                ">" + hunFmt(v) + "</td>";
        });

        if (o.extraCol) {
            h += "<td class=\"hun-extra\">" +
                hunFmt(o.extraCol.valores[i]) + "</td>";
        }

        h += "</tr>";
    });

    if (o.extraFila) {
        h += "<tr><th class=\"hun-extra\">" + o.extraFila.titulo + "</th>";

        o.extraFila.valores.forEach(function (v) {
            h += "<td class=\"hun-extra\">" + hunFmt(v) + "</td>";
        });

        if (o.extraCol) { h += "<td class=\"hun-extra\"></td>"; }

        h += "</tr>";
    }

    return h + "</tbody></table></div>";
}

/* ========== PROCEDIMIENTO PASO A PASO ========== */

function hunPasos(R) {
    const N = R.N;
    const maxim = R.objetivo === "max";
    const filas = R.filasNombres;
    const cols = R.colsNombres;
    let paso = 0;
    let h = "";

    function bloque(titulo, cuerpo) {
        paso++;

        return "<div class=\"sen-iteracion\"><h4>Paso " + paso +
            " · " + titulo + "</h4>" + cuerpo + "</div>";
    }

    /* Matriz original */
    h += bloque(
        maxim ? "Matriz de beneficios (original)"
              : "Matriz de costos (original)",
        hunMatrizHTML(
            R.costos,
            filas.slice(0, R.n0),
            cols.slice(0, R.m0)
        )
    );

    /* Conversión a minimización */
    if (R.conversion) {
        h += bloque(
            "Convertir a minimización",
            "<p>Como se busca maximizar, cada valor se reemplaza " +
            "por la pérdida de oportunidad: " +
            "<strong>máximo − valor</strong>, con máximo = " +
            "<strong>" + hunFmt(R.conversion.maximo) + "</strong>.</p>" +
            hunMatrizHTML(
                R.conversion.matriz,
                filas.slice(0, R.n0),
                cols.slice(0, R.m0)
            )
        );
    }

    /* Balanceo */
    if (R.balanceo) {
        const que = R.balanceo.filas > 0
            ? R.balanceo.filas + " fila(s) ficticia(s)"
            : R.balanceo.cols + " columna(s) ficticia(s)";

        h += bloque(
            "Balancear la matriz",
            "<p>La matriz no es cuadrada (" + R.n0 + " × " + R.m0 +
            "). Se agregan " + que + " con costo 0 para obtener una " +
            "matriz de " + N + " × " + N + ".</p>" +
            hunMatrizHTML(R.balanceo.matriz, filas, cols)
        );
    }

    /* Reducción por filas */
    h += bloque(
        "Reducción por filas",
        "<p>A cada fila se le resta su valor mínimo.</p>" +
        hunMatrizHTML(R.redFilas.matriz, filas, cols, {
            extraCol: {
                titulo: "Mínimo restado",
                valores: R.redFilas.minimos
            }
        })
    );

    /* Reducción por columnas */
    h += bloque(
        "Reducción por columnas",
        "<p>A cada columna se le resta su valor mínimo " +
        "(las columnas que ya tienen un cero restan 0).</p>" +
        hunMatrizHTML(R.redCols.matriz, filas, cols, {
            extraFila: {
                titulo: "Mínimo restado",
                valores: R.redCols.minimos
            }
        })
    );

    /* Cobertura de ceros */
    R.iteraciones.forEach(function (it, idx) {
        let cuerpo = "";

        if (idx === 0) {
            cuerpo += "<div class=\"sen-nota\">Para hallar el mínimo " +
                "de líneas: se asigna un cero por fila y columna " +
                "(el máximo posible); se marcan las filas sin " +
                "asignación; se marcan las columnas con ceros en " +
                "filas marcadas; se marcan las filas asignadas en " +
                "columnas marcadas, y se repite. Se trazan líneas " +
                "sobre las <strong>filas sin marcar</strong> y las " +
                "<strong>columnas marcadas</strong>.</div>";
        }

        cuerpo += hunMatrizHTML(it.matriz, filas, cols, {
            filasLinea: it.filasLinea,
            colsLinea: it.colsLinea
        });

        cuerpo += "<p class=\"hun-formula\">Líneas necesarias = <strong>" +
            it.lineas + "</strong> " +
            (it.lineas < N ? "&lt;" : "=") + " n = " + N +
            (it.lineas < N
                ? " → todavía no se puede asignar; hay que ajustar."
                : " → ya existe una asignación completa formada " +
                  "solo por ceros.") + "</p>";

        if (it.k !== null) {
            cuerpo += "<p class=\"hun-formula\">Menor elemento no " +
                "cubierto: k = <strong>" + hunFmt(it.k) + "</strong>. " +
                "Se resta " + hunFmt(it.k) + " a los elementos no " +
                "cubiertos y se suma " + hunFmt(it.k) +
                " a los que están en la intersección de dos " +
                "líneas. Los elementos con una sola línea no cambian." +
                "</p>";
        }

        h += bloque(
            "Cobertura de ceros" +
            (R.iteraciones.length > 1 ? " (intento " + (idx + 1) + ")" : ""),
            cuerpo
        );
    });

    /* Asignación final */
    const asignado = R.asignacion.map(function (a) { return a.col; });

    const reales = R.asignacion.filter(function (a) {
        return !a.ficticia;
    });

    let cuerpoFinal = "<p>Se elige un cero en cada fila y en cada " +
        "columna (resaltados). El costo se toma de la matriz " +
        "original.</p>" +
        hunMatrizHTML(R.matrizFinal, filas, cols, { asignado: asignado });

    cuerpoFinal += "<p class=\"hun-formula\">" +
        (maxim ? "Beneficio total" : "Costo total") + " = " +
        reales.map(function (a) { return hunFmt(a.valor); })
            .join(" + ") +
        " = <strong>" + hunFmt(R.total) + "</strong></p>";

    const unaPorFila = R.asignacion.every(function (a) {
        return a.col >= 0;
    });

    const unaPorCol = new Set(R.asignacion.map(function (a) {
        return a.col;
    })).size === N;

    const sobreCeros = R.asignacion.every(function (a) {
        return Math.abs(R.matrizFinal[a.fila][a.col]) < HUN_EPS;
    });

    cuerpoFinal += "<ul class=\"hun-checks\">" +
        "<li>" + (unaPorFila && unaPorCol ? "✓" : "✗") +
        " Cada fila y cada columna tiene exactamente una asignación</li>" +
        "<li>" + (sobreCeros ? "✓" : "✗") +
        " Todas las asignaciones están sobre ceros de la matriz final" +
        "</li></ul>";

    h += bloque("Asignación óptima", cuerpoFinal);

    return h;
}

function hunRenderResultados(R) {
    const maxim = R.objetivo === "max";

    const reales = R.asignacion.filter(function (a) {
        return !a.ficticia;
    });

    let h = "<div class=\"pert-kpis\">" +
        "<div class=\"pert-kpi\"><span>" +
        (maxim ? "Beneficio total máximo" : "Costo total mínimo") +
        "</span><strong>" + hunFmt(R.total) + "</strong></div>" +
        "<div class=\"pert-kpi\"><span>Asignaciones</span><strong>" +
        reales.length + "</strong></div>" +
        "<div class=\"pert-kpi\"><span>Tamaño de la matriz</span>" +
        "<strong>" + R.n0 + " × " + R.m0 + "</strong></div></div>";

    h += "<h3>Asignación óptima</h3>" +
        "<div class=\"sen-tabla-scroll\"><table class=\"sen-tabla\">" +
        "<thead><tr><th>Fila</th><th>Asignada a</th><th>" +
        (maxim ? "Beneficio" : "Costo") + "</th></tr></thead><tbody>";

    R.asignacion.forEach(function (a) {
        if (a.ficticia) {
            h += "<tr class=\"hun-fila-ficticia\"><th>" +
                hunEsc(R.filasNombres[a.fila]) + "</th><td>" +
                hunEsc(R.colsNombres[a.col]) +
                "</td><td>sin asignar</td></tr>";
        } else {
            h += "<tr><th>" + hunEsc(R.filasNombres[a.fila]) +
                "</th><td>" + hunEsc(R.colsNombres[a.col]) +
                "</td><td><strong>" + hunFmt(a.valor) +
                "</strong></td></tr>";
        }
    });

    h += "<tr class=\"hun-fila-total\"><th>Total</th><td></td><td>" +
        "<strong>" + hunFmt(R.total) + "</strong></td></tr>" +
        "</tbody></table></div>";

    h += "<h3>Procedimiento paso a paso</h3>" + hunPasos(R);

    return h;
}

/* ========== TABLA DE ENTRADA ========== */

function hunLeerCrudo() {
    const cabecera = document.querySelectorAll(
        "#hunCabecera .hun-nom-col"
    );

    const filasTr = document.querySelectorAll("#hunCuerpo tr");

    return {
        cols: Array.prototype.map.call(cabecera, function (el) {
            return el.value;
        }),
        filas: Array.prototype.map.call(filasTr, function (tr) {
            return tr.querySelector(".hun-nom-fila").value;
        }),
        valores: Array.prototype.map.call(filasTr, function (tr) {
            return Array.prototype.map.call(
                tr.querySelectorAll(".hun-celda"),
                function (el) { return el.value; }
            );
        })
    };
}

function hunConstruir(n, m, previo) {
    const p = previo || { cols: [], filas: [], valores: [] };

    let cab = "<tr><th></th>";

    for (let j = 0; j < m; j++) {
        const nombre = p.cols[j] !== undefined && p.cols[j] !== ""
            ? p.cols[j] : "Tarea " + (j + 1);

        cab += "<th><input class=\"hun-nom-col\" type=\"text\" " +
            "maxlength=\"30\" value=\"" + hunEsc(nombre) + "\" " +
            "aria-label=\"Nombre de la columna " + (j + 1) + "\"></th>";
    }

    cab += "</tr>";

    let cuerpo = "";

    for (let i = 0; i < n; i++) {
        const nombre = p.filas[i] !== undefined && p.filas[i] !== ""
            ? p.filas[i] : "Trabajador " + (i + 1);

        cuerpo += "<tr><th><input class=\"hun-nom-fila\" type=\"text\" " +
            "maxlength=\"30\" value=\"" + hunEsc(nombre) + "\" " +
            "aria-label=\"Nombre de la fila " + (i + 1) + "\"></th>";

        for (let j = 0; j < m; j++) {
            const v = p.valores[i] && p.valores[i][j] !== undefined
                ? p.valores[i][j] : "";

            cuerpo += "<td><input class=\"hun-celda\" type=\"number\" " +
                "step=\"any\" value=\"" + hunEsc(v) + "\" " +
                "aria-label=\"Valor fila " + (i + 1) +
                ", columna " + (j + 1) + "\"></td>";
        }

        cuerpo += "</tr>";
    }

    document.getElementById("hunCabecera").innerHTML = cab;
    document.getElementById("hunCuerpo").innerHTML = cuerpo;
    document.getElementById("hunModelo").classList.remove("oculto");
    hunOcultarResultados();
}

function hunOcultarResultados() {
    document.getElementById("hunResultados").classList.add("oculto");
    document.getElementById("hunError").classList.add("oculto");
}

function hunMostrarError(mensaje) {
    const caja = document.getElementById("hunError");

    caja.textContent = mensaje;
    caja.classList.remove("oculto");
    caja.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ========== BOTONES ========== */

function hunGenerar() {
    const n = parseInt(document.getElementById("hunFilas").value, 10);
    const m = parseInt(document.getElementById("hunColumnas").value, 10);

    const valido = function (x) {
        return Number.isInteger(x) && x >= 1 && x <= HUN_MAX;
    };

    if (!valido(n) || !valido(m)) {
        document.getElementById("hunModelo").classList.add("oculto");
        hunMostrarError("Filas y columnas deben ser números " +
            "enteros entre 1 y " + HUN_MAX + ".");
        return;
    }

    hunConstruir(n, m, hunLeerCrudo());
}

function hunEjemplo() {
    const valores = [
        [82, 83, 69, 92],
        [77, 37, 49, 92],
        [11, 69, 5, 86],
        [8, 9, 98, 23]
    ];

    document.getElementById("hunFilas").value = 4;
    document.getElementById("hunColumnas").value = 4;
    document.getElementById("hunObjetivo").value = "min";

    hunConstruir(4, 4, { cols: [], filas: [], valores: valores });
}

function hunLimpiar() {
    document.getElementById("hunFilas").value = 4;
    document.getElementById("hunColumnas").value = 4;
    document.getElementById("hunObjetivo").value = "min";
    document.getElementById("hunCabecera").innerHTML = "";
    document.getElementById("hunCuerpo").innerHTML = "";
    document.getElementById("hunContenido").innerHTML = "";
    document.getElementById("hunModelo").classList.add("oculto");
    hunOcultarResultados();
}

function hunResolver() {
    document.getElementById("hunError").classList.add("oculto");

    const validacion = hunValidar(
        hunLeerCrudo(),
        document.getElementById("hunObjetivo").value
    );

    if (validacion.error) {
        document.getElementById("hunResultados")
            .classList.add("oculto");
        hunMostrarError(validacion.error);
        return;
    }

    const resultado = hunCalcular(validacion.datos);
    const panel = document.getElementById("hunResultados");

    document.getElementById("hunContenido").innerHTML =
        hunRenderResultados(resultado);

    panel.classList.remove("oculto");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* Si cambian los datos, los resultados anteriores ya no aplican */
(function () {
    if (typeof document === "undefined") { return; }

    const cuerpo = document.getElementById("hunCuerpo");
    const objetivo = document.getElementById("hunObjetivo");

    if (cuerpo) {
        cuerpo.addEventListener("input", hunOcultarResultados);
    }

    if (objetivo) {
        objetivo.addEventListener("change", hunOcultarResultados);
    }
})();