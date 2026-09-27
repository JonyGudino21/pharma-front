import { computed, reactive, ref } from 'vue'
import type {
  Company,
  ReceiptBlock,
  ReceiptCharset,
  ReceiptSaleView,
  ReceiptTemplate,
} from '~/types/receipt'
import { DEFAULT_RECEIPT_LAYOUT, REQUIRED_RECEIPT_BLOCKS } from '~/types/receipt'
import { useCompanyStore } from '~/stores/company'
import { useToast } from '~/composables/useToast'
import { rfcError } from '~/utils/rfc'

/** Campos editables de la ficha de la farmacia. */
export interface CompanyForm {
  legalName: string
  tradeName: string
  rfc: string
  fiscalRegime: string
  address: string
  phone: string
  email: string
  logoUrl: string
  ticketFooter: string
}

/** Campos editables de una plantilla de ticket. */
export interface TemplateForm {
  name: string
  paperWidthMm: 58 | 80
  fontScale: 1 | 2
  charset: ReceiptCharset
  showLogo: boolean
  showTaxId: boolean
  showAddress: boolean
  showPhone: boolean
  blocks: ReceiptBlock[]
}

export type CompanyErrors = Partial<Record<keyof CompanyForm, string>>

const emptyCompany = (): CompanyForm => ({
  legalName: '',
  tradeName: '',
  rfc: '',
  fiscalRegime: '',
  address: '',
  phone: '',
  email: '',
  logoUrl: '',
  ticketFooter: '',
})

const emptyTemplate = (): TemplateForm => ({
  name: '',
  paperWidthMm: 58,
  fontScale: 1,
  charset: 'ascii',
  showLogo: true,
  showTaxId: true,
  showAddress: true,
  showPhone: true,
  blocks: [...DEFAULT_RECEIPT_LAYOUT.blocks],
})

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Estado de la pantalla de ticket.
 *
 * ─── POR QUÉ UN COMPOSABLE ───
 * La página anterior tenía 640 líneas con formulario, reglas, guardado y estilos
 * mezclados. Aquí vive la LÓGICA (qué cambió, qué es válido, qué se guarda) y
 * los componentes sólo pintan. Así cada regla —por ejemplo "no se puede quitar
 * el bloque de totales"— está en un solo sitio y se puede leer entera.
 *
 * ─── CAMBIOS PENDIENTES ───
 * Se guarda una "foto" de lo que hay en el servidor y se compara con lo que se
 * está editando. Eso permite:
 *   - un ÚNICO botón de guardar que manda sólo lo que cambió;
 *   - avisar antes de cambiar de plantilla o de salir de la pantalla.
 * La pantalla anterior tenía dos botones separados, y al cambiar de plantilla
 * se perdía lo editado sin avisar.
 */
