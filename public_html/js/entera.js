/*
 * GREAT VALUE
 * MÓDULO PROGRAMACIÓN ENTERA
 * RAMIFICACIÓN Y ACOTAMIENTO (BRANCH AND BOUND)
 * FASE III - 2026
 *
 * Cada subproblema se resuelve con Simplex de dos fases.
 * Se muestra el árbol, las podas y la solución óptima.
 */

"use strict";

const ENT_MAX_VAR = 8;
const ENT_MAX_RES = 10;
const ENT_MAX_NODOS = 300;
const ENT_EPS = 1e-9;
const ENT_INT_TOL = 1e-6;

/* ========== UTILIDADES ========== */

function entEsc(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
        return {
            "&": "&amp;", "<": "&lt;", ">": "&gt;",
            "\"": "&quot;", "'": "&#39;"
        }[c];
    });
}

function entRed(x) {
    return Math.round(x * 1e9) / 1e9 + 0;
}

function entFmt(x) {
    const v = entRed(x);
    if (Math.abs(v) < ENT_EPS) { return "0"; }
    return String(parseFloat(v.toFixed(4)));
}

function entFmt2(x) {
    const v = entRed(x);
    if (Math.abs(v) < ENT_EPS) { return "0"; }
    return String(parseFloat(v.toFixed(2)));
}

function entNumero(texto) {
    const t = String(texto).trim().replace(",", ".");
    if (t === "") { return null; }
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
}

function entVar(j) {
    return "x<sub>" + (j + 1) + "</sub>";
}

function entSimbolo(op) {
    return op === "<=" ? "≤" : (op === ">=" ? "≥" : "=");
}

/* Expresión lineal: 8x1 + 5x2 */
function entExpr(coefs, plano) {
    let s = "";

    coefs.forEach(function (v, j) {
        if (Math.abs(v) < ENT_EPS) { return; }

        const mag = Math.abs(v);
        const coef = Math.abs(mag - 1) < ENT_EPS ? "" : entFmt(mag);
        const nombre = plano ? "x" + (j + 1) : entVar(j);

        if (s === "") {
            s += (v < 0 ? "−" : "") + coef + nombre;
        } else {
            s += (v < 0 ? " − " : " + ") + coef + nombre;
        }
    });

    return s === "" ? "0" : s;
}

function entSolTexto(x, plano, f) {
    const fmt = f || entFmt;

    return x.map(function (v, j) {
        return (plano ? "x" + (j + 1) : entVar(j)) + " = " + fmt(v);
    }).join(plano ? "  " : ", ");
}

function entRamaTexto(rama, plano) {
    return (plano ? "x" + (rama.j + 1) : entVar(rama.j)) + " " +
        entSimbolo(rama.op) + " " + rama.val;
}

/* ========== SIMPLEX DE DOS FASES (SUBPROBLEMAS) ==========
   Maximiza c·x  con  A x (≤, ≥, =) b  y  x ≥ 0
   Regla de Bland para evitar ciclos. */

function entPivotar(T, fila, col, total) {
    const p = T[fila][col];

    for (let j = 0; j <= total; j++) {
        T[fila][j] /= p;
    }

    for (let i = 0; i < T.length; i++) {
        if (i === fila) { continue; }

        const f = T[i][col];

        if (Math.abs(f) < 1e-15) { continue; }

        for (let j = 0; j <= total; j++) {
            T[i][j] -= f * T[fila][j];
        }
    }
}

function entSimplexCorrer(T, base, costo, permitido, total) {
    const m = T.length;

    for (let it = 0; it < 5000; it++) {
        let entra = -1;

        for (let j = 0; j < total; j++) {
            if (!permitido[j] || base.indexOf(j) >= 0) { continue; }

            let r = costo[j];

            for (let i = 0; i < m; i++) {
                r -= costo[base[i]] * T[i][j];
            }

            if (r > 1e-9) {
                entra = j;
                break;
            }
        }

        if (entra < 0) { return "optimo"; }

        let sale = -1;
        let mejor = Infinity;

        for (let i = 0; i < m; i++) {
            if (T[i][entra] > 1e-9) {
                const q = T[i][total] / T[i][entra];

                if (q < mejor - 1e-12 ||
                    (Math.abs(q - mejor) <= 1e-12 &&
                     sale >= 0 && base[i] < base[sale])) {
                    mejor = q;
                    sale = i;
                }
            }
        }

        if (sale < 0) { return "noacotado"; }

        entPivotar(T, sale, entra, total);
        base[sale] = entra;
    }

    return "limite";
}

