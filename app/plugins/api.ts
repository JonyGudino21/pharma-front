import { defineNuxtPlugin, useRuntimeConfig, useCookie, navigateTo } from '#app'
import { useToast } from '~/composables/useToast'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const toast = useToast()

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl as string,
    
    // 1. ANTES de enviar la petición (Inyectar Token)
    onRequest({ options }) {
      // Usamos cookies para que funcione en SSR (Server-Side Rendering)
      const accessToken = useCookie('access_token').value
      
      if (accessToken) {
        // Usar la clase nativa Headers
        const headers = new Headers(options.headers)
        headers.set('Authorization', `Bearer ${accessToken}`)
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${accessToken}`)
        }
        
        options.headers = headers
      }
    },
    
    onRequestError({ error }) {
      toast.error('Error de red: No se pudo conectar al servidor')
    },
    
    // 2. Interceptar errores (Manejo del 401)
    async onResponseError({ response }) {
      // Caso A: No Autorizado (401)
      if (response.status === 401) {
        useCookie('access_token').value = null
        useCookie('refresh_token').value = null
        
        // Si el 401 ocurre MIENTRAS estamos en el login, es porque falló la contraseña/email
        if (window.location.pathname === '/login') {
          const backendMessage = response._data?.message || 'Credenciales incorrectas'
          toast.error(backendMessage)
        } else {
          // Si el 401 ocurre en cualquier otra pantalla, la sesión caducó
          toast.warning('Tu sesión ha expirado por seguridad. Vuelve a iniciar sesión.')
          navigateTo('/login')
        }
        return
      }

      // Caso B: Error interno del servidor (500+)
      if (response.status >= 500) {
        toast.error('El servidor está experimentando problemas. Intenta más tarde.')
        return
      }

      // Caso C: Errores de validacion o conflictos (400-499)
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