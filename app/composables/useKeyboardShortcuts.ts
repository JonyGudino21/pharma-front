import { onMounted, onUnmounted } from 'vue'

/**
 * Composable reutilizable de atajos de teclado.
 *
 * Uso:
 *   useKeyboardShortcuts({
 *     F2: () => cobrar(),
 *     'ctrl+p': () => reimprimir(),
 *     Escape: () => enfocarEscaner(),
 *   })
 *
 * Convenciones:
 * - Las teclas de función (F1..F12) y Escape se capturan aunque el foco esté en un input.
 * - Las combinaciones con Ctrl/Alt/Meta se normalizan a "ctrl+alt+meta+<key>".
 * - Las teclas simples (letras/números) NO se disparan si el foco está en un campo de texto,
 *   para no interferir con la escritura ni con el escáner de código de barras.
 */
export type ShortcutMap = Record<string, (e: KeyboardEvent) => void>

const FUNCTION_KEYS = /^F([1-9]|1[0-2])$/
const ALWAYS_ACTIVE = new Set(['Escape'])

function isTypingContext(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

function buildCombo(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey) parts.push('ctrl')
  if (e.altKey) parts.push('alt')
  if (e.metaKey) parts.push('meta')
  // Normalizamos la tecla: F-keys y Escape tal cual; el resto en minúscula.
  const key = FUNCTION_KEYS.test(e.key) || ALWAYS_ACTIVE.has(e.key) ? e.key : e.key.toLowerCase()
  parts.push(key)
  return parts.join('+')
}

export function useKeyboardShortcuts(map: ShortcutMap, options: { enabled?: () => boolean } = {}) {
  function onKey(e: KeyboardEvent) {
    if (options.enabled && !options.enabled()) return

    const combo = buildCombo(e)
    const handler = map[combo]
    if (!handler) return

    const hasModifier = e.ctrlKey || e.altKey || e.metaKey
    const isFunctionOrEscape = FUNCTION_KEYS.test(e.key) || ALWAYS_ACTIVE.has(e.key)

    // Si es una tecla "simple" (sin modificador y no F-key/Escape) y estamos escribiendo, ignoramos.
    if (!hasModifier && !isFunctionOrEscape && isTypingContext(e.target)) return

    e.preventDefault()
    handler(e)
  }

  onMounted(() => window.addEventListener('keydown', onKey))
  onUnmounted(() => window.removeEventListener('keydown', onKey))
}
