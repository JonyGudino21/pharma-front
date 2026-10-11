import type { Company } from '~/types/receipt'
import type { RemissionSettings } from '~/types/settings'
import type { RemissionView } from '~/utils/remission-view'

/**
 * Genera el DOCUMENTO COMPLETO (HTML) de la nota de remisión.
 *
 * Una sola fuente para pantalla e impresión: la vista previa lo muestra en un
 * iframe (`srcdoc`) y la impresión lo escribe en otro iframe oculto. Lo que se
 * ve es, byte por byte, lo que sale en papel, y el CSS no se mezcla con el de
 * la aplicación (Tailwind no puede alterar la hoja).
 *
 * SEGURIDAD: todo dato capturado por personas (nombres, domicilios, notas,
 * leyendas) pasa por `esc()`. Un cliente llamado `<img onerror=…>` se imprime
 * como texto, no se ejecuta.
 *
 * Sin dependencias de red: fuentes del sistema; el logo es lo único externo y,
 * si no carga, la hoja sale igual (ver `onerror`).
 */

export const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const money = (n: number) => MXN.format(Number.isFinite(n) ? n : 0)

const fecha = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { dia: esc(iso), hora: '' }
  return {
    dia: d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
    hora: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
  }
}

/** Conserva los saltos de línea que el gerente escribió en leyenda y condiciones. */
const multiline = (text: string) => esc(text).replace(/\r?\n/g, '<br />')

const PAPER_SIZE: Record<RemissionSettings['paper'], string> = { LETTER: 'letter', A4: 'A4' }

const CSS = (paper: RemissionSettings['paper']) => `
@page { size: ${PAPER_SIZE[paper]}; margin: 12mm 14mm 16mm;
  @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 8pt system-ui, sans-serif; color: #666; } }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
body {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 10pt; line-height: 1.4; color: #1b1b1b;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.sheet { width: 100%; }
h1, h2, p, dl, dd, dt { margin: 0; }

/* ── Encabezado ── */
.head { display: flex; justify-content: space-between; gap: 18px; padding-bottom: 12px; border-bottom: 2px solid #1f7a4d; }
.brand { display: flex; gap: 12px; align-items: flex-start; min-width: 0; }
.brand img { max-width: 64px; max-height: 64px; object-fit: contain; }
.brand h1 { font-size: 16pt; line-height: 1.15; color: #12261e; }
.brand .legal { font-size: 9pt; color: #444; }
.brand .meta { font-size: 8.5pt; color: #555; margin-top: 2px; }
.doc { text-align: right; flex-shrink: 0; min-width: 190px; }
.doc-title { font-size: 13pt; font-weight: 700; letter-spacing: .06em; color: #1f7a4d; }
.doc-folio { font-size: 12pt; font-weight: 700; font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace; margin: 2px 0 4px; }
.doc dl { font-size: 8.5pt; color: #444; }
.stamp { display: inline-block; margin-top: 6px; padding: 1px 10px; border: 1.5px solid #1f7a4d; border-radius: 3px;
  font-size: 8.5pt; font-weight: 700; letter-spacing: .12em; color: #1f7a4d; }
.stamp.copy { border-color: #a04a00; color: #a04a00; }
.stamp.preview { border-style: dashed; border-color: #888; color: #666; }

/* ── Cliente y venta ── */
.parties { display: grid; grid-template-columns: 1.3fr 1fr; gap: 12px; margin: 12px 0; }
.box { border: 1px solid #cfcfca; border-radius: 4px; padding: 8px 10px; break-inside: avoid; }
.box h2 { font-size: 7.5pt; text-transform: uppercase; letter-spacing: .1em; color: #666; margin-bottom: 4px; }
.box .big { font-size: 11pt; font-weight: 700; }
.box p, .box dd { font-size: 9pt; }
.box dl { display: grid; grid-template-columns: auto 1fr; gap: 1px 10px; font-size: 9pt; }
.box dt { color: #666; }
.badge { display: inline-block; padding: 0 6px; border-radius: 3px; font-weight: 700; font-size: 8pt; }
.badge.paid { background: #e3f3ea; color: #14633d; }
.badge.credit { background: #fdeede; color: #8a3f00; }

/* ── Partidas ── */
table.items { width: 100%; border-collapse: collapse; margin-top: 4px; }
table.items thead { display: table-header-group; }
table.items th { background: #f1f1ee; font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; color: #444;
  text-align: left; padding: 5px 6px; border-top: 1px solid #bdbdb6; border-bottom: 1px solid #bdbdb6; }
table.items td { padding: 5px 6px; border-bottom: 1px solid #e4e4df; vertical-align: top; font-size: 9.5pt; }
table.items tr { break-inside: avoid; page-break-inside: avoid; }
.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.sku { font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace; font-size: 8.5pt; color: #555; white-space: nowrap; }
.disc { display: block; font-size: 8pt; color: #8a3f00; }
.note-iva { font-size: 8pt; color: #666; margin-top: 4px; }

/* ── Totales ── */
.summary { display: grid; grid-template-columns: 1fr 250px; gap: 18px; margin-top: 12px; break-inside: avoid; }
.words { font-size: 9pt; }
.words strong { display: block; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .1em; color: #666; font-weight: 600; }
.words .txt { font-weight: 700; margin-bottom: 8px; }
.pay { font-size: 9pt; }
.pay strong { display: block; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .1em; color: #666; font-weight: 600; }
.pay ul { margin: 2px 0 0; padding: 0; list-style: none; }
.pay li { display: flex; justify-content: space-between; gap: 10px; max-width: 280px; }
.totals { border: 1px solid #cfcfca; border-radius: 4px; padding: 6px 10px; }
.totals .row { display: flex; justify-content: space-between; gap: 10px; font-size: 9.5pt; padding: 1.5px 0; font-variant-numeric: tabular-nums; }
.totals .row.muted { color: #555; font-size: 8.5pt; }
.totals .row.grand { border-top: 1.5px solid #1b1b1b; margin-top: 4px; padding-top: 5px; font-size: 13pt; font-weight: 700; }
.totals .row.due { color: #8a3f00; font-weight: 700; }

/* ── Notas, advertencias y firmas ── */
.block { margin-top: 12px; font-size: 8.5pt; color: #333; break-inside: avoid; }
.block strong { text-transform: uppercase; letter-spacing: .08em; font-size: 7.5pt; color: #666; }
.warn { border-left: 3px solid #a04a00; background: #fdf3e8; padding: 5px 8px; color: #6b3300; }
.sign { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 42px; break-inside: avoid; }
.sign div { border-top: 1px solid #1b1b1b; padding-top: 4px; text-align: center; font-size: 8.5pt; color: #444; }
.legend { margin-top: 16px; padding-top: 8px; border-top: 1px dashed #bdbdb6; font-size: 8pt; color: #666; text-align: center; break-inside: avoid; }
`

