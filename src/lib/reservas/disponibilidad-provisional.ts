/**
 * Cálculo PROVISIONAL de huecos a partir de reglas fijas (como la maqueta), sin consultar Google Calendar.
 * En la fase 4 lo sustituye `/api/disponibilidad`, que devuelve los huecos reales con el mismo formato.
 */
import type { ReglasReserva } from '@/config/reservas';
import { diaSemana, sumarDias, type FechaISO } from './fechas';

/** Huecos libres por día: { '2026-10-13': ['09:30', '11:00', …] }. Los días sin huecos no aparecen. */
export type Disponibilidad = Record<FechaISO, string[]>;

export function primerDiaReservable(reglas: ReglasReserva, hoy: FechaISO): FechaISO {
  return sumarDias(hoy, reglas.antelacionDias);
}

export function ultimoDiaReservable(reglas: ReglasReserva, hoy: FechaISO): FechaISO {
  return sumarDias(hoy, reglas.horizonteDias);
}

export function diaReservable(reglas: ReglasReserva, hoy: FechaISO, fecha: FechaISO): boolean {
  return (
    fecha >= primerDiaReservable(reglas, hoy) &&
    fecha <= ultimoDiaReservable(reglas, hoy) &&
    reglas.diasLaborables.includes(diaSemana(fecha)) &&
    !reglas.festivos.includes(fecha)
  );
}

/** Huecos entre dos fechas (ambas incluidas). */
export function huecosProvisionales(
  reglas: ReglasReserva,
  hoy: FechaISO,
  desde: FechaISO,
  hasta: FechaISO,
): Disponibilidad {
  const resultado: Disponibilidad = {};
  for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
    if (diaReservable(reglas, hoy, fecha) && reglas.franjas.length > 0)
      resultado[fecha] = [...reglas.franjas];
  }
  return resultado;
}

/** Primer hueco libre a partir de hoy, o null si no hay ninguno en el horizonte. */
export function proximoHueco(reglas: ReglasReserva, hoy: FechaISO): { fecha: FechaISO; hora: string } | null {
  const huecos = huecosProvisionales(
    reglas,
    hoy,
    primerDiaReservable(reglas, hoy),
    ultimoDiaReservable(reglas, hoy),
  );
  const fecha = Object.keys(huecos).sort()[0];
  return fecha ? { fecha, hora: huecos[fecha][0] } : null;
}
