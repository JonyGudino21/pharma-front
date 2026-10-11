import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useTerminal } from '~/composables/useTerminal'
import { usePrinterDevice } from '~/composables/usePrinterDevice'
import { encodeDrawerPulse } from '~/utils/escpos'

export type DrawerOpenResult = 'opened' | 'no-printer'

/**
 * Apertura del cajón SIN venta, siempre auditada.
 *
 * Orden deliberado:
 *   1. Se busca la impresora (si no hay, no se registra nada: no hubo apertura).
 *   2. Se registra en el servidor quién, por qué y desde qué caja.
 *   3. SÓLO si el registro se guardó, se manda el pulso.
 * Si el servidor no responde, el cajón no se abre: una apertura sin rastro es
 * exactamente lo que este control existe para impedir.
 */
export function useCashDrawer() {
  const { profile } = useTerminal()
  const device = usePrinterDevice()
  const opening = ref(false)

  async function openWithAudit(kind: 'MANUAL' | 'TEST', reason: string): Promise<DrawerOpenResult> {
    opening.value = true
    try {
      const printer = await device.pickPrinter(true)
      if (!printer) return 'no-printer'

      const { $api } = useNuxtApp()
      await $api('/cash-shift/drawer-events', {
        method: 'POST',
        body: { kind, reason, terminal: profile.value.name },
      })

      await device.send(printer, encodeDrawerPulse(profile.value.drawerPin))
      return 'opened'
    } finally {
      opening.value = false
    }
  }

  return { openWithAudit, opening }
}
