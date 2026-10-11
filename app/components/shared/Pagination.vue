<template>
  <div class="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4 mt-4 gap-3 sm:gap-4">
    <div class="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
      <!-- En celular sólo el total: la página actual ya va entre los botones. -->
      <span class="hidden sm:inline">
        Mostrando página
        <span class="font-semibold text-gray-900 dark:text-white">{{ pagination.page }}</span>
        de
        <span class="font-semibold text-gray-900 dark:text-white">{{ pagination.totalPages }}</span>
        <span class="mx-1">•</span>
      </span>
      <span class="font-semibold text-gray-900 dark:text-white">{{ pagination.total }}</span> registros en total
    </div>

    <nav aria-label="Paginación" class="flex w-full items-center gap-2 sm:w-auto sm:gap-2">
      <button
        type="button"
        @click="goToPage(1)"
        :disabled="pagination.page === 1"
        class="hidden sm:inline-flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-400"
        title="Primera página"
        aria-label="Primera página"
      >
        <Icon name="ph:caret-double-left-bold" class="w-5 h-5" />
      </button>

      <button
        type="button"
        @click="goToPage(pagination.page - 1)"
        :disabled="pagination.page === 1"
        class="inline-flex flex-1 sm:flex-none items-center justify-center gap-1 min-h-10 px-3 py-2 sm:px-4 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
      >
        <Icon name="ph:caret-left-bold" class="w-4 h-4 sm:hidden" />
        Anterior
      </button>

      <!-- Celular: sólo la página actual. -->
      <span class="sm:hidden shrink-0 px-2 text-sm tabular-nums text-gray-600 dark:text-gray-400" aria-live="polite">
        <span class="font-semibold text-gray-900 dark:text-white">{{ pagination.page }}</span> / {{ pagination.totalPages }}
      </span>

      <div class="hidden sm:flex items-center gap-1">
        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          @click="goToPage(page)"
          :aria-current="page === pagination.page ? 'page' : undefined"
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
        type="button"
        @click="goToPage(pagination.page + 1)"
        :disabled="pagination.page >= pagination.totalPages"
        class="inline-flex flex-1 sm:flex-none items-center justify-center gap-1 min-h-10 px-3 py-2 sm:px-4 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
      >
        Siguiente
        <Icon name="ph:caret-right-bold" class="w-4 h-4 sm:hidden" />
      </button>

      <button
        type="button"
        @click="goToPage(pagination.totalPages)"
        :disabled="pagination.page >= pagination.totalPages"
        class="hidden sm:inline-flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-400"
        title="Última página"
        aria-label="Última página"
      >
        <Icon name="ph:caret-double-right-bold" class="w-5 h-5" />
      </button>
    </nav>
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