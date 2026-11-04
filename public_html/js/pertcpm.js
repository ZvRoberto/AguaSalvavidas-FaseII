/*
 * GREAT VALUE
 * MÓDULO PERT / CPM
 * FASE III - 2026
 *
 * Calcula tiempo esperado, varianza, ES, EF, LS, LF,
 * holguras y ruta crítica. Muestra el procedimiento
 * completo y el diagrama de red (actividad en nodo).
 */

"use strict";

const PERT_MAX = 30;
const PERT_TOL = 1e-7;

/* =====================================================
   UTILIDADES DE FORMATO
   ===================================================== */

function pertEsc(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        }[c];
    });
}

function f2(x) {
    const v = Math.abs(x) < 1e-9 ? 0 : x;
    return v.toFixed(2);
}

function f4(x) {
    const v = Math.abs(x) < 1e-9 ? 0 : x;
    return v.toFixed(4);
}

function pertNumero(texto) {
    const t = String(texto).trim().replace(",", ".");

    if (t === "") {
        return null;
    }

    const n = Number(t);

    return Number.isFinite(n) ? n : null;
}

function pertPredecesoras(texto) {
    const lista = String(texto)
        .toUpperCase()
        .split(/[,;\s]+/)
        .filter(function (p) {
            return p !== "" && p !== "-" && p !== "—";
        });

    return lista.filter(function (p, i) {
        return lista.indexOf(p) === i;
    });
}

/* =====================================================
   CÁLCULO
   ===================================================== */

function pertOrdenTopologico(actividades) {
    const porId = new Map();
    const pendientes = new Map();
    const sucesoras = new Map();

    actividades.forEach(function (a) {
        porId.set(a.id, a);
        pendientes.set(a.id, a.pred.length);
        sucesoras.set(a.id, []);
    });

    actividades.forEach(function (a) {
        a.pred.forEach(function (p) {
            if (sucesoras.has(p)) {
                sucesoras.get(p).push(a.id);
            }
        });
    });

    const cola = actividades
        .filter(function (a) { return a.pred.length === 0; })
        .map(function (a) { return a.id; });

    const orden = [];

    while (cola.length > 0) {
        const id = cola.shift();
        orden.push(id);

        sucesoras.get(id).forEach(function (s) {
            pendientes.set(s, pendientes.get(s) - 1);

            if (pendientes.get(s) === 0) {
                cola.push(s);
            }
        });
    }

    return orden;
}

function pertValidar(filas) {
    const ids = new Set();
    const actividades = [];

    for (const f of filas) {

        if (!f.id) {
            return { error: "Fila " + f.fila +
                ": escribe el nombre de la actividad." };
        }

        if (!/^[A-Z0-9_]{1,6}$/.test(f.id)) {
            return { error: "Fila " + f.fila + ": el nombre \"" +
                pertEsc(f.id) + "\" no es válido. Usa letras o " +
                "números (máximo 6 caracteres), sin espacios." };
        }

        if (ids.has(f.id)) {
            return { error: "La actividad " + f.id +
                " está repetida. Cada nombre debe ser único." };
        }

        ids.add(f.id);

        const a = pertNumero(f.a);
        const m = pertNumero(f.m);
        const b = pertNumero(f.b);

        if (a === null || m === null || b === null) {
            return { error: "Actividad " + f.id +
                ": a, m y b deben ser números." };
        }

        if (a < 0 || m < 0 || b < 0) {
            return { error: "Actividad " + f.id +
                ": los tiempos no pueden ser negativos." };
        }

        if (!(a <= m && m <= b)) {
            return { error: "Actividad " + f.id +
                ": debe cumplirse a ≤ m ≤ b (optimista ≤ " +
                "más probable ≤ pesimista)." };
        }

        actividades.push({
            id: f.id,
            desc: f.desc,
            a: a,
            m: m,
            b: b,
            pred: pertPredecesoras(f.pred)
        });
    }

    for (const act of actividades) {
        for (const p of act.pred) {

            if (p === act.id) {
                return { error: "La actividad " + act.id +
                    " no puede ser predecesora de sí misma." };
            }

            if (!ids.has(p)) {
                return { error: "La actividad " + act.id +
                    " tiene una predecesora que no existe: " +
                    pertEsc(p) + "." };
            }
        }
    }

    const orden = pertOrdenTopologico(actividades);

    if (orden.length !== actividades.length) {
        const ciclo = actividades
            .filter(function (a) { return orden.indexOf(a.id) < 0; })
            .map(function (a) { return a.id; });

        return { error: "Las predecesoras forman un ciclo " +
            "(revisa: " + ciclo.join(", ") + "). " +
            "Un proyecto no puede depender de sí mismo." };
    }

    return { actividades: actividades };
}

