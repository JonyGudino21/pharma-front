import type { HelpGuide } from '../types'

export const catalogo: HelpGuide = {
  id: 'catalogo',
  title: 'Catálogo de productos y categorías',
  summary: 'Da de alta los productos que vendes, con su precio, IVA, código de barras y existencia inicial.',
  icon: 'ph:package-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'En **Catálogo › Productos** está la lista de todo lo que vende la farmacia: nombre, precio, existencia y si está activo. En **Catálogo › Categorías** agrupas los productos (por ejemplo, «Analgésicos» o «Higiene»).' },
        { type: 'p', text: 'Todos pueden consultar el catálogo. Para crear o editar necesitas permiso; si no ves el botón **Nuevo Producto**, pide a gerencia el permiso.' },
        { type: 'tip', icon: 'ph:eye-slash-bold', text: 'La columna «Costo (Privado)» sólo la ve quien administra productos.' },
      ],
    },
    {
      id: 'alta',
      title: 'Dar de alta un producto',
      icon: 'ph:plus-circle-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Entra a **Catálogo › Productos** y pulsa **Nuevo Producto**.',
            'Escribe el **Nombre del Producto**. Si lo sabes, llena «Concentración» (500mg), «Forma Farmacéutica» (tabletas) y «Presentación Comercial» (caja con 20).',
            'Escanea o escribe el **Código de Barras** de la caja.',
            'Escribe el **Costo de Compra** y el **Precio de Venta**.',
            'Elige el **IVA** y, si aplica, marca **Medicamento Controlado (Receta Obligatoria)**.',
            'Revisa el **Stock Mínimo (Alerta)**, marca sus categorías y pulsa **Guardar Producto**.',
          ],
        },
        { type: 'p', text: 'No escribes el **SKU** (código interno): el sistema lo genera solo con el nombre y la presentación al guardar.' },
        { type: 'tip', icon: 'ph:barcode-bold', text: 'Captura siempre el código de barras: así en caja sólo escaneas. No puede repetirse entre dos productos.' },
      ],
    },
    {
      id: 'precio-iva',
      title: 'Precio e IVA',
      icon: 'ph:tag-bold',
      blocks: [
        { type: 'p', text: 'El **Precio de Venta** se escribe **con IVA incluido**: es lo que paga el cliente. Precio y costo deben ser mayores a 0.' },
        {
          type: 'list',
          items: [
            '**Tasa 0 %**: medicinas y alimentos.',
            '**General (16 % / 8 %)**: perfumería, refrescos y similares. Debajo del precio verás cuánto IVA contiene.',
            '**Exento**: casos especiales. Pregúntale a tu contador.',
          ],
        },
        { type: 'p', text: 'Al crear un producto, el IVA ya viene con el que gerencia eligió en **Configuración › Impuestos**.' },
        { type: 'warn', text: 'El IVA es una decisión fiscal. En un producto existente sólo gerencia lo cambia («Sólo gerencia cambia el tratamiento de IVA.»).' },
      ],
    },
    {
      id: 'stock-inicial',
      title: 'Existencia inicial con lote',
      icon: 'ph:stack-bold',
      blocks: [
        { type: 'p', text: 'Si ya tienes piezas en el anaquel, escríbelas en **Stock Inicial Físico** al dar de alta. Aparece «Lote del inventario inicial» para capturar el **Número de lote** y la **Caducidad** impresos en la caja.' },
        {
          type: 'list',
          items: [
            'En un **controlado** el lote y la caducidad son obligatorios.',
            'En los demás son recomendados, salvo que gerencia los exija en **Configuración › Inventario**.',
            'Si todavía no tienes piezas, deja 0: el lote se captura al recibir la compra.',
          ],
        },
        { type: 'warn', text: 'El stock inicial crea un movimiento en el Kardex. No se puede dar de alta inventario ya caducado.' },
      ],
    },
    {
      id: 'editar',
      title: 'Editar y desactivar',
      icon: 'ph:pencil-simple-bold',
      blocks: [
        { type: 'p', text: 'En el renglón del producto, pulsa el lápiz (**Editar**), cambia lo necesario y pulsa **Guardar Producto**.' },
        { type: 'p', text: 'Al editar no puedes cambiar la existencia. Para eso usa **Inventario › Control** (ajuste por conteo) o **Compras**.' },
        { type: 'p', text: 'El botón del bote de basura **desactiva** el producto: no lo borra, sólo deja de venderse en el Punto de Venta. Para verlo de nuevo, elige «Inactivos» en el filtro, edítalo y marca **Producto Activo (Visible en Catálogo y POS)**.' },
      ],
    },
    {
      id: 'categorias',
      title: 'Categorías',
      icon: 'ph:folders-bold',
      blocks: [
        {
          type: 'steps',
          items: [
            'Entra a **Catálogo › Categorías** y pulsa **Nueva Categoría**.',
            'Escribe el nombre y, si quieres, una descripción (hasta 500 letras).',
            'Pulsa **Guardar**.',
          ],
        },
        { type: 'p', text: 'Con el lápiz la editas; con el bote de basura la desactivas. Desactivarla no borra sus productos.' },
        { type: 'tip', icon: 'ph:lightbulb-bold', text: 'Usa nombres claros: gerencia puede cambiar el IVA de toda una categoría de una vez en **Configuración › Impuestos**.' },
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
            { q: 'Sale «El precio y el costo deben ser mayores a 0».', a: 'Escribe un precio y un costo reales. El sistema no deja guardar productos gratis.' },
            { q: 'Sale «Un medicamento controlado necesita lote y caducidad para registrar su inventario inicial».', a: 'Copia el lote y la caducidad de la caja, o deja el stock inicial en 0 y captúralo al recibir la compra.' },
            { q: 'Sale «El número de lote y la caducidad van juntos».', a: 'Llenaste sólo uno de los dos. Escribe ambos o borra los dos.' },
            { q: 'Sale «Esa caducidad ya pasó: no se puede dar de alta inventario caducado».', a: 'Revisa la fecha. Si la caja de verdad está caducada, no la registres: apártala.' },
            { q: 'Sale «La configuración de inventario exige lote y caducidad en toda entrada de mercancía».', a: 'Gerencia pidió lote en todo. Captúralo o deja el stock inicial en 0.' },
            { q: 'Al guardar sale un aviso rojo y la ventana no se cierra.', a: 'Lee el aviso: lo más común es que el código de barras ya lo tiene otro producto o que la categoría ya existe. Corrige y vuelve a guardar.' },
            { q: 'En categorías dice «No hay categorías activas. Crea una primero».', a: 'Ve a **Catálogo › Categorías**, crea una y vuelve a abrir el producto.' },
            { q: 'No puedo cambiar el IVA.', a: 'En productos existentes sólo gerencia lo cambia. Pídeselo.' },
            { q: 'No encuentro un producto que desactivé.', a: 'Cambia el filtro «Solo Activos» a «Inactivos» o «Todos los productos».' },
          ],
        },
      ],
    },
  ],
}
