/* global __FESTIVOS__, __FRANJAS__ -- los sustituye scripts/exportar-prototipo.mjs al exportar */
// Solo para el PROTOTIPO navegable (scripts/exportar-prototipo.mjs): simula las funciones de servidor de la
// reserva en el navegador, porque el prototipo se publica sin servidor. No se crea ninguna cita real.
(function () {
  'use strict';
  var FESTIVOS = __FESTIVOS__;
  var FRANJAS = __FRANJAS__;
  var HORIZONTE = 60;
  var dos = function (n) {
    return (n < 10 ? '0' : '') + n;
  };
  var aISO = function (d) {
    return d.getUTCFullYear() + '-' + dos(d.getUTCMonth() + 1) + '-' + dos(d.getUTCDate());
  };
  var hoyMadrid = function (ahora) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(ahora);
  };
  var sumar = function (iso, dias) {
    var p = iso.split('-').map(Number);
    return aISO(new Date(Date.UTC(p[0], p[1] - 1, p[2] + dias)));
  };
  var diaSemana = function (iso) {
    var p = iso.split('-').map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay();
    return d === 0 ? 7 : d;
  };

  function disponibilidad() {
    var ahora = new Date();
    var hoy = hoyMadrid(ahora);
    var desde = hoyMadrid(new Date(ahora.getTime() + 24 * 3600 * 1000));
    var hasta = sumar(hoy, HORIZONTE);
    var huecos = {};
    for (var f = desde, i = 0; f <= hasta; f = sumar(f, 1), i++) {
      if (diaSemana(f) > 5 || FESTIVOS.indexOf(f) !== -1) continue;
      // Ocupación de ejemplo: cada día falta alguna franja, como en un calendario real
      var libres = FRANJAS.filter(function (_, j) {
        return (j + i) % 4 !== 0;
      });
      if (libres.length) huecos[f] = libres;
    }
    return {
      modo: 'google',
      zonaHoraria: 'Europe/Madrid',
      rango: { desde: desde, hasta: hasta },
      huecos: huecos,
    };
  }

  var fetchOriginal = window.fetch.bind(window);
  window.fetch = function (recurso, opciones) {
    var url = typeof recurso === 'string' ? recurso : recurso.url;
    var json = function (cuerpo, estado) {
      return new Promise(function (ok) {
        setTimeout(function () {
          ok(
            new Response(JSON.stringify(cuerpo), {
              status: estado,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }, 500);
      });
    };
    if (/\/api\/disponibilidad(\?|$)/.test(url)) return json(disponibilidad(), 200);
    if (/\/api\/reservas$/.test(url)) {
      var d = JSON.parse((opciones && opciones.body) || '{}');
      return json(
        { ok: true, reserva: { fecha: d.fecha, hora: d.hora, modalidad: d.modalidad, meet: null } },
        201,
      );
    }
    return fetchOriginal(recurso, opciones);
  };

  document.addEventListener('DOMContentLoaded', function () {
    var aviso = document.createElement('div');
    aviso.setAttribute('role', 'note');
    aviso.textContent = 'Prototipo · reservas simuladas: no se crea ninguna cita';
    aviso.style.cssText =
      'position:fixed;z-index:50;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom,0px));' +
      'background:#0A0A0A;color:#fff;font:500 12px/1.2 "DM Mono",ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;' +
      'padding:8px 12px;border-radius:999px;box-shadow:0 4px 16px rgba(0,0,0,.2);max-width:calc(100% - 32px);text-align:center;pointer-events:none';
    document.body.appendChild(aviso);
  });
})();
