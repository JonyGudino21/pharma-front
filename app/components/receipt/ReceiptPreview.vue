<script setup lang="ts">
import type { Company, ReceiptTemplate, ReceiptSaleView } from '~/types/receipt'
import { DEFAULT_RECEIPT_LAYOUT } from '~/types/receipt'
import { formatTicketDateTime } from '~/utils/receipt-view'
import { useCurrency } from '~/composables/useCurrency'
import { BRAND_MARK_SVG, PHARMA_TICKET_CSS } from '~/utils/pharma-ticket-css'

// Una sola fuente de estilo para pantalla e impresión (antes había dos copias
// que ya divergían). La clave evita inyectarla una vez por cada ticket.
useHead({ style: [{ key: 'pharma-ticket-css', innerHTML: PHARMA_TICKET_CSS }] })
const brandMark = BRAND_MARK_SVG('pharma-ticket__brandmark')

const props = withDefaults(defineProps<{
  sale: ReceiptSaleView
  company: Company | null
  template: ReceiptTemplate | null
  compact?: boolean
}>(), {
  compact: false,
})

const { formatCurrency } = useCurrency()

const blocks = computed(() => {
  const fromTemplate = props.template?.layout?.blocks
  return fromTemplate && fromTemplate.length > 0
    ? fromTemplate
    : DEFAULT_RECEIPT_LAYOUT.blocks
})

const widthPx = computed(() => {
  const mm = props.template?.paperWidthMm === 80 ? 80 : 58
  return props.compact ? (mm === 80 ? 280 : 220) : (mm === 80 ? 340 : 260)
})

const fontPx = computed(() => {
  const base = props.compact ? 11 : 13
  return (props.template?.fontScale === 2 ? base + 2 : base)
})

const stamp = computed(() => {
  if (props.sale.flowStatus === 'DRAFT') return { text: 'PREVIEW', tone: 'draft' }
  if (props.sale.copyNumber > 1) return { text: `COPIA ${props.sale.copyNumber}`, tone: 'copy' }
  if (props.sale.copyNumber === 1) return { text: 'ORIGINAL', tone: 'original' }
  return null
})

/**
 * Bloques que de verdad se pintan, EN EL ORDEN de la plantilla.
 *
 * Antes la plantilla HTML tenía el orden fijo (encabezado siempre arriba) y
 * sólo consultaba si cada bloque estaba encendido: si el usuario movía el
 * encabezado, la térmica lo imprimía donde él dijo pero esta vista no. Ahora
 * ambas siguen `layout.blocks`. "Pagos" sin pagos se omite, igual que la
 * térmica, para no dejar una raya doble.
 */
const rendered = computed(() =>
  blocks.value.filter((b) => b !== 'payments' || props.sale.payments.length > 0),
)
</script>

