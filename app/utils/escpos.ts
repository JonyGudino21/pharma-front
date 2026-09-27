import type { ReceiptCharset } from '~/types/receipt'

/**
 * Encoder ESC/POS mínimo. No se usa una librería npm a propósito:
 * en Nuxt 4 el bundling de encoders CJS suele romper el POS, y un ticket
 * de farmacia solo necesita init, página de códigos, alineación, énfasis,
 * tamaño y corte.
 */

/**
 * Caracteres del español en la página de códigos 850 (PC850).
 *
 * Con `ascii` se sustituyen por su letra base ("Sueño" → "Sueno"). Con `cp850`
 * se envía el byte que la impresora dibuja como el carácter correcto. Sólo se
 * mapea lo que un ticket de farmacia realmente usa.
 */
const CP850: Record<string, number> = {
  á: 0xa0, é: 0x82, í: 0xa1, ó: 0xa2, ú: 0xa3,
  Á: 0xb5, É: 0x90, Í: 0xd6, Ó: 0xe0, Ú: 0xe9,
  ñ: 0xa4, Ñ: 0xa5, ü: 0x81, Ü: 0x9a,
  '¿': 0xa8, '¡': 0xad, '°': 0xf8,
}

/** `ESC t n` — número de la página 850 en impresoras Epson-compatibles. */
const EPSON_CODEPAGE_PC850 = 2

export class EscPosEncoder {
  private chunks: number[] = []

  constructor(private readonly charset: ReceiptCharset = 'ascii') {}

  init() {
    this.chunks.push(0x1b, 0x40)
    // La página de códigos se fija al inicio y vale para todo el ticket. Sin
    // `ESC t`, cada impresora usa la de fábrica y los acentos salen como
    // símbolos al azar según el modelo.
    if (this.charset === 'cp850') {
      this.chunks.push(0x1b, 0x74, EPSON_CODEPAGE_PC850)
    }
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
    for (const ch of toPrinterText(value, this.charset)) {
      const cp850 = this.charset === 'cp850' ? CP850[ch] : undefined
      this.chunks.push(cp850 ?? (ch.charCodeAt(0) & 0x7f))
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

  /**
   * Avance y corte. Cuatro saltos y no dos: entre el cabezal y la cuchilla hay
   * unos 12-15 mm de papel. Con dos saltos, la cuchilla cortaba sobre la última
   * línea del pie.
   */
  cut() {
    this.chunks.push(0x0a, 0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00)
    return this
  }

  encode() {
    return Uint8Array.from(this.chunks)
  }
}

/**
 * Texto tal como lo imprimirá la térmica con el charset dado.
 *
 * Es la MISMA función que usa la vista previa térmica: lo que se ve en pantalla
 * es literalmente lo que se envía, no una aproximación.
 */
export function toPrinterText(value: string, charset: ReceiptCharset = 'ascii'): string {
  let out = ''
  for (const ch of value) {
    if (ch >= ' ' && ch <= '~') out += ch
    else if (charset === 'cp850' && CP850[ch] !== undefined) out += ch
    else out += toBase(ch)
  }
  return out
}

function toBase(ch: string): string {
  if (ch === 'ñ') return 'n'
  if (ch === 'Ñ') return 'N'
  if (ch === '¿' || ch === '¡') return ''
  const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '')
  return /^[\x20-\x7E]$/.test(base) ? base : '?'
}

/** Compatibilidad con el código anterior: equivale a charset `ascii`. */
export function toPrinterAscii(value: string): string {
  return toPrinterText(value, 'ascii')
}

export function padLine(left: string, right: string, width = 32, charset: ReceiptCharset = 'ascii'): string {
  const l = toPrinterText(left, charset)
  const r = toPrinterText(right, charset)
  if (l.length + r.length >= width) {
    return `${l.slice(0, Math.max(1, width - r.length - 1))} ${r}`.slice(0, width)
  }
  return `${l}${' '.repeat(width - l.length - r.length)}${r}`
}
