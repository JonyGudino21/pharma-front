export const useDate = () => {
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    // Ajuste para evitar desfases de zona horaria
    const userTimezoneOffset = date.getTimezoneOffset() * 60000
    const correctedDate = new Date(date.getTime() + userTimezoneOffset)
    
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(correctedDate)
  }
  return { formatDate }
}