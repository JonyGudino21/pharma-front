import { describe, expect, it } from 'vitest'
import { normalizeRfc, rfcError } from './rfc'

describe('normalizeRfc', () => {
  it('quita espacios y guiones y pasa a mayúsculas', () => {
    expect(normalizeRfc(' xaxx-010101 000 ')).toBe('XAXX010101000')
  })

  it('tolera null/undefined (ficha sin RFC)', () => {
    expect(normalizeRfc(null)).toBe('')
    expect(normalizeRfc(undefined)).toBe('')
  })

  it('un RFC heredado con guiones queda válido tras normalizar', () => {
    const heredado = 'abc-010101-ab1'
    expect(rfcError(heredado)).not.toBeNull()
    expect(rfcError(normalizeRfc(heredado))).toBeNull()
  })
})
