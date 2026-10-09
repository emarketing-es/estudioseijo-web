/**
 * Cálculo de huecos libres para la revisión digital gratuita. Módulo puro: recibe las reglas, el instante
 * actual y los periodos ocupados del calendario (de Google o ninguno) y devuelve los huecos en hora de Madrid.
 * Lo usan el servidor (/api/disponibilidad y la re-comprobación de /api/reservas) y, sin periodos ocupados,
 * el modo provisional del navegador.
 */
import { diaSemana, hoyEn, sumarDias, type FechaISO } from './fechas';
import { ZONA_MADRID, fechaHoraEn, instanteEn } from './zona-horaria';

export interface ReglasReserva {
  /** Días con reuniones: 1 = lunes … 7 = domingo. */
  diasLaborables: number[];
  /** Horas de inicio de las reuniones (hora de Madrid, HH:MM). */
  franjas: string[];
  /** Duración de la reunión. */
  duracionMinutos: number;
  /** Tiempo libre que se deja antes y después de cada cita ya existente. */
  margenMinutos: number;
  /** Antelación mínima entre el momento de reservar y el inicio de la reunión. */
  antelacionHoras: number;
  /** Hasta cuántos días vista se puede reservar (contando desde hoy). */
  horizonteDias: number;
  /** Festivos y días cerrados (AAAA-MM-DD). */
  festivos: string[];
}

export interface Intervalo {
  inicio: Date;
  fin: Date;
}

/** Huecos libres por día: { '2026-10-13': ['09:30', '11:00'] }. Los días sin huecos no aparecen. */
export type Disponibilidad = Record<FechaISO, string[]>;

const MINUTO = 60_000;

/** Intervalo que ocupa una reunión que empieza en esa fecha y hora de Madrid. */
export function intervaloDeHueco(
  reglas: ReglasReserva,
  fecha: FechaISO,
  hora: string,
  zona = ZONA_MADRID,
): Intervalo {
  const inicio = instanteEn(fecha, hora, zona);
  return { inicio, fin: new Date(inicio.getTime() + reglas.duracionMinutos * MINUTO) };
}

/** Primer y último día que pueden tener huecos (para pedir la ocupación al calendario). */
export function rangoReservable(
  reglas: ReglasReserva,
  ahora: Date,
  zona = ZONA_MADRID,
): { desde: FechaISO; hasta: FechaISO } {
  const minimo = new Date(ahora.getTime() + reglas.antelacionHoras * 60 * MINUTO);
  return {
    desde: fechaHoraEn(minimo, zona).fecha,
    hasta: sumarDias(hoyEn(ahora, zona), reglas.horizonteDias),
  };
}

function solapa(a: Intervalo, b: Intervalo): boolean {
  return a.inicio < b.fin && b.inicio < a.fin;
}

export interface Consulta {
  reglas: ReglasReserva;
  ahora: Date;
  /** Fechas pedidas (ambas incluidas). Se recortan al rango reservable. */
  desde: FechaISO;
  hasta: FechaISO;
  /** Periodos ocupados del calendario. */
  ocupados?: Intervalo[];
  zona?: string;
}

export function calcularHuecos({
  reglas,
  ahora,
  desde,
  hasta,
  ocupados = [],
  zona = ZONA_MADRID,
}: Consulta): Disponibilidad {
  const rango = rangoReservable(reglas, ahora, zona);
  const inicioMinimo = new Date(ahora.getTime() + reglas.antelacionHoras * 60 * MINUTO);
  const margen = reglas.margenMinutos * MINUTO;
  const primero = desde > rango.desde ? desde : rango.desde;
  const ultimo = hasta < rango.hasta ? hasta : rango.hasta;

  const resultado: Disponibilidad = {};
  for (let fecha = primero; fecha <= ultimo; fecha = sumarDias(fecha, 1)) {
    if (!reglas.diasLaborables.includes(diaSemana(fecha)) || reglas.festivos.includes(fecha)) continue;
    const libres = reglas.franjas.filter((hora) => {
      const hueco = intervaloDeHueco(reglas, fecha, hora, zona);
      if (hueco.inicio < inicioMinimo) return false;
      const conMargen = {
        inicio: new Date(hueco.inicio.getTime() - margen),
        fin: new Date(hueco.fin.getTime() + margen),
      };
      return !ocupados.some((o) => solapa(conMargen, o));
    });
    if (libres.length > 0) resultado[fecha] = libres;
  }
  return resultado;
}

/** ¿Sigue libre ese hueco? (re-comprobación antes de crear la reunión) */
export function huecoLibre(
  consulta: Omit<Consulta, 'desde' | 'hasta'>,
  fecha: FechaISO,
  hora: string,
): boolean {
  return calcularHuecos({ ...consulta, desde: fecha, hasta: fecha })[fecha]?.includes(hora) ?? false;
}
