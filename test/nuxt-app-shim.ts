// Doble mínimo de '#app' para probar composables (useState y useRuntimeConfig).
// No arranca Nuxt: un Map de refs compartidas por clave, como useState real.
import { ref, type Ref } from 'vue'

const estado = new Map<string, Ref<unknown>>()

export function useState<T>(key: string, init?: () => T): Ref<T> {
  if (!estado.has(key)) estado.set(key, ref(init ? init() : undefined))
  return estado.get(key) as Ref<T>
}

/** Configuración mínima de la app (lo que leen los composables probados). */
export function useRuntimeConfig() {
  return { app: { baseURL: '/', buildAssetsDir: '/_nuxt/', buildId: 'prueba' }, public: {} }
}

export function __resetState() {
  estado.clear()
}
