/**
 * Ayudas de la búsqueda de productos en Compras (y donde se escanee).
 *
 * Un lector de código de barras "teclea" el código y manda Enter. Para
 * distinguirlo de un nombre escrito a mano se mira la forma del texto: sin
 * espacios y con dígitos suficientes (EAN/UPC, códigos internos como
 * PARA-500-T20).
 */

/** ¿El texto parece un código (de barras o SKU) y no un nombre? */
export function pareceCodigo(texto: string): boolean {
  const q = texto.trim()
  if (q.length < 4 || /\s/.test(q)) return false
  // Sólo dígitos: EAN-8/13, UPC-A, códigos internos numéricos.
  if (/^\d+$/.test(q)) return q.length >= 6
  // SKU con guiones o mezcla de letras y al menos 2 dígitos ("PARA-500", "A1B2C3").
  return /^[A-Za-z0-9][A-Za-z0-9-]*$/.test(q) && (q.match(/\d/g)?.length ?? 0) >= 2
}

/** Datos con que se abre el alta de un producto que no existe. */
export function prefillAlta(texto: string): { name?: string; barcode?: string } {
  const q = texto.trim()
  if (!q) return {}
  return pareceCodigo(q) && /^\d+$/.test(q) ? { barcode: q } : { name: q }
}

/** Resultado que coincide EXACTO con el código (SKU o barras), si lo hay. */
export function coincidenciaExacta<T extends { sku?: string | null; barcode?: string | null }>(
  texto: string,
  productos: T[],
): T | undefined {
  const q = texto.trim().toUpperCase()
  if (!q) return undefined
  return productos.find(p => p.barcode?.toUpperCase() === q || p.sku?.toUpperCase() === q)
}
