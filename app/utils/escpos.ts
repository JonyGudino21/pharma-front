/**
 * Encoder ESC/POS mínimo. No se usa una librería npm a propósito:
 * en Nuxt 4 el bundling de encoders CJS suele romper el POS, y un ticket
 * de farmacia solo necesita init, alineación, énfasis, tamaño y corte.
 */
export class EscPosEncoder {
  private chunks: number[] = []

  init() {
    this.chunks.push(0x1b, 0x40)
    return this
  }

  align(mode: 'left' | 'center' | 'right') {
    const n = mode === 'center' ? 1 : mode === 'right' ? 2 : 0
    this.chunks.push(0x1b, 0x61, n)
    return this
  }

  bold(on: boolean) {
    this.chunks.push(0x1b, 0x45, on ? 1 : 0)
    return this
  }

  size(scale: 1 | 2) {
    const n = scale === 2 ? 0x11 : 0x00
    this.chunks.push(0x1d, 0x21, n)
    return this
  }

  text(value: string) {
    const ascii = toPrinterAscii(value)
    for (let i = 0; i < ascii.length; i++) {
      this.chunks.push(ascii.charCodeAt(i) & 0x7f)
    }
    return this
  }

  line(value = '') {
    this.text(value)
    this.chunks.push(0x0a)
    return this
  }

  separator(width = 32) {
    return this.line('-'.repeat(width))
  }

  cut() {
    this.chunks.push(0x0a, 0x0a, 0x1d, 0x56, 0x00)
    return this
  }

  encode() {
    return Uint8Array.from(this.chunks)
  }
}

export function toPrinterAscii(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/gi, (m) => (m === 'Ñ' ? 'N' : 'n'))
    .replace(/[^\x20-\x7E]/g, '?')
}

export function padLine(left: string, right: string, width = 32): string {
  const l = toPrinterAscii(left)
  const r = toPrinterAscii(right)
  if (l.length + r.length >= width) {
    return `${l.slice(0, Math.max(8, width - r.length - 1))} ${r}`.slice(0, width)
  }
  return `${l}${' '.repeat(width - l.length - r.length)}${r}`
}
