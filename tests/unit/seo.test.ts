import { describe, expect, it } from 'vitest';
import { esquemaArticulo, esquemaEmpresa, esquemaMigas, jsonLd } from '@/lib/seo';

describe('datos estructurados', () => {
  it('empresa: servicio profesional en Betanzos con la oferta gratuita', () => {
    const e = esquemaEmpresa();
    expect(e['@type']).toBe('ProfessionalService');
    expect(e).toMatchObject({
      telephone: '+34981774892',
      address: { addressLocality: 'Betanzos', addressCountry: 'ES' },
    });
    expect(e.makesOffer).toMatchObject({ price: '0', priceCurrency: 'EUR' });
  });

  it('artículo: BlogPosting con URL canónica (barra final), fecha e imagen absolutas', () => {
    const a = esquemaArticulo({
      titulo: 'T',
      resumen: 'R',
      ruta: '/blog/seo-basico-para-pymes',
      fecha: new Date('2026-04-17'),
      autor: 'Estudio Seijo',
      categoria: 'SEO y captación',
      imagen: '/img/og/blog-seo-y-captacion.png',
    });
    expect(a).toMatchObject({
      '@type': 'BlogPosting',
      url: 'https://estudioseijo.com/blog/seo-basico-para-pymes/',
      datePublished: '2026-04-17',
      image: 'https://estudioseijo.com/img/og/blog-seo-y-captacion.png',
    });
  });

  it('migas: posiciones consecutivas', () => {
    const m = esquemaMigas([
      { nombre: 'Blog', ruta: '/blog' },
      { nombre: 'SEO', ruta: '/blog/categoria/seo-y-captacion' },
    ]);
    expect(m.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Blog', item: 'https://estudioseijo.com/blog/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'SEO',
        item: 'https://estudioseijo.com/blog/categoria/seo-y-captacion/',
      },
    ]);
  });

  it('el JSON-LD no puede cerrar la etiqueta <script>', () => {
    expect(jsonLd({ texto: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
});
