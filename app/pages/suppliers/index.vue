<template>
  <div class="space-y-6">
    <div class="page-header">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:buildings-bold" class="text-primary-600 shrink-0" /> Directorio de Proveedores
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona contactos y cuentas por pagar.</p>
      </div>
      <div v-if="authStore.can('canManageSuppliers')" class="page-actions">
        <button @click="openCreateModal" class="btn-primary">
          <Icon name="ph:plus-bold" class="mr-2" /> Nuevo Proveedor
        </button>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-3 md:gap-4">
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
      <!-- Estados (una sola vez para tabla y tarjetas) -->
      <div v-if="store.isLoading" class="px-6 py-8 text-center text-gray-500">
        <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" /> Cargando proveedores...
      </div>
      <div v-else-if="store.suppliers.length === 0" class="px-6 py-12 text-center text-gray-500">
        <span class="flex flex-col sm:flex-row gap-2 items-center justify-center w-full">
          <Icon name="ph:buildings-duotone" class="w-8 h-8 text-gray-400" />
          <span>No se encontraron proveedores.</span>
        </span>
      </div>

      <template v-else>
      <!-- Laptop y tableta: tabla -->
      <div class="table-wrap hidden @4xl:block">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Proveedor</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contacto</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Crédito</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Deuda Actual</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Estado</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="sup in store.suppliers" :key="sup.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td class="px-6 py-4">
                <p class="font-bold text-gray-900 dark:text-white">{{ sup.name }}</p>
                <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span v-if="sup.email"><Icon name="ph:envelope-simple" class="inline" /> {{ sup.email }}</span>
                  <span v-if="sup.phone"><Icon name="ph:phone" class="inline" /> {{ sup.phone }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{{ sup.contact || '-' }}</td>
              <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-xs font-bold">
                  {{ sup.creditDays }} días
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <p class="font-black" :class="Number(sup.balance) > 0 ? 'text-error-600 dark:text-error-400' : 'text-gray-900 dark:text-white'">
                  {{ formatCurrency(Number(sup.balance)) }}
                </p>
                <p v-if="sup._count?.purchases" class="text-[10px] text-error-500 dark:text-error-400 font-bold mt-1 uppercase">
                  {{ sup._count.purchases }} facturas pdtes.
                </p>
              </td>
              <td class="px-6 py-4 text-center">
                <span v-if="sup.isActive" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">Activo</span>
                <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Inactivo</span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openStatement(sup)" class="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg" title="Estado de Cuenta">
                    <Icon name="ph:receipt-bold" class="w-5 h-5" />
                  </button>
                  <button @click="openEditModal(sup)" class="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 rounded-lg" title="Editar">
                    <Icon name="ph:pencil-simple-bold" class="w-5 h-5" />
                  </button>
                  <button v-if="sup.isActive" @click="confirmDeactivate(sup)" class="p-2 text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/30 rounded-lg" title="Desactivar">
                    <Icon name="ph:trash-bold" class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Celular: tarjetas -->
      <ul class="card-list @4xl:hidden" data-testid="suppliers-cards">
        <li v-for="sup in store.suppliers" :key="sup.id" class="px-4 py-3">
          <div class="card-row">
            <p class="min-w-0 truncate font-bold text-gray-900 dark:text-white">{{ sup.name }}</p>
            <p class="shrink-0 font-black tabular-nums" :class="Number(sup.balance) > 0 ? 'text-error-600 dark:text-error-400' : 'text-gray-900 dark:text-white'">
              {{ formatCurrency(Number(sup.balance)) }}
            </p>
          </div>
          <div class="card-row mt-0.5">
            <p class="card-label min-w-0 truncate">{{ sup.contact || sup.phone || sup.email || 'Sin datos de contacto' }}</p>
            <p class="shrink-0 text-xs text-gray-500 dark:text-gray-400">Crédito {{ sup.creditDays }} días</p>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span v-if="sup.isActive" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">Activo</span>
            <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Inactivo</span>
            <span v-if="sup._count?.purchases" class="text-[11px] font-bold uppercase text-error-500 dark:text-error-400">{{ sup._count.purchases }} facturas pdtes.</span>
            <div class="ml-auto flex gap-1">
              <button @click="openStatement(sup)" class="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg" title="Estado de Cuenta" aria-label="Estado de Cuenta">
                <Icon name="ph:receipt-bold" class="w-5 h-5" />
              </button>
              <button @click="openEditModal(sup)" class="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 rounded-lg" title="Editar" aria-label="Editar">
                <Icon name="ph:pencil-simple-bold" class="w-5 h-5" />
              </button>
              <button v-if="sup.isActive" @click="confirmDeactivate(sup)" class="p-2 text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/30 rounded-lg" title="Desactivar" aria-label="Desactivar">
                <Icon name="ph:trash-bold" class="w-5 h-5" />
              </button>
            </div>
          </div>
        </li>
      </ul>
      </template>

      <div v-if="store.suppliers.length > 0" class="px-3 sm:px-6 pb-4 bg-white dark:bg-gray-800">
        <Pagination :pagination="store.pagination" @page-change="handlePageChange" />
      </div>
    </div>

    <SupplierFormModal v-if="showModal" :supplier-to-edit="selectedSupplier" @close="closeModal" />
    <AccountStatementModal v-model="showStatementModal" :supplier="selectedSupplier" />
    
    <ConfirmModal
      v-if="supplierToDeactivate"
      title="Desactivar Proveedor"
      :message="`¿Estás seguro de desactivar a '${supplierToDeactivate.name}'?`"
      confirmText="Desactivar"
      cancelText="Cancelar"
      type="warning"
      :isLoading="isDeactivating"
      @confirm="executeDeactivate"
      @cancel="supplierToDeactivate = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupplierStore } from '~/stores/supplier'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useToast } from '~/composables/useToast'
import SupplierFormModal from '~/components/suppliers/SupplierFormModal.vue'
import AccountStatementModal from '~/components/suppliers/AccountStatementModal.vue'
import Pagination from '~/components/shared/Pagination.vue'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'
import type { Supplier } from '~/stores/supplier'

definePageMeta({ requiredPermission: 'canManageSuppliers' })

const store = useSupplierStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const toast = useToast()

const showModal = ref(false)
const showStatementModal = ref(false)
const selectedSupplier = ref<Supplier | null>(null)
const supplierToDeactivate = ref<Supplier | null>(null)
const isDeactivating = ref(false)
let searchTimeout: any = null

onMounted(() => { executeFetch(1) })

// Decide inteligentemente si llama al endpoint de search o al de listar todos
const executeFetch = (page: number) => {
  if (store.filters.query.trim().length > 0) {
    store.searchSuppliers(page)
  } else {
    store.fetchSuppliers(page)
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    executeFetch(1)
  }, 500)
}

const handlePageChange = (newPage: number) => executeFetch(newPage)

const openCreateModal = () => { selectedSupplier.value = null; showModal.value = true }
const openEditModal = (sup: Supplier) => { selectedSupplier.value = sup; showModal.value = true }
const openStatement = (sup: Supplier) => { selectedSupplier.value = sup; showStatementModal.value = true }
const closeModal = () => { showModal.value = false; selectedSupplier.value = null }

const confirmDeactivate = (sup: Supplier) => {
  supplierToDeactivate.value = sup
}

const executeDeactivate = async () => {
  if (!supplierToDeactivate.value) return
  isDeactivating.value = true
  try {
    // Si tiene deuda, tu backend arroja 400 y el Interceptor muestra el Toast.
    // Nosotros atrapamos el error para no decir "Éxito" erróneamente.
    await store.deactivateSupplier(supplierToDeactivate.value.id)
    toast.success('Proveedor desactivado correctamente.')
    supplierToDeactivate.value = null
  } catch (error) {
    console.error("Fallo la regla financiera al desactivar")
  } finally {
    isDeactivating.value = false
  }
}
</script>