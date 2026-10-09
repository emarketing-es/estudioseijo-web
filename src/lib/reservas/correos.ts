/**
 * Textos de los correos de la reserva (confirmación al cliente y aviso interno). Funciones puras.
 */
import { contacto, sitio } from '@/config/sitio';
import { etiquetaDia } from './fechas';
import type { SolicitudReserva } from './validacion';

export interface Correo {
  para: string;
  asunto: string;
  texto: string;
  html: string;
  responderA?: string;
}

const escapar = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const parrafos = (texto: string) =>
  texto
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 14px">${escapar(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

function envolver(texto: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#0A0A0A;max-width:560px">${parrafos(texto)}</div>`;
}

export function cuando(s: Pick<SolicitudReserva, 'fecha' | 'hora'>): string {
  return `${etiquetaDia(s.fecha)}, ${s.hora} h`;
}

export function correoCliente(s: SolicitudReserva, detalles: { meet?: string; lugar?: string }): Correo {
  const donde =
    s.modalidad === 'Videoconferencia'
      ? `Videoconferencia${detalles.meet ? `: ${detalles.meet}` : ' (el enlace está en la invitación de Google Calendar)'}`
      : `Presencial en ${detalles.lugar ?? contacto.localidad}`;
  const texto = [
    `Hola, ${s.nombre}:`,
    `Tu revisión digital gratuita con ${sitio.nombre} está reservada.`,
    `Cuándo: ${cuando(s)} (hora de Madrid)\nDuración de la primera reunión: 1 h aprox.\nModalidad: ${donde}`,
    'También te hemos enviado la invitación de Google Calendar para que la tengas en tu agenda.',
    `Si necesitas cambiar la fecha, responde a este correo, llámanos al ${contacto.telefono.visible} o escríbenos por WhatsApp al ${contacto.whatsapp.visible}.`,
    `Un saludo,\n${sitio.nombre}`,
  ].join('\n\n');
  return {
    para: s.email,
    asunto: `Reunión confirmada: revisión digital gratuita · ${cuando(s)}`,
    texto,
    html: envolver(texto),
    responderA: contacto.email.visible,
  };
}

export function correoAviso(s: SolicitudReserva, para: string, detalles: { enlaceEvento?: string }): Correo {
  const texto = [
    'Nueva reserva de revisión digital gratuita.',
    [
      `Cuándo: ${cuando(s)}`,
      `Modalidad: ${s.modalidad}`,
      `Nombre: ${s.nombre}`,
      s.empresa && `Empresa: ${s.empresa}`,
      `Email: ${s.email}`,
      s.telefono && `Teléfono: ${s.telefono}`,
    ]
      .filter(Boolean)
      .join('\n'),
    s.mensaje && `Qué le gustaría mejorar:\n${s.mensaje}`,
    detalles.enlaceEvento && `Evento en Google Calendar: ${detalles.enlaceEvento}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  return {
    para,
    asunto: `Nueva reserva · ${cuando(s)} · ${s.nombre}`,
    texto,
    html: envolver(texto),
    responderA: s.email,
  };
}

/** Descripción del evento en Google Calendar. */
export function descripcionEvento(s: SolicitudReserva): string {
  return [
    `Revisión digital gratuita (aprox. 4 h de dedicación; esta es la primera reunión, 1 h aprox.).`,
    `Modalidad: ${s.modalidad}`,
    `Nombre: ${s.nombre}${s.empresa ? ` (${s.empresa})` : ''}`,
    `Email: ${s.email}${s.telefono ? ` · Tel.: ${s.telefono}` : ''}`,
    s.mensaje && `Qué le gustaría mejorar: ${s.mensaje}`,
    `Reservado desde ${sitio.url}`,
  ]
    .filter(Boolean)
    .join('\n');
}
