import type { HelpGuide } from '../types'

export const inventario: HelpGuide = {
  id: 'inventario',
  title: 'Inventario, lotes y caducidades',
  summary: 'Revisa existencias, corrige conteos, cuida las caducidades y lleva el libro de controlados.',
  icon: 'ph:archive-box-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'En el menú **Inventario** tienes tres pantallas:' },
        {
          type: 'list',
          items: [
            '**Control**: cuánto vale tu inventario, cuántos productos están en existencia baja, el historial de cada producto (Kardex) y los ajustes por conteo.',
            '**Caducidades**: los lotes por caducar con un semáforo de colores y el registro de mermas.',
            '**Libro de controlados**: cada venta, devolución y destrucción de medicamentos controlados, con receta, médico y paciente.',
          ],
        },
        { type: 'tip', icon: 'ph:lock-key-bold', text: 'Cada opción depende de tu permiso. Si no ves una pantalla o un botón, pide a gerencia el permiso.' },
      ],
    },
    {
      id: 'existencias',
      title: 'Existencias y Kardex',
      icon: 'ph:clock-counter-clockwise-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Entra a **Inventario › Control**.',
            'En «Operaciones por Producto», escribe el nombre del producto. Aparece su «Stock en sistema» (en rojo si está en su mínimo o por debajo).',
            'Pulsa **Kardex** para ver su historial de movimientos.',
          ],
        },
        { type: 'p', text: 'El **Kardex** es el historial de movimientos: cada entrada y salida del producto, con fecha, cantidad (+ entra, − sale), motivo y la existencia que quedó («Balance»). Los tipos aparecen en inglés: **PURCHASE** es compra, **INITIAL** inventario inicial, **SALE** venta, **ADJUSTMENT** ajuste, **LOSS** merma y **RETURN** devolución.' },
        { type: 'tip', icon: 'ph:warning-circle-bold', text: 'La tarjeta **Alertas de Stock** cuenta los productos que llegaron a su stock mínimo. En **Catálogo › Productos** los verás marcados con «Stock Bajo».' },
      ],
    },
    {
      id: 'ajustes',
      title: 'Ajuste por conteo',
      icon: 'ph:sliders-horizontal-bold',
      blocks: [
        { type: 'p', text: 'Úsalo cuando cuentas los productos en el anaquel y no coinciden con el sistema.' },
        {
          type: 'steps',
          items: [
            'En **Inventario › Control**, busca el producto y pulsa **Ajustar**.',
            'En «¿Cuánto contaste físicamente?» escribe las piezas que contaste. El sistema te dice si hay **sobrante** o **faltante** y la diferencia.',
            'Escribe el motivo (por ejemplo, «error de conteo previo»).',
            'Pulsa **Aplicar Ajuste**.',
          ],
        },
        { type: 'warn', text: 'El ajuste cambia la existencia y queda en el Kardex con tu nombre y el motivo. Cuenta dos veces antes de aplicarlo.' },
        { type: 'tip', icon: 'ph:hourglass-bold', text: 'Si el producto ya maneja lotes, el ajuste a ciegas está bloqueado: para dar de baja piezas usa **Merma** en **Inventario › Caducidades**.' },
      ],
    },
    {
      id: 'lotes',
      title: 'Lotes y FEFO',
      icon: 'ph:barcode-bold',
      blocks: [
        { type: 'p', text: 'La caducidad no es del producto, es de cada caja. Por eso el sistema la guarda junto con el **lote** (el número que el laboratorio imprime al lado de la fecha).' },
        { type: 'p', text: 'Al vender, el sistema usa **FEFO** (primero se vende lo que caduca primero): descuenta solo del lote que caduca antes. Tú no tienes que elegirlo.' },
        { type: 'p', text: '¿Tienes mercancía de antes de usar lotes? Asígnale su lote:' },
        {
          type: 'steps',
          items: [
            'En **Inventario › Control**, busca el producto y pulsa **Asignar lote**. Verás «Existencia», «Con lote» y «Sin lote».',
            'Toma una caja y copia el **Número de lote** y la **Caducidad** impresos en ella.',
            'Escribe cuántas piezas tienen ese lote y pulsa **Asignar lote**.',
            'Si tienes cajas de otro lote, la ventana se queda abierta: repite con el siguiente hasta que «Sin lote» llegue a 0.',
          ],
        },
        { type: 'warn', text: 'Un medicamento controlado sin lote **no se puede vender**. Asigna el lote de toda su existencia antes de venderlo.' },
      ],
    },
    {
      id: 'caducidades',
      title: 'Caducidades y semáforo',
      icon: 'ph:traffic-signal-bold',
      blocks: [
        { type: 'p', text: 'En **Inventario › Caducidades** ves los lotes ordenados por fecha. Arriba eliges hasta cuántos días ver: **30**, **60**, **90** o el que configuró gerencia.' },
        {
          type: 'list',
          items: [
            '**Rojo** («Caducado» o «Crítico»): ya caducó o le quedan muy pocos días. Retíralo, devuélvelo al proveedor o liquídalo.',
            '**Amarillo** («Próximo»): planea su salida con una promoción.',
            '**Verde** («Vigente»): todavía tiene tiempo.',
          ],
        },
        { type: 'tip', icon: 'ph:gear-bold', text: 'Los días de cada color salen escritos arriba de la lista. Gerencia los cambia en **Configuración › Inventario** (enlace «Ajustar criterios»).' },
      ],
    },
    {
      id: 'merma',
      title: 'Merma o destrucción de un lote',
      icon: 'ph:trash-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'En **Inventario › Caducidades**, busca el lote. Si no aparece, elige más días arriba.',
            'Pulsa **Merma** en su renglón.',
            'Escribe la **Cantidad a destruir** y el motivo (por ejemplo, «Caducado» o «Caja rota»).',
            'Pulsa **Registrar merma**.',
          ],
        },
        { type: 'warn', text: 'La merma saca las piezas del inventario y no se puede deshacer. Si el producto es controlado, también queda como «Destrucción» en el libro de controlados.' },
      ],
    },
    {
      id: 'controlados',
      title: 'Libro de controlados',
      icon: 'ph:notebook-bold',
      blocks: [
        { type: 'p', text: 'En **Inventario › Libro de controlados** queda cada dispensa, devolución y destrucción de controlados. Nadie puede borrar ni cambiar un renglón: las correcciones se registran como renglones nuevos.' },
        {
          type: 'steps',
          items: [
            'Filtra por «Folio / receta», «Cédula», «Paciente», «Tipo» o fechas («Desde» y «Hasta»).',
            'Pulsa **Aplicar** (o `Enter` en los campos de texto).',
            'Pulsa **Imprimir** para sacarlo en papel, o **Exportar CSV** para un archivo que abre Excel.',
          ],
        },
        { type: 'tip', icon: 'ph:file-csv-bold', text: '**Exportar CSV** sólo lo usa gerencia. Exporta el periodo completo y el tipo elegido (receta, médico y paciente sólo filtran la pantalla). Queda registrado quién exportó y el aviso muestra una «huella de integridad». Guarda el archivo cada mes.' },
        { type: 'warn', text: 'Este libro es el que revisa COFEPRIS. No vendas controlados sin capturar bien la receta, el médico y el paciente.' },
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
            { q: 'Caducidades dice «Esto NO significa que no haya lotes por caducar: no pudimos consultarlos».', a: 'El servidor no respondió. Pulsa **Reintentar**. Mientras tanto, no vendas productos dudosos sin revisar la fecha de la caja.' },
            { q: 'Aparece «No se pudo conectar con el servidor» o «No tienes permiso para consultar esta información».', a: 'Revisa tu internet y pulsa **Reintentar**. Si es de permiso, pide a gerencia que te lo dé.' },
            { q: 'El botón «Aplicar Ajuste» no se puede pulsar.', a: 'La cantidad contada es igual a la del sistema («Sin cambios. No se requiere ajuste.») o falta escribir el motivo.' },
            { q: 'El ajuste me manda a Caducidades.', a: 'El producto maneja lotes. Para bajar piezas usa **Merma** en el lote correcto.' },
            { q: 'En «Asignar lote» sale «Esa caducidad ya pasó: un lote caducado no se asigna, se da de baja».', a: 'Un lote vencido no se asigna. Asigna sólo las cajas vigentes y aparta las caducadas; pide a gerencia que las dé de baja.' },
            { q: 'Sale «Sólo hay X pieza(s) sin lote».', a: 'Escribiste más piezas de las que faltan por asignar. Revisa la cifra de «Sin lote».' },
            { q: '«Toda la existencia de este producto ya tiene lote y caducidad. No hay nada que asignar.»', a: 'Ese producto ya está completo. No necesitas hacer nada.' },
            { q: 'Busco un producto y sale «No se encontraron productos con ese nombre».', a: 'Revisa cómo está escrito, prueba con menos letras o búscalo en **Catálogo › Productos**. Si nada aparece, revisa tu conexión.' },
            { q: 'El libro de controlados dice «Esto NO significa que el libro esté vacío: no pudimos consultarlo».', a: 'Fue un error de conexión, no faltan registros. Pulsa **Reintentar**.' },
          ],
        },
      ],
    },
  ],
}
