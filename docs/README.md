# Documentación — pharma-front

Índice de la documentación del frontend de PharmaPOS. Escrita en español (México).

## Técnica

- [ARQUITECTURA.md](ARQUITECTURA.md) — estructura, flujo de datos (pages → stores → `$api` →
  backend), sesión con cookies `httpOnly` y renovación, manejo de errores, espejo de
  configuración, impresión (térmica WebUSB/ESC-POS y navegador), conectividad, estrategia de
  actualización, atajos, pruebas y variables de entorno.

### Módulos

| Módulo | Documento |
|---|---|
| Punto de venta | [modulos/POS.md](modulos/POS.md) |
| Ventas (historial, detalle, devoluciones, anulación) | [modulos/VENTAS.md](modulos/VENTAS.md) |
| Caja | [modulos/CAJA.md](modulos/CAJA.md) |
| Inventario (caducidades y controlados) | [modulos/INVENTARIO.md](modulos/INVENTARIO.md) |
| Catálogo (productos y categorías) | [modulos/CATALOGO.md](modulos/CATALOGO.md) |
| Compras | [modulos/COMPRAS.md](modulos/COMPRAS.md) |
| Proveedores | [modulos/PROVEEDORES.md](modulos/PROVEEDORES.md) |
| Clientes | [modulos/CLIENTES.md](modulos/CLIENTES.md) |
| Usuarios y permisos | [modulos/USUARIOS_Y_PERMISOS.md](modulos/USUARIOS_Y_PERMISOS.md) |
| Configuración | [modulos/CONFIGURACION.md](modulos/CONFIGURACION.md) |
| Impresión (ticket, dispositivos, nota de remisión) | [modulos/IMPRESION.md](modulos/IMPRESION.md) |
| Actualización y conectividad | [modulos/ACTUALIZACION_Y_CONECTIVIDAD.md](modulos/ACTUALIZACION_Y_CONECTIVIDAD.md) |
| Dashboard | [modulos/DASHBOARD.md](modulos/DASHBOARD.md) |

Cada documento de módulo cubre: rutas, componentes, store, endpoints consumidos, permisos,
estados de error, atajos de teclado y decisiones relevantes.

## Ejecutiva (dueño, familia y personal)

- [ejecutivo/README.md](ejecutivo/README.md) — índice.
- [ejecutivo/GUIA_CAJERO.md](ejecutivo/GUIA_CAJERO.md) — guía rápida del cajero.

## Otros

- [CHANGELOG.md](CHANGELOG.md) — cambios.
- [../README.md](../README.md) — instalación, variables de entorno y scripts.
- **Producción e instalación en farmacias:** `pharma-back/docs/produccion/README.md` (guía única
  para front y back; el front se publica con su `Dockerfile` o como ZIP de `.output/public`).
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — flujo de trabajo (ramas, commits, PRs, versionado).
- Backend: `pharma-back/docs/` (contrato del API en `API_CONTRACT.md`, matriz de permisos en
  `PERMISSIONS_MATRIX.md`, módulos del servidor).

## Mantener esta documentación

- Al cambiar una pantalla, actualiza su documento en `modulos/` y, si cambia cómo la usa el
  personal, el de `ejecutivo/`.
- Registra el cambio en `CHANGELOG.md` bajo **Sin publicar**.
- Sólo documenta lo que el código hace.
