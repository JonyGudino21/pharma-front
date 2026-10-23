import { describe, expect, it } from 'vitest'
import type { ReceiptBlock } from '~/types/receipt'
import { LOGO_THERMAL_HINT, headerHints, insertBlockInCanonicalOrder } from './receipt-blocks'

describe('insertBlockInCanonicalOrder', () => {
  it('el encabezado vuelve arriba, no después del pie', () => {
    const sinEncabezado: ReceiptBlock[] = ['meta', 'items', 'totals', 'payments', 'footer']
    expect(insertBlockInCanonicalOrder(sinEncabezado, 'header')).toEqual([
      'header', 'meta', 'items', 'totals', 'payments', 'footer',
    ])
  })

  it('el pie vuelve al final', () => {
    expect(insertBlockInCanonicalOrder(['header', 'items', 'totals'], 'footer')).toEqual([
      'header', 'items', 'totals', 'footer',
    ])
  })

  it('un bloque intermedio rellena su hueco', () => {
    expect(insertBlockInCanonicalOrder(['header', 'items', 'totals', 'footer'], 'payments')).toEqual([
      'header', 'items', 'totals', 'payments', 'footer',
    ])
  })

  it('respeta el orden que el usuario dio a los demás bloques', () => {
    // El usuario subió Totales antes de Productos; Datos de venta vuelve antes
    // del primer bloque que canónicamente le sigue (Totales, aquí).
    expect(insertBlockInCanonicalOrder(['header', 'totals', 'items'], 'meta')).toEqual([
      'header', 'meta', 'totals', 'items',
    ])
  })

  it('no duplica un bloque ya encendido ni muta la lista original', () => {
    const original: ReceiptBlock[] = ['header', 'items', 'totals']
    const r = insertBlockInCanonicalOrder(original, 'items')
    expect(r).toEqual(original)
    expect(r).not.toBe(original)
  })
})

describe('headerHints', () => {
  const todo = { showLogo: false, showTaxId: true, showAddress: true, showPhone: true }

  it('sin avisos cuando la ficha tiene todo y el logo está apagado', () => {
    expect(headerHints(todo, { rfc: 'XAXX010101000', address: 'Calle 1', phone: '555', email: null })).toEqual([])
  })

  it('avisa que el logo no sale en térmica', () => {
    expect(headerHints({ ...todo, showLogo: true }, { rfc: 'X', address: 'A', phone: '1' })).toEqual([LOGO_THERMAL_HINT])
  })

  it('avisa de cada dato vacío que se pidió mostrar', () => {
    const r = headerHints(todo, { rfc: '', address: '  ', phone: null, email: null })
    expect(r).toHaveLength(3)
    expect(r[0]).toMatch(/RFC/)
    expect(r[1]).toMatch(/domicilio/)
    expect(r[2]).toMatch(/teléfono/)
  })

  it('no avisa de lo que el usuario apagó', () => {
    expect(headerHints({ showLogo: false, showTaxId: false, showAddress: false, showPhone: false }, {})).toEqual([])
  })

  it('el correo basta para "Teléfono y correo"', () => {
    expect(headerHints({ ...todo, showTaxId: false, showAddress: false }, { email: 'a@b.mx' })).toEqual([])
  })
})
