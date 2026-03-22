import { defineNuxtRouteMiddleware, navigateTo, useCookie } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const toast = useToast()
  const accessToken = useCookie('access_token').value

  // --- 1. RESTAURACIÓN DE SESIÓN (El FIX para el F5) ---
  // Si hay cookie pero Pinia está vacío (porque dimos F5), detenemos todo y recuperamos el usuario
  if (accessToken && !authStore.user) {
    try {
      await authStore.fetchProfile(accessToken)
    } catch (error) {
      // Si el token ya no sirve, limpiamos y dejamos que el flujo siga (lo mandará al login)
      authStore.clearSession()
    }
  }

  // --- 2. EVITAR LOOPS EN EL LOGIN ---
  if (to.path === '/login') {
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  // --- 3. REGLA DE ORO: SIN TOKEN, PARA AFUERA ---
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // --- 4. MAGIA ENTERPRISE: Validación de Permisos (RBAC) ---
  const requiredPerm = to.meta.requiredPermission as string | undefined
  if (requiredPerm && !authStore.can(requiredPerm)) {
    if (process.client) {
      toast.error('Acceso denegado: No tienes los permisos necesarios.')
    }
    return navigateTo('/')
  }
})