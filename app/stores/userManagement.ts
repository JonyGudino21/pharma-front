import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { User, PaginatedData, ApiResponse, UserPermissions, UserRole } from '~/types/auth'
import { describirFallo, type FalloPeticion } from '~/composables/useRequestState'

/** Usuario tal como lo lista administración: con el resumen de sesiones. */
export interface ManagedUser extends User {
  createdAt?: string
  sessions?: {
    /** Sesiones vigentes (dispositivos con la sesión abierta). */
    active: number
    lastSeenAt: string | null
  }
}

export interface UserCreatePayload {
  firstName: string
  lastName: string
  userName: string
  email: string
  role: UserRole
  password: string
}

export type UserUpdatePayload = Partial<Omit<UserCreatePayload, 'password'>> & {
  password?: string
  isActive?: boolean
}

export interface RolePermissions {
  role: UserRole
  permissions: UserPermissions
}

export const useUserManagementStore = defineStore('userManagement', () => {
  const users = ref<ManagedUser[]>([])
  const pagination = ref({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const isLoading = ref(false)
  /** Fallo de carga, distinto de "no hay usuarios". */
  const loadError = ref<FalloPeticion | null>(null)

  const filters = ref({
    query: '', // userName o email
    isActive: 'true', // 'true', 'false' o '' (todos)
    page: 1,
  })

  const rolesMatrix = ref<RolePermissions[] | null>(null)

  async function fetchUsers() {
    const { $api } = useNuxtApp()
    isLoading.value = true
    loadError.value = null

    try {
      const params = new URLSearchParams()
      params.append('page', filters.value.page.toString())
      params.append('limit', pagination.value.limit.toString())

      let endpoint = '/users'
      const q = filters.value.query.trim()
      if (q) {
        // El endpoint de búsqueda nombra el filtro `isActive`; el de lista, `active`.
        endpoint = '/users/search'
        params.append('email', q)
        params.append('userName', q) // el backend hace el OR
        if (filters.value.isActive !== '') params.append('isActive', filters.value.isActive)
      } else if (filters.value.isActive !== '') {
        params.append('active', filters.value.isActive)
      }

      const res = await $api<ApiResponse<PaginatedData<ManagedUser>>>(`${endpoint}?${params.toString()}`)
      users.value = res.data.users || res.data.data || []
      if (res.data.pagination) pagination.value = res.data.pagination
    } catch (error) {
      loadError.value = describirFallo(error)
    } finally {
      isLoading.value = false
    }
  }

  // Los errores NO se atrapan aquí: el modal debe seguir abierto si hay un 409
  // (usuario o correo duplicado) y el interceptor ya muestra el mensaje.
  async function createUser(payload: UserCreatePayload) {
    const { $api } = useNuxtApp()
    await $api('/users', { method: 'POST', body: payload })
    await fetchUsers()
  }

  async function updateUser(id: number, payload: UserUpdatePayload) {
    const { $api } = useNuxtApp()
    const body = { ...payload }
    if (!body.password) delete body.password // vacío = conservar la actual
    await $api(`/users/${id}`, { method: 'PATCH', body })
    await fetchUsers()
  }

  async function deactivateUser(id: number) {
    const { $api } = useNuxtApp()
    await $api(`/users/${id}`, { method: 'DELETE' })
    await fetchUsers()
  }

  async function reactivateUser(id: number) {
    await updateUser(id, { isActive: true })
  }

  /** Cierra todas las sesiones del usuario. Devuelve cuántas cerró. */
  async function revokeSessions(id: number): Promise<number> {
    const { $api } = useNuxtApp()
    const res = await $api<ApiResponse<{ revoked: number }>>(`/users/${id}/revoke-sessions`, {
      method: 'POST',
      body: {},
    })
    await fetchUsers()
    return res.data.revoked
  }

  async function fetchRolesMatrix(): Promise<RolePermissions[]> {
    if (rolesMatrix.value) return rolesMatrix.value
    const { $api } = useNuxtApp()
    const res = await $api<ApiResponse<RolePermissions[]>>('/users/roles')
    rolesMatrix.value = res.data
    return res.data
  }

  return {
    users,
    pagination,
    isLoading,
    loadError,
    filters,
    rolesMatrix,
    fetchUsers,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    revokeSessions,
    fetchRolesMatrix,
  }
})
