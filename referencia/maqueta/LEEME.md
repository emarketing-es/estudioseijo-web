# estudioseijo.com · sitio web

Sitio estático (HTML + CSS + JS, sin dependencias). Se sube tal cual a cualquier hosting.

## Archivos
- `index.html` · inicio y landing de la revisión digital gratuita, con la reserva.
- `blog.html` · noticias con filtro por categoría.
- `opiniones.html` · opiniones (huecos preparados para reseñas reales de Google).
- `aviso-legal.html`, `privacidad.html`, `cookies.html` · plantillas: pegar el texto legal vigente.
- `assets/styles.css` · estilos (colores y tipografías del manual de marca).
- `assets/main.js` · comportamiento. **La configuración está al principio de este archivo.**
- `assets/logo-*.png` · logotipos.

## Conectar la reserva con Google Calendar
1. En Google Calendar: Crear → Agenda de citas. Define horario, duración (1 h), descansos y antelación.
   Activa "Google Meet" para la videoconferencia y añade la dirección para las presenciales.
2. Abre la agenda → Compartir → copia el enlace de la página de reserva.
3. Pégalo en `assets/main.js`, en `googleBookingUrl`.

Con eso la sección de reserva muestra los huecos libres reales de tu calendario y Google envía la invitación
al confirmar. Mientras `googleBookingUrl` esté vacío, se usa el formulario propio: el visitante elige día y
hora (según `workDays`, `slots` y `blockedDates`) y envía la solicitud por WhatsApp o email.
Si se rellena `formEndpoint` (Google Apps Script, Formspree o backend propio), la solicitud llega directamente.

## Otros ajustes en `assets/main.js`
- `googleReviewUrl` y `googleProfileUrl`: enlaces de la ficha de Google para la sección de opiniones.
- `blockedDates`: festivos y días cerrados (formato AAAA-MM-DD).

## Pendientes
- Sustituir las tarjetas "Pendiente" de opiniones por reseñas reales de Google.
- Textos legales.
- Los dos artículos marcados como "Borrador de ejemplo" en el blog.
