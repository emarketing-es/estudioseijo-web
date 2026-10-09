/**
 * Reglas de la reserva de la revisión digital gratuita.
 * PENDIENTE: horario de reuniones, duración y festivos definitivos (los aporta Estudio Seijo).
 * Mientras tanto se usan los valores de la maqueta aprobada.
 */
import festivos from '../../config/festivos.json';

export interface ReglasReserva {
  /** Días con reuniones: 1 = lunes … 7 = domingo. */
  diasLaborables: number[];
  /** Horas de inicio de las reuniones (hora de Madrid, HH:MM). */
  franjas: string[];
  /** Días de antelación mínima (1 = a partir de mañana). En la fase 4 pasa a 24 h exactas. */
  antelacionDias: number;
  /** Hasta cuántos días vista se puede reservar. */
  horizonteDias: number;
  /** Festivos y días cerrados (AAAA-MM-DD). */
  festivos: string[];
}

export const reglasReserva: ReglasReserva = {
  diasLaborables: [1, 2, 3, 4, 5],
  franjas: ['09:30', '11:00', '12:30', '16:30', '18:00'],
  antelacionDias: 1,
  horizonteDias: 60,
  festivos: festivos.fechas,
};

export const modalidades = ['Videoconferencia', 'Presencial en Betanzos'] as const;
export type Modalidad = (typeof modalidades)[number];
