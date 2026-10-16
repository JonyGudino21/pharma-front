import { dateParts } from '~/utils/dates'

/**
 * Formato de fechas para pantalla (es-MX, DD/MM/AAAA).
 * Momentos (createdAt…) en hora local; fechas de calendario (caducidades) tal
 * cual el día guardado. La regla vive en `utils/dates.ts`.
 */
export const useDate = () => {
  const pad = (n: number) => String(n).padStart(2, '0')

  const formatDate = (date: string | Date): string => {
    if (!date) return ''
    const p = dateParts(date)
    if (!p.valid) return ''
    return `${pad(p.day)}/${pad(p.month)}/${p.year}`
  }

  const formatDateTime = (date: string | Date): string => {
    if (!date) return ''
    const p = dateParts(date)
    if (!p.valid) return ''
    return `${pad(p.day)}/${pad(p.month)}/${p.year} ${pad(p.hours)}:${pad(p.minutes)}`
  }

  const formatTime = (date: string | Date): string => {
    if (!date) return ''
    const p = dateParts(date)
    if (!p.valid) return ''
    return `${pad(p.hours)}:${pad(p.minutes)}`
  }

  const getRelativeTime = (date: string | Date): string => {
    if (!date) return ''
    const p = dateParts(date)
    if (!p.valid) return ''
    const diffMs = Date.now() - p.time
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    if (diffDays < 7) return `Hace ${diffDays} días`

    return formatDate(date)
  }

  return { formatDate, formatDateTime, formatTime, getRelativeTime }
}
