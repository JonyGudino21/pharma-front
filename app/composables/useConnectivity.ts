import { computed } from 'vue'
import { useState } from '#app'

/**
 * ESTADO DE LA CONEXIÓN CON EL SERVIDOR (no con "internet").
 *
 * Lo que le importa al cajero no es si hay internet, sino si ESTE sistema puede
 * registrar la venta. Son cosas distintas según cómo esté instalado:
 *
 *   · Instalación local (servidor en la PC de la farmacia): sin internet el
 *     sistema sigue 100 % operativo. Aquí sólo importa que el servidor local
 *     responda.
 *   · Instalación en la nube: sin internet no hay servidor al que llegar.
 *
 * Por eso se mide lo que de verdad condiciona la operación: que `/health/ready`
 * del propio backend responda (y que su base de datos esté arriba). Ver
 * ADR-0017.
 *
 *   ok          el servidor y su base de datos responden
 *   server-down no hay respuesta (caído, apagado, red local, sin internet en nube)
 *   db-down     el servidor responde pero reporta su base de datos caída
 */
export type ConnectivityStatus = 'unknown' | 'ok' | 'server-down' | 'db-down'

export function useConnectivity() {
  const status = useState<ConnectivityStatus>('connectivity:status', () => 'unknown')
  /** Última vez que el servidor respondió bien (ISO), para decirle al usuario desde cuándo. */
  const lastOkAt = useState<string | null>('connectivity:last-ok', () => null)
  const checking = useState<boolean>('connectivity:checking', () => false)

  /** false sólo cuando SABEMOS que no se puede operar; 'unknown' no bloquea. */
  const canOperate = computed(() => status.value === 'ok' || status.value === 'unknown')

  /** Pide una comprobación inmediata (la atiende el plugin del cliente). */
  function recheck() {
    if (import.meta.client) window.dispatchEvent(new Event('pharma:network-suspect'))
  }

  return { status, lastOkAt, checking, canOperate, recheck }
}
