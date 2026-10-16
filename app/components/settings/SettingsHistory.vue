<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSettingsStore, type SettingsHistoryPage } from '~/stores/settings'
import { describirFallo } from '~/composables/useRequestState'
import type { SettingsNamespace } from '~/types/settings'
import SettingsCard from '~/components/settings/SettingsCard.vue'

/**
 * Bitácora de cambios de una sección: quién cambió qué, de cuánto a cuánto.
 * Para la tolerancia del arqueo o el criterio de caducidad, esto es lo que se
 * enseña en una auditoría.
 */
const props = defineProps<{
  namespace: SettingsNamespace
  /** Nombre legible de cada ajuste. */
  labels: Record<string, string>
  /** Cómo mostrar un valor ("$20.00", "30 días", "Sí"). */
  format: (key: string, value: unknown) => string
}>()

const store = useSettingsStore()
const page = ref<SettingsHistoryPage | null>(null)
const current = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)

async function load(p = 1) {
  loading.value = true
  error.value = null
  try {
    page.value = await store.history(props.namespace, p)
    current.value = p
  } catch (e) {
    error.value = describirFallo(e).mensaje
  } finally {
    loading.value = false
  }
}

onMounted(() => load(1))
defineExpose({ reload: () => load(1) })

const when = (iso: string) =>
  new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(new Date(iso))
</script>

<template>
  <SettingsCard title="Historial de cambios" description="Cada cambio queda registrado con quién lo hizo y cuándo." icon="ph:clock-counter-clockwise-bold">
    <div v-if="loading && !page" class="space-y-2" aria-busy="true">
      <div v-for="n in 3" :key="n" class="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/50" />
    </div>

    <div v-else-if="error" class="flex items-center justify-between gap-3 text-sm text-error-600 dark:text-error-400" role="alert">
      <span>{{ error }}</span>
      <button type="button" class="font-medium underline" @click="load(current)">Reintentar</button>
    </div>

    <p v-else-if="!page || page.items.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
      Sin cambios registrados: rigen los valores de fábrica.
    </p>

    <template v-else>
      <ol class="divide-y divide-gray-100 dark:divide-gray-700">
        <li v-for="item in page.items" :key="item.id" class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
          <p class="min-w-0 break-words text-gray-800 dark:text-gray-100">
            <span class="font-medium">{{ labels[item.key] ?? item.key }}</span>:
            <span class="text-gray-500 line-through decoration-gray-300">{{ format(item.key, item.oldValue) }}</span>
            <Icon name="ph:arrow-right" class="mx-1 inline h-3.5 w-3.5 text-gray-400" />
            <span class="font-semibold">{{ format(item.key, item.newValue) }}</span>
          </p>
          <p class="text-xs text-gray-400">{{ item.changedBy.name }} · {{ when(item.changedAt) }}</p>
        </li>
      </ol>
      <div v-if="page.pagination.totalPages > 1" class="mt-3 flex items-center justify-between gap-2 text-sm sm:justify-end">
        <button type="button" class="btn-secondary px-3 py-2 text-sm sm:py-1" :disabled="current <= 1 || loading" @click="load(current - 1)">Anteriores</button>
        <span class="shrink-0 text-gray-500 dark:text-gray-400">{{ current }} / {{ page.pagination.totalPages }}</span>
        <button type="button" class="btn-secondary px-3 py-2 text-sm sm:py-1" :disabled="current >= page.pagination.totalPages || loading" @click="load(current + 1)">Más antiguos</button>
      </div>
    </template>
  </SettingsCard>
</template>
