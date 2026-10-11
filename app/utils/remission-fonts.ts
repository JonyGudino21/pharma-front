/**
 * Tipografías de la nota de remisión, servidas por la propia aplicación.
 *
 * El documento se imprime desde un iframe con su propio `<head>`: no hereda las
 * @font-face de la app. Aquí se declaran con URL ABSOLUTA del mismo origen
 * (Vite empaqueta cada .woff2 y devuelve su ruta con `?url`), así funcionan sin
 * internet. Si una no carga, el CSS cae en las fuentes del sistema.
 */
import plexSans400 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2?url'
import plexSans500 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2?url'
import plexSans600 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2?url'
import plexSans700 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2?url'
import plexMono500 from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2?url'
import plexMono600 from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2?url'
import literata700 from '@fontsource/literata/files/literata-latin-700-normal.woff2?url'

const FACES: Array<[family: string, weight: number, url: string]> = [
  ['IBM Plex Sans', 400, plexSans400],
  ['IBM Plex Sans', 500, plexSans500],
  ['IBM Plex Sans', 600, plexSans600],
  ['IBM Plex Sans', 700, plexSans700],
  ['IBM Plex Mono', 500, plexMono500],
  ['IBM Plex Mono', 600, plexMono600],
  ['Literata', 700, literata700],
]

export function remissionFontFaces(): string {
  if (!import.meta.client) return ''
  return FACES.map(
    ([family, weight, url]) =>
      `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url('${new URL(url, window.location.origin).href}') format('woff2');}`,
  ).join('\n')
}
