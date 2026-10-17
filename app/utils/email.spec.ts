import { describe, expect, it } from 'vitest'
import { correoValido } from './email'

describe('correoValido', () => {
  it.each(['', '  ', 'ana@farmacia.com', 'ventas@distribuidora.com.mx'])('acepta «%s»', (v) => {
    expect(correoValido(v)).toBe(true)
  })
  it.each(['ana@farmacia', 'ana', 'ana@', '@farmacia.com', 'ana @farmacia.com', 'ana@farmacia.c'])('rechaza «%s»', (v) => {
    expect(correoValido(v)).toBe(false)
  })
})
