/**
 * Categorías del blog (CLAUDE.md). El `slug` es el segmento de la URL /blog/categoria/[slug] y `clase`
 * elige la composición geométrica de colores de la tarjeta (`.cat-*` en secciones.css).
 */
export const categorias = [
  { nombre: 'Web y ecommerce', slug: 'web-y-ecommerce', clase: 'cat-web' },
  { nombre: 'SEO y captación', slug: 'seo-y-captacion', clase: 'cat-seo' },
  { nombre: 'Analítica y datos', slug: 'analitica-y-datos', clase: 'cat-datos' },
  { nombre: 'Normativa y cumplimiento', slug: 'normativa-y-cumplimiento', clase: 'cat-normativa' },
  { nombre: 'Automatización e IA', slug: 'automatizacion-e-ia', clase: 'cat-ia' },
  { nombre: 'Software de gestión', slug: 'software-de-gestion', clase: 'cat-software' },
] as const;

export type Categoria = (typeof categorias)[number];
export type NombreCategoria = Categoria['nombre'];

/** Convierte un texto en un segmento de URL: minúsculas, sin tildes ni signos. */
export function aSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function categoriaPorSlug(slug: string): Categoria | undefined {
  return categorias.find((c) => c.slug === slug);
}

export function categoriaPorNombre(nombre: string): Categoria | undefined {
  return categorias.find((c) => c.nombre === nombre);
}

export const nombresCategorias = categorias.map((c) => c.nombre) as [NombreCategoria, ...NombreCategoria[]];

/** Fecha de un artículo como en la maqueta: 14/09/2026. Las fechas del frontmatter son días (UTC). */
export function formatoFecha(fecha: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(fecha);
}
