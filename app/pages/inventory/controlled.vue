<template>
  <div class="space-y-6">
    <div class="page-header print:shadow-none print:border-0">
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="ph:notebook-bold" class="text-primary-600 print:hidden" /> Libro de controlados
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Bitácora append-only COFEPRIS. Las devoluciones y destrucciones se registran como entradas nuevas.
        </p>
      </div>
      <div class="page-actions print:hidden">
        <!-- Celular: los filtros se pliegan para no ocupar toda la pantalla. -->
        <button type="button" class="btn-secondary md:hidden" :aria-expanded="showFilters" @click="showFilters = !showFilters">
          <Icon name="ph:funnel-bold" class="mr-2" /> Filtros<span v-if="hayFiltros" class="ml-1 text-primary-600">•</span>
        </button>
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

    <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 print:hidden" :class="{ 'hidden md:block': !showFilters }">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div>
          <label for="ctlPrescription" class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Folio / receta</label>
          <input id="ctlPrescription" v-model="filters.prescriptionNo" type="text" class="input-base" placeholder="Folio de la receta..." @keyup.enter="buscar" />
        </div>
        <div>
          <label for="ctlLicense" class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Cédula</label>
          <input id="ctlLicense" v-model="filters.doctorLicense" type="text" class="input-base" placeholder="Cédula del médico..." @keyup.enter="buscar" />
        </div>
        <div>
          <label for="ctlPatient" class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Paciente</label>
          <input id="ctlPatient" v-model="filters.patientName" type="text" class="input-base" @keyup.enter="buscar" />
        </div>
        <div>
          <label for="ctlType" class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Tipo</label>
          <select id="ctlType" v-model="filters.entryType" class="input-base cursor-pointer" @change="buscar">
            <option value="">Todos</option>
            <option value="DISPENSE">{{ typeLabel('DISPENSE') }}</option>
            <option value="RETURN">{{ typeLabel('RETURN') }}</option>
            <option value="DESTRUCTION">{{ typeLabel('DESTRUCTION') }}</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label for="ctlStart" class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Desde</label>
          <input id="ctlStart" v-model="filters.startDate" type="date" class="input-base" @change="buscar" />
        </div>
        <div>
          <label for="ctlEnd" class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Hasta</label>
          <input id="ctlEnd" v-model="filters.endDate" type="date" class="input-base" @change="buscar" />
        </div>
        <div class="flex items-end sm:col-span-2 md:col-span-1">
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
      <template v-else>
        <!-- Laptop, tableta e impresión: tabla completa -->
        <div class="table-wrap hidden @4xl:block print:block">
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
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              <tr v-for="row in inventoryStore.controlledLog" :key="row.id">
                <td class="px-4 py-3 text-sm">{{ formatDateTime(row.createdAt) }}</td>
                <td class="px-4 py-3 text-xs font-bold uppercase">{{ typeLabel(row.entryType) }}</td>
                <td class="px-4 py-3">
                  <p class="font-bold text-sm text-gray-900 dark:text-white">{{ row.product.name }}</p>
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

        <!-- Celular: tarjetas con todos los datos del asiento -->
        <ul class="card-list @4xl:hidden print:hidden" data-testid="controlled-cards">
          <li v-for="row in inventoryStore.controlledLog" :key="row.id" class="px-4 py-3">
            <div class="card-row">
              <p class="min-w-0 truncate font-bold text-gray-900 dark:text-white">{{ row.product.name }}</p>
              <p class="shrink-0 font-bold tabular-nums text-gray-900 dark:text-white">{{ row.quantity }} uds.</p>
            </div>
            <div class="card-row mt-0.5">
              <p class="text-xs font-bold uppercase" :class="row.entryType === 'DISPENSE' ? 'text-primary-600 dark:text-primary-400' : row.entryType === 'RETURN' ? 'text-warning-600 dark:text-warning-400' : 'text-error-600 dark:text-error-400'">{{ typeLabel(row.entryType) }}</p>
              <p class="shrink-0 text-xs text-gray-500">{{ formatDateTime(row.createdAt) }}</p>
            </div>
            <dl class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <div class="min-w-0"><dt class="card-label">Lote</dt><dd class="truncate font-mono text-gray-700 dark:text-gray-300">{{ row.batch?.lotNumber ?? '—' }}</dd></div>
              <div class="min-w-0"><dt class="card-label">Receta</dt><dd class="truncate font-mono text-gray-700 dark:text-gray-300">{{ row.prescriptionNo ?? '—' }}</dd></div>
              <div class="min-w-0"><dt class="card-label">Médico</dt><dd class="truncate text-gray-700 dark:text-gray-300">{{ row.doctorName ?? '—' }}<span v-if="row.doctorLicense" class="block text-xs text-gray-500">{{ row.doctorLicense }}</span></dd></div>
              <div class="min-w-0"><dt class="card-label">Paciente</dt><dd class="truncate text-gray-700 dark:text-gray-300">{{ row.patientName ?? '—' }}</dd></div>
              <div class="col-span-2 min-w-0"><dt class="card-label">Despachó</dt><dd class="truncate text-gray-700 dark:text-gray-300">{{ row.soldBy.firstName }} {{ row.soldBy.lastName }}</dd></div>
            </dl>
          </li>
        </ul>
      </template>
      <div v-if="!inventoryStore.controlledError" class="px-3 pb-4 sm:px-4 print:hidden">
        <Pagination :pagination="inventoryStore.controlledPagination" @page-change="goToPage" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
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

/** Celular: filtros plegados por omisión (en laptop siempre visibles). */
const showFilters = ref(false)
const hayFiltros = computed(() => Object.values(filters).some((v) => v !== ''))

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
