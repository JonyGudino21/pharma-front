<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useUserManagementStore, type ManagedUser } from '~/stores/userManagement'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import { roleMeta } from '~/utils/roles'
import UserFormModal from '~/components/users/UserFormModal.vue'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'
import Pagination from '~/components/shared/Pagination.vue'

definePageMeta({ requiredPermission: 'canManageUsers' })

/**
 * USUARIOS. Directorio del personal y control de acceso.
 *
 * Además de alta y edición: quién tiene la sesión abierta y desde cuándo,
 * cerrar sesiones a distancia ("se quedó abierta en la caja 2") y reactivar
 * bajas. Las salvaguardas sobre uno mismo y sobre el último administrador las
 * aplica el servidor; aquí se reflejan para no ofrecer lo que se rechazaría.
 */
const store = useUserManagementStore()
const auth = useAuthStore()
const toast = useToast()

const me = computed(() => auth.user?.id)

const showForm = ref(false)
const selected = ref<ManagedUser | null>(null)
const search = ref(store.filters.query)
let searchTimer: ReturnType<typeof setTimeout> | undefined

type Pending = { kind: 'deactivate' | 'revoke'; user: ManagedUser }
const pending = ref<Pending | null>(null)
const busy = ref(false)

onMounted(() => store.fetchUsers())
onBeforeUnmount(() => clearTimeout(searchTimer))

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.filters.query = search.value
    store.filters.page = 1
    store.fetchUsers()
  }, 400)
}

function onStatus() {
  store.filters.page = 1
  store.fetchUsers()
}

function goTo(page: number) {
  store.filters.page = page
  store.fetchUsers()
}

function openCreate() {
  selected.value = null
  showForm.value = true
}
function openEdit(u: ManagedUser) {
  selected.value = u
  showForm.value = true
}
function closeForm() {
  showForm.value = false
  selected.value = null
}

async function confirmPending() {
  const p = pending.value
  if (!p || busy.value) return
  busy.value = true
  try {
    if (p.kind === 'deactivate') {
      await store.deactivateUser(p.user.id)
      toast.success(`${p.user.firstName} ya no puede iniciar sesión. Sus sesiones se cerraron.`)
    } else {
      const n = await store.revokeSessions(p.user.id)
      toast.success(n > 0 ? `Se cerraron ${n} sesiones de ${p.user.firstName}.` : `${p.user.firstName} no tenía sesiones abiertas.`)
    }
    pending.value = null
  } catch {
    // El interceptor muestra el motivo (p. ej. "debe quedar un administrador").
  } finally {
    busy.value = false
  }
}

async function reactivate(u: ManagedUser) {
  try {
    await store.reactivateUser(u.id)
    toast.success(`${u.firstName} puede volver a iniciar sesión.`)
  } catch {
    /* mensaje del interceptor */
  }
}

const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' })
function ago(iso: string) {
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  const diffH = Math.round(diffMin / 60)
  if (Math.abs(diffH) < 24) return rtf.format(diffH, 'hour')
  return rtf.format(Math.round(diffH / 24), 'day')
}

const sessionsLabel = (n: number) => (n === 1 ? '1 abierta' : `${n} abiertas`)

