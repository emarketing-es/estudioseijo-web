import { defineConfig, devices } from '@playwright/test';

const PUERTO = 4321;
/** Segunda copia del sitio conectada al Google simulado (tests/e2e/google-simulado.mjs). */
export const PUERTO_CON_GOOGLE = 4322;
const PUERTO_GOOGLE_SIMULADO = 4599;
// Ruta opcional a un Chromium ya instalado (p. ej. en contenedores sin descarga de navegadores).
const chromiumLocal = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    trace: 'retain-on-failure',
    launchOptions: chromiumLocal ? { executablePath: chromiumLocal } : {},
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  // Se prueba la versión construida (`pnpm build`), igual que la que se publicará.
  webServer: [
    {
      // Sitio sin credenciales de Google: la reserva funciona en modo provisional (WhatsApp/email)
      command: `pnpm preview --port ${PUERTO} --ignore-lock`,
      url: `http://localhost:${PUERTO}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'node tests/e2e/google-simulado.mjs',
      url: `http://localhost:${PUERTO_GOOGLE_SIMULADO}/__estado`,
      env: { PUERTO_GOOGLE_SIMULADO: String(PUERTO_GOOGLE_SIMULADO) },
      reuseExistingServer: !process.env.CI,
    },
    {
      // Sitio conectado al Google simulado, con «ahora» fijo: viernes 9/10/2026 a las 10:00 (Madrid)
      command: 'node dist/server/entry.mjs',
      url: `http://127.0.0.1:${PUERTO_CON_GOOGLE}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        HOST: '127.0.0.1',
        PORT: String(PUERTO_CON_GOOGLE),
        GOOGLE_CALENDAR_ID: 'calendario@pruebas.local',
        GOOGLE_OAUTH_CLIENT_ID: 'cliente-simulado',
        GOOGLE_OAUTH_CLIENT_SECRET: 'secreto-simulado',
        GOOGLE_OAUTH_REFRESH_TOKEN: 'refresh-simulado',
        GOOGLE_API_URL: `http://localhost:${PUERTO_GOOGLE_SIMULADO}`,
        GOOGLE_TOKEN_URL: `http://localhost:${PUERTO_GOOGLE_SIMULADO}/token`,
        PRUEBAS_AHORA: '2026-10-09T08:00:00Z',
        RESERVAS_LIMITE_POR_IP: '1000',
      },
    },
  ],
});
