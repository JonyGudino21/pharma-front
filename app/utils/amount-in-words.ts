/**
 * IMPORTE CON LETRA para documentos mercantiles en México.
 *
 *   1234.5  → "MIL DOSCIENTOS TREINTA Y CUATRO PESOS 50/100 M.N."
 *   1000000 → "UN MILLÓN DE PESOS 00/100 M.N."
 *
 * Reglas del español que suelen salir mal y que aquí se cubren:
 *   · "uno" se apocopa ante sustantivo: "UN MIL" no existe, pero "VEINTIÚN MIL",
 *     "TREINTA Y UN MILLONES" y "UN PESO" sí.
 *   · 100 exacto es "CIEN"; 101-199 es "CIENTO …".
 *   · 21-29 se escriben en una palabra ("VEINTIDÓS"); 31+ con " Y ".
 *   · Millones exactos llevan "DE": "DOS MILLONES DE PESOS".
 *   · Los centavos van en fracción "NN/100", siempre con dos dígitos.
 *
 * Opera sobre centavos enteros para no arrastrar errores de punto flotante
 * (0.1 + 0.2). Admite hasta 999,999,999,999.99; arriba de eso devuelve un
 * texto vacío en lugar de imprimir algo incorrecto.
 */

const UNIDADES = [
  'CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE',
  'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS',
  'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
]
const DECENAS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const CENTENAS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
]

/** 0-999. `apocopado`: "UNO" → "UN" cuando va delante de "MIL"/"MILLONES"/"PESOS". */
function centenas(n: number, apocopado: boolean): string {
  if (n === 0) return ''
  if (n === 100) return 'CIEN'

  const partes: string[] = []
  const c = Math.floor(n / 100)
  const resto = n % 100
  if (c > 0) partes.push(CENTENAS[c]!)

  if (resto > 0) {
    if (resto < 30) {
      let palabra = UNIDADES[resto]!
      // 1 → UNO/UN; 21 ya trae su forma apocopada propia ("VEINTIÚN").
      if (resto === 1 && apocopado) palabra = 'UN'
      partes.push(palabra)
    } else {
      const d = Math.floor(resto / 10)
      const u = resto % 10
      if (u === 0) partes.push(DECENAS[d]!)
      else partes.push(`${DECENAS[d]} Y ${u === 1 && apocopado ? 'UN' : UNIDADES[u]}`)
    }
  }
  return partes.join(' ')
}

/** Entero 0 ≤ n ≤ 999,999,999,999 en palabras, ya apocopado para ir ante "PESOS". */
function enteroEnLetra(n: number): string {
  if (n === 0) return 'CERO'

  const millones = Math.floor(n / 1_000_000)
  const miles = Math.floor((n % 1_000_000) / 1000)
  const unidades = n % 1000
  const partes: string[] = []

  if (millones > 0) {
    // "UN MILLÓN", "DOS MILLONES": millones cuenta como sustantivo (sing./plural).
    partes.push(millones === 1 ? 'UN MILLÓN' : `${millonesEnLetra(millones)} MILLONES`)
  }
  if (miles > 0) {
    // "MIL" a secas, nunca "UN MIL"; "VEINTIÚN MIL", "TREINTA Y UN MIL".
    partes.push(miles === 1 ? 'MIL' : `${centenas(miles, true)} MIL`)
  }
  if (unidades > 0) partes.push(centenas(unidades, true))

  return partes.join(' ')
}

/** Los millones pueden pasar de 999 (hasta 999,999): "CIENTO CINCO MIL MILLONES". */
function millonesEnLetra(m: number): string {
  const miles = Math.floor(m / 1000)
  const resto = m % 1000
  const partes: string[] = []
  if (miles > 0) partes.push(miles === 1 ? 'MIL' : `${centenas(miles, true)} MIL`)
  if (resto > 0) partes.push(centenas(resto, true))
  return partes.join(' ')
}

export function importeConLetra(importe: number, moneda = { singular: 'PESO', plural: 'PESOS', sufijo: 'M.N.' }): string {
  if (!Number.isFinite(importe) || importe < 0) return ''

  const centavosTotales = Math.round(importe * 100)
  const entero = Math.floor(centavosTotales / 100)
  const centavos = centavosTotales % 100
  if (entero > 999_999_999_999) return ''

  const letra = enteroEnLetra(entero)
  // Millones exactos (y "UN MILLÓN") llevan "DE": "UN MILLÓN DE PESOS".
  const redondoEnMillones = entero >= 1_000_000 && entero % 1_000_000 === 0
  const nombreMoneda = entero === 1 ? moneda.singular : moneda.plural
  const de = redondoEnMillones ? ' DE' : ''

  return `${letra}${de} ${nombreMoneda} ${String(centavos).padStart(2, '0')}/100 ${moneda.sufijo}`
}