function pertCalcular(actividades) {
    const porId = new Map();

    actividades.forEach(function (a) {
        a.te = (a.a + 4 * a.m + a.b) / 6;
        a.v = Math.pow((a.b - a.a) / 6, 2);
        a.suc = [];
        porId.set(a.id, a);
    });

    actividades.forEach(function (a) {
        a.pred.forEach(function (p) {
            porId.get(p).suc.push(a.id);
        });
    });

    const orden = pertOrdenTopologico(actividades);

    /* Paso hacia adelante */

    orden.forEach(function (id) {
        const a = porId.get(id);

        a.ES = a.pred.length > 0
            ? Math.max.apply(null, a.pred.map(function (p) {
                return porId.get(p).EF;
            }))
            : 0;

        a.EF = a.ES + a.te;
    });

    const T = Math.max.apply(null, actividades.map(function (a) {
        return a.EF;
    }));

    /* Paso hacia atrás */

    orden.slice().reverse().forEach(function (id) {
        const a = porId.get(id);

        a.LF = a.suc.length > 0
            ? Math.min.apply(null, a.suc.map(function (s) {
                return porId.get(s).LS;
            }))
            : T;

        a.LS = a.LF - a.te;
    });

    /* Holguras y actividades críticas */

    actividades.forEach(function (a) {
        a.H = a.LS - a.ES;
        a.critica = Math.abs(a.H) < PERT_TOL;
    });

    /* Rutas críticas */

    const rutas = [];

    function recorrer(id, camino) {
        if (rutas.length >= 50) {
            return;
        }

        const a = porId.get(id);
        const nuevo = camino.concat(id);

        const siguientes = a.suc.filter(function (s) {
            const sa = porId.get(s);
            return sa.critica &&
                Math.abs(a.EF - sa.ES) < PERT_TOL;
        });

        if (siguientes.length === 0) {
            rutas.push(nuevo);
            return;
        }

        siguientes.forEach(function (s) {
            recorrer(s, nuevo);
        });
    }

    actividades
        .filter(function (a) {
            return a.critica && a.pred.length === 0;
        })
        .forEach(function (a) {
            recorrer(a.id, []);
        });

    const info = rutas.map(function (ruta) {
        const acts = ruta.map(function (id) { return porId.get(id); });

        return {
            ids: ruta,
            suma: acts.reduce(function (s, a) { return s + a.te; }, 0),
            varianza: acts.reduce(function (s, a) { return s + a.v; }, 0)
        };
    });

    const mejor = info.reduce(function (m, r) {
        return (!m || r.varianza > m.varianza) ? r : m;
    }, null);

    return {
        actividades: actividades,
        porId: porId,
        orden: orden,
        T: T,
        rutas: info,
        varianza: mejor ? mejor.varianza : 0,
        desviacion: mejor ? Math.sqrt(mejor.varianza) : 0
    };
}

/* =====================================================
   DIAGRAMA DE RED (SVG)
   ===================================================== */

