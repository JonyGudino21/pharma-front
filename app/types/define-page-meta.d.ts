/**
 * definePageMeta es un macro de compilación de Nuxt disponible solo en páginas.
 * Esta declaración evita el error de TypeScript "Cannot find name 'definePageMeta'".
 */
declare const definePageMeta: (meta: {
  layout?: false | string
  middleware?: string | ((...args: unknown[]) => void) | Array<string | ((...args: unknown[]) => void)>
  [key: string]: unknown
}) => void
