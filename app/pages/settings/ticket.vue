<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Company, ReceiptBlock, ReceiptSaleView, ReceiptTemplate } from '~/types/receipt'
import { DEFAULT_RECEIPT_LAYOUT } from '~/types/receipt'
import ReceiptPreview from '~/components/receipt/ReceiptPreview.vue'

definePageMeta({ requiredPermission: 'canManageCompany' })

const store = useCompanyStore()
const toast = useToast()

const BLOCKS: { id: ReceiptBlock; label: string; locked?: boolean }[] = [
  { id: 'header', label: 'Encabezado de la farmacia' },
  { id: 'meta', label: 'Folio, fecha y cliente' },
  { id: 'items', label: 'Líneas de producto', locked: true },
  { id: 'totals', label: 'Totales', locked: true },
  { id: 'payments', label: 'Forma de pago' },
  { id: 'footer', label: 'Pie y leyenda fiscal' },
]

const companyForm = reactive({
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

const selectedTemplateId = ref<number | null>(null)

const templateForm = reactive({
  name: '',
  paperWidthMm: 58 as number,
  showLogo: true,
  showTaxId: true,
  showAddress: true,
  showPhone: true,
  fontScale: 1 as number,
  blocks: [...DEFAULT_RECEIPT_LAYOUT.blocks] as ReceiptBlock[],
})

const selectedTemplate = computed(
  () => store.templates.find((t) => t.id === selectedTemplateId.value) ?? store.defaultTemplate,
)

onMounted(async () => {
  await store.fetchProfile()
  hydrateCompany()
  hydrateTemplate(store.defaultTemplate)
})

watch(
  () => store.company,
  () => hydrateCompany(),
)

function hydrateCompany() {
  const c = store.company
  if (!c) return
  companyForm.legalName = c.legalName
  companyForm.tradeName = c.tradeName
  companyForm.rfc = c.rfc
  companyForm.fiscalRegime = c.fiscalRegime ?? ''
  companyForm.address = c.address
  companyForm.phone = c.phone ?? ''
  companyForm.email = c.email ?? ''
  companyForm.logoUrl = c.logoUrl ?? ''
  companyForm.ticketFooter = c.ticketFooter ?? ''
}

function hydrateTemplate(t: ReceiptTemplate | null) {
  if (!t) return
  selectedTemplateId.value = t.id
  templateForm.name = t.name
  templateForm.paperWidthMm = t.paperWidthMm
  templateForm.showLogo = t.showLogo
  templateForm.showTaxId = t.showTaxId
  templateForm.showAddress = t.showAddress
  templateForm.showPhone = t.showPhone
  templateForm.fontScale = t.fontScale
  templateForm.blocks = [...(t.layout?.blocks ?? DEFAULT_RECEIPT_LAYOUT.blocks)]
}

const liveCompany = computed<Company>(() => ({
  id: store.company?.id ?? 0,
  legalName: companyForm.legalName,
  tradeName: companyForm.tradeName,
  rfc: companyForm.rfc,
  fiscalRegime: companyForm.fiscalRegime || null,
  address: companyForm.address,
  phone: companyForm.phone || null,
  email: companyForm.email || null,
  logoUrl: companyForm.logoUrl || null,
  ticketFooter: companyForm.ticketFooter || null,
}))

const liveTemplate = computed<ReceiptTemplate>(() => ({
  id: selectedTemplate.value?.id ?? 0,
  companyId: store.company?.id ?? 0,
  name: templateForm.name,
  paperWidthMm: templateForm.paperWidthMm,
  showLogo: templateForm.showLogo,
  showTaxId: templateForm.showTaxId,
  showAddress: templateForm.showAddress,
  showPhone: templateForm.showPhone,
  fontScale: templateForm.fontScale,
  layout: { blocks: templateForm.blocks },
  isDefault: selectedTemplate.value?.isDefault ?? true,
  isActive: true,
}))

const previewSale = computed<ReceiptSaleView>(() => ({
  id: 1001,
  invoiceNumber: 'FAC-20260831-001001',
  createdAt: new Date().toISOString(),
  flowStatus: 'COMPLETED',
  items: [
    { quantity: 2, name: 'Paracetamol 500 mg c/10', unitPrice: 38, subtotal: 76 },
    { quantity: 1, name: 'Suero oral 625 ml', unitPrice: 24.5, subtotal: 24.5 },
  ],
  subtotal: 100.5,
  total: 100.5,
  paidAmount: 100.5,
  balance: 0,
  payments: [{ method: 'Efectivo', amount: 100.5 }],
  clientName: 'Público General',
  clientRfc: null,
  cashierName: 'Ana Cajero',
  note: null,
  copyNumber: 1,
}))

function toggleBlock(id: ReceiptBlock) {
  const locked = BLOCKS.find((b) => b.id === id)?.locked
  if (locked) return
  const i = templateForm.blocks.indexOf(id)
  if (i >= 0) templateForm.blocks.splice(i, 1)
  else {
    const order = DEFAULT_RECEIPT_LAYOUT.blocks
    const next = [...templateForm.blocks, id].sort(
      (a, b) => order.indexOf(a) - order.indexOf(b),
    )
    templateForm.blocks = next
  }
}

async function saveCompany() {
  await store.saveCompany({
    legalName: companyForm.legalName,
    tradeName: companyForm.tradeName,
    rfc: companyForm.rfc,
    fiscalRegime: companyForm.fiscalRegime || null,
    address: companyForm.address,
    phone: companyForm.phone || null,
    email: companyForm.email || null,
    logoUrl: companyForm.logoUrl || null,
    ticketFooter: companyForm.ticketFooter || null,
  })
  toast.success('Ficha de la farmacia guardada')
}

async function saveTemplate() {
  if (!selectedTemplate.value) return
  await store.saveTemplate(selectedTemplate.value.id, {
    name: templateForm.name,
    paperWidthMm: templateForm.paperWidthMm,
    showLogo: templateForm.showLogo,
    showTaxId: templateForm.showTaxId,
    showAddress: templateForm.showAddress,
    showPhone: templateForm.showPhone,
    fontScale: templateForm.fontScale,
    layout: { blocks: templateForm.blocks },
  })
  toast.success('Plantilla de ticket guardada')
}

async function makeDefault() {
  if (!selectedTemplate.value) return
  await store.setDefault(selectedTemplate.value.id)
  toast.success('Esta plantilla se usará en el POS')
}

async function add80mm() {
  const created = await store.createTemplate({
    name: 'Térmica 80 mm',
    paperWidthMm: 80,
    isDefault: false,
    layout: { blocks: [...templateForm.blocks] },
  })
  hydrateTemplate(created as ReceiptTemplate)
  toast.success('Plantilla de 80 mm creada')
}

async function deactivate() {
  if (!selectedTemplate.value) return
  if (store.activeTemplates.length <= 1) {
    toast.warning('Debe quedar al menos una plantilla activa')
    return
  }
  await store.deactivateTemplate(selectedTemplate.value.id)
  hydrateTemplate(store.defaultTemplate)
  toast.success('Plantilla desactivada')
}

const has80 = computed(() =>
  store.activeTemplates.some((t) => t.paperWidthMm === 80),
)
</script>

<template>
  <div class="ticket-studio">
    <header class="ticket-studio__hero">
      <p class="ticket-studio__eyebrow">Taller de ticket</p>
      <h1>El papel que sale de la caja</h1>
      <p>
        Lo que ves a la derecha es exactamente lo que imprime el POS.
        Cambia el nombre de la farmacia, el ancho y los bloques: el preview se mueve contigo.
      </p>
    </header>

    <div v-if="store.isLoading && !store.company" class="ticket-studio__loading">
      Cargando ficha de la farmacia…
    </div>

    <div v-else class="ticket-studio__grid">
      <div class="ticket-studio__forms">
        <section class="ticket-studio__card">
          <h2>Ficha fiscal</h2>
          <div class="ticket-studio__fields">
            <label>
              Nombre comercial
              <input v-model="companyForm.tradeName" maxlength="120" />
            </label>
            <label>
              Razón social
              <input v-model="companyForm.legalName" maxlength="160" />
            </label>
            <label>
              RFC
              <input
                v-model="companyForm.rfc"
                maxlength="13"
                class="uppercase"
                placeholder="XAXX010101000"
                @input="companyForm.rfc = companyForm.rfc.toUpperCase()"
              />
            </label>
            <label>
              Régimen fiscal
              <input v-model="companyForm.fiscalRegime" maxlength="80" placeholder="612 — Personas Físicas con AF" />
            </label>
            <label class="ticket-studio__span">
              Domicilio
              <input v-model="companyForm.address" maxlength="300" />
            </label>
            <label>
              Teléfono
              <input v-model="companyForm.phone" maxlength="30" />
            </label>
            <label>
              Correo
              <input v-model="companyForm.email" type="email" maxlength="120" />
            </label>
            <label class="ticket-studio__span">
              Logo (URL)
              <input v-model="companyForm.logoUrl" placeholder="https://…" />
            </label>
            <label class="ticket-studio__span">
              Pie del ticket
              <textarea v-model="companyForm.ticketFooter" rows="3" maxlength="500" />
            </label>
          </div>
          <button class="ticket-studio__save" :disabled="store.isSaving" @click="saveCompany">
            Guardar ficha
          </button>
        </section>

        <section class="ticket-studio__card">
          <div class="ticket-studio__card-head">
            <h2>Plantilla</h2>
            <select
              v-if="store.activeTemplates.length > 1"
              :value="selectedTemplateId ?? ''"
              @change="hydrateTemplate(store.templates.find((t) => t.id === Number(($event.target as HTMLSelectElement).value)) ?? null)"
            >
              <option v-for="t in store.activeTemplates" :key="t.id" :value="t.id">
                {{ t.name }}{{ t.isDefault ? ' · POS' : '' }}
              </option>
            </select>
          </div>

          <label>
            Nombre
            <input v-model="templateForm.name" maxlength="80" />
          </label>

          <p class="ticket-studio__label">Ancho del rollo</p>
          <div class="ticket-studio__segment">
            <button
              type="button"
              :class="{ 'is-on': templateForm.paperWidthMm === 58 }"
              @click="templateForm.paperWidthMm = 58"
            >
              58 mm
            </button>
            <button
              type="button"
              :class="{ 'is-on': templateForm.paperWidthMm === 80 }"
              @click="templateForm.paperWidthMm = 80"
            >
              80 mm
            </button>
          </div>

          <p class="ticket-studio__label">Tipografía</p>
          <div class="ticket-studio__segment">
            <button
              type="button"
              :class="{ 'is-on': templateForm.fontScale === 1 }"
              @click="templateForm.fontScale = 1"
            >
              Compacta
            </button>
            <button
              type="button"
              :class="{ 'is-on': templateForm.fontScale === 2 }"
              @click="templateForm.fontScale = 2"
            >
              Grande
            </button>
          </div>

          <ul class="ticket-studio__toggles">
            <li>
              <label><input v-model="templateForm.showLogo" type="checkbox" /> Cruz o logo</label>
            </li>
            <li>
              <label><input v-model="templateForm.showTaxId" type="checkbox" /> RFC</label>
            </li>
            <li>
              <label><input v-model="templateForm.showAddress" type="checkbox" /> Domicilio</label>
            </li>
            <li>
              <label><input v-model="templateForm.showPhone" type="checkbox" /> Teléfono</label>
            </li>
          </ul>

          <p class="ticket-studio__label">Bloques del ticket</p>
          <ul class="ticket-studio__toggles">
            <li v-for="block in BLOCKS" :key="block.id">
              <label :class="{ 'is-locked': block.locked }">
                <input
                  type="checkbox"
                  :checked="templateForm.blocks.includes(block.id)"
                  :disabled="block.locked"
                  @change="toggleBlock(block.id)"
                />
                {{ block.label }}
              </label>
            </li>
          </ul>

          <div class="ticket-studio__actions">
            <button class="ticket-studio__save" :disabled="store.isSaving" @click="saveTemplate">
              Guardar plantilla
            </button>
            <button
              v-if="selectedTemplate && !selectedTemplate.isDefault"
              class="ticket-studio__ghost"
              :disabled="store.isSaving"
              @click="makeDefault"
            >
              Usar en el POS
            </button>
            <button
              v-if="!has80"
              class="ticket-studio__ghost"
              :disabled="store.isSaving"
              @click="add80mm"
            >
              Crear 80 mm
            </button>
            <button
              v-if="store.activeTemplates.length > 1"
              class="ticket-studio__danger"
              :disabled="store.isSaving"
              @click="deactivate"
            >
              Desactivar
            </button>
          </div>
        </section>
      </div>

      <aside class="ticket-studio__stage">
        <div class="ticket-studio__cutter" aria-hidden="true" />
        <ReceiptPreview :sale="previewSale" :company="liveCompany" :template="liveTemplate" />
        <p class="ticket-studio__hint">Vista previa en vivo · original de muestra</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.ticket-studio {
  --counter: #12261e;
  --brass: #c4a35a;
  --paper-glow: rgba(243, 230, 196, 0.18);
  margin: -1rem -1rem -1.5rem;
  min-height: calc(100vh - 4rem);
  padding: 2rem 1.25rem 3rem;
  background:
    radial-gradient(1200px 400px at 80% 0%, var(--paper-glow), transparent 60%),
    var(--counter);
  color: #f3e6c4;
  font-family: Literata, Georgia, serif;
}

@media (min-width: 640px) {
  .ticket-studio {
    margin: -1.5rem -1.5rem -1.5rem;
    padding: 2.5rem 2rem 3.5rem;
  }
}

@media (min-width: 1024px) {
  .ticket-studio {
    margin: -2rem -2rem -2rem;
    padding: 2.5rem 2.5rem 4rem;
  }
}

.ticket-studio__hero {
  max-width: 40rem;
  margin-bottom: 2rem;
}

.ticket-studio__eyebrow {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--brass);
  margin: 0 0 0.5rem;
}

.ticket-studio__hero h1 {
  font-size: clamp(2rem, 4vw, 3.1rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0 0 0.75rem;
  color: #f7f1df;
}

.ticket-studio__hero p {
  margin: 0;
  color: #c9c0a8;
  font-size: 1.05rem;
  line-height: 1.5;
}

.ticket-studio__grid {
  display: grid;
  gap: 2rem;
}

@media (min-width: 1100px) {
  .ticket-studio__grid {
    grid-template-columns: minmax(0, 1fr) 380px;
    align-items: start;
  }
}

.ticket-studio__forms { display: flex; flex-direction: column; gap: 1.25rem; }

.ticket-studio__card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(196, 163, 90, 0.22);
  border-radius: 18px;
  padding: 1.25rem 1.35rem 1.4rem;
}

.ticket-studio__card h2 {
  font-size: 1.25rem;
  margin: 0 0 1rem;
}

.ticket-studio__card-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.ticket-studio__card-head h2 { margin: 0; }

.ticket-studio__fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
}

