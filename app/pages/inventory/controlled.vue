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
        <button class="btn-secondary" @click="exportCsv">
          <Icon name="ph:download-simple-bold" class="mr-2" /> Exportar CSV
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
import Pagination from '~/components/shared/Pagination.vue'

definePageMeta({ requiredPermission: 'canViewControlledLog' })

const inventoryStore = useInventoryStore()
const { formatDateTime } = useDate()
const { $api } = useNuxtApp()
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

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

async function exportCsv() {
  const rows: ControlledLogEntry[] = []
  let current = 1
  let totalPages = 1
  do {
    const params = new URLSearchParams()
    params.set('page', String(current))
    params.set('limit', '100')
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    if (filters.prescriptionNo.trim()) params.set('prescriptionNo', filters.prescriptionNo.trim())
    if (filters.doctorLicense.trim()) params.set('doctorLicense', filters.doctorLicense.trim())
    if (filters.patientName.trim()) params.set('patientName', filters.patientName.trim())
    if (filters.entryType) params.set('entryType', filters.entryType)
    const res = await $api<ApiResponse<InventoryPage<ControlledLogEntry>>>(`/inventory/controlled-log?${params}`)
    rows.push(...res.data.data)
    totalPages = res.data.pagination.totalPages
    current += 1
  } while (current <= totalPages && current <= 50)

  const header = ['Fecha', 'Tipo', 'Producto', 'SKU', 'Lote', 'Cantidad', 'Receta', 'Medico', 'Cedula', 'Paciente', 'Despacho']
  const lines = [
    header.join(','),
    ...rows.map((r) => [
      csvEscape(r.createdAt),
      csvEscape(r.entryType),
      csvEscape(r.product.name),
      csvEscape(r.product.sku),
      csvEscape(r.batch?.lotNumber),
      csvEscape(r.quantity),
      csvEscape(r.prescriptionNo),
      csvEscape(r.doctorName),
      csvEscape(r.doctorLicense),
      csvEscape(r.patientName),
      csvEscape(`${r.soldBy.firstName} ${r.soldBy.lastName}`),
    ].join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `libro-controlados-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => inventoryStore.fetchControlledLog(query()))
</script>
