import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { ApiResponse } from '~/types/auth'
import type {
  SettingsHistoryItem,
  SettingsMap,
  SettingsNamespace,
  SettingsSnapshot,
} from '~/types/settings'

/**
 * Cuánto se reutiliza una sección ya leída. El POS vive abierto todo el turno:
 * sin caducidad, un cambio del gerente (p. ej. el fondo sugerido) no llegaría
 * a la caja hasta recargar la página.
 */
const FRESH_MS = 60_000

type Entry<N extends SettingsNamespace> = { snapshot: SettingsSnapshot<N>; fetchedAt: number }
type Cache = { [N in SettingsNamespace]?: Entry<N> }

export interface SettingsHistoryPage {
  items: SettingsHistoryItem[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

export const useSettingsStore = defineStore('settings', () => {
  const cache = ref<Cache>({})
  // Peticiones en vuelo: tres componentes pidiendo lo mismo = una petición.
  const inflight = new Map<SettingsNamespace, Promise<SettingsSnapshot>>()

  function snapshotOf<N extends SettingsNamespace>(ns: N): SettingsSnapshot<N> | null {
    return (cache.value[ns] as Entry<N> | undefined)?.snapshot ?? null
  }

  function valuesOf<N extends SettingsNamespace>(ns: N): SettingsMap[N] | null {
    return snapshotOf(ns)?.values ?? null
  }

  function remember<N extends SettingsNamespace>(snapshot: SettingsSnapshot<N>) {
    ;(cache.value as Record<string, Entry<N>>)[snapshot.namespace] = {
      snapshot,
      fetchedAt: Date.now(),
    }
  }

  /**
   * Lee una sección. Reutiliza la copia si es reciente, salvo `force`
   * (pantallas de Configuración: siempre muestran lo último).
   */
  async function fetch<N extends SettingsNamespace>(
    ns: N,
    opts: { force?: boolean } = {},
  ): Promise<SettingsSnapshot<N>> {
    const hit = cache.value[ns] as Entry<N> | undefined
    if (!opts.force && hit && Date.now() - hit.fetchedAt < FRESH_MS) return hit.snapshot

    const pending = inflight.get(ns)
    if (pending) return pending as Promise<SettingsSnapshot<N>>

    const { $api } = useNuxtApp()
    const request = $api<ApiResponse<SettingsSnapshot<N>>>(`/settings/${ns}`)
      .then((res) => {
        remember(res.data)
        return res.data
      })
      .finally(() => inflight.delete(ns))

    inflight.set(ns, request as Promise<SettingsSnapshot>)
    return request
  }

  /**
   * Guarda SÓLO lo que cambió, con la versión que el usuario tenía en
   * pantalla. Si otro usuario guardó antes, el servidor responde 409.
   */
  async function save<N extends SettingsNamespace>(
    ns: N,
    version: number,
    values: Partial<SettingsMap[N]>,
  ): Promise<{ snapshot: SettingsSnapshot<N>; changed: string[] }> {
    const { $api } = useNuxtApp()
    const res = await $api<ApiResponse<{ snapshot: SettingsSnapshot<N>; changed: string[] }>>(
      `/settings/${ns}`,
      { method: 'PATCH', body: { version, values } },
    )
    remember(res.data.snapshot)
    return res.data
  }

  async function history(ns: SettingsNamespace, page = 1, limit = 8): Promise<SettingsHistoryPage> {
    const { $api } = useNuxtApp()
    const res = await $api<ApiResponse<SettingsHistoryPage>>(
      `/settings/${ns}/history?page=${page}&limit=${limit}`,
    )
    return res.data
  }

  /** Al cerrar sesión: el siguiente usuario no debe ver ajustes del anterior. */
  function $reset() {
    cache.value = {}
    inflight.clear()
  }

  return { cache, snapshotOf, valuesOf, fetch, save, history, $reset }
})
