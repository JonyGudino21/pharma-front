<template>
  <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      
      <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon :name="isEditing ? 'ph:package-bold' : 'ph:plus-circle-bold'" class="text-primary-600" />
            {{ isEditing ? 'Editar Producto' : 'Registrar Nuevo Producto' }}
          </h2>
          <p v-if="isEditing" class="text-sm text-gray-500 font-mono mt-1">SKU: {{ productToEdit?.sku }}</p>
        </div>
        <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Icon name="ph:x-bold" class="w-6 h-6" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1">
        <form id="productForm" @submit.prevent="handleSubmit" class="space-y-6">
          
          <div class="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
            <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Icon name="ph:info-bold" /> Información Básica
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="label-base">Nombre del Producto *</label>
                <input v-model="form.name" type="text" required class="input-base" placeholder="Ej: Paracetamol" />
              </div>
              
              <div>
                <label class="label-base">Concentración <span class="text-xs text-gray-400">(Opcional)</span></label>
                <input v-model="form.strength" type="text" class="input-base" placeholder="Ej: 500mg" />
              </div>
              <div>
                <label class="label-base">Forma Farmacéutica <span class="text-xs text-gray-400">(Opcional)</span></label>
                <input v-model="form.format" type="text" class="input-base" placeholder="Ej: Tabletas, Jarabe" />
              </div>
              <div class="md:col-span-2">
                <label class="label-base">Presentación Comercial <span class="text-xs text-gray-400">(Opcional)</span></label>
                <input v-model="form.presentation" type="text" class="input-base" placeholder="Ej: Caja con 20 tabletas adulto" />
              </div>
              <div class="md:col-span-2">
                <label class="label-base">Descripción <span class="text-xs text-gray-400">(Opcional)</span></label>
                <textarea v-model="form.description" rows="2" class="input-base resize-none" placeholder="Analgésico y antipirético..."></textarea>
              </div>
            </div>
            <p class="text-xs text-primary-600 dark:text-primary-400 mt-3 flex items-center gap-1">
              <Icon name="ph:magic-wand-bold" /> El backend generará un SKU único basado en estos datos al guardar.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label-base">Código de Barras <span class="text-xs text-gray-400">(Opcional pero único)</span></label>
              <div class="relative">
                <Icon name="ph:barcode-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input v-model="form.barcode" type="text" class="input-base pl-10 font-mono" placeholder="7501234567890" />
              </div>
            </div>
            
            <div class="flex items-center gap-2 p-4 bg-error-50 dark:bg-error-900/10 rounded-lg border border-error-100 dark:border-error-800/30 h-[42px] self-end mb-[2px]">
              <input v-model="form.controlled" type="checkbox" id="controlled" class="w-4 h-4 text-error-600 rounded border-error-300" />
              <label for="controlled" class="text-sm font-bold text-error-700 dark:text-error-400 cursor-pointer">
                Medicamento Controlado (Receta Obligatoria)
              </label>
            </div>

            <div>
              <label class="label-base">Costo de Compra * <span class="text-xs text-gray-400">(MXN)</span></label>
              <div class="relative">
                <Icon name="ph:currency-dollar-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input v-model.number="form.cost" type="number" step="0.01" min="0.01" required class="input-base pl-10" />
              </div>
            </div>

            <div>
              <label class="label-base">Precio de Venta * <span class="text-xs text-gray-400">(MXN)</span></label>
              <div class="relative">
                <Icon name="ph:tag-bold" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input v-model.number="form.price" type="number" step="0.01" min="0.01" required class="input-base pl-10" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div v-if="!isEditing">
                <label class="label-base text-success-600 dark:text-success-400">Stock Inicial Físico <span class="text-xs">(Generará movimiento)</span></label>
                <input v-model.number="form.stock" type="number" min="0" class="input-base border-success-200 focus:ring-success-500" />
              </div>
              <div v-else class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p class="text-xs text-gray-500">Stock Actual en Sistema</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">{{ productToEdit?.stock || 0 }} unidades</p>
                <p class="text-xs text-gray-400 mt-1">Para modificar stock, usa Ajustes de Inventario o Compras.</p>
              </div>

              <div>
                <label class="label-base">Stock Mínimo (Alerta) *</label>
                <input v-model.number="form.minStock" type="number" min="0" required class="input-base" />
              </div>
            </div>

            <div>
              <label class="label-base">Clasificación (Categorías)</label>
              <div class="border border-gray-300 dark:border-gray-600 rounded-lg p-3 h-40 overflow-y-auto bg-white dark:bg-gray-800">
                <div v-if="categoryStore.categories.length === 0" class="text-sm text-gray-500 text-center py-4">
                  No hay categorías activas. Crea una primero.
                </div>
                <div v-else class="space-y-2">
                  <label v-for="cat in categoryStore.categories" :key="cat.id" class="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors">
                    <input v-model="form.categories" :value="cat.id" type="checkbox" class="w-4 h-4 text-primary-600 rounded border-gray-300" />
                    <span class="text-sm text-gray-700 dark:text-gray-200">{{ cat.name }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div v-if="isEditing" class="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <input v-model="form.isActive" type="checkbox" id="isActiveProd" class="w-4 h-4 text-primary-600 rounded border-gray-300" />
            <label for="isActiveProd" class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Producto Activo (Visible en Catálogo y POS)
            </label>
          </div>

        </form>
      </div>

      <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3 shrink-0">
        <button type="button" @click="$emit('close')" class="btn-secondary">Cancelar</button>
        <button type="submit" form="productForm" :disabled="isSubmitting" class="btn-primary min-w-[140px]">
          <Icon v-if="isSubmitting" name="ph:spinner-gap-bold" class="animate-spin mr-2" />
          {{ isSubmitting ? 'Guardando...' : 'Guardar Producto' }}
        </button>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useProductStore } from '~/stores/product'