function pertDiagrama(r) {
    const NW = 124;
    const NH = 84;
    const HG = 64;
    const VG = 30;
    const PAD = 24;
    const VW = 64;
    const VH = 36;

    const nivel = new Map();
    let maxNivel = 0;

    r.orden.forEach(function (id) {
        const a = r.porId.get(id);

        const n = a.pred.length > 0
            ? Math.max.apply(null, a.pred.map(function (p) {
                return nivel.get(p);
            })) + 1
            : 0;

        nivel.set(id, n);
        maxNivel = Math.max(maxNivel, n);
    });

    const columnas = [];
    columnas.push([{ id: "Inicio", virtual: true }]);

    for (let n = 0; n <= maxNivel; n++) {
        columnas.push(
            r.actividades
                .filter(function (a) { return nivel.get(a.id) === n; })
                .map(function (a) { return { id: a.id, virtual: false }; })
        );
    }

    columnas.push([{ id: "Fin", virtual: true }]);

    const maxFilas = Math.max.apply(null, columnas.map(function (c) {
        return c.length;
    }));

    const altoMax = maxFilas * NH + (maxFilas - 1) * VG;
    const nodos = new Map();

    columnas.forEach(function (col, k) {

        if (k > 0 && k < columnas.length - 1) {
            col.forEach(function (nd) {
                const a = r.porId.get(nd.id);
                const refs = a.pred.length > 0 ? a.pred : ["Inicio"];

                nd.clave = refs.reduce(function (s, p) {
                    return s + nodos.get(p).cy;
                }, 0) / refs.length;
            });

            col.sort(function (x, y) { return x.clave - y.clave; });
        }

        const alto = col.length * NH + (col.length - 1) * VG;
        const arriba = PAD + (altoMax - alto) / 2;
        const xCol = PAD + k * (NW + HG);

        col.forEach(function (nd, i) {
            nd.w = nd.virtual ? VW : NW;
            nd.h = nd.virtual ? VH : NH;
            nd.x = nd.virtual ? xCol + (NW - VW) / 2 : xCol;
            nd.cy = arriba + i * (NH + VG) + NH / 2;
            nd.y = nd.cy - nd.h / 2;
            nodos.set(nd.id, nd);
        });
    });

    const ancho = PAD * 2 + columnas.length * NW +
        (columnas.length - 1) * HG;
    const alto = PAD * 2 + altoMax;

    /* Aristas */

    const aristas = [];

    r.actividades.forEach(function (a) {
        const preds = a.pred.length > 0 ? a.pred : ["Inicio"];

        preds.forEach(function (p) {
            let critica = false;

            if (p === "Inicio") {
                critica = a.critica;
            } else {
                const pa = r.porId.get(p);
                critica = pa.critica && a.critica &&
                    Math.abs(pa.EF - a.ES) < PERT_TOL;
            }

            aristas.push({ de: p, a: a.id, critica: critica });
        });

        if (a.suc.length === 0) {
            aristas.push({
                de: a.id,
                a: "Fin",
                critica: a.critica &&
                    Math.abs(a.EF - r.T) < PERT_TOL
            });
        }
    });

    function trazo(e) {
        const p = nodos.get(e.de);
        const s = nodos.get(e.a);
        const x1 = p.x + p.w;
        const y1 = p.cy;
        const x2 = s.x;
        const y2 = s.cy;
        const dx = Math.max(28, (x2 - x1) / 2);

        return "<path class=\"pert-arista" +
            (e.critica ? " critica" : "") + "\" d=\"M" +
            x1 + " " + y1 + " C" + (x1 + dx) + " " + y1 + " " +
            (x2 - dx) + " " + y2 + " " + x2 + " " + y2 + "\" " +
            "marker-end=\"url(#" +
            (e.critica ? "pertFlechaC" : "pertFlecha") + ")\"/>";
    }

    let svg = "<svg class=\"pert-svg\" role=\"img\" " +
        "aria-label=\"Diagrama de red del proyecto\" " +
        "viewBox=\"0 0 " + ancho + " " + alto + "\" " +
        "width=\"" + ancho + "\" height=\"" + alto + "\" " +
        "xmlns=\"http://www.w3.org/2000/svg\">" +
        "<defs>" +
        "<marker id=\"pertFlecha\" viewBox=\"0 0 10 10\" " +
        "refX=\"9\" refY=\"5\" markerWidth=\"8\" markerHeight=\"8\" " +
        "orient=\"auto-start-reverse\">" +
        "<path d=\"M0 0 L10 5 L0 10 z\" fill=\"#7b8da3\"/></marker>" +
        "<marker id=\"pertFlechaC\" viewBox=\"0 0 10 10\" " +
        "refX=\"9\" refY=\"5\" markerWidth=\"8\" markerHeight=\"8\" " +
        "orient=\"auto-start-reverse\">" +
        "<path d=\"M0 0 L10 5 L0 10 z\" fill=\"#d64453\"/></marker>" +
        "</defs>";

    aristas
        .filter(function (e) { return !e.critica; })
        .forEach(function (e) { svg += trazo(e); });

    aristas
        .filter(function (e) { return e.critica; })
        .forEach(function (e) { svg += trazo(e); });

    nodos.forEach(function (nd) {

        if (nd.virtual) {
            svg += "<g class=\"pert-nodo-virtual\">" +
                "<rect x=\"" + nd.x + "\" y=\"" + nd.y +
                "\" width=\"" + nd.w + "\" height=\"" + nd.h +
                "\" rx=\"18\"/>" +
                "<text x=\"" + (nd.x + nd.w / 2) + "\" y=\"" +
                (nd.cy + 4.5) + "\" text-anchor=\"middle\">" +
                nd.id + "</text></g>";
            return;
        }

        const a = r.porId.get(nd.id);
        const x = nd.x;
        const y = nd.y;
        const mitad = x + NW / 2;

        svg += "<g class=\"pert-nodo" +
            (a.critica ? " critico" : "") + "\">" +
            "<title>" + a.id +
            (a.desc ? ": " + pertEsc(a.desc) : "") + "</title>" +
            "<rect x=\"" + x + "\" y=\"" + y + "\" width=\"" + NW +
            "\" height=\"" + NH + "\" rx=\"8\"/>" +
            "<line x1=\"" + x + "\" y1=\"" + (y + 22) +
            "\" x2=\"" + (x + NW) + "\" y2=\"" + (y + 22) + "\"/>" +
            "<line x1=\"" + x + "\" y1=\"" + (y + 62) +
            "\" x2=\"" + (x + NW) + "\" y2=\"" + (y + 62) + "\"/>" +
            "<line x1=\"" + mitad + "\" y1=\"" + y +
            "\" x2=\"" + mitad + "\" y2=\"" + (y + 22) + "\"/>" +
            "<line x1=\"" + mitad + "\" y1=\"" + (y + 62) +
            "\" x2=\"" + mitad + "\" y2=\"" + (y + NH) + "\"/>" +
            "<text class=\"pert-num\" x=\"" + (x + NW / 4) +
            "\" y=\"" + (y + 15) + "\" text-anchor=\"middle\">" +
            f2(a.ES) + "</text>" +
            "<text class=\"pert-num\" x=\"" + (x + 3 * NW / 4) +
            "\" y=\"" + (y + 15) + "\" text-anchor=\"middle\">" +
            f2(a.EF) + "</text>" +
            "<text class=\"pert-id-nodo\" x=\"" + mitad +
            "\" y=\"" + (y + 38) + "\" text-anchor=\"middle\">" +
            a.id + "</text>" +
            "<text class=\"pert-te\" x=\"" + mitad +
            "\" y=\"" + (y + 54) + "\" text-anchor=\"middle\">" +
            "t = " + f2(a.te) + "</text>" +
            "<text class=\"pert-num\" x=\"" + (x + NW / 4) +
            "\" y=\"" + (y + 77) + "\" text-anchor=\"middle\">" +
            f2(a.LS) + "</text>" +
            "<text class=\"pert-num\" x=\"" + (x + 3 * NW / 4) +
            "\" y=\"" + (y + 77) + "\" text-anchor=\"middle\">" +
            f2(a.LF) + "</text></g>";
    });

    svg += "</svg>";

    return svg;
}