export function useTicketStudio() {
  const store = useCompanyStore()
  const toast = useToast()

  const company = reactive<CompanyForm>(emptyCompany())
  const template = reactive<TemplateForm>(emptyTemplate())
  const templateId = ref<number | null>(null)

  // Fotos de lo guardado, para detectar cambios.
  const savedCompany = ref(JSON.stringify(emptyCompany()))
  const savedTemplate = ref(JSON.stringify(emptyTemplate()))

  const saving = ref(false)
  const loadError = ref<string | null>(null)

  // ── Carga ────────────────────────────────────────────────────────────────

  function fromCompany(c: Company | null): CompanyForm {
    if (!c) return emptyCompany()
    return {
      legalName: c.legalName ?? '',
      tradeName: c.tradeName ?? '',
      rfc: c.rfc ?? '',
      fiscalRegime: c.fiscalRegime ?? '',
      address: c.address ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      logoUrl: c.logoUrl ?? '',
      ticketFooter: c.ticketFooter ?? '',
    }
  }

  function fromTemplate(t: ReceiptTemplate | null): TemplateForm {
    if (!t) return emptyTemplate()
    return {
      name: t.name,
      paperWidthMm: t.paperWidthMm === 80 ? 80 : 58,
      fontScale: t.fontScale === 2 ? 2 : 1,
      charset: t.layout?.charset === 'cp850' ? 'cp850' : 'ascii',
      showLogo: t.showLogo,
      showTaxId: t.showTaxId,
      showAddress: t.showAddress,
      showPhone: t.showPhone,
      blocks: [...(t.layout?.blocks?.length ? t.layout.blocks : DEFAULT_RECEIPT_LAYOUT.blocks)],
    }
  }

  function applyCompany(c: Company | null) {
    const f = fromCompany(c)
    Object.assign(company, f)
    savedCompany.value = JSON.stringify(f)
  }

  function applyTemplate(t: ReceiptTemplate | null) {
    const f = fromTemplate(t)
    templateId.value = t?.id ?? null
    Object.assign(template, f)
    template.blocks = [...f.blocks]
    savedTemplate.value = JSON.stringify(f)
  }

  async function load() {
    loadError.value = null
    try {
      await store.fetchProfile()
      applyCompany(store.company)
      const current =
        store.activeTemplates.find((t) => t.id === templateId.value) ?? store.defaultTemplate
      applyTemplate(current)
    } catch {
      loadError.value =
        'No pudimos cargar la configuración del ticket. Revisa la conexión con el servidor y vuelve a intentarlo.'
    }
  }

  // ── Cambios pendientes ───────────────────────────────────────────────────

  const companyDirty = computed(() => JSON.stringify(company) !== savedCompany.value)
  const templateDirty = computed(() => JSON.stringify(template) !== savedTemplate.value)
  const dirty = computed(() => companyDirty.value || templateDirty.value)

  function discard() {
    Object.assign(company, JSON.parse(savedCompany.value) as CompanyForm)
    const t = JSON.parse(savedTemplate.value) as TemplateForm
    Object.assign(template, t)
    template.blocks = [...t.blocks]
  }

  // ── Validación ───────────────────────────────────────────────────────────

  const companyErrors = computed<CompanyErrors>(() => {
    const e: CompanyErrors = {}
    if (!company.tradeName.trim()) e.tradeName = 'El nombre comercial encabeza cada ticket: no puede quedar vacío.'
    if (!company.legalName.trim()) e.legalName = 'La razón social es obligatoria.'
    const rfc = rfcError(company.rfc)
    if (rfc) e.rfc = rfc
    if (company.email.trim() && !EMAIL.test(company.email.trim())) e.email = 'Escribe un correo válido, por ejemplo contacto@farmacia.mx.'
    if (company.logoUrl.trim() && !/^https?:\/\//i.test(company.logoUrl.trim())) {
      e.logoUrl = 'La dirección del logo debe empezar con http:// o https://.'
    }
    return e
  })

  const templateErrors = computed(() => {
    const e: { name?: string } = {}
    if (!template.name.trim()) e.name = 'Ponle un nombre a la plantilla para reconocerla en la lista.'
    return e
  })

  const valid = computed(
    () => Object.keys(companyErrors.value).length === 0 && Object.keys(templateErrors.value).length === 0,
  )

  // ── Bloques ──────────────────────────────────────────────────────────────

  const isRequired = (b: ReceiptBlock) => REQUIRED_RECEIPT_BLOCKS.includes(b)

  /** Todos los bloques en el orden del ticket; los apagados al final. */
  const orderedBlocks = computed(() => {
    const off = DEFAULT_RECEIPT_LAYOUT.blocks.filter((b) => !template.blocks.includes(b))
    return [...template.blocks, ...off]
  })

  function toggleBlock(b: ReceiptBlock) {
    if (isRequired(b)) return
    const i = template.blocks.indexOf(b)
    if (i >= 0) template.blocks.splice(i, 1)
    else template.blocks.push(b)
  }

  /** Mueve un bloque ENCENDIDO una posición. Los apagados no tienen posición. */
  function moveBlock(b: ReceiptBlock, delta: -1 | 1) {
    const i = template.blocks.indexOf(b)
    const j = i + delta
    if (i < 0 || j < 0 || j >= template.blocks.length) return
    const next = [...template.blocks]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    template.blocks = next
  }

  /** Arrastrar y soltar: coloca `from` donde está `to`. */
  function dropBlock(from: ReceiptBlock, to: ReceiptBlock) {
    const i = template.blocks.indexOf(from)
    const j = template.blocks.indexOf(to)
    if (i < 0 || j < 0 || i === j) return
    const next = [...template.blocks]
    next.splice(i, 1)
    next.splice(j, 0, from)
    template.blocks = next
  }

  // ── Objetos "vivos" para la vista previa ─────────────────────────────────

  const liveCompany = computed<Company>(() => ({
    id: store.company?.id ?? 0,
    legalName: company.legalName,
    tradeName: company.tradeName,
    rfc: company.rfc.toUpperCase(),
    fiscalRegime: company.fiscalRegime || null,
    address: company.address,
    phone: company.phone || null,
    email: company.email || null,
    logoUrl: company.logoUrl || null,
    ticketFooter: company.ticketFooter || null,
  }))

  const current = computed(() => store.templates.find((t) => t.id === templateId.value) ?? null)

  const liveTemplate = computed<ReceiptTemplate>(() => ({
    id: templateId.value ?? 0,
    companyId: store.company?.id ?? 0,
    name: template.name,
    paperWidthMm: template.paperWidthMm,
    fontScale: template.fontScale,
    showLogo: template.showLogo,
    showTaxId: template.showTaxId,
    showAddress: template.showAddress,
    showPhone: template.showPhone,
    layout: { blocks: [...template.blocks], charset: template.charset },
    isDefault: current.value?.isDefault ?? false,
    isActive: true,
  }))

  /**
   * Venta de muestra. Nombres con acentos y uno largo a propósito: son
   * justo los casos que la térmica maneja distinto (tildes y renglones que
   * se parten), y así se ven en la vista previa antes de imprimir.
   */
  const sampleSale = computed<ReceiptSaleView>(() => ({
    id: 1024,
    invoiceNumber: 'FAC-20260926-001024',
    createdAt: new Date().toISOString(),
    flowStatus: 'COMPLETED',
    items: [
      { quantity: 2, name: 'Paracetamol 500 mg c/10', unitPrice: 38, subtotal: 76 },
      { quantity: 1, name: 'Suero oral sabor limón 625 ml', unitPrice: 24.5, subtotal: 24.5 },
      { quantity: 1, name: 'Ibuprofeno infantil suspensión 100 mg/5 ml fco. 120 ml', unitPrice: 89.9, subtotal: 89.9 },
    ],
    subtotal: 190.4,
    total: 190.4,
    paidAmount: 200,
    balance: 0,
    payments: [{ method: 'Efectivo', amount: 200 }],
    clientName: 'Público General',
    clientRfc: null,
    cashierName: 'Ana Martínez',
    note: null,
    copyNumber: 1,
  }))

  // ── Guardado ─────────────────────────────────────────────────────────────

  async function save(): Promise<boolean> {
    if (!dirty.value || saving.value) return false
    if (!valid.value) {
      toast.warning('Revisa los campos marcados antes de guardar.')
      return false
    }

    saving.value = true
    try {
      // En orden y sólo lo que cambió. Si la ficha falla, no se toca la
      // plantilla: el usuario ve un error y conserva TODO lo que editó.
      if (companyDirty.value) {
        await store.saveCompany({
          legalName: company.legalName.trim(),
          tradeName: company.tradeName.trim(),
          rfc: company.rfc.trim().toUpperCase(),
          fiscalRegime: company.fiscalRegime.trim() || null,
          address: company.address.trim(),
          phone: company.phone.trim() || null,
          email: company.email.trim() || null,
          logoUrl: company.logoUrl.trim() || null,
          ticketFooter: company.ticketFooter.trim() || null,
        })
        savedCompany.value = JSON.stringify(company)
      }

      if (templateDirty.value && templateId.value !== null) {
        await store.saveTemplate(templateId.value, {
          name: template.name.trim(),
          paperWidthMm: template.paperWidthMm,
          fontScale: template.fontScale,
          showLogo: template.showLogo,
          showTaxId: template.showTaxId,
          showAddress: template.showAddress,
          showPhone: template.showPhone,
          layout: { blocks: [...template.blocks], charset: template.charset },
        })
        savedTemplate.value = JSON.stringify(template)
      }

      toast.success('Cambios guardados. El POS ya imprime con esta configuración.')
      return true
    } catch {
      // El interceptor ya mostró el mensaje del servidor. Lo editado se queda
      // en pantalla para corregirlo, no se pierde.
      return false
    } finally {
      saving.value = false
    }
  }

  // ── Plantillas ───────────────────────────────────────────────────────────

  /** Cambia de plantilla. Quien llama decide qué hacer si hay cambios. */
  function selectTemplate(id: number) {
    const t = store.activeTemplates.find((x) => x.id === id) ?? null
    applyTemplate(t)
  }

  async function createTemplate(paperWidthMm: 58 | 80) {
    try {
      const created = await store.createTemplate({
        name: `Térmica ${paperWidthMm} mm`,
        paperWidthMm,
        fontScale: template.fontScale,
        showLogo: template.showLogo,
        showTaxId: template.showTaxId,
        showAddress: template.showAddress,
        showPhone: template.showPhone,
        layout: { blocks: [...template.blocks], charset: template.charset },
        isDefault: false,
      })
      applyTemplate(store.activeTemplates.find((t) => t.id === created.id) ?? created)
      toast.success(`Plantilla de ${paperWidthMm} mm creada a partir de la actual.`)
    } catch {
      /* el interceptor ya avisó */
    }
  }

  async function makeDefault() {
    if (templateId.value === null) return
    try {
      await store.setDefault(templateId.value)
      toast.success('El POS imprimirá con esta plantilla a partir de ahora.')
    } catch {
      /* el interceptor ya avisó */
    }
  }

  async function deactivate() {
    if (templateId.value === null) return
    if (store.activeTemplates.length <= 1) {
      toast.warning('Debe quedar al menos una plantilla activa.')
      return
    }
    if (current.value?.isDefault) {
      toast.warning('Primero elige otra plantilla para el POS; no se puede desactivar la que está en uso.')
      return
    }
    try {
      await store.deactivateTemplate(templateId.value)
      applyTemplate(store.defaultTemplate)
      toast.success('Plantilla desactivada.')
    } catch {
      /* el interceptor ya avisó */
    }
  }

  return {
    store,
    company,
    template,
    templateId,
    current,
    saving,
    loadError,
    companyDirty,
    templateDirty,
    dirty,
    companyErrors,
    templateErrors,
    valid,
    orderedBlocks,
    isRequired,
    liveCompany,
    liveTemplate,
    sampleSale,
    load,
    discard,
    save,
    toggleBlock,
    moveBlock,
    dropBlock,
    selectTemplate,
    createTemplate,
    makeDefault,
    deactivate,
  }
}
