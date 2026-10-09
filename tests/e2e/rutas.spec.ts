import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Todas las rutas del sitio (una de cada tipo para las dinámicas). */
const rutas = [
  '/',
  '/blog',
  '/blog/categoria/web-y-ecommerce',
  '/blog/categoria/automatizacion-e-ia',
  '/blog/web-nueva-o-mejorar-la-actual',
  '/opiniones',
  '/aviso-legal',
  '/privacidad',
  '/cookies',
  '/reserva/confirmada',
];

for (const ruta of rutas) {
  test.describe(`ruta ${ruta}`, () => {
    test('carga sin errores, con cabecera, h1 y pie', async ({ page }) => {
      const errores: string[] = [];
      page.on('pageerror', (e) => errores.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));

      const respuesta = await page.goto(ruta);
      expect(respuesta?.status()).toBe(200);
      await expect(page.locator('header.site-header')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('footer.site-footer')).toBeVisible();
      await expect(page).toHaveTitle(/Estudio Seijo/);
      expect(errores).toEqual([]);
    });

    test('sin scroll horizontal a 360 px', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto(ruta);
      const desborde = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(desborde).toBeLessThanOrEqual(0);
    });

    test('sin fallos de accesibilidad (axe, WCAG 2.2 AA)', async ({ page }) => {
      await page.goto(ruta);
      const resultado = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(resultado.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  });
}

test('una ruta inexistente muestra la página 404', async ({ page }) => {
  const respuesta = await page.goto('/esta-pagina-no-existe');
  expect(respuesta?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('Página no encontrada');
});

test('el enlace «Saltar al contenido» aparece al tabular y lleva al contenido', async ({ page }) => {
  await page.goto('/blog');
  await page.keyboard.press('Tab');
  const salto = page.getByRole('link', { name: 'Saltar al contenido' });
  await expect(salto).toBeFocused();
  await expect(salto).toBeInViewport();
});

test('la cabecera marca la página actual', async ({ page }) => {
  await page.goto('/blog/categoria/seo-y-captacion');
  await expect(page.locator('.nav a[aria-current="page"]')).toHaveText('blog');
});

test.describe('menú móvil', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('se abre, se cierra con Escape y devuelve el foco al botón', async ({ page }) => {
    await page.goto('/');
    const boton = page.getByRole('button', { name: 'Abrir menú' });
    const menu = page.getByRole('navigation', { name: 'Principal' });

    await expect(menu).toBeHidden();
    await boton.click();
    await expect(menu).toBeVisible();
    await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(page.locator('.menu-toggle')).toBeFocused();
    await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  });
});
