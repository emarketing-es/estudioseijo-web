/**
 * Hoja de estilos para la vista previa de Decap CMS (/admin/vista-previa.css). Se genera en el build a
 * partir de los estilos del sitio, así la vista previa nunca se desfasa del diseño real.
 */
import type { APIRoute } from 'astro';
import secciones from '@/styles/secciones.css?raw';
import tokens from '@/styles/tokens.css?raw';

// En la vista previa, Decap pinta el texto directamente en <body>: las reglas de .prose se aplican a body
const prosa = secciones.slice(secciones.indexOf('/* Texto largo')).replaceAll('.prose', 'body');

export const GET: APIRoute = () =>
  new Response(
    `${tokens}
body { margin: 24px auto; padding: 0 24px; font-family: var(--sans); background: var(--white); }
h1, h2, h3 { margin: 0; font-weight: 500; }
article { max-width: 68ch; }
article > h1 { font-size: 40px; line-height: 1.1; letter-spacing: -0.03em; color: var(--black); margin: 8px 0 12px; }
.etiqueta { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--g600); margin: 0; }
.entradilla { font-size: 18px; color: var(--g800); margin: 0 0 32px; }
${prosa}`,
    { headers: { 'Content-Type': 'text/css; charset=utf-8' } },
  );
