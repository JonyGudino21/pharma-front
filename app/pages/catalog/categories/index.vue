<template>
  <div class="space-y-6">

    <div class="page-header">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:tag-bold" class="text-primary-600" />
          Categorías de Productos
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Clasificación para el catálogo y punto de venta.</p>
      </div>

      <div v-if="authStore.can('canManageCategories')" class="page-actions">
        <button
          @click="openCreateModal"
          class="btn-primary"
        >
          <Icon name="ph:plus-bold" class="mr-2" /> Nueva Categoría
        </button>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-3 md:gap-4">
      <div class="relative flex-1">
        <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="store.filters.query"
          @input="handleSearch"
          type="search"
          placeholder="Buscar categorías por nombre..."
          aria-label="Buscar categoría por nombre"
          class="input-base pl-10"
        />
      </div>
      <select v-model="store.filters.isActive" @change="store.fetchCategories(1)" aria-label="Estado de la categoría" class="input-base md:w-48 cursor-pointer">
        <option value="all">Todas las categorías</option>
        <option value="true">Solo Activas</option>
        <option value="false">Inactivas</option>
      </select>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <!-- Estados (una sola vez para tabla y tarjetas) -->
      <div v-if="store.isLoading" class="px-6 py-8 text-center text-gray-500">
        <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" />
        Cargando categorías...
      </div>

      <div v-else-if="store.listError" class="px-6 py-12 text-center">
        <span class="flex flex-col gap-2 items-center justify-center w-full">
          <Icon name="ph:cloud-slash-fill" class="w-10 h-10 text-error-500" />
          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.listError.mensaje }}</span>
          <span class="text-xs text-gray-500 max-w-md">Esto no significa que no haya categorías: no pudimos consultarlas.</span>
          <button v-if="store.listError.reintentable" type="button" class="btn-primary mt-1" @click="store.retryList()">
            <Icon name="ph:arrow-clockwise-bold" class="mr-2" /> Reintentar
          </button>
        </span>
      </div>

      <div v-else-if="store.categories.length === 0" class="px-6 py-12 text-center text-gray-500">
        <Icon name="ph:tag-slash-duotone" class="w-12 h-12 mx-auto mb-3 text-gray-400" />
        No se encontraron categorías.
      </div>

      <template v-else>
        <!-- Laptop y tableta: tabla -->
        <div class="table-wrap hidden @4xl:block">
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
              <tr v-for="category in store.categories" :key="category.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
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
                  <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                    <span class="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5"></span> Inactiva
                  </span>
                </td>

                <td v-if="authStore.can('canManageCategories')" class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <button @click="openEditModal(category)" class="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Editar" :aria-label="`Editar ${category.name}`">
                      <Icon name="ph:pencil-simple-bold" class="w-5 h-5" />
                    </button>
                    <!-- Desactivar NO borra: la categoría deja de mostrarse y puede reactivarse. -->
                    <button
                      v-if="category.isActive"
                      @click="confirmDeactivate(category)"
                      class="p-2 text-warning-600 hover:bg-warning-50 dark:text-warning-400 dark:hover:bg-warning-900/30 rounded-lg transition-colors"
                      title="Desactivar"
                      :aria-label="`Desactivar ${category.name}`"
                    >
                      <Icon name="ph:prohibit-bold" class="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Celular: tarjetas -->
        <ul class="card-list @4xl:hidden" data-testid="categories-cards">
          <li v-for="category in store.categories" :key="category.id" class="px-4 py-3">
            <div class="card-row">
              <p class="min-w-0 truncate font-bold text-gray-900 dark:text-white">{{ category.name }}</p>
              <span v-if="category.isActive" class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">Activa</span>
              <span v-else class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Inactiva</span>
            </div>
            <p class="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{{ category.description || 'Sin descripción' }}</p>
            <div v-if="authStore.can('canManageCategories')" class="mt-3 flex gap-2">
              <button type="button" class="btn-secondary flex-1" @click="openEditModal(category)">
                <Icon name="ph:pencil-simple-bold" class="mr-2" /> Editar
              </button>
              <button v-if="category.isActive" type="button" class="btn-secondary flex-1 text-warning-700 dark:text-warning-400" @click="confirmDeactivate(category)">
                <Icon name="ph:prohibit-bold" class="mr-2" /> Desactivar
              </button>
            </div>
          </li>
        </ul>
      </template>

      <div v-if="store.categories.length > 0 && !store.listError" class="px-3 pb-4 sm:px-6 bg-white dark:bg-gray-800">
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