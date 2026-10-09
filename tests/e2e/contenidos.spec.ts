import { expect, test } from '@playwright/test';

test('el inicio tiene las secciones en el orden de la maqueta', async ({ page }) => {
  await page.goto('/');
  const titulos = await page.locator('main h2').allTextContents();
  expect(titulos).toEqual([
    '¿Te pasa alguna de estas cosas?.',
    'Reserva tu revisión digital gratuita.',
    'Tecnología aplicada a necesidades reales.',
    'Software propio para el día a día de tu negocio.',
    'Cerca para entender tu negocio. Capacidad técnica para resolverlo.',
    'Lo que dicen nuestros clientes.',
    'Ideas para mejorar tu negocio.',
  ]);
  await expect(page.locator('.sw')).toHaveCount(10);
  await expect(page.locator('main')).not.toContainText('−10');
});

test('el inicio muestra los 3 artículos más recientes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main .post-title')).toHaveText([
    '¿Necesitas una web nueva o basta con mejorar la que ya tienes?',
    'Auditoría web: 7 errores que pueden estar costándote clientes',
    'Cuánto cuesta una página web profesional: qué estás pagando realmente',
  ]);
});

test('el blog lista los 6 artículos publicados y no los borradores', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.locator('.post')).toHaveCount(6);
  await expect(page.getByText('6 artículos')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('Agentes de IA en una pyme');
  await expect(page.getByRole('link', { name: 'Todas' })).toHaveAttribute('aria-current', 'page');
});

test('los filtros llevan a la página de cada categoría', async ({ page }) => {
  await page.goto('/blog');
  const filtros = page.getByRole('navigation', { name: 'Filtrar por categoría' });
  await filtros.getByRole('link', { name: 'SEO y captación' }).click();
  await expect(page).toHaveURL(/\/blog\/categoria\/seo-y-captacion\/?$/);
  await expect(page.locator('.post')).toHaveCount(2);
  await expect(filtros.getByRole('link', { name: 'SEO y captación' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('una categoría sin artículos publicados lo indica', async ({ page }) => {
  await page.goto('/blog/categoria/software-de-gestion');
  await expect(page.locator('.post')).toHaveCount(0);
  await expect(page.getByText('Todavía no hay artículos publicados en esta categoría.')).toBeVisible();
});

test('los borradores no tienen página publicada', async ({ page }) => {
  const respuesta = await page.goto('/blog/agentes-ia-en-una-pyme');
  expect(respuesta?.status()).toBe(404);
});

test('opiniones: sin reseñas reales, solo huecos «Pendiente» y enlaces de Google marcados como pendientes', async ({
  page,
}) => {
  await page.goto('/opiniones');
  await expect(page.locator('.review')).toHaveCount(6);
  await expect(page.locator('.review .pill')).toHaveCount(6);
  const botonesGoogle = page.locator('.btn[aria-disabled="true"]');
  await expect(botonesGoogle).toHaveCount(2);
  await expect(botonesGoogle.first()).toContainText('enlace pendiente');
});

test('las páginas legales muestran la plantilla marcada como pendiente', async ({ page }) => {
  await page.goto('/aviso-legal');
  await expect(page.getByText('Plantilla provisional.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Datos identificativos' })).toBeVisible();
  await page.goto('/cookies');
  await expect(page.getByText('esta web no usa cookies de analítica')).toBeVisible();
});

test('RGPD: el formulario de reserva informa antes de consentir y la casilla no viene marcada', async ({
  page,
}) => {
  await page.goto('/#reserva');
  const casilla = page.getByLabel(/Acepto la política de privacidad/);
  await expect(casilla).not.toBeChecked();
  await expect(casilla).toHaveAttribute('aria-describedby', 'info-privacidad');
  const info = page.locator('#info-privacidad');
  await expect(info).toContainText('Responsable: Estudio Seijo');
  await expect(info).toContainText('Finalidad');
  await expect(info.getByRole('link', { name: 'política de privacidad' })).toHaveAttribute(
    'href',
    '/privacidad',
  );
});

test('sin GA4 configurado no hay aviso de cookies ni peticiones a Google', async ({ page }) => {
  const google: string[] = [];
  page.on('request', (r) => /google-analytics|googletagmanager/.test(r.url()) && google.push(r.url()));
  await page.goto('/');
  await expect(page.locator('#aviso-cookies')).toHaveCount(0);
  expect(google).toEqual([]);
});
