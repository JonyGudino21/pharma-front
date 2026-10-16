import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const toast = useToast()

  // --- 1. RESTAURACIÓN DE SESIÓN (el arreglo del F5) ---
  //
  // La comprobación se hace contra la MARCA de sesión, no contra el token:
  // desde la Fase 4 el token vive en una cookie httpOnly y este código no puede
  // leerlo. La marca sólo dice "hay una sesión"; quien la valida de verdad es
  // el backend cuando `/auth/me` responde.
  //
  // Si la marca miente (alguien la falsificó, o caducó el refresh), `/auth/me`
  // devuelve 401, `fetchProfile` limpia y el flujo sigue hacia el login. La
  // marca no concede acceso a nada.
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchProfile()
  }

  // --- 2. EVITAR LOOPS EN EL LOGIN ---
  if (to.path === '/login') {
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  // --- 3. REGLA DE ORO: SIN SESIÓN, PARA AFUERA ---
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // --- 4. Validación de permisos (RBAC) ---
  const requiredPerm = to.meta.requiredPermission as string | undefined
  if (requiredPerm && !authStore.can(requiredPerm)) {
    // import.meta.client en vez de process.client: la forma moderna en Nuxt 4,
    // y la única que el bundler puede eliminar del build del servidor.
    if (import.meta.client) {
      toast.error('Acceso denegado: No tienes los permisos necesarios.')
    }
    return navigateTo('/')
  }
})
