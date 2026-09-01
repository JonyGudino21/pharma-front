import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useNuxtApp } from '#app'
import type { ApiResponse } from '~/types/auth'
import type {
  Company,
  CompanyProfile,
  PrintChannel,
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

  async function fetchProfile() {
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
      return profile.value
    } finally {
      isLoading.value = false
    }
  }

  async function ensureProfile() {
    if (profile.value) return profile.value
    return fetchProfile()
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
  ) {
    const { $api } = useNuxtApp()
    const res = await $api<ApiResponse<SaleReceiptPrint>>(`/sales/${saleId}/prints`, {
      method: 'POST',
      body: { channel, templateId },
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
    },
  }
}
