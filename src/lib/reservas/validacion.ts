/**
 * Validación en servidor de una solicitud de reserva (POST /api/reservas). Nunca se confía en la del navegador.
 */
import { z } from 'astro/zod';
import { modalidades } from '@/config/reservas';

// Se buscan justamente caracteres de control: tabulador y saltos de línea sí se permiten
// eslint-disable-next-line no-control-regex
const CARACTERES_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const textoLimpio = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    // Sin caracteres de control (evita cabeceras inyectadas en correos y textos raros en el calendario)
    .refine((v) => !CARACTERES_CONTROL.test(v), 'Contiene caracteres no válidos');

/** Campos de una línea (acaban en asuntos de correo y títulos de evento): sin saltos de línea. */
const lineaUnica = (max: number) =>
  textoLimpio(max).refine((v) => !/[\r\n]/.test(v), 'No puede tener saltos de línea');

export const esquemaReserva = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida'),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora no válida'),
  modalidad: z.enum(modalidades),
  nombre: lineaUnica(120).pipe(z.string().min(1, 'Escribe tu nombre.')),
  empresa: lineaUnica(120).optional().default(''),
  email: z.string().trim().max(254).pipe(z.email('Revisa el email: parece incompleto.')),
  telefono: lineaUnica(30).optional().default(''),
  mensaje: textoLimpio(2000).optional().default(''),
  privacidad: z.literal(true, { message: 'Para reservar, acepta la política de privacidad.' }),
  /** Token de Cloudflare Turnstile (si está activado). */
  turnstile: z.string().max(2048).optional().default(''),
  /** Campo trampa: invisible para las personas; si llega relleno, es un bot. */
  web: z.string().max(500).optional().default(''),
});

export type SolicitudReserva = z.infer<typeof esquemaReserva>;

/** Primer error en formato sencillo para la interfaz: { campo, mensaje }. */
export function primerError(error: z.ZodError): { campo: string; mensaje: string } {
  const issue = error.issues[0];
  return { campo: String(issue?.path[0] ?? ''), mensaje: issue?.message ?? 'Datos no válidos' };
}
