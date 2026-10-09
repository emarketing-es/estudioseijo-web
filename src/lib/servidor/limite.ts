/**
 * Límite de peticiones por IP en memoria (ventana deslizante). Suficiente para un solo servidor; si el
 * hosting ejecuta varias instancias, cada una lleva su propia cuenta.
 */
export function crearLimitador({
  maximo,
  ventanaMs,
  ahora = () => Date.now(),
}: {
  maximo: number;
  ventanaMs: number;
  ahora?: () => number;
}) {
  const registros = new Map<string, number[]>();
  return {
    /** Registra un intento y devuelve si está permitido. */
    permitir(clave: string): boolean {
      const t = ahora();
      const recientes = (registros.get(clave) ?? []).filter((x) => t - x < ventanaMs);
      if (recientes.length >= maximo) {
        registros.set(clave, recientes);
        return false;
      }
      recientes.push(t);
      registros.set(clave, recientes);
      // Limpieza ocasional para que el mapa no crezca sin fin
      if (registros.size > 5000)
        for (const [k, v] of registros) if (v.every((x) => t - x >= ventanaMs)) registros.delete(k);
      return true;
    },
  };
}
