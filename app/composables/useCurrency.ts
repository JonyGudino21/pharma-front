export const useCurrency = () => {
  const formatCurrency = (value: number | null | undefined, currency = 'MXN', locale = 'es-MX'): string => {
    if (value === null || value === undefined) return '$0.00'

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatNumber = (value: number | null | undefined, locale = 'es-MX'): string => {
    if (value === null || value === undefined) return '0'
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^0-9.-]+/g, '')
    return parseFloat(cleaned) || 0
  }

  return { formatCurrency, formatNumber, parseCurrency }
}