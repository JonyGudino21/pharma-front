/**
 * Aritmética de dinero en el FRONT, en centavos enteros.
 *
 * El backend usa `Decimal` y es la fuente de verdad. Pero el modal de cobro
 * necesita decidir en el acto si el crédito alcanza o cuánto cambio dar, y
 * restar dos montos con `Number` produce basura binaria:
 *
 *     1000.10 - 1000.00 === 0.09999999999990905
 *
 * Con eso, un crédito disponible de $0.10 frente a un total de $0.10 podía
 * dar "insuficiente" y bloquear un cobro legítimo, o mostrar "$0.09" de cambio.
 *
 * Trabajar en centavos enteros elimina el problema sin añadir una dependencia:
 * los enteros hasta 2^53 son exactos en JavaScript, y eso son 90 billones de
 * pesos.
 */

/** Monto (número o cadena de la API) → centavos enteros. */
export function aCentavos(valor: string | number | null | undefined): number {
  const n = Number(valor ?? 0)
  if (!Number.isFinite(n)) return 0
  // Math.round y no Math.floor: 19.99 * 100 = 1998.9999999999998
  return Math.round(n * 100)
}

/** Centavos → pesos, para mostrar o para enviar al backend. */
export function aPesos(centavos: number): number {
  return centavos / 100
}

/** a - b, exacto. */
export function restar(a: string | number, b: string | number): number {
  return aPesos(aCentavos(a) - aCentavos(b))
}

/** ¿a >= b?, exacto. */
export function alcanza(disponible: string | number, requerido: string | number): boolean {
  return aCentavos(disponible) >= aCentavos(requerido)
}
