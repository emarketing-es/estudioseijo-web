import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('página de artículo: migas, metadatos, CTA y relacionados', async ({ page }) => {
  await page.goto('/blog/auditoria-web-7-errores');
  await expect(page.locator('h1')).toHaveText(
    'Auditoría web: 7 errores que pueden estar costándote clientes.',
  );
  const migas = page.getByRole('navigation', { name: 'Migas de pan' });
  await expect(migas.getByRole('link', { name: 'SEO y captación' })).toHaveAttribute(
    'href',
    '/blog/categoria/seo-y-captacion',
  );
  await expect(page.locator('.article-meta')).toContainText('Estudio Seijo');
  await expect(page.locator('.article-meta time')).toHaveAttribute('datetime', '2026-08-05');
  await expect(page.getByRole('link', { name: /Reservar mi revisión gratuita/ })).toHaveAttribute(
    'href',
    '/#reserva',
  );
  // Relacionados: primero el otro artículo de SEO, sin repetir el propio
  const relacionados = page.locator('.post-title');
  await expect(relacionados).toHaveCount(3);
  await expect(relacionados.first()).toHaveText(/SEO básico para pymes/);
  await expect(relacionados.filter({ hasText: 'Auditoría web' })).toHaveCount(0);
});

test('el archivo _redirects incluye todas las URL antiguas', async ({ request }) => {
  const respuesta = await request.get('/_redirects');
  expect(respuesta.ok()).toBe(true);
  const texto = await respuesta.text();
  for (const linea of [
    '/noticia/%BFnecesitas-una-web-nueva-o-basta-con-mejorar-la-que-ya-tienesY  /blog/web-nueva-o-mejorar-la-actual  301',
    '/noticia/auditoria-web%3A-7-errores-que-pueden-estar-costandote-clientes  /blog/auditoria-web-7-errores  301',
    '/noticia/cuanto-cuesta-una-pagina-web-profesional%3A-que-estas-pagando-realmente  /blog/cuanto-cuesta-una-pagina-web-profesional  301',
    '/noticia/%BFtu-pagina-web-cumple-la-normativaY-que-revisar-en-privacidad-cookies-ecommerce-y-accesibilidad  /blog/web-cumple-normativa  301',
    '/noticia/como-saber-si-tu-web-genera-negocio%3A-analitica-web-para-empresas-que-venden-por-contacto  /blog/analitica-web-empresas-que-venden-por-contacto  301',
    '/noticia/seo-basico-para-pymes%3A-por-que-tu-empresa-no-aparece-en-google-y-por-donde-empezar  /blog/seo-basico-para-pymes  301',
    '/noticia/*  /blog  301',
  ]) {
    expect(texto).toContain(linea);
  }
});

test('cada destino de las redirecciones existe', async ({ request }) => {
  const texto = await (await request.get('/_redirects')).text();
  const destinos = new Set(
    texto
      .split('\n')
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => l.split(/\s+/)[1]),
  );
  for (const destino of destinos) {
    expect((await request.get(destino)).status(), destino).toBe(200);
  }
});

test('el gestor de contenidos /admin carga sin errores y no se indexa', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto('/admin/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  // Sin servidor local de Decap, muestra la pantalla de acceso con GitHub
  await expect(page.getByRole('button', { name: /GitHub/i })).toBeVisible({ timeout: 15_000 });
  expect(errores).toEqual([]);
});

test('la vista previa del CMS usa los estilos de lectura del sitio', async ({ request }) => {
  const css = await (await request.get('/admin/vista-previa.css')).text();
  expect(css).toContain('--cta: #e07a3a');
  expect(css).toContain('body h2');
});

test('página de artículo sin fallos de accesibilidad', async ({ page }) => {
  await page.goto('/blog/web-cumple-normativa');
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.map((v) => v.id)).toEqual([]);
});
