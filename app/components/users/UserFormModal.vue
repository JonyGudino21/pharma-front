<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useUserManagementStore, type ManagedUser } from '~/stores/userManagement'
import { useToast } from '~/composables/useToast'
import { UserRole } from '~/types/auth'
import { ROLE_META, ROLE_ORDER } from '~/utils/roles'

/**
 * Alta y edición de usuarios.
 *
 * Las reglas del servidor se reflejan aquí para avisar ANTES de enviar:
 * contraseña de 8 a 72 caracteres, usuario sin espacios, y que uno no puede
 * quitarse el rol ni darse de baja a sí mismo. El servidor las vuelve a
 * aplicar: esto sólo evita el viaje de ida y vuelta.
 */
const props = defineProps<{
  userToEdit?: ManagedUser | null
  /** Usuario con la sesión abierta, para las salvaguardas sobre uno mismo. */
  currentUserId?: number
}>()

const emit = defineEmits<{ close: [] }>()

const store = useUserManagementStore()
const toast = useToast()

const PASSWORD_MIN = 8
const PASSWORD_MAX = 72
const USERNAME_RE = /^[a-zA-Z0-9._-]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isEditing = computed(() => !!props.userToEdit)
const isSelf = computed(() => !!props.userToEdit && props.userToEdit.id === props.currentUserId)
const isSubmitting = ref(false)
const touched = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
  role: UserRole.CASHIER as UserRole,
  password: '',
  isActive: true,
})

onMounted(() => {
  const u = props.userToEdit
  if (!u) return
  form.firstName = u.firstName
  form.lastName = u.lastName
  form.userName = u.userName
  form.email = u.email
  form.role = u.role
  form.isActive = u.isActive
})

const errors = computed(() => {
  const e: Partial<Record<keyof typeof form, string>> = {}
  if (!form.firstName.trim()) e.firstName = 'Escribe el nombre.'
  if (!form.lastName.trim()) e.lastName = 'Escribe los apellidos.'
  const un = form.userName.trim()
  if (un.length < 3 || un.length > 30) e.userName = 'Entre 3 y 30 caracteres.'
  else if (!USERNAME_RE.test(un)) e.userName = 'Sólo letras, números, punto, guion y guion bajo (sin espacios).'
  if (!EMAIL_RE.test(form.email.trim())) e.email = 'Escribe un correo válido.'
  const pw = form.password
  if (!isEditing.value || pw) {
    if (pw.length < PASSWORD_MIN) e.password = `Mínimo ${PASSWORD_MIN} caracteres.`
    else if (pw.length > PASSWORD_MAX) e.password = `Máximo ${PASSWORD_MAX} caracteres.`
  }
  return e
})
const show = (k: keyof typeof form) => (touched.value ? errors.value[k] : undefined)

const roleChanged = computed(() => isEditing.value && props.userToEdit?.role !== form.role)
const endsSessions = computed(
  () => isEditing.value && (roleChanged.value || !!form.password || (props.userToEdit?.isActive && !form.isActive)),
)

