import type { Company } from '~/types/receipt'
import type { RemissionSettings } from '~/types/settings'
import type { RemissionLine, RemissionView } from '~/utils/remission-view'

/**
 * Genera el DOCUMENTO COMPLETO (HTML) de la nota de remisión.
 *
 * Una sola fuente para pantalla e impresión: la vista previa lo muestra en un
 * iframe (`srcdoc`) y la impresión lo escribe en otro iframe oculto. Lo que se
 * ve es lo que sale en papel o en el PDF, y el CSS no se mezcla con el de la
 * aplicación.
 *
 * ─── DISEÑO ("botica") ───
 * Tinta verde-negra sobre papel blanco, verde botica como único acento y menta
 * para los renglones alternos. Todo legible en impresora láser de un solo
 * color (los tonos se convierten en grises distinguibles). La banda de
 * guilloché —el trazo fino del papel de seguridad de cheques y documentos con
 * folio— es el sello visual; lo demás se mantiene sobrio.
 *
 * ─── ACCESIBILIDAD ───
 * Cuerpo a 10.5 pt, contraste de tinta ≥ 12:1, cifras tabulares alineadas a la
 * derecha y la tabla de partidas en RENGLONES ALTERNOS (blanco / menta) para
 * seguir cada producto con la vista sin saltar de línea. Menos columnas: el
 * código, el lote y el descuento van en una línea secundaria bajo el nombre.
 *
 * ─── SEGURIDAD ───
 * Todo dato capturado por personas pasa por `esc()`. Un cliente llamado
 * `<img onerror=…>` se imprime como texto.
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

function fecha(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { dia: esc(iso), hora: '' }
  return {
    dia: d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
    hora: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
  }
}

/** Caducidad como "MM/AAAA" (como viene impresa en la caja del medicamento). */
export function caducidad(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
}

/** Conserva los saltos de línea que el gerente escribió en leyenda y condiciones. */
const multiline = (text: string) => esc(text).replace(/\r?\n/g, '<br />')

