import { getCollection, type CollectionEntry } from 'astro:content';
import { tiempoLectura } from './blog-utilidades';

export type Articulo = CollectionEntry<'blog'>;

/** Artículos publicados (sin borradores), del más reciente al más antiguo. */
export async function articulosPublicados(): Promise<Articulo[]> {
  const articulos = await getCollection('blog', ({ data }) => !data.draft);
  return articulos.sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime());
}

export const urlArticulo = (articulo: Articulo) => `/blog/${articulo.id}`;

export const minutosLectura = (articulo: Articulo) => tiempoLectura(articulo.body ?? '');

/**
 * Artículos relacionados: primero los de la misma categoría y después los más recientes del resto,
 * sin repetir el propio artículo.
 */
export function relacionados(articulo: Articulo, todos: Articulo[], cuantos = 3): Articulo[] {
  const otros = todos.filter((a) => a.id !== articulo.id);
  const mismaCategoria = otros.filter((a) => a.data.categoria === articulo.data.categoria);
  const resto = otros.filter((a) => a.data.categoria !== articulo.data.categoria);
  return [...mismaCategoria, ...resto].slice(0, cuantos);
}
