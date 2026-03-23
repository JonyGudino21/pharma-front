<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:shield-star-bold" class="text-primary-600" />
          Gestión de Usuarios
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Directorio de personal y control de accesos.</p>
      </div>
      <button @click="openCreateModal" class="btn-primary shrink-0">
        <Icon name="ph:plus-bold" class="mr-2" /> Nuevo Usuario
      </button>
    </div>

    <div class="flex flex-col md:flex-row gap-4">
      <div class="relative flex-1">
        <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          v-model="searchInput" 
          @input="handleSearch"
          type="text" 
          placeholder="Buscar por usuario o email..." 
          class="input-base pl-10"
        />
      </div>
      <select v-model="store.filters.isActive" @change="store.fetchUsers()" class="input-base md:w-48 cursor-pointer">
        <option value="">Todos los estados</option>
        <option value="true">Solo Activos</option>
        <option value="false">Inactivos (Baja)</option>
      </select>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contacto</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            
            <tr v-if="store.isLoading" class="animate-pulse">
              <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" />
                Cargando directorio...
              </td>
            </tr>

            <tr v-else-if="store.users.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                <Icon name="ph:users-slash-duotone" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                No se encontraron usuarios.
              </td>
            </tr>

            <tr v-else v-for="user in store.users" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                    {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ user.firstName }} {{ user.lastName }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">@{{ user.userName }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                {{ user.email }}
              </td>
              <td class="px-6 py-4">
                <span :class="getRoleBadgeClass(user.role)">
                  {{ getRoleName(user.role) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span v-if="user.isActive" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400 border border-success-200 dark:border-success-800/30">
                  <span class="w-1.5 h-1.5 rounded-full bg-success-500 mr-1.5"></span> Activo
                </span>
                <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  <span class="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5"></span> Inactivo
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openEditModal(user)" class="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Editar">
                    <Icon name="ph:pencil-simple-bold" class="w-5 h-5" />
                  </button>
                  <button 
                    v-if="user.isActive && user.id !== authStore.user?.id" 
                    @click="confirmDeactivate(user)" 
                    class="p-2 text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/30 rounded-lg transition-colors" 
                    title="Desactivar"
                  >
                    <Icon name="ph:trash-bold" class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
      
      <div v-if="store.pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/20">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Página {{ store.pagination.page }} de {{ store.pagination.totalPages }} ({{ store.pagination.total }} usuarios)
        </span>
        <div class="flex gap-2">
          <button @click="changePage(store.pagination.page - 1)" :disabled="store.pagination.page === 1" class="btn-secondary py-1 px-3 text-sm disabled:opacity-50">Anterior</button>
          <button @click="changePage(store.pagination.page + 1)" :disabled="store.pagination.page === store.pagination.totalPages" class="btn-secondary py-1 px-3 text-sm disabled:opacity-50">Siguiente</button>
        </div>
      </div>
    </div>

    <UserFormModal 
      v-if="showModal" 
      :user-to-edit="selectedUser" 
      @close="closeModal" 
    />

    <ConfirmModal
      v-if="userToDeactivate"
      title="Desactivar Usuario"
      :message="`¿Estás seguro que deseas desactivar a ${userToDeactivate.firstName}? Perderá inmediatamente el acceso al sistema.`"
      confirmText="Sí, Desactivar"
      cancelText="Cancelar"
      type="danger"
      :isLoading="isDeactivating"
      @confirm="executeDeactivate"
      @cancel="userToDeactivate = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserManagementStore } from '~/stores/userManagement'
import { useAuthStore } from '~/stores/auth'
import UserFormModal from '~/components/users/UserFormModal.vue'
import type { User } from '~/types/auth'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'
import { useToast } from '~/composables/useToast'

definePageMeta({
  requiredPermission: 'canManageUsers'
})

const store = useUserManagementStore()
const authStore = useAuthStore()
const toast = useToast()

// Estado local UI
const showModal = ref(false)
const selectedUser = ref<User | null>(null)
const searchInput = ref('')
const userToDeactivate = ref<User | null>(null)
const isDeactivating = ref(false)
let searchTimeout: any = null

onMounted(() => {
  store.fetchUsers()
})

// Debounce para no saturar el backend con cada tecla
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.filters.query = searchInput.value
    store.filters.page = 1 // Reset a página 1 al buscar
    store.fetchUsers()
  }, 1000) // Espera un segundo tras dejar de tecribir
}

const changePage = (newPage: number) => {
  store.filters.page = newPage
  store.fetchUsers()
}

// Lógica de Modales
const openCreateModal = () => {
  selectedUser.value = null
  showModal.value = true
}

const openEditModal = (user: User) => {
  selectedUser.value = user
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedUser.value = null
}

const confirmDeactivate = async (user: User) => {
  userToDeactivate.value = user
}

const executeDeactivate = async () => {
  if (!userToDeactivate.value || isDeactivating.value) return
  isDeactivating.value = true

  try {
    await store.deactivateUser(userToDeactivate.value.id)
    toast.success('Usuario desactivado correctamente.')
    userToDeactivate.value = null // Cerramos el modal
  } catch (error) {
    console.error("Error al desactivar", error)
  } finally {
    isDeactivating.value = false
  }
}

// Helpers visuales para Badges
const getRoleName = (role: string) => {
  const roles: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    PHARMACIST: 'Farmacéutico',
    CASHIER: 'Cajero'
  }
  return roles[role] || role
}

const getRoleBadgeClass = (role: string) => {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
  switch (role) {
    case 'ADMIN': return `${base} bg-error-50 text-error-700 border-error-200 dark:bg-error-900/30 dark:text-error-400 dark:border-error-800/30`
    case 'MANAGER': return `${base} bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800/30`
    case 'PHARMACIST': return `${base} bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/30`
    case 'CASHIER': return `${base} bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30`
    default: return `${base} bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`
  }
}
</script>