const confirmText = computed(() => {
  const p = pending.value
  if (!p) return { title: '', message: '', action: '' }
  return p.kind === 'deactivate'
    ? {
        title: 'Dar de baja',
        message: `${p.user.firstName} ${p.user.lastName} perderá el acceso de inmediato y se cerrarán sus sesiones. Su historial (ventas, turnos) se conserva. Podrás reactivarlo después.`,
        action: 'Sí, dar de baja',
      }
    : {
        title: 'Cerrar sesiones',
        message: `Se cerrará la sesión de ${p.user.firstName} en todos los dispositivos. Podrá volver a entrar con su contraseña.`,
        action: 'Cerrar sesiones',
      }
})
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <div class="page-header">
      <div class="min-w-0">
        <h1 class="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
          <Icon name="ph:users-three-bold" class="shrink-0 text-primary-600 dark:text-primary-400" /> Usuarios
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quién puede entrar al sistema y con qué rol.
          <NuxtLink to="/settings/permissions" class="font-medium text-primary-600 hover:underline dark:text-primary-400">Ver qué permite cada rol</NuxtLink>
        </p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn-primary" @click="openCreate">
          <Icon name="ph:plus-bold" class="mr-2" /> Nuevo usuario
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-3 sm:gap-4 md:flex-row">
      <div class="relative flex-1">
        <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" type="search" placeholder="Buscar por nombre, usuario o correo…" aria-label="Buscar usuarios por nombre, usuario o correo" class="input-base pl-10" @input="onSearch" />
      </div>
      <select v-model="store.filters.isActive" aria-label="Filtrar por estado" class="input-base cursor-pointer md:w-48" @change="onStatus">
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Dados de baja</option>
      </select>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <!-- Carga / error / vacío: una sola vez para la tabla y las tarjetas. -->
      <div v-if="store.loadError && !store.isLoading" class="p-8 text-center" role="alert">
        <Icon name="ph:cloud-slash-fill" class="mx-auto h-10 w-10 text-error-500" />
        <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.loadError.mensaje }}</p>
        <button type="button" class="btn-primary mx-auto mt-4" @click="store.fetchUsers()">Reintentar</button>
      </div>

      <div v-else-if="store.isLoading" class="px-6 py-10 text-center text-gray-500 dark:text-gray-400" aria-busy="true">
        <Icon name="ph:spinner-gap-bold" class="mx-auto mb-2 h-8 w-8 animate-spin text-primary-500" />
        Cargando usuarios…
      </div>

      <div v-else-if="store.users.length === 0" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
        <Icon name="ph:users-duotone" class="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
        <template v-if="store.filters.query">
          Ningún usuario coincide con la búsqueda.
        </template>
        <template v-else>No hay usuarios con este filtro.</template>
      </div>

      <template v-else>
        <!-- Tableta / laptop: tabla -->
        <div class="table-wrap hidden @4xl:block">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                <th scope="col" class="px-4 py-4 lg:px-6">Usuario</th>
                <th scope="col" class="px-4 py-4 lg:px-6">Rol</th>
                <th scope="col" class="px-4 py-4 lg:px-6">Estado</th>
                <th scope="col" class="px-4 py-4 lg:px-6">Sesiones</th>
                <th scope="col" class="px-4 py-4 text-right lg:px-6">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="u in store.users" :key="u.id" class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="px-4 py-4 lg:px-6">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold uppercase text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" aria-hidden="true">
                      {{ u.firstName.charAt(0) }}{{ u.lastName.charAt(0) }}
                    </div>
                    <div class="min-w-0">
                      <p class="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                        {{ u.firstName }} {{ u.lastName }}
                        <span v-if="u.id === me" class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-600 dark:bg-gray-700 dark:text-gray-300">Tú</span>
                      </p>
                      <p class="truncate text-xs text-gray-500 dark:text-gray-400">@{{ u.userName }} · {{ u.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 lg:px-6">
                  <span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold" :class="roleMeta(u.role).badge" :title="roleMeta(u.role).summary">
                    <Icon :name="roleMeta(u.role).icon" class="h-3.5 w-3.5" /> {{ roleMeta(u.role).label }}
                  </span>
                </td>
                <td class="px-4 py-4 lg:px-6">
                  <span v-if="u.isActive" class="inline-flex items-center rounded-full border border-success-200 bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-800 dark:border-success-800/30 dark:bg-success-900/30 dark:text-success-400">
                    <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-success-500" /> Activo
                  </span>
                  <span v-else class="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-gray-500" /> De baja
                  </span>
                </td>
                <td class="px-4 py-4 text-sm lg:px-6">
                  <template v-if="u.sessions && u.sessions.active > 0">
                    <p class="font-medium text-gray-800 dark:text-gray-100">{{ sessionsLabel(u.sessions.active) }}</p>
                    <p v-if="u.sessions.lastSeenAt" class="text-xs text-gray-500 dark:text-gray-400">Actividad {{ ago(u.sessions.lastSeenAt) }}</p>
                  </template>
                  <span v-else class="text-xs text-gray-400">Sin sesiones</span>
                </td>
                <td class="px-4 py-4 lg:px-6">
                  <div class="flex justify-end gap-1">
                    <button type="button" class="rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30" :aria-label="`Editar a ${u.firstName}`" title="Editar" @click="openEdit(u)">
                      <Icon name="ph:pencil-simple-bold" class="h-5 w-5" />
                    </button>
                    <button
                      v-if="u.id !== me && (u.sessions?.active ?? 0) > 0"
                      type="button"
                      class="rounded-lg p-2 text-warning-600 hover:bg-warning-50 dark:text-warning-400 dark:hover:bg-warning-900/30"
                      :aria-label="`Cerrar sesiones de ${u.firstName}`"
                      title="Cerrar sesiones"
                      @click="pending = { kind: 'revoke', user: u }"
                    >
                      <Icon name="ph:sign-out-bold" class="h-5 w-5" />
                    </button>
                    <button
                      v-if="u.isActive && u.id !== me"
                      type="button"
                      class="rounded-lg p-2 text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/30"
                      :aria-label="`Dar de baja a ${u.firstName}`"
                      title="Dar de baja"
                      @click="pending = { kind: 'deactivate', user: u }"
                    >
                      <Icon name="ph:user-minus-bold" class="h-5 w-5" />
                    </button>
                    <button
                      v-if="!u.isActive"
                      type="button"
                      class="rounded-lg p-2 text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-900/30"
                      :aria-label="`Reactivar a ${u.firstName}`"
                      title="Reactivar"
                      @click="reactivate(u)"
                    >
                      <Icon name="ph:user-check-bold" class="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Celular: tarjetas con lo esencial y acciones con texto -->
        <ul class="card-list @4xl:hidden">
          <li v-for="u in store.users" :key="u.id" class="card-item space-y-3">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold uppercase text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" aria-hidden="true">
                {{ u.firstName.charAt(0) }}{{ u.lastName.charAt(0) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-gray-900 dark:text-white">
                  <span class="min-w-0 break-words">{{ u.firstName }} {{ u.lastName }}</span>
                  <span v-if="u.id === me" class="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-600 dark:bg-gray-700 dark:text-gray-300">Tú</span>
                </p>
                <p class="truncate text-xs text-gray-500 dark:text-gray-400">@{{ u.userName }}</p>
                <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ u.email }}</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold" :class="roleMeta(u.role).badge">
                <Icon :name="roleMeta(u.role).icon" class="h-3.5 w-3.5" /> {{ roleMeta(u.role).label }}
              </span>
              <span v-if="u.isActive" class="inline-flex items-center rounded-full border border-success-200 bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-800 dark:border-success-800/30 dark:bg-success-900/30 dark:text-success-400">
                <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-success-500" /> Activo
              </span>
              <span v-else class="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-gray-500" /> De baja
              </span>
            </div>

            <div class="card-row">
              <span class="card-label">Sesiones</span>
              <span v-if="u.sessions && u.sessions.active > 0" class="text-right text-gray-800 dark:text-gray-100">
                {{ sessionsLabel(u.sessions.active) }}
                <span v-if="u.sessions.lastSeenAt" class="block text-xs text-gray-500 dark:text-gray-400">Actividad {{ ago(u.sessions.lastSeenAt) }}</span>
              </span>
              <span v-else class="text-xs text-gray-400">Sin sesiones</span>
            </div>

            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn-secondary min-h-10 flex-1 gap-1.5 whitespace-nowrap text-sm" :aria-label="`Editar a ${u.firstName}`" @click="openEdit(u)">
                <Icon name="ph:pencil-simple-bold" class="h-4 w-4" /> Editar
              </button>
              <button
                v-if="u.id !== me && (u.sessions?.active ?? 0) > 0"
                type="button"
                class="btn-secondary min-h-10 flex-1 gap-1.5 whitespace-nowrap text-sm !text-warning-700 dark:!text-warning-400"
                :aria-label="`Cerrar sesiones de ${u.firstName}`"
                @click="pending = { kind: 'revoke', user: u }"
              >
                <Icon name="ph:sign-out-bold" class="h-4 w-4" /> Cerrar sesiones
              </button>
              <button
                v-if="u.isActive && u.id !== me"
                type="button"
                class="btn-secondary min-h-10 flex-1 gap-1.5 whitespace-nowrap text-sm !text-error-600 dark:!text-error-400"
                :aria-label="`Dar de baja a ${u.firstName}`"
                @click="pending = { kind: 'deactivate', user: u }"
              >
                <Icon name="ph:user-minus-bold" class="h-4 w-4" /> Dar de baja
              </button>
              <button
                v-if="!u.isActive"
                type="button"
                class="btn-secondary min-h-10 flex-1 gap-1.5 whitespace-nowrap text-sm !text-success-700 dark:!text-success-400"
                :aria-label="`Reactivar a ${u.firstName}`"
                @click="reactivate(u)"
              >
                <Icon name="ph:user-check-bold" class="h-4 w-4" /> Reactivar
              </button>
            </div>
          </li>
        </ul>
      </template>

      <div v-if="store.pagination.totalPages > 1" class="px-4 pb-4 sm:px-6">
        <Pagination :pagination="store.pagination" @page-change="goTo" />
      </div>
    </div>

    <UserFormModal v-if="showForm" :user-to-edit="selected" :current-user-id="me" @close="closeForm" />

    <ConfirmModal
      v-if="pending"
      :title="confirmText.title"
      :message="confirmText.message"
      :confirm-text="confirmText.action"
      cancel-text="Cancelar"
      :type="pending.kind === 'deactivate' ? 'danger' : 'warning'"
      :is-loading="busy"
      @confirm="confirmPending"
      @cancel="pending = null"
    />
  </div>
</template>
