<template>
  <div class="space-y-6">
    
    <div class="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Panel de Control Financiero</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Analítica en tiempo real para gerencia.</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
        <div class="flex gap-2 w-full sm:w-auto">
          <input v-model="localFilters.startDate" type="date" class="input-base w-full sm:w-auto text-sm" />
          <input v-model="localFilters.endDate" type="date" class="input-base w-full sm:w-auto text-sm" />
        </div>
        
        <div class="flex gap-2">
          <button @click="applyCurrentMonth" class="btn-secondary text-sm shrink-0">Este Mes</button>
          <button @click="applyLastMonth" class="btn-secondary text-sm shrink-0">Mes Pasado</button>
          <button @click="applyFilters" :disabled="analyticsStore.isLoading" class="btn-primary text-sm shrink-0">
            <Icon v-if="analyticsStore.isLoading" name="ph:spinner-gap-bold" class="w-4 h-4 mr-2 animate-spin" />
            <Icon v-else name="ph:magnifying-glass-bold" class="w-4 h-4 mr-2" />
            Filtrar
          </button>
        </div>
      </div>
    </div>

    <div v-if="!authStore.can('canViewAnalytics')" class="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <Icon name="ph:shield-warning-duotone" class="w-20 h-20 text-warning-500 mb-4" />
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Acceso Restringido</h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">Solo el personal de gerencia puede ver las métricas financieras.</p>
    </div>

    <div v-else-if="analyticsStore.isLoading && !analyticsStore.data" class="space-y-6">
      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div v-for="i in 6" :key="i" class="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      </div>
    </div>

    <div v-else-if="analyticsStore.data" class="space-y-6">
      
      <div class="text-center">
        <span class="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">
          <Icon name="ph:calendar-blank-bold" class="mr-2" />
          {{ formatDate(analyticsStore.data.period.startDate) }} — {{ formatDate(analyticsStore.data.period.endDate) }}
        </span>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-success-500 relative overflow-hidden group">
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Ventas Totales</p>
          <p class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{{ formatCurrency(analyticsStore.data.kpis.totalSales) }}</p>
          <Icon name="ph:money-duotone" class="absolute -bottom-2 -right-2 w-16 h-16 text-success-500/10 group-hover:scale-110 transition-transform" />
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-error-500 relative overflow-hidden group">
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Costo Total</p>
          <p class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{{ formatCurrency(analyticsStore.data.kpis.totalCost) }}</p>
          <Icon name="ph:trend-down-duotone" class="absolute -bottom-2 -right-2 w-16 h-16 text-error-500/10 group-hover:scale-110 transition-transform" />
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-primary-500 relative overflow-hidden group">
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Utilidad Bruta</p>
          <p class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{{ formatCurrency(analyticsStore.data.kpis.grossProfit) }}</p>
          <Icon name="ph:trend-up-duotone" class="absolute -bottom-2 -right-2 w-16 h-16 text-primary-500/10 group-hover:scale-110 transition-transform" />
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-warning-500 relative overflow-hidden group">
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Margen</p>
          <p class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{{ analyticsStore.data.kpis.marginPercentage.toFixed(2) }}%</p>
          <Icon name="ph:percent-duotone" class="absolute -bottom-2 -right-2 w-16 h-16 text-warning-500/10 group-hover:scale-110 transition-transform" />
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-purple-500 relative overflow-hidden group">
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Ticket Prom.</p>
          <p class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{{ formatCurrency(analyticsStore.data.kpis.averageTicket) }}</p>
          <Icon name="ph:receipt-duotone" class="absolute -bottom-2 -right-2 w-16 h-16 text-purple-500/10 group-hover:scale-110 transition-transform" />
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-teal-500 relative overflow-hidden group">
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Transacciones</p>
          <p class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{{ analyticsStore.data.kpis.totalTransactions }}</p>
          <Icon name="ph:shopping-bag-duotone" class="absolute -bottom-2 -right-2 w-16 h-16 text-teal-500/10 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      <h2 class="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-4">Liquidez Actual</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gradient-to-br from-warning-400 to-warning-600 rounded-2xl p-6 text-white shadow-lg">
          <p class="text-sm font-medium opacity-90 mb-1">Cuentas por Cobrar</p>
          <p class="text-3xl font-black mb-4">{{ formatCurrency(analyticsStore.data.liquidity.accountsReceivable) }}</p>
          <div class="flex items-center text-sm opacity-80"><Icon name="ph:users-bold" class="mr-2"/> Deuda de Clientes</div>
        </div>
        <div class="bg-gradient-to-br from-error-400 to-error-600 rounded-2xl p-6 text-white shadow-lg">
          <p class="text-sm font-medium opacity-90 mb-1">Cuentas por Pagar</p>
          <p class="text-3xl font-black mb-4">{{ formatCurrency(analyticsStore.data.liquidity.accountsPayable) }}</p>
          <div class="flex items-center text-sm opacity-80"><Icon name="ph:truck-bold" class="mr-2"/> Deuda a Proveedores</div>
        </div>
        <div class="bg-gradient-to-br from-success-400 to-success-600 rounded-2xl p-6 text-white shadow-lg">
          <p class="text-sm font-medium opacity-90 mb-1">Valor Inventario</p>
          <p class="text-3xl font-black mb-4">{{ formatCurrency(analyticsStore.data.liquidity.inventoryValue) }}</p>
          <div class="flex items-center text-sm opacity-80"><Icon name="ph:archive-box-bold" class="mr-2"/> Stock Disponible</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 class="text-base font-bold text-gray-900 dark:text-white mb-6">Ventas por Método de Pago</h3>
          <ClientOnly>
            <apexchart 
              v-if="analyticsStore.data.trends.salesByPaymentMethod.length > 0"
              type="donut" height="320" :options="paymentOptions" :series="paymentSeries" 
            />
            <div v-else class="h-[320px] flex items-center justify-center text-gray-400">Sin datos registrados</div>
          </ClientOnly>
        </div>

        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 class="text-base font-bold text-gray-900 dark:text-white mb-6">Top 5 Productos Ingresados</h3>
          <ClientOnly>
            <apexchart 
              v-if="analyticsStore.data.trends.topSellingProducts.length > 0"
              type="bar" height="320" :options="productOptions" :series="productSeries" 
            />
            <div v-else class="h-[320px] flex items-center justify-center text-gray-400">Sin productos vendidos</div>
          </ClientOnly>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAnalyticsStore } from '~/stores/analytics'
