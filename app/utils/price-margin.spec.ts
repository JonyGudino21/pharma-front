import { describe, expect, it } from 'vitest'
import { avisoMargen, evaluarMargen } from './price-margin'

describe('evaluarMargen (mismo criterio que el servidor)', () => {
  it.each([
    [10, 9, 0, 'OK'],
    [9, 9, 0, 'SIN_GANANCIA'],
    [8.99, 9, 0, 'BAJO_COSTO'],
    [10, 9, 10, 'SIN_GANANCIA'],
    [10, 9, 20, 'BAJO_COSTO'],
    ['12.00', '9.00', '0', 'OK'],
  ])('precio %s, costo %s, descuento %s%% → %s', (p, c, d, esperado) => {
    expect(evaluarMargen(p, c, d).estado).toBe(esperado)
  })

  it('calcula ganancia por pieza y porcentaje sobre el neto', () => {
    const m = evaluarMargen(12, 9)
    expect(m.porPieza).toBe(3)
    expect(m.porcentaje).toBe(25)
  })

  it('pérdida por pieza negativa', () => {
    expect(evaluarMargen(8, 9).porPieza).toBe(-1)
  })
})

describe('avisoMargen', () => {
  it('sin aviso cuando deja ganancia', () => {
    expect(avisoMargen(evaluarMargen(12, 9), true, 9)).toBeNull()
  })

  it('sin ganancia: con o sin montos', () => {
    expect(avisoMargen(evaluarMargen(9, 9), true, 9)).toContain('igual al costo (9.00)')
    expect(avisoMargen(evaluarMargen(9, 9), false)).toBe('Sin ganancia: el precio es igual al costo.')
  })

  it('bajo costo: sin montos para quien no ve costos', () => {
    expect(avisoMargen(evaluarMargen(8, 9), true)).toContain('1.00 por pieza')
    expect(avisoMargen(evaluarMargen(8, 9), false)).not.toMatch(/\d/)
  })
})
