import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
// Mismo módulo al que vitest.config.ts apunta '#app' (doble de useState).
import { __resetState } from '../../test/nuxt-app-shim'
import { UPDATE_SNOOZE_MS, useAppUpdate, useUpdateHold } from './useAppUpdate'

describe('useAppUpdate', () => {
  beforeEach(() => __resetState())
  afterEach(() => vi.useRealTimers())

  it('arranca sin aviso', () => {
    const u = useAppUpdate()
    expect(u.available.value).toBe(false)
    expect(u.blockedBy.value).toBeNull()
  })

  it('una operación en curso bloquea la recarga y explica por qué', () => {
    const u = useAppUpdate()
    u.markAvailable('manifest')
    u.hold('pos', 'Hay una venta en curso.')
    expect(u.blockedBy.value).toBe('Hay una venta en curso.')
    expect(u.apply()).toBe(false)
  })

  it('al terminar la operación se libera', () => {
    const u = useAppUpdate()
    u.hold('pos', 'Hay una venta en curso.')
    u.release('pos')
    expect(u.blockedBy.value).toBeNull()
  })

  it('"Más tarde" aplaza 30 minutos', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    const u = useAppUpdate()
    u.markAvailable('manifest')
    u.snooze()
    expect(u.snoozedUntil.value).toBe(1_000_000 + UPDATE_SNOOZE_MS)
  })

  it('un archivo faltante (chunk) no se puede aplazar y anula un aplazamiento previo', () => {
    const u = useAppUpdate()
    u.markAvailable('manifest')
    u.snooze()
    u.markAvailable('chunk')
    expect(u.reason.value).toBe('chunk')
    expect(u.snoozedUntil.value).toBe(0)
    u.snooze()
    expect(u.snoozedUntil.value).toBe(0)
  })

  it('un aviso "manifest" posterior no rebaja la urgencia de "chunk"', () => {
    const u = useAppUpdate()
    u.markAvailable('chunk')
    u.markAvailable('manifest')
    expect(u.reason.value).toBe('chunk')
  })
})

describe('useUpdateHold', () => {
  beforeEach(() => __resetState())

  it('registra y libera según el motivo, y se limpia al salir de la pantalla', async () => {
    const u = useAppUpdate()
    const flag = ref<string | null>('Tienes cambios sin guardar.')

    const scope = effectScope()
    scope.run(() => useUpdateHold('settings', () => flag.value))
    expect(u.blockedBy.value).toBe('Tienes cambios sin guardar.')

    flag.value = null
    await Promise.resolve()
    expect(u.blockedBy.value).toBeNull()

    flag.value = 'otra vez'
    await Promise.resolve()
    expect(u.blockedBy.value).toBe('otra vez')

    scope.stop()
    expect(u.blockedBy.value).toBeNull()
  })
})