/* =====================================================
   PROBABILIDAD (VALOR Z)
   ===================================================== */

/* Distribución normal estándar acumulada Φ(x) (error < 1e-7) */

function pertNormalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989422804014327 * Math.exp(-x * x / 2);

    const p = d * t * (0.319381530 + t * (-0.356563782 +
        t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));

    return x >= 0 ? 1 - p : p;
}

function pertProbabilidad(r, D) {
    const sigma = r.desviacion;

    if (sigma < 1e-9) {
        return {
            D: D,
            sigma: sigma,
            determinista: true,
            P: D >= r.T - PERT_TOL ? 1 : 0
        };
    }

    const Z = (D - r.T) / sigma;
    const Z2 = Math.round(Z * 100) / 100;

    return {
        D: D,
        sigma: sigma,
        determinista: false,
        Z: Z,
        Z2: Z2,
        P: pertNormalCDF(Z2),
        Pexacta: pertNormalCDF(Z)
    };
}

function pertPorcentaje(p) {
    return (p * 100).toFixed(2) + " %";
}

function pertKpiZ(r) {
    if (!r.prob) {
        return "";
    }

    const pr = r.prob;

    return "<div class=\"pert-kpi\"><span>Z (D = " + f2(pr.D) +
        ")</span><strong>" +
        (pr.determinista ? "—" : f2(pr.Z2)) + "</strong></div>" +
        "<div class=\"pert-kpi\"><span>P(T ≤ " + f2(pr.D) +
        ")</span><strong>" + pertPorcentaje(pr.P) + "</strong></div>";
}

function pertPasoZ(r) {
    const pr = r.prob;

    let h = "<div class=\"sen-iteracion\">" +
        "<h4>Paso 7 · Valor Z y probabilidad de terminar en D = " +
        f2(pr.D) + "</h4>";

    if (pr.determinista) {
        h += "<p>La varianza de la ruta crítica es 0 (todos los " +
            "tiempos son fijos), por lo que no hay incertidumbre y " +
            "Z no se puede calcular. El proyecto dura exactamente " +
            "T = " + f2(r.T) + ", así que " +
            (pr.P === 1
                ? "termina en D = " + f2(pr.D) + " o antes (100 %)."
                : "no alcanza a terminar en D = " + f2(pr.D) + " (0 %).") +
            "</p></div>";

        return h;
    }

    h += "<p>El tiempo total del proyecto se aproxima con una " +
        "distribución normal de media T = <strong>" + f2(r.T) +
        "</strong> y desviación estándar σ = <strong>" +
        f4(pr.sigma) + "</strong> (la de la ruta crítica).</p>" +
        "<p class=\"pert-formula\">Z = (D − T) / σ = (" + f2(pr.D) +
        " − " + f2(r.T) + ") / " + f4(pr.sigma) +
        " = <strong>" + f4(pr.Z) + "</strong></p>" +
        "<p class=\"pert-formula\">Z redondeado a 2 decimales " +
        "(para buscar en la tabla normal) = <strong>" + f2(pr.Z2) +
        "</strong></p>" +
        "<p class=\"pert-formula\">P(T ≤ D) = Φ(" + f2(pr.Z2) +
        ") = <strong>" + f4(pr.P) + "</strong> &nbsp;→&nbsp; <strong>" +
        pertPorcentaje(pr.P) + "</strong></p>" +
        "<p>Hay aproximadamente un <strong>" + pertPorcentaje(pr.P) +
        "</strong> de probabilidad de que el proyecto termine en " +
        f2(pr.D) + " o antes. " +
        (pr.Z2 < 0
            ? "Como Z es negativo, D es menor que la duración esperada."
            : (pr.Z2 > 0
                ? "Como Z es positivo, D es mayor que la duración esperada."
                : "D coincide con la duración esperada.")) +
        " Sin redondear Z, la probabilidad es " +
        pertPorcentaje(pr.Pexacta) + ".</p></div>";

    return h;
}

