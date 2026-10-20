import { aCentavos } from '~/utils/money'

/**
 * ¿Deja ganancia un precio? (ADR-0025). Espejo de
 * pharma-back/src/sales/price-margin.ts: compara el precio NETO por pieza
 * (precio con IVA menos el descuento de la línea) contra el costo por pieza.
 * En centavos enteros: 9.00 vs 9.00 es "igual", nunca "9.0000001 de ganancia".
 *
 * Aquí sólo se AVISA; quien decide si se permite es el servidor.
 */
export type EstadoMargen = 'BAJO_COSTO' | 'SIN_GANANCIA' | 'OK'

export interface Margen {
  estado: EstadoMargen
  /** Ganancia (o pérdida, si es negativa) por pieza, en pesos. */
  porPieza: number
  /** Porcentaje de ganancia sobre el precio neto (0 si el neto es 0). */
  porcentaje: number
}

export function evaluarMargen(
  precioUnitario: number | string,
  costoUnitario: number | string,
  descuentoPorcentaje: number | string = 0,
): Margen {
  const precio = aCentavos(precioUnitario)
  const neto = Math.round(precio * (1 - Number(descuentoPorcentaje || 0) / 100))
  const costo = aCentavos(costoUnitario)
  const diferencia = neto - costo
  return {
    estado: diferencia < 0 ? 'BAJO_COSTO' : diferencia === 0 ? 'SIN_GANANCIA' : 'OK',
    porPieza: diferencia / 100,
    porcentaje: neto > 0 ? Math.round((diferencia / neto) * 1000) / 10 : 0,
  }
}

/** Texto corto para el aviso (tooltip / lector de pantalla). */
export function avisoMargen(m: Margen, conMontos: boolean, costo?: number | string): string | null {
  if (m.estado === 'OK') return null
  if (m.estado === 'SIN_GANANCIA') {
    return conMontos && costo !== undefined
      ? `Sin ganancia: el precio es igual al costo (${Number(costo).toFixed(2)}).`
      : 'Sin ganancia: el precio es igual al costo.'
  }
  return conMontos
    ? `Debajo del costo: se pierden ${Math.abs(m.porPieza).toFixed(2)} por pieza.`
    : 'Debajo del costo: esta venta pierde dinero.'
}
