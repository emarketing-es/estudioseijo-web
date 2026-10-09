/**
 * Colecciones de contenido. El blog se escribe en Markdown (src/content/blog), a mano o desde Decap CMS
 * en /admin (public/admin/config.yml debe tener los mismos campos que este esquema).
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { nombresCategorias } from '@/config/blog';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z
    .object({
      titulo: z.string(),
      /** Entradilla de la tarjeta y meta description. */
      resumen: z.string(),
      fecha: z.coerce.date(),
      categoria: z.enum(nombresCategorias),
      /** Si se deja vacío (también desde el CMS), firma «Estudio Seijo». */
      autor: z
        .string()
        .optional()
        .transform((v) => v?.trim() || 'Estudio Seijo'),
      /** Imagen de cabecera opcional (ruta pública, p. ej. /img/blog/foto.jpg). Sin ella, composición geométrica. */
      imagen: z.string().startsWith('/img/').optional(),
      /** Texto alternativo de la imagen (obligatorio si hay imagen). */
      imagenAlt: z.string().optional(),
      /** URL del artículo en la web antigua, tal como aparece en Google (para la redirección 301). */
      urlAntigua: z.string().startsWith('/noticia/').optional(),
      /** Los borradores no se publican ni aparecen en listados. */
      draft: z.boolean().default(false),
    })
    .refine((d) => !d.imagen || (d.imagenAlt && d.imagenAlt.trim().length > 0), {
      message: 'Si el artículo tiene imagen, necesita un texto alternativo (imagenAlt).',
      path: ['imagenAlt'],
    }),
});

/**
 * Textos legales (aviso legal, privacidad, cookies). Los aporta Estudio Seijo / asesoría: mientras
 * `pendiente` sea true, la página muestra el aviso de plantilla pendiente de revisión.
 */
const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    pendiente: z.boolean().default(true),
    actualizado: z.coerce.date().optional(),
  }),
});

export const collections = { blog, legal };
