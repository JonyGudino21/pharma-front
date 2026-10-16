<template>
  <div class="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
    <!--
      MENÚ LATERAL RESPONSIVO.
      - Laptop (≥ 1024 px, `lg`): fijo a la izquierda; se colapsa a íconos.
      - Celular y tableta: cajón que se desliza sobre la pantalla con fondo
        oscuro; se cierra al elegir una pantalla, al tocar fuera o con Esc.
      Antes, en celular el menú quedaba SIEMPRE abierto y tapaba 256 de 375 px:
      la aplicación no se podía usar en un teléfono.
    -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="uiStore.mobileNavOpen"
        class="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
        aria-hidden="true"
        @click="uiStore.closeMobileNav()"
      />
    </Transition>

    <aside
      id="app-sidebar"
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800',
        uiStore.mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        'lg:translate-x-0 lg:shadow-none',
        uiStore.sidebarCollapsed ? 'lg:w-16' : 'lg:w-64',
      ]"
      aria-label="Menú principal"
    >
      <div class="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
        <div v-if="showLabels" class="flex items-center space-x-2 overflow-hidden whitespace-nowrap">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600">
            <Icon name="ph:pill-bold" class="h-5 w-5 text-white" />
          </div>
          <span class="text-lg font-bold text-gray-900 dark:text-gray-100">PharmaPOS</span>
        </div>
        <!-- Laptop: colapsar a íconos -->
        <button
          type="button"
          class="hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:block dark:hover:bg-gray-700"
          :aria-label="uiStore.sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'"
          @click="uiStore.toggleSidebar"
        >
          <Icon :name="uiStore.sidebarCollapsed ? 'ph:caret-double-right-bold' : 'ph:caret-double-left-bold'" class="h-5 w-5" />
        </button>
        <!-- Celular: cerrar el cajón -->
        <button
          type="button"
          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-700"
          aria-label="Cerrar menú"
          @click="uiStore.closeMobileNav()"
        >
          <Icon name="ph:x-bold" class="h-5 w-5" />
        </button>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <template v-for="item in menuItems" :key="item.name">
          <NuxtLink
            v-if="!item.children"
            :to="item.path"
            class="group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            :class="isActive(item.path)
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
            :aria-current="isActive(item.path) ? 'page' : undefined"
            :title="showLabels ? undefined : item.name"
          >
            <Icon :name="item.icon" class="h-5 w-5 shrink-0" />
            <span v-if="showLabels" class="ml-3 truncate">{{ item.name }}</span>
          </NuxtLink>

          <div v-else>
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              :class="{ 'bg-gray-100 dark:bg-gray-700': groupActive(item) }"
              :aria-expanded="!!openMenus[item.name]"
              :title="showLabels ? undefined : item.name"
              @click="onGroupClick(item.name)"
            >
              <span class="flex items-center">
                <Icon :name="item.icon" class="h-5 w-5 shrink-0" />
                <span v-if="showLabels" class="ml-3 truncate">{{ item.name }}</span>
              </span>
              <Icon
                v-if="showLabels"
                name="ph:caret-down-bold"
                class="h-4 w-4 transition-transform"
                :class="{ 'rotate-180': openMenus[item.name] }"
              />
            </button>

            <div
              v-if="openMenus[item.name] && showLabels"
              class="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-4 dark:border-gray-700"
            >
              <NuxtLink
                v-for="child in item.children"
                :key="child.path"
                :to="child.path"
                class="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                :class="$route.path === child.path
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'"
                :aria-current="$route.path === child.path ? 'page' : undefined"
              >
                {{ child.name }}
              </NuxtLink>
            </div>
          </div>
        </template>
      </nav>
    </aside>

    <div :class="['flex min-h-screen min-w-0 flex-col transition-all duration-300', uiStore.sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64']">
      <header class="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
          <button
            type="button"
            class="-ml-1 rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Abrir menú"
            aria-controls="app-sidebar"
            :aria-expanded="uiStore.mobileNavOpen"
            data-testid="open-mobile-nav"
            @click="uiStore.openMobileNav()"
          >
            <Icon name="ph:list-bold" class="h-6 w-6" />
          </button>

          <h1 class="min-w-0 flex-1 truncate text-base font-semibold capitalize text-gray-900 sm:text-xl dark:text-gray-100">
            {{ currentRouteName }}
          </h1>

          <div class="flex shrink-0 items-center gap-1 sm:gap-2">
            <!-- Ayuda de la pantalla actual (guía con secciones y buscador). -->
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700 dark:hover:text-primary-400"
              aria-label="Ayuda de esta pantalla"
              title="Ayuda de esta pantalla"
              data-testid="open-help"
              @click="openHelp()"
            >
              <Icon name="ph:question-bold" class="h-5 w-5" />
              <span class="hidden text-sm font-medium lg:inline">Ayuda</span>
            </button>
            <button
              type="button"
              class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              :aria-label="$colorMode.value === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
              @click="toggleColorMode"
            >
              <Icon :name="$colorMode.value === 'dark' ? 'ph:sun-bold' : 'ph:moon-bold'" class="h-5 w-5" />
            </button>

            <div ref="userMenuRef" class="relative">
              <button
                type="button"
                class="flex items-center space-x-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-haspopup="menu"
                :aria-expanded="showUserMenu"
                @click="showUserMenu = !showUserMenu"
              >
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600">
                  <span class="text-sm font-medium uppercase text-white">
                    {{ authStore.user?.userName?.charAt(0) || 'U' }}
                  </span>
                </div>
                <span class="hidden text-sm font-medium text-gray-700 md:block dark:text-gray-300">
                  {{ authStore.user?.userName || 'Usuario' }}
                </span>
                <Icon name="ph:caret-down-bold" class="hidden h-4 w-4 text-gray-500 md:block" />
              </button>

              <div
                v-if="showUserMenu"
                class="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                role="menu"
                @click="showUserMenu = false"
              >
                <div class="border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                  <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ authStore.user?.userName }}</p>
                  <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ roleMeta(authStore.user?.role ?? '').label }}</p>
                </div>
                <!-- Cambio de la propia contraseña. No existía: el admin creado por la
                     semilla no tenía cómo cambiar la suya, y un cajero que sospechaba
                     que alguien la había visto tenía que pedírselo a otra persona. -->
                <NuxtLink
                  to="/account/password"
                  role="menuitem"
                  class="flex w-full items-center px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Icon name="ph:key-bold" class="mr-3 h-4 w-4" />
                  Cambiar contraseña
                </NuxtLink>
                <button
                  type="button"
                  role="menuitem"
                  :disabled="isLoggingOut"
                  class="flex w-full items-center px-4 py-3 text-sm text-error-600 transition-colors hover:bg-error-50 disabled:opacity-50 dark:hover:bg-error-900/20"
                  @click="handleLogout"
                >
                  <Icon v-if="isLoggingOut" name="ph:spinner-gap-bold" class="mr-3 h-4 w-4 animate-spin" />
                  <Icon v-else name="ph:sign-out-bold" class="mr-3 h-4 w-4" />
                  {{ isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="@container min-w-0 flex-1 p-3 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHelp } from '~/composables/useHelp'

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useColorMode } from '#imports'
import { useUIStore } from '~/stores/ui'
import { useAuthStore } from '~/stores/auth'
import { visibleSettingsSections } from '~/utils/settings-sections'
import { roleMeta } from '~/utils/roles'

const uiStore = useUIStore()
const authStore = useAuthStore()
const settingsSections = computed(() => visibleSettingsSections((p) => authStore.can(p)))
const colorMode = useColorMode()
const route = useRoute()
const { openHelp } = useHelp()

// ── Responsivo ───────────────────────────────────────────────────────────
// En laptop (≥ 1024 px) el menú es fijo y puede colapsarse a íconos; en
// celular y tableta es un cajón y siempre muestra los nombres.
const isDesktop = ref(true)
let mq: MediaQueryList | null = null
const syncMq = () => { isDesktop.value = !!mq?.matches }
const showLabels = computed(() => !isDesktop.value || !uiStore.sidebarCollapsed)

const userMenuRef = ref<HTMLElement | null>(null)
function onDocClick(e: MouseEvent) {
  if (showUserMenu.value && userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) showUserMenu.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (uiStore.mobileNavOpen) uiStore.closeMobileNav()
  showUserMenu.value = false
}

onMounted(() => {
  mq = window.matchMedia('(min-width: 1024px)')
  syncMq()
  mq.addEventListener('change', syncMq)
  document.addEventListener('click', onDocClick)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  mq?.removeEventListener('change', syncMq)
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

// Elegir una pantalla cierra el cajón; con el cajón abierto la página de
// atrás no se desplaza (en celular el dedo movía las dos cosas).
watch(() => route.fullPath, () => uiStore.closeMobileNav())
watch(() => uiStore.mobileNavOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open && !isDesktop.value ? 'hidden' : ''
})
watch(isDesktop, (desktop) => { if (desktop) uiStore.closeMobileNav() })

const isActive = (path: string) => (path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(`${path}/`))
const groupActive = (item: { children?: { path: string }[] }) =>
  !!item.children?.some((c) => route.path === c.path || route.path.startsWith(`${c.path}/`))

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
  if (path.startsWith('settings')) {
    const section = settingsSections.value.find((s) => route.path.startsWith(s.to))
    return section ? `Configuración · ${section.label}` : 'Configuración'
  }
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
    { name: 'Ventas', path: '/sales', icon: 'ph:receipt-bold', show: authStore.can('canViewSalesHistory') },
    // `canOpenShift` y NO sólo `canViewAllShifts`: la pantalla exige
    // `canOpenShift`, así que un cajero —que tiene ése y no el de ver todos
    // los turnos— no encontraba en el menú dónde abrir su propia caja.
    // Quien sólo supervisa (ve todos los turnos pero no abre caja) va directo
    // al historial: /cash-shifts exige `canOpenShift` y lo rebotaba.
    {
      name: 'Caja',
      path: authStore.can('canOpenShift') ? '/cash-shifts' : '/cash-shifts/history',
      icon: 'ph:cash-register-bold',
      show: authStore.can('canOpenShift') || authStore.can('canViewAllShifts'),
    },
    
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
    { name: 'Compras', path: '/purchases', icon: 'ph:truck-bold', show: authStore.can('canViewPurchases') },
    // Sólo con el permiso que la página exige. Antes también se mostraba con
    // `canViewPurchases`: el farmacéutico veía el enlace, hacía clic y recibía
    // "Acceso denegado". Un menú que ofrece lo que no deja usar se siente roto.
    { name: 'Proveedores', path: '/suppliers', icon: 'ph:handshake-bold', show: authStore.can('canManageSuppliers') },
    { name: 'Clientes', path: '/clients', icon: 'ph:users-bold', show: authStore.can('canViewClients') },
    // Usuarios vive en Configuración (junto a Permisos); el acceso directo se
    // conserva porque es de las pantallas que más abre el administrador.
    { name: 'Usuarios', path: '/settings/users', icon: 'ph:shield-star-bold', show: authStore.can('canManageUsers') },
    {
      name: 'Configuración',
      icon: 'ph:sliders-horizontal-bold',
      // Misma lista que las pestañas de Configuración: sólo lo que se puede abrir.
      show: settingsSections.value.length > 0,
      children: settingsSections.value.map((s) => ({ name: s.label, path: s.to })),
    },
  ].filter(item => item.show) // Filtramos lo que no tiene permiso
})
// Estado para controlar qué menús anidados están abiertos
const openMenus = ref<Record<string, boolean>>({})
const toggleSubMenu = (menuName: string) => {
  openMenus.value[menuName] = !openMenus.value[menuName]
}

/** Con el menú colapsado a íconos, tocar un grupo lo expande para ver sus pantallas. */
function onGroupClick(menuName: string) {
  if (!showLabels.value) {
    uiStore.toggleSidebar()
    openMenus.value[menuName] = true
    return
  }
  toggleSubMenu(menuName)
}

// El grupo de la pantalla actual aparece abierto (al entrar por enlace o F5).
watch(
  () => [route.path, menuItems.value.length] as const,
  () => {
    for (const item of menuItems.value) {
      if ('children' in item && item.children && groupActive(item)) openMenus.value[item.name] = true
    }
  },
  { immediate: true },
)

</script>