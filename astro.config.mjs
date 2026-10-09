// @ts-check
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';

// Configuración de Astro.
// Todas las páginas se generan como HTML estático; solo /api/disponibilidad y /api/reservas se ejecutan en el
// servidor. Adaptador de Node mientras el hosting está por decidir (en Netlify o Cloudflare se cambia esta línea).
export default defineConfig({
  site: 'https://estudioseijo.com',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  adapter: node({ mode: 'standalone' }),
  integrations: [
    // sitemap-index.xml con las páginas indexables (sin confirmación de reserva, CMS ni páginas técnicas)
    sitemap({
      filter: (pagina) => !/\/(reserva\/confirmada|admin|404)(\/|$)/.test(new URL(pagina).pathname),
    }),
  ],
  devToolbar: {
    enabled: false,
  },
  // Variables del servidor (se leen al ejecutarse, no se incluyen en el código del navegador). Ver .env.example.
  env: {
    schema: {
      GOOGLE_CALENDAR_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_SERVICE_ACCOUNT_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      GOOGLE_IMPERSONATE_USER: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_OAUTH_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_OAUTH_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_OAUTH_REFRESH_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_API_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_TOKEN_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      MAIL_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
      MAIL_AVISOS: envField.string({ context: 'server', access: 'secret', default: 'info@estudioseijo.com' }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_HOST: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PORT: envField.number({ context: 'server', access: 'secret', default: 587 }),
      SMTP_USER: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PASSWORD: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESERVAS_LIMITE_POR_IP: envField.number({ context: 'server', access: 'secret', default: 5 }),
      PRUEBAS_AHORA: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
