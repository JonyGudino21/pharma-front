/** Una sola fuente para pantalla e impresión por ventana. Prefijo pharma-ticket. */
export const PHARMA_TICKET_CSS = `
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
  background: repeating-linear-gradient(90deg, var(--paper) 0 8px, transparent 8px 12px);
  clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
  border-top: 1px dashed var(--rule);
  opacity: 0.7;
}
@media print {
  .pharma-ticket { box-shadow: none; margin: 0 auto; }
}
`
