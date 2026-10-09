// @ts-check
import { defineConfig } from 'astro/config';

// Configuración de Astro.
// Fase 1: sitio 100 % estático. El adaptador del hosting (funciones de servidor para reservas y
// formularios) se añadirá en la fase 4, cuando se confirme el proveedor.
export default defineConfig({
  site: 'https://estudioseijo.com',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