import { useCategoryStore } from '~/stores/category'
import { useToast } from '~/composables/useToast'
import type { Product } from '~/stores/product'

const props = defineProps<{ productToEdit?: Product | null }>()
const emit = defineEmits(['close'])

const store = useProductStore()
const categoryStore = useCategoryStore()
const toast = useToast()

const isEditing = ref(false)
const isSubmitting = ref(false)

const form = reactive({
  name: '',
  description: '',
  strength: '',
  format: '',
  presentation: '',
  barcode: '',
  categories: [] as number[],
  controlled: false,
  stock: 0,
  minStock: 5,
  price: '' as number | string, // Permite que el input empiece vacío
  cost: '' as number | string,
  isActive: true
})

onMounted(async () => {
  // Cargamos categorías activas para el selector
  if (categoryStore.categories.length === 0) {
    categoryStore.filters.isActive = 'true'
    await categoryStore.fetchCategories(1)
  }

  if (props.productToEdit) {
    isEditing.value = true
    const p = props.productToEdit
    form.name = p.name
    form.description = p.description || ''
    form.strength = p.strength || ''
    form.format = p.format || ''
    form.presentation = p.presentation || ''
    form.barcode = p.barcode || ''
    form.controlled = p.controlled
    form.minStock = p.minStock
    form.price = Number(p.price)
    form.cost = Number(p.cost)
    form.isActive = p.isActive
    form.categories = p.categories.map(c => c.id)
  }
})

async function handleSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    // Validamos que precio y costo sean numéricos
    const priceNum = Number(form.price)
    const costNum = Number(form.cost)
    
    if (priceNum <= 0 || costNum <= 0) {
      toast.warning("El precio y el costo deben ser mayores a 0")
      return
    }

    const payload = {
      ...form,
      price: priceNum,
      cost: costNum,
      // Limpiamos strings vacíos para que no viajen como "" sino como undefined
      barcode: form.barcode.trim() || undefined,
      description: form.description.trim() || undefined,
      strength: form.strength.trim() || undefined,
      format: form.format.trim() || undefined,
      presentation: form.presentation.trim() || undefined,
    }

    if (isEditing.value && props.productToEdit) {
      // En PATCH no mandamos stock (es regla del negocio)
      const { stock, ...patchPayload } = payload
      await store.updateProduct(props.productToEdit.id, patchPayload)
      toast.success('Producto actualizado exitosamente.')
    } else {
      await store.createProduct(payload as any)
      toast.success('Producto registrado exitosamente. SKU generado.')
    }
    emit('close')
  } catch (error: any) {
    console.error("Error al guardar producto")
  } finally {
    isSubmitting.value = false
  }
}
</script>