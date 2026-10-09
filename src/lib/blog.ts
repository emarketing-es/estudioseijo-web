import { getCollection, type CollectionEntry } from 'astro:content';

export type Articulo = CollectionEntry<'blog'>;

/** Artículos publicados (sin borradores), del más reciente al más antiguo. */
export async function articulosPublicados(): Promise<Articulo[]> {
  const articulos = await getCollection('blog', ({ data }) => !data.draft);
  return articulos.sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime());
}

export const urlArticulo = (articulo: Articulo) => `/blog/${articulo.id}`;
