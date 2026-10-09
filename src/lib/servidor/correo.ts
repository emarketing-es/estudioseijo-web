/**
 * Envío de correo con el servicio configurado: Resend (API HTTP) o SMTP. Sin configuración, solo se
 * registra en la consola que no se ha enviado (en desarrollo, también el contenido).
 */
import type { Correo } from '@/lib/reservas/correos';

export type ConfigCorreo =
  | { tipo: 'resend'; remitente: string; apiKey: string }
  | { tipo: 'smtp'; remitente: string; host: string; puerto: number; usuario?: string; clave?: string }
  | { tipo: 'consola'; mostrarContenido: boolean };

export async function enviarCorreo(
  config: ConfigCorreo,
  correo: Correo,
  pedir: typeof fetch = fetch,
): Promise<void> {
  if (config.tipo === 'consola') {
    console.info(`[correo] Sin servicio de correo configurado: no se envía «${correo.asunto}».`);
    if (config.mostrarContenido) console.info(`[correo] Para: ${correo.para}\n${correo.texto}`);
    return;
  }
  if (config.tipo === 'resend') {
    const r = await pedir('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: config.remitente,
        to: [correo.para],
        subject: correo.asunto,
        text: correo.texto,
        html: correo.html,
        reply_to: correo.responderA,
      }),
    });
    if (!r.ok) throw new Error(`Resend respondió ${r.status}`);
    return;
  }
  const { createTransport } = await import('nodemailer');
  const transporte = createTransport({
    host: config.host,
    port: config.puerto,
    secure: config.puerto === 465,
    auth: config.usuario ? { user: config.usuario, pass: config.clave } : undefined,
  });
  await transporte.sendMail({
    from: config.remitente,
    to: correo.para,
    subject: correo.asunto,
    text: correo.texto,
    html: correo.html,
    replyTo: correo.responderA,
  });
}