async function handleSubmit() {
  touched.value = true
  if (isSubmitting.value || Object.keys(errors.value).length > 0) return
  isSubmitting.value = true

  const base = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    userName: form.userName.trim(),
    email: form.email.trim(),
  }

  try {
    if (props.userToEdit) {
      await store.updateUser(props.userToEdit.id, {
        ...base,
        // Sobre uno mismo no se mandan rol ni estado: el servidor los rechaza
        // y aquí están bloqueados de todos modos.
        ...(isSelf.value ? {} : { role: form.role, isActive: form.isActive }),
        password: form.password || undefined,
      })
      toast.success(endsSessions.value ? 'Usuario actualizado. Sus sesiones se cerraron.' : 'Usuario actualizado.')
    } else {
      await store.createUser({ ...base, role: form.role, password: form.password })
      toast.success('Usuario creado. Ya puede iniciar sesión.')
    }
    emit('close')
  } catch {
    // El interceptor ya mostró el motivo (p. ej. "el correo ya está en uso").
    // El modal sigue abierto para corregir.
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="userFormTitle"
    @keydown.esc="emit('close')"
  >
    <div class="modal-panel sm:max-w-2xl">
      <div class="modal-header items-center">
        <h2 id="userFormTitle" class="flex items-center gap-2 text-lg font-bold sm:text-xl text-gray-900 dark:text-white">
          <Icon :name="isEditing ? 'ph:user-gear-bold' : 'ph:user-plus-bold'" class="shrink-0 text-primary-600 dark:text-primary-400" />
          {{ isEditing ? 'Editar usuario' : 'Nuevo usuario' }}
        </h2>
        <button type="button" class="-mr-2 rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Cerrar" @click="emit('close')">
          <Icon name="ph:x-bold" class="h-6 w-6" />
        </button>
      </div>

      <form id="userForm" class="modal-body space-y-5 sm:space-y-6" novalidate @submit.prevent="handleSubmit">
        <fieldset class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend class="sr-only">Datos personales</legend>
          <div>
            <label for="u-first" class="label-base">Nombre(s)</label>
            <input id="u-first" v-model="form.firstName" type="text" maxlength="60" autocomplete="off" class="input-base" :aria-invalid="!!show('firstName')" />
            <p v-if="show('firstName')" class="mt-1 text-xs text-error-600 dark:text-error-400">{{ show('firstName') }}</p>
          </div>
          <div>
            <label for="u-last" class="label-base">Apellidos</label>
            <input id="u-last" v-model="form.lastName" type="text" maxlength="60" autocomplete="off" class="input-base" :aria-invalid="!!show('lastName')" />
            <p v-if="show('lastName')" class="mt-1 text-xs text-error-600 dark:text-error-400">{{ show('lastName') }}</p>
          </div>
          <div>
            <label for="u-user" class="label-base">Usuario para iniciar sesión</label>
            <input id="u-user" v-model="form.userName" type="text" maxlength="30" autocomplete="off" autocapitalize="none" spellcheck="false" class="input-base font-mono" placeholder="jperez" :aria-invalid="!!show('userName')" />
            <p v-if="show('userName')" class="mt-1 text-xs text-error-600 dark:text-error-400">{{ show('userName') }}</p>
          </div>
          <div>
            <label for="u-email" class="label-base">Correo electrónico</label>
            <input id="u-email" v-model="form.email" type="email" maxlength="120" autocomplete="off" class="input-base" placeholder="juan@farmacia.mx" :aria-invalid="!!show('email')" />
            <p v-if="show('email')" class="mt-1 text-xs text-error-600 dark:text-error-400">{{ show('email') }}</p>
          </div>
        </fieldset>

        <fieldset>
          <legend class="label-base">Rol</legend>
          <p v-if="isSelf" class="mb-2 flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Icon name="ph:lock-simple" class="mt-px h-3.5 w-3.5 shrink-0" /> No puedes cambiar tu propio rol: pídeselo a otro administrador.
          </p>
          <div class="grid gap-2 sm:grid-cols-2">
            <label
              v-for="r in ROLE_ORDER"
              :key="r"
              class="flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500"
              :class="[
                form.role === r ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700',
                isSelf ? 'cursor-not-allowed opacity-60' : '',
              ]"
            >
              <input v-model="form.role" type="radio" name="role" :value="r" class="sr-only" :disabled="isSelf" />
              <Icon :name="ROLE_META[r].icon" class="mt-0.5 h-5 w-5 shrink-0" :class="form.role === r ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'" />
              <span>
                <span class="block text-sm font-semibold text-gray-900 dark:text-white">{{ ROLE_META[r].label }}</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">{{ ROLE_META[r].summary }}</span>
              </span>
            </label>
          </div>
        </fieldset>

        <div>
          <label for="u-pass" class="label-base">{{ isEditing ? 'Nueva contraseña' : 'Contraseña' }}</label>
          <input
            id="u-pass"
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            :maxlength="PASSWORD_MAX"
            class="input-base"
            :placeholder="isEditing ? 'Déjala vacía para conservar la actual' : `Mínimo ${PASSWORD_MIN} caracteres`"
            :aria-invalid="!!show('password')"
            aria-describedby="u-pass-hint"
          />
          <p id="u-pass-hint" class="mt-1 text-xs" :class="show('password') ? 'text-error-600 dark:text-error-400' : 'text-gray-500 dark:text-gray-400'">
            {{ show('password') || `De ${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres. Compártela en persona, nunca por mensaje.` }}
          </p>
        </div>

        <div v-if="isEditing && !isSelf" class="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
          <input id="u-active" v-model="form.isActive" type="checkbox" class="h-5 w-5 shrink-0 rounded border-gray-300 text-primary-600 sm:h-4 sm:w-4 dark:border-gray-500" />
          <label for="u-active" class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            Usuario activo (puede iniciar sesión)
          </label>
        </div>

        <p v-if="endsSessions" class="flex gap-2 rounded-lg bg-warning-500/10 p-3 text-xs text-warning-800 dark:text-warning-300" role="status">
          <Icon name="ph:sign-out-bold" class="h-4 w-4 shrink-0" />
          Al guardar se cerrarán sus sesiones abiertas: tendrá que volver a iniciar sesión.
        </p>
      </form>

      <div class="modal-footer bg-gray-50 dark:bg-gray-800/80">
        <button type="button" class="btn-secondary" @click="emit('close')">Cancelar</button>
        <button type="submit" form="userForm" :disabled="isSubmitting" class="btn-primary">
          <Icon v-if="isSubmitting" name="ph:spinner-gap-bold" class="mr-2 animate-spin" />
          {{ isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear usuario' }}
        </button>
      </div>
    </div>
  </div>
</template>
