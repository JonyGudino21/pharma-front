import { useState } from '#app'

/**
 * Estado del panel de Ayuda (uno para toda la app). Cualquier pantalla puede
 * abrirlo en una guía y sección concretas:
 *
 *   const { openHelp } = useHelp()
 *   openHelp('pos', 'cobrar')
 *
 * Sin argumentos abre la guía de la pantalla actual (`guideForRoute`).
 */
export function useHelp() {
  const open = useState<boolean>('help:open', () => false)
  const guideId = useState<string | null>('help:guide', () => null)
  const sectionId = useState<string | null>('help:section', () => null)

  function openHelp(guide?: string | null, section?: string | null) {
    guideId.value = guide ?? null
    sectionId.value = section ?? null
    open.value = true
  }

  function closeHelp() {
    open.value = false
  }

  return { open, guideId, sectionId, openHelp, closeHelp }
}
