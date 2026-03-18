import { defineNuxtPlugin, useRuntimeConfig, useCookie, navigateTo } from '#app'
import { useToast } from '~/composables/useToast'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const toast = useToast()

  const api = $fetch.create({
    baseURL: config.public.NUXT_PUBLIC_API_BASE_URL as string,
    
    // 1. ANTES de enviar la petición (Inyectar Token)
    onRequest({ options }) {
      // Usamos cookies para que funcione en SSR (Server-Side Rendering)
      const accessToken = useCookie('access_token').value
      
      if (accessToken) {
        // Usar la clase nativa Headers
        const headers = new Headers(options.headers)
        headers.set('Authorization', `Bearer ${accessToken}`)
        options.headers = headers
      }
    },
    
    onRequestError({ error }) {
      toast.error('Error de red: No se pudo conectar al servidor')
    },
    
    // 2. Interceptar errores (Manejo del 401)
    async onResponseError({ response }) {
      if (response.status === 401) {
        // Aquí detectamos que el token murió. 
        // Para evitar dependencias circulares complejas, limpiamos y mandamos al login.
        // (La renovación del Refresh Token la haremos explícita si es necesario)
        useCookie('access_token').value = null
        useCookie('refresh_token').value = null
        
        // Evitar loop infinito si ya estamos en /login
        if (window.location.pathname !== '/login') {
          toast.warning('Tu sesión ha expirado por seguridad. Vuelve a iniciar sesión.')
          navigateTo('/login')
        }
        return
      }

      // Error interno del servidor (500+)
      if (response.status >= 500) {
        toast.error('El servidor está experimentando problemas. Intenta más tarde.')
        return
      }

      // Errores de validacion o conflictos (400-499)
      if (response.status === 400 || response.status === 409) {
        // Leemos el mensaje exacto que manda tu backend
        const backendMessage = response._data?.message || 'Verifica los datos ingresados.'
        toast.error(backendMessage)
      }
    }
  })

  // Exponemos la instancia $api a toda la aplicación
  return {
    provide: {
      api
    }
  }
})