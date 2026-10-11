<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserManagementStore, type RolePermissions } from '~/stores/userManagement'
import { describirFallo } from '~/composables/useRequestState'
import { roleMeta } from '~/utils/roles'
import { KNOWN_PERMISSION_KEYS, PERMISSION_GROUPS, type PermissionGroup } from '~/utils/permission-labels'

definePageMeta({ requiredPermission: 'canManageUsers' })

/**
 * PERMISOS POR ROL (sólo lectura).
 *
 * La matriz viene del servidor —la misma función que decide `/auth/me`—, así
 * que lo que se ve aquí es exactamente lo que el sistema concede. Los permisos
 * son por rol, no por persona: para cambiar lo que alguien puede hacer, se
 * cambia su rol en Usuarios.
 */
const store = useUserManagementStore()
const matrix = ref<RolePermissions[] | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    matrix.value = await store.fetchRolesMatrix()
  } catch (e) {
    error.value = describirFallo(e).mensaje
  } finally {
    loading.value = false
  }
}
onMounted(load)

/** Grupos conocidos + "Otros" con cualquier permiso nuevo del servidor. */
const groups = computed<PermissionGroup[]>(() => {
  const first = matrix.value?.[0]
  if (!first) return [...PERMISSION_GROUPS]
  const unknown = Object.keys(first.permissions).filter((k) => !KNOWN_PERMISSION_KEYS.has(k))
  return unknown.length
    ? [...PERMISSION_GROUPS, { title: 'Otros', icon: 'ph:dots-three-bold', items: unknown.map((k) => ({ key: k, label: k })) }]
    : [...PERMISSION_GROUPS]
})

const allows = (row: RolePermissions, key: string) => row.permissions[key] === true
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h1 class="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
        <Icon name="ph:shield-check-bold" class="text-primary-600" /> Permisos por rol
      </h1>
      <p class="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        Qué puede hacer cada rol. Los permisos se asignan por rol: para cambiar lo que puede hacer una persona,
        <NuxtLink to="/settings/users" class="font-medium text-primary-600 hover:underline dark:text-primary-400">cambia su rol en Usuarios</NuxtLink>.
      </p>
    </div>

    <div v-if="loading && !matrix" class="h-96 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" aria-busy="true" />

    <div v-else-if="error" class="rounded-2xl border border-error-500/40 bg-white p-8 text-center dark:bg-gray-800" role="alert">
      <Icon name="ph:cloud-slash-fill" class="mx-auto h-10 w-10 text-error-500" />
      <p class="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ error }}</p>
      <button type="button" class="btn-primary mx-auto mt-4" @click="load">Reintentar</button>
    </div>

    <div v-else-if="matrix" class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] border-collapse text-sm">
          <caption class="sr-only">Permisos concedidos a cada rol</caption>
          <thead class="sticky top-0 z-10 bg-white dark:bg-gray-800">
            <tr class="border-b border-gray-100 dark:border-gray-700">
              <th scope="col" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Permiso</th>
              <th v-for="row in matrix" :key="row.role" scope="col" class="w-32 px-3 py-4 text-center">
                <span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold" :class="roleMeta(row.role).badge">
                  <Icon :name="roleMeta(row.role).icon" class="h-3.5 w-3.5" /> {{ roleMeta(row.role).label }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody v-for="g in groups" :key="g.title">
            <tr class="bg-gray-50 dark:bg-gray-900/40">
              <th :colspan="matrix.length + 1" scope="rowgroup" class="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <span class="inline-flex items-center gap-1.5"><Icon :name="g.icon" class="h-4 w-4" /> {{ g.title }}</span>
              </th>
            </tr>
            <tr v-for="item in g.items" :key="item.key" class="border-t border-gray-50 dark:border-gray-700/60">
              <th scope="row" class="px-5 py-2.5 text-left font-normal text-gray-700 dark:text-gray-200">{{ item.label }}</th>
              <td v-for="row in matrix" :key="row.role" class="px-3 py-2.5 text-center">
                <Icon
                  v-if="allows(row, item.key)"
                  name="ph:check-circle-fill"
                  class="mx-auto h-5 w-5 text-success-500"
                  :aria-label="`${roleMeta(row.role).label}: sí`"
                />
                <Icon
                  v-else
                  name="ph:minus"
                  class="mx-auto h-4 w-4 text-gray-300 dark:text-gray-600"
                  :aria-label="`${roleMeta(row.role).label}: no`"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
