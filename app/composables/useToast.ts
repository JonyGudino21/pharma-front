import { useState } from '#app'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

const DURACION_MS = 4000

/**
 * Avisos de la interfaz.
 *
 * ─── POR QUÉ `useState` Y NO UN `ref` DE MÓDULO ───
 *
 * La versión anterior declaraba el estado en el ámbito del módulo:
 *
 *     const toasts = ref([])
 *     let nextId = 0
 *
 * En el navegador funciona. En el servidor, el módulo se evalúa UNA vez por
 * proceso de Nitro y ese array queda compartido por todas las peticiones de
 * todos los usuarios que atienda ese proceso. Las consecuencias eran reales:
 *
 *   1. FUGA ENTRE USUARIOS: un aviso generado durante el SSR de la pantalla del
 *      cajero A ("No tienes permiso para esta operación") se serializaba en el
 *      HTML que recibía el cajero B. Con datos de negocio en el mensaje —el
 *      nombre de un cliente, un folio— eso es una fuga de información.
 *   2. CRECIMIENTO SIN LÍMITE: cada aviso creado en SSR programaba un
 *      `setTimeout` de 4 s en el servidor. Miles de temporizadores vivos
 *      manteniendo referencias a mensajes que nadie iba a ver.
 *   3. IDS REPETIDOS: `nextId` se reiniciaba al reiniciar el proceso, así que
 *      el `id` de la lista podía chocar con el de un aviso ya hidratado y Vue
 *      reutilizaba el nodo equivocado.
 *
 * `useState` guarda el valor en el contexto de LA petición (y lo hidrata en el
 * cliente), que es el alcance correcto para algo tan efímero como un aviso.
 */
export const useToast = () => {
  const toasts = useState<Toast[]>('toasts', () => [])

  const remove = (id: string) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  const add = (message: string, type: ToastType) => {
    // crypto.randomUUID en lugar de un contador: no hay estado que sincronizar
    // entre servidor y cliente, así que tampoco hay ids que colisionen.
    const id = crypto.randomUUID()
    toasts.value = [...toasts.value, { id, message, type }]

    // El auto-descarte es cosa del navegador. En el servidor no hay nadie
    // mirando la pantalla y el temporizador sólo retendría memoria durante
    // toda la vida del proceso.
    if (import.meta.client) {
      setTimeout(() => remove(id), DURACION_MS)
    }
  }

  return {
    toasts,
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    warning: (msg: string) => add(msg, 'warning'),
    info: (msg: string) => add(msg, 'info'),
    remove,
  }
}
