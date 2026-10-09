import { describe, expect, it, vi } from 'vitest';
import type { ReglasReserva } from '@/lib/reservas/huecos';
import type { ClienteGoogle } from '@/lib/reservas/google';
import { instanteEn } from '@/lib/reservas/zona-horaria';
import { crearLimitador } from '@/lib/servidor/limite';
import { crearServicioReservas, type Dependencias } from '@/lib/servidor/reservas';

const reglas: ReglasReserva = {
  diasLaborables: [1, 2, 3, 4, 5],
  franjas: ['09:30', '11:00'],
  duracionMinutos: 60,
  margenMinutos: 15,
  antelacionHoras: 24,
  horizonteDias: 60,
  festivos: ['2026-10-12'],
};
const AHORA = new Date('2026-10-09T08:00:00Z'); // viernes 10:00 en Madrid

function googleFalso(ocupados: { inicio: Date; fin: Date }[] = []) {
  return {
    ocupacion: vi.fn(async () => ocupados),
    crearEvento: vi.fn(async () => ({
      id: 'ev1',
      enlace: 'https://calendar.google.com/ev1',
      meet: 'https://meet.google.com/x',
    })),
  } satisfies ClienteGoogle;
}

function servicio(extra: Partial<Dependencias> = {}) {
  const deps: Dependencias = {
    reglas,
    zona: 'Europe/Madrid',
    ahora: () => AHORA,
    google: googleFalso(),
    enviarCorreo: vi.fn(async () => {}),
    emailAvisos: 'info@estudioseijo.com',
    lugarPresencial: 'Betanzos (A Coruña)',
    verificarTurnstile: null,
    limitador: { permitir: () => true },
    registrarError: () => {},
    ...extra,
  };
  return { deps, s: crearServicioReservas(deps) };
}

const solicitud = {
  fecha: '2026-10-13',
  hora: '09:30',
  modalidad: 'Videoconferencia',
  nombre: 'Ana Pérez',
  empresa: 'Ferretería Ana',
  email: 'ana@ejemplo.es',
  telefono: '',
  mensaje: 'La web',
  privacidad: true,
  turnstile: '',
  web: '',
};

describe('GET /api/disponibilidad', () => {
  it('sin credenciales de Google lo indica (sin error) para que la web use el modo provisional', async () => {
    const { s } = servicio({ google: null });
    expect(await s.disponibilidad(new URLSearchParams())).toEqual({
      estado: 200,
      cuerpo: { modo: 'sin-credenciales' },
    });
  });

  it('devuelve el rango y los huecos sin los periodos ocupados', async () => {
    const google = googleFalso([
      { inicio: instanteEn('2026-10-13', '09:30'), fin: instanteEn('2026-10-13', '10:30') },
    ]);
    const { s } = servicio({ google });
    const r = await s.disponibilidad(new URLSearchParams({ desde: '2026-10-09', hasta: '2026-10-14' }));
    expect(r.estado).toBe(200);
    expect(r.cuerpo.rango).toEqual({ desde: '2026-10-10', hasta: '2026-12-08' });
    expect(r.cuerpo.huecos).toEqual({ '2026-10-13': ['11:00'], '2026-10-14': ['09:30', '11:00'] });
    // Solo pregunta a Google por la parte reservable (desde mañana + 24 h)
    expect(google.ocupacion).toHaveBeenCalledWith(
      instanteEn('2026-10-10', '00:00'),
      instanteEn('2026-10-15', '00:00'),
    );
  });

  it('reutiliza la ocupación durante el tiempo de caché', async () => {
    const google = googleFalso();
    const { s } = servicio({ google });
    await s.disponibilidad(new URLSearchParams());
    await s.disponibilidad(new URLSearchParams());
    expect(google.ocupacion).toHaveBeenCalledTimes(1);
  });

  it('valida los parámetros', async () => {
    const { s } = servicio();
    expect((await s.disponibilidad(new URLSearchParams({ desde: 'ayer' }))).estado).toBe(400);
    expect(
      (await s.disponibilidad(new URLSearchParams({ desde: '2026-10-20', hasta: '2026-10-10' }))).estado,
    ).toBe(400);
  });

  it('si Google falla responde 502', async () => {
    const google = googleFalso();
    google.ocupacion.mockRejectedValueOnce(new Error('caído'));
    const { s } = servicio({ google });
    expect((await s.disponibilidad(new URLSearchParams())).estado).toBe(502);
  });
});

