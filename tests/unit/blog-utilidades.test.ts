import { describe, expect, it } from 'vitest';
import { archivoRedirects, textoPlano, tiempoLectura, variantesUrlAntigua } from '@/lib/blog-utilidades';

describe('textoPlano y tiempoLectura', () => {
  it('un artículo con solo el comentario PENDIENTE no tiene texto', () => {
    const cuerpo = '\n<!-- PENDIENTE (fase 3): copiar el texto -->\n';
    expect(textoPlano(cuerpo)).toBe('');
    expect(tiempoLectura(cuerpo)).toBe(0);
  });

  it('quita el marcado de Markdown y conserva el texto de los enlaces', () => {
    expect(textoPlano('## Título\n\nUn [enlace](/blog) y **negrita**.')).toBe('Título Un enlace y negrita.');
  });

  it('calcula los minutos a 200 palabras por minuto, con un mínimo de 1', () => {
    expect(tiempoLectura('hola mundo')).toBe(1);
    expect(tiempoLectura(Array(1000).fill('palabra').join(' '))).toBe(5);
  });
});

describe('redirecciones de las URL antiguas', () => {
  it('cubre la URL de Google, minúsculas, UTF-8 y barra final', () => {
    const v = variantesUrlAntigua('/noticia/%BFtu-pagina-web-cumple-la-normativaY');
    expect(v).toContain('/noticia/%BFtu-pagina-web-cumple-la-normativaY');
    expect(v).toContain('/noticia/%bftu-pagina-web-cumple-la-normativaY');
    expect(v).toContain('/noticia/%C2%BFtu-pagina-web-cumple-la-normativaY');
    expect(v).toContain('/noticia/%BFtu-pagina-web-cumple-la-normativaY/');
    expect(new Set(v).size).toBe(v.length);
  });

  it('decodifica «%3A» como dos puntos', () => {
    expect(variantesUrlAntigua('/noticia/auditoria-web%3A-7-errores')).toContain(
      '/noticia/auditoria-web:-7-errores',
    );
  });

  it('genera el archivo _redirects con 301 y la regla general de /noticia', () => {
    const archivo = archivoRedirects([{ desde: '/noticia/a%3Ab', hasta: '/blog/ab' }]);
    expect(archivo).toContain('/noticia/a%3Ab  /blog/ab  301');
    expect(archivo).toContain('/noticia/a:b/  /blog/ab  301');
    expect(archivo.trim().endsWith('/noticia/*  /blog  301')).toBe(true);
  });
});
