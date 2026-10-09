/**
 * Eventos de analítica (GA4). GA4 solo existe si se ha configurado PUBLIC_GA4_ID y el visitante ha aceptado la
 * analítica (ver components/layout/Analitica.astro); si no, los eventos no se envían a ningún sitio.
 */
export type NombreEvento = 'reserva_iniciada' | 'reserva_confirmada' | 'click_whatsapp' | 'click_telefono';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function registrarEvento(nombre: NombreEvento, parametros: Record<string, string> = {}): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', nombre, parametros);
}

/** Evento de un enlace pulsado: teléfono o WhatsApp (por su `href` o por `data-evento`). */
export function eventoDeEnlace(enlace: Pick<HTMLAnchorElement, 'href' | 'dataset'>): NombreEvento | null {
  const declarado = enlace.dataset.evento;
  if (declarado === 'click_telefono' || declarado === 'click_whatsapp') return declarado;
  if (enlace.href.startsWith('tel:')) return 'click_telefono';
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(enlace.href)) return 'click_whatsapp';
  return null;
}
