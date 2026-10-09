/**
 * Utilidades de fechas «de calendario» (AAAA-MM-DD), sin horas ni zonas horarias, para que el día que ve
 * el visitante sea siempre el día de Madrid, esté donde esté. Funciones puras.
 */

export type FechaISO = string;

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const dosCifras = (n: number) => String(n).padStart(2, '0');

function aUTC(fecha: FechaISO): Date {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

function deUTC(fecha: Date): FechaISO {
  return `${fecha.getUTCFullYear()}-${dosCifras(fecha.getUTCMonth() + 1)}-${dosCifras(fecha.getUTCDate())}`;
}

/** Día de hoy en la zona horaria indicada (por defecto, Madrid). */
export function hoyEn(ahora: Date, zonaHoraria = 'Europe/Madrid'): FechaISO {
  // en-CA da el formato AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: zonaHoraria }).format(ahora);
}

export function sumarDias(fecha: FechaISO, dias: number): FechaISO {
  const f = aUTC(fecha);
  f.setUTCDate(f.getUTCDate() + dias);
  return deUTC(f);
}

/** 1 = lunes … 7 = domingo. */
export function diaSemana(fecha: FechaISO): number {
  const d = aUTC(fecha).getUTCDay();
  return d === 0 ? 7 : d;
}

/** «Lunes 12 de octubre». */
export function etiquetaDia(fecha: FechaISO): string {
  const f = aUTC(fecha);
  return `${mayuscula(DIAS[f.getUTCDay()])} ${f.getUTCDate()} de ${MESES[f.getUTCMonth()]}`;
}

/** Mes de una fecha en formato AAAA-MM. */
export const mesDe = (fecha: FechaISO) => fecha.slice(0, 7);

/** «Octubre 2026» a partir de AAAA-MM. */
export function etiquetaMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return `${mayuscula(MESES[m - 1])} ${a}`;
}

export function sumarMeses(mes: string, meses: number): string {
  const [a, m] = mes.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1 + meses, 1));
  return deUTC(f).slice(0, 7);
}

/** Todas las fechas de un mes AAAA-MM. */
export function diasDelMes(mes: string): FechaISO[] {
  const [a, m] = mes.split('-').map(Number);
  const total = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return Array.from({ length: total }, (_, i) => `${mes}-${dosCifras(i + 1)}`);
}
