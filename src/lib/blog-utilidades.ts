/**
 * Utilidades puras del blog (sin dependencias de Astro, para poder probarlas con tests unitarios).
 */

/** Texto sin marcado de un Markdown: sin comentarios HTML, etiquetas, enlaces ni símbolos de formato. */
export function textoPlano(markdown: string): string {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*(#+|>+|[-+*]|\d+\.)\s+/gm, '') // títulos, citas y viñetas al inicio de línea
    .replace(/[*_`~]/g, '') // negritas, cursivas y código
    .replace(/\|/g, ' ') // tablas
    .replace(/\s+/g, ' ')
    .trim();
}

export const PALABRAS_POR_MINUTO = 200;

/** Minutos de lectura (mínimo 1), o 0 si el artículo aún no tiene texto. */
export function tiempoLectura(markdown: string): number {
  const palabras = textoPlano(markdown).split(' ').filter(Boolean).length;
  return palabras === 0 ? 0 : Math.max(1, Math.round(palabras / PALABRAS_POR_MINUTO));
}

/**
 * Variantes con las que puede llegar una URL antigua: tal cual aparece en Google (con «%BF», «%3A» en
 * Latin-1), con los códigos en minúsculas, decodificada y vuelta a codificar en UTF-8 («¿» → «%C2%BF»,
 * «%3A» → «:»), y cada una con y sin barra final.
 */
export function variantesUrlAntigua(url: string): string[] {
  const minusculas = url.replace(/%[0-9A-F]{2}/g, (c) => c.toLowerCase());
  const decodificada = url.replace(/%([0-9A-F]{2})/gi, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  const utf8 = encodeURI(decodificada);
  const bases = [url, minusculas, utf8];
  const todas = bases.flatMap((u) => [u, u.endsWith('/') ? u.slice(0, -1) : `${u}/`]);
  return [...new Set(todas)];
}

export interface Redireccion {
  desde: string;
  hasta: string;
}

/** Contenido del archivo `_redirects` (formato de Netlify y Cloudflare Pages): una línea por variante. */
export function archivoRedirects(redirecciones: Redireccion[]): string {
  const lineas = redirecciones.flatMap(({ desde, hasta }) =>
    variantesUrlAntigua(desde).map((variante) => `${variante}  ${hasta}  301`),
  );
  return [
    '# Generado automáticamente en cada build (src/pages/[fichero].ts). No editar a mano.',
    '# Artículos de la web antigua → blog nuevo',
    ...lineas,
    '# Cualquier otra URL antigua de noticias → listado del blog',
    '/noticia  /blog  301',
    '/noticia/*  /blog  301',
    '',
  ].join('\n');
}
