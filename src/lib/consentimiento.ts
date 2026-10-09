/**
 * Preferencia de cookies del visitante, guardada en el almacenamiento local (`es-consentimiento`).
 * Funciones puras con el almacenamiento inyectable para poder probarlas.
 */
export const CLAVE_CONSENTIMIENTO = 'es-consentimiento';
/** Si cambia lo que se pide (p. ej. nuevas cookies), se sube la versión y se vuelve a preguntar. */
export const VERSION_CONSENTIMIENTO = 1;

export interface Consentimiento {
  analitica: boolean;
  fecha: string;
  version: number;
}

type Almacen = Pick<Storage, 'getItem' | 'setItem'>;

export function leerConsentimiento(almacen: Almacen): Consentimiento | null {
  try {
    const datos = JSON.parse(almacen.getItem(CLAVE_CONSENTIMIENTO) ?? 'null') as Consentimiento | null;
    if (!datos || typeof datos.analitica !== 'boolean' || datos.version !== VERSION_CONSENTIMIENTO)
      return null;
    return datos;
  } catch {
    return null;
  }
}

export function guardarConsentimiento(
  almacen: Almacen,
  analitica: boolean,
  ahora = new Date(),
): Consentimiento {
  const datos: Consentimiento = { analitica, fecha: ahora.toISOString(), version: VERSION_CONSENTIMIENTO };
  try {
    almacen.setItem(CLAVE_CONSENTIMIENTO, JSON.stringify(datos));
  } catch {
    // Almacenamiento bloqueado (modo privado estricto): la elección vale solo para esta visita
  }
  return datos;
}
