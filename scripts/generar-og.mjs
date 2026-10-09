// Genera las imágenes para redes sociales (Open Graph, 1200×630) con la tipografía y los colores de la marca:
// una general y una por categoría del blog. Uso: `node scripts/generar-og.mjs` (requiere Chromium de Playwright;
// opcional PLAYWRIGHT_CHROMIUM_EXECUTABLE). Las imágenes resultantes se versionan en public/img/og/.
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const raiz = new URL('..', import.meta.url);
const b64 = (ruta) => readFileSync(new URL(ruta, raiz)).toString('base64');
const sans = b64('node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-opsz-normal.woff2');
const mono = b64('node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2');
const logo = b64('public/img/logos/logo-estudioseijo.png');

// Colores de las composiciones de categoría (src/styles/secciones.css, .cat-*)
const categorias = [
  { slug: 'web-y-ecommerce', nombre: 'Web y ecommerce', c1: '#E07A3A', c2: '#FAFAF8', c3: '#0A0A0A' },
  { slug: 'seo-y-captacion', nombre: 'SEO y captación', c1: '#8AAEC8', c2: '#FAFAF8', c3: '#0A0A0A' },
  { slug: 'analitica-y-datos', nombre: 'Analítica y datos', c1: '#85AFA0', c2: '#FAFAF8', c3: '#0A0A0A' },
  {
    slug: 'normativa-y-cumplimiento',
    nombre: 'Normativa y cumplimiento',
    c1: '#C8B080',
    c2: '#FAFAF8',
    c3: '#0A0A0A',
  },
  { slug: 'automatizacion-e-ia', nombre: 'Automatización e IA', c1: '#0A0A0A', c2: '#E07A3A', c3: '#FAFAF8' },
  { slug: 'software-de-gestion', nombre: 'Software de gestión', c1: '#2A2A28', c2: '#8AAEC8', c3: '#E07A3A' },
];

const plantilla = ({
  etiqueta,
  titulo,
  c1 = '#E07A3A',
  c2 = '#FAFAF8',
  c3 = '#0A0A0A',
}) => `<!doctype html><html><head><style>
@font-face { font-family: 'DM Sans'; src: url(data:font/woff2;base64,${sans}) format('woff2'); font-weight: 100 1000; }
@font-face { font-family: 'DM Mono'; src: url(data:font/woff2;base64,${mono}) format('woff2'); font-weight: 500; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #FAFAF8; font-family: 'DM Sans'; color: #0A0A0A; position: relative; overflow: hidden; }
.arte { position: absolute; right: 0; top: 0; width: 400px; height: 630px; background: ${c1}; overflow: hidden; }
.arte::before { content: ''; position: absolute; width: 460px; height: 460px; border-radius: 50%; border: 22px solid ${c2}; right: -150px; top: -130px; }
.arte::after { content: ''; position: absolute; width: 64px; height: 64px; border-radius: 50%; background: ${c3}; left: 64px; bottom: 72px; }
.copia { position: absolute; left: 72px; top: 72px; width: 660px; height: 486px; display: flex; flex-direction: column; justify-content: space-between; }
img { height: 40px; width: auto; align-self: flex-start; }
.etiqueta { font-family: 'DM Mono'; font-size: 20px; letter-spacing: 0.1em; text-transform: uppercase; color: #5A5A55; }
.etiqueta b { color: #E07A3A; font-weight: 500; }
h1 { font-size: 64px; line-height: 1.05; letter-spacing: -0.03em; font-weight: 500; margin-top: 18px; }
h1 span { color: #E07A3A; }
.pie { font-size: 24px; color: #2A2A28; }
</style></head><body>
<div class="arte"></div>
<div class="copia">
  <img src="data:image/png;base64,${logo}" alt="">
  <div><div class="etiqueta"><b>●</b>&nbsp; ${etiqueta}</div><h1>${titulo}<span>.</span></h1></div>
  <div class="pie">Revisión digital gratuita · Betanzos · estudioseijo.com</div>
</div></body></html>`;

const navegador = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {},
);
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });

async function generar(nombre, datos) {
  await pagina.setContent(plantilla(datos));
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: new URL(`public/img/og/${nombre}.png`, raiz).pathname });
  console.log(`public/img/og/${nombre}.png`);
}

await generar('estudioseijo', {
  etiqueta: 'Tecnología · Marketing · Software',
  titulo: 'Tecnología para hacer más fácil tu negocio',
});
for (const c of categorias) await generar(`blog-${c.slug}`, { etiqueta: 'Blog', titulo: c.nombre, ...c });
await navegador.close();
