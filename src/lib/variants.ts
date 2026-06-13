import type { ProductVariant } from '@/types/api'

export type AttributeSelections = Record<string, string>

export function getAttributeNames(variants: ProductVariant[]): string[] {
  const names = new Set<string>()
  for (const variant of variants) {
    for (const attr of variant.attributes ?? []) {
      if (attr.name) names.add(attr.name)
    }
  }
  return Array.from(names)
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
  const names = getAttributeNames(variants)
  const complete = names.every((name) => !!selections[name])
  if (!complete) return null

  return (
    variants.find((variant) => {
      if (!variant.is_active && variant.is_active !== undefined) return false
      return names.every((name) => {
        const attr = variant.attributes?.find((a) => a.name === name)
        return attr?.value === selections[name]
      })
    }) ?? null
  )
}

export function getDefaultSelections(variants: ProductVariant[]): AttributeSelections {
  const inStock = variants.find((v) => (v.stock_quantity ?? 0) > 0) ?? variants[0]
  if (!inStock) return {}

  const selections: AttributeSelections = {}
  for (const attr of inStock.attributes ?? []) {
    if (attr.name && attr.value) selections[attr.name] = attr.value
  }
  return selections
}

export function variantImage(variant: ProductVariant | null, fallback?: string): string | undefined {
  if (!variant) return fallback
  const main = variant.images?.find((img) => img.is_main) ?? variant.images?.[0]
  return main?.image ?? fallback
}
