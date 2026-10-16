import { computed, onBeforeUnmount, onMounted, reactive, ref, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useSettingsStore } from '~/stores/settings'
import { useToast } from '~/composables/useToast'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'
import { useUpdateHold } from '~/composables/useAppUpdate'
import { describirFallo } from '~/composables/useRequestState'
import type {
  FieldErrors,
  SettingsMap,
  SettingsNamespace,
  SettingsSnapshot,
} from '~/types/settings'

/**
 * Estado de una pantalla de Configuración (caja, inventario…).
 *
 * Resuelve en un solo lugar lo que cada pantalla haría a su manera:
 *  - carga con estado de error distinguible de "vacío";
 *  - detección de cambios contra lo último guardado (no contra lo inicial);
 *  - guardado de SÓLO lo que cambió, con la versión que se tenía en pantalla;
 *  - conflicto (409): otro usuario guardó antes → se avisa y se ofrece
 *    recargar, sin pisar ni perder en silencio lo que el usuario escribió;
 *  - protección contra salir con cambios (navegación, pestaña, recarga) y
 *    Ctrl/Cmd+S.
 *
 * La validación del cliente sólo da retroalimentación inmediata: la decisión
 * final es del servidor.
 */
export function useSettingsForm<N extends SettingsNamespace>(
  namespace: N,
  options: {
    validate?: (values: SettingsMap[N]) => FieldErrors<SettingsMap[N]>
    /** Texto del toast al guardar. */
    savedMessage?: string
    /** Tras un guardado con cambios (botón o Ctrl+S): p. ej. recargar la bitácora. */
    onSaved?: () => void
  } = {},
) {
  type Values = SettingsMap[N]
  type Key = keyof Values & string

  const store = useSettingsStore()
  const toast = useToast()

  const form = reactive({}) as Values
  const baseline = ref<Values | null>(null) as Ref<Values | null>
  const snapshot = ref<SettingsSnapshot<N> | null>(null) as Ref<SettingsSnapshot<N> | null>

  const loading = ref(false)
  const saving = ref(false)
  const loadError = ref<string | null>(null)
  /** Otro usuario guardó mientras se editaba. */
  const conflict = ref(false)

  function apply(snap: SettingsSnapshot<N>) {
    snapshot.value = snap
    baseline.value = { ...snap.values }
    Object.assign(form as object, snap.values)
    conflict.value = false
  }

  async function load() {
    loading.value = true
    loadError.value = null
    try {
      apply(await store.fetch(namespace, { force: true }))
    } catch (error) {
      loadError.value = describirFallo(error).mensaje
    } finally {
      loading.value = false
    }
  }

  const changedKeys = computed<Key[]>(() => {
    const base = baseline.value
    if (!base) return []
    return (Object.keys(base) as Key[]).filter(
      (k) => !Object.is((form as Values)[k], base[k]),
    )
  })

  const dirty = computed(() => changedKeys.value.length > 0)

  // Cambios sin guardar: no se ofrece recargar para actualizar la aplicación.
  useUpdateHold(`settings:${String(namespace)}`, () =>
    dirty.value ? 'Tienes cambios sin guardar en Configuración.' : null,
  )
  const errors = computed<FieldErrors<Values>>(() =>
    baseline.value && options.validate ? options.validate(form as Values) : {},
  )
  const valid = computed(() => Object.keys(errors.value).length === 0)

  function isChanged(key: Key) {
    return changedKeys.value.includes(key)
  }

  function discard() {
    if (baseline.value) Object.assign(form as object, baseline.value)
  }

  function restoreDefault(key: Key) {
    const defaults = snapshot.value?.defaults
    if (defaults) (form as Values)[key] = defaults[key]
  }

  async function save(): Promise<boolean> {
    if (!dirty.value || saving.value || !snapshot.value) return false
    if (!valid.value) {
      toast.warning('Revisa los campos marcados antes de guardar.')
      return false
    }

    saving.value = true
    try {
      const values = Object.fromEntries(
        changedKeys.value.map((k) => [k, (form as Values)[k]]),
      ) as Partial<Values>
      const res = await store.save(namespace, snapshot.value.version, values)
      apply(res.snapshot)
      toast.success(options.savedMessage ?? 'Configuración guardada. Ya se aplica en todas las cajas.')
      options.onSaved?.()
      return true
    } catch (error) {
      // El interceptor ya mostró el mensaje del servidor (400/409). Aquí sólo
      // se decide qué hacer con la pantalla.
      if (describirFallo(error).estado === 409) conflict.value = true
      return false
    } finally {
      saving.value = false
    }
  }

  // ── No perder cambios ───────────────────────────────────────────────────
  onBeforeRouteLeave(() => {
    if (dirty.value && !window.confirm('Tienes cambios sin guardar. ¿Salir y descartarlos?')) {
      return false
    }
  })

  function beforeUnload(e: BeforeUnloadEvent) {
    if (!dirty.value) return
    e.preventDefault()
    e.returnValue = ''
  }

  onMounted(() => {
    window.addEventListener('beforeunload', beforeUnload)
    void load()
  })
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

  useKeyboardShortcuts({
    'ctrl+s': () => void save(),
    'meta+s': () => void save(),
  })

  return {
    form,
    snapshot,
    loading,
    saving,
    loadError,
    conflict,
    dirty,
    errors,
    valid,
    changedKeys,
    isChanged,
    load,
    save,
    discard,
    restoreDefault,
  }
}
