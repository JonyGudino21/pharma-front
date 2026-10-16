# Caja: turnos, arqueo y cajón

## Qué hace

Controla el dinero en efectivo de cada cajero: apertura con fondo inicial, retiros (sangrías),
gastos, ingresos, apertura del cajón sin venta y corte de caja al final del turno.

## Cómo se usa

1. **Abrir turno**: Caja → escribe el fondo inicial (el sistema puede proponer el de siempre) →
   Abrir.
2. **Durante el día** (gerencia): registrar **sangría**, **gasto** o **ingreso manual** con monto
   y motivo. Si el efectivo rebasa el límite configurado, aparece un aviso para hacer un retiro.
3. **Abrir el cajón sin venta** (gerencia): escribir el motivo (por ejemplo, "cambio para
   cliente") y pulsar el botón. Queda registrado quién, cuándo, por qué y desde qué caja.
4. **Corte**: contar el dinero físico, escribir el total y confirmar. Se muestra el resultado
   (faltante o sobrante) o, con cierre ciego, sólo lo contado.
5. **Historial** (gerencia): consultar turnos anteriores, su diferencia y su detalle.

## Qué protege

- **Cierre ciego** (opcional): el cajero no ve cuánto "debería" haber; así cuenta de verdad.
- **Tolerancia**: diferencias pequeñas cierran normal; las mayores quedan marcadas como
  "Requiere auditoría".
- **Límite de efectivo en caja**: avisa cuándo retirar dinero para no exponerlo.
- **Cajón auditado**: si el registro no se guarda en el servidor, el cajón no se abre.
- **No se abren dos turnos por error**: si el sistema no puede consultar el turno, no ofrece
  abrir otro.

## Limitaciones

- Abrir el cajón desde el sistema requiere impresora térmica USB con cajón conectado y
  configurada en **Configuración › Dispositivos**.
- Los retiros, gastos e ingresos sólo los registra quien tiene ese permiso (gerencia).

## Consejos de operación

- Define en **Configuración › Caja** el fondo sugerido, la tolerancia y el límite de efectivo.
- Haz sangrías durante el día en lugar de esperar al corte.
- Revisa cada semana los turnos marcados como "Auditoría" y las aperturas de cajón sin venta.
