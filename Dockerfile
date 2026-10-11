# syntax=docker/dockerfile:1
#
# Imagen "web" de PharmaPOS: compila el front (SPA estática) y la sirve con
# Caddy, que además hace de proxy hacia la API en el MISMO origen
# (/api y /health). Ver pharma-back/docs/produccion/03-NUBE.md y ADR-0024.
#
# El front se compila con la API relativa (`/api`): el mismo build sirve para
# cualquier dominio, sin recompilar por cliente.

# ── 1. Compilación ──────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# --ignore-scripts: `postinstall` (nuxt prepare) necesita el código fuente,
# que todavía no está copiado; `nuxt generate` lo prepara después.
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
ARG NUXT_PUBLIC_API_BASE_URL=/api
ENV NUXT_PUBLIC_API_BASE_URL=${NUXT_PUBLIC_API_BASE_URL}
RUN pnpm generate

# ── 2. Servidor web ─────────────────────────────────────────────────────────
FROM caddy:2-alpine
COPY --from=build /app/.output/public /srv
# El Caddyfile se monta desde pharma-back/deploy/nube/Caddyfile.