/* =====================================================
   PROCEDIMIENTO PASO A PASO
   ===================================================== */

function pertTabla(encabezados, filas, claseFila) {
    let h = "<div class=\"sen-tabla-scroll\">" +
        "<table class=\"sen-tabla pert-tabla-proc\"><thead><tr>";

    encabezados.forEach(function (e) {
        h += "<th>" + e + "</th>";
    });

    h += "</tr></thead><tbody>";

    filas.forEach(function (f) {
        h += "<tr" + (f.critica ? " class=\"pert-fila-critica\"" : "") +
            ">";

        f.celdas.forEach(function (c, i) {
            h += (i === 0 ? "<th>" : "<td class=\"pert-formula\">") +
                c + (i === 0 ? "</th>" : "</td>");
        });

        h += "</tr>";
    });

    return h + "</tbody></table></div>";
}

function pertPasos(r) {
    const act = r.actividades;
    const porId = r.porId;
    const te = "t<sub>e</sub>";
    let h = "";

    /* Paso 1 */

    h += "<div class=\"sen-iteracion\">" +
        "<h4>Paso 1 · Tiempo esperado y varianza</h4>" +
        "<p>t<sub>e</sub> = (a + 4m + b) / 6 &nbsp;&nbsp;·&nbsp;&nbsp; " +
        "σ² = ((b − a) / 6)²</p>" +
        pertTabla(
            ["Actividad", te, "σ²"],
            act.map(function (a) {
                return {
                    critica: a.critica,
                    celdas: [
                        a.id,
                        "(" + a.a + " + 4·" + a.m + " + " + a.b +
                            ") / 6 = <strong>" + f2(a.te) + "</strong>",
                        "((" + a.b + " − " + a.a + ") / 6)² = <strong>" +
                            f4(a.v) + "</strong>"
                    ]
                };
            })
        ) + "</div>";

    /* Paso 2 */

    h += "<div class=\"sen-iteracion\">" +
        "<h4>Paso 2 · Paso hacia adelante (ES y EF)</h4>" +
        "<p>ES = máx{EF de las predecesoras} (0 si no tiene) " +
        "&nbsp;&nbsp;·&nbsp;&nbsp; EF = ES + t<sub>e</sub></p>" +
        pertTabla(
            ["Actividad", "ES", "EF"],
            r.orden.map(function (id) {
                const a = porId.get(id);
                let es;

                if (a.pred.length === 0) {
                    es = "Sin predecesoras → ES = <strong>0.00</strong>";
                } else if (a.pred.length === 1) {
                    es = "EF(" + a.pred[0] + ") = <strong>" +
                        f2(a.ES) + "</strong>";
                } else {
                    es = "máx{" + a.pred.map(function (p) {
                        return "EF(" + p + ")";
                    }).join(", ") + "} = máx{" +
                        a.pred.map(function (p) {
                            return f2(porId.get(p).EF);
                        }).join(", ") + "} = <strong>" +
                        f2(a.ES) + "</strong>";
                }

                return {
                    critica: a.critica,
                    celdas: [
                        a.id,
                        es,
                        f2(a.ES) + " + " + f2(a.te) +
                            " = <strong>" + f2(a.EF) + "</strong>"
                    ]
                };
            })
        ) + "</div>";

    /* Paso 3 */

    const finales = act.filter(function (a) {
        return a.suc.length === 0;
    });

    h += "<div class=\"sen-iteracion\">" +
        "<h4>Paso 3 · Duración del proyecto</h4>" +
        "<p class=\"pert-formula\">T = máx{EF de las actividades " +
        "finales} = máx{" + finales.map(function (a) {
            return "EF(" + a.id + ")";
        }).join(", ") + "} = máx{" + finales.map(function (a) {
            return f2(a.EF);
        }).join(", ") + "} = <strong>" + f2(r.T) + "</strong></p>" +
        "</div>";

    /* Paso 4 */

    h += "<div class=\"sen-iteracion\">" +
        "<h4>Paso 4 · Paso hacia atrás (LF y LS)</h4>" +
        "<p>LF = mín{LS de las sucesoras} (T si no tiene) " +
        "&nbsp;&nbsp;·&nbsp;&nbsp; LS = LF − t<sub>e</sub></p>" +
        pertTabla(
            ["Actividad", "LF", "LS"],
            r.orden.slice().reverse().map(function (id) {
                const a = porId.get(id);
                let lf;

                if (a.suc.length === 0) {
                    lf = "Actividad final → LF = T = <strong>" +
                        f2(a.LF) + "</strong>";
                } else if (a.suc.length === 1) {
                    lf = "LS(" + a.suc[0] + ") = <strong>" +
                        f2(a.LF) + "</strong>";
                } else {
                    lf = "mín{" + a.suc.map(function (s) {
                        return "LS(" + s + ")";
                    }).join(", ") + "} = mín{" +
                        a.suc.map(function (s) {
                            return f2(porId.get(s).LS);
                        }).join(", ") + "} = <strong>" +
                        f2(a.LF) + "</strong>";
                }

                return {
                    critica: a.critica,
                    celdas: [
                        a.id,
                        lf,
                        f2(a.LF) + " − " + f2(a.te) +
                            " = <strong>" + f2(a.LS) + "</strong>"
                    ]
                };
            })
        ) + "</div>";

    /* Paso 5 */

    h += "<div class=\"sen-iteracion\">" +
        "<h4>Paso 5 · Holguras y actividades críticas</h4>" +
        "<p>H = LS − ES = LF − EF. Una actividad es crítica " +
        "cuando H = 0: no puede retrasarse sin atrasar el " +
        "proyecto completo.</p>" +
        pertTabla(
            ["Actividad", "LS − ES", "LF − EF", "¿Crítica?"],
            act.map(function (a) {
                return {
                    critica: a.critica,
                    celdas: [
                        a.id,
                        f2(a.LS) + " − " + f2(a.ES) +
                            " = <strong>" + f2(a.H) + "</strong>",
                        f2(a.LF) + " − " + f2(a.EF) +
                            " = <strong>" + f2(a.LF - a.EF) +
                            "</strong>",
                        a.critica
                            ? "<strong class=\"pert-si\">Sí (H = 0)</strong>"
                            : "No (puede retrasarse " + f2(a.H) + ")"
                    ]
                };
            })
        ) + "</div>";

    /* Paso 6 */

    h += "<div class=\"sen-iteracion\">" +
        "<h4>Paso 6 · Ruta crítica y comprobación</h4>";

    r.rutas.forEach(function (ruta, i) {
        const acts = ruta.ids.map(function (id) {
            return porId.get(id);
        });

        const cuadra = Math.abs(ruta.suma - r.T) < PERT_TOL;

        h += "<div class=\"pert-ruta\">" +
            (r.rutas.length > 1
                ? "<strong>Ruta crítica " + (i + 1) + ":</strong> "
                : "<strong>Ruta crítica:</strong> ") +
            ruta.ids.join(" → ") +
            "<p class=\"pert-formula\">Σ t<sub>e</sub> = " +
            acts.map(function (a) { return f2(a.te); }).join(" + ") +
            " = <strong>" + f2(ruta.suma) + "</strong> " +
            (cuadra ? "= T ✓" : "≠ T ✗") + "</p>" +
            "<p class=\"pert-formula\">σ² = " +
            acts.map(function (a) { return f4(a.v); }).join(" + ") +
            " = <strong>" + f4(ruta.varianza) + "</strong>" +
            " &nbsp;→&nbsp; σ = √" + f4(ruta.varianza) + " = " +
            "<strong>" + f4(Math.sqrt(ruta.varianza)) + "</strong>" +
            "</p></div>";
    });

    if (r.rutas.length > 1) {
        h += "<div class=\"sen-nota\">Hay " + r.rutas.length +
            " rutas críticas. La varianza del proyecto se toma " +
            "de la ruta con mayor varianza.</div>";
    }

    const todasCero = act.every(function (a) {
        return !a.critica || Math.abs(a.H) < PERT_TOL;
    });

    const sumaCuadra = r.rutas.length > 0 && r.rutas.every(function (x) {
        return Math.abs(x.suma - r.T) < PERT_TOL;
    });

    h += "<ul class=\"pert-checks\">" +
        "<li>" + (todasCero ? "✓" : "✗") +
        " Todas las actividades críticas tienen H = 0</li>" +
        "<li>" + (sumaCuadra ? "✓" : "✗") +
        " La suma de t<sub>e</sub> de la ruta crítica coincide " +
        "con la duración T = " + f2(r.T) + "</li></ul></div>";

    if (r.prob) {
        h += pertPasoZ(r);
    }

    return h;
}

