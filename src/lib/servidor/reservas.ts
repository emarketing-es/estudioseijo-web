/**
 * Lógica de las funciones de servidor de la reserva, separada de Astro para poder probarla con tests
 * unitarios. Los endpoints (src/pages/api/*) solo construyen las dependencias y traducen la respuesta.
 */
import type { ReglasReserva } from '@/lib/reservas/huecos';
import {
  calcularHuecos,
  huecoLibre,
  intervaloDeHueco,
  rangoReservable,
  type Disponibilidad,
  type Intervalo,
} from '@/lib/reservas/huecos';
import { correoAviso, correoCliente, descripcionEvento, type Correo } from '@/lib/reservas/correos';
import { sumarDias, type FechaISO } from '@/lib/reservas/fechas';
import type { ClienteGoogle } from '@/lib/reservas/google';
import { esquemaReserva, primerError } from '@/lib/reservas/validacion';
import { instanteEn } from '@/lib/reservas/zona-horaria';

export interface Respuesta {
  estado: number;
  cuerpo: Record<string, unknown>;
}

export interface Dependencias {
  reglas: ReglasReserva;
  zona: string;
  ahora: () => Date;
  /** null si no hay credenciales de Google: la web usa el modo provisional (WhatsApp/email). */
  google: ClienteGoogle | null;
  enviarCorreo: (correo: Correo) => Promise<void>;
  /** Dirección que recibe el aviso interno de cada reserva. */
  emailAvisos: string;
  /** Lugar de las reuniones presenciales. */
  lugarPresencial: string;
  /** Si es null, no se exige Turnstile (p. ej. en desarrollo). */
  verificarTurnstile: ((token: string, ip?: string) => Promise<boolean>) | null;
  limitador: { permitir(clave: string): boolean };
  registrarError?: (mensaje: string, error: unknown) => void;
  /** Segundos que se reutiliza la ocupación del calendario entre consultas. */
  cacheSegundos?: number;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function crearServicioReservas(deps: Dependencias) {
  const registrar = deps.registrarError ?? ((m, e) => console.error(`[reservas] ${m}`, e));
  let cache: { clave: string; caduca: number; ocupados: Intervalo[] } | null = null;

  async function ocupacion(desde: FechaISO, hasta: FechaISO, usarCache = true): Promise<Intervalo[]> {
    const clave = `${desde}/${hasta}`;
    const t = Date.now();
    if (usarCache && cache && cache.clave === clave && cache.caduca > t) return cache.ocupados;
    const ocupados = await deps.google!.ocupacion(
      instanteEn(desde, '00:00', deps.zona),
      instanteEn(sumarDias(hasta, 1), '00:00', deps.zona),
    );
    cache = { clave, caduca: t + (deps.cacheSegundos ?? 60) * 1000, ocupados };
    return ocupados;
  }

  return {
    /** GET /api/disponibilidad?desde=AAAA-MM-DD&hasta=AAAA-MM-DD (ambos opcionales). */
    async disponibilidad(parametros: URLSearchParams): Promise<Respuesta> {
      // No es un error: la web pasa al modo provisional (WhatsApp/email)
      if (!deps.google) return { estado: 200, cuerpo: { modo: 'sin-credenciales' } };
      const ahora = deps.ahora();
      const rango = rangoReservable(deps.reglas, ahora, deps.zona);
      const desde = parametros.get('desde') ?? rango.desde;
      const hasta = parametros.get('hasta') ?? rango.hasta;
      if (!FECHA.test(desde) || !FECHA.test(hasta) || desde > hasta) {
        return { estado: 400, cuerpo: { error: 'Parámetros «desde» y «hasta» no válidos (AAAA-MM-DD).' } };
      }
      // Solo se consulta a Google la parte que puede tener huecos
      const consultaDesde = desde > rango.desde ? desde : rango.desde;
      const consultaHasta = hasta < rango.hasta ? hasta : rango.hasta;
      let huecos: Disponibilidad = {};
      if (consultaDesde <= consultaHasta) {
        try {
          const ocupados = await ocupacion(consultaDesde, consultaHasta);
          huecos = calcularHuecos({ reglas: deps.reglas, ahora, desde, hasta, ocupados, zona: deps.zona });
        } catch (error) {
          registrar('No se pudo consultar la disponibilidad', error);
          return {
            estado: 502,
            cuerpo: { error: 'No se pudo consultar el calendario. Inténtalo de nuevo en unos minutos.' },
          };
        }
      }
      return { estado: 200, cuerpo: { modo: 'google', zonaHoraria: deps.zona, rango, huecos } };
    },

    /** POST /api/reservas */
    async reservar(datos: unknown, ip: string): Promise<Respuesta> {
      if (!deps.limitador.permitir(ip)) {
        return {
          estado: 429,
          cuerpo: { error: 'Has hecho demasiadas solicitudes. Espera unos minutos o llámanos.' },
        };
      }
      const resultado = esquemaReserva.safeParse(datos);
      if (!resultado.success)
        return {
          estado: 400,
          cuerpo: { error: primerError(resultado.error).mensaje, campo: primerError(resultado.error).campo },
        };
      const s = resultado.data;

      // Campo trampa relleno: se responde como si todo fuera bien, sin crear nada
      if (s.web) return { estado: 201, cuerpo: { ok: true } };

      if (deps.verificarTurnstile && !(await deps.verificarTurnstile(s.turnstile, ip))) {
        return {
          estado: 403,
          cuerpo: {
            error: 'No hemos podido comprobar que no eres un robot. Recarga la página e inténtalo de nuevo.',
          },
        };
      }
      if (!deps.google) return { estado: 503, cuerpo: { modo: 'sin-credenciales' } };

      const ahora = deps.ahora();
      try {
        // Re-comprobación con la ocupación actual (sin caché): el hueco puede haberse ocupado mientras tanto
        const ocupados = await ocupacion(s.fecha, s.fecha, false);
        if (!huecoLibre({ reglas: deps.reglas, ahora, ocupados, zona: deps.zona }, s.fecha, s.hora)) {
          return {
            estado: 409,
            cuerpo: {
              error: 'Ese hueco ya no está disponible. Elige otro día u hora, por favor.',
              campo: 'fecha',
            },
          };
        }
        const { inicio, fin } = intervaloDeHueco(deps.reglas, s.fecha, s.hora, deps.zona);
        const presencial = s.modalidad !== 'Videoconferencia';
        const evento = await deps.google.crearEvento({
          titulo: `Revisión digital gratuita · ${s.nombre}${s.empresa ? ` (${s.empresa})` : ''}`,
          descripcion: descripcionEvento(s),
          inicio,
          fin,
          zonaHoraria: deps.zona,
          invitado: { email: s.email, nombre: s.nombre },
          videoconferencia: !presencial,
          lugar: presencial ? deps.lugarPresencial : undefined,
        });
        cache = null; // la ocupación ha cambiado

        // Los correos no deben deshacer una reserva ya creada: si fallan, se registra y se sigue
        const correos = [
          correoCliente(s, { meet: evento.meet, lugar: presencial ? deps.lugarPresencial : undefined }),
          correoAviso(s, deps.emailAvisos, { enlaceEvento: evento.enlace }),
        ];
        const envios = await Promise.allSettled(correos.map((c) => deps.enviarCorreo(c)));
        envios.forEach(
          (e) => e.status === 'rejected' && registrar('No se pudo enviar un correo de la reserva', e.reason),
        );

        return {
          estado: 201,
          cuerpo: {
            ok: true,
            reserva: { fecha: s.fecha, hora: s.hora, modalidad: s.modalidad, meet: evento.meet ?? null },
          },
        };
      } catch (error) {
        registrar('No se pudo crear la reserva', error);
        return {
          estado: 502,
          cuerpo: {
            error:
              'No hemos podido completar la reserva. Inténtalo de nuevo o llámanos y la hacemos por teléfono.',
          },
        };
      }
    },
  };
}

export type ServicioReservas = ReturnType<typeof crearServicioReservas>;
