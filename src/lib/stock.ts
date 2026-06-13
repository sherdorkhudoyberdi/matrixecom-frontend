export function stockLabel(stock?: number, inCartQty?: number): string | undefined {
  if (stock == null || stock < 0) return undefined
  if (stock === 0) return 'Out of stock'
  if (inCartQty != null && inCartQty >= stock) return `${stock} in stock · max in cart`
  return `${stock} in stock`
}

export function maxAddableQuantity(stock?: number, inCartQty = 0): number {
  const available = stock ?? 0
  return Math.max(0, available - inCartQty)
}

export function clampQuantity(quantity: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(Math.max(1, quantity), max)
}
