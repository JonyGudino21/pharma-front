import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const toast = useToast()

  // 1. Evitar loops infinitos: Si vamos al login, no hacemos nada más
  if (to.path === '/login') {
    // Si ya estamos logueados y queremos entrar al login, nos manda al inicio
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  // 2. Regla de Oro: Si la ruta NO es /login y NO estamos logueados, para afuera.
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // --- MAGIA ENTERPRISE: Validación de Permisos (RBAC) ---
  const requiredPerm = to.meta.requiredPermission as string | undefined
  if (requiredPerm && !authStore.can(requiredPerm)) {
    // Si en pleno SSR (servidor) no hay toast, evitamos que truene
    if (process.client) {
      toast.error('Acceso denegado: No tienes los permisos necesarios.')
    }
    return navigateTo('/')
  }
})