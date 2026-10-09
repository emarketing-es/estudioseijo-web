/**
 * Genera en el build el archivo `/_redirects` (redirecciones 301 de Netlify y Cloudflare Pages) a partir del
 * campo `urlAntigua` de cada artículo. Al añadir un artículo con URL antigua, su redirección se crea sola.
 * (Las páginas cuyo nombre empieza por «_» no se publican en Astro; por eso el nombre va como parámetro.)
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { archivoRedirects } from '@/lib/blog-utilidades';

export const getStaticPaths = (() => [{ params: { fichero: '_redirects' } }]) satisfies GetStaticPaths;

export const GET: APIRoute = async () => {
  // También los borradores con URL antigua: si se despublica un artículo, su URL antigua no da 404
  // mientras exista el archivo. Los borradores sin página redirigen al listado.
  const articulos = await getCollection('blog');
  const redirecciones = articulos
    .filter((a) => a.data.urlAntigua)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((a) => ({ desde: a.data.urlAntigua!, hasta: a.data.draft ? '/blog' : `/blog/${a.id}` }));
  return new Response(archivoRedirects(redirecciones), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