/* =====================================================
   RESULTADOS EN PANTALLA
   ===================================================== */

function pertRenderResultados(r) {
    const act = r.actividades;

    const rutasTexto = r.rutas.map(function (x) {
        return x.ids.join(" → ");
    }).join("<br>");

    let h = "<div class=\"pert-kpis\">" +
        "<div class=\"pert-kpi\"><span>Duración esperada</span>" +
        "<strong>" + f2(r.T) + "</strong></div>" +
        "<div class=\"pert-kpi\"><span>Ruta crítica</span>" +
        "<strong class=\"pert-kpi-ruta\">" + rutasTexto +
        "</strong></div>" +
        "<div class=\"pert-kpi\"><span>Varianza del proyecto</span>" +
        "<strong>" + f4(r.varianza) + "</strong></div>" +
        "<div class=\"pert-kpi\"><span>Desviación estándar</span>" +
        "<strong>" + f4(r.desviacion) + "</strong></div>" +
        pertKpiZ(r) + "</div>";

    /* Tabla de resultados */

    h += "<h3>Tabla de resultados</h3>" +
        "<div class=\"sen-tabla-scroll\"><table class=\"sen-tabla\">" +
        "<thead><tr><th>Actividad</th><th>Predecesoras</th>" +
        "<th>a</th><th>m</th><th>b</th><th>t<sub>e</sub></th>" +
        "<th>σ²</th><th>ES</th><th>EF</th><th>LS</th><th>LF</th>" +
        "<th>H</th><th>¿Crítica?</th></tr></thead><tbody>";

    act.forEach(function (a) {
        h += "<tr" + (a.critica ? " class=\"pert-fila-critica\"" : "") +
            "><th>" + a.id + "</th><td>" +
            (a.pred.length ? a.pred.join(", ") : "—") + "</td><td>" +
            a.a + "</td><td>" + a.m + "</td><td>" + a.b + "</td><td>" +
            f2(a.te) + "</td><td>" + f4(a.v) + "</td><td>" +
            f2(a.ES) + "</td><td>" + f2(a.EF) + "</td><td>" +
            f2(a.LS) + "</td><td>" + f2(a.LF) + "</td><td>" +
            f2(a.H) + "</td><td>" +
            (a.critica ? "<strong class=\"pert-si\">Sí</strong>" : "No") +
            "</td></tr>";
    });

    h += "</tbody></table></div>";

    /* Diagrama */

    h += "<h3>Diagrama de red</h3>" +
        "<p class=\"pert-leyenda-texto\">Cada actividad muestra " +
        "<strong>ES | EF</strong> arriba, su nombre y " +
        "t<sub>e</sub> al centro, y <strong>LS | LF</strong> abajo. " +
        "En rojo, la ruta crítica.</p>" +
        "<div class=\"pert-diagrama\">" + pertDiagrama(r) + "</div>" +
        "<div class=\"pert-leyenda\">" +
        "<span><i class=\"pert-muestra critico\"></i> Actividad crítica</span>" +
        "<span><i class=\"pert-muestra\"></i> Actividad con holgura</span>" +
        "</div>";

    /* Procedimiento */

    h += "<h3>Procedimiento paso a paso</h3>" + pertPasos(r);

    return h;
}

