<script setup lang="ts">
import type { Company, ReceiptTemplate, ReceiptSaleView } from '~/types/receipt'
import { DEFAULT_RECEIPT_LAYOUT } from '~/types/receipt'
import { formatTicketDateTime } from '~/utils/receipt-view'
import { useCurrency } from '~/composables/useCurrency'

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

const show = (block: string) => blocks.value.includes(block as typeof blocks.value[number])
</script>

<template>
  <article
    class="pharma-ticket"
    :class="{ 'pharma-ticket--compact': compact }"
    :style="{ width: `${widthPx}px`, fontSize: `${fontPx}px` }"
  >
    <div class="pharma-ticket__serration" aria-hidden="true" />

    <div
      v-if="stamp"
      class="pharma-ticket__stamp"
      :class="`pharma-ticket__stamp--${stamp.tone}`"
    >
      {{ stamp.text }}
    </div>

    <template v-if="show('header')">
      <header class="pharma-ticket__header">
        <div v-if="template?.showLogo !== false" class="pharma-ticket__mark">
          <img
            v-if="company?.logoUrl"
            :src="company.logoUrl"
            :alt="company.tradeName"
            class="pharma-ticket__logo"
          />
          <svg v-else class="pharma-ticket__cross" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="12" y="2" width="8" height="28" rx="1" />
            <rect x="2" y="12" width="28" height="8" rx="1" />
          </svg>
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
        <p v-if="template?.showAddress !== false && company?.address" class="pharma-ticket__muted">
          {{ company.address }}
        </p>
        <p v-if="template?.showPhone !== false && company?.phone" class="pharma-ticket__muted">
          Tel. {{ company.phone }}
        </p>
      </header>
      <hr class="pharma-ticket__dash" />
    </template>

    <section v-if="show('meta')" class="pharma-ticket__meta">
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

    <hr v-if="show('meta') && show('items')" class="pharma-ticket__dash" />

    <section v-if="show('items')" class="pharma-ticket__items">
      <p v-if="sale.items.length === 0" class="pharma-ticket__empty">Carrito vacío</p>
      <div v-for="(item, idx) in sale.items" :key="idx" class="pharma-ticket__item">
        <p class="pharma-ticket__item-name">{{ item.quantity }} × {{ item.name }}</p>
        <p class="pharma-ticket__item-row">
          <span>{{ formatCurrency(item.unitPrice) }}</span>
          <span>{{ formatCurrency(item.subtotal) }}</span>
        </p>
      </div>
    </section>

    <hr v-if="show('items') && show('totals')" class="pharma-ticket__dash" />

    <section v-if="show('totals')" class="pharma-ticket__totals">
      <p>
        <span>Subtotal</span>
        <span>{{ formatCurrency(sale.subtotal) }}</span>
      </p>
      <p class="pharma-ticket__grand">
        <span>Total</span>
        <span>{{ formatCurrency(sale.total) }}</span>
      </p>
      <p>
        <span>Pagado</span>
        <span>{{ formatCurrency(sale.paidAmount) }}</span>
      </p>
      <p v-if="sale.balance > 0" class="pharma-ticket__balance">
        <span>Saldo</span>
        <span>{{ formatCurrency(sale.balance) }}</span>
      </p>
    </section>

    <template v-if="show('payments') && sale.payments.length > 0">
      <hr class="pharma-ticket__dash" />
      <section class="pharma-ticket__pays">
        <p v-for="(pay, idx) in sale.payments" :key="idx">
          <span>{{ pay.method }}</span>
          <span>{{ formatCurrency(pay.amount) }}</span>
        </p>
      </section>
    </template>

    <template v-if="show('footer')">
      <hr class="pharma-ticket__dash" />
      <footer class="pharma-ticket__footer">
        <p v-if="sale.note">{{ sale.note }}</p>
        <p>Comprobante de venta. No es un CFDI.</p>
        <p>{{ company?.ticketFooter || 'Conserve su ticket.' }}</p>
      </footer>
    </template>

    <div class="pharma-ticket__cut" aria-hidden="true" />
  </article>
</template>

<style>
.pharma-ticket {
  --paper: #f3e6c4;
  --ink: #1a140c;
  --muted: #5c5346;
  --cross: #1f7a4d;
  --rule: #1a140c;
  position: relative;
  background: var(--paper);
  color: var(--ink);
  font-family: 'IBM Plex Mono', ui-monospace, 'Cascadia Mono', monospace;
  line-height: 1.35;
  padding: 18px 16px 22px;
  overflow: hidden;
  box-shadow:
    0 18px 40px -24px rgba(18, 38, 30, 0.7),
    inset 0 0 0 1px rgba(26, 20, 12, 0.06);
}

.pharma-ticket__serration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 10px;
  background:
    linear-gradient(135deg, transparent 50%, var(--paper) 50%) 0 0 / 10px 10px,
    linear-gradient(45deg, transparent 50%, var(--paper) 50%) 0 0 / 10px 10px;
  background-color: transparent;
  transform: translateY(-10px);
  pointer-events: none;
}

.pharma-ticket__stamp {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-18deg);
  font-weight: 700;
  font-size: 1.7em;
  letter-spacing: 0.18em;
  pointer-events: none;
  white-space: nowrap;
  opacity: 0.14;
}

.pharma-ticket__stamp--original { color: var(--cross); }
.pharma-ticket__stamp--copy { color: #8a1f1f; }
.pharma-ticket__stamp--draft { color: var(--muted); }

.pharma-ticket__header { text-align: center; }
.pharma-ticket__mark { display: flex; justify-content: center; margin-bottom: 8px; }
.pharma-ticket__logo { max-height: 48px; max-width: 70%; object-fit: contain; }
.pharma-ticket__cross { width: 28px; height: 28px; fill: var(--cross); }
.pharma-ticket__trade {
  font-weight: 700;
  font-size: 1.15em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}
.pharma-ticket__legal,
.pharma-ticket__rfc,
.pharma-ticket__muted {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 0.85em;
}

.pharma-ticket__dash {
  border: none;
  border-top: 1px dashed var(--rule);
  margin: 10px 0;
  opacity: 0.55;
}

.pharma-ticket__meta p,
.pharma-ticket__totals p,
.pharma-ticket__pays p,
.pharma-ticket__item-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 3px;
}

.pharma-ticket__item { margin-bottom: 8px; }
.pharma-ticket__item-name { margin: 0; font-weight: 600; }
.pharma-ticket__item-row { color: var(--muted); font-size: 0.9em; }
.pharma-ticket__empty { text-align: center; color: var(--muted); font-style: italic; }

.pharma-ticket__grand {
  font-weight: 700;
  font-size: 1.15em;
  margin-top: 4px !important;
}
.pharma-ticket__balance { color: #8a1f1f; font-weight: 700; }

.pharma-ticket__footer {
  text-align: center;
  font-size: 0.82em;
  color: var(--muted);
}
.pharma-ticket__footer p { margin: 4px 0 0; }

.pharma-ticket__cut {
  height: 12px;
  margin: 12px -16px -22px;
  background: repeating-linear-gradient(
    90deg,
    var(--paper) 0 8px,
    transparent 8px 12px
  );
  clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
  border-top: 1px dashed var(--rule);
  opacity: 0.7;
}

@media print {
  .pharma-ticket {
    box-shadow: none;
    margin: 0 auto;
  }
}
</style>
