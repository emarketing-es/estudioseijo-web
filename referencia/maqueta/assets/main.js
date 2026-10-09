/* estudioseijo. — comportamiento del sitio
   ─────────────────────────────────────────────────────────────
   CONFIGURACIÓN: edita solo este bloque.
   ───────────────────────────────────────────────────────────── */
var ES_CONFIG = {
  // Enlace de la "Agenda de citas" de Google Calendar (Google Calendar → Crear → Agenda de citas →
  // Compartir → "Página de reserva" o "Insertar en sitio web"). Con este enlace la sección de reserva
  // muestra la disponibilidad real del calendario y Google envía la invitación al confirmar.
  // Ejemplo: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ..."
  googleBookingUrl: "",

  // Opcional: URL que recibe las solicitudes del formulario propio por POST (JSON), por ejemplo un
  // Google Apps Script, Formspree o el backend de la web. Si está vacío, la solicitud se envía por
  // WhatsApp o email desde el navegador del visitante.
  formEndpoint: "",

  whatsapp: "34633923567",
  phone: "+34981774892",
  email: "info@estudioseijo.com",

  // Enlaces de Google para la sección de opiniones (ficha de Google Business Profile).
  googleReviewUrl: "",   // enlace "Escribir una reseña"
  googleProfileUrl: "",  // enlace a la ficha

  // Disponibilidad del formulario propio (solo se usa si googleBookingUrl está vacío).
  workDays: [1, 2, 3, 4, 5],                 // 1 = lunes … 5 = viernes
  slots: ["09:30", "11:00", "12:30", "16:30", "18:00"],
  minNoticeDays: 1,                          // días de antelación mínima
  maxDaysAhead: 60,                          // hasta cuántos días se puede reservar
  blockedDates: ["2026-10-12", "2026-11-01", "2026-12-08", "2026-12-25"] // festivos y días cerrados (AAAA-MM-DD)
};

