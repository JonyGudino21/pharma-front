import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { useDate } from './useDate'
import { isCalendarDate } from '~/utils/dates'

// La farmacia está en UTC−6 (centro de México): se fija para que la prueba
// no dependa de la zona de la máquina que la corre.
const zonaOriginal = process.env.TZ
beforeAll(() => {
  process.env.TZ = 'America/Mexico_City'
})
afterAll(() => {
  process.env.TZ = zonaOriginal
})

describe('useDate', () => {
  const { formatDate, formatDateTime, formatTime } = useDate()

  it('un MOMENTO se muestra en hora local (venta de las 6:26 p.m. NO es del día siguiente)', () => {
    expect(formatDateTime('2026-10-11T00:26:15.123Z')).toBe('10/10/2026 18:26')
    expect(formatDate('2026-10-11T00:26:15.123Z')).toBe('10/10/2026')
    expect(formatTime('2026-10-11T00:26:15.123Z')).toBe('18:26')
  })

  it('una FECHA DE CALENDARIO conserva su día (caducidad)', () => {
    expect(formatDate('2027-03-31T00:00:00.000Z')).toBe('31/03/2027')
    expect(formatDate('2027-03-31')).toBe('31/03/2027')
  })

  it('distingue calendario de momento', () => {
    expect(isCalendarDate('2027-03-31')).toBe(true)
    expect(isCalendarDate('2027-03-31T00:00:00.000Z')).toBe(true)
    expect(isCalendarDate('2027-03-31T00:00:00Z')).toBe(true)
    expect(isCalendarDate('2027-03-31T00:00:01.000Z')).toBe(false)
    expect(isCalendarDate(new Date())).toBe(false)
  })

  it('entradas vacías o inválidas no rompen la pantalla', () => {
    expect(formatDate('')).toBe('')
    expect(formatDateTime('no es fecha')).toBe('')
  })
})
