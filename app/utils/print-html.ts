/**
 * Imprime un documento HTML completo con el diálogo del navegador, desde un
 * IFRAME oculto (no una ventana emergente: un `window.open` posterior a varios
 * `await` lo bloquea el navegador y no sale nada).
 *
 * Espera a que el documento, sus fuentes y sus imágenes estén listos antes de
 * llamar a `print()`: imprimir de inmediato sacaba la hoja con el logo a medias
 * o sin cargar. Una imagen que no carga NO impide imprimir (tope de espera).
 *
 * @returns true si se lanzó el diálogo de impresión
 */
const ESPERA_IMAGENES_MS = 3000

export async function printHtmlDocument(html: string): Promise<boolean> {
  if (!import.meta.client) return false

  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
  document.body.appendChild(frame)

  try {
    const doc = frame.contentDocument
    const win = frame.contentWindow
    if (!doc || !win) return false

    doc.open()
    doc.write(html)
    doc.close()

    await new Promise<void>((resolve) => {
      if (doc.readyState === 'complete') resolve()
      else frame.addEventListener('load', () => resolve(), { once: true })
    })
    await doc.fonts?.ready

    const pendientes = [...doc.images].filter((img) => !img.complete)
    if (pendientes.length > 0) {
      await Promise.race([
        Promise.all(
          pendientes.map(
            (img) =>
              new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true })
                img.addEventListener('error', () => resolve(), { once: true })
              }),
          ),
        ),
        new Promise<void>((resolve) => setTimeout(resolve, ESPERA_IMAGENES_MS)),
      ])
    }

    win.focus()
    win.print()
    return true
  } catch {
    return false
  } finally {
    // Margen para que el diálogo termine de leer el documento antes de retirarlo.
    setTimeout(() => frame.remove(), 1000)
  }
}
