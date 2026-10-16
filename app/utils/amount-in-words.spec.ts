import { describe, expect, it } from 'vitest'
import { importeConLetra } from './amount-in-words'

describe('importeConLetra', () => {
  it.each([
    [0, 'CERO PESOS 00/100 M.N.'],
    [1, 'UN PESO 00/100 M.N.'],
    [2, 'DOS PESOS 00/100 M.N.'],
    [15, 'QUINCE PESOS 00/100 M.N.'],
    [21, 'VEINTIÚN PESOS 00/100 M.N.'],
    [29, 'VEINTINUEVE PESOS 00/100 M.N.'],
    [31, 'TREINTA Y UN PESOS 00/100 M.N.'],
    [99.99, 'NOVENTA Y NUEVE PESOS 99/100 M.N.'],
    [100, 'CIEN PESOS 00/100 M.N.'],
    [101, 'CIENTO UN PESOS 00/100 M.N.'],
    [115.5, 'CIENTO QUINCE PESOS 50/100 M.N.'],
    [500, 'QUINIENTOS PESOS 00/100 M.N.'],
    [1000, 'MIL PESOS 00/100 M.N.'],
    [1001, 'MIL UN PESOS 00/100 M.N.'],
    [1234.5, 'MIL DOSCIENTOS TREINTA Y CUATRO PESOS 50/100 M.N.'],
    [2000, 'DOS MIL PESOS 00/100 M.N.'],
    [21000, 'VEINTIÚN MIL PESOS 00/100 M.N.'],
    [31000, 'TREINTA Y UN MIL PESOS 00/100 M.N.'],
    [100000, 'CIEN MIL PESOS 00/100 M.N.'],
    [999999.99, 'NOVECIENTOS NOVENTA Y NUEVE MIL NOVECIENTOS NOVENTA Y NUEVE PESOS 99/100 M.N.'],
    [1_000_000, 'UN MILLÓN DE PESOS 00/100 M.N.'],
    [1_000_001, 'UN MILLÓN UN PESOS 00/100 M.N.'],
    [2_500_000, 'DOS MILLONES QUINIENTOS MIL PESOS 00/100 M.N.'],
    [3_000_000, 'TRES MILLONES DE PESOS 00/100 M.N.'],
    [21_000_000, 'VEINTIÚN MILLONES DE PESOS 00/100 M.N.'],
  ])('%s → %s', (importe, esperado) => {
    expect(importeConLetra(importe)).toBe(esperado)
  })

  it('conserva dos dígitos en los centavos', () => {
    expect(importeConLetra(10.05)).toBe('DIEZ PESOS 05/100 M.N.')
    expect(importeConLetra(10.5)).toBe('DIEZ PESOS 50/100 M.N.')
  })

  it('no arrastra errores de punto flotante (0.1 + 0.2)', () => {
    expect(importeConLetra(0.1 + 0.2)).toBe('CERO PESOS 30/100 M.N.')
    expect(importeConLetra(1.005 * 100)).not.toBe('')
  })

  it('los centavos que redondean a un peso suben el entero', () => {
    expect(importeConLetra(19.999)).toBe('VEINTE PESOS 00/100 M.N.')
  })

  it('un importe inválido o fuera de rango no imprime nada engañoso', () => {
    expect(importeConLetra(-5)).toBe('')
    expect(importeConLetra(Number.NaN)).toBe('')
    expect(importeConLetra(Number.POSITIVE_INFINITY)).toBe('')
    expect(importeConLetra(1e13)).toBe('')
  })
})
