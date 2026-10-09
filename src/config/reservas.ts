/**
 * Reglas de la reserva de la revisión digital gratuita.
 * PENDIENTE: horario de reuniones, margen entre citas y festivos definitivos (los aporta Estudio Seijo).
 * Mientras tanto se usan las franjas de la maqueta y los valores de CLAUDE.md.
 */
import type { ReglasReserva } from '@/lib/reservas/huecos';
import festivos from '../../config/festivos.json';

export type { ReglasReserva };

export const reglasReserva: ReglasReserva = {
  diasLaborables: [1, 2, 3, 4, 5],
  franjas: ['09:30', '11:00', '12:30', '16:30', '18:00'],
  duracionMinutos: 60,
  margenMinutos: 15, // PENDIENTE: confirmar
  antelacionHoras: 24,
  horizonteDias: 60,
  festivos: festivos.fechas,
};

export const modalidades = ['Videoconferencia', 'Presencial en Betanzos'] as const;
export type Modalidad = (typeof modalidades)[number];
