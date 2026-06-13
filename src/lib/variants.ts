import type { ProductVariant } from '@/types/api'

export type AttributeSelections = Record<string, string>

/** Used when variants have no attribute dimensions (size, color, etc.). */
export const VARIANT_GUID_SELECTION_KEY = '__variant_guid'

export function usesAttributeSelection(variants: ProductVariant[]): boolean {
  return getAttributeNames(variants).length > 0
}

export function getSelectableVariants(variants: ProductVariant[]): ProductVariant[] {
  return variants.filter((variant) => variant.is_active !== false)
}

export function getDefaultVariantGuid(variants: ProductVariant[]): string | undefined {
  const selectable = getSelectableVariants(variants)
  const inStock =
    selectable.find((variant) => (variant.stock_quantity ?? 0) > 0 || variant.in_stock) ??
    selectable[0]
  return inStock?.guid
}

export function variantDisplayLabel(variant: ProductVariant, index: number): string {
  if (variant.sku?.trim()) return variant.sku.trim()
  return `Option ${index + 1}`
}

export function getAttributeNames(variants: ProductVariant[]): string[] {
  const names = new Set<string>()
  for (const variant of variants) {
    for (const attr of variant.attributes ?? []) {
      if (attr.name) names.add(attr.name)
    }
  }
  return Array.from(names)
}

export function getAllAttributeValues(
  variants: ProductVariant[],
  attributeName: string,
): string[] {
  const values = new Set<string>()
  for (const variant of getSelectableVariants(variants)) {
    const attr = variant.attributes?.find((a) => a.name === attributeName)
    if (attr?.value) values.add(attr.value)
  }
  return Array.from(values)
}

export function getAttributeValues(
  variants: ProductVariant[],
  attributeName: string,
  selections: AttributeSelections,
): string[] {
  const values = new Set<string>()
  for (const variant of variants) {
    if (!variantMatchesPartialSelection(variant, selections, attributeName)) continue
    const attr = variant.attributes?.find((a) => a.name === attributeName)
    if (attr?.value) values.add(attr.value)
  }
  return Array.from(values)
}

export function isAttributeValueCompatible(
  variants: ProductVariant[],
  selections: AttributeSelections,
  attributeName: string,
  value: string,
): boolean {
  return getSelectableVariants(variants).some((variant) => {
    if (!variantMatchesPartialSelection(variant, selections, attributeName)) return false
    const attr = variant.attributes?.find((a) => a.name === attributeName)
    return attr?.value === value
  })
}

/** Pick a full attribute set when the chosen value conflicts with other selections. */
export function applyAttributeSelection(
  variants: ProductVariant[],
  selections: AttributeSelections,
  attributeName: string,
  value: string,
): AttributeSelections {
  const next = { ...selections, [attributeName]: value }
  if (resolveVariant(variants, next)) return next

  const candidates = getSelectableVariants(variants).filter((variant) => {
    const attr = variant.attributes?.find((a) => a.name === attributeName)
    return attr?.value === value
  })

  const pick =
    candidates.find((variant) => (variant.stock_quantity ?? 0) > 0 || variant.in_stock) ??
    candidates[0]
  if (!pick) return next

  const resolved: AttributeSelections = {}
  for (const attr of pick.attributes ?? []) {
    if (attr.name && attr.value) resolved[attr.name] = attr.value
  }
  return resolved
}

function variantMatchesPartialSelection(
  variant: ProductVariant,
  selections: AttributeSelections,
  excludeAttribute?: string,
): boolean {
  for (const [name, value] of Object.entries(selections)) {
    if (name === excludeAttribute || !value) continue
    const attr = variant.attributes?.find((a) => a.name === name)
    if (!attr || attr.value !== value) return false
  }
  return true
}

export function resolveVariant(
  variants: ProductVariant[],
  selections: AttributeSelections,
): ProductVariant | null {
  if (!usesAttributeSelection(variants)) {
    const selectable = getSelectableVariants(variants)
    if (!selectable.length) return null

    const selectedGuid = selections[VARIANT_GUID_SELECTION_KEY]
    if (selectedGuid) {
      return selectable.find((variant) => variant.guid === selectedGuid) ?? selectable[0]
    }
    return selectable[0]
  }

  const names = getAttributeNames(variants)
  const complete = names.every((name) => !!selections[name])
  if (!complete) return null

  return (
    getSelectableVariants(variants).find((variant) =>
      names.every((name) => {
        const attr = variant.attributes?.find((a) => a.name === name)
        return attr?.value === selections[name]
      }),
    ) ?? null
  )
}

export function getDefaultSelections(variants: ProductVariant[]): AttributeSelections {
  if (!usesAttributeSelection(variants)) {
    const guid = getDefaultVariantGuid(variants)
    return guid ? { [VARIANT_GUID_SELECTION_KEY]: guid } : {}
  }

  const inStock =
    getSelectableVariants(variants).find((variant) => (variant.stock_quantity ?? 0) > 0) ??
    getSelectableVariants(variants)[0]
  if (!inStock) return {}

  const selections: AttributeSelections = {}
  for (const attr of inStock.attributes ?? []) {
    if (attr.name && attr.value) selections[attr.name] = attr.value
  }
  return selections
}

export function variantImage(variant: ProductVariant | null, fallback?: string): string | undefined {
  if (!variant) return fallback
  return variant.images?.[0] ?? fallback
}
