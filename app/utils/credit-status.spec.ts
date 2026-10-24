import { describe, expect, it } from 'vitest'
import { estadoDe, fechaCorta, segmentos, textoEstado, tonoEstado, ymdEnDias } from './credit-status'

describe('textoEstado', () => {
  it.each([
    ['VENCIDA', 1, 'Vencida hace 1 día'],
    ['VENCIDA', 12, 'Vencida hace 12 días'],
    ['POR_VENCER', 0, 'Vence hoy'],
    ['POR_VENCER', 1, 'Vence mañana'],
    ['POR_VENCER', 5, 'Vence en 5 días'],
    ['AL_CORRIENTE', 20, 'Vence en 20 días'],
    ['SIN_FECHA', 0, 'Sin fecha de pago'],
  ] as const)('%s %i → %s', (estado, dias, texto) => {
    expect(textoEstado(estado, dias)).toBe(texto)
  })
})

describe('tonoEstado', () => {
  it('sube de tono con el atraso', () => {
    expect(tonoEstado('AL_CORRIENTE', 20)).toBe('ok')
    expect(tonoEstado('POR_VENCER', 2)).toBe('soon')
    expect(tonoEstado('VENCIDA', 10)).toBe('late1')
    expect(tonoEstado('VENCIDA', 45)).toBe('late2')
    expect(tonoEstado('VENCIDA', 75)).toBe('late3')
    expect(tonoEstado('VENCIDA', 120)).toBe('late4')
    expect(tonoEstado('SIN_FECHA', 0)).toBe('none')
  })
})

describe('segmentos del termómetro', () => {
  it('proporcional al monto, suma 100 y omite columnas vacías', () => {
    const s = segmentos([
      { bucket: 'A', amount: '750' },
      { bucket: 'B', amount: '250' },
      { bucket: 'C', amount: '0' },
    ])
    expect(s.map((x) => [x.bucket, Math.round(x.pct)])).toEqual([['A', 75], ['B', 25]])
  })

  it('una columna pequeña conserva un ancho mínimo visible', () => {
    const s = segmentos([{ amount: 10000 }, { amount: 1 }])
    expect(s[1]!.pct).toBeGreaterThan(1.9)
    expect(s.reduce((a, b) => a + b.pct, 0)).toBeCloseTo(100)
  })

  it('sin cartera no hay segmentos', () => {
    expect(segmentos([{ amount: 0 }])).toEqual([])
  })
})

describe('fechas', () => {
  it('fechaCorta no se corre un día por la zona horaria', () => {
    expect(fechaCorta('2026-11-01')).toMatch(/^1 nov/)
    expect(fechaCorta(null)).toBe('—')
  })

  it('ymdEnDias usa el día de la farmacia', () => {
    // 23-oct 03:00 UTC = 22-oct en Ciudad de México.
    expect(ymdEnDias(10, new Date('2026-10-23T03:00:00Z'))).toBe('2026-11-01')
  })
})

describe('estadoDe (hoy = 2026-10-23, por vencer = 7)', () => {
  it.each([
    ['2026-10-22', 'VENCIDA', 1],
    ['2026-10-23', 'POR_VENCER', 0],
    ['2026-10-30', 'POR_VENCER', 7],
    ['2026-10-31', 'AL_CORRIENTE', 8],
    [null, 'SIN_FECHA', 0],
  ] as const)('%s → %s %i', (due, status, days) => {
    expect(estadoDe(due, '2026-10-23', 7)).toEqual({ status, days })
  })
})
