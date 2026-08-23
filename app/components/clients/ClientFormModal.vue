<template>
  <div v-if="modelValue" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
      
      <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon :name="isEditing ? 'ph:users-bold' : 'ph:user-plus-bold'" class="text-primary-600" />
          {{ isEditing ? 'Editar Cliente' : 'Nuevo Cliente' }}
        </h2>
        <button @click="close" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1">
        <form id="clientForm" @submit.prevent="handleSubmit" class="space-y-5">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="sm:col-span-2">
              <label class="label-base">Nombre Completo o Razón Social *</label>
              <input v-model="form.name" type="text" required class="input-base" placeholder="Ej: Juan Pérez / Farmacia San José" />
            </div>

            <div>
              <label class="label-base">Teléfono <span class="text-xs text-gray-400">(Opcional)</span></label>
              <div class="relative">
                <Icon name="ph:phone-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input v-model="form.phone" type="tel" class="input-base pl-10" placeholder="+52 55 1234 5678" />
              </div>
            </div>

            <div>
              <label class="label-base">Correo Electrónico <span class="text-xs text-gray-400">(Único)</span></label>
              <div class="relative">
                <Icon name="ph:envelope-simple-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input v-model="form.email" type="email" class="input-base pl-10" placeholder="cliente@correo.com" />
              </div>
            </div>

            <div>
              <label class="label-base">RFC <span class="text-xs text-gray-400">(Único)</span></label>
              <input v-model="form.rfc" type="text" class="input-base uppercase" placeholder="XAXX010101000" />
            </div>

            <div>
              <label class="label-base">CURP <span class="text-xs text-gray-400">(Opcional)</span></label>
              <input v-model="form.curp" type="text" class="input-base uppercase" placeholder="18 Caracteres" />
            </div>

            <div class="sm:col-span-2">
              <label class="label-base">Dirección Completa <span class="text-xs text-gray-400">(Opcional)</span></label>
              <textarea v-model="form.address" rows="2" class="input-base resize-none" placeholder="Calle, Número, Colonia, Ciudad, CP..."></textarea>
            </div>
          </div>

          <div v-if="isEditing" class="flex items-center gap-2 mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
            <input v-model="form.isActive" type="checkbox" id="isActiveClient" class="w-4 h-4 text-primary-600 rounded border-gray-300" />
            <label for="isActiveClient" class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Cliente Activo
            </label>
          </div>

        </form>
      </div>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3 shrink-0">
        <button type="button" @click="close" class="btn-secondary">Cancelar</button>
        <button type="submit" form="clientForm" :disabled="store.isActionLoading" class="btn-primary min-w-[140px]">
          <Icon v-if="store.isActionLoading" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          {{ store.isActionLoading ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useClientStore, type Client } from '~/stores/client'
import { useToast } from '~/composables/useToast'

const props = defineProps<{ modelValue: boolean, clientToEdit?: Client | null }>()
const emit = defineEmits(['update:modelValue'])

const store = useClientStore()
const toast = useToast()

const isEditing = computed(() => !!props.clientToEdit)

const form = reactive({
  name: '',
  phone: '',
  email: '',
  rfc: '',
  curp: '',
  address: '',
  isActive: true
})

watch(() => props.modelValue, (val) => {
  if (val && props.clientToEdit) {
    const c = props.clientToEdit
    form.name = c.name
    form.phone = c.phone || ''
    form.email = c.email || ''
    form.rfc = c.rfc || ''
    form.curp = c.curp || ''
    form.address = c.address || ''
    form.isActive = c.isActive
  } else if (!val) {
    form.name = ''
    form.phone = ''
    form.email = ''
    form.rfc = ''
    form.curp = ''
    form.address = ''
    form.isActive = true
  }
})

async function handleSubmit() {
  try {
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      rfc: form.rfc.trim().toUpperCase() || undefined,
      curp: form.curp.trim().toUpperCase() || undefined,
      address: form.address.trim() || undefined,
      // isActive: form.isActive
    }

    if (isEditing.value && props.clientToEdit) {
      await store.updateClient(props.clientToEdit.id, payload)
      toast.success('Cliente actualizado exitosamente.')
    } else {
      await store.createClient(payload)
      toast.success('Cliente registrado exitosamente.')
    }
    close()
  } catch (error: any) {
    console.error("Error al guardar cliente")
    // El interceptor atrapará el 409 Email/RFC Duplicado y mostrará el Toast
  }
}

const close = () => emit('update:modelValue', false)
</script>