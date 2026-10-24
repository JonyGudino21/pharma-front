# Módulo: Dashboard (panel financiero)

## Rutas

| Ruta | Archivo | Permiso |
|---|---|---|
| `/` | `app/pages/index.vue` | Ruta abierta a cualquier usuario con sesión; el contenido exige `canViewAnalytics`. |

Sin `canViewAnalytics` se muestra "Acceso Restringido".

## Store: `stores/analytics.ts`

- `fetchDashboard(startDate?, endDate?)` → `GET /analytics/dashboard?startDate&endDate`.
- `setCurrentMonthFilters()` / `setLastMonthFilters()` calculan el primer y último día del mes
  (hora local del navegador).
- En error: `data = null` y se registra en consola.

## Contenido

| Bloque | Datos (`DashboardData`) |
|---|---|
| KPIs | Ventas totales, costo total, utilidad bruta, margen %, ticket promedio, número de transacciones (`kpis`). |
| Liquidez actual | Cuentas por cobrar, cuentas por pagar, valor del inventario (`liquidity`). |
| Ventas por método de pago | Dona ApexCharts (`trends.salesByPaymentMethod`). |
| Top 5 productos | Barras horizontales por ingreso, con unidades en el *tooltip* (`trends.topSellingProducts`). |

Filtros: rango de fechas libre, **Este mes** y **Mes pasado**. Al entrar se carga el mes en
curso. Las gráficas siguen el modo claro/oscuro.

## Piezas

- `app/plugins/apexcharts.client.ts`: registra `vue3-apexcharts` sólo en el cliente.

## Endpoints consumidos

| Método | Ruta |
|---|---|
| GET | `/analytics/dashboard?startDate&endDate` |

## Estados de error

- Cargando sin datos previos: esqueleto.
- Error: no se pinta contenido (no hay mensaje de error propio; el toast del interceptor aplica
  para 403/5xx).
- Sin datos en una gráfica: "Sin datos registrados" / "Sin productos vendidos".

## Cobrar y pagar (v1.6, ADR-0029)

Sección bajo «Liquidez Actual»; son saldos de **hoy** (no dependen del periodo):

- `components/dashboard/ReceivablesWidget.vue`: total, vencido, termómetro compacto y las 5 primeras
  ventas en orden de cobro (`GET /client/receivables`).
- `components/dashboard/PayablesWidget.vue`: total, vencido / por vencer / sin fecha y las 5 compras
  a pagar primero (`GET /purchase/payables`).
