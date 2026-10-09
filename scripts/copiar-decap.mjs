// Copia Decap CMS desde node_modules a public/admin/cms/ para servirlo desde nuestro dominio
// (sin depender de un CDN externo). Se ejecuta antes de `dev` y `build`. La carpeta destino no se versiona.
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const origen = join(dirname(require.resolve('decap-cms/package.json')), 'dist');
const destino = new URL('../public/admin/cms/', import.meta.url).pathname;

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
const archivos = readdirSync(origen).filter(
  (f) =>
    (f.endsWith('decap-cms.js') || f.endsWith('.wasm') || f === 'decap-cms.js.LICENSE.txt') &&
    !f.endsWith('.map'),
);
for (const f of archivos) copyFileSync(join(origen, f), join(destino, f));
console.log(`Decap CMS: ${archivos.length} archivos copiados a public/admin/cms/`);
