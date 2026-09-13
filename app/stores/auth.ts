import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCookie, useNuxtApp } from '#app'
import type { User, UserPermissions, ApiResponse, LoginData, MeData } from '~/types/auth'

/**
 * Convierte la caducidad absoluta que envía el backend en el `maxAge` que
 * espera la cookie.
 *
 * Con respaldo por si un backend antiguo no devuelve el campo: sin él la cookie
 * se volvería de sesión y el cajero perdería el "recordarme" al cerrar el
 * navegador.
 */
function maxAgeDesde(refreshExpiresAt?: string, rememberMe?: boolean): number {
  const porDefecto = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24

  if (!refreshExpiresAt) return porDefecto

  const restante = Math.floor(
    (new Date(refreshExpiresAt).getTime() - Date.now()) / 1000,
  )
  // Un valor absurdo (reloj del cliente desfasado, fecha inválida) no debe
  // producir una cookie ya caducada que expulse al usuario al instante.
  return Number.isFinite(restante) && restante > 60 ? restante : porDefecto
}

export const useAuthStore = defineStore('auth', () => {
  // === ESTADO (State) ===
  const user = ref<User | null>(null)
  const permissions = ref<UserPermissions>({} as UserPermissions)
  
  // Leemos cookies directamente (SSR Friendly)
  const accessToken = useCookie<string | null>('access_token')
  const refreshToken = useCookie<string | null>('refresh_token')

  // === GETTERS (Computed) ===
  const isAuthenticated = computed(() => !!accessToken.value)
  const can = computed(() => (permission: string) => !!permissions.value[permission])
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  // === ACCIONES (Actions) ===
  async function login(credentials: any) {
    const { $api } = useNuxtApp()
    
    // Llamamos al backend. A la interfaz ApiResponse<LoginData>
    const res = await $api<ApiResponse<LoginData>>('/auth/login', {
      method: 'POST',
      body: credentials
    })

    // DURACIÓN DERIVADA DEL BACKEND, no calculada aquí.
    //
    // Antes el front replicaba la regla (7 días con "recordarme", 1 día sin
    // ella). Dos copias de la misma decisión en dos repos distintos: cambiar
    // JWT_REFRESH_DAYS_DEFAULT en el servidor no movía la cookie, y quedaba una
    // cookie viva apuntando a un token ya expirado en la base — 401 en bucle sin
    // explicación. Ahora el backend devuelve `refreshExpiresAt` y la cookie
    // caduca exactamente con la fila de UserToken.
    const maxAge = maxAgeDesde(res.data.refreshExpiresAt, credentials.rememberMe)

    const opciones = { maxAge, sameSite: 'lax' as const }
    const accCookie = useCookie('access_token', opciones)
    const refCookie = useCookie('refresh_token', opciones)

    // Guardamos tokens
    accCookie.value = res.data.accessToken
    refCookie.value = res.data.refreshToken

    // Actualizar el estado reactivo del store inmediatamente
    accessToken.value = res.data.accessToken
    refreshToken.value = res.data.refreshToken
    
    // Obtenemos el perfil completo (incluye permisos)
    await fetchProfile(res.data.accessToken)
    
    return res
  }

  async function fetchProfile(freshToken?: string) {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<MeData>>('/auth/me', {
        headers: freshToken ? { Authorization: `Bearer ${freshToken}` } : undefined
      })
      user.value = res.data.user
      permissions.value = res.data.permissions
    } catch (error) {
      clearSession()
    }
  }

  async function logout() {
    const { $api } = useNuxtApp()
    try {
      if (refreshToken.value) {
        await $api('/auth/logout', { 
          method: 'POST', 
          body: { refreshToken: refreshToken.value } 
        })
      }
    } catch (error) {
      console.error('Error al cerrar sesión', error)
    } finally {
      clearSession()
    }
  }

  function clearSession() {
    user.value = null
    permissions.value = {} as UserPermissions
    useCookie('access_token').value = null
    useCookie('refresh_token').value = null
  }

  return {
    user,
    permissions,
    accessToken,
    isAuthenticated,
    can,
    isAdmin,
    login,
    logout,
    fetchProfile,
    clearSession
  }
})