function stampOf(copy: number): string {
  if (copy <= 0) return '<span class="stamp preview">VISTA PREVIA</span>'
  if (copy === 1) return '<span class="stamp">ORIGINAL</span>'
  return `<span class="stamp copy">COPIA ${copy}</span>`
}

export interface RemissionDocumentOptions {
  /** Título de la ventana de impresión (sugiere el nombre del PDF). */
  title?: string
}

export function renderRemissionHtml(
  view: RemissionView,
  company: Company | null,
  cfg: RemissionSettings,
  opts: RemissionDocumentOptions = {},
): string {
  const f = fecha(view.issuedAt)
  const hayDescuento = view.items.some((i) => (i.discount ?? 0) > 0)
  const nombreFarmacia = company?.tradeName || company?.legalName || 'Farmacia'

  const contactoEmisor = [company?.phone && `Tel. ${esc(company.phone)}`, company?.email && esc(company.email)]
    .filter(Boolean)
    .join(' · ')

  const logo = company?.logoUrl
    ? `<img src="${esc(company.logoUrl)}" alt="" onerror="this.remove()" />`
    : ''

  const filas = view.items
    .map((i, idx) => {
      const desc = (i.discount ?? 0) > 0
      return `<tr>
        <td class="num">${idx + 1}</td>
        ${cfg.showSku ? `<td class="sku">${esc(i.sku ?? '')}</td>` : ''}
        <td>${esc(i.name)}${desc ? `<span class="disc">Descuento ${esc(i.discountPercent)}%</span>` : ''}</td>
        <td class="num">${esc(i.quantity)}</td>
        <td class="num">${money(i.unitPrice)}</td>
        ${hayDescuento ? `<td class="num">${desc ? `-${money(i.discount ?? 0)}` : ''}</td>` : ''}
        <td class="num">${money(i.subtotal)}</td>
      </tr>`
    })
    .join('')

  const ivaFilas = cfg.showTaxBreakdown
    ? view.taxBreakdown
        .map((t) => `<div class="row muted"><span>IVA incluido ${esc(t.ratePercent)}%</span><span>${money(t.tax)}</span></div>`)
        .join('')
    : ''

  const aCredito = view.balance > 0.004
  const pagos = cfg.showPayments
    ? `<div class="pay"><strong>Forma de pago</strong>
        ${
          view.payments.length
            ? `<ul>${view.payments.map((p) => `<li><span>${esc(p.method)}</span><span>${money(p.amount)}</span></li>`).join('')}</ul>`
            : '<div>Sin pagos registrados</div>'
        }
      </div>`
    : ''

  const filaSaldo = cfg.showPayments
    ? `<div class="row"><span>Pagado</span><span>${money(view.paidAmount)}</span></div>
       ${aCredito ? `<div class="row due"><span>Saldo pendiente</span><span>${money(view.balance)}</span></div>` : ''}`
    : ''

  const contactoCliente = view.client.isGeneral
    ? ''
    : [
        view.client.rfc && `<p>RFC: ${esc(view.client.rfc)}</p>`,
        view.client.address && `<p>${esc(view.client.address)}</p>`,
        (view.client.phone || view.client.email) &&
          `<p>${[view.client.phone && `Tel. ${esc(view.client.phone)}`, view.client.email && esc(view.client.email)].filter(Boolean).join(' · ')}</p>`,
      ]
        .filter(Boolean)
        .join('')

  const devolucion =
    view.returnedTotal > 0
      ? `<div class="block warn"><strong>Aviso:</strong> esta venta tiene devoluciones registradas por ${money(view.returnedTotal)}. Los importes de esta nota corresponden a la venta original.</div>`
      : ''

  const folioTitulo = esc(opts.title ?? `Nota de remisión ${view.folio}${view.copyNumber > 1 ? ` (copia ${view.copyNumber})` : ''}`)

  return `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${folioTitulo}</title>
<style>${CSS(cfg.paper)}</style>
</head>
<body>
<main class="sheet">
  <header class="head">
    <div class="brand">
      ${logo}
      <div>
        <h1>${esc(nombreFarmacia)}</h1>
        ${company?.legalName && company.legalName !== nombreFarmacia ? `<p class="legal">${esc(company.legalName)}</p>` : ''}
        ${company?.rfc ? `<p class="meta">RFC: ${esc(company.rfc)}</p>` : ''}
        ${company?.address ? `<p class="meta">${esc(company.address)}</p>` : ''}
        ${contactoEmisor ? `<p class="meta">${contactoEmisor}</p>` : ''}
      </div>
    </div>
    <div class="doc">
      <div class="doc-title">NOTA DE REMISIÓN</div>
      <div class="doc-folio">${esc(view.folio)}</div>
      <dl><dd>${f.dia}</dd><dd>${esc(f.hora)}</dd></dl>
      ${stampOf(view.copyNumber)}
    </div>
  </header>

  <section class="parties">
    <div class="box">
      <h2>Cliente</h2>
      <p class="big">${esc(view.client.name)}</p>
      ${contactoCliente}
    </div>
    <div class="box">
      <h2>Datos de la venta</h2>
      <dl>
        ${view.saleRef ? `<dt>Ticket</dt><dd>${esc(view.saleRef)}</dd>` : ''}
        ${view.cashierName ? `<dt>Atendió</dt><dd>${esc(view.cashierName)}</dd>` : ''}
        <dt>Estado</dt><dd>${aCredito ? '<span class="badge credit">A CRÉDITO / PENDIENTE</span>' : '<span class="badge paid">PAGADA</span>'}</dd>
      </dl>
    </div>
  </section>

  <table class="items">
    <thead>
      <tr>
        <th class="num" style="width:26px">#</th>
        ${cfg.showSku ? '<th>Código</th>' : ''}
        <th>Descripción</th>
        <th class="num">Cant.</th>
        <th class="num">P. unitario</th>
        ${hayDescuento ? '<th class="num">Desc.</th>' : ''}
        <th class="num">Importe</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <p class="note-iva">Precios en pesos mexicanos (MXN), con IVA incluido cuando corresponde.</p>

  <section class="summary">
    <div>
      <div class="words"><strong>Importe con letra</strong><div class="txt">${esc(view.amountInWords)}</div></div>
      ${pagos}
    </div>
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${money(view.subtotal)}</span></div>
      ${view.discountTotal > 0 ? `<div class="row"><span>Descuento</span><span>-${money(view.discountTotal)}</span></div>` : ''}
      ${ivaFilas}
      <div class="row grand"><span>TOTAL</span><span>${money(view.total)}</span></div>
      ${filaSaldo}
    </div>
  </section>

  ${devolucion}
  ${view.note ? `<div class="block"><strong>Observaciones</strong><br />${multiline(view.note)}</div>` : ''}
  ${cfg.terms.trim() ? `<div class="block"><strong>Condiciones</strong><br />${multiline(cfg.terms)}</div>` : ''}

  ${cfg.showSignatures ? '<div class="sign"><div>Entregó</div><div>Recibí de conformidad</div></div>' : ''}
  ${cfg.legend.trim() ? `<div class="legend">${multiline(cfg.legend)}</div>` : ''}
</main>
</body>
</html>`
}
