import { describe, expect, it } from 'vitest';
import {
  diaSemana,
  diasDelMes,
  etiquetaDia,
  etiquetaMes,
  hoyEn,
  sumarDias,
  sumarMeses,
} from '@/lib/reservas/fechas';

describe('fechas de calendario', () => {
  it('calcula el día de hoy en Madrid aunque en UTC sea otro día', () => {
    // 23:30 UTC del 9 de octubre = 01:30 del 10 de octubre en Madrid (verano, UTC+2)
    expect(hoyEn(new Date('2026-10-09T23:30:00Z'))).toBe('2026-10-10');
    // 23:30 UTC del 9 de diciembre = 00:30 del 10 en Madrid (invierno, UTC+1)
    expect(hoyEn(new Date('2026-12-09T23:30:00Z'))).toBe('2026-12-10');
    expect(hoyEn(new Date('2026-12-09T22:30:00Z'))).toBe('2026-12-09');
  });

  it('suma días cruzando meses, años y los cambios de hora', () => {
    expect(sumarDias('2026-10-24', 2)).toBe('2026-10-26'); // cambio de hora de octubre (25/10)
    expect(sumarDias('2027-03-27', 2)).toBe('2027-03-29'); // cambio de hora de marzo (28/03)
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('día de la semana: 1 = lunes … 7 = domingo', () => {
    expect(diaSemana('2026-10-12')).toBe(1);
    expect(diaSemana('2026-10-18')).toBe(7);
  });

  it('etiquetas en español', () => {
    expect(etiquetaDia('2026-10-12')).toBe('Lunes 12 de octubre');
    expect(etiquetaDia('2026-10-14')).toBe('Miércoles 14 de octubre');
    expect(etiquetaMes('2026-10')).toBe('Octubre 2026');
  });

  it('meses', () => {
    expect(sumarMeses('2026-12', 1)).toBe('2027-01');
    expect(sumarMeses('2026-01', -1)).toBe('2025-12');
    expect(diasDelMes('2026-02')).toHaveLength(28);
    expect(diasDelMes('2028-02')).toHaveLength(29);
    expect(diasDelMes('2026-10')[0]).toBe('2026-10-01');
  });
});
