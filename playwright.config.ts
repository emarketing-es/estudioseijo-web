import { defineConfig, devices } from '@playwright/test';

const PUERTO = 4321;
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
  webServer: {
    command: `pnpm preview --port ${PUERTO} --ignore-lock`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