function entSimplexLP(c, restr, n) {
    const m = restr.length;

    const filas = restr.map(function (r) {
        let a = r.a.slice();
        let b = r.b;
        let op = r.op;

        if (b < 0) {
            a = a.map(function (v) { return -v; });
            b = -b;
            op = op === "<=" ? ">=" : (op === ">=" ? "<=" : "=");
        }

        return { a: a, op: op, b: b };
    });

    let nHolg = 0;
    let nArt = 0;

    filas.forEach(function (f) {
        if (f.op !== "=") { nHolg++; }
        if (f.op !== "<=") { nArt++; }
    });

    const total = n + nHolg + nArt;
    const T = [];
    const base = [];
    const art = [];

    let sIdx = n;
    let aIdx = n + nHolg;

    filas.forEach(function (f) {
        const row = new Array(total + 1).fill(0);

        for (let j = 0; j < n; j++) { row[j] = f.a[j]; }

        row[total] = f.b;

        if (f.op === "<=") {
            row[sIdx] = 1;
            base.push(sIdx);
            sIdx++;
        } else if (f.op === ">=") {
            row[sIdx] = -1;
            sIdx++;
            row[aIdx] = 1;
            base.push(aIdx);
            art.push(aIdx);
            aIdx++;
        } else {
            row[aIdx] = 1;
            base.push(aIdx);
            art.push(aIdx);
            aIdx++;
        }

        T.push(row);
    });

    /* Fase I: factibilidad */

    if (art.length > 0) {
        const costo1 = new Array(total).fill(0);

        art.forEach(function (j) { costo1[j] = -1; });

        const permitido1 = new Array(total).fill(true);
        const est1 = entSimplexCorrer(T, base, costo1, permitido1, total);

        if (est1 === "limite") { return { estado: "error" }; }

        let suma = 0;

        for (let i = 0; i < m; i++) {
            if (art.indexOf(base[i]) >= 0) { suma += T[i][total]; }
        }

        if (suma > 1e-7) { return { estado: "infactible" }; }

        /* Sacar artificiales que quedaron en la base */

        for (let i = 0; i < m; i++) {
            if (art.indexOf(base[i]) < 0) { continue; }

            for (let j = 0; j < n + nHolg; j++) {
                if (Math.abs(T[i][j]) > 1e-9 && base.indexOf(j) < 0) {
                    entPivotar(T, i, j, total);
                    base[i] = j;
                    break;
                }
            }
        }
    }

    /* Fase II: optimizar */

    const costo2 = new Array(total).fill(0);

    for (let j = 0; j < n; j++) { costo2[j] = c[j]; }

    const permitido2 = new Array(total).fill(false);

    for (let j = 0; j < n + nHolg; j++) { permitido2[j] = true; }

    const est2 = entSimplexCorrer(T, base, costo2, permitido2, total);

    if (est2 === "noacotado") { return { estado: "noacotado" }; }
    if (est2 === "limite") { return { estado: "error" }; }

    const x = new Array(n).fill(0);

    for (let i = 0; i < m; i++) {
        if (base[i] < n) { x[base[i]] = Math.max(0, T[i][total]); }
    }

    let z = 0;

    for (let j = 0; j < n; j++) { z += c[j] * x[j]; }

    return { estado: "optimo", x: x, z: z };
}

/* ========== VALIDACIÓN ========== */

function entValidar(crudo, objetivo, estrategia) {
    const n = crudo.c.length;
    const m = crudo.A.length;

    if (n < 1 || m < 1) {
        return { error: "El modelo necesita al menos una variable " +
            "y una restricción." };
    }

    const c = [];

    for (let j = 0; j < n; j++) {
        const v = entNumero(crudo.c[j]);

        if (v === null) {
            return { error: "El coeficiente de x" + (j + 1) +
                " en la función objetivo debe ser un número." };
        }

        c.push(v);
    }

    if (c.every(function (v) { return v === 0; })) {
        return { error: "La función objetivo debe tener al menos " +
            "un coeficiente distinto de cero." };
    }

    const A = [];
    const b = [];

    for (let i = 0; i < m; i++) {
        const fila = [];

        for (let j = 0; j < n; j++) {
            const v = entNumero(crudo.A[i][j]);

            if (v === null) {
                return { error: "Restricción " + (i + 1) +
                    ": el coeficiente de x" + (j + 1) +
                    " debe ser un número." };
            }

            fila.push(v);
        }

        const rhs = entNumero(crudo.b[i]);

        if (rhs === null) {
            return { error: "Restricción " + (i + 1) +
                ": el lado derecho debe ser un número." };
        }

        A.push(fila);
        b.push(rhs);
    }

    return {
        modelo: {
            n: n,
            m: m,
            c: c,
            A: A,
            ops: crudo.ops.slice(),
            b: b,
            ints: crudo.ints.slice(),
            objetivo: objetivo === "min" ? "min" : "max",
            estrategia: estrategia === "mejor" ? "mejor" : "dfs"
        }
    };
}

/* ========== RAMIFICACIÓN Y ACOTAMIENTO ========== */

