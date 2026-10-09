// Exporta el sitio construido (dist/client) como prototipo navegable sin servidor, para revisarlo en una
// página privada: rutas relativas (sin depender de la raíz del dominio), tipografías incrustadas en el CSS y
// reservas simuladas en el navegador (scripts/prototipo/simulador.js).
// Uso: pnpm build && node scripts/exportar-prototipo.mjs <carpeta-destino>
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname;
// Con el adaptador de Node los estáticos quedan en dist/client; con el de Netlify, en dist
const origen = existsSync(join(raiz, 'dist/client')) ? join(raiz, 'dist/client') : join(raiz, 'dist');
const destino = process.argv[2];
if (!destino) throw new Error('Indica la carpeta de destino: node scripts/exportar-prototipo.mjs <carpeta>');

const EXCLUIR = /^(admin\/|_redirects$|sitemap|robots\.txt$|404\.html$|img\/blog\/\.gitkeep$)/;
const festivos = JSON.parse(readFileSync(join(raiz, 'config/festivos.json'), 'utf8')).fechas;
const franjas = readFileSync(join(raiz, 'src/config/reservas.ts'), 'utf8')
  .match(/franjas:\s*(\[[^\]]*\])/)[1]
  .replace(/'/g, '"');

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [relative(origen, ruta)];
  });
}

/** Convierte una URL de la raíz del sitio («/blog», «/_astro/x.css») en relativa desde `prefijo`. */
function relativa(url, prefijo) {
  const [, ruta, resto = ''] = url.match(/^([^?#]*)(.*)$/);
  if (/^\/(api|admin)(\/|$)/.test(ruta)) return url;
  if (extname(ruta)) return prefijo + ruta.slice(1) + resto;
  const limpia = ruta.replace(/^\/|\/$/g, '');
  return prefijo + (limpia ? `${limpia}/index.html` : 'index.html') + resto;
}

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
const tipos = { '.woff2': 'font/woff2', '.woff': 'font/woff' };

for (const archivo of archivos(origen).filter((a) => !EXCLUIR.test(a))) {
  const entrada = join(origen, archivo);
  const salida = join(destino, archivo);
  mkdirSync(dirname(salida), { recursive: true });
  const ext = extname(archivo);
  if (ext === '.html') {
    const prefijo = '../'.repeat(archivo.split('/').length - 1);
    let html = readFileSync(entrada, 'utf8').replace(
      /(href|src)="(\/(?!\/)[^"]*)"/g,
      (_, attr, url) => `${attr}="${relativa(url, prefijo)}"`,
    );
    // Simulador de reservas antes de los scripts del sitio (los módulos se ejecutan después)
    html = html.replace('</head>', `<script src="${prefijo}prototipo-simulador.js"></script></head>`);
    writeFileSync(salida, html);
  } else if (ext === '.css') {
    // Tipografías incrustadas: la página de prototipo no permite cargar fuentes desde archivos sueltos
    const css = readFileSync(entrada, 'utf8').replace(/url\((\/_astro\/[^)]+)\)/g, (_, url) => {
      const datos = readFileSync(join(origen, url)).toString('base64');
      return `url(data:${tipos[extname(url)] ?? 'application/octet-stream'};base64,${datos})`;
    });
    writeFileSync(salida, css);
  } else if (ext === '.js') {
    writeFileSync(
      salida,
      readFileSync(entrada, 'utf8').replace('`/reserva/confirmada?${', '`reserva/confirmada/index.html?${'),
    );
  } else if (!tipos[ext]) {
    cpSync(entrada, salida);
  }
}
const simulador = readFileSync(join(raiz, 'scripts/prototipo/simulador.js'), 'utf8')
  .replace('= __FESTIVOS__;', `= ${JSON.stringify(festivos)};`)
  .replace('= __FRANJAS__;', `= ${franjas};`);
writeFileSync(join(destino, 'prototipo-simulador.js'), simulador);
console.log(`Prototipo exportado en ${destino} (${archivos(destino).length} archivos)`);
