import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCookie, useNuxtApp } from '#app'
import type { User, UserPermissions, ApiResponse, LoginData, MeData } from '~/types/auth'

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

    // Configuramos duración de cookies (Recordar sesión)
    const maxAge = credentials.rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24 // 7 días o 1 dia
    
    const accCookie = useCookie('access_token', { maxAge, sameSite: 'lax' })
    const refCookie = useCookie('refresh_token', { maxAge, sameSite: 'lax' })
    
    // Guardamos tokens
    accCookie.value = res.data.accessToken
    refCookie.value = res.data.refreshToken
    
    // Obtenemos el perfil completo (incluye permisos)
    await fetchProfile()
    
    return res
  }

  async function fetchProfile() {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<MeData>>('/auth/me')
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