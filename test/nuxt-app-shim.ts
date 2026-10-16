// Doble mínimo de '#app' para probar composables que sólo usan `useState`.
// No arranca Nuxt: un Map de refs compartidas por clave, como useState real.
import { ref, type Ref } from 'vue'

const estado = new Map<string, Ref<unknown>>()

export function useState<T>(key: string, init?: () => T): Ref<T> {
  if (!estado.has(key)) estado.set(key, ref(init ? init() : undefined))
  return estado.get(key) as Ref<T>
}

export function __resetState() {
  estado.clear()
}
