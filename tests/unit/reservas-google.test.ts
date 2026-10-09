import { generateKeyPairSync, createVerify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { crearClienteGoogle, jwtCuentaServicio, ErrorGoogle } from '@/lib/reservas/google';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const clave = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

interface Llamada {
  url: string;
  init?: RequestInit;
}

/** fetch simulado: responde según la URL y guarda las llamadas. */
function fetchSimulado(respuestas: Record<string, unknown>, estado = 200) {
  const llamadas: Llamada[] = [];
  const fn = (async (url: string, init?: RequestInit) => {
    llamadas.push({ url, init });
    const clave = Object.keys(respuestas).find((k) => url.includes(k));
    return new Response(JSON.stringify(clave ? respuestas[clave] : {}), { status: clave ? estado : 404 });
  }) as unknown as typeof fetch;
  return { fn, llamadas };
}

describe('JWT de la cuenta de servicio', () => {
  it('va firmado con la clave privada y actúa en nombre del usuario de Workspace', () => {
    const jwt = jwtCuentaServicio(
      {
        tipo: 'cuenta-servicio',
        email: 'reservas@proyecto.iam.gserviceaccount.com',
        clavePrivada: clave,
        usuario: 'info@estudioseijo.com',
      },
      'https://oauth2.googleapis.com/token',
      1_700_000_000_000,
    );
    const [cabecera, carga, firma] = jwt.split('.');
    const datos = JSON.parse(Buffer.from(carga, 'base64url').toString());
    expect(datos).toMatchObject({ sub: 'info@estudioseijo.com', iat: 1_700_000_000, exp: 1_700_003_600 });
    expect(datos.scope).toBe('https://www.googleapis.com/auth/calendar');
    const ok = createVerify('RSA-SHA256')
      .update(`${cabecera}.${carga}`)
      .verify(publicKey, Buffer.from(firma, 'base64url'));
    expect(ok).toBe(true);
  });

  it('acepta la clave con los saltos de línea escritos como \\n', () => {
    const enUnaLinea = clave.replace(/\n/g, '\\n');
    expect(() =>
      jwtCuentaServicio(
        { tipo: 'cuenta-servicio', email: 'a@b', clavePrivada: enUnaLinea, usuario: 'c@d' },
        'x',
      ),
    ).not.toThrow();
  });
});

describe('cliente de Google Calendar', () => {
  const credenciales = {
    tipo: 'oauth' as const,
    clienteId: 'id',
    clienteSecreto: 'secreto',
    refreshToken: 'rt',
  };

  it('pide la ocupación y la convierte en intervalos, reutilizando el token', async () => {
    const { fn, llamadas } = fetchSimulado({
      '/token': { access_token: 'tok', expires_in: 3600 },
      '/freeBusy': {
        calendars: { cal: { busy: [{ start: '2026-10-13T07:30:00Z', end: '2026-10-13T08:30:00Z' }] } },
      },
    });
    const cliente = crearClienteGoogle({ credenciales, calendarioId: 'cal', fetch: fn });
    const ocupados = await cliente.ocupacion(
      new Date('2026-10-13T00:00:00Z'),
      new Date('2026-10-14T00:00:00Z'),
    );
    await cliente.ocupacion(new Date('2026-10-13T00:00:00Z'), new Date('2026-10-14T00:00:00Z'));
    expect(ocupados).toEqual([
      { inicio: new Date('2026-10-13T07:30:00Z'), fin: new Date('2026-10-13T08:30:00Z') },
    ]);
    expect(llamadas.filter((l) => l.url.includes('/token'))).toHaveLength(1);
    const tokenBody = String(llamadas[0].init?.body);
    expect(tokenBody).toContain('grant_type=refresh_token');
    expect(new Headers(llamadas[1].init?.headers).get('Authorization')).toBe('Bearer tok');
  });

  it('crea la reunión con invitado, Meet si es videoconferencia y aviso a los invitados', async () => {
    const { fn, llamadas } = fetchSimulado({
      '/token': { access_token: 'tok', expires_in: 3600 },
      '/events': { id: 'ev1', hangoutLink: 'https://meet.google.com/abc' },
    });
    const cliente = crearClienteGoogle({ credenciales, calendarioId: 'info@estudioseijo.com', fetch: fn });
    const r = await cliente.crearEvento({
      titulo: 'Revisión',
      descripcion: 'd',
      inicio: new Date('2026-10-13T07:30:00Z'),
      fin: new Date('2026-10-13T08:30:00Z'),
      zonaHoraria: 'Europe/Madrid',
      invitado: { email: 'ana@ejemplo.es', nombre: 'Ana' },
      videoconferencia: true,
    });
    expect(r).toEqual({ id: 'ev1', enlace: undefined, meet: 'https://meet.google.com/abc' });
    const llamada = llamadas.find((l) => l.url.includes('/events'))!;
    expect(llamada.url).toContain('/calendars/info%40estudioseijo.com/events?');
    expect(llamada.url).toContain('sendUpdates=all');
    expect(llamada.url).toContain('conferenceDataVersion=1');
    const cuerpo = JSON.parse(String(llamada.init?.body));
    expect(cuerpo.attendees).toEqual([{ email: 'ana@ejemplo.es', displayName: 'Ana' }]);
    expect(cuerpo.conferenceData.createRequest.conferenceSolutionKey.type).toBe('hangoutsMeet');
  });

  it('presencial: sin Meet y con el lugar', async () => {
    const { fn, llamadas } = fetchSimulado({
      '/token': { access_token: 't', expires_in: 3600 },
      '/events': { id: 'ev2' },
    });
    const cliente = crearClienteGoogle({ credenciales, calendarioId: 'cal', fetch: fn });
    await cliente.crearEvento({
      titulo: 't',
      descripcion: 'd',
      inicio: new Date(),
      fin: new Date(),
      zonaHoraria: 'Europe/Madrid',
      invitado: { email: 'a@b.es', nombre: 'A' },
      videoconferencia: false,
      lugar: 'Betanzos',
    });
    const llamada = llamadas.find((l) => l.url.includes('/events'))!;
    const cuerpo = JSON.parse(String(llamada.init?.body));
    expect(cuerpo.conferenceData).toBeUndefined();
    expect(cuerpo.location).toBe('Betanzos');
    expect(llamada.url).toContain('conferenceDataVersion=0');
  });

  it('lanza ErrorGoogle si Google responde con error', async () => {
    const { fn } = fetchSimulado({ '/token': { error: 'invalid_grant' } }, 400);
    const cliente = crearClienteGoogle({ credenciales, calendarioId: 'cal', fetch: fn });
    await expect(cliente.ocupacion(new Date(), new Date())).rejects.toBeInstanceOf(ErrorGoogle);
  });
});
