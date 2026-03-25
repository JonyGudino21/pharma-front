<template>
  <div class="space-y-6">
    
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:tag-bold" class="text-primary-600" />
          Categorías de Productos
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Clasificación para el catálogo y punto de venta.</p>
      </div>
      
      <button 
        v-if="authStore.can('canManageCategories')" 
        @click="openCreateModal" 
        class="btn-primary shrink-0"
      >
        <Icon name="ph:plus-bold" class="mr-2" /> Nueva Categoría
      </button>
    </div>

    <div class="flex flex-col md:flex-row gap-4">
      <div class="relative flex-1">
        <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          v-model="store.filters.query" 
          @input="handleSearch"
          type="text" 
          placeholder="Buscar categorías por nombre..." 
          class="input-base pl-10"
        />
      </div>
      <select v-model="store.filters.isActive" @change="store.fetchCategories(1)" class="input-base md:w-48 cursor-pointer">
        <option value="all">Todas las categorías</option>
        <option value="true">Solo Activas</option>
        <option value="false">Inactivas</option>
      </select>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
              <th v-if="authStore.can('canManageCategories')" class="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            
            <tr v-if="store.isLoading" class="animate-pulse">
              <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" />
                Cargando categorías...
              </td>
            </tr>

            <tr v-else-if="store.categories.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-gray-500">
                <Icon name="ph:tag-slash-duotone" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
                No se encontraron categorías.
              </td>
            </tr>

            <tr v-else v-for="category in store.categories" :key="category.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Icon name="ph:tag-bold" class="w-5 h-5" />
                  </div>
                  <span class="font-medium text-gray-900 dark:text-white">{{ category.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                {{ category.description || '-- Sin descripción --' }}
              </td>
              <td class="px-6 py-4">
                <span v-if="category.isActive" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400 border border-success-200 dark:border-success-800/30">
                  <span class="w-1.5 h-1.5 rounded-full bg-success-500 mr-1.5"></span> Activa
                </span>
                <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  <span class="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5"></span> Inactiva
                </span>
              </td>
              
              <td v-if="authStore.can('canManageCategories')" class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openEditModal(category)" class="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Editar">
                    <Icon name="ph:pencil-simple-bold" class="w-5 h-5" />
                  </button>
                  <button 
                    v-if="category.isActive"
                    @click="confirmDeactivate(category)" 
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
      
      <div v-if="store.categories.length > 0" class="px-6 pb-4 bg-white dark:bg-gray-800">
        <Pagination :pagination="store.pagination" @page-change="handlePageChange" />
      </div>
    </div>

    <CategoryFormModal v-if="showModal" :category-to-edit="selectedCategory" @close="closeModal" />
    
    <ConfirmModal
      v-if="categoryToDeactivate"
      title="Desactivar Categoría"
      :message="`¿Estás seguro que deseas desactivar '${categoryToDeactivate.name}'? Los productos ya asociados no se eliminarán, pero la categoría no aparecerá en el catálogo de ventas.`"
      confirmText="Desactivar"
      cancelText="Cancelar"
      type="warning"
      :isLoading="isDeactivating"
      @confirm="executeDeactivate"
      @cancel="categoryToDeactivate = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCategoryStore } from '~/stores/category'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import CategoryFormModal from '~/components/categories/CategoryFormModal.vue'
import Pagination from '~/components/shared/Pagination.vue'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'
import type { Category } from '~/stores/category'

// NO RESTRINGIMOS LA RUTA (El POS y los Cajeros necesitan ver las categorías).
// Las restricciones se manejan en el template con v-if="authStore.can('canManageCategories')"

const store = useCategoryStore()
const authStore = useAuthStore()
const toast = useToast()

const showModal = ref(false)
const selectedCategory = ref<Category | null>(null)
const categoryToDeactivate = ref<Category | null>(null)
const isDeactivating = ref(false)

let searchTimeout: any = null

onMounted(() => {
  store.fetchCategories()
})

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.fetchCategories(1) // Siempre volvemos a la pag 1 al buscar
  }, 1000)
}

const handlePageChange = (newPage: number) => {
  store.fetchCategories(newPage)
}

const openCreateModal = () => {
  selectedCategory.value = null
  showModal.value = true
}

const openEditModal = (category: Category) => {
  selectedCategory.value = category
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedCategory.value = null
}

const confirmDeactivate = (category: Category) => {
  categoryToDeactivate.value = category
}

const executeDeactivate = async () => {
  if (!categoryToDeactivate.value || isDeactivating.value) return
  isDeactivating.value = true

  try {
    await store.deactivateCategory(categoryToDeactivate.value.id)
    toast.success('Categoría desactivada correctamente.')
    categoryToDeactivate.value = null
  } catch (error) {
    console.error("Error", error)
  } finally {
    isDeactivating.value = false
  }
}
</script>