import { useAuthStore } from '~/stores/auth'
import { useCurrency } from '~/composables/useCurrency'
import { useDate } from '~/composables/useDate'
import { useColorMode } from '#imports'

const analyticsStore = useAnalyticsStore()
const authStore = useAuthStore()
const { formatCurrency } = useCurrency()
const { formatDate } = useDate()
const colorMode = useColorMode()

const localFilters = ref({ startDate: '', endDate: '' })
const isDark = computed(() => colorMode.value === 'dark')

// Ejecutar al montar si el usuario tiene permiso
onMounted(() => {
  if (authStore.can('canViewAnalytics')) {
    analyticsStore.setCurrentMonthFilters()
    localFilters.value = { ...analyticsStore.filters }
    applyFilters()
  }
})

const applyFilters = () => {
  analyticsStore.fetchDashboard(localFilters.value.startDate, localFilters.value.endDate)
}

const applyCurrentMonth = () => {
  analyticsStore.setCurrentMonthFilters()
  localFilters.value = { ...analyticsStore.filters }
  applyFilters()
}

const applyLastMonth = () => {
  analyticsStore.setLastMonthFilters()
  localFilters.value = { ...analyticsStore.filters }
  applyFilters()
}

// --- CONFIGURACIÓN APEXCHARTS: Dona ---
const paymentSeries = computed(() => {
  return analyticsStore.data?.trends.salesByPaymentMethod.map(item => item.totalAmount) || []
})
const paymentOptions = computed(() => {
  const labels = analyticsStore.data?.trends.salesByPaymentMethod.map(item => item.method) || []
  return {
    chart: { background: 'transparent', fontFamily: 'inherit' },
    labels,
    theme: { mode: isDark.value ? 'dark' : 'light' },
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
    stroke: { colors: [isDark.value ? '#1f2937' : '#ffffff'] },
    tooltip: { y: { formatter: (val: number) => formatCurrency(val) } },
    dataLabels: { enabled: false }
  }
})

// --- CONFIGURACIÓN APEXCHARTS: Barras Horizontales ---
const productSeries = computed(() => {
  return [{
    name: 'Ingresos',
    data: analyticsStore.data?.trends.topSellingProducts.map(p => p.totalRevenue) || []
  }]
})
const productOptions = computed(() => {
  const categories = analyticsStore.data?.trends.topSellingProducts.map(p => {
    return p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name
  }) || []
  
  return {
    chart: { type: 'bar', background: 'transparent', fontFamily: 'inherit', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    colors: ['#2563eb'],
    xaxis: { 
      categories, 
      labels: { formatter: (val: number) => formatCurrency(val) }
    },
    theme: { mode: isDark.value ? 'dark' : 'light' },
    tooltip: { 
      y: { 
        formatter: (val: number, opts: any) => {
          const product = analyticsStore.data?.trends.topSellingProducts[opts.dataPointIndex]
          return `${formatCurrency(val)} (${product?.totalQuantity} uds)`
        } 
      } 
    }
  }
})
</script>