(function () {
  "use strict";
  var C = ES_CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Menú móvil */
  var toggle = $(".menu-toggle"), nav = $(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }); });
  }

  /* Enlaces de Google para opiniones */
  $$("[data-link='google-review']").forEach(function (a) { if (C.googleReviewUrl) { a.href = C.googleReviewUrl; a.target = "_blank"; a.rel = "noopener"; } });
  $$("[data-link='google-profile']").forEach(function (a) { if (C.googleProfileUrl) { a.href = C.googleProfileUrl; a.target = "_blank"; a.rel = "noopener"; } });

  /* Filtro del blog */
  var filters = $$(".filter");
  if (filters.length) {
    var posts = $$(".post[data-cat]"), count = $("#post-count");
    var apply = function (cat) {
      var n = 0;
      filters.forEach(function (f) { f.setAttribute("aria-pressed", f.dataset.cat === cat ? "true" : "false"); });
      posts.forEach(function (p) { var show = cat === "Todas" || p.dataset.cat === cat; p.hidden = !show; if (show) n++; });
      if (count) count.textContent = n === 1 ? "1 artículo" : n + " artículos";
    };
    filters.forEach(function (f) { f.addEventListener("click", function () { apply(f.dataset.cat); }); });
    apply("Todas");
  }

  /* Reserva */
  var booking = $("#reserva");
  if (!booking) return;

  var MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var iso = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var dayLabel = function (d) { return cap(DIA[d.getDay()]) + " " + d.getDate() + " de " + MES[d.getMonth()]; };

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var firstDay = new Date(today); firstDay.setDate(today.getDate() + C.minNoticeDays);
  var lastDay = new Date(today); lastDay.setDate(today.getDate() + C.maxDaysAhead);
  var isWorkDay = function (d) { var w = d.getDay() === 0 ? 7 : d.getDay(); return C.workDays.indexOf(w) !== -1; };
  var isAvailable = function (d) { return d >= firstDay && d <= lastDay && isWorkDay(d) && C.blockedDates.indexOf(iso(d)) === -1; };

  /* Próximo hueco libre (tarjeta de la portada) */
  var next = null;
  for (var k = 0; k <= C.maxDaysAhead && !next; k++) { var t = new Date(firstDay); t.setDate(firstDay.getDate() + k); if (isAvailable(t)) next = t; }
  $$("[data-next-slot]").forEach(function (el) { el.textContent = next ? dayLabel(next) + ", " + C.slots[0] + " h" : "Consúltanos"; });

  /* Modo Google Calendar */
  if (C.googleBookingUrl) {
    $("#booking-widget").hidden = true;
    var g = $("#booking-google"); g.hidden = false;
    var url = C.googleBookingUrl + (C.googleBookingUrl.indexOf("?") === -1 ? "?gv=true" : "&gv=true");
    $("#gcal-frame").src = url;
    $("#gcal-link").href = C.googleBookingUrl;
    return;
  }

  /* Formulario propio */
  var state = { month: new Date(firstDay.getFullYear(), firstDay.getMonth(), 1), date: null, slot: null, mode: "Videoconferencia" };
  var grid = $("#cal-grid"), monthEl = $("#cal-month"), prev = $("#cal-prev"), nextBtn = $("#cal-next");
  var slotsBox = $("#slots"), slotsWrap = $("#slots-wrap"), noDay = $("#no-day"), dayEl = $("#day-label");
  var summary = $("#summary"), submit = $("#submit"), form = $("#booking-form"), err = $("#form-error");

  function summaryText() {
    if (state.date && state.slot) return dayLabel(state.date) + " · " + state.slot + " h · " + state.mode;
    if (state.date) return dayLabel(state.date) + " · elige una hora";
    return "Elige día y hora en el calendario";
  }
  function refresh() {
    summary.textContent = summaryText();
    var ok = !!(state.date && state.slot);
    submit.setAttribute("aria-disabled", ok ? "false" : "true");
    submit.textContent = ok ? "Confirmar reunión" : "Elige día y hora para confirmar";
  }
  function renderSlots() {
    if (!state.date) { slotsWrap.hidden = true; noDay.hidden = false; return; }
    slotsWrap.hidden = false; noDay.hidden = true;
    dayEl.textContent = dayLabel(state.date);
    slotsBox.innerHTML = "";
    C.slots.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "slot"; b.textContent = s;
      b.setAttribute("aria-pressed", state.slot === s ? "true" : "false");
      b.addEventListener("click", function () { state.slot = s; renderSlots(); refresh(); });
      slotsBox.appendChild(b);
    });
  }
  function renderCal() {
    var y = state.month.getFullYear(), m = state.month.getMonth();
    monthEl.textContent = cap(MES[m]) + " " + y;
    $$(".cal-cell", grid).forEach(function (n) { n.remove(); });
    var offset = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    for (var i = 0; i < offset; i++) { var e = document.createElement("div"); e.className = "cal-cell"; grid.appendChild(e); }
    for (var d = 1; d <= days; d++) {
      var date = new Date(y, m, d), cell;
      if (isAvailable(date)) {
        cell = document.createElement("button");
        cell.type = "button"; cell.className = "cal-cell cal-day";
        cell.setAttribute("aria-label", dayLabel(date) + ", disponible");
        cell.setAttribute("aria-pressed", state.date && iso(state.date) === iso(date) ? "true" : "false");
        (function (dd) { cell.addEventListener("click", function () { state.date = dd; state.slot = null; renderCal(); renderSlots(); refresh(); }); })(date);
      } else {
        cell = document.createElement("div");
        cell.className = "cal-cell cal-day off";
        cell.setAttribute("aria-hidden", "true");
      }
      cell.textContent = d;
      grid.appendChild(cell);
    }
    var firstMonth = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
    var lastMonth = new Date(lastDay.getFullYear(), lastDay.getMonth(), 1);
    prev.disabled = state.month <= firstMonth;
    nextBtn.disabled = state.month >= lastMonth;
  }
  prev.addEventListener("click", function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); renderCal(); });
  nextBtn.addEventListener("click", function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); renderCal(); });
  $$(".mode").forEach(function (b) {
    b.addEventListener("click", function () {
      state.mode = b.dataset.mode;
      $$(".mode").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      refresh();
    });
  });

  function showDone(data, sent) {
    $("#booking-widget").hidden = true;
    var done = $("#booking-done"); done.hidden = false;
    $("#done-summary").textContent = summaryText();
    var msg = "Hola, quiero reservar la revisión digital gratuita.\n" +
      "Fecha: " + dayLabel(state.date) + " a las " + state.slot + " h\n" +
      "Modalidad: " + state.mode + "\n" +
      "Nombre: " + data.nombre + (data.empresa ? " (" + data.empresa + ")" : "") + "\n" +
      "Email: " + data.email + (data.telefono ? " · Tel.: " + data.telefono : "") +
      (data.mensaje ? "\nQué me gustaría mejorar: " + data.mensaje : "");
    if (sent) {
      $("#done-title").textContent = "Solicitud recibida";
      $("#done-text").textContent = "Te confirmaremos la reunión por email en breve. Si necesitas algo antes, escríbenos por WhatsApp.";
      $("#done-send").hidden = true;
    } else {
      $("#done-title").textContent = "Último paso: envíanos tu solicitud";
      $("#done-text").textContent = "Tu reunión queda reservada en cuanto la recibamos y te confirmemos por email. Envíala por WhatsApp o por email:";
      $("#wa-link").href = "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(msg);
      $("#mail-link").href = "mailto:" + C.email + "?subject=" + encodeURIComponent("Reserva revisión digital gratuita · " + dayLabel(state.date) + " " + state.slot) + "&body=" + encodeURIComponent(msg);
      $("#copy-box").textContent = msg;
      $("#done-send").hidden = false;
    }
    done.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    err.hidden = true;
    var data = { nombre: $("#r-nombre").value.trim(), empresa: $("#r-empresa").value.trim(), email: $("#r-email").value.trim(),
                 telefono: $("#r-tel").value.trim(), mensaje: $("#r-msg").value.trim() };
    var problem = !state.date || !state.slot ? "Elige un día y una hora disponibles."
      : !data.nombre ? "Escribe tu nombre."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ? "Revisa el email: parece incompleto."
      : !$("#r-privacy").checked ? "Para reservar, acepta la política de privacidad." : "";
    if (problem) { err.textContent = problem; err.hidden = false; return; }
    if (C.formEndpoint) {
      submit.setAttribute("aria-disabled", "true"); submit.textContent = "Enviando…";
      fetch(C.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: iso(state.date), hora: state.slot, modalidad: state.mode, nombre: data.nombre, empresa: data.empresa,
                               email: data.email, telefono: data.telefono, mensaje: data.mensaje }) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); showDone(data, true); })
        .catch(function () { err.textContent = "No se pudo enviar la solicitud. Puedes enviarla por WhatsApp o email."; err.hidden = false; showDone(data, false); });
    } else {
      showDone(data, false);
    }
  });
  $("#copy-btn").addEventListener("click", function () {
    var txt = $("#copy-box").textContent, btn = this;
    var ok = function () { btn.textContent = "Copiado"; setTimeout(function () { btn.textContent = "Copiar texto"; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, function () { var r = document.createRange(); r.selectNodeContents($("#copy-box")); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); });
  });
  $("#again").addEventListener("click", function () {
    state.date = null; state.slot = null;
    $("#booking-done").hidden = true; $("#booking-widget").hidden = false;
    renderCal(); renderSlots(); refresh();
  });

  renderCal(); renderSlots(); refresh();
})();
