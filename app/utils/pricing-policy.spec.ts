import { describe, expect, it } from 'vitest'
import { DEFAULT_PRICING_SETTINGS } from '~/types/settings'
import { puedeCambiarPrecio } from './pricing-policy'

describe('puedeCambiarPrecio (mismo criterio que el servidor)', () => {
  it.each([
    ['ADMIN', true],
    ['MANAGER', true],
    ['PHARMACIST', true],
    ['CASHIER', false],
  ])('%s con la configuración de fábrica → %s', (rol, esperado) => {
    expect(puedeCambiarPrecio(rol, DEFAULT_PRICING_SETTINGS)).toBe(esperado)
  })

  it('apagado: nadie', () => {
    expect(puedeCambiarPrecio('ADMIN', { ...DEFAULT_PRICING_SETTINGS, enabled: false })).toBe(false)
  })

  it('cajero habilitado', () => {
    expect(puedeCambiarPrecio('CASHIER', { ...DEFAULT_PRICING_SETTINGS, cashierCanEdit: true })).toBe(true)
  })

  it('sin configuración cargada o sin rol: no se muestra', () => {
    expect(puedeCambiarPrecio('ADMIN', null)).toBe(false)
    expect(puedeCambiarPrecio(undefined, DEFAULT_PRICING_SETTINGS)).toBe(false)
  })
})
