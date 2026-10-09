/**
 * Reseñas de clientes. NUNCA se inventan: solo reseñas reales publicadas en Google.
 * Mientras la lista esté vacía (o tenga menos de las necesarias) se muestran huecos «Pendiente».
 * Más adelante se podrán cargar desde Google Business Profile con el mismo formato.
 */
import { z } from 'astro/zod';
import datos from './opiniones.json';

const esquemaOpinion = z.object({
  autor: z.string(),
  /** Empresa y servicio, p. ej. «Ferretería X · Tienda online». */
  detalle: z.string(),
  texto: z.string(),
  valoracion: z.number().int().min(1).max(5),
  /** Fecha de la reseña en Google (AAAA-MM-DD). */
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type Opinion = z.infer<typeof esquemaOpinion>;

export const opiniones: Opinion[] = z.array(esquemaOpinion).parse(datos);

/** Resumen de la ficha de Google. PENDIENTE: valoración media y número de reseñas reales. */
export const resumenGoogle: { media: number | null; total: number | null } = { media: null, total: null };
