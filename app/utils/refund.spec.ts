import { describe, expect, it } from 'vitest'
import { refundForUnits } from './refund'

describe('refundForUnits (espejo del backend)', () => {
  it('usa el importe NETO de la línea, no el precio de lista', () => {
    // 1 × $29.00 con 10 % de descuento → la línea vale $26.10.
    expect(refundForUnits(26.1, 1, 0, 1)).toBe(26.1)
  })

  it('devoluciones parciales suman exactamente lo pagado', () => {
    // 3 unidades por $100.00: 33.33 + 33.34 + 33.33 = 100.00.
    const a = refundForUnits(100, 3, 0, 1)
    const b = refundForUnits(100, 3, 1, 1)
    const c = refundForUnits(100, 3, 2, 1)
    expect(Math.round((a + b + c) * 100) / 100).toBe(100)
    expect([a, b, c]).toEqual([33.33, 33.34, 33.33])
  })

  it('devolver todo de una vez = importe neto de la línea', () => {
    expect(refundForUnits(157.1, 4, 0, 4)).toBe(157.1)
  })

  it('nunca devuelve más de lo que queda por devolver', () => {
    expect(refundForUnits(100, 2, 2, 1)).toBe(0)
    expect(refundForUnits(100, 2, 1, 5)).toBe(50)
  })

  it('entradas inválidas no producen importes', () => {
    expect(refundForUnits(100, 0, 0, 1)).toBe(0)
    expect(refundForUnits(100, 2, 0, 0)).toBe(0)
    expect(refundForUnits(100, 2, 0, -1)).toBe(0)
  })
})
