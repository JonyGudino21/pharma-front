/**
 * FECHAS DE CALENDARIO vs. MOMENTOS.
 *
 * El API entrega dos clases de fecha con el mismo formato ISO:
 *   - MOMENTOS (createdAt, openedAt, printedAt…): un instante. Se muestran en la
 *     hora LOCAL de la farmacia.
 *   - FECHAS DE CALENDARIO (caducidad de un lote, filtros "desde/hasta"): un día,
 *     sin hora. Llegan como "AAAA-MM-DD" o como medianoche UTC
 *     ("2027-03-31T00:00:00.000Z"). Convertidas a hora local caerían el día
 *     ANTERIOR en México (UTC−6), así que se leen en UTC.
 *
 * Antes TODO se leía como calendario: una venta de las 6:26 p.m. aparecía como
 * "00:26 del día siguiente" en historial, turnos y pagos.
 *
 * Límite conocido: un momento que caiga EXACTAMENTE en 00:00:00.000 UTC se
 * mostraría como fecha de calendario (sin hora local). Es una probabilidad de
 * uno entre 86.4 millones por registro; preferible a romper todas las caducidades.
 */
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/
const MEDIANOCHE_UTC = /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.0+)?Z$/

export function isCalendarDate(value: string | Date): boolean {
  return typeof value === 'string' && (SOLO_FECHA.test(value) || MEDIANOCHE_UTC.test(value))
}

/** Partes de la fecha listas para mostrar: en UTC si es de calendario, en local si es un momento. */
export function dateParts(value: string | Date) {
  const d = typeof value === 'string' ? new Date(SOLO_FECHA.test(value) ? `${value}T00:00:00Z` : value) : value
  const utc = isCalendarDate(value)
  return {
    valid: !Number.isNaN(d.getTime()),
    year: utc ? d.getUTCFullYear() : d.getFullYear(),
    month: (utc ? d.getUTCMonth() : d.getMonth()) + 1,
    day: utc ? d.getUTCDate() : d.getDate(),
    hours: utc ? 0 : d.getHours(),
    minutes: utc ? 0 : d.getMinutes(),
    time: d.getTime(),
  }
}
