export function formatPrice(value?: number | null, currency = 'UZS'): string {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatNumber(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '0'
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPercent(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '0%'
  return `${value.toFixed(1)}%`
}

export function fullName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ') || '—'
}

export function reviewAuthorName(user?: {
  first_name?: string | null
  last_name?: string | null
  login?: string | null
}): string {
  const name = fullName(user?.first_name, user?.last_name)
  if (name !== '—') return name
  return user?.login?.trim() || 'Anonymous'
}

export function priceRange(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return '—'
  if (min != null && max != null && min !== max) {
    return `${formatPrice(min)} – ${formatPrice(max)}`
  }
  return formatPrice(min ?? max)
}
