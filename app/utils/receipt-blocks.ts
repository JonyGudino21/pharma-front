import type { ReceiptBlock } from '~/types/receipt'
import { DEFAULT_RECEIPT_LAYOUT } from '~/types/receipt'

/**
 * Vuelve a encender un bloque del ticket SIN mandarlo al final.
 *
 * Antes se reactivaba con `push`: apagar y encender "Encabezado" lo dejaba
 * después del pie, y la térmica imprimía el nombre de la farmacia al final.
 * Ahora se coloca justo antes del primer bloque encendido que, en el orden
 * canónico (`DEFAULT_RECEIPT_LAYOUT`), va después de él. Así respeta el orden
 * que el usuario haya dado a los demás y sólo "rellena el hueco" del que vuelve.
 *
 * Función pura: devuelve una lista nueva y no toca la recibida.
 */
export function insertBlockInCanonicalOrder(
  enabled: readonly ReceiptBlock[],
  block: ReceiptBlock,
  canonical: readonly ReceiptBlock[] = DEFAULT_RECEIPT_LAYOUT.blocks,
): ReceiptBlock[] {
  if (enabled.includes(block)) return [...enabled]
  const rank = canonical.indexOf(block)
  // Un bloque que el orden canónico no conoce no tiene "su sitio": al final.
  const before = rank < 0 ? -1 : enabled.findIndex((b) => canonical.indexOf(b) > rank)
  const next = [...enabled]
  if (before < 0) next.push(block)
  else next.splice(before, 0, block)
  return next
}

/** Lo mínimo del encabezado que importa para avisar qué no saldrá impreso. */
export interface HeaderHintInput {
  showLogo: boolean
  showTaxId: boolean
  showAddress: boolean
  showPhone: boolean
}

export interface HeaderHintCompany {
  rfc?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

export const LOGO_THERMAL_HINT =
  'El logo no se imprime en la impresora térmica (sólo en el ticket por navegador y en la nota de remisión).'

/**
 * Avisos honestos sobre el encabezado.
 *
 * Las casillas "RFC y régimen", "Domicilio" o "Teléfono y correo" encendidas
 * prometían algo que no salía: si el dato está vacío en la ficha, la térmica
 * simplemente lo omite. Y el logo nunca sale en térmica (el codificador
 * ESC/POS no manda imágenes). Mejor decirlo junto a la casilla que dejar que
 * el usuario lo descubra con el ticket en la mano.
 */
export function headerHints(t: HeaderHintInput, c: HeaderHintCompany): string[] {
  const vacio = (v: string | null | undefined) => !v || !v.trim()
  const out: string[] = []
  if (t.showLogo) out.push(LOGO_THERMAL_HINT)
  if (t.showTaxId && vacio(c.rfc)) out.push('Agrega el RFC en Datos de la farmacia para que aparezca.')
  if (t.showAddress && vacio(c.address)) out.push('Agrega el domicilio en Datos de la farmacia para que aparezca.')
  if (t.showPhone && vacio(c.phone) && vacio(c.email)) {
    out.push('Agrega el teléfono o el correo en Datos de la farmacia para que aparezca.')
  }
  return out
}