describe('POST /api/reservas', () => {
  it('crea la reunión, envía los dos correos y devuelve el resumen', async () => {
    const { s, deps } = servicio();
    const r = await s.reservar(solicitud, '1.2.3.4');
    expect(r).toEqual({
      estado: 201,
      cuerpo: {
        ok: true,
        reserva: {
          fecha: '2026-10-13',
          hora: '09:30',
          modalidad: 'Videoconferencia',
          meet: 'https://meet.google.com/x',
        },
      },
    });
    const google = deps.google as ReturnType<typeof googleFalso>;
    expect(google.crearEvento).toHaveBeenCalledWith(
      expect.objectContaining({
        inicio: new Date('2026-10-13T07:30:00Z'),
        fin: new Date('2026-10-13T08:30:00Z'),
        invitado: { email: 'ana@ejemplo.es', nombre: 'Ana Pérez' },
        videoconferencia: true,
        lugar: undefined,
        titulo: 'Revisión digital gratuita · Ana Pérez (Ferretería Ana)',
      }),
    );
    const correos = vi.mocked(deps.enviarCorreo).mock.calls.map(([c]) => c);
    expect(correos.map((c) => c.para)).toEqual(['ana@ejemplo.es', 'info@estudioseijo.com']);
    expect(correos[0].asunto).toBe(
      'Reunión confirmada: revisión digital gratuita · Martes 13 de octubre, 09:30 h',
    );
    expect(correos[0].texto).toContain('https://meet.google.com/x');
    expect(correos[1].texto).toContain('Qué le gustaría mejorar:\nLa web');
  });

  it('presencial: con la dirección y sin Meet', async () => {
    const { s, deps } = servicio();
    await s.reservar({ ...solicitud, modalidad: 'Presencial en Betanzos' }, 'ip');
    expect((deps.google as ReturnType<typeof googleFalso>).crearEvento).toHaveBeenCalledWith(
      expect.objectContaining({ videoconferencia: false, lugar: 'Betanzos (A Coruña)' }),
    );
  });

  it('vuelve a comprobar el hueco: si se ha ocupado, 409 y no crea nada', async () => {
    const google = googleFalso([
      { inicio: instanteEn('2026-10-13', '09:00'), fin: instanteEn('2026-10-13', '10:00') },
    ]);
    const { s } = servicio({ google });
    const r = await s.reservar(solicitud, 'ip');
    expect(r.estado).toBe(409);
    expect(r.cuerpo.campo).toBe('fecha');
    expect(google.crearEvento).not.toHaveBeenCalled();
  });

  it('rechaza huecos que no existen o fuera de plazo', async () => {
    const { s } = servicio();
    expect((await s.reservar({ ...solicitud, hora: '10:00' }, 'ip')).estado).toBe(409);
    expect((await s.reservar({ ...solicitud, fecha: '2026-10-10' }, 'ip')).estado).toBe(409); // sábado
    expect((await s.reservar({ ...solicitud, fecha: '2026-10-09' }, 'ip')).estado).toBe(409); // hoy
  });

  it('valida los datos en el servidor', async () => {
    const { s } = servicio();
    expect(await s.reservar({ ...solicitud, nombre: '  ' }, 'ip')).toMatchObject({
      estado: 400,
      cuerpo: { campo: 'nombre' },
    });
    expect(await s.reservar({ ...solicitud, email: 'ana@' }, 'ip')).toMatchObject({
      estado: 400,
      cuerpo: { campo: 'email' },
    });
    expect(await s.reservar({ ...solicitud, privacidad: false }, 'ip')).toMatchObject({
      estado: 400,
      cuerpo: { campo: 'privacidad' },
    });
    expect(await s.reservar({ ...solicitud, modalidad: 'Teléfono' }, 'ip')).toMatchObject({
      estado: 400,
      cuerpo: { campo: 'modalidad' },
    });
    expect(await s.reservar({ ...solicitud, nombre: 'Ana\u0007' }, 'ip')).toMatchObject({ estado: 400 });
    expect(await s.reservar('no es un objeto', 'ip')).toMatchObject({ estado: 400 });
    // Sin saltos de línea en campos que acaban en asuntos de correo
    expect(await s.reservar({ ...solicitud, nombre: 'Ana\r\nBcc: x@y.z' }, 'ip')).toMatchObject({
      estado: 400,
      cuerpo: { campo: 'nombre' },
    });
    expect((await s.reservar({ ...solicitud, mensaje: 'Línea 1\nLínea 2' }, 'ip')).estado).toBe(201);
  });

  it('campo trampa relleno: responde bien pero no crea nada', async () => {
    const { s, deps } = servicio();
    expect((await s.reservar({ ...solicitud, web: 'http://spam' }, 'ip')).estado).toBe(201);
    expect((deps.google as ReturnType<typeof googleFalso>).crearEvento).not.toHaveBeenCalled();
  });

  it('exige Turnstile cuando está activado', async () => {
    const verificar = vi.fn(async (token: string) => token === 'valido');
    const { s } = servicio({ verificarTurnstile: verificar });
    expect((await s.reservar({ ...solicitud, turnstile: 'malo' }, 'ip')).estado).toBe(403);
    expect((await s.reservar({ ...solicitud, turnstile: 'valido' }, 'ip')).estado).toBe(201);
    expect(verificar).toHaveBeenCalledWith('valido', 'ip');
  });

  it('limita las peticiones por IP', async () => {
    const limitador = crearLimitador({ maximo: 2, ventanaMs: 60_000 });
    const { s } = servicio({ limitador });
    await s.reservar(solicitud, '9.9.9.9');
    await s.reservar(solicitud, '9.9.9.9');
    expect((await s.reservar(solicitud, '9.9.9.9')).estado).toBe(429);
    expect((await s.reservar(solicitud, '8.8.8.8')).estado).not.toBe(429);
  });

  it('si falla el correo, la reserva sigue siendo válida', async () => {
    const { s } = servicio({ enviarCorreo: vi.fn(async () => Promise.reject(new Error('smtp caído'))) });
    expect((await s.reservar(solicitud, 'ip')).estado).toBe(201);
  });

  it('si Google falla al crear el evento, 502 con alternativa por teléfono', async () => {
    const google = googleFalso();
    google.crearEvento.mockRejectedValueOnce(new Error('403'));
    const { s } = servicio({ google });
    const r = await s.reservar(solicitud, 'ip');
    expect(r.estado).toBe(502);
    expect(String(r.cuerpo.error)).toContain('llámanos');
  });

  it('sin credenciales de Google, 503 para pasar al envío por WhatsApp o email', async () => {
    const { s } = servicio({ google: null });
    expect(await s.reservar(solicitud, 'ip')).toEqual({ estado: 503, cuerpo: { modo: 'sin-credenciales' } });
  });
});

describe('limitador', () => {
  it('libera la IP cuando pasa la ventana', () => {
    let t = 0;
    const l = crearLimitador({ maximo: 1, ventanaMs: 1000, ahora: () => t });
    expect(l.permitir('a')).toBe(true);
    expect(l.permitir('a')).toBe(false);
    t = 1001;
    expect(l.permitir('a')).toBe(true);
  });
});
