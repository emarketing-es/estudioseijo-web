/**
 * Eventos de analítica (GA4). Hasta la fase 6 no se carga GA4: los eventos solo se añaden a `dataLayer`
 * si existe (y GA4 solo existirá con el consentimiento del visitante).
 */
type NombreEvento = 'reserva_iniciada' | 'reserva_confirmada' | 'click_whatsapp' | 'click_telefono';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function registrarEvento(nombre: NombreEvento, parametros: Record<string, string> = {}): void {
  if (typeof window === 'undefined' || !Array.isArray(window.dataLayer)) return;
  window.dataLayer.push({ event: nombre, ...parametros });
}
