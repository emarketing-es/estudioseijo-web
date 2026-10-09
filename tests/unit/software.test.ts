import { describe, expect, it } from 'vitest';
import { formatoCuota, licencias } from '@/data/software';

describe('licencias de software', () => {
  it('formatea las cuotas como la maqueta', () => {
    expect(formatoCuota(12.36)).toBe('12,36 €/mes');
    expect(formatoCuota(39)).toBe('39 €/mes');
  });

  it('son las 10 de la oferta, con Agentes IA a consultar', () => {
    expect(licencias).toHaveLength(10);
    expect(licencias.find((l) => l.nombre === 'Agentes IA')?.cuota).toBeNull();
  });
});