@media (min-width: 700px) {
  .ticket-studio__fields { grid-template-columns: 1fr 1fr; }
}

.ticket-studio__span { grid-column: 1 / -1; }

.ticket-studio label,
.ticket-studio__label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #c9c0a8;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
}

.ticket-studio input,
.ticket-studio textarea,
.ticket-studio select {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.92rem;
  text-transform: none;
  letter-spacing: 0;
  color: #1a140c;
  background: #f3e6c4;
  border: none;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
}

.ticket-studio .uppercase { text-transform: uppercase; }

.ticket-studio__segment {
  display: flex;
  gap: 0.5rem;
  margin: 0 0 1rem;
}

.ticket-studio__segment button {
  flex: 1;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.85rem;
  padding: 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(196, 163, 90, 0.4);
  background: transparent;
  color: #f3e6c4;
}

.ticket-studio__segment button.is-on {
  background: var(--brass);
  color: #12261e;
  border-color: var(--brass);
}

.ticket-studio__toggles {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
}

.ticket-studio__toggles label {
  flex-direction: row;
  align-items: center;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.92rem;
  color: #f3e6c4;
  gap: 0.55rem;
}

.ticket-studio__toggles .is-locked { opacity: 0.65; }

.ticket-studio__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.ticket-studio__save,
.ticket-studio__ghost,
.ticket-studio__danger {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.82rem;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  border: 1px solid transparent;
}

.ticket-studio__save {
  background: var(--brass);
  color: #12261e;
}

.ticket-studio__ghost {
  background: transparent;
  color: #f3e6c4;
  border-color: rgba(243, 230, 196, 0.35);
}

.ticket-studio__danger {
  background: transparent;
  color: #e8b4b4;
  border-color: rgba(232, 180, 180, 0.4);
}

.ticket-studio__stage {
  position: sticky;
  top: 5.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ticket-studio__cutter {
  width: min(340px, 100%);
  height: 14px;
  background: linear-gradient(#2a3f35, #0c1813);
  border-radius: 4px 4px 0 0;
  box-shadow: 0 8px 0 -4px #1a140c;
  clip-path: polygon(0 0, 100% 0, 100% 40%, 96% 100%, 4% 100%, 0 40%);
}

.ticket-studio__hint {
  margin-top: 1rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8f9a90;
}

.ticket-studio__loading { color: #c9c0a8; }
</style>
