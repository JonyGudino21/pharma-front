import { describe, expect, it } from 'vitest'
import { coincidenciaExacta, pareceCodigo, prefillAlta } from './product-search'

describe('pareceCodigo', () => {
  it.each([
    ['7501234567890', true],
    ['  75012345  ', true],
    ['PARA-500-T20', true],
    ['A1B2C3', true],
    ['12345', false],
    ['paracetamol', false],
    ['vitamina b12', false],
    ['B12', false],
    ['', false],
  ])('"%s" → %s', (texto, esperado) => {
    expect(pareceCodigo(texto)).toBe(esperado)
  })
})

describe('prefillAlta', () => {
  it('un código numérico va al código de barras', () => {
    expect(prefillAlta(' 7501234567890 ')).toEqual({ barcode: '7501234567890' })
  })

  it('un nombre o un SKU van al nombre (el SKU lo genera el sistema)', () => {
    expect(prefillAlta('Ibuprofeno 400')).toEqual({ name: 'Ibuprofeno 400' })
    expect(prefillAlta('PARA-500')).toEqual({ name: 'PARA-500' })
  })

  it('vacío no propone nada', () => {
    expect(prefillAlta('  ')).toEqual({})
  })
})

describe('coincidenciaExacta', () => {
  const productos = [
    { id: 1, sku: 'PARA-500', barcode: '7501000000001' },
    { id: 2, sku: 'IBU-400', barcode: null },
  ]

  it('encuentra por código de barras o SKU sin importar mayúsculas', () => {
    expect(coincidenciaExacta('7501000000001', productos)?.id).toBe(1)
    expect(coincidenciaExacta('ibu-400', productos)?.id).toBe(2)
  })

  it('una coincidencia parcial no cuenta', () => {
    expect(coincidenciaExacta('7501', productos)).toBeUndefined()
  })
})
