/**
 * ESTILO DEL TICKET — una sola fuente para la vista previa (ReceiptPreview la
 * inyecta con useHead) y para la impresión por navegador (printBrowser).
 *
 * Antes había dos copias (en el componente y aquí) que ya diferían, y la paleta
 * era verde/crema, ajena al azul de la aplicación. Ahora usa la identidad de
 * PharmaPOS: papel blanco (como el térmico real), tinta azul pizarra, acento azul
 * de marca y ámbar para saldo y copias. La impresión TÉRMICA (ESC/POS) no usa
 * este CSS: sale en el blanco y negro de la impresora.
 */
export const PHARMA_TICKET_CSS = `
.pharma-ticket {
  --paper: #ffffff;
  --ink: #0f172a;
  --muted: #475569;
  --brand: #1d4ed8;
  --brand-soft: #2563eb;
  --amber: #b45309;
  --rule: #0f172a;
  position: relative;
  background: var(--paper);
  color: var(--ink);
  font-family: 'IBM Plex Mono', ui-monospace, 'Cascadia Mono', monospace;
  line-height: 1.38;
  padding: 18px 16px 22px;
  overflow: hidden;
  box-shadow:
    0 18px 40px -22px rgba(15, 23, 42, 0.55),
    inset 0 0 0 1px rgba(15, 23, 42, 0.06);
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
  opacity: 0.12;
}
.pharma-ticket__stamp--original { color: var(--brand); }
.pharma-ticket__stamp--copy { color: var(--amber); }
.pharma-ticket__stamp--draft { color: var(--muted); }

.pharma-ticket__header { text-align: center; }
.pharma-ticket__mark { display: flex; justify-content: center; margin-bottom: 8px; }
.pharma-ticket__logo { max-height: 48px; max-width: 70%; object-fit: contain; }
.pharma-ticket__brandmark { width: 30px; height: 30px; display: block; }
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
  opacity: 0.45;
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
  color: var(--ink);
}
.pharma-ticket__balance { color: var(--amber); font-weight: 700; }

.pharma-ticket__footer {
  text-align: center;
  font-size: 0.82em;
  color: var(--muted);
}
.pharma-ticket__footer p { margin: 4px 0 0; }

.pharma-ticket__cut {
  height: 12px;
  margin: 12px -16px -22px;
  background: repeating-linear-gradient(90deg, var(--paper) 0 8px, transparent 8px 12px);
  clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
  border-top: 1px dashed var(--rule);
  opacity: 0.6;
}

@media print {
  .pharma-ticket {
    box-shadow: none;
    margin: 0 auto;
  }
}
`

/**
 * Marca de PharmaPOS (la píldora del logo de la app) para el ticket y la nota
 * cuando la farmacia no tiene logo propio. SVG en línea: funciona sin internet
 * y se imprime nítido.
 */
export const BRAND_MARK_SVG = (cls: string) =>
  `<svg class="${cls}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="10" fill="#2563eb"/><g transform="translate(8 8) scale(0.09375)"><path fill="#fff" d="M219.26 36.77a57.28 57.28 0 0 0-81 0L36.77 138.26a57.26 57.26 0 0 0 81 81l101.49-101.52a57.33 57.33 0 0 0 0-80.97M100.78 202.26a33.26 33.26 0 1 1-47-47L96 113l47 47Zm101.5-101.49L160 143l-47-47l42.27-42.26a33.26 33.26 0 0 1 47 47Zm-9.77-25.26a12 12 0 0 1 0 17l-24 24a12 12 0 1 1-17-17l24-24a12 12 0 0 1 17 0"/></g></svg>`
