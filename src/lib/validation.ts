const PASSWORD_MIN_LENGTH = 6
const PASSWORD_MAX_LENGTH = 72

const UZ_PHONE_PATTERN = /^(\+998|998)?9[0-9]{8}$/

export function validateNewPassword(password: string): string | undefined {
  const value = password.trim()
  if (!value) return 'Password is required'
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`
  }
  if (/\s/.test(password)) return 'Password must not contain spaces'
  return undefined
}

export function validateLoginPassword(password: string): string | undefined {
  if (!password.trim()) return 'Password is required'
  return undefined
}

export function normalizePhoneInput(phone: string): string {
  return phone.replace(/[\s\-().]/g, '')
}

export function normalizePhone(phone: string): string {
  const cleaned = normalizePhoneInput(phone)
  if (/^9[0-9]{8}$/.test(cleaned)) return `+998${cleaned}`
  if (/^9989[0-9]{8}$/.test(cleaned)) return `+${cleaned}`
  if (/^\+9989[0-9]{8}$/.test(cleaned)) return cleaned
  return cleaned
}

export function validatePhone(phone: string, options: { required?: boolean } = {}): string | undefined {
  const trimmed = phone.trim()
  if (!trimmed) {
    return options.required ? 'Phone number is required' : undefined
  }

  const cleaned = normalizePhoneInput(trimmed)
  if (!UZ_PHONE_PATTERN.test(cleaned)) {
    return 'Enter a valid mobile number (e.g. +998901234567)'
  }

  return undefined
}

export const passwordHint = `At least ${PASSWORD_MIN_LENGTH} characters, no spaces`

export const phoneHint = 'Format: +998901234567 or 901234567'

const SKU_MIN_LENGTH = 3
const SKU_MAX_LENGTH = 40
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/

export const skuHint = '3–40 characters: letters, numbers, hyphens (e.g. NIKE-TEE-BLK-M)'

export function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase()
}

export function validateSku(sku: string, existingSkus: string[] = []): string | undefined {
  const normalized = normalizeSku(sku)
  if (!normalized) return 'SKU is required'
  if (normalized.length < SKU_MIN_LENGTH || normalized.length > SKU_MAX_LENGTH) {
    return `SKU must be ${SKU_MIN_LENGTH}–${SKU_MAX_LENGTH} characters`
  }
  if (!SKU_PATTERN.test(normalized)) {
    return 'SKU can only contain letters, numbers, hyphens, and underscores'
  }
  if (existingSkus.some((existing) => normalizeSku(existing) === normalized)) {
    return 'This SKU is already used for this product'
  }
  return undefined
}

export function validateRequiredPrice(value: string, label = 'Price'): string | undefined {
  if (!value.trim()) return `${label} is required`
  const num = Number(value)
  if (Number.isNaN(num) || num < 0) return `${label} must be a non-negative number`
  return undefined
}

export function validateOptionalPrice(value: string, label: string): string | undefined {
  if (!value.trim()) return undefined
  const num = Number(value)
  if (Number.isNaN(num) || num < 0) return `${label} must be a non-negative number`
  return undefined
}

export function validateCompareAtPrice(compareAt: string, price: string): string | undefined {
  const formatError = validateOptionalPrice(compareAt, 'Compare-at price')
  if (formatError) return formatError
  if (!compareAt.trim()) return undefined
  const compareNum = Number(compareAt)
  const priceNum = Number(price)
  if (!Number.isNaN(priceNum) && compareNum < priceNum) {
    return 'Compare-at price must be greater than or equal to the sale price'
  }
  return undefined
}
