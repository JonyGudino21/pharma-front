<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useUserManagementStore, type ManagedUser } from '~/stores/userManagement'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import { roleMeta } from '~/utils/roles'
import UserFormModal from '~/components/users/UserFormModal.vue'
import ConfirmModal from '~/components/shared/ConfirmModal.vue'

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
  <div class="space-y-6">
    <div class="flex flex-col items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Icon name="ph:users-three-bold" class="text-primary-600" /> Usuarios
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quién puede entrar al sistema y con qué rol.
          <NuxtLink to="/settings/permissions" class="font-medium text-primary-600 hover:underline dark:text-primary-400">Ver qué permite cada rol</NuxtLink>
        </p>
      </div>
      <button type="button" class="btn-primary shrink-0" @click="openCreate">
        <Icon name="ph:plus-bold" class="mr-2" /> Nuevo usuario
      </button>
    </div>

    <div class="flex flex-col gap-4 md:flex-row">
      <div class="relative flex-1">
        <Icon name="ph:magnifying-glass-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" type="search" placeholder="Buscar por usuario o correo…" aria-label="Buscar usuarios" class="input-base pl-10" @input="onSearch" />
      </div>
      <select v-model="store.filters.isActive" aria-label="Filtrar por estado" class="input-base cursor-pointer md:w-48" @change="onStatus">
        <option value="">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Dados de baja</option>
      </select>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div v-if="store.loadError && !store.isLoading" class="p-8 text-center" role="alert">
        <Icon name="ph:cloud-slash-fill" class="mx-auto h-10 w-10 text-error-500" />
        <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.loadError.mensaje }}</p>
        <button type="button" class="btn-primary mx-auto mt-4" @click="store.fetchUsers()">Reintentar</button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
              <th scope="col" class="px-6 py-4">Usuario</th>
              <th scope="col" class="px-6 py-4">Rol</th>
              <th scope="col" class="px-6 py-4">Estado</th>
              <th scope="col" class="px-6 py-4">Sesiones</th>
              <th scope="col" class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-if="store.isLoading">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                <Icon name="ph:spinner-gap-bold" class="mx-auto mb-2 h-8 w-8 animate-spin text-primary-500" />
                Cargando usuarios…
              </td>
            </tr>
            <tr v-else-if="store.users.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                <Icon name="ph:users-duotone" class="mx-auto mb-3 h-12 w-12 text-gray-400" />
                {{ store.filters.query ? 'Ningún usuario coincide con la búsqueda.' : 'No hay usuarios con este filtro.' }}
              </td>
            </tr>
            <tr v-for="u in store.isLoading ? [] : store.users" :key="u.id" class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td class="px-6 py-4">
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
              <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold" :class="roleMeta(u.role).badge" :title="roleMeta(u.role).summary">
                  <Icon :name="roleMeta(u.role).icon" class="h-3.5 w-3.5" /> {{ roleMeta(u.role).label }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span v-if="u.isActive" class="inline-flex items-center rounded-full border border-success-200 bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-800 dark:border-success-800/30 dark:bg-success-900/30 dark:text-success-400">
                  <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-success-500" /> Activo
                </span>
                <span v-else class="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-gray-500" /> De baja
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <template v-if="u.sessions && u.sessions.active > 0">
                  <p class="font-medium text-gray-800 dark:text-gray-100">{{ u.sessions.active === 1 ? '1 abierta' : `${u.sessions.active} abiertas` }}</p>
                  <p v-if="u.sessions.lastSeenAt" class="text-xs text-gray-500">Actividad {{ ago(u.sessions.lastSeenAt) }}</p>
                </template>
                <span v-else class="text-xs text-gray-400">Sin sesiones</span>
              </td>
              <td class="px-6 py-4">
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

      <div v-if="store.pagination.totalPages > 1" class="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/20">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Página {{ store.pagination.page }} de {{ store.pagination.totalPages }} ({{ store.pagination.total }} usuarios)
        </span>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary px-3 py-1 text-sm disabled:opacity-50" :disabled="store.pagination.page <= 1" @click="goTo(store.pagination.page - 1)">Anterior</button>
          <button type="button" class="btn-secondary px-3 py-1 text-sm disabled:opacity-50" :disabled="store.pagination.page >= store.pagination.totalPages" @click="goTo(store.pagination.page + 1)">Siguiente</button>
        </div>
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
