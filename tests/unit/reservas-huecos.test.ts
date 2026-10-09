import { describe, expect, it } from 'vitest';
import {
  calcularHuecos,
  huecoLibre,
  intervaloDeHueco,
  rangoReservable,
  type ReglasReserva,
} from '@/lib/reservas/huecos';
import { desfaseMinutos, fechaHoraEn, instanteEn } from '@/lib/reservas/zona-horaria';

const reglas: ReglasReserva = {
  diasLaborables: [1, 2, 3, 4, 5],
  franjas: ['09:30', '11:00', '12:30', '16:30', '18:00'],
  duracionMinutos: 60,
  margenMinutos: 15,
  antelacionHoras: 24,
  horizonteDias: 60,
  festivos: ['2026-10-12', '2026-12-08'],
};
// Viernes 9 de octubre de 2026, 10:00 en Madrid (UTC+2)
const AHORA = new Date('2026-10-09T08:00:00Z');

const madrid = (fecha: string, hora: string) => instanteEn(fecha, hora);

describe('zona horaria de Madrid', () => {
  it('desfase de verano (+2 h) e invierno (+1 h)', () => {
    expect(desfaseMinutos(new Date('2026-07-01T12:00:00Z'))).toBe(120);
    expect(desfaseMinutos(new Date('2026-12-01T12:00:00Z'))).toBe(60);
  });

  it('convierte hora de reloj a instante y viceversa', () => {
    expect(instanteEn('2026-10-13', '09:30').toISOString()).toBe('2026-10-13T07:30:00.000Z');
    expect(instanteEn('2026-11-03', '09:30').toISOString()).toBe('2026-11-03T08:30:00.000Z');
    expect(fechaHoraEn(new Date('2026-10-13T07:30:00Z'))).toEqual({ fecha: '2026-10-13', hora: '09:30' });
  });

  it('cambio de hora de octubre: el 25/10/2026 a las 03:00 vuelve a ser las 02:00', () => {
    expect(instanteEn('2026-10-24', '09:30').toISOString()).toBe('2026-10-24T07:30:00.000Z');
    expect(instanteEn('2026-10-26', '09:30').toISOString()).toBe('2026-10-26T08:30:00.000Z');
  });

  it('cambio de hora de marzo: el 28/03/2027 a las 02:00 pasan a ser las 03:00', () => {
    expect(instanteEn('2027-03-26', '09:30').toISOString()).toBe('2027-03-26T08:30:00.000Z');
    expect(instanteEn('2027-03-29', '09:30').toISOString()).toBe('2027-03-29T07:30:00.000Z');
  });
});

describe('calcularHuecos', () => {
  it('excluye fines de semana, festivos y las primeras 24 horas', () => {
    const huecos = calcularHuecos({ reglas, ahora: AHORA, desde: '2026-10-09', hasta: '2026-10-14' });
    expect(Object.keys(huecos)).toEqual(['2026-10-13', '2026-10-14']); // 10-11 finde, 12 festivo
    expect(huecos['2026-10-13']).toEqual(reglas.franjas);
  });

  it('la antelación es de 24 horas exactas, no de días', () => {
    // Lunes 19 a las 10:00 → el martes 20 solo valen las franjas desde las 10:00
    const lunes = madrid('2026-10-19', '10:00');
    const huecos = calcularHuecos({ reglas, ahora: lunes, desde: '2026-10-20', hasta: '2026-10-20' });
    expect(huecos['2026-10-20']).toEqual(['11:00', '12:30', '16:30', '18:00']);
  });

  it('respeta el horizonte de 60 días', () => {
    const { hasta } = rangoReservable(reglas, AHORA);
    expect(hasta).toBe('2026-12-08');
    const huecos = calcularHuecos({ reglas, ahora: AHORA, desde: '2026-12-07', hasta: '2026-12-31' });
    expect(Object.keys(huecos)).toEqual(['2026-12-07']); // el 8 es festivo y el 9 queda fuera
  });

  it('quita las franjas que se solapan con citas ocupadas, con el margen entre citas', () => {
    const ocupados = [
      { inicio: madrid('2026-10-14', '11:15'), fin: madrid('2026-10-14', '11:45') }, // pisa 11:00
      { inicio: madrid('2026-10-14', '13:30'), fin: madrid('2026-10-14', '14:00') }, // 12:30-13:30 + 15 min de margen
      { inicio: madrid('2026-10-14', '15:00'), fin: madrid('2026-10-14', '16:15') }, // 16:30 - 15 min de margen = 16:15: no pisa
    ];
    const huecos = calcularHuecos({
      reglas,
      ahora: AHORA,
      desde: '2026-10-14',
      hasta: '2026-10-14',
      ocupados,
    });
    expect(huecos['2026-10-14']).toEqual(['09:30', '16:30', '18:00']);
  });

  it('un día completamente ocupado no aparece', () => {
    const ocupados = [{ inicio: madrid('2026-10-15', '00:00'), fin: madrid('2026-10-16', '00:00') }];
    const huecos = calcularHuecos({
      reglas,
      ahora: AHORA,
      desde: '2026-10-15',
      hasta: '2026-10-15',
      ocupados,
    });
    expect(huecos).toEqual({});
  });

  it('funciona a ambos lados del cambio de hora de octubre', () => {
    const ocupados = [{ inicio: new Date('2026-10-26T08:30:00Z'), fin: new Date('2026-10-26T09:30:00Z') }]; // 09:30-10:30 Madrid (invierno)
    const huecos = calcularHuecos({
      reglas,
      ahora: AHORA,
      desde: '2026-10-23',
      hasta: '2026-10-26',
      ocupados,
    });
    expect(huecos['2026-10-23']).toEqual(reglas.franjas);
    expect(huecos['2026-10-26']).toEqual(['11:00', '12:30', '16:30', '18:00']);
  });

  it('funciona a ambos lados del cambio de hora de marzo', () => {
    const ahora = new Date('2027-03-01T09:00:00Z');
    const ocupados = [{ inicio: new Date('2027-03-29T07:30:00Z'), fin: new Date('2027-03-29T08:30:00Z') }]; // 09:30-10:30 Madrid (verano)
    const huecos = calcularHuecos({ reglas, ahora, desde: '2027-03-26', hasta: '2027-03-29', ocupados });
    expect(huecos['2027-03-26']).toEqual(reglas.franjas);
    expect(huecos['2027-03-29']).toEqual(['11:00', '12:30', '16:30', '18:00']);
  });
});

describe('huecoLibre e intervaloDeHueco', () => {
  it('re-comprueba un hueco concreto', () => {
    const ocupados = [{ inicio: madrid('2026-10-13', '09:30'), fin: madrid('2026-10-13', '10:30') }];
    expect(huecoLibre({ reglas, ahora: AHORA, ocupados }, '2026-10-13', '09:30')).toBe(false);
    expect(huecoLibre({ reglas, ahora: AHORA, ocupados }, '2026-10-13', '12:30')).toBe(true);
    expect(huecoLibre({ reglas, ahora: AHORA }, '2026-10-13', '10:00')).toBe(false); // no es una franja
    expect(huecoLibre({ reglas, ahora: AHORA }, '2026-10-10', '09:30')).toBe(false); // sábado
  });

  it('la reunión dura lo que dicen las reglas', () => {
    const { inicio, fin } = intervaloDeHueco(reglas, '2026-10-13', '18:00');
    expect(fin.getTime() - inicio.getTime()).toBe(60 * 60_000);
  });
});
