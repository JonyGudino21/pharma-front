import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useNuxtApp } from '#app'
import type { ApiResponse } from '~/types/auth'
import type {
  Company,
  CompanyProfile,
  PrintChannel,
  PrintDocument,
  ReceiptTemplate,
  SaleReceiptPrint,
} from '~/types/receipt'
import { DEFAULT_RECEIPT_LAYOUT } from '~/types/receipt'

export const useCompanyStore = defineStore('company', () => {
  const profile = ref<CompanyProfile | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)

  const company = computed(() => profile.value?.company ?? null)
  const templates = computed(() => profile.value?.templates ?? [])
  const defaultTemplate = computed(() => profile.value?.defaultTemplate ?? null)
  const activeTemplates = computed(() => templates.value.filter((t) => t.isActive))

  /** Cuándo se trajo la ficha por última vez (ms), para no pedirla de más. */
  const fetchedAt = ref(0)
  let refreshing: Promise<CompanyProfile> | null = null

  async function fetchProfile(): Promise<CompanyProfile> {
    const { $api } = useNuxtApp()
    isLoading.value = true
    try {
      const res = await $api<ApiResponse<CompanyProfile>>('/company')
      profile.value = {
        ...res.data,
        templates: res.data.templates.map(normalizeTemplate),
        defaultTemplate: res.data.defaultTemplate
          ? normalizeTemplate(res.data.defaultTemplate)
          : null,
      }
      fetchedAt.value = Date.now()
      return profile.value
    } finally {
      isLoading.value = false
    }
  }

  async function ensureProfile() {
    if (profile.value) return profile.value
    return fetchProfile()
  }

  /**
   * Vuelve a pedir la ficha si la que hay tiene más de `minIntervalMs`.
   *
   * `ensureProfile` devuelve la copia en memoria para siempre: si otra caja (u
   * otra pestaña) cambiaba el RFC o la plantilla en Configuración, el POS seguía
   * imprimiendo los datos viejos hasta recargar. El POS llama a esto al abrirse
   * y al recuperar el foco; el intervalo mínimo evita una petición por cada
   * alt-tab del cajero.
   */
  async function refreshProfileIfStale(minIntervalMs = 60_000) {
    if (profile.value && Date.now() - fetchedAt.value < minIntervalMs) return profile.value
    // Montaje y foco casi simultáneos comparten la petición. No se comparte con
    // `fetchProfile` de los guardados: ésos deben leer DESPUÉS de su PATCH.
    refreshing ??= fetchProfile().finally(() => (refreshing = null))
    return refreshing
  }

  async function saveCompany(patch: Partial<Company>) {
    const { $api } = useNuxtApp()
    isSaving.value = true
    try {
      await $api<ApiResponse<Company>>('/company', {
        method: 'PATCH',
        body: patch,
      })
      await fetchProfile()
    } finally {
      isSaving.value = false
    }
  }

  async function saveTemplate(id: number, patch: Partial<ReceiptTemplate>) {
    const { $api } = useNuxtApp()
    isSaving.value = true
    try {
      await $api<ApiResponse<ReceiptTemplate>>(`/company/templates/${id}`, {
        method: 'PATCH',
        body: patch,
      })
      await fetchProfile()
    } finally {
      isSaving.value = false
    }
  }

  async function createTemplate(body: Partial<ReceiptTemplate> & { name: string }) {
    const { $api } = useNuxtApp()
    isSaving.value = true
    try {
      const res = await $api<ApiResponse<ReceiptTemplate>>('/company/templates', {
        method: 'POST',
        body,
      })
      await fetchProfile()
      return res.data
    } finally {
      isSaving.value = false
    }
  }

  async function setDefault(id: number) {
    const { $api } = useNuxtApp()
    isSaving.value = true
    try {
      await $api(`/company/templates/${id}/default`, { method: 'POST' })
      await fetchProfile()
    } finally {
      isSaving.value = false
    }
  }

  async function deactivateTemplate(id: number) {
    const { $api } = useNuxtApp()
    isSaving.value = true
    try {
      await $api(`/company/templates/${id}`, { method: 'DELETE' })
      await fetchProfile()
    } finally {
      isSaving.value = false
    }
  }

  async function registerPrint(
    saleId: number,
    channel: PrintChannel,
    templateId?: number,
    document: PrintDocument = 'TICKET',
  ) {
    const { $api } = useNuxtApp()
    const res = await $api<ApiResponse<SaleReceiptPrint>>(`/sales/${saleId}/prints`, {
      method: 'POST',
      body: { channel, templateId, document },
    })
    return res.data
  }

  return {
    profile,
    isLoading,
    isSaving,
    company,
    templates,
    defaultTemplate,
    activeTemplates,
    fetchProfile,
    ensureProfile,
    refreshProfileIfStale,
    saveCompany,
    saveTemplate,
    createTemplate,
    setDefault,
    deactivateTemplate,
    registerPrint,
  }
})

function normalizeTemplate(t: ReceiptTemplate): ReceiptTemplate {
  const blocks = t.layout?.blocks
  return {
    ...t,
    layout: {
      blocks: Array.isArray(blocks) && blocks.length > 0
        ? blocks
        : [...DEFAULT_RECEIPT_LAYOUT.blocks],
      // Las plantillas anteriores a la opción de charset no la traen.
      charset: t.layout?.charset === 'cp850' ? 'cp850' : 'ascii',
    },
  }
}
