<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:shadow-none print:border-0">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:notebook-bold" class="text-primary-600 print:hidden" /> Libro de controlados
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Bitácora append-only COFEPRIS. Las devoluciones y destrucciones se registran como entradas nuevas.
        </p>
      </div>
      <div class="flex gap-2 print:hidden">
        <button
          v-if="authStore.can('canExportControlledLog')"
          class="btn-secondary"
          :disabled="exporting"
          title="Exporta el libro completo del periodo (registra quién lo exportó)"
          @click="exportCsv"
        >
          <Icon :name="exporting ? 'ph:spinner-gap-bold' : 'ph:download-simple-bold'" class="mr-2" :class="{ 'animate-spin': exporting }" />
          {{ exporting ? 'Exportando…' : 'Exportar CSV' }}
        </button>
        <button class="btn-primary" @click="printLog">
          <Icon name="ph:printer-bold" class="mr-2" /> Imprimir
        </button>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 print:hidden">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Folio / receta</label>
          <input v-model="filters.prescriptionNo" type="text" class="input-base" placeholder="Folio o cédula..." @keyup.enter="buscar" />
        </div>
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Cédula</label>
          <input v-model="filters.doctorLicense" type="text" class="input-base" @keyup.enter="buscar" />
        </div>
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Paciente</label>
          <input v-model="filters.patientName" type="text" class="input-base" @keyup.enter="buscar" />
        </div>
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Tipo</label>
          <select v-model="filters.entryType" class="input-base cursor-pointer" @change="buscar">
            <option value="">Todos</option>
            <option value="DISPENSE">Dispensación</option>
            <option value="RETURN">Devolución</option>
            <option value="DESTRUCTION">Destrucción</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Desde</label>
          <input v-model="filters.startDate" type="date" class="input-base" @change="buscar" />
        </div>
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Hasta</label>
          <input v-model="filters.endDate" type="date" class="input-base" @change="buscar" />
        </div>
        <div class="flex items-end">
          <button class="btn-primary w-full" @click="buscar">
            <Icon name="ph:funnel-bold" class="mr-2" /> Aplicar
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden print:shadow-none print:border-0">
      <div v-if="inventoryStore.isLoadingControlled" class="py-16 text-center text-gray-400">
        <Icon name="ph:spinner-gap-bold" class="w-8 h-8 animate-spin mx-auto" />
      </div>
      <!--
        Falló la consulta ≠ no hay datos. Antes esta rama no existía y un error
        del servidor se pintaba con el mensaje de "vacío" de abajo.
      -->
      <div v-else-if="inventoryStore.controlledError" class="py-12 px-6 text-center" role="alert">
        <Icon name="ph:cloud-slash-fill" class="w-10 h-10 mx-auto text-error-500" />
        <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ inventoryStore.controlledError.mensaje }}</p>
        <p class="mt-1 text-xs text-gray-500">Esto NO significa que el libro esté vacío: no pudimos consultarlo.</p>
        <button
          v-if="inventoryStore.controlledError.reintentable"
          type="button"
          class="mt-3 inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          @click="buscar()"
        >
          <Icon name="ph:arrow-clockwise-bold" /> Reintentar
        </button>
      </div>
      <div v-else-if="inventoryStore.controlledLog.length === 0" class="py-16 text-center text-gray-400">
        No hay registros con esos filtros.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left whitespace-nowrap">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3">Tipo</th>
              <th class="px-4 py-3">Producto</th>
              <th class="px-4 py-3">Lote</th>
              <th class="px-4 py-3 text-center">Cant.</th>
              <th class="px-4 py-3">Receta</th>
              <th class="px-4 py-3">Médico / cédula</th>
              <th class="px-4 py-3">Paciente</th>
              <th class="px-4 py-3">Despachó</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="row in inventoryStore.controlledLog" :key="row.id">
              <td class="px-4 py-3 text-sm">{{ formatDateTime(row.createdAt) }}</td>
              <td class="px-4 py-3 text-xs font-bold uppercase">{{ typeLabel(row.entryType) }}</td>
              <td class="px-4 py-3">
                <p class="font-bold text-sm">{{ row.product.name }}</p>
                <p class="text-xs font-mono text-gray-500">{{ row.product.sku }}</p>
              </td>
              <td class="px-4 py-3 font-mono text-sm">{{ row.batch?.lotNumber ?? '—' }}</td>
              <td class="px-4 py-3 text-center font-bold">{{ row.quantity }}</td>
              <td class="px-4 py-3 font-mono text-sm">{{ row.prescriptionNo ?? '—' }}</td>
              <td class="px-4 py-3 text-sm">
                {{ row.doctorName ?? '—' }}
                <span v-if="row.doctorLicense" class="block text-xs text-gray-500">{{ row.doctorLicense }}</span>
              </td>
              <td class="px-4 py-3 text-sm">{{ row.patientName ?? '—' }}</td>
              <td class="px-4 py-3 text-sm">{{ row.soldBy.firstName }} {{ row.soldBy.lastName }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 pb-4 print:hidden">
        <Pagination :pagination="inventoryStore.controlledPagination" @page-change="goToPage" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import { useInventoryStore, type ControlledLogEntry, type ControlledLogEntryType, type InventoryPage } from '~/stores/inventory'
import type { ApiResponse } from '~/types/auth'
import { useDate } from '~/composables/useDate'
import { useToast } from '~/composables/useToast'
import { useAuthStore } from '~/stores/auth'
import Pagination from '~/components/shared/Pagination.vue'

definePageMeta({ requiredPermission: 'canViewControlledLog' })

const inventoryStore = useInventoryStore()
const { formatDateTime } = useDate()
const { $api } = useNuxtApp()
const toast = useToast()
const authStore = useAuthStore()
const page = ref(1)

const filters = reactive({
  prescriptionNo: '',
  doctorLicense: '',
  patientName: '',
  startDate: '',
  endDate: '',
  entryType: '' as ControlledLogEntryType | '',
})

function query() {
  return {
    page: page.value,
    ...filters,
  }
}

function buscar() {
  page.value = 1
  inventoryStore.fetchControlledLog(query())
}

function goToPage(next: number) {
  page.value = next
  inventoryStore.fetchControlledLog(query())
}

function typeLabel(type: ControlledLogEntryType) {
  if (type === 'DISPENSE') return 'Dispensa'
  if (type === 'RETURN') return 'Devolución'
  return 'Destrucción'
}

function printLog() {
  window.print()
}

/**
 * EXPORTACIÓN OFICIAL DEL LIBRO (CSV) — la genera el servidor.
 *
 * Antes el navegador armaba el CSV pidiendo páginas de 100 y se detenía en
 * silencio a las 50 (5,000 filas): un libro COFEPRIS incompleto sin aviso, sin
 * BOM (Excel deformaba acentos) y sin manejo de errores. El servidor ya tenía
 * una exportación completa que además deja constancia de quién exportó y una
 * huella de integridad (X-Integrity-Hash). Se usa esa.
 *
 * Filtros: el periodo y el tipo de movimiento. Receta, médico y paciente son
 * filtros de CONSULTA en pantalla; el libro oficial del periodo va completo.
 */
const exporting = ref(false)

async function exportCsv() {
  if (exporting.value) return
  exporting.value = true
  try {
    const params = new URLSearchParams()
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    if (filters.entryType) params.set('entryType', filters.entryType)

    let filename = `libro-controlados-${new Date().toISOString().slice(0, 10)}.csv`
    let hash = ''
    const content = await $api<string>(`/inventory/controlled-log/export?${params}`, {
      responseType: 'text',
      onResponse({ response }) {
        hash = response.headers.get('X-Integrity-Hash') ?? ''
        const disp = response.headers.get('Content-Disposition') ?? ''
        const m = /filename="?([^";]+)"?/i.exec(disp)
        if (m?.[1]) filename = m[1]
      },
    })

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    // Se libera después: revocar en el mismo tick puede cancelar la descarga.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success(hash ? `Libro exportado. Huella de integridad: ${hash.slice(0, 16)}…` : 'Libro exportado.')
  } catch {
    // El interceptor de $api ya explicó el motivo (sin permiso, sin conexión…).
  } finally {
    exporting.value = false
  }
}

onMounted(() => inventoryStore.fetchControlledLog(query()))
</script>