function entResolverEntera(modelo) {
    const n = modelo.n;
    const dir = modelo.objetivo === "max" ? 1 : -1;

    const cInt = modelo.c.map(function (v) { return dir * v; });

    const base = modelo.A.map(function (fila, i) {
        return { a: fila.slice(), op: modelo.ops[i], b: modelo.b[i] };
    });

    function resolver(camino) {
        const restr = base.concat(camino.map(function (br) {
            const a = new Array(n).fill(0);
            a[br.j] = 1;
            return { a: a, op: br.op, b: br.val };
        }));

        const lp = entSimplexLP(cInt, restr, n);

        if (lp.estado === "optimo") {
            lp.x = lp.x.map(function (v, j) {
                const r = Math.round(v);

                if (modelo.ints[j] && Math.abs(v - r) < ENT_INT_TOL) {
                    return r;
                }

                return entRed(v);
            });

            lp.zInt = entRed(cInt.reduce(function (s, cj, j) {
                return s + cj * lp.x[j];
            }, 0));

            lp.zReal = entRed(dir * lp.zInt);
        }

        return lp;
    }

    const nodos = [];
    const activos = [];
    let contador = 0;

    function crear(padre, rama) {
        const camino = padre ? padre.camino.concat([rama]) : [];

        const nd = {
            id: ++contador,
            padre: padre ? padre.id : null,
            profundidad: padre ? padre.profundidad + 1 : 0,
            rama: rama,
            camino: camino,
            hijos: [],
            orden: null,
            tipo: null,
            decision: "",
            lp: null
        };

        nd.lp = resolver(camino);
        nodos.push(nd);

        if (padre) { padre.hijos.push(nd.id); }

        if (nd.lp.estado === "infactible") {
            nd.tipo = "infactible";
            nd.decision = "Infactible: las restricciones del subproblema " +
                "se contradicen. Se descarta.";
        } else if (nd.lp.estado === "optimo") {
            activos.push(nd);
        } else {
            nd.tipo = nd.lp.estado;
        }

        return nd;
    }

    const R = {
        modelo: modelo,
        nodos: nodos,
        incumbente: null,
        historial: [],
        estado: "optimo",
        limite: false
    };

    const raiz = crear(null, null);

    if (raiz.lp.estado === "noacotado") {
        R.estado = "noacotado";
        return R;
    }

    if (raiz.lp.estado === "error") {
        R.estado = "error";
        return R;
    }

    if (raiz.lp.estado === "infactible") {
        R.estado = "sinsolucion";
        return R;
    }

    let procesados = 0;

    while (activos.length > 0) {

        if (nodos.length >= ENT_MAX_NODOS) {
            R.limite = true;
            break;
        }

        /* Selección del siguiente nodo */

        let idx = 0;

        for (let k = 1; k < activos.length; k++) {
            const a = activos[k];
            const b = activos[idx];

            if (modelo.estrategia === "mejor") {
                if (a.lp.zInt > b.lp.zInt + ENT_EPS ||
                    (Math.abs(a.lp.zInt - b.lp.zInt) <= ENT_EPS &&
                     a.id < b.id)) {
                    idx = k;
                }
            } else {
                if (a.profundidad > b.profundidad ||
                    (a.profundidad === b.profundidad && a.id < b.id)) {
                    idx = k;
                }
            }
        }

        const nodo = activos.splice(idx, 1)[0];
        nodo.orden = ++procesados;

        const inc = R.incumbente;

        /* 1. Poda por cota */

        if (inc && nodo.lp.zInt <= inc.zInt + ENT_EPS) {
            nodo.tipo = "podado";
            nodo.decision = "Podado por cota: Z = " + entFmt(nodo.lp.zReal) +
                " no mejora la mejor solución entera (Z = " +
                entFmt(inc.zReal) + ").";
            continue;
        }

        /* 2. ¿Es entera? */

        let frac = -1;

        for (let j = 0; j < n; j++) {
            if (modelo.ints[j] &&
                Math.abs(nodo.lp.x[j] - Math.round(nodo.lp.x[j])) >
                ENT_INT_TOL) {
                frac = j;
                break;
            }
        }

        if (frac === -1) {
            nodo.tipo = "entero";

            R.incumbente = {
                nodo: nodo.id,
                zInt: nodo.lp.zInt,
                zReal: nodo.lp.zReal,
                x: nodo.lp.x.slice()
            };

            R.historial.push({
                nodo: nodo.id,
                orden: nodo.orden,
                zReal: nodo.lp.zReal,
                x: nodo.lp.x.slice()
            });

            nodo.decision = "Solución entera factible. " +
                (inc ? "Mejora la anterior" : "Primera solución entera") +
                ": nueva mejor solución, Z = " + entFmt(nodo.lp.zReal) + ".";
            continue;
        }

        /* 3. Ramificar */

        if (nodos.length + 2 > ENT_MAX_NODOS) {
            R.limite = true;
            nodo.tipo = "pendiente";
            nodo.decision = "No se ramificó: se alcanzó el límite de " +
                ENT_MAX_NODOS + " nodos.";
            break;
        }

        const v = nodo.lp.x[frac];
        const piso = Math.floor(v);

        const izq = crear(nodo, { j: frac, op: "<=", val: piso });
        const der = crear(nodo, { j: frac, op: ">=", val: piso + 1 });

        nodo.tipo = "ramificado";
        nodo.decision = "Ramificar: " + entVar(frac) + " = " + entFmt(v) +
            " es fraccionaria. Se crean el nodo " + izq.id + " (" +
            entRamaTexto(izq.rama) + ") y el nodo " + der.id + " (" +
            entRamaTexto(der.rama) + ").";
    }

    activos.forEach(function (nd) {
        nd.tipo = "pendiente";
        nd.decision = "No explorado (se alcanzó el límite de nodos).";
    });

    if (R.limite) {
        R.estado = "limite";
    } else if (!R.incumbente) {
        R.estado = "sinsolucion";
    }

    return R;
}

/* ========== ÁRBOL (SVG) ========== */

function entEtiqueta(nd, esOpt) {
    if (nd.tipo === "entero") { return esOpt ? "ÓPTIMO" : "entero"; }
    if (nd.tipo === "ramificado") { return "ramifica"; }
    if (nd.tipo === "infactible") { return "infactible"; }
    if (nd.tipo === "podado") { return "podado"; }
    return "pendiente";
}

