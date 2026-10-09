import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { PUERTO_CON_GOOGLE } from '../../playwright.config';

// Sitio conectado al Google simulado, con «ahora» = viernes 9/10/2026 10:00 (Madrid) en servidor y navegador.
// Ocupación fija del simulador: miércoles 14 de octubre de 11:00 a 12:00.
const SIMULADOR = 'http://localhost:4599';
test.use({ baseURL: `http://127.0.0.1:${PUERTO_CON_GOOGLE}` });

/** Días distintos por proyecto (escritorio/móvil) para que las pruebas en paralelo no se pisen. */
const DIAS = {
  escritorio: {
    reserva: ['Martes 13 de octubre', '2026-10-13'],
    ocupado: ['Viernes 16 de octubre', '2026-10-16'],
  },
  movil: { reserva: ['Jueves 15 de octubre', '2026-10-15'], ocupado: ['Lunes 19 de octubre', '2026-10-19'] },
} as const;

interface EventoSimulado {
  summary: string;
  location?: string;
  attendees?: { email: string }[];
  start: { dateTime: string; timeZone: string };
  conferenceData?: { createRequest: { conferenceSolutionKey: { type: string } } };
  parametros: Record<string, string>;
}

const dia = (page: Page, etiqueta: string) => page.getByRole('button', { name: `${etiqueta}, disponible` });

async function abrir(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-09T08:00:00Z'));
  await page.goto('/#reserva');
  await expect(page.locator('#booking-widget')).toHaveAttribute('data-modo', 'google');
}

async function rellenar(page: Page, email: string) {
  await page.getByLabel('Nombre y apellidos').fill('Ana Pérez');
  await page.getByLabel('Empresa').fill('Ferretería Ana');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/Acepto la política de privacidad/).check();
}

const limpiar = (request: APIRequestContext, etiqueta: string) =>
  request.post(`${SIMULADOR}/__limpiar?etiqueta=${encodeURIComponent(etiqueta)}`);

test('muestra los huecos reales: quita los ocupados en Google con su margen', async ({ page }) => {
  await abrir(page);
  await dia(page, 'Miércoles 14 de octubre').click();
  await expect(page.locator('#slots .slot')).toHaveText(['09:30', '12:30', '16:30', '18:00']);
  await expect(page.locator('[data-proximo-hueco]')).toHaveText('Martes 13 de octubre, 09:30 h');
});

test('reserva completa: crea la reunión en Google Calendar con Meet y lleva a la confirmación', async ({
  page,
  request,
}, info) => {
  const email = `ana+${info.project.name}@ejemplo.es`;
  const [etiqueta, fecha] = DIAS[info.project.name as keyof typeof DIAS].reserva;
  await limpiar(request, email);
  await abrir(page);
  await dia(page, etiqueta).click();
  await page.getByRole('button', { name: '12:30' }).click();
  await rellenar(page, email);
  await page.getByRole('button', { name: 'Confirmar reunión' }).click();

  await expect(page).toHaveURL(
    new RegExp(`/reserva/confirmada\\?fecha=${fecha}&hora=12%3A30&modalidad=Videoconferencia`),
  );
  await expect(page.locator('#confirmada-resumen')).toHaveText(`${etiqueta} · 12:30 h · Videoconferencia`);

  const eventos = (await (await request.get(`${SIMULADOR}/__eventos`)).json()) as EventoSimulado[];
  const evento = eventos.find((e) => e.attendees?.[0]?.email === email);
  expect(evento).toBeTruthy();
  expect(evento!.summary).toBe('Revisión digital gratuita · Ana Pérez (Ferretería Ana)');
  expect(evento!.start).toEqual({ dateTime: `${fecha}T10:30:00.000Z`, timeZone: 'Europe/Madrid' });
  expect(evento!.conferenceData?.createRequest.conferenceSolutionKey.type).toBe('hangoutsMeet');
  expect(evento!.parametros).toMatchObject({ sendUpdates: 'all', conferenceDataVersion: '1' });

  // El hueco reservado deja de estar disponible
  await abrir(page);
  await dia(page, etiqueta).click();
  await expect(page.locator('#slots .slot')).not.toContainText(['12:30']);
  await limpiar(request, email);
});

