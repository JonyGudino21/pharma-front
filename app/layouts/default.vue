<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out',
        uiStore.sidebarCollapsed ? 'w-16' : 'w-64',
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700'
      ]"
    >
      <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <div v-if="!uiStore.sidebarCollapsed" class="flex items-center space-x-2 overflow-hidden whitespace-nowrap">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
            <Icon name="ph:pill-bold" class="w-5 h-5 text-white" />
          </div>
          <span class="text-lg font-bold text-gray-900 dark:text-gray-100">PharmaPOS</span>
        </div>
        <button
          @click="uiStore.toggleSidebar"
          class="hidden sm:block p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Icon name="ph:list-bold" class="w-5 h-5" />
        </button>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        <template v-for="item in menuItems" :key="item.name">
          
          <NuxtLink
            v-if="!item.children"
            :to="item.path"
            class="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group"
            active-class="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
            :class="$route.path === item.path ? '' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
          >
            <Icon :name="item.icon" class="w-5 h-5 shrink-0" />
            <span v-if="!uiStore.sidebarCollapsed" class="ml-3 truncate">{{ item.name }}</span>
            <div v-if="uiStore.sidebarCollapsed" class="absolute left-14 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {{ item.name }}
            </div>
          </NuxtLink>

          <div v-else>
            <button
              @click="toggleSubMenu(item.name)"
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            :class="{ 'bg-gray-100 dark:bg-gray-700': item.children?.some((c) => $route.path === c.path || $route.path.startsWith(`${c.path}/`)) }"
            >
              <div class="flex items-center">
                <Icon :name="item.icon" class="w-5 h-5 shrink-0" />
                <span v-if="!uiStore.sidebarCollapsed" class="ml-3 truncate">{{ item.name }}</span>
              </div>
              <Icon 
                v-if="!uiStore.sidebarCollapsed" 
                name="ph:caret-down-bold" 
                class="w-4 h-4 transition-transform" 
                :class="{ 'rotate-180': openMenus[item.name] }"
              />
            </button>

            <div 
              v-if="openMenus[item.name] && !uiStore.sidebarCollapsed" 
              class="mt-1 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700 space-y-1"
            >
              <NuxtLink
                v-for="child in item.children"
                :key="child.path"
                :to="child.path"
                class="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="$route.path === child.path
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'"
              >
                {{ child.name }}
              </NuxtLink>
            </div>
          </div>
        </template>
      </nav>
    </aside>

    <div :class="['transition-all duration-300 flex flex-col min-h-screen', uiStore.sidebarCollapsed ? 'sm:ml-16' : 'sm:ml-64']">
      
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div class="flex items-center justify-between h-16 px-4 sm:px-6">
          
          <button @click="uiStore.toggleSidebar" class="sm:hidden p-2 text-gray-500">
            <Icon name="ph:list-bold" class="w-6 h-6" />
          </button>

          <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100 hidden sm:block capitalize">
            {{ currentRouteName }}
          </h1>
          
          <div class="flex items-center space-x-3 sm:space-x-4 ml-auto">
            <button
              @click="toggleColorMode"
              class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon :name="$colorMode.value === 'dark' ? 'ph:sun-bold' : 'ph:moon-bold'" class="w-5 h-5" />
            </button>

            <div class="relative">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium uppercase">
                    {{ authStore.user?.userName?.charAt(0) || 'U' }}
                  </span>
                </div>
                <span class="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ authStore.user?.userName || 'Usuario' }}
                </span>
                <Icon name="ph:caret-down-bold" class="w-4 h-4 text-gray-500 hidden md:block" />
              </button>

              <div
                v-if="showUserMenu"
                @click="showUserMenu = false"
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
              >
                <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ authStore.user?.userName }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ authStore.user?.role }}</p>
                </div>
                <button
                  @click="handleLogout"
                  :disabled="isLoggingOut"
                  class="flex items-center w-full px-4 py-3 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors disabled:opacity-50"
                >
                  <Icon v-if="isLoggingOut" name="ph:spinner-gap-bold" class="w-4 h-4 mr-3 animate-spin" />
                  <Icon v-else name="ph:sign-out-bold" class="w-4 h-4 mr-3" />
                  {{ isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>

    <div 
      v-if="!uiStore.sidebarCollapsed" 
      @click="uiStore.toggleSidebar"
      class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 sm:hidden"
    ></div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useColorMode } from '#imports'
import { useUIStore } from '~/stores/ui'
import { useAuthStore } from '~/stores/auth'

const uiStore = useUIStore()
const authStore = useAuthStore()
const colorMode = useColorMode()
const route = useRoute()

const showUserMenu = ref(false)
const isLoggingOut = ref(false)

// Obtenemos el nombre de la ruta para el Header (ej. de '/pos' saca 'pos')
const currentRouteName = computed(() => {
  const path = route.path.replace(/^\//, '')
  if (path === '' || path === 'index') return 'Dashboard'
  if (path === 'pos') return 'Punto de venta'
  if (path === 'sales' || path.startsWith('sales/')) return 'Ventas'
  if (path.startsWith('cash-shifts')) return 'Caja'
  if (path.startsWith('catalog')) return 'Catálogo'
  if (path.startsWith('settings/ticket')) return 'Ticket'
  if (path === 'inventory/expiring') return 'Caducidades'
  if (path === 'inventory/controlled') return 'Libro de controlados'
  if (path.startsWith('inventory')) return 'Inventario'
  if (path.startsWith('purchases')) return 'Compras'
  if (path.startsWith('clients')) return 'Clientes'
  return path.split('/')[0] ?? 'Dashboard'
})

// Alternar Claro/Oscuro nativo de Nuxt
const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const handleLogout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true

  // Usamos el Store para desloguear y luego el router para redirigir
  await authStore.logout()
  setTimeout(() => {
    isLoggingOut.value = false
    // Importante: No usamos useRouter aquí, usamos navigateTo nativo
    navigateTo('/login')
  }, 300)
}

// Menú dinámico protegido. El v-if real con authStore.can() lo aplicaremos más adelante
const menuItems = computed(() => {
  return [
    { name: 'Dashboard', path: '/', icon: 'ph:chart-line-up-bold', show: true }, // Siempre visible si estás logueado
    { name: 'Punto de Venta', path: '/pos', icon: 'ph:shopping-cart-bold', show: authStore.can('canSell') },
    { name: 'Ventas', path: '/sales', icon: 'ph:receipt-bold', show: authStore.can('canViewSalesSummary') },
    { name: 'Caja', path: '/cash-shifts', icon: 'ph:cash-register-bold', show: authStore.can('canViewAllShifts') },
    
    // Menú agrupado para Catálogo
    {
      name: 'Catálogo',
      icon: 'ph:books-bold',
      show: true, // Cualquier autenticado puede ver el catálogo según tus reglas
      children: [
        { name: 'Productos', path: '/catalog/products' },
        { name: 'Categorías', path: '/catalog/categories' }
      ]
    },
    
    {
      name: 'Inventario',
      icon: 'ph:archive-box-bold',
      show: authStore.can('canViewKardex'),
      children: [
        { name: 'Control', path: '/inventory' },
        ...(authStore.can('canViewExpiringBatches')
          ? [{ name: 'Caducidades', path: '/inventory/expiring' }]
          : []),
        ...(authStore.can('canViewControlledLog')
          ? [{ name: 'Libro de controlados', path: '/inventory/controlled' }]
          : []),
      ],
    },
    { name: 'Compras', path: '/purchases', icon: 'ph:shopping-cart-bold', show: authStore.can('canViewPurchases') },
    { name: 'Proveedores', path: '/suppliers', icon: 'ph:truck-bold', show: authStore.can('canManageSuppliers') || authStore.can('canViewPurchases') },
    { name: 'Clientes', path: '/clients', icon: 'ph:users-bold', show: authStore.can('canViewClients') },
    { name: 'Usuarios', path: '/users', icon: 'ph:shield-star-bold', show: authStore.can('canManageUsers') },
    {
      name: 'Configuración',
      icon: 'ph:sliders-horizontal-bold',
      show: authStore.can('canManageCompany'),
      children: [
        { name: 'Ticket', path: '/settings/ticket' },
      ],
    },
  ].filter(item => item.show) // Filtramos lo que no tiene permiso
})
// Estado para controlar qué menús anidados están abiertos
const openMenus = ref<Record<string, boolean>>({})
const toggleSubMenu = (menuName: string) => {
  openMenus.value[menuName] = !openMenus.value[menuName]
}

</script>