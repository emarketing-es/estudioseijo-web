/**
 * Conversión entre la hora «de reloj» de Madrid (AAAA-MM-DD + HH:MM) y un instante absoluto (Date),
 * teniendo en cuenta los cambios de hora. Funciones puras basadas en Intl, sin dependencias.
 */
import type { FechaISO } from './fechas';

export const ZONA_MADRID = 'Europe/Madrid';

const formateadores = new Map<string, Intl.DateTimeFormat>();
function formateador(zona: string): Intl.DateTimeFormat {
  let f = formateadores.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formateadores.set(zona, f);
  }
  return f;
}

function partes(instante: Date, zona: string) {
  const p = Object.fromEntries(
    formateador(zona)
      .formatToParts(instante)
      .map((x) => [x.type, x.value]),
  );
  return {
    anio: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    hora: Number(p.hour),
    minuto: Number(p.minute),
    segundo: Number(p.second),
  };
}

/** Diferencia en minutos entre la hora local de la zona y UTC en ese instante (Madrid: +60 o +120). */
export function desfaseMinutos(instante: Date, zona = ZONA_MADRID): number {
  const p = partes(instante, zona);
  const comoUTC = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
  return Math.round((comoUTC - Math.floor(instante.getTime() / 1000) * 1000) / 60000);
}

/** Instante en que el reloj de la zona marca esa fecha y hora. */
export function instanteEn(fecha: FechaISO, hora: string, zona = ZONA_MADRID): Date {
  const [a, m, d] = fecha.split('-').map(Number);
  const [h, mi] = hora.split(':').map(Number);
  const supuesto = Date.UTC(a, m - 1, d, h, mi);
  // Dos pasadas: el desfase puede cambiar entre la estimación y el instante real (cambio de hora)
  let instante = supuesto - desfaseMinutos(new Date(supuesto), zona) * 60000;
  instante = supuesto - desfaseMinutos(new Date(instante), zona) * 60000;
  return new Date(instante);
}

/** Fecha y hora de reloj en la zona para un instante. */
export function fechaHoraEn(instante: Date, zona = ZONA_MADRID): { fecha: FechaISO; hora: string } {
  const p = partes(instante, zona);
  const dos = (n: number) => String(n).padStart(2, '0');
  return { fecha: `${p.anio}-${dos(p.mes)}-${dos(p.dia)}`, hora: `${dos(p.hora)}:${dos(p.minuto)}` };
}
