// Google Calendar simulado para las pruebas e2e (nunca se usa en producción).
// Imita /token, /freeBusy y la creación de eventos, y añade rutas de control para las pruebas.
import { createServer } from 'node:http';

const PUERTO = Number(process.env.PUERTO_GOOGLE_SIMULADO ?? 4599);
const TOKEN = 'token-simulado';

/** Ocupación fija: miércoles 14 de octubre de 2026 de 11:00 a 12:00 (Madrid). */
const FIJOS = [{ start: '2026-10-14T09:00:00Z', end: '2026-10-14T10:00:00Z', etiqueta: 'fijo' }];
let ocupados = [...FIJOS];
let eventos = [];

const leer = (req) =>
  new Promise((resolve) => {
    let datos = '';
    req.on('data', (c) => (datos += c));
    req.on('end', () => resolve(datos));
  });

const responder = (res, estado, cuerpo) => {
  res.writeHead(estado, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(cuerpo));
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  const cuerpo = await leer(req);

  // Rutas de control para las pruebas
  if (url.pathname === '/__estado') return responder(res, 200, { ok: true });
  if (url.pathname === '/__eventos') return responder(res, 200, eventos);
  if (url.pathname === '/__ocupar' && req.method === 'POST') {
    ocupados.push(JSON.parse(cuerpo));
    return responder(res, 200, { ok: true });
  }
  if (url.pathname === '/__limpiar' && req.method === 'POST') {
    // Quita lo que haya creado una prueba concreta (por etiqueta u email del invitado)
    const etiqueta = url.searchParams.get('etiqueta');
    ocupados = ocupados.filter((o) => o.etiqueta === 'fijo' || o.etiqueta !== etiqueta);
    eventos = eventos.filter((e) => e.attendees?.[0]?.email !== etiqueta);
    return responder(res, 200, { ok: true });
  }

  if (url.pathname === '/token' && req.method === 'POST') {
    return responder(res, 200, { access_token: TOKEN, expires_in: 3600, token_type: 'Bearer' });
  }
  if (req.headers.authorization !== `Bearer ${TOKEN}`) return responder(res, 401, { error: 'sin token' });

  if (url.pathname === '/freeBusy' && req.method === 'POST') {
    const { timeMin, timeMax, items } = JSON.parse(cuerpo);
    const todos = [...ocupados, ...eventos.map((e) => ({ start: e.start.dateTime, end: e.end.dateTime }))];
    const busy = todos
      .filter((o) => o.start < timeMax && o.end > timeMin)
      .map(({ start, end }) => ({ start, end }));
    return responder(res, 200, { calendars: { [items[0].id]: { busy } } });
  }

  const evento = url.pathname.match(/^\/calendars\/([^/]+)\/events$/);
  if (evento && req.method === 'POST') {
    const datos = JSON.parse(cuerpo);
    const id = `ev${eventos.length + 1}`;
    eventos.push({ ...datos, id, parametros: Object.fromEntries(url.searchParams) });
    return responder(res, 200, {
      id,
      htmlLink: `https://calendar.google.com/event?eid=${id}`,
      ...(datos.conferenceData && { hangoutLink: `https://meet.google.com/sim-${id}` }),
    });
  }

  responder(res, 404, { error: 'ruta no simulada' });
}).listen(PUERTO, () => console.log(`Google simulado en http://localhost:${PUERTO}`));
