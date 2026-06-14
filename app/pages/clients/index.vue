<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:users-three-bold" class="text-primary-600" /> Directorio de Clientes
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">CRM, historial de ventas y cuentas por cobrar.</p>
      </div>
      
      <div class="flex gap-2">
        <NuxtLink v-if="authStore.can('canViewDebtors')" to="/clients/debtors" class="btn-secondary">
          <Icon name="ph:warning-circle-bold" class="text-warning-600 mr-2" /> Ver Deudores
        </NuxtLink>
        <button v-if="authStore.can('canCreateClient')" @click="openCreateModal" class="btn-primary shrink-0">
          <Icon name="ph:user-plus-bold" class="mr-2" /> Nuevo Cliente
        </button>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="relative flex-1">
        <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          v-model="store.filters.query" 
          @input="handleSearch"
          type="text" 
          placeholder="Buscar por nombre, email o teléfono..." 
          class="input-base pl-10"
        />
      </div>
      <select v-model="store.filters.isActive" @change="executeFetch(1)" class="input-base md:w-48 cursor-pointer">
        <option value="all">Todos los estados</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contacto</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Crédito</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Deuda Actual</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Estado</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-if="store.isLoading" class="animate-pulse">
              <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" /> Cargando clientes...
              </td>
            </tr>
            <tr v-else-if="store.clients.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                <Icon name="ph:users-slash-duotone" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                No se encontraron clientes.
              </td>
            </tr>
            <tr v-else v-for="client in store.clients" :key="client.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-6 py-4">
                <p class="font-bold text-gray-900 dark:text-white">{{ client.name }}</p>
                <p v-if="client.rfc" class="text-xs text-gray-500 font-mono mt-0.5">RFC: {{ client.rfc }}</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                <div v-if="client.email" class="flex items-center gap-1"><Icon name="ph:envelope-simple" class="text-gray-400" /> {{ client.email }}</div>
                <div v-if="client.phone" class="flex items-center gap-1 mt-1"><Icon name="ph:phone" class="text-gray-400" /> {{ client.phone }}</div>
                <span v-if="!client.email && !client.phone" class="text-gray-400 italic">Sin datos</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span v-if="client.hasCredit" class="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-bold border border-blue-100 dark:border-blue-800">
                  Límite: {{ formatCurrency(Number(client.creditLimit)) }}
                </span>
                <span v-else class="text-xs text-gray-400 font-medium">Contado</span>
              </td>
              <td class="px-6 py-4 text-right">
                <p class="font-black" :class="Number(client.currentDebt) > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-gray-900 dark:text-white'">
                  {{ formatCurrency(Number(client.currentDebt)) }}
                </p>
                <p v-if="client._count?.sales" class="text-[10px] text-gray-500 mt-1 uppercase font-bold">{{ client._count.sales }} ventas históricas</p>
              </td>
              <td class="px-6 py-4 text-center">
                <span v-if="client.isActive" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">Activo</span>
                <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Inactivo</span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <NuxtLink v-if="authStore.can('canViewAccountStatement')" :to="`/clients/${client.id}`" class="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg" title="Estado de Cuenta y Perfil">
                    <Icon name="ph:receipt-bold" class="w-5 h-5" />
                  </NuxtLink>
                  <button v-if="authStore.can('canEditClient')" @click="openEditModal(client)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Editar">
                    <Icon name="ph:pencil-simple-bold" class="w-5 h-5" />
                  </button>
                  <button v-if="client.isActive && authStore.can('canDeleteClient')" @click="confirmDeactivate(client)" class="p-2 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/30 rounded-lg" title="Desactivar">
                    <Icon name="ph:trash-bold" class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="store.clients.length > 0" class="px-6 pb-4 bg-white dark:bg-gray-800">
        <Pagination :pagination="store.pagination" @page-change="handlePageChange" />
      </div>
    </div>

    <ClientFormModal v-model="showModal" :client-to-edit="selectedClient" />
    
    <ConfirmModal
      v-if="clientToDeactivate"
      title="Desactivar Cliente"
      :message="`¿Estás seguro de desactivar a '${clientToDeactivate.name}'? Se conservará su historial, pero no podrá hacer nuevas compras a crédito.`"
      confirmText="Desactivar"
      cancelText="Cancelar"
      type="warning"
      :isLoading="store.isActionLoading"
      @confirm="executeDeactivate"
      @cancel="clientToDeactivate = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useClientStore } from '~/stores/client'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'
import ClientFormModal from '~/components/clients/ClientFormModal.vue'
import Pagination from '~/components/shared/Pagination.vue'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'
import type { Client } from '~/stores/client'

// Todo el que entra aquí debe tener permiso general
definePageMeta({ requiredPermission: 'canViewClients' })

const store = useClientStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const showModal = ref(false)
const selectedClient = ref<Client | null>(null)
const clientToDeactivate = ref<Client | null>(null)
let searchTimeout: any = null

onMounted(() => { executeFetch(1) })

// Decide inteligentemente si llama al endpoint de search o al de listar todos
const executeFetch = (page: number) => {
  if (store.filters.query.trim().length > 0) {
    store.searchClients(page)
  } else {
    store.fetchClients(page)
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    executeFetch(1) // Vuelve a la pag 1 cuando busca
  }, 500)
}

const handlePageChange = (newPage: number) => executeFetch(newPage)

const openCreateModal = () => { selectedClient.value = null; showModal.value = true }
const openEditModal = (client: Client) => { selectedClient.value = client; showModal.value = true }

const confirmDeactivate = (client: Client) => {
  clientToDeactivate.value = client
}

const executeDeactivate = async () => {
  if (!clientToDeactivate.value) return
  try {
    await store.deactivateClient(clientToDeactivate.value.id)
    toast.success('Cliente desactivado correctamente.')
    clientToDeactivate.value = null
  } catch (error) {
    console.error("Falló al desactivar")
  }
}
</script>