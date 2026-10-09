/**
 * Construye las dependencias del servicio de reservas a partir de las variables de entorno del servidor.
 * Se crea una sola vez por proceso (así la caché y el límite por IP se comparten entre peticiones).
 */
import {
  GOOGLE_API_URL,
  GOOGLE_CALENDAR_ID,
  GOOGLE_IMPERSONATE_USER,
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_OAUTH_REFRESH_TOKEN,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  GOOGLE_TOKEN_URL,
  MAIL_AVISOS,
  MAIL_FROM,
  PRUEBAS_AHORA,
  RESEND_API_KEY,
  RESERVAS_LIMITE_POR_IP,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USER,
  TURNSTILE_SECRET_KEY,
} from 'astro:env/server';
import { reglasReserva } from '@/config/reservas';
import { contacto, sitio } from '@/config/sitio';
import { crearClienteGoogle, type CredencialesGoogle } from '@/lib/reservas/google';
import { enviarCorreo, type ConfigCorreo } from './correo';
import { crearLimitador } from './limite';
import { crearServicioReservas, type ServicioReservas } from './reservas';
import { verificarTurnstile } from './turnstile';

function credencialesGoogle(): CredencialesGoogle | null {
  if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY && GOOGLE_IMPERSONATE_USER) {
    return {
      tipo: 'cuenta-servicio',
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      clavePrivada: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      usuario: GOOGLE_IMPERSONATE_USER,
    };
  }
  if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REFRESH_TOKEN) {
    return {
      tipo: 'oauth',
      clienteId: GOOGLE_OAUTH_CLIENT_ID,
      clienteSecreto: GOOGLE_OAUTH_CLIENT_SECRET,
      refreshToken: GOOGLE_OAUTH_REFRESH_TOKEN,
    };
  }
  return null;
}

function configCorreo(): ConfigCorreo {
  if (MAIL_FROM && RESEND_API_KEY) return { tipo: 'resend', remitente: MAIL_FROM, apiKey: RESEND_API_KEY };
  if (MAIL_FROM && SMTP_HOST) {
    return {
      tipo: 'smtp',
      remitente: MAIL_FROM,
      host: SMTP_HOST,
      puerto: SMTP_PORT,
      usuario: SMTP_USER,
      clave: SMTP_PASSWORD,
    };
  }
  return { tipo: 'consola', mostrarContenido: import.meta.env.DEV };
}

/**
 * «Ahora» fijo para las pruebas automáticas. Solo se respeta si además se usa un Google simulado
 * (GOOGLE_API_URL), para que nunca pueda afectar a la web real.
 */
function relojDelServidor(): () => Date {
  if (PRUEBAS_AHORA && GOOGLE_API_URL) {
    const fijo = new Date(PRUEBAS_AHORA);
    if (!Number.isNaN(fijo.getTime())) return () => fijo;
  }
  return () => new Date();
}

let servicio: ServicioReservas | null = null;

export function servicioReservas(): ServicioReservas {
  if (servicio) return servicio;
  const credenciales = credencialesGoogle();
  const correo = configCorreo();
  servicio = crearServicioReservas({
    reglas: reglasReserva,
    zona: sitio.zonaHoraria,
    ahora: relojDelServidor(),
    google:
      credenciales && GOOGLE_CALENDAR_ID
        ? crearClienteGoogle({
            credenciales,
            calendarioId: GOOGLE_CALENDAR_ID,
            urlApi: GOOGLE_API_URL,
            urlToken: GOOGLE_TOKEN_URL,
          })
        : null,
    enviarCorreo: (c) => enviarCorreo(correo, c),
    emailAvisos: MAIL_AVISOS,
    // PENDIENTE: dirección exacta para las reuniones presenciales
    lugarPresencial: contacto.direccion ?? `${contacto.localidad} (${contacto.provincia})`,
    verificarTurnstile: TURNSTILE_SECRET_KEY
      ? (token, ip) => verificarTurnstile(TURNSTILE_SECRET_KEY!, token, ip)
      : null,
    limitador: crearLimitador({ maximo: RESERVAS_LIMITE_POR_IP, ventanaMs: 10 * 60_000 }),
  });
  return servicio;
}
