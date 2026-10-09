import { expect, test } from '@playwright/test';

async function esquemas(page: import('@playwright/test').Page) {
  const bloques = await page.locator('script[type="application/ld+json"]').allTextContents();
  return bloques.map((b) => JSON.parse(b) as Record<string, unknown>);
}

test('portada: metadatos, imagen social y datos estructurados de la empresa', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://estudioseijo.com/img/og/estudioseijo.png',
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  const tipos = (await esquemas(page)).map((e) => e['@type']);
  expect(tipos).toEqual(['ProfessionalService', 'WebSite']);
  expect((await page.request.get('/img/og/estudioseijo.png')).ok()).toBe(true);
});

test('artículo: BlogPosting, migas y Open Graph de tipo artículo', async ({ page }) => {
  await page.goto('/blog/seo-basico-para-pymes');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
    'content',
    '2026-04-17',
  );
  const [articulo, migas] = await esquemas(page);
  expect(articulo).toMatchObject({
    '@type': 'BlogPosting',
    datePublished: '2026-04-17',
    articleSection: 'SEO y captación',
  });
  expect(migas['@type']).toBe('BreadcrumbList');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(articulo.url).toBe(canonical);
});

test('sitemap con las páginas indexables y robots.txt', async ({ request }) => {
  const indice = await (await request.get('/sitemap-index.xml')).text();
  expect(indice).toContain('https://estudioseijo.com/sitemap-0.xml');
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('<loc>https://estudioseijo.com/blog/seo-basico-para-pymes/</loc>');
  expect(sitemap).not.toContain('reserva/confirmada');
  expect(sitemap).not.toContain('agentes-ia-en-una-pyme'); // borrador
  expect(sitemap).not.toContain('/admin');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://estudioseijo.com/sitemap-index.xml');
  expect(robots).toContain('Disallow: /admin/');
});

test('las páginas que no deben indexarse llevan noindex', async ({ page }) => {
  await page.goto('/reserva/confirmada');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});
