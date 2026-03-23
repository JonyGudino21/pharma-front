export const useDate = () => {
  // Función auxiliar para corregir la zona horaria antes de extraer días/meses
  const parseSafeDate = (date: string | Date): Date => {
    const d = typeof date === 'string' ? new Date(date) : date
    const userTimezoneOffset = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() + userTimezoneOffset)
  }

  const formatDate = (date: string | Date): string => {
    if (!date) return ''
    const d = parseSafeDate(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatDateTime = (date: string | Date): string => {
    if (!date) return ''
    const d = parseSafeDate(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const formatTime = (date: string | Date): string => {
    if (!date) return ''
    const d = parseSafeDate(date)
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const getRelativeTime = (date: string | Date): string => {
    if (!date) return ''
    const d = parseSafeDate(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    if (diffDays < 7) return `Hace ${diffDays} días`

    return formatDate(d)
  }

  return { formatDate, formatDateTime, formatTime, getRelativeTime }
}