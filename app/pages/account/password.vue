<template>
  <div class="mx-auto max-w-lg">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Cambiar contraseña</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Al guardar se cerrarán <strong>todas</strong> tus sesiones abiertas, incluida ésta,
      y tendrás que entrar de nuevo con la contraseña nueva.
    </p>

    <form
      class="mt-6 space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      novalidate
      @submit.prevent="guardar"
    >
      <div>
        <label for="actual" class="label-base">Contraseña actual</label>
        <input
          id="actual"
          v-model="form.actual"
          type="password"
          autocomplete="current-password"
          required
          class="input-base"
        />
      </div>

      <div>
        <label for="nueva" class="label-base">Contraseña nueva</label>
        <input
          id="nueva"
          v-model="form.nueva"
          type="password"
          autocomplete="new-password"
          required
          :minlength="MINIMO"
          maxlength="72"
          class="input-base"
          aria-describedby="ayuda-nueva"
        />
        <p id="ayuda-nueva" class="mt-1 text-xs" :class="nuevaValida ? 'text-gray-500' : 'text-warning-600'">
          Mínimo {{ MINIMO }} caracteres. Una frase de varias palabras es más fácil de recordar y más difícil de adivinar.
        </p>
      </div>

      <div>
        <label for="confirmacion" class="label-base">Repite la contraseña nueva</label>
        <input
          id="confirmacion"
          v-model="form.confirmacion"
          type="password"
          autocomplete="new-password"
          required
          class="input-base"
        />
        <p v-if="form.confirmacion && !coinciden" class="mt-1 text-xs text-error-600" role="alert">
          Las contraseñas no coinciden.
        </p>
      </div>

      <div class="flex items-center justify-end gap-3 pt-2">
        <NuxtLink to="/" class="rounded-md px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300">
          Cancelar
        </NuxtLink>
        <button
          type="submit"
          :disabled="!puedeGuardar || guardando"
          class="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon v-if="guardando" name="ph:spinner-gap-bold" class="animate-spin" />
          {{ guardando ? 'Guardando…' : 'Cambiar contraseña' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useNuxtApp, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'

/** Debe coincidir con PASSWORD_MIN_LENGTH del backend. */
const MINIMO = 8

const authStore = useAuthStore()
const toast = useToast()

const form = reactive({ actual: '', nueva: '', confirmacion: '' })
const guardando = ref(false)

const nuevaValida = computed(() => form.nueva.length === 0 || form.nueva.length >= MINIMO)
const coinciden = computed(() => form.nueva === form.confirmacion)
const puedeGuardar = computed(
  () =>
    form.actual.length > 0 &&
    form.nueva.length >= MINIMO &&
    coinciden.value &&
    form.nueva !== form.actual,
)

async function guardar() {
  if (!puedeGuardar.value || guardando.value) return

  const { $api } = useNuxtApp()
  guardando.value = true
  try {
    await $api('/auth/change-password', {
      method: 'POST',
      body: { currentPassword: form.actual, newPassword: form.nueva },
    })

    // El backend ya revocó todas las sesiones y borró las cookies. Se limpia el
    // estado local y se manda al login: seguir en la app con una sesión muerta
    // sólo produciría un 401 en el siguiente clic.
    authStore.clearSession()
    toast.success('Contraseña actualizada. Inicia sesión con la nueva.')
    await navigateTo('/login')
  } catch {
    // El interceptor ya mostró el mensaje del backend (contraseña actual
    // incorrecta, igual a la anterior, demasiados intentos…). Sólo se limpia
    // el campo actual para que se vuelva a teclear.
    form.actual = ''
  } finally {
    guardando.value = false
  }
}
</script>
