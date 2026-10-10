/**
 * Reembolso NETO de devolver `quantity` unidades de una línea de venta.
 *
 * Espejo de `refundForUnits` del backend (src/sales/pricing.ts, ADR-0016): el
 * reembolso sale del importe NETO de la línea (con su descuento), no del precio
 * de lista, y se reparte de forma acumulativa:
 *
 *   asignado(n) = redondeo(neto × n / cantidadDeLaLínea)
 *   reembolso   = asignado(yaDevueltas + quantity) − asignado(yaDevueltas)
 *
 * Así varias devoluciones parciales suman EXACTAMENTE lo pagado por la línea,
 * sin perder ni regalar centavos. La pantalla sólo ESTIMA (el backend decide
 * dentro de su transacción), pero la estimación ahora coincide con él: antes
 * usaba el precio bruto y, con descuentos, anunciaba devolver de más.
 *
 * Opera en centavos enteros; redondeo HALF_UP como `toMoney` del servidor.
 */
export function refundForUnits(
  lineNet: number,
  lineQuantity: number,
  alreadyReturned: number,
  quantity: number,
): number {
  if (!(lineQuantity > 0) || !(quantity > 0)) return 0
  const ya = Math.max(0, Math.min(alreadyReturned, lineQuantity))
  const hasta = Math.min(ya + quantity, lineQuantity)
  const netoCentavos = Math.round(Number(lineNet) * 100)
  // + épsilon: 0.5 exacto que el punto flotante deja en 0.4999… sube, como HALF_UP.
  const asignado = (n: number) => Math.round((netoCentavos * n) / lineQuantity + 1e-9)
  return (asignado(hasta) - asignado(ya)) / 100
}
