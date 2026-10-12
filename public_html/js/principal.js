
/*
 * AGUA SALVAVIDAS
 * NAVEGACIÓN PRINCIPAL
 * FASE II - 2026
 */

"use strict";

function abrirMetodo(metodo) {

    switch (metodo) {

        case "grafico":
            window.location.href =
                "paginas/grafico.html";
            break;

        case "simplex":
            window.location.href =
                "paginas/simplex.html";
            break;

        case "mgrande":
            window.location.href =
                "paginas/mgrande.html";
            break;

        case "noroeste":
            window.location.href =
                "paginas/noroeste.html";
            break;

        case "dualidad":
            window.location.href =
                "paginas/dualidad.html";
            break;

        case "sensibilidad":
            window.location.href =
                "paginas/sensibilidad.html";
            break;
            
        case "modi":
            window.location.href =
               "paginas/modi.html";
            break;
  

        case "transporte":
            window.location.href =
                "paginas/transporte.html";
            break;

        default:
            alert("Método no disponible.");
            break;
    }
}
