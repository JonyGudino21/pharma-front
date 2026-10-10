# Inventario: existencias, caducidades y controlados

## Qué hace

- **Control**: valor del inventario, productos con existencia baja, historial de movimientos de
  cada producto (Kardex) y ajustes por conteo físico.
- **Caducidades**: semáforo de lotes por caducar y registro de mermas.
- **Libro de controlados**: registro de cada dispensa, devolución y destrucción de medicamentos
  controlados, con receta, médico y paciente; se puede imprimir o exportar.

## Cómo se usa

**Ajustar existencias**
1. Inventario → busca el producto → **Ajustar**.
2. Escribe la cantidad contada físicamente; el sistema muestra si sobra o falta.
3. Escribe el motivo y confirma. Queda en el Kardex.

**Revisar caducidades**
1. Inventario → **Caducidades**.
2. Elige el horizonte (30, 60, 90 días o el configurado). Colores: rojo = caducado o crítico,
   amarillo = próximo, verde = vigente.
3. Para retirar un lote: **merma**, cantidad y motivo.

**Libro de controlados**
1. Inventario → **Libro de controlados**.
2. Filtra por receta, cédula, paciente, fechas o tipo.
3. **Imprimir** o **Exportar CSV** (archivo para Excel) para entregar a la autoridad.

## Qué protege

- **No se vende caducado**: el punto de venta sólo cuenta existencias de lotes vigentes.
- **Lote y caducidad obligatorios** en medicamentos controlados (y en todo, si así se configura).
- **Trazabilidad**: cada ajuste y merma queda con motivo en el Kardex.
- **Información confiable**: si el servidor falla, la pantalla lo dice; nunca muestra "no hay
  lotes por caducar" o "no hay registros" por un error.

## Limitaciones

- La exportación CSV del libro de controlados es la oficial del servidor: incluye **todo** el
  periodo elegido, queda registrado quién la descargó y lleva una huella de integridad. Sólo
  gerencia puede exportar; el farmacéutico puede consultarlo e imprimirlo.
- Los criterios de semáforo los define gerencia en **Configuración › Inventario**.

## Consejos de operación

- Revisa Caducidades al menos una vez por semana y retira lo crítico.
- Haz conteos cíclicos de los productos de mayor rotación y ajusta con motivo claro.
- Exporta el libro de controlados al cierre de cada mes y guárdalo.
