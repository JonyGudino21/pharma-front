<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
      
      <div class="text-center">
        <div class="mx-auto w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
          <Icon name="ph:pill-bold" class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100">PharmaPOS</h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Inicia sesión para acceder al sistema
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div>
            <label for="email" class="label-base">Correo Electrónico</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input-base"
              placeholder="admin@farmacia.com"
            />
          </div>
          
          <div>
            <label for="password" class="label-base">Contraseña</label>
            <div class="relative mt-1">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input-base pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <Icon :name="showPassword ? 'ph:eye-slash' : 'ph:eye'" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="rememberMe"
                v-model="form.rememberMe"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="rememberMe" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Recordar sesión
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="btn-primary w-full"
        >
          <Icon v-if="isLoading" name="ph:spinner-gap-bold" class="w-5 h-5 mr-2 animate-spin" />
          {{ isLoading ? 'Autenticando...' : 'Ingresar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from '#app'
import { useAuthStore } from '~/stores/auth'

// Le decimos a Nuxt que para esta página use el layout "blank" en vez del principal
definePageMeta({
  layout: 'blank'
})

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)
const isLoading = ref(false)

const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

async function handleSubmit() {
  if (isLoading.value) return
  isLoading.value = true
  
  try {
    // La petición HTTP y el manejo del Toast de error en caso de credenciales 
    // inválidas ya lo hace nuestro Store e Interceptor automáticamente.
    await authStore.login(form)
    
    // Si llega a esta línea, el login fue exitoso (200 OK)
    router.push('/')
  } catch (error) {
    // No necesitamos un alert manual, el Interceptor lanza el toast.error('Credenciales incorrectas')
    console.error("Login fallido") 
  } finally {
    isLoading.value = false
  }
}
</script>