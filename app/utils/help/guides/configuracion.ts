import type { HelpGuide } from '../types'

export const configuracion: HelpGuide = {
  id: 'configuracion',
  title: 'Configuración de la farmacia',
  summary: 'Las reglas de operación: ticket, caja, inventario, descuentos, impuestos y nota de remisión. Aplican en todas las cajas.',
  icon: 'ph:gear-six-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es y cómo se guarda',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'En **Configuración** eliges la pestaña: **Ticket**, **Caja**, **Inventario**, **Descuentos**, **Impuestos** o **Nota de remisión**. Lo que guardes aquí aplica en **todas las cajas**.' },
        {
          type: 'steps',
          items: [
            'Cambia lo que necesites. La tarjeta que tocaste se marca con «Sin guardar».',
            'Abajo aparece una barra: pulsa **Guardar cambios** (o `Ctrl` + `S`). Para deshacer, pulsa **Descartar**.',
            'Si un número tiene el enlace **Restablecer**, te regresa al valor de fábrica.',
          ],
        },
        { type: 'p', text: 'Cada cambio queda **registrado**: arriba de la pantalla ves «Último cambio» con fecha y quién lo hizo, y abajo la tarjeta **Historial de cambios** dice qué se cambió, de cuánto a cuánto, quién y cuándo. (La pestaña Ticket no tiene historial.)' },
        { type: 'tip', icon: 'ph:printer-bold', text: 'La pestaña **Dispositivos** (impresora, cajón y lector) tiene su propia guía y se configura en cada computadora. Usuarios y Permisos también tienen su guía.' },
        { type: 'tip', icon: 'ph:lock-key-bold', text: 'Sólo ves las pestañas para las que tienes permiso. Si no ves alguna, pide a gerencia el permiso.' },
      ],
    },
    {
      id: 'ticket',
      title: 'Ticket',
      icon: 'ph:receipt-bold',
      blocks: [
        {
          type: 'list',
          items: [
            '**Datos de la farmacia**: nombre comercial, razón social, RFC, régimen fiscal, domicilio, teléfono, correo, logo y **Mensaje al pie**. Deben coincidir con tu constancia de situación fiscal.',
            '**Papel e impresión**: **Ancho del rollo** (58 o 80 mm), tamaño del total (**Normal** o **Grande**) y **Acentos y ñ en la impresora térmica** (**Sin acentos** o **Con acentos y ñ**).',
            '**Contenido del ticket**: prende o apaga cada parte y cámbiala de orden arrastrándola o con las flechas. **Productos** y **Totales** tienen candado: siempre se imprimen.',
          ],
        },
        { type: 'p', text: 'A la derecha está la **Vista previa** (modo **Térmica** o **Navegador**) y el botón **Imprimir prueba**, que usa lo que ves aunque no lo hayas guardado y no gasta folio.' },
        { type: 'tip', icon: 'ph:copy-bold', text: 'Puedes tener varias plantillas. En **Opciones** eliges **Usar esta plantilla en el POS** (la marcada «En el POS» es la que imprime), **Duplicar como 58 mm / 80 mm** o **Desactivar plantilla**.' },
      ],
    },
    {
      id: 'caja',
      title: 'Caja',
      icon: 'ph:cash-register-bold',
      blocks: [
        {
          type: 'list',
          items: [
            '**Tolerancia (±)**: cuánta diferencia se acepta al cerrar turno. Si el faltante o sobrante la pasa, el turno queda como «Requiere auditoría». Con $0, cualquier centavo cuenta.',
            '**Cierre ciego**: el cajero cuenta sin ver cuánto debería haber. Gerencia siempre ve la diferencia.',
            '**Fondo sugerido al abrir**: se propone al abrir turno; el cajero lo confirma o corrige. $0 = sin sugerencia.',
            '**Límite de efectivo en caja**: al rebasarlo, la pantalla de Caja avisa que toca hacer un retiro. $0 = sin límite.',
          ],
        },
        { type: 'warn', text: 'Estos ajustes deciden cuándo un corte se marca para revisión. Los cambios aplican **desde el siguiente cierre**, en todas las cajas.' },
      ],
    },
    {
      id: 'inventario',
      title: 'Inventario y caducidad',
      icon: 'ph:hourglass-medium-bold',
      blocks: [
        {
          type: 'list',
          items: [
            '**Alertas de caducidad**: el semáforo de **Inventario › Caducidades**. **Rojo: menos de** X días (urgente), **Amarillo: hasta** X días, y **Horizonte de alerta** (hasta dónde mira la lista «Por caducar»).',
            '**Criterio sanitario**: si la fecha impresa es el último día en que se puede vender (**Se vende hasta el día impreso**) o el primer día en que ya no (**Deja de venderse ese día**).',
            '**Exigir lote y caducidad en toda entrada**: los controlados siempre lo piden; activado, también los demás productos.',
            '**Stock mínimo sugerido**: se propone al dar de alta un producto; por debajo, aparece en Stock bajo.',
          ],
        },
        { type: 'warn', text: 'El **criterio sanitario** decide si un lote que caduca hoy se puede vender, y aplica de inmediato en todas las cajas. Confírmalo con el responsable sanitario antes de cambiarlo.' },
      ],
    },
    {
      id: 'descuentos',
      title: 'Descuentos',
      icon: 'ph:percent-bold',
      blocks: [
        {
          type: 'list',
          items: [
            '**Topes por rol**: hasta qué porcentaje descuenta por sí solo el **Cajero**, el **Farmacéutico** y el **Gerente**, y el **Máximo (administrador)**: nadie descuenta más. Cajero en 0 = siempre con autorización.',
            '**Permitir descuentos**: apagado, nadie aplica descuentos nuevos.',
            '**Motivo obligatorio**: se pide el motivo y queda en la venta junto a quién lo dio.',
            '**Autorización de gerente**: un gerente aprueba en la misma caja un descuento mayor al tope del cajero, hasta su propio tope.',
            '**Permitir vender bajo costo**: déjalo apagado (recomendado) para rechazar descuentos que dejen el precio debajo del costo.',
          ],
        },
        { type: 'warn', text: 'Los descuentos mueven dinero. Define los topes antes de activarlos. Los cambios aplican al siguiente descuento en cualquier caja.' },
      ],
    },
    {
      id: 'impuestos',
      title: 'Impuestos',
      icon: 'ph:receipt-x-bold',
      blocks: [
        { type: 'p', text: 'Los precios siempre se capturan y cobran **con IVA incluido**; aquí sólo decides cuánto de ese precio es impuesto.' },
        {
          type: 'list',
          items: [
            '**Tasa general**: **16 %** o **8 %** (región fronteriza).',
            '**Productos nuevos**: con qué IVA nace un producto: **Tasa 0 %**, **General** o **Exento**.',
            '**Mostrar “IVA incluido” por tasa**: imprime bajo el total cuánto IVA lleva la venta.',
            '**Asignar IVA por categoría**: elige la **Categoría** y el **Tratamiento**, pulsa **Aplicar** y confirma con **Sí, aplicar**. No cambia precios.',
          ],
        },
        { type: 'warn', text: 'El 8 % sólo aplica si la farmacia está en la región fronteriza y registrada en el estímulo del SAT. Confírmalo con tu contador. Los cambios aplican a lo que se agregue a una venta desde ahora; las ventas ya hechas conservan su tasa.' },
      ],
    },
    {
      id: 'remision',
      title: 'Nota de remisión',
      icon: 'ph:file-text-bold',
      blocks: [
        { type: 'p', text: 'Es un documento en hoja completa (Carta o A4) para entregas y ventas a crédito. **No es una factura (CFDI).**' },
        {
          type: 'list',
          items: [
            '**Documento**: **Permitir imprimir notas de remisión** (apagado, el botón desaparece del punto de venta y del historial) y **Tamaño de hoja**.',
            '**Contenido**: **Forma de pago, pagado y saldo**, **Líneas de firma**, **Desglose de IVA incluido** y **Densidad de la tabla de productos**: **Automática** (recomendada), **Cómoda** (letra amplia) o **Compacta** (más por hoja).',
            '**Detalle de cada producto**: interruptores independientes de **Código del producto**, **Lote** y **Caducidad**. Con los tres apagados, cada producto muestra sólo su nombre.',
            '**Textos**: la **Leyenda** (por defecto aclara que no es CFDI) y **Condiciones (opcional)**.',
          ],
        },
        { type: 'tip', icon: 'ph:eye-bold', text: 'La **Vista previa** muestra lo que tienes en pantalla, guardado o no. Cambia el ejemplo a **30 productos** para ver cómo se acomoda un pedido grande.' },
      ],
    },
    {
      id: 'problemas',
      title: 'Si algo no funciona',
      icon: 'ph:lifebuoy-bold',
      blocks: [
        {
          type: 'faq',
          items: [
            { q: 'El botón **Guardar cambios** está gris y dice «Corrige los campos marcados.»', a: 'Algún campo tiene un valor fuera de rango; el mensaje en rojo bajo el campo dice cuál y por qué (por ejemplo «No puede superar el máximo»).' },
            { q: 'Aparece «Otro usuario guardó cambios en esta sección mientras editabas…».', a: 'Alguien más guardó antes que tú. Pulsa **Cargar valores actuales** y vuelve a aplicar tus cambios.' },
            { q: 'Al salir me pregunta «Tienes cambios sin guardar. ¿Salir y descartarlos?»', a: 'Pulsa **Cancelar** y guarda primero; si aceptas, lo que cambiaste se pierde.' },
            { q: 'En Caja dice «No puede ser menor que el fondo sugerido…».', a: 'El límite de efectivo debe ser mayor que el fondo con el que abre la caja, o déjalo en $0 (sin límite).' },
            { q: 'En Inventario dice «Debe ser menor que los días de advertencia.»', a: 'Los días en rojo deben ser menos que los de amarillo, y los de amarillo no pueden pasar del horizonte de alerta.' },
            { q: 'En Ticket el RFC marca «Formato inválido…».', a: 'Escribe 12 caracteres si es empresa o 13 si es persona física, sin espacios ni guiones.' },
            { q: 'No puedo desactivar una plantilla de ticket.', a: 'No se puede desactivar la que está «En el POS» ni la última activa. Primero elige otra con **Usar esta plantilla en el POS**.' },
            { q: 'La nota de remisión sale sin datos de la farmacia.', a: 'Falta la ficha: captúrala en **Configuración › Ticket** (Datos de la farmacia) y guarda.' },
          ],
        },
      ],
    },
  ],
}