function entClaseNodo(nd, esOpt) {
    if (nd.tipo === "entero") { return esOpt ? "ent-n-opt" : "ent-n-ent"; }
    if (nd.tipo === "ramificado") { return "ent-n-ram"; }
    if (nd.tipo === "infactible") { return "ent-n-inf"; }
    if (nd.tipo === "podado") { return "ent-n-pod"; }
    return "ent-n-pend";
}

function entArbol(R) {
    const nodos = R.nodos;
    const porId = new Map();

    nodos.forEach(function (nd) { porId.set(nd.id, nd); });

    const n = R.modelo.n;
    const NW = 172;
    const HG = 22;
    const VG = 64;
    const PAD = 20;
    const lineasX = Math.ceil(n / 3);
    const NH = 46 + 14 * lineasX;

    const pos = new Map();
    let hoja = 0;

    function colocar(nd) {
        if (nd.hijos.length === 0) {
            pos.set(nd.id, hoja * (NW + HG));
            hoja++;
            return;
        }

        nd.hijos.forEach(function (id) { colocar(porId.get(id)); });

        const xs = nd.hijos.map(function (id) { return pos.get(id); });

        pos.set(nd.id,
            (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2);
    }

    colocar(nodos[0]);

    const maxProf = Math.max.apply(null, nodos.map(function (nd) {
        return nd.profundidad;
    }));

    const ancho = hoja * (NW + HG) - HG + PAD * 2;
    const alto = PAD * 2 + (maxProf + 1) * NH + maxProf * VG;

    const camino = new Set();

    if (R.incumbente) {
        let cur = porId.get(R.incumbente.nodo);

        while (cur) {
            camino.add(cur.id);
            cur = cur.padre ? porId.get(cur.padre) : null;
        }
    }

    const X = function (nd) { return PAD + pos.get(nd.id); };
    const Y = function (nd) { return PAD + nd.profundidad * (NH + VG); };

    let svg = "<svg class=\"ent-svg\" role=\"img\" " +
        "aria-label=\"Árbol de ramificación y acotamiento\" " +
        "viewBox=\"0 0 " + ancho + " " + alto + "\" " +
        "width=\"" + ancho + "\" height=\"" + alto + "\" " +
        "xmlns=\"http://www.w3.org/2000/svg\">";

    /* Aristas */

    nodos.forEach(function (nd) {
        if (nd.padre === null) { return; }

        const p = porId.get(nd.padre);
        const x1 = X(p) + NW / 2;
        const y1 = Y(p) + NH;
        const x2 = X(nd) + NW / 2;
        const y2 = Y(nd);

        svg += "<line class=\"ent-arista" +
            (camino.has(nd.id) ? " camino" : "") + "\" x1=\"" + x1 +
            "\" y1=\"" + y1 + "\" x2=\"" + x2 + "\" y2=\"" + y2 + "\"/>";
    });

    /* Etiquetas de las aristas */

    nodos.forEach(function (nd) {
        if (nd.padre === null) { return; }

        const p = porId.get(nd.padre);
        const x1 = X(p) + NW / 2;
        const y1 = Y(p) + NH;
        const x2 = X(nd) + NW / 2;
        const y2 = Y(nd);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const texto = entRamaTexto(nd.rama, true);
        const w = texto.length * 6.6 + 12;

        svg += "<g class=\"ent-etq" +
            (camino.has(nd.id) ? " camino" : "") + "\">" +
            "<rect x=\"" + (mx - w / 2) + "\" y=\"" + (my - 9) +
            "\" width=\"" + w + "\" height=\"18\" rx=\"9\"/>" +
            "<text x=\"" + mx + "\" y=\"" + (my + 4) +
            "\" text-anchor=\"middle\">" + texto + "</text></g>";
    });

    /* Nodos */

    nodos.forEach(function (nd) {
        const esOpt = R.incumbente && R.incumbente.nodo === nd.id;
        const x = X(nd);
        const y = Y(nd);

        let tip = "Nodo " + nd.id +
            (nd.camino.length
                ? " · " + nd.camino.map(function (br) {
                    return entRamaTexto(br, true);
                }).join(", ")
                : " · relajación lineal");

        if (nd.lp && nd.lp.estado === "optimo") {
            tip += " · Z = " + entFmt(nd.lp.zReal) + " · " +
                entSolTexto(nd.lp.x, true);
        }

        svg += "<g class=\"ent-nodo " + entClaseNodo(nd, esOpt) +
            (camino.has(nd.id) ? " camino" : "") + "\">" +
            "<title>" + entEsc(tip) + "</title>" +
            "<rect x=\"" + x + "\" y=\"" + y + "\" width=\"" + NW +
            "\" height=\"" + NH + "\" rx=\"10\"/>" +
            "<text class=\"ent-t-id\" x=\"" + (x + 10) + "\" y=\"" +
            (y + 17) + "\">Nodo " + nd.id + "</text>" +
            "<text class=\"ent-t-est\" x=\"" + (x + NW - 10) +
            "\" y=\"" + (y + 17) + "\" text-anchor=\"end\">" +
            entEtiqueta(nd, esOpt) + "</text>";

        if (nd.lp && nd.lp.estado === "optimo") {
            svg += "<text class=\"ent-t-z\" x=\"" + (x + 10) + "\" y=\"" +
                (y + 35) + "\">Z = " + entFmt2(nd.lp.zReal) + "</text>";

            for (let l = 0; l < lineasX; l++) {
                const partes = [];

                for (let j = l * 3; j < Math.min(n, l * 3 + 3); j++) {
                    partes.push("x" + (j + 1) + "=" + entFmt2(nd.lp.x[j]));
                }

                svg += "<text class=\"ent-t-x\" x=\"" + (x + 10) +
                    "\" y=\"" + (y + 52 + l * 14) + "\">" +
                    partes.join("  ") + "</text>";
            }
        } else {
            svg += "<text class=\"ent-t-z\" x=\"" + (x + 10) + "\" y=\"" +
                (y + 35) + "\">Sin solución</text>";
        }

        svg += "</g>";
    });

    return svg + "</svg>";
}

/* ========== PROCEDIMIENTO ========== */

function entModeloHTML(m) {
    let h = "<p class=\"ent-formula\"><strong>" +
        (m.objetivo === "max" ? "Maximizar" : "Minimizar") +
        "</strong> Z = " + entExpr(m.c) + "</p>" +
        "<p><strong>Sujeto a:</strong></p><ul class=\"ent-lista\">";

    m.A.forEach(function (fila, i) {
        h += "<li>" + entExpr(fila) + " " + entSimbolo(m.ops[i]) +
            " " + entFmt(m.b[i]) + "</li>";
    });

    const enteras = [];
    const continuas = [];

    m.ints.forEach(function (esEntera, j) {
        (esEntera ? enteras : continuas).push(entVar(j));
    });

    h += "<li>" + m.c.map(function (_, j) { return entVar(j); })
        .join(", ") + " ≥ 0</li></ul>";

    h += "<p>" + (enteras.length
        ? "Variables enteras: <strong>" + enteras.join(", ") + "</strong>. "
        : "") +
        (continuas.length
            ? "Variables continuas: <strong>" + continuas.join(", ") +
              "</strong>."
            : "") + "</p>";

    return h;
}

function entClaseFila(nd, esOpt) {
    if (esOpt) { return "ent-fila-opt"; }
    if (nd.tipo === "infactible") { return "ent-fila-inf"; }
    if (nd.tipo === "podado") { return "ent-fila-pod"; }
    return "";
}

function entTablaNodos(R) {
    let h = "<div class=\"sen-tabla-scroll\">" +
        "<table class=\"sen-tabla\"><thead><tr><th>Nodo</th>" +
        "<th>Orden</th><th>Padre</th><th>Restricciones añadidas</th>" +
        "<th>Z (relajación)</th><th>Solución de la relajación</th>" +
        "<th>Decisión</th></tr></thead><tbody>";

    R.nodos.forEach(function (nd) {
        const esOpt = R.incumbente && R.incumbente.nodo === nd.id;
        const ok = nd.lp && nd.lp.estado === "optimo";

        h += "<tr class=\"" + entClaseFila(nd, esOpt) + "\"><th>" +
            nd.id + "</th><td>" + (nd.orden !== null ? nd.orden : "—") +
            "</td><td>" + (nd.padre !== null ? nd.padre : "—") + "</td><td>" +
            (nd.camino.length
                ? nd.camino.map(function (br) {
                    return entRamaTexto(br);
                }).join(", ")
                : "Ninguna (relajación lineal)") + "</td><td>" +
            (ok ? "<strong>" + entFmt(nd.lp.zReal) + "</strong>" : "—") +
            "</td><td>" + (ok ? entSolTexto(nd.lp.x) : "—") +
            "</td><td class=\"ent-decision\">" + nd.decision + "</td></tr>";
    });

    return h + "</tbody></table></div>";
}

function entVerificacion(R) {
    const m = R.modelo;
    const x = R.incumbente.x;

    let h = "<div class=\"sen-tabla-scroll\">" +
        "<table class=\"sen-tabla\"><thead><tr><th></th>" +
        "<th>Sustitución</th><th>¿Cumple?</th></tr></thead><tbody>";

    function sustitucion(coefs) {
        const partes = [];
        let total = 0;

        coefs.forEach(function (a, j) {
            if (Math.abs(a) < ENT_EPS) { return; }

            partes.push(entFmt(a) + "(" + entFmt(x[j]) + ")");
            total += a * x[j];
        });

        return {
            texto: partes.length ? partes.join(" + ") : "0",
            total: entRed(total)
        };
    }

    let todo = true;

    m.A.forEach(function (fila, i) {
        const s = sustitucion(fila);
        const op = m.ops[i];
        const dif = s.total - m.b[i];

        const ok = op === "<=" ? dif <= 1e-6
            : (op === ">=" ? dif >= -1e-6 : Math.abs(dif) <= 1e-6);

        if (!ok) { todo = false; }

        h += "<tr><th>Restricción " + (i + 1) + "</th><td>" + s.texto +
            " = <strong>" + entFmt(s.total) + "</strong> " +
            entSimbolo(op) + " " + entFmt(m.b[i]) + "</td><td>" +
            (ok ? "<strong class=\"ent-si\">✓</strong>" : "✗") +
            "</td></tr>";
    });

    const sz = sustitucion(m.c);

    h += "<tr><th>Función objetivo</th><td>Z = " + sz.texto +
        " = <strong>" + entFmt(sz.total) + "</strong></td><td>" +
        (Math.abs(sz.total - R.incumbente.zReal) < 1e-6
            ? "<strong class=\"ent-si\">✓</strong>" : "✗") + "</td></tr>";

    let enteras = true;

    m.ints.forEach(function (esEntera, j) {
        if (!esEntera) { return; }

        const ok = Math.abs(x[j] - Math.round(x[j])) < ENT_INT_TOL;

        if (!ok) { enteras = false; }

        h += "<tr><th>Integralidad de " + entVar(j) + "</th><td>" +
            entVar(j) + " = " + entFmt(x[j]) + "</td><td>" +
            (ok ? "<strong class=\"ent-si\">✓</strong>" : "✗") + "</td></tr>";
    });

    h += "</tbody></table></div>";

    return { html: h, ok: todo && enteras };
}

function entRender(R) {
    const m = R.modelo;
    const raiz = R.nodos[0];
    const maxim = m.objetivo === "max";
    const inc = R.incumbente;
    let paso = 0;

    function bloque(titulo, cuerpo) {
        paso++;

        return "<div class=\"sen-iteracion\"><h4>Paso " + paso +
            " · " + titulo + "</h4>" + cuerpo + "</div>";
    }

    let h = "";

    /* Resumen */

    const esRaizOk = raiz.lp && raiz.lp.estado === "optimo";

    h += "<div class=\"pert-kpis\">";

    if (inc) {
        h += "<div class=\"pert-kpi\"><span>" +
            (maxim ? "Z máximo (entero)" : "Z mínimo (entero)") +
            "</span><strong>" + entFmt(inc.zReal) + "</strong></div>" +
            "<div class=\"pert-kpi\"><span>Solución óptima</span>" +
            "<strong class=\"ent-kpi-sol\">" + entSolTexto(inc.x) +
            "</strong></div>";
    } else {
        h += "<div class=\"pert-kpi\"><span>Resultado</span>" +
            "<strong class=\"ent-kpi-sol\">Sin solución entera" +
            "</strong></div>";
    }

    h += "<div class=\"pert-kpi\"><span>Nodos generados</span><strong>" +
        R.nodos.length + "</strong></div>" +
        "<div class=\"pert-kpi\"><span>Cota de la relajación (nodo 1)" +
        "</span><strong>" + (esRaizOk ? entFmt(raiz.lp.zReal) : "—") +
        "</strong></div></div>";

    if (R.estado === "limite") {
        h += "<div class=\"sen-nota\"><strong>Límite alcanzado:</strong> " +
            "se detuvo la búsqueda al generar " + ENT_MAX_NODOS +
            " nodos. " + (inc
                ? "La mejor solución entera encontrada hasta ahora " +
                  "puede no ser la óptima."
                : "No se encontró ninguna solución entera todavía.") +
            "</div>";
    }

    if (R.estado === "sinsolucion") {
        h += "<div class=\"sen-error\">El problema no tiene ninguna " +
            "solución entera factible" +
            (raiz.lp.estado === "infactible"
                ? " (ni siquiera la relajación lineal es factible)." : ".") +
            "</div>";
    }

    /* Árbol */

    h += "<h3>Árbol de ramificación y acotamiento</h3>" +
        "<p class=\"ent-leyenda-texto\">Cada nodo muestra el valor Z y la " +
        "solución de su relajación lineal. Sobre cada rama está la " +
        "restricción que se añadió. El camino hasta la solución óptima va " +
        "en verde.</p>" +
        "<div class=\"ent-arbol\">" + entArbol(R) + "</div>" +
        "<div class=\"ent-leyenda\">" +
        "<span><i class=\"ent-muestra ent-n-ram\"></i> Se ramifica</span>" +
        "<span><i class=\"ent-muestra ent-n-ent\"></i> Entero factible</span>" +
        "<span><i class=\"ent-muestra ent-n-opt\"></i> Óptimo</span>" +
        "<span><i class=\"ent-muestra ent-n-pod\"></i> Podado por cota</span>" +
        "<span><i class=\"ent-muestra ent-n-inf\"></i> Infactible</span>" +
        "</div>";

    /* Procedimiento */

    h += "<h3>Procedimiento paso a paso</h3>";

    h += bloque("Modelo del problema", entModeloHTML(m));

    let cuerpo2;

    if (esRaizOk) {
        cuerpo2 = "<p>Se ignora la condición de integralidad y se resuelve " +
            "el problema como programa lineal con Simplex.</p>" +
            "<p class=\"ent-formula\">" + entSolTexto(raiz.lp.x) +
            " &nbsp;→&nbsp; Z = <strong>" + entFmt(raiz.lp.zReal) +
            "</strong></p>" +
            "<p>Este valor es una <strong>cota " +
            (maxim ? "superior" : "inferior") + "</strong>: ninguna " +
            "solución entera puede ser " + (maxim ? "mayor" : "menor") +
            " que " + entFmt(raiz.lp.zReal) + ".</p>";
    } else if (raiz.lp.estado === "infactible") {
        cuerpo2 = "<p>La relajación lineal no tiene solución factible, " +
            "así que el problema entero tampoco.</p>";
    } else {
        cuerpo2 = "<p>No se pudo resolver la relajación lineal.</p>";
    }

    h += bloque("Relajación lineal (nodo 1)", cuerpo2);

    h += bloque("Reglas de ramificación y acotamiento",
        "<ul class=\"ent-lista\">" +
        "<li><strong>Ramificar:</strong> se toma la primera variable " +
        "entera con valor fraccionario " + "x<sub>j</sub> = v y se crean " +
        "dos subproblemas: uno con x<sub>j</sub> ≤ ⌊v⌋ y otro con " +
        "x<sub>j</sub> ≥ ⌈v⌉.</li>" +
        "<li><strong>Podar (infactible):</strong> si el subproblema no " +
        "tiene solución, se descarta.</li>" +
        "<li><strong>Podar (cota):</strong> si el Z de la relajación no " +
        "mejora la mejor solución entera conocida, ninguna solución de " +
        "ese nodo puede mejorarla.</li>" +
        "<li><strong>Solución entera:</strong> si la relajación ya cumple " +
        "la integralidad, se guarda como mejor solución.</li>" +
        "<li><strong>Orden de exploración:</strong> " +
        (m.estrategia === "dfs"
            ? "profundidad primero (se baja por el árbol antes de " +
              "volver a nodos anteriores)."
            : "mejor cota primero (siempre se explora el nodo " +
              "pendiente con la mejor cota).") + "</li></ul>");

    h += bloque("Exploración de nodos",
        "<p>El <strong>orden</strong> indica en qué momento se explora " +
        "cada nodo; los infactibles se descartan al crearlos.</p>" +
        entTablaNodos(R));

    if (R.historial.length) {
        let t = "<div class=\"sen-tabla-scroll\">" +
            "<table class=\"sen-tabla\"><thead><tr><th>Nodo</th>" +
            "<th>Orden</th><th>Solución</th><th>Z</th></tr></thead><tbody>";

        R.historial.forEach(function (e) {
            t += "<tr><th>" + e.nodo + "</th><td>" + e.orden + "</td><td>" +
                entSolTexto(e.x) + "</td><td><strong>" + entFmt(e.zReal) +
                "</strong></td></tr>";
        });

        t += "</tbody></table></div>";

        h += bloque("Evolución de la mejor solución entera",
            "<p>Cada vez que se encuentra una solución entera mejor, " +
            "se actualiza la cota usada para podar.</p>" + t);
    }

    if (inc) {
        const ver = entVerificacion(R);

        h += bloque("Solución óptima y comprobación",
            "<p class=\"ent-formula\">" + entSolTexto(inc.x) +
            " &nbsp;→&nbsp; Z = <strong>" + entFmt(inc.zReal) +
            "</strong> (encontrada en el nodo " + inc.nodo + ")</p>" +
            "<p>Se sustituye la solución en el modelo original:</p>" +
            ver.html +
            "<ul class=\"ent-checks\"><li>" + (ver.ok ? "✓" : "✗") +
            " La solución cumple todas las restricciones y la " +
            "integralidad</li>" +
            (esRaizOk
                ? "<li>✓ Z entero = " + entFmt(inc.zReal) +
                  (maxim ? " ≤ " : " ≥ ") + entFmt(raiz.lp.zReal) +
                  " = cota de la relajación lineal</li>"
                : "") + "</ul>");
    }

    return h;
}

/* ========== TABLA DE ENTRADA ========== */

function entLeerCrudo() {
    const filas = document.querySelectorAll("#entCuerpo tr.ent-fila");

    return {
        c: Array.prototype.map.call(
            document.querySelectorAll("#entCuerpo .ent-c"),
            function (el) { return el.value; }
        ),
        ints: Array.prototype.map.call(
            document.querySelectorAll("#entCuerpo .ent-int"),
            function (el) { return el.checked; }
        ),
        A: Array.prototype.map.call(filas, function (tr) {
            return Array.prototype.map.call(
                tr.querySelectorAll(".ent-a"),
                function (el) { return el.value; }
            );
        }),
        ops: Array.prototype.map.call(filas, function (tr) {
            return tr.querySelector(".ent-op").value;
        }),
        b: Array.prototype.map.call(filas, function (tr) {
            return tr.querySelector(".ent-b").value;
        })
    };
}

function entConstruir(n, m, previo) {
    const p = previo || { c: [], ints: [], A: [], ops: [], b: [] };
    const val = function (x) { return x !== undefined ? entEsc(x) : ""; };

    let cab = "<tr><th></th>";

    for (let j = 0; j < n; j++) {
        cab += "<th>x<sub>" + (j + 1) + "</sub></th>";
    }

    cab += "<th>Signo</th><th>Lado derecho</th></tr>";

    let cuerpo = "<tr class=\"ent-fila-obj\"><th>Función objetivo (Z)</th>";

    for (let j = 0; j < n; j++) {
        cuerpo += "<td><input class=\"ent-c\" type=\"number\" step=\"any\" " +
            "value=\"" + val(p.c[j]) + "\" aria-label=\"Coeficiente de x" +
            (j + 1) + " en la función objetivo\"></td>";
    }

    cuerpo += "<td colspan=\"2\"></td></tr>" +
        "<tr class=\"ent-fila-int\"><th>¿Entera?</th>";

    for (let j = 0; j < n; j++) {
        const marcado = p.ints[j] === undefined ? true : p.ints[j];

        cuerpo += "<td><input class=\"ent-int\" type=\"checkbox\"" +
            (marcado ? " checked" : "") + " aria-label=\"x" + (j + 1) +
            " es entera\"></td>";
    }

    cuerpo += "<td colspan=\"2\"></td></tr>";

    for (let i = 0; i < m; i++) {
        cuerpo += "<tr class=\"ent-fila\"><th>Restricción " + (i + 1) + "</th>";

        for (let j = 0; j < n; j++) {
            const v = p.A[i] ? p.A[i][j] : undefined;

            cuerpo += "<td><input class=\"ent-a\" type=\"number\" " +
                "step=\"any\" value=\"" + val(v) + "\" " +
                "aria-label=\"Restricción " + (i + 1) +
                ", coeficiente de x" + (j + 1) + "\"></td>";
        }

        const op = p.ops[i] || "<=";

        cuerpo += "<td><select class=\"ent-op\" aria-label=\"Signo de la " +
            "restricción " + (i + 1) + "\">" +
            "<option value=\"&lt;=\"" + (op === "<=" ? " selected" : "") +
            ">≤</option>" +
            "<option value=\"&gt;=\"" + (op === ">=" ? " selected" : "") +
            ">≥</option>" +
            "<option value=\"=\"" + (op === "=" ? " selected" : "") +
            ">=</option></select></td>" +
            "<td><input class=\"ent-b\" type=\"number\" step=\"any\" " +
            "value=\"" + val(p.b[i]) + "\" aria-label=\"Lado derecho de la " +
            "restricción " + (i + 1) + "\"></td></tr>";
    }

    document.getElementById("entCabecera").innerHTML = cab;
    document.getElementById("entCuerpo").innerHTML = cuerpo;
    document.getElementById("entModelo").classList.remove("oculto");
    entOcultarResultados();
}

function entOcultarResultados() {
    document.getElementById("entResultados").classList.add("oculto");
    document.getElementById("entError").classList.add("oculto");
}

function entMostrarError(mensaje) {
    const caja = document.getElementById("entError");

    caja.textContent = mensaje;
    caja.classList.remove("oculto");
    caja.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ========== BOTONES ========== */

function entGenerar() {
    const n = parseInt(document.getElementById("entN").value, 10);
    const m = parseInt(document.getElementById("entM").value, 10);

    if (!Number.isInteger(n) || n < 1 || n > ENT_MAX_VAR ||
        !Number.isInteger(m) || m < 1 || m > ENT_MAX_RES) {
        document.getElementById("entModelo").classList.add("oculto");
        entMostrarError("Las variables deben estar entre 1 y " +
            ENT_MAX_VAR + " y las restricciones entre 1 y " +
            ENT_MAX_RES + " (números enteros).");
        return;
    }

    entConstruir(n, m, entLeerCrudo());
}

function entEjemplo() {
    document.getElementById("entN").value = 2;
    document.getElementById("entM").value = 2;
    document.getElementById("entObjetivo").value = "max";
    document.getElementById("entEstrategia").value = "dfs";

    entConstruir(2, 2, {
        c: [8, 5],
        ints: [true, true],
        A: [[1, 1], [9, 5]],
        ops: ["<=", "<="],
        b: [6, 45]
    });
}

function entLimpiar() {
    document.getElementById("entN").value = 2;
    document.getElementById("entM").value = 2;
    document.getElementById("entObjetivo").value = "max";
    document.getElementById("entEstrategia").value = "dfs";
    document.getElementById("entCabecera").innerHTML = "";
    document.getElementById("entCuerpo").innerHTML = "";
    document.getElementById("entContenido").innerHTML = "";
    document.getElementById("entModelo").classList.add("oculto");
    entOcultarResultados();
}

function entResolver() {
    document.getElementById("entError").classList.add("oculto");

    const validacion = entValidar(
        entLeerCrudo(),
        document.getElementById("entObjetivo").value,
        document.getElementById("entEstrategia").value
    );

    if (validacion.error) {
        document.getElementById("entResultados")
            .classList.add("oculto");
        entMostrarError(validacion.error);
        return;
    }

    const R = entResolverEntera(validacion.modelo);

    if (R.estado === "noacotado") {
        document.getElementById("entResultados")
            .classList.add("oculto");
        entMostrarError("La relajación lineal no es acotada: la función " +
            "objetivo puede crecer sin límite. Revisa el modelo o agrega " +
            "restricciones que limiten las variables.");
        return;
    }

    if (R.estado === "error") {
        document.getElementById("entResultados")
            .classList.add("oculto");
        entMostrarError("No se pudo resolver el subproblema. Revisa los " +
            "coeficientes del modelo.");
        return;
    }

    const panel = document.getElementById("entResultados");

    document.getElementById("entContenido").innerHTML = entRender(R);

    panel.classList.remove("oculto");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* Si cambian los datos, los resultados anteriores ya no aplican */
(function () {
    if (typeof document === "undefined") { return; }

    const cuerpo = document.getElementById("entCuerpo");

    if (cuerpo) {
        cuerpo.addEventListener("input", entOcultarResultados);
        cuerpo.addEventListener("change", entOcultarResultados);
    }

    ["entObjetivo", "entEstrategia"].forEach(function (id) {
        const el = document.getElementById(id);

        if (el) {
            el.addEventListener("change", entOcultarResultados);
        }
    });
})();