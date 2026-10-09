/** GET /api/disponibilidad?desde=AAAA-MM-DD&hasta=AAAA-MM-DD → huecos libres reales del calendario. */
import type { APIRoute } from 'astro';
import { servicioReservas } from '@/lib/servidor/configuracion';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const { estado, cuerpo } = await servicioReservas().disponibilidad(url.searchParams);
  return Response.json(cuerpo, {
    status: estado,
    headers: { 'Cache-Control': 'no-store' },
  });
};