/** Texto seguro dentro de `content: "…"` de CSS (pie de página impreso). */
const cssText = (text: string) => text.replace(/[^A-Za-z0-9 .\-_/#]/g, '')

const PAPER_SIZE: Record<RemissionSettings['paper'], string> = { LETTER: 'letter', A4: 'A4' }

/**
 * Banda de guilloché: dos familias de senoides con distinta longitud de onda
 * que se cruzan, como en el papel de seguridad. Determinista (sin azar) para
 * que la vista previa y la impresión sean idénticas.
 */
export function guillocheSvg(): string {
  const W = 800
  const H = 28
  const mid = H / 2
  const paths: string[] = []
  const familia = (lambda: number, amp: number, fases: number, opacidad: number) => {
    for (let k = 0; k < fases; k++) {
      const phi = (k / fases) * Math.PI * 2
      let d = ''
      for (let x = 0; x <= W; x += 4) {
        const envolvente = 0.82 + 0.18 * Math.cos((2 * Math.PI * x) / (lambda * 5.5))
        const y = mid + amp * envolvente * Math.sin((2 * Math.PI * x) / lambda + phi)
        d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(2)}`
      }
      paths.push(`<path d="${d}" stroke-opacity="${opacidad}"/>`)
    }
  }
  familia(64, 11, 7, 0.55)
  familia(41, 7, 5, 0.35)
  return `<svg class="guilloche" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#1E6B52" stroke-width="0.6">${paths.join('')}</g></svg>`
}

/** Marca de botica (cruz) cuando la farmacia no tiene logo. */
const CRUZ = `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="9" fill="#1E6B52"/><path d="M16 8h8v8h8v8h-8v8h-8v-8H8v-8h8z" fill="#fff"/></svg>`

const CSS = (paper: RemissionSettings['paper'], folio: string, fontFaces: string) => `
${fontFaces}
:root {
  --tinta: #14231C;
  --botica: #1E6B52;
  --menta: #E3EFE8;
  --ambar: #A8551A;
  --linea: #C9D3CE;
  --suave: #55665E;
  --papel: #FFFFFF;
  --display: 'Literata', Georgia, 'Times New Roman', serif;
  --texto: 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
  --mono: 'IBM Plex Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace;
}
@page {
  size: ${PAPER_SIZE[paper]};
  margin: 11mm 13mm 15mm;
  @bottom-left { content: "${cssText(folio)}"; font: 7.5pt ui-monospace, Consolas, monospace; color: #55665E; }
  @bottom-right { content: "Hoja " counter(page) " de " counter(pages); font: 7.5pt system-ui, sans-serif; color: #55665E; }
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--papel); }
body {
  font-family: var(--texto); font-size: 10.5pt; line-height: 1.42; color: var(--tinta);
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
  font-variant-numeric: tabular-nums;
}
@media screen { .sheet { padding: 11mm 13mm 14mm; } }
h1, h2, p, dl, dd, dt { margin: 0; }

/* ── Encabezado ─────────────────────────────────────────────── */
.guilloche { display: block; width: 100%; height: 7mm; }
.head { display: grid; grid-template-columns: 1fr auto; gap: 8mm; align-items: start; padding: 4.5mm 0 5mm; border-bottom: 1.2pt solid var(--tinta); }
.brand { display: flex; gap: 4mm; align-items: flex-start; min-width: 0; }
.brand img, .brand .mark { width: 16mm; height: 16mm; object-fit: contain; flex-shrink: 0; }
.brand h1 { font-family: var(--display); font-weight: 700; font-size: 21pt; line-height: 1.05; letter-spacing: -0.01em; }
.brand .legal { margin-top: 1.2mm; font-size: 9pt; font-weight: 500; }
.brand .meta { font-size: 8.5pt; color: var(--suave); margin-top: 0.6mm; }
.doc { min-width: 62mm; text-align: right; }
.doc .eyebrow { font-size: 8pt; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--botica); }
.doc .folio { font-family: var(--mono); font-weight: 600; font-size: 15pt; letter-spacing: 0.02em; margin: 1mm 0 1.5mm; }
.doc dl { display: grid; grid-template-columns: auto auto; justify-content: end; gap: 0.4mm 3mm; font-size: 8.5pt; }
.doc dt { color: var(--suave); }
.doc dd { font-weight: 500; }
.stamp { display: inline-block; margin-top: 2.5mm; padding: 0.8mm 3mm; border: 1.1pt solid currentColor; outline: 0.5pt solid currentColor; outline-offset: 0.7mm;
  border-radius: 1mm; font-size: 8pt; font-weight: 700; letter-spacing: 0.24em; color: var(--botica); }
.stamp.copy { color: var(--ambar); }
.stamp.preview { color: var(--suave); border-style: dashed; outline: none; }

/* ── Cliente / venta ────────────────────────────────────────── */
.parties { display: grid; grid-template-columns: 1.35fr 1fr; gap: 6mm; margin: 5mm 0 4.5mm; }
.party { break-inside: avoid; }
.label { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--botica); padding-bottom: 1.2mm; border-bottom: 0.6pt solid var(--linea); margin-bottom: 2mm; }
.party .name { font-size: 13pt; font-weight: 600; line-height: 1.2; }
.party p { font-size: 9.5pt; margin-top: 0.8mm; }
.muted { color: var(--suave); }
.rfc { font-family: var(--mono); font-size: 9pt; }
.facts { display: grid; grid-template-columns: auto 1fr; gap: 1mm 4mm; font-size: 9.5pt; }
.facts dt { color: var(--suave); }
.facts dd { font-weight: 500; }
.chip { display: inline-block; padding: 0.3mm 2.2mm; border-radius: 10mm; font-size: 8pt; font-weight: 700; letter-spacing: 0.04em; }
.chip.paid { background: var(--menta); color: var(--botica); }
.chip.credit { background: #F6E6D8; color: var(--ambar); }

/* ── Partidas (renglones alternos para seguir cada producto) ── */
table.items { width: 100%; border-collapse: collapse; }
table.items thead { display: table-header-group; }
table.items th { background: var(--tinta); color: #fff; font-size: 8pt; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; text-align: left; padding: 2.4mm 2.6mm; }
table.items th.num { text-align: right; }
table.items td { padding: 2.4mm 2.6mm; vertical-align: top; font-size: 10.5pt; }
table.items tbody tr { break-inside: avoid; page-break-inside: avoid; }
table.items tbody tr:nth-child(even) td { background: var(--menta); }
table.items tbody tr:last-child td { border-bottom: 1.2pt solid var(--tinta); }
.num { text-align: right; white-space: nowrap; }
.idx { font-family: var(--mono); font-size: 8.5pt; color: var(--suave); width: 9mm; }
table.items th.idx { color: #fff; }
.qty { font-weight: 700; font-size: 11pt; }
.prod { font-weight: 500; }
.sub { display: block; margin-top: 0.6mm; font-size: 8.3pt; font-weight: 400; color: var(--suave); }
.sub .mono { font-family: var(--mono); font-size: 8pt; }
.sub .disc { color: var(--ambar); font-weight: 600; }
.amount { font-weight: 600; }
.count { display: flex; justify-content: space-between; gap: 4mm; font-size: 8.5pt; color: var(--suave); margin-top: 1.6mm; }

/* ── Totales ─────────────────────────────────────────────────── */
.summary { display: grid; grid-template-columns: 1fr 68mm; gap: 7mm; margin-top: 5mm; break-inside: avoid; }
.words .txt { font-size: 10pt; font-weight: 600; letter-spacing: 0.01em; line-height: 1.35; }
.pay { margin-top: 4mm; }
.pay ul { list-style: none; margin: 0; padding: 0; max-width: 85mm; }
.pay li { display: flex; justify-content: space-between; gap: 4mm; font-size: 9.5pt; padding: 0.8mm 0; border-bottom: 0.5pt dotted var(--linea); }
.totals .row { display: flex; justify-content: space-between; gap: 4mm; font-size: 10pt; padding: 1mm 0; }
.totals .row.muted { font-size: 8.8pt; }
.totals .grand { display: flex; justify-content: space-between; align-items: baseline; margin: 2mm 0 1.5mm; padding: 2.6mm 3.5mm; background: var(--botica); color: #fff; border-radius: 1.2mm; }
.totals .grand span:first-child { font-size: 8.5pt; font-weight: 700; letter-spacing: 0.2em; }
.totals .grand span:last-child { font-family: var(--display); font-weight: 700; font-size: 18pt; }
.totals .row.due { color: var(--ambar); font-weight: 700; font-size: 10.5pt; }

/* ── Avisos, notas, firmas ──────────────────────────────────── */
.block { margin-top: 4.5mm; font-size: 9pt; break-inside: avoid; }
.warn { padding: 2.4mm 3.5mm; background: #F6E6D8; border-radius: 1.2mm; color: #6E3610; }
.sign { display: grid; grid-template-columns: 1fr 1fr; gap: 16mm; margin-top: 15mm; break-inside: avoid; }
.sign div { border-top: 0.9pt solid var(--tinta); padding-top: 1.6mm; font-size: 8.8pt; }
.sign strong { display: block; font-weight: 600; }
.sign span { color: var(--suave); font-size: 8pt; }
.legend { margin-top: 7mm; padding-top: 2.5mm; border-top: 0.6pt solid var(--linea); font-size: 8pt; color: var(--suave); text-align: center; break-inside: avoid; }
`

function stampOf(copy: number): string {
  if (copy <= 0) return '<span class="stamp preview">VISTA PREVIA</span>'
  if (copy === 1) return '<span class="stamp">ORIGINAL</span>'
  return `<span class="stamp copy">COPIA ${copy}</span>`
}

/** Línea secundaria de una partida: código, lotes con caducidad y descuento. */
function subLine(i: RemissionLine, showSku: boolean): string {
  const partes: string[] = []
  if (showSku && i.sku) partes.push(`<span class="mono">${esc(i.sku)}</span>`)
  const lotes = i.lots ?? []
  for (const l of lotes) {
    const cad = caducidad(l.expiry)
    const piezas = lotes.length > 1 ? ` ×${esc(l.quantity)}` : ''
    partes.push(`Lote <span class="mono">${esc(l.lot)}</span>${cad ? ` · Cad. ${cad}` : ''}${piezas}`)
  }
  if ((i.discount ?? 0) > 0) partes.push(`<span class="disc">Descuento ${esc(i.discountPercent)}%</span>`)
  return partes.length ? `<span class="sub">${partes.join(' &nbsp;·&nbsp; ')}</span>` : ''
}

export interface RemissionDocumentOptions {
  /** Título de la ventana de impresión (sugiere el nombre del PDF). */
  title?: string
  /** Reglas @font-face de las tipografías locales; sin ellas, fuentes del sistema. */
  fontFaces?: string
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
  const aCredito = view.balance > 0.004

  const contactoEmisor = [company?.phone && `Tel. ${esc(company.phone)}`, company?.email && esc(company.email)]
    .filter(Boolean)
    .join(' · ')

  const marca = company?.logoUrl ? `<img src="${esc(company.logoUrl)}" alt="" onerror="this.remove()" />` : CRUZ

  const filas = view.items
    .map(
      (i, idx) => `<tr>
        <td class="idx">${String(idx + 1).padStart(2, '0')}</td>
        <td><span class="prod">${esc(i.name)}</span>${subLine(i, cfg.showSku)}</td>
        <td class="num qty">${esc(i.quantity)}</td>
        <td class="num">${money(i.unitPrice)}</td>
        ${hayDescuento ? `<td class="num">${(i.discount ?? 0) > 0 ? `−${money(i.discount ?? 0)}` : '—'}</td>` : ''}
        <td class="num amount">${money(i.subtotal)}</td>
      </tr>`,
    )
    .join('')

  const ivaFilas = cfg.showTaxBreakdown
    ? view.taxBreakdown
        .map((t) => `<div class="row muted"><span>IVA incluido ${esc(t.ratePercent)}%</span><span>${money(t.tax)}</span></div>`)
        .join('')
    : ''

  // Con saldo pendiente, el resto va a crédito: "Efectivo + crédito".
  const metodos = [...new Set(view.payments.map((p) => p.method))].join(', ')
  const formaPago = aCredito ? (metodos ? `${metodos} + crédito` : 'Crédito') : metodos || '—'

  const pagos = cfg.showPayments
    ? `<div class="pay"><div class="label">Forma de pago</div>
        ${
          view.payments.length
            ? `<ul>${view.payments.map((p) => `<li><span>${esc(p.method)}</span><span>${money(p.amount)}</span></li>`).join('')}</ul>`
            : '<p class="muted">Sin pagos registrados.</p>'
        }
      </div>`
    : ''

  const filaSaldo = cfg.showPayments
    ? `<div class="row"><span>Pagado</span><span>${money(view.paidAmount)}</span></div>
       ${aCredito ? `<div class="row due"><span>Saldo pendiente</span><span>${money(view.balance)}</span></div>` : ''}`
    : ''

  const cliente = view.client.isGeneral
    ? `<p class="name">${esc(view.client.name)}</p>`
    : [
        `<p class="name">${esc(view.client.name)}</p>`,
        view.client.rfc && `<p>RFC <span class="rfc">${esc(view.client.rfc)}</span></p>`,
        view.client.address && `<p>${esc(view.client.address)}</p>`,
        (view.client.phone || view.client.email) &&
          `<p class="muted">${[view.client.phone && `Tel. ${esc(view.client.phone)}`, view.client.email && esc(view.client.email)].filter(Boolean).join(' · ')}</p>`,
      ]
        .filter(Boolean)
        .join('')

  const devolucion =
    view.returnedTotal > 0
      ? `<div class="block warn"><strong>Aviso:</strong> esta venta tiene devoluciones registradas por ${money(view.returnedTotal)}. Los importes de esta nota corresponden a la venta original.</div>`
      : ''

  const titulo = esc(opts.title ?? `Nota de remisión ${view.folio}${view.copyNumber > 1 ? ` (copia ${view.copyNumber})` : ''}`)
  const partidas = view.items.length === 1 ? '1 partida' : `${view.items.length} partidas`
  const piezas = view.pieces === 1 ? '1 pieza' : `${view.pieces} piezas`

  return `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${titulo}</title>
<style>${CSS(cfg.paper, view.folio, opts.fontFaces ?? '')}</style>
</head>
<body>
<main class="sheet">
  ${guillocheSvg()}
  <header class="head">
    <div class="brand">
      ${marca}
      <div>
        <h1>${esc(nombreFarmacia)}</h1>
        ${company?.legalName && company.legalName !== nombreFarmacia ? `<p class="legal">${esc(company.legalName)}</p>` : ''}
        ${company?.rfc ? `<p class="meta">RFC <span class="rfc">${esc(company.rfc)}</span></p>` : ''}
        ${company?.address ? `<p class="meta">${esc(company.address)}</p>` : ''}
        ${contactoEmisor ? `<p class="meta">${contactoEmisor}</p>` : ''}
      </div>
    </div>
    <div class="doc">
      <div class="eyebrow">NOTA DE REMISIÓN</div>
      <div class="folio">${esc(view.folio)}</div>
      <dl><dt>Fecha</dt><dd>${f.dia}</dd><dt>Hora</dt><dd>${esc(f.hora)}</dd></dl>
      ${stampOf(view.copyNumber)}
    </div>
  </header>

  <section class="parties">
    <div class="party">
      <div class="label">Cliente</div>
      ${cliente}
    </div>
    <div class="party">
      <div class="label">Datos de la venta</div>
      <dl class="facts">
        ${view.saleRef ? `<dt>Ticket</dt><dd class="rfc">${esc(view.saleRef)}</dd>` : ''}
        ${view.cashierName ? `<dt>Atendió</dt><dd>${esc(view.cashierName)}</dd>` : ''}
        <dt>Pago</dt><dd>${esc(formaPago)}</dd>
        <dt>Estado</dt><dd>${aCredito ? '<span class="chip credit">A CRÉDITO / PENDIENTE</span>' : '<span class="chip paid">PAGADA</span>'}</dd>
      </dl>
    </div>
  </section>

  <table class="items">
    <thead>
      <tr>
        <th class="idx">#</th>
        <th>Descripción</th>
        <th class="num">Cant.</th>
        <th class="num">P. unitario</th>
        ${hayDescuento ? '<th class="num">Desc.</th>' : ''}
        <th class="num">Importe</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="count"><span>${partidas} · ${piezas}</span><span>Precios en MXN con IVA incluido cuando corresponde.</span></div>

  <section class="summary">
    <div>
      <div class="words"><div class="label">Importe con letra</div><p class="txt">${esc(view.amountInWords)}</p></div>
      ${pagos}
    </div>
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${money(view.subtotal)}</span></div>
      ${view.discountTotal > 0 ? `<div class="row"><span>Descuento</span><span>−${money(view.discountTotal)}</span></div>` : ''}
      ${ivaFilas}
      <div class="grand"><span>TOTAL</span><span>${money(view.total)}</span></div>
      ${filaSaldo}
    </div>
  </section>

  ${devolucion}
  ${view.note ? `<div class="block"><div class="label">Observaciones</div>${multiline(view.note)}</div>` : ''}
  ${cfg.terms.trim() ? `<div class="block"><div class="label">Condiciones</div>${multiline(cfg.terms)}</div>` : ''}

  ${
    cfg.showSignatures
      ? `<div class="sign">
    <div><strong>Entregó</strong><span>Nombre y firma</span></div>
    <div><strong>Recibí de conformidad</strong><span>Nombre, firma y fecha</span></div>
  </div>`
      : ''
  }
  ${cfg.legend.trim() ? `<div class="legend">${multiline(cfg.legend)}</div>` : ''}
</main>
</body>
</html>`
}
