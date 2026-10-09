/** POST /api/reservas → valida, re-comprueba el hueco, crea la reunión en Google Calendar y envía los correos. */
import type { APIRoute } from 'astro';
import { servicioReservas } from '@/lib/servidor/configuracion';

export const prerender = false;

const TAMANO_MAXIMO = 16 * 1024;

const json = (cuerpo: unknown, status: number) =>
  Response.json(cuerpo, { status, headers: { 'Cache-Control': 'no-store' } });

/** ¿La petición viene de la propia web? (protección básica contra envíos desde otros sitios) */
function mismoOrigen(request: Request, sitio: URL | undefined): boolean {
  const origen = request.headers.get('origin');
  if (!origen) return true; // peticiones sin navegador (no aplican CSRF)
  let host: string;
  try {
    host = new URL(origen).host;
  } catch {
    return false;
  }
  const permitidos = [request.headers.get('x-forwarded-host'), request.headers.get('host'), sitio?.host];
  return permitidos.some((h) => h && h.split(',')[0].trim() === host);
}

export const POST: APIRoute = async ({ request, clientAddress, site }) => {
  if (!mismoOrigen(request, site)) return json({ error: 'Origen no permitido.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'Formato no válido.' }, 415);
  }
  const texto = await request.text();
  if (texto.length > TAMANO_MAXIMO) return json({ error: 'Solicitud demasiado grande.' }, 413);

  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return json({ error: 'Formato no válido.' }, 400);
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || 'desconocida';
  const { estado, cuerpo } = await servicioReservas().reservar(datos, ip);
  return json(cuerpo, estado);
};
