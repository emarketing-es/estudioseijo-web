/**
 * Categorías del blog (CLAUDE.md). El `slug` es el segmento de la URL /blog/categoria/[slug].
 */
export const categorias = [
  { nombre: 'Web y ecommerce', slug: 'web-y-ecommerce' },
  { nombre: 'SEO y captación', slug: 'seo-y-captacion' },
  { nombre: 'Analítica y datos', slug: 'analitica-y-datos' },
  { nombre: 'Normativa y cumplimiento', slug: 'normativa-y-cumplimiento' },
  { nombre: 'Automatización e IA', slug: 'automatizacion-e-ia' },
  { nombre: 'Software de gestión', slug: 'software-de-gestion' },
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