/* =====================================================
   TABLA DE ENTRADA
   ===================================================== */

function pertIdDefecto(i) {
    return i < 26 ? String.fromCharCode(65 + i) : "T" + (i + 1);
}

function pertFilaHTML(i, v) {
    const d = v || {};
    const val = function (x, def) {
        return pertEsc(x !== undefined ? x : def);
    };

    return "<tr>" +
        "<td><input class=\"pert-id\" type=\"text\" maxlength=\"6\" " +
        "value=\"" + val(d.id, pertIdDefecto(i)) + "\" " +
        "aria-label=\"Nombre de la actividad " + (i + 1) + "\"></td>" +
        "<td><input class=\"pert-desc\" type=\"text\" maxlength=\"60\" " +
        "value=\"" + val(d.desc, "") + "\" " +
        "aria-label=\"Descripción de la actividad " + (i + 1) + "\"></td>" +
        "<td><input class=\"pert-pred\" type=\"text\" " +
        "placeholder=\"—\" value=\"" + val(d.pred, "") + "\" " +
        "aria-label=\"Predecesoras de la actividad " + (i + 1) + "\"></td>" +
        "<td><input class=\"pert-a\" type=\"number\" min=\"0\" " +
        "step=\"any\" value=\"" + val(d.a, "") + "\" " +
        "aria-label=\"Tiempo optimista de la actividad " + (i + 1) + "\"></td>" +
        "<td><input class=\"pert-m\" type=\"number\" min=\"0\" " +
        "step=\"any\" value=\"" + val(d.m, "") + "\" " +
        "aria-label=\"Tiempo más probable de la actividad " + (i + 1) + "\"></td>" +
        "<td><input class=\"pert-b\" type=\"number\" min=\"0\" " +
        "step=\"any\" value=\"" + val(d.b, "") + "\" " +
        "aria-label=\"Tiempo pesimista de la actividad " + (i + 1) + "\"></td>" +
        "</tr>";
}

