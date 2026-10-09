/** Verificación de Cloudflare Turnstile en el servidor. */
export const URL_TURNSTILE = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verificarTurnstile(
  secreto: string,
  token: string,
  ip?: string,
  pedir: typeof fetch = fetch,
): Promise<boolean> {
  if (!token) return false;
  const cuerpo = new URLSearchParams({ secret: secreto, response: token });
  if (ip) cuerpo.set('remoteip', ip);
  try {
    const r = await pedir(URL_TURNSTILE, { method: 'POST', body: cuerpo });
    const datos = (await r.json()) as { success?: boolean };
    return datos.success === true;
  } catch {
    return false;
  }
}
