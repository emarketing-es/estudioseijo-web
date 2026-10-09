/**
 * Origen de los huecos libres que muestra el calendario. La interfaz de reserva solo conoce este contrato,
 * así que en la fase 4 basta con cambiar el proveedor provisional por uno que llame a /api/disponibilidad.
 */
import { reglasReserva } from '@/config/reservas';
import {
  huecosProvisionales,
  primerDiaReservable,
  ultimoDiaReservable,
  type Disponibilidad,
} from './disponibilidad-provisional';
import type { FechaISO } from './fechas';

export interface ProveedorDisponibilidad {
  /** Primer y último día que se pueden reservar. */
  rango(hoy: FechaISO): { desde: FechaISO; hasta: FechaISO };
  huecos(hoy: FechaISO, desde: FechaISO, hasta: FechaISO): Promise<Disponibilidad>;
}

export const proveedorProvisional: ProveedorDisponibilidad = {
  rango: (hoy) => ({
    desde: primerDiaReservable(reglasReserva, hoy),
    hasta: ultimoDiaReservable(reglasReserva, hoy),
  }),
  huecos: async (hoy, desde, hasta) => huecosProvisionales(reglasReserva, hoy, desde, hasta),
};
