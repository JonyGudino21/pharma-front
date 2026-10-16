/**
 * Código HTTP de un error de `$fetch`/ofetch, o `undefined` si la petición no
 * obtuvo respuesta (servidor caído, red cortada, timeout).
 *
 * Distinguir "el servidor dijo que no" de "no hubo respuesta" decide qué hacer
 * con el estado local: ante un 409 el servidor ya sabe la verdad; ante un fallo
 * de red NO sabemos si la operación llegó.
 */
export function httpStatusOf(error: unknown): number | undefined {
  const e = error as { response?: { status?: number }; statusCode?: number; status?: number } | null
  return e?.response?.status ?? e?.statusCode ?? e?.status
}
