import { describe, expect, it } from 'vitest';
import type { ReglasReserva } from '@/config/reservas';
import { diaReservable, huecosProvisionales, proximoHueco } from '@/lib/reservas/disponibilidad-provisional';

const reglas: ReglasReserva = {
  diasLaborables: [1, 2, 3, 4, 5],
  franjas: ['09:30', '11:00'],
  antelacionDias: 1,
  horizonteDias: 60,
  festivos: ['2026-10-12'],
};
const HOY = '2026-10-09'; // viernes

describe('disponibilidad provisional', () => {
  it('no permite reservar hoy (antelación mínima)', () => {
    expect(diaReservable(reglas, HOY, HOY)).toBe(false);
  });

  it('excluye fines de semana y festivos', () => {
    expect(diaReservable(reglas, HOY, '2026-10-10')).toBe(false); // sábado
    expect(diaReservable(reglas, HOY, '2026-10-11')).toBe(false); // domingo
    expect(diaReservable(reglas, HOY, '2026-10-12')).toBe(false); // festivo
    expect(diaReservable(reglas, HOY, '2026-10-13')).toBe(true);
  });

  it('respeta el horizonte de reserva', () => {
    expect(diaReservable(reglas, HOY, '2026-12-08')).toBe(true); // martes, día 60
    expect(diaReservable(reglas, HOY, '2026-12-09')).toBe(false); // día 61
  });

  it('devuelve las franjas de cada día reservable', () => {
    const huecos = huecosProvisionales(reglas, HOY, '2026-10-09', '2026-10-14');
    expect(huecos).toEqual({ '2026-10-13': ['09:30', '11:00'], '2026-10-14': ['09:30', '11:00'] });
  });

  it('calcula el próximo hueco libre', () => {
    expect(proximoHueco(reglas, HOY)).toEqual({ fecha: '2026-10-13', hora: '09:30' });
    expect(proximoHueco({ ...reglas, franjas: [] }, HOY)).toBeNull();
  });
});
