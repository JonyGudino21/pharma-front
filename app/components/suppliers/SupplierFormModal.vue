<template>
  <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
      
      <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon :name="isEditing ? 'ph:buildings-bold' : 'ph:buildings-bold'" class="text-primary-600" />
          {{ isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor' }}
        </h2>
        <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1">
        <form id="supplierForm" @submit.prevent="handleSubmit" class="space-y-5">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="sm:col-span-2">
              <label class="label-base">Razón Social o Nombre *</label>
              <input v-model="form.name" type="text" required class="input-base" placeholder="Ej: Distribuidora Médica S.A." />
            </div>

            <div>
              <label class="label-base">Nombre del Contacto <span class="text-xs text-gray-400">(Opcional)</span></label>
              <input v-model="form.contact" type="text" class="input-base" placeholder="Ej: Dr. Roberto Gómez" />
            </div>

            <div>
              <label class="label-base">Teléfono <span class="text-xs text-gray-400">(Opcional)</span></label>
              <div class="relative">
                <Icon name="ph:phone-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input v-model="form.phone" type="tel" class="input-base pl-10" placeholder="353 100 99 88" />
              </div>
            </div>

            <div>
              <label class="label-base">Correo Electrónico <span class="text-xs text-gray-400">(Opcional pero único)</span></label>
              <div class="relative">
                <Icon name="ph:envelope-simple-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input v-model="form.email" type="email" class="input-base pl-10" placeholder="ventas@distribuidora.com" />
              </div>
            </div>

            <div>
              <label class="label-base">Días de Crédito *</label>
              <div class="relative">
                <Icon name="ph:calendar-blank-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input v-model.number="form.creditDays" type="number" min="0" required class="input-base pl-10" placeholder="0" />
              </div>
              <p class="text-xs text-gray-500 mt-1">Días límite para pagar facturas (0 = Contado).</p>
            </div>
          </div>

          <div v-if="isEditing" class="flex items-center gap-2 mt-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
            <input v-model="form.isActive" type="checkbox" id="isActiveSup" class="w-4 h-4 text-primary-600 rounded border-gray-300" />
            <label for="isActiveSup" class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Proveedor Activo
            </label>
          </div>

        </form>
      </div>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3 shrink-0">
        <button type="button" @click="$emit('close')" class="btn-secondary">Cancelar</button>
        <button type="submit" form="supplierForm" :disabled="isSubmitting" class="btn-primary min-w-[140px]">
          <Icon v-if="isSubmitting" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useSupplierStore } from '~/stores/supplier'
import { useToast } from '~/composables/useToast'
import type { Supplier, CreateSupplierPayload } from '~/stores/supplier'

const props = defineProps<{ supplierToEdit?: Supplier | null }>()
const emit = defineEmits(['close'])

const store = useSupplierStore()
const toast = useToast()

const isEditing = ref(false)
const isSubmitting = ref(false)

const form = reactive({
  name: '',
  contact: '',
  phone: '',
  email: '',
  creditDays: 0,
  isActive: true
})

onMounted(() => {
  if (props.supplierToEdit) {
    isEditing.value = true
    form.name = props.supplierToEdit.name
    form.contact = props.supplierToEdit.contact || ''
    form.phone = props.supplierToEdit.phone || ''
    form.email = props.supplierToEdit.email || ''
    form.creditDays = props.supplierToEdit.creditDays
    form.isActive = props.supplierToEdit.isActive
  }
})

async function handleSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    const payload = {
      name: form.name.trim(),
      contact: form.contact.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      creditDays: form.creditDays,
      isActive: form.isActive
    }

    if (isEditing.value && props.supplierToEdit) {
      await store.updateSupplier(props.supplierToEdit.id, payload)
      toast.success('Proveedor actualizado exitosamente.')
    } else {
      const { isActive, ...payloadData } = payload
      await store.createSupplier(payloadData as CreateSupplierPayload)
      toast.success('Proveedor registrado exitosamente.')
    }
    emit('close')
  } catch (error: any) {
    // Interceptor atrapa el 409 Email Duplicado
    console.error("Error al guardar proveedor")
  } finally {
    isSubmitting.value = false
  }
}
</script>