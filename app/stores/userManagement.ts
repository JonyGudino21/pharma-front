import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import type { User, PaginatedData, ApiResponse } from '~/types/auth'

export const useUserManagementStore = defineStore('userManagement', () => {
  const users = ref<User[]>([])
  const pagination = ref({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const isLoading = ref(false)

  // Filtros activos
  const filters = ref({
    query: '', // Para userName o email
    isActive: 'true', // 'true', 'false' o '' (todos)
    page: 1
  })

  async function fetchUsers() {
    const { $api } = useNuxtApp()
    isLoading.value = true

    try {
      const params = new URLSearchParams()
      params.append('page', filters.value.page.toString())
      params.append('limit', pagination.value.limit.toString())
      
      if (filters.value.isActive !== '') {
        params.append('active', filters.value.isActive)
      }

      let endpoint = '/users'

      // Si hay texto de búsqueda, cambiamos al endpoint de search
      if (filters.value.query.trim()) {
        endpoint = '/users/search'
        params.append('email', filters.value.query)
        params.append('userName', filters.value.query) // El backend hace el OR
      }

      const res = await $api<ApiResponse<PaginatedData<User>>>(`${endpoint}?${params.toString()}`)
      
      // Tu backend podría devolver el array en res.data.users o res.data.data
      users.value = res.data.users || res.data.data || []
      if (res.data.pagination) {
        pagination.value = res.data.pagination
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function createUser(payload: any) {
    const { $api } = useNuxtApp()
    // No atrapamos el error aquí para que el Modal no se cierre si hay un 409 (Duplicado)
    await $api('/users', { method: 'POST', body: payload })
    await fetchUsers() // Recargamos la tabla
  }

  async function updateUser(id: number, payload: any) {
    const { $api } = useNuxtApp()
    // Limpiamos el password si viene vacío para no mandarlo
    const dataToSend = { ...payload }
    if (!dataToSend.password) delete dataToSend.password

    await $api(`/users/${id}`, { method: 'PATCH', body: dataToSend })
    await fetchUsers()
  }

  async function deactivateUser(id: number) {
    const { $api } = useNuxtApp()
    await $api(`/users/${id}`, { method: 'DELETE' })
    await fetchUsers()
  }

  return {
    users,
    pagination,
    isLoading,
    filters,
    fetchUsers,
    createUser,
    updateUser,
    deactivateUser
  }
})