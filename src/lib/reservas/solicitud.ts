/**
 * Validación y texto de la solicitud de reserva (comportamiento de la maqueta). Funciones puras.
 * En la fase 4 la validación se repite en el servidor con zod antes de crear el evento en Google Calendar.
 */
import { etiquetaDia, type FechaISO } from './fechas';

export interface DatosSolicitud {
  fecha: FechaISO | null;
  hora: string | null;
  modalidad: string;
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  mensaje: string;
  privacidad: boolean;
}

export type CampoConError = 'fecha' | 'nombre' | 'email' | 'privacidad';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Devuelve el primer problema encontrado (en el orden del formulario) o null si todo es correcto. */
export function validarSolicitud(datos: DatosSolicitud): { campo: CampoConError; mensaje: string } | null {
  if (!datos.fecha || !datos.hora) return { campo: 'fecha', mensaje: 'Elige un día y una hora disponibles.' };
  if (!datos.nombre.trim()) return { campo: 'nombre', mensaje: 'Escribe tu nombre.' };
  if (!EMAIL.test(datos.email.trim()))
    return { campo: 'email', mensaje: 'Revisa el email: parece incompleto.' };
  if (!datos.privacidad)
    return { campo: 'privacidad', mensaje: 'Para reservar, acepta la política de privacidad.' };
  return null;
}

/** Resumen de la selección: «Lunes 12 de octubre · 09:30 h · Videoconferencia». */
export function resumenSeleccion(fecha: FechaISO | null, hora: string | null, modalidad: string): string {
  if (fecha && hora) return `${etiquetaDia(fecha)} · ${hora} h · ${modalidad}`;
  if (fecha) return `${etiquetaDia(fecha)} · elige una hora`;
  return 'Elige día y hora en el calendario';
}

/** Texto que se envía por WhatsApp o email. */
export function textoSolicitud(d: DatosSolicitud & { fecha: FechaISO; hora: string }): string {
  const nombre = d.nombre.trim();
  const empresa = d.empresa.trim();
  const telefono = d.telefono.trim();
  const mensaje = d.mensaje.trim();
  return (
    'Hola, quiero reservar la revisión digital gratuita.\n' +
    `Fecha: ${etiquetaDia(d.fecha)} a las ${d.hora} h\n` +
    `Modalidad: ${d.modalidad}\n` +
    `Nombre: ${nombre}${empresa ? ` (${empresa})` : ''}\n` +
    `Email: ${d.email.trim()}${telefono ? ` · Tel.: ${telefono}` : ''}` +
    (mensaje ? `\nQué me gustaría mejorar: ${mensaje}` : '')
  );
}

export function enlaceWhatsapp(numero: string, texto: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export function enlaceEmail(email: string, fecha: FechaISO, hora: string, texto: string): string {
  const asunto = `Reserva revisión digital gratuita · ${etiquetaDia(fecha)} ${hora}`;
  return `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`;
}
