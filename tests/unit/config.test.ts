import { describe, expect, it } from 'vitest';
import { aSlug, categorias, categoriaPorSlug } from '@/config/blog';
import { contacto, menuLegal, menuPrincipal } from '@/config/sitio';

describe('datos de contacto', () => {
  it('los enlaces de teléfono y WhatsApp corresponden a los números visibles', () => {
    const soloDigitos = (s: string) => s.replace(/\D/g, '');
    expect(contacto.telefono.enlace).toBe(`tel:+34${soloDigitos(contacto.telefono.visible)}`);
    expect(contacto.whatsapp.enlace).toBe(`https://wa.me/34${soloDigitos(contacto.whatsapp.visible)}`);
    expect(contacto.email.enlace).toBe(`mailto:${contacto.email.visible}`);
  });
});

describe('menús', () => {
  it('todos los enlaces internos empiezan por /', () => {
    for (const enlace of [...menuPrincipal, ...menuLegal]) {
      expect(enlace.href.startsWith('/')).toBe(true);
    }
  });
});

describe('aSlug', () => {
  it('quita tildes, signos y mayúsculas', () => {
    expect(aSlug('Automatización e IA')).toBe('automatizacion-e-ia');
    expect(aSlug('  ¿Tu web cumple la normativa?  ')).toBe('tu-web-cumple-la-normativa');
    expect(aSlug('SEO y captación')).toBe('seo-y-captacion');
  });
});

describe('categorías del blog', () => {
  it('son las 6 de CLAUDE.md y su slug se deriva del nombre', () => {
    expect(categorias).toHaveLength(6);
    for (const c of categorias) {
      expect(c.slug).toBe(aSlug(c.nombre));
      expect(categoriaPorSlug(c.slug)).toBe(c);
    }
  });

  it('devuelve undefined para una categoría inexistente', () => {
    expect(categoriaPorSlug('no-existe')).toBeUndefined();
  });
});