function pertLeerCrudo() {
    return Array.prototype.map.call(
        document.querySelectorAll("#pertCuerpo tr"),
        function (tr, i) {
            return {
                fila: i + 1,
                id: tr.querySelector(".pert-id").value.trim().toUpperCase(),
                desc: tr.querySelector(".pert-desc").value.trim(),
                pred: tr.querySelector(".pert-pred").value,
                a: tr.querySelector(".pert-a").value,
                m: tr.querySelector(".pert-m").value,
                b: tr.querySelector(".pert-b").value
            };
        }
    );
}

function pertConstruir(n, datos) {
    let html = "";

    for (let i = 0; i < n; i++) {
        html += pertFilaHTML(i, datos ? datos[i] : undefined);
    }

    document.getElementById("pertCuerpo").innerHTML = html;
    document.getElementById("pertModelo").classList.remove("oculto");
    pertOcultarResultados();
}

function pertOcultarResultados() {
    document.getElementById("pertResultados").classList.add("oculto");
    document.getElementById("pertError").classList.add("oculto");
}

function pertMostrarError(mensaje) {
    const caja = document.getElementById("pertError");

    caja.textContent = mensaje;
    caja.classList.remove("oculto");
    caja.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* =====================================================
   ACCIONES DE LOS BOTONES
   ===================================================== */

function pertGenerar() {
    const n = parseInt(document.getElementById("pertN").value, 10);

    if (!Number.isInteger(n) || n < 1 || n > PERT_MAX) {
        pertConstruir(0);
        document.getElementById("pertModelo").classList.add("oculto");
        pertMostrarError("El número de actividades debe estar " +
            "entre 1 y " + PERT_MAX + ".");
        return;
    }

    const previos = pertLeerCrudo();

    pertConstruir(n, previos.slice(0, n));
}

function pertEjemplo() {
    const datos = [
        { id: "A", desc: "Diseño", pred: "", a: 2, m: 4, b: 6 },
        { id: "B", desc: "Compra de materiales", pred: "A", a: 3, m: 5, b: 7 },
        { id: "C", desc: "Cimientos", pred: "A", a: 4, m: 6, b: 8 },
        { id: "D", desc: "Estructura", pred: "B, C", a: 5, m: 7, b: 15 },
        { id: "E", desc: "Instalaciones", pred: "C", a: 3, m: 4, b: 5 },
        { id: "F", desc: "Acabados", pred: "D, E", a: 2, m: 3, b: 4 }
    ];

    document.getElementById("pertN").value = datos.length;
    document.getElementById("pertD").value = 24;
    pertConstruir(datos.length, datos);
}

function pertLimpiar() {
    document.getElementById("pertN").value = 6;
    document.getElementById("pertD").value = "";
    document.getElementById("pertCuerpo").innerHTML = "";
    document.getElementById("pertModelo").classList.add("oculto");
    document.getElementById("pertContenido").innerHTML = "";
    pertOcultarResultados();
}

function pertResolver() {
    document.getElementById("pertError").classList.add("oculto");

    const validacion = pertValidar(pertLeerCrudo());

    if (validacion.error) {
        document.getElementById("pertResultados")
            .classList.add("oculto");
        pertMostrarError(validacion.error);
        return;
    }

    const textoD = document.getElementById("pertD").value.trim();
    let D = null;

    if (textoD !== "") {
        D = pertNumero(textoD);

        if (D === null || D < 0) {
            document.getElementById("pertResultados")
                .classList.add("oculto");
            pertMostrarError("El tiempo límite D debe ser un número " +
                "mayor o igual a 0 (o déjalo vacío).");
            return;
        }
    }

    const resultado = pertCalcular(validacion.actividades);

    resultado.prob = D === null ? null : pertProbabilidad(resultado, D);

    const panel = document.getElementById("pertResultados");

    document.getElementById("pertContenido").innerHTML =
        pertRenderResultados(resultado);

    panel.classList.remove("oculto");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* Si cambian los datos, los resultados anteriores ya no aplican */

(function () {
    if (typeof document === "undefined") {
        return;
    }

    const cuerpo = document.getElementById("pertCuerpo");

    if (cuerpo) {
        cuerpo.addEventListener("input", pertOcultarResultados);
    }

    const campoD = document.getElementById("pertD");

    if (campoD) {
        campoD.addEventListener("input", pertOcultarResultados);
    }
})();

/* Exportación para pruebas en Node */

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        pertValidar: pertValidar,
        pertCalcular: pertCalcular,
        pertDiagrama: pertDiagrama,
        pertPasos: pertPasos,
        pertNormalCDF: pertNormalCDF,
        pertProbabilidad: pertProbabilidad,
        pertRenderResultados: pertRenderResultados
    };
}