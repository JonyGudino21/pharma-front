<template>
  <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
      
      <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon :name="isEditing ? 'ph:tag-duotone' : 'ph:tag-plus-duotone'" class="text-primary-600" />
          {{ isEditing ? 'Editar Categoría' : 'Nueva Categoría' }}
        </h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto">
        <form id="categoryForm" @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="label-base">Nombre de la Categoría *</label>
            <input 
              v-model="form.name" 
              type="text" 
              required 
              class="input-base" 
              placeholder="Ej: Analgésicos" 
            />
          </div>

          <div>
            <label class="label-base flex justify-between">
              Descripción
              <span class="text-xs font-normal" :class="form.description.length > 500 ? 'text-error-500' : 'text-gray-400'">
                {{ form.description.length }}/500
              </span>
            </label>
            <textarea 
              v-model="form.description" 
              rows="3" 
              class="input-base resize-none" 
              placeholder="Descripción breve..."
            ></textarea>
          </div>

          <div class="flex items-center gap-2 mt-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
            <input v-model="form.isActive" type="checkbox" id="isActiveCat" class="w-4 h-4 text-primary-600 rounded border-gray-300" />
            <label for="isActiveCat" class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Categoría Activa (Visible en catálogo)
            </label>
          </div>
        </form>
      </div>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3">
        <button type="button" @click="$emit('close')" class="btn-secondary">Cancelar</button>
        <button 
          type="submit" 
          form="categoryForm" 
          :disabled="isSubmitting || form.description.length > 500" 
          class="btn-primary"
        >
          <Icon v-if="isSubmitting" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useCategoryStore } from '~/stores/category'
import { useToast } from '~/composables/useToast'
import type { Category } from '~/stores/category'

const props = defineProps<{ categoryToEdit?: Category | null }>()
const emit = defineEmits(['close'])

const store = useCategoryStore()
const toast = useToast()

const isEditing = ref(false)
const isSubmitting = ref(false)

const form = reactive({
  name: '',
  description: '',
  isActive: true
})

onMounted(() => {
  if (props.categoryToEdit) {
    isEditing.value = true
    form.name = props.categoryToEdit.name
    form.description = props.categoryToEdit.description || ''
    form.isActive = props.categoryToEdit.isActive
  }
})

async function handleSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    if (isEditing.value && props.categoryToEdit) {
      await store.updateCategory(props.categoryToEdit.id, form)
      toast.success('Categoría actualizada exitosamente.')
    } else {
      await store.createCategory(form)
      toast.success('Categoría creada exitosamente.')
    }
    emit('close')
  } catch (error: any) {
    // Si el backend lanza un 400 por duplicidad, el Interceptor mostrará el Toast rojo.
    // Nosotros solo evitamos que el modal se cierre para que el usuario cambie el nombre.
    console.error("Error guardando categoría")
  } finally {
    isSubmitting.value = false
  }
}
</script>