<template>
  <article
    class="pharma-ticket"
    :class="{ 'pharma-ticket--compact': compact }"
    :style="{ width: `${widthPx}px`, maxWidth: '100%', fontSize: `${fontPx}px` }"
  >
    <div class="pharma-ticket__serration" aria-hidden="true" />

    <div
      v-if="stamp"
      class="pharma-ticket__stamp"
      :class="`pharma-ticket__stamp--${stamp.tone}`"
    >
      {{ stamp.text }}
    </div>

    <template v-for="(block, idx) in rendered" :key="block">
    <!-- Una raya ENTRE bloques, como la térmica: nunca antes del primero. -->
    <hr v-if="idx > 0" class="pharma-ticket__dash" />

    <template v-if="block === 'header'">
      <header class="pharma-ticket__header">
        <div v-if="template?.showLogo !== false" class="pharma-ticket__mark">
          <img
            v-if="company?.logoUrl"
            :src="company.logoUrl"
            :alt="company.tradeName"
            class="pharma-ticket__logo"
          />
          <!-- eslint-disable-next-line vue/no-v-html -- SVG constante del propio código, sin datos de usuario -->
          <span v-else v-html="brandMark" />
        </div>
        <p class="pharma-ticket__trade">{{ company?.tradeName || 'Mi Farmacia' }}</p>
        <p
          v-if="company?.legalName && company.legalName !== company.tradeName"
          class="pharma-ticket__legal"
        >
          {{ company.legalName }}
        </p>
        <p v-if="template?.showTaxId !== false && company?.rfc" class="pharma-ticket__rfc">
          RFC {{ company.rfc }}
        </p>
        <!-- El régimen y el correo se capturaban en la ficha pero no salían en
             ningún ticket. Ahora acompañan al RFC y al teléfono. -->
        <p v-if="template?.showTaxId !== false && company?.fiscalRegime" class="pharma-ticket__muted">
          {{ company.fiscalRegime }}
        </p>
        <p v-if="template?.showAddress !== false && company?.address" class="pharma-ticket__muted">
          {{ company.address }}
        </p>
        <p v-if="template?.showPhone !== false && company?.phone" class="pharma-ticket__muted">
          Tel. {{ company.phone }}
        </p>
        <p v-if="template?.showPhone !== false && company?.email" class="pharma-ticket__muted">
          {{ company.email }}
        </p>
      </header>
    </template>

    <section v-else-if="block === 'meta'" class="pharma-ticket__meta">
      <p>
        <span>Folio</span>
        <strong>{{ sale.invoiceNumber || (sale.id ? `#${sale.id}` : 'SIN COBRO') }}</strong>
      </p>
      <p>
        <span>Fecha</span>
        <strong>{{ formatTicketDateTime(sale.createdAt) }}</strong>
      </p>
      <p v-if="sale.cashierName">
        <span>Atendió</span>
        <strong>{{ sale.cashierName }}</strong>
      </p>
      <p>
        <span>Cliente</span>
        <strong>{{ sale.clientName || 'Público General' }}</strong>
      </p>
      <p v-if="sale.clientRfc" class="pharma-ticket__muted">RFC {{ sale.clientRfc }}</p>
    </section>

    <section v-else-if="block === 'items'" class="pharma-ticket__items">
      <p v-if="sale.items.length === 0" class="pharma-ticket__empty">Carrito vacío</p>
      <div v-for="(item, idx) in sale.items" :key="idx" class="pharma-ticket__item">
        <p class="pharma-ticket__item-name">{{ item.quantity }} × {{ item.name }}</p>
        <p class="pharma-ticket__item-row">
          <span>{{ formatCurrency(item.unitPrice) }}</span>
          <span>{{ formatCurrency(item.subtotal + (item.discount ?? 0)) }}</span>
        </p>
        <p v-if="(item.discount ?? 0) > 0" class="pharma-ticket__item-row pharma-ticket__muted">
          <span>Descuento {{ item.discountPercent }}%</span>
          <span>−{{ formatCurrency(item.discount ?? 0) }}</span>
        </p>
      </div>
    </section>

    <section v-else-if="block === 'totals'" class="pharma-ticket__totals">
      <p>
        <span>Subtotal</span>
        <span>{{ formatCurrency(sale.subtotal) }}</span>
      </p>
      <p v-if="(sale.discountTotal ?? 0) > 0">
        <span>Descuentos</span>
        <span>−{{ formatCurrency(sale.discountTotal ?? 0) }}</span>
      </p>
      <p class="pharma-ticket__grand">
        <span>Total</span>
        <span>{{ formatCurrency(sale.total) }}</span>
      </p>
      <p v-for="row in sale.taxBreakdown ?? []" :key="row.ratePercent" class="pharma-ticket__muted">
        <span>IVA {{ row.ratePercent }}% incluido</span>
        <span>{{ formatCurrency(row.tax) }}</span>
      </p>
      <p>
        <span>Pagado</span>
        <span>{{ formatCurrency(sale.paidAmount) }}</span>
      </p>
      <p v-if="sale.balance > 0" class="pharma-ticket__balance">
        <span>Saldo</span>
        <span>{{ formatCurrency(sale.balance) }}</span>
      </p>
      <p v-if="(sale.discountTotal ?? 0) > 0" class="pharma-ticket__muted" style="justify-content: center">
        Usted ahorró {{ formatCurrency(sale.discountTotal ?? 0) }}
      </p>
    </section>

    <section v-else-if="block === 'payments'" class="pharma-ticket__pays">
      <p v-for="(pay, pIdx) in sale.payments" :key="pIdx">
        <span>{{ pay.method }}</span>
        <span>{{ formatCurrency(pay.amount) }}</span>
      </p>
    </section>

    <footer v-else-if="block === 'footer'" class="pharma-ticket__footer">
      <p v-if="sale.note">{{ sale.note }}</p>
      <p>Comprobante de venta. No es un CFDI.</p>
      <p>{{ company?.ticketFooter || 'Conserve su ticket.' }}</p>
    </footer>
    </template>

    <div class="pharma-ticket__cut" aria-hidden="true" />
  </article>
</template>