test('presencial: el evento lleva el lugar y no crea Meet', async ({ page, request }, info) => {
  const email = `luis+${info.project.name}@ejemplo.es`;
  const [etiqueta] = DIAS[info.project.name as keyof typeof DIAS].reserva;
  await limpiar(request, email);
  await abrir(page);
  await dia(page, etiqueta).click();
  await page.getByRole('button', { name: '16:30' }).click();
  await page.getByRole('button', { name: 'Presencial en Betanzos' }).click();
  await rellenar(page, email);
  await page.getByRole('button', { name: 'Confirmar reunión' }).click();
  await expect(page).toHaveURL(/modalidad=Presencial/);
  const eventos = (await (await request.get(`${SIMULADOR}/__eventos`)).json()) as EventoSimulado[];
  const evento = eventos.find((e) => e.attendees?.[0]?.email === email)!;
  expect(evento.location).toContain('Betanzos');
  expect(evento.conferenceData).toBeUndefined();
  await limpiar(request, email);
});

test('si el hueco se ocupa mientras se rellena el formulario, avisa y lo quita', async ({
  page,
  request,
}, info) => {
  const [etiqueta, fecha] = DIAS[info.project.name as keyof typeof DIAS].ocupado;
  const marca = `ocupado-${info.project.name}`;
  await limpiar(request, marca);
  await abrir(page);
  await dia(page, etiqueta).click();
  await page.getByRole('button', { name: '09:30' }).click();
  await rellenar(page, `eva+${info.project.name}@ejemplo.es`);

  // Alguien ocupa ese hueco en el calendario justo antes de confirmar
  await request.post(`${SIMULADOR}/__ocupar`, {
    data: { start: `${fecha}T07:30:00Z`, end: `${fecha}T08:30:00Z`, etiqueta: marca },
  });
  // La caché de disponibilidad del servidor no afecta: la reserva siempre re-comprueba en Google
  await page.getByRole('button', { name: 'Confirmar reunión' }).click();

  await expect(page.locator('#form-error')).toHaveText(
    'Ese hueco ya no está disponible. Elige otro día u hora, por favor.',
  );
  await expect(page).toHaveURL(/#reserva$/);
  await limpiar(request, marca);
});

test('la API valida en el servidor y rechaza peticiones de otros sitios', async ({ request }) => {
  const base = `http://127.0.0.1:${PUERTO_CON_GOOGLE}`;
  const malo = await request.post(`${base}/api/reservas`, {
    data: {
      fecha: '2026-10-13',
      hora: '09:30',
      modalidad: 'Videoconferencia',
      nombre: '',
      email: 'x',
      privacidad: true,
    },
  });
  expect(malo.status()).toBe(400);
  expect(await malo.json()).toMatchObject({ campo: 'nombre' });

  const otroSitio = await request.post(`${base}/api/reservas`, {
    headers: { Origin: 'https://malicioso.example' },
    data: {},
  });
  expect(otroSitio.status()).toBe(403);

  const disponibilidad = await request.get(`${base}/api/disponibilidad`);
  expect(disponibilidad.ok()).toBe(true);
  expect(await disponibilidad.json()).toMatchObject({
    modo: 'google',
    rango: { desde: '2026-10-10', hasta: '2026-12-08' },
  });
});

test('sin credenciales de Google la web sigue funcionando en modo provisional', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-09T08:00:00Z'));
  await page.goto('http://localhost:4321/#reserva');
  await expect(page.locator('#booking-widget')).toHaveAttribute('data-modo', 'provisional');
  expect(await (await page.request.get('http://localhost:4321/api/disponibilidad')).json()).toEqual({
    modo: 'sin-credenciales',
  });
});
