import { callMethod } from '@/api/client'
import type { Cart, CartItem } from '@/types/api'

function buildVariantLabel(attrs?: CartItem['attributes']): string | undefined {
  if (!attrs?.length) return undefined
  const parts = attrs
    .map((a) => {
      const name = a.name?.trim() ?? ''
      const value = a.value?.trim() ?? ''
      if (name && value) return `${name}: ${value}`
      return value || undefined
    })
    .filter(Boolean)
  return parts.length ? parts.join(', ') : undefined
}

export function normalizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    unit_price: item.unit_price ?? item.price,
    image: item.image ?? item.main_image,
    variant_label: item.variant_label ?? buildVariantLabel(item.attributes),
  }
}

function normalizeCart(cart: Cart): Cart {
  return {
    ...cart,
    items: cart.items.map(normalizeCartItem),
  }
}

function lineTotalForItem(item: CartItem, quantity: number) {
  const unitPrice = item.unit_price ?? item.price ?? 0
  return unitPrice * quantity
}

function summarizeCart(items: CartItem[]): Pick<Cart, 'item_count' | 'grand_total'> {
  const item_count = items.reduce((sum, item) => sum + item.quantity, 0)
  const grand_total = items.reduce(
    (sum, item) => sum + (item.line_total ?? lineTotalForItem(item, item.quantity)),
    0,
  )
  return { item_count, grand_total }
}

export function applyCartQuantity(cart: Cart, guid: string, quantity: number): Cart {
  const items = cart.items.map((item) => {
    if (item.guid !== guid) return item
    const stockQty = item.stock_quantity ?? quantity
    const line_total = lineTotalForItem(item, quantity)
    return {
      ...item,
      quantity,
      line_total,
      in_stock: stockQty >= quantity,
      stock_remaining: Math.max(0, stockQty - quantity),
    }
  })
  return normalizeCart({ ...cart, items, ...summarizeCart(items) })
}

export function applyCartRemoval(cart: Cart, guid: string): Cart {
  const items = cart.items.filter((item) => item.guid !== guid)
  return normalizeCart({ ...cart, items, ...summarizeCart(items) })
}

export function mergeCartItemUpdate(
  cart: Cart,
  guid: string,
  result: { item?: CartItem; item_count?: number; grand_total?: number },
): Cart {
  const items = cart.items.map((item) => {
    if (item.guid !== guid) return item
    if (!result.item) return item
    return normalizeCartItem({ ...item, ...result.item })
  })
  return normalizeCart({
    ...cart,
    items,
    item_count: result.item_count ?? cart.item_count,
    grand_total: result.grand_total ?? cart.grand_total,
  })
}

export async function getCart() {
  const cart = await callMethod<Cart>('cart_get')
  return normalizeCart(cart)
}

export function addToCart(product_variants_id: string, quantity = 1) {
  return callMethod<{ item: CartItem; item_count: number; grand_total: number }>(
    'cart_add_item',
    { product_variants_id, quantity },
  )
}

export function updateCartItem(guid: string, quantity: number) {
  return callMethod<{ item: CartItem; item_count: number; grand_total: number }>(
    'cart_update_item',
    { guid, quantity },
  )
}

export function removeCartItem(guid: string) {
  return callMethod<{ item_count: number; grand_total: number }>(
    'cart_delete_item',
    { guid },
  )
}

export function clearCart() {
  return callMethod<{ item_count: number; grand_total: number }>('cart_clear')
}
