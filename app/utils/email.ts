/**
 * ¿El correo pasaría la validación del servidor (`@IsEmail`)?
 *
 * `<input type="email">` del navegador acepta `ana@farmacia` (sin dominio de
 * primer nivel) y el servidor lo rechaza con un 400 en inglés. Esta regla es la
 * misma que ya usaba el alta de usuarios; vacío = válido (el correo es opcional).
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function correoValido(valor: string): boolean {
  const v = valor.trim()
  return v === '' || EMAIL_RE.test(v)
}

export const MENSAJE_CORREO_INVALIDO = 'Escribe un correo completo, por ejemplo nombre@dominio.com.'
