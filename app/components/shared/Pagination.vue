<template>
  <div class="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4 mt-4 gap-4">
    <div class="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
      Mostrando página
      <span class="font-semibold text-gray-900 dark:text-white">{{ pagination.page }}</span>
      de
      <span class="font-semibold text-gray-900 dark:text-white">{{ pagination.totalPages }}</span>
      <span class="mx-1">•</span>
      <span class="font-semibold text-gray-900 dark:text-white">{{ pagination.total }}</span> registros en total
    </div>

    <div class="flex items-center gap-1 sm:gap-2">
      <button
        @click="goToPage(1)"
        :disabled="pagination.page === 1"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-400"
        title="Primera página"
      >
        <Icon name="ph:caret-double-left-bold" class="w-5 h-5" />
      </button>

      <button
        @click="goToPage(pagination.page - 1)"
        :disabled="pagination.page === 1"
        class="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
      >
        Anterior
      </button>

      <div class="hidden sm:flex items-center gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'w-10 h-10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center',
            page === pagination.page
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
          ]"
        >
          {{ page }}
        </button>
      </div>

      <button
        @click="goToPage(pagination.page + 1)"
        :disabled="pagination.page >= pagination.totalPages"
        class="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
      >
        Siguiente
      </button>

      <button
        @click="goToPage(pagination.totalPages)"
        :disabled="pagination.page >= pagination.totalPages"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-400"
        title="Última página"
      >
        <Icon name="ph:caret-double-right-bold" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

const props = defineProps<{
  pagination: PaginationData
}>()

const emit = defineEmits<{
  'page-change': [page: number]
}>()

// Lógica inteligente para mostrar un máximo de 5 botones de página
const visiblePages = computed(() => {
  const pages: number[] = []
  const { page: current, totalPages: total } = props.pagination
  
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i)
    } else if (current >= total - 2) {
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      for (let i = current - 2; i <= current + 2; i++) pages.push(i)
    }
  }
  return pages
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.pagination.totalPages && page !== props.pagination.page) {
    emit('page-change', page)
  }
}
</script>