import type { HelpGuide } from '../types'

export const inicio: HelpGuide = {
  id: 'inicio',
  title: 'Dashboard (panel financiero)',
  summary: 'Cuánto vendiste, cuánto ganaste y cómo está el dinero del negocio, en una sola pantalla.',
  icon: 'ph:chart-line-up-bold',
  sections: [
    {
      id: 'que-es',
      title: 'Qué es / para qué sirve',
      icon: 'ph:info-bold',
      blocks: [
        { type: 'p', text: 'Es la pantalla de inicio (**Dashboard** en el menú). Se llama «Panel de Control Financiero» y es para gerencia y dueños.' },
        {
          type: 'list',
          items: [
            'Cuánto se vendió y cuánto se ganó en un periodo.',
            'Cuánto te deben los clientes, cuánto debes a proveedores y cuánto vale tu inventario.',
            'Con qué se paga más (efectivo, tarjeta, transferencia) y qué productos se venden más.',
          ],
        },
        { type: 'tip', icon: 'ph:lightbulb-bold', text: 'Es un resumen. Para ver cada venta una por una, entra a **Ventas**.' },
      ],
    },
    {
      id: 'indicadores',
      title: 'Qué significa cada número',
      icon: 'ph:gauge-bold',
      blocks: [
        { type: 'p', text: 'Las tarjetas de arriba cuentan sólo ventas **cobradas y cerradas** del periodo. Las ventas canceladas no cuentan.' },
        {
          type: 'list',
          items: [
            '**Ventas Totales**: la suma de lo vendido. Incluye ventas a crédito aunque el cliente aún no pague.',
            '**Costo Total**: lo que te costó la mercancía que vendiste.',
            '**Utilidad Bruta**: ventas menos costo. Es tu ganancia antes de gastos (renta, luz, sueldos).',
            '**Margen**: qué parte de cada peso vendido es ganancia. Un 30 % quiere decir que de cada $100 ganas $30.',
            '**Ticket Prom.**: lo que gasta en promedio cada cliente por compra.',
            '**Transacciones**: cuántas ventas se hicieron.',
          ],
        },
        { type: 'p', text: '**Liquidez Actual** es una foto de **hoy**, no del periodo elegido:' },
        {
          type: 'list',
          items: [
            '**Cuentas por Cobrar**: lo que te deben los clientes a crédito.',
            '**Cuentas por Pagar**: lo que debes a tus proveedores.',
            '**Valor Inventario**: tus existencias multiplicadas por su costo (productos activos).',
          ],
        },
      ],
    },
    {
      id: 'graficas',
      title: 'Las gráficas',
      icon: 'ph:chart-pie-slice-bold',
      blocks: [
        {
          type: 'list',
          items: [
            '**Ventas por Método de Pago**: cuánto entró por cada forma de pago. Pasa el cursor sobre la dona para ver el importe.',
            '**Top 5 Productos Ingresados**: los cinco productos que más piezas vendieron en el periodo. La barra muestra cuánto dinero dejaron; al pasar el cursor ves también las piezas.',
          ],
        },
        { type: 'tip', icon: 'ph:translate-bold', text: 'Si la dona muestra nombres en inglés: **CASH** es efectivo, **CARD** es tarjeta y **TRANSFER** es transferencia.' },
      ],
    },
    {
      id: 'periodo',
      title: 'Elegir el periodo',
      icon: 'ph:calendar-blank-bold',
      blocks: [
        { type: 'p', text: 'Al entrar se muestra el **mes en curso**. Arriba, al centro de los resultados, ves las fechas que se están mostrando.' },
        {
          type: 'list',
          items: [
            '**Este Mes**: del día 1 al último día del mes actual.',
            '**Mes Pasado**: el mes anterior completo.',
            'Otro periodo: escribe la fecha de inicio y la de fin en los dos campos de fecha y pulsa **Filtrar**.',
          ],
        },
        { type: 'tip', icon: 'ph:lightbulb-bold', text: 'Compara el **Margen** de este mes con el del mes pasado cada semana. Si las **Cuentas por Cobrar** crecen, revisa a tus deudores en **Clientes**.' },
      ],
    },
    {
      id: 'quien-lo-ve',
      title: 'Quién lo ve',
      icon: 'ph:shield-check-bold',
      blocks: [
        { type: 'p', text: 'Las cifras sólo aparecen para quien tiene el permiso **Reportes y tablero**. Los demás ven «Acceso Restringido».' },
        { type: 'p', text: 'El permiso se da en **Configuración › Permisos**, en el grupo «Administración». Sólo quien administra usuarios puede cambiarlo.' },
        { type: 'tip', icon: 'ph:lock-simple-bold', text: 'Aquí se ve la ganancia y el costo del negocio. Dale el permiso sólo a quien de verdad lo necesita.' },
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
            { q: 'Dice «Acceso Restringido. Solo el personal de gerencia puede ver las métricas financieras.»', a: 'Tu usuario no tiene el permiso **Reportes y tablero**. Si lo necesitas, pide a gerencia que te lo active en **Configuración › Permisos**.' },
            { q: 'Aparece «No se pudo conectar con el servidor.» y «No pudimos consultar las métricas; eso no significa que no haya ventas.»', a: 'El sistema no pudo traer los números. Tus ventas están a salvo. Revisa la conexión y pulsa **Reintentar**.' },
            { q: 'Aparece una franja amarilla: «No se pudieron actualizar las métricas (…). Se muestran las últimas que sí cargaron.»', a: 'Lo que ves es de la consulta anterior, no del periodo que acabas de pedir. Vuelve a pulsar **Filtrar** cuando regrese la conexión.' },
            { q: 'Las gráficas dicen «Sin datos registrados» o «Sin productos vendidos».', a: 'No hay ventas cerradas en esas fechas. Revisa que el periodo sea el correcto.' },
            { q: 'Ventas Totales no cuadra con el dinero de la caja.', a: 'Es normal: Ventas Totales incluye tarjeta, transferencia y crédito; en la caja sólo está el efectivo. Para el efectivo de un turno revisa **Caja**.' },
          ],
        },
      ],
    },
  ],
}
