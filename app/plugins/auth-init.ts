import { defineNuxtPlugin, useCookie } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  const accessToken = useCookie('access_token').value

  // Si hay un token en las cookies pero la memoria está vacía (ej. recargó la página)
  if (accessToken && !authStore.user) {
    try {
      // Restauramos el perfil y los permisos desde el backend
      await authStore.fetchProfile(accessToken)
    } catch (error) {
      // Si falla (ej. token inválido), limpiamos para que el middleware haga su trabajo
      authStore.clearSession()
    }
  }
})