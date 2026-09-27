/**
 * Validación de RFC mexicano, IDÉNTICA a la del backend
 * (`UpdateCompanyDto.rfc`).
 *
 * Validar sólo en el servidor obligaba a guardar para enterarse del error; y
 * validar distinto en cada lado es peor: el front acepta algo que el servidor
 * rechaza. Por eso la expresión es la misma, carácter por carácter.
 *
 * Persona moral: 3 letras + 6 dígitos (fecha) + 3 de homoclave = 12.
 * Persona física: 4 letras + 6 dígitos + 3 = 13.
 */
const RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i

export function rfcError(value: string): string | null {
  const v = value.trim()
  if (!v) return null // opcional: sin RFC el ticket simplemente no lo muestra
  if (v.length !== 12 && v.length !== 13) {
    return `El RFC tiene ${v.length} caracteres; debe tener 12 (empresa) o 13 (persona física).`
  }
  if (!RFC.test(v)) {
    return 'Formato inválido. Ejemplo: XAXX010101000 (letras, fecha AAMMDD y homoclave).'
  }
  return null
}
