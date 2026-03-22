import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

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

  // (Aquí en el futuro validaremos los permisos canSell, canManageUsers, etc.)
})