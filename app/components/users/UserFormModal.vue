<template>
  <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      
      <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon :name="isEditing ? 'ph:user-pencil-bold' : 'ph:user-plus-bold'" class="text-primary-600" />
          {{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1">
        <form id="userForm" @submit.prevent="handleSubmit" class="space-y-4">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label-base">Nombre(s)</label>
              <input v-model="form.firstName" type="text" required class="input-base" placeholder="Juan" />
            </div>
            <div>
              <label class="label-base">Apellidos</label>
              <input v-model="form.lastName" type="text" required class="input-base" placeholder="Pérez" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label-base">Nombre de Usuario (Único)</label>
              <input v-model="form.userName" type="text" required class="input-base" placeholder="jperez" />
            </div>
            <div>
              <label class="label-base">Correo Electrónico (Único)</label>
              <input v-model="form.email" type="email" required class="input-base" placeholder="juan@farmacia.com" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label-base">Rol del Sistema</label>
              <select v-model="form.role" required class="input-base cursor-pointer">
                <option value="CASHIER">Cajero (POS)</option>
                <option value="PHARMACIST">Farmacéutico</option>
                <option value="MANAGER">Gerente</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            
            <div>
              <label class="label-base flex justify-between">
                Contraseña
                <span v-if="isEditing" class="text-xs text-warning-500 font-normal">(Opcional)</span>
              </label>
              <input 
                v-model="form.password" 
                type="password" 
                :required="!isEditing" 
                class="input-base" 
                :placeholder="isEditing ? 'Dejar en blanco para mantener actual' : '••••••••'" 
              />
            </div>
          </div>

          <div v-if="isEditing" class="flex items-center gap-2 mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
            <input v-model="form.isActive" type="checkbox" id="isActive" class="w-4 h-4 text-primary-600 rounded border-gray-300" />
            <label for="isActive" class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Usuario Activo (Puede iniciar sesión)
            </label>
          </div>

        </form>
      </div>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3">
        <button type="button" @click="$emit('close')" class="btn-secondary">Cancelar</button>
        <button type="submit" form="userForm" :disabled="isSubmitting" class="btn-primary">
          <Icon v-if="isSubmitting" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          {{ isSubmitting ? 'Guardando...' : 'Guardar Usuario' }}
        </button>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserManagementStore } from '~/stores/userManagement'
import { useToast } from '~/composables/useToast'
import type { User } from '~/types/auth'

const props = defineProps<{
  userToEdit?: User | null
}>()

const emit = defineEmits(['close'])

const store = useUserManagementStore()
const toast = useToast()

const isEditing = ref(false)
const isSubmitting = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
  role: 'CASHIER',
  password: '',
  isActive: true
})

onMounted(() => {
  if (props.userToEdit) {
    isEditing.value = true
    form.firstName = props.userToEdit.firstName
    form.lastName = props.userToEdit.lastName
    form.userName = props.userToEdit.userName
    form.email = props.userToEdit.email
    form.role = props.userToEdit.role
    form.isActive = props.userToEdit.isActive
  }
})

async function handleSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    if (isEditing.value && props.userToEdit) {
      await store.updateUser(props.userToEdit.id, form)
      toast.success('Usuario actualizado exitosamente.')
    } else {
      const { isActive, ...userData } = form
      await store.createUser(userData)
      toast.success('Usuario creado exitosamente.')
    }
    emit('close') // Solo cerramos si el backend responde 200/201
  } catch (error: any) {
    // El interceptor ya lanza el Toast de error (ej. "El email ya está en uso" 409)
    // Nosotros solo detenemos el spinner y dejamos el modal abierto para que el usuario corrija.
    console.error("Error guardando usuario")
  } finally {
    isSubmitting.value = false
  }
}
</script>