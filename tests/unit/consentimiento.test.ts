import { describe, expect, it } from 'vitest';
import { eventoDeEnlace } from '@/lib/analitica';
import { CLAVE_CONSENTIMIENTO, guardarConsentimiento, leerConsentimiento } from '@/lib/consentimiento';

function almacen(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  };
}

describe('consentimiento de cookies', () => {
  it('sin decisión previa devuelve null (se muestra el aviso)', () => {
    expect(leerConsentimiento(almacen())).toBeNull();
  });

  it('guarda y recupera la decisión', () => {
    const a = almacen();
    guardarConsentimiento(a, true, new Date('2026-10-09T10:00:00Z'));
    expect(leerConsentimiento(a)).toEqual({ analitica: true, fecha: '2026-10-09T10:00:00.000Z', version: 1 });
    guardarConsentimiento(a, false);
    expect(leerConsentimiento(a)?.analitica).toBe(false);
  });

  it('ignora datos corruptos o de otra versión (vuelve a preguntar)', () => {
    expect(leerConsentimiento(almacen({ [CLAVE_CONSENTIMIENTO]: '{roto' }))).toBeNull();
    expect(
      leerConsentimiento(almacen({ [CLAVE_CONSENTIMIENTO]: '{"analitica":true,"version":0}' })),
    ).toBeNull();
  });

  it('si el almacenamiento está bloqueado no rompe la página', () => {
    const bloqueado = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    };
    expect(leerConsentimiento(bloqueado)).toBeNull();
    expect(guardarConsentimiento(bloqueado, true).analitica).toBe(true);
  });
});

describe('eventos de enlaces', () => {
  const enlace = (href: string, evento?: string) =>
    ({ href, dataset: evento ? { evento } : {} }) as unknown as HTMLAnchorElement;

  it('detecta teléfono y WhatsApp por el enlace o por data-evento', () => {
    expect(eventoDeEnlace(enlace('tel:+34981774892'))).toBe('click_telefono');
    expect(eventoDeEnlace(enlace('https://wa.me/34633923567?text=hola'))).toBe('click_whatsapp');
    expect(eventoDeEnlace(enlace('https://estudioseijo.com/x', 'click_whatsapp'))).toBe('click_whatsapp');
    expect(eventoDeEnlace(enlace('https://estudioseijo.com/blog'))).toBeNull();
  });
});
