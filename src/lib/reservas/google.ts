/**
 * Cliente mínimo de Google Calendar para el servidor: autenticación, consulta de ocupación (freeBusy) y
 * creación de eventos. Sin SDK: solo `fetch` y `node:crypto`.
 *
 * Dos formas de autenticarse (se elige según las credenciales configuradas):
 *  - Google Workspace: cuenta de servicio con delegación de dominio (actúa en nombre de un usuario).
 *  - Gmail personal: OAuth con un refresh token del propietario del calendario.
 */
import { createSign, randomUUID } from 'node:crypto';
import type { Intervalo } from './huecos';

export const ALCANCE_CALENDAR = 'https://www.googleapis.com/auth/calendar';

export type CredencialesGoogle =
  | {
      tipo: 'cuenta-servicio';
      email: string;
      clavePrivada: string;
      /** Usuario de Workspace en cuyo nombre se crean los eventos (delegación de dominio). */
      usuario: string;
    }
  | { tipo: 'oauth'; clienteId: string; clienteSecreto: string; refreshToken: string };

export interface ConfigGoogle {
  credenciales: CredencialesGoogle;
  calendarioId: string;
  /** Configurables para poder usar un Google simulado en las pruebas. */
  urlApi?: string;
  urlToken?: string;
  fetch?: typeof fetch;
}

export class ErrorGoogle extends Error {
  constructor(
    message: string,
    readonly estado?: number,
  ) {
    super(message);
    this.name = 'ErrorGoogle';
  }
}

const URL_API = 'https://www.googleapis.com/calendar/v3';
const URL_TOKEN = 'https://oauth2.googleapis.com/token';

const base64url = (datos: string | Buffer) => Buffer.from(datos).toString('base64url');

/** JWT firmado (RS256) para pedir un token con la cuenta de servicio. */
export function jwtCuentaServicio(
  c: Extract<CredencialesGoogle, { tipo: 'cuenta-servicio' }>,
  urlToken: string,
  ahora = Date.now(),
): string {
  const iat = Math.floor(ahora / 1000);
  const cabecera = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const carga = base64url(
    JSON.stringify({
      iss: c.email,
      sub: c.usuario,
      scope: ALCANCE_CALENDAR,
      aud: urlToken,
      iat,
      exp: iat + 3600,
    }),
  );
  const firma = createSign('RSA-SHA256')
    .update(`${cabecera}.${carga}`)
    // Las claves suelen guardarse en una sola línea con «\n» escritos
    .sign(c.clavePrivada.replace(/\\n/g, '\n'));
  return `${cabecera}.${carga}.${base64url(firma)}`;
}

export function crearClienteGoogle(config: ConfigGoogle) {
  const urlApi = config.urlApi ?? URL_API;
  const urlToken = config.urlToken ?? URL_TOKEN;
  const pedir = config.fetch ?? fetch;
  let token: { valor: string; caduca: number } | null = null;

  async function obtenerToken(): Promise<string> {
    if (token && token.caduca > Date.now() + 60_000) return token.valor;
    const c = config.credenciales;
    const cuerpo =
      c.tipo === 'cuenta-servicio'
        ? new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwtCuentaServicio(c, urlToken),
          })
        : new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: c.clienteId,
            client_secret: c.clienteSecreto,
            refresh_token: c.refreshToken,
          });
    const r = await pedir(urlToken, { method: 'POST', body: cuerpo });
    if (!r.ok) throw new ErrorGoogle(`No se pudo obtener el token de Google (${r.status})`, r.status);
    const datos = (await r.json()) as { access_token: string; expires_in: number };
    token = { valor: datos.access_token, caduca: Date.now() + datos.expires_in * 1000 };
    return token.valor;
  }

  async function api<T>(ruta: string, init: RequestInit = {}): Promise<T> {
    const r = await pedir(`${urlApi}${ruta}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${await obtenerToken()}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    if (!r.ok)
      throw new ErrorGoogle(`Error de Google Calendar en ${ruta.split('?')[0]} (${r.status})`, r.status);
    return (await r.json()) as T;
  }

  return {
    /** Periodos ocupados del calendario entre dos instantes. */
    async ocupacion(desde: Date, hasta: Date): Promise<Intervalo[]> {
      const datos = await api<{
        calendars: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }>;
      }>('/freeBusy', {
        method: 'POST',
        body: JSON.stringify({
          timeMin: desde.toISOString(),
          timeMax: hasta.toISOString(),
          items: [{ id: config.calendarioId }],
        }),
      });
      const calendario = datos.calendars[config.calendarioId];
      if (!calendario || calendario.errors?.length)
        throw new ErrorGoogle('Google no devolvió la ocupación del calendario');
      return (calendario.busy ?? []).map((b) => ({ inicio: new Date(b.start), fin: new Date(b.end) }));
    },

    /** Crea la reunión con el cliente como invitado. Devuelve el id y, si es videoconferencia, el enlace de Meet. */
    async crearEvento(evento: {
      titulo: string;
      descripcion: string;
      inicio: Date;
      fin: Date;
      zonaHoraria: string;
      invitado: { email: string; nombre: string };
      videoconferencia: boolean;
      lugar?: string;
    }): Promise<{ id: string; enlace?: string; meet?: string }> {
      const cuerpo = {
        summary: evento.titulo,
        description: evento.descripcion,
        start: { dateTime: evento.inicio.toISOString(), timeZone: evento.zonaHoraria },
        end: { dateTime: evento.fin.toISOString(), timeZone: evento.zonaHoraria },
        attendees: [{ email: evento.invitado.email, displayName: evento.invitado.nombre }],
        location: evento.lugar,
        reminders: { useDefault: true },
        ...(evento.videoconferencia && {
          conferenceData: {
            createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
          },
        }),
      };
      const parametros = new URLSearchParams({
        sendUpdates: 'all',
        conferenceDataVersion: evento.videoconferencia ? '1' : '0',
      });
      const creado = await api<{ id: string; htmlLink?: string; hangoutLink?: string }>(
        `/calendars/${encodeURIComponent(config.calendarioId)}/events?${parametros}`,
        { method: 'POST', body: JSON.stringify(cuerpo) },
      );
      return { id: creado.id, enlace: creado.htmlLink, meet: creado.hangoutLink };
    },
  };
}

export type ClienteGoogle = ReturnType<typeof crearClienteGoogle>;
