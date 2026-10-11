# PharmaPOS — Frontend

Interfaz web del punto de venta para farmacias **PharmaPOS**: venta en mostrador con escáner,
caja y arqueo, inventario por lotes con caducidades y libro de medicamentos controlados,
compras, proveedores, clientes con crédito, usuarios y permisos, y configuración de la
operación (ticket, caja, inventario, descuentos, impuestos, nota de remisión y dispositivos).

Es una aplicación **Nuxt 4 (Vue 3)** que consume el API del backend
[`pharma-back`](../pharma-back) (NestJS). No guarda datos de negocio por su cuenta: el servidor
es la fuente de verdad y aquí sólo se presenta, se valida para dar retroalimentación inmediata y
se imprime.

## Stack

| Pieza | Uso |
|---|---|
| Nuxt 4 + Vue 3 (`<script setup>`, TypeScript) | Aplicación y enrutado por archivos (`app/pages`) |
| Pinia (`@pinia/nuxt`) | Estado por módulo (`app/stores`) |
| Tailwind CSS v4 (`@tailwindcss/vite`) | Estilos y tema (`app/assets/css/main.css`) |
| `@nuxt/icon` | Iconos Phosphor (`ph:*`) |
| `@nuxtjs/color-mode` | Modo claro/oscuro |
| `vue3-apexcharts` | Gráficas del tablero |
| `@fontsource/ibm-plex-mono`, `@fontsource/literata` | Tipografías servidas por la propia app (sin Google Fonts) |
| Vitest | Pruebas unitarias de lógica pura |
| WebUSB + ESC/POS propio (`app/utils/escpos.ts`) | Impresora térmica y cajón de dinero |

## Requisitos

- **Node.js 22** (la versión que usa CI).
- **pnpm 10** (el proyecto declara `packageManager: pnpm@10.32.1`; con Corepack: `corepack enable`).
- El backend `pharma-back` corriendo y accesible (por defecto en `http://localhost:3005/api`).
- Para impresora térmica USB y cajón: un navegador con **WebUSB** (Chrome o Edge de escritorio)
  servido en contexto seguro (HTTPS o `localhost`).

## Instalación

```bash
pnpm install          # también ejecuta `nuxt prepare` (postinstall)
pnpm dev              # http://localhost:3000
```

## Variables de entorno

Se leen al arrancar/compilar (`nuxt.config.ts` → `runtimeConfig.public`).

| Variable | Por omisión | Para qué |
|---|---|---|
| `NUXT_PUBLIC_API_BASE_URL` | `http://localhost:3005/api` | URL base del API del backend (incluye el prefijo `/api`). |
| `NUXT_PUBLIC_HEALTH_URL` | *(vacío)* | URL de la sonda de conexión. Vacío = `<origen del API>/health/ready`. Úsala si un proxy no expone `/health` en el mismo origen. |

**Producción (recomendado, ADR-0024):** compilar con la API **relativa** y servir front y API desde el
mismo origen con Caddy. El mismo build sirve para cualquier farmacia y las cookies funcionan sin CORS
cruzado:

```dotenv
NUXT_PUBLIC_API_BASE_URL=/api
```

> Si el API vive en otro dominio, el backend debe permitir CORS con `credentials: true` y una lista
> explícita de orígenes, y las cookies necesitan `COOKIE_SAME_SITE=none` + `COOKIE_SECURE=true`.
> Guía completa de instalación: `pharma-back/docs/produccion/README.md`.

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga en caliente. |
| `pnpm generate` | **Build de producción**: sitio estático en `.output/public` (SPA, ADR-0020). Es lo que se publica. |
| `pnpm build` | Compila con servidor Nitro (lo usa CI como verificación; no hace falta para publicar). |
| `pnpm preview` | Sirve localmente el build. |
| `pnpm typecheck` | Verificación de tipos (`nuxt typecheck`, usa `vue-tsc`). |
| `pnpm test` | Pruebas unitarias con Vitest (`app/**/*.spec.ts`). |

CI (`.github/workflows/ci.yml`) ejecuta en cada push/PR a `develop` y `main`:
`pnpm install --frozen-lockfile` → `pnpm typecheck` → `pnpm test` → `pnpm build`.

## Estructura

```
app/
  pages/        rutas (POS, ventas, caja, inventario, catálogo, compras, clientes, configuración…)
  components/   componentes por módulo (pos/, receipt/, settings/, shared/…)
  composables/  lógica reutilizable (impresión, conectividad, actualización, atajos…)
  stores/       estado Pinia por módulo; aquí viven las llamadas al API
  plugins/      $api (cliente HTTP), vigilante de conexión, aviso de versión, ApexCharts
  middleware/   autenticación y permisos por ruta
  utils/        lógica pura (ESC/POS, nota de remisión, importe con letra, dinero…)
  types/        tipos compartidos (auth, ticket, configuración)
docs/           documentación técnica y ejecutiva
```

## Documentación

- [`docs/README.md`](docs/README.md) — índice general.
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — arquitectura, flujo de datos, sesión, errores,
  impresión, conectividad y actualizaciones.
- [`docs/modulos/`](docs/modulos) — documentación técnica por módulo.
- [`docs/ejecutivo/`](docs/ejecutivo) — guías para dueños y personal de la farmacia, incluida la
  [Guía rápida del cajero](docs/ejecutivo/GUIA_CAJERO.md).
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — cambios.

## Contribuir

Ramas, formato de commits, PRs y versionado: [`CONTRIBUTING.md`](CONTRIBUTING.md).
Orden de despliegue: **backend (con `prisma migrate deploy`) antes que frontend**.

## Licencia

Ver [`LICENSE`](LICENSE).
