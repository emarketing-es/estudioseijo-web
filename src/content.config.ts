/**
 * Colecciones de contenido. El blog se escribe en Markdown (src/content/blog) y, desde la fase 3,
 * también desde Decap CMS en /admin.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { nombresCategorias } from '@/config/blog';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    /** Entradilla de la tarjeta y meta description. */
    resumen: z.string(),
    fecha: z.coerce.date(),
    categoria: z.enum(nombresCategorias),
    autor: z.string().default('Estudio Seijo'),
    /** URL del artículo en la web antigua, tal como aparece en Google (para la redirección 301). */
    urlAntigua: z.string().startsWith('/noticia/').optional(),
    /** Los borradores no se publican ni aparecen en listados. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
