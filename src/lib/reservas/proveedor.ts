/**
 * Origen de los huecos que muestra el calendario.
 *  - «google»: huecos reales de /api/disponibilidad (fase 4). Al confirmar, se crea la reunión en el servidor.
 *  - «provisional»: si el servidor no tiene credenciales de Google o no responde, huecos calculados en el
 *    navegador con las reglas fijas; al confirmar, la solicitud se envía por WhatsApp o email (maqueta).
 */
import { reglasReserva } from '@/config/reservas';
import { calcularHuecos, rangoReservable, type Disponibilidad } from './huecos';
import type { FechaISO } from './fechas';

export interface DatosDisponibilidad {
  modo: 'google' | 'provisional';
  rango: { desde: FechaISO; hasta: FechaISO };
  huecos: Disponibilidad;
}

export function disponibilidadProvisional(ahora: Date): DatosDisponibilidad {
  const rango = rangoReservable(reglasReserva, ahora);
  return { modo: 'provisional', rango, huecos: calcularHuecos({ reglas: reglasReserva, ahora, ...rango }) };
}

/** Pide los huecos reales al servidor; ante cualquier problema, cae al modo provisional. */
export async function cargarDisponibilidad(
  ahora: Date = new Date(),
  pedir: typeof fetch = fetch,
): Promise<DatosDisponibilidad> {
  try {
    const r = await pedir('/api/disponibilidad', { headers: { Accept: 'application/json' } });
    if (r.ok) {
      const datos = (await r.json()) as DatosDisponibilidad;
      if (datos.modo === 'google' && datos.rango && datos.huecos) return datos;
    }
  } catch {
    // Sin servidor (p. ej. hosting estático) o sin conexión: modo provisional
  }
  return disponibilidadProvisional(ahora);
}
