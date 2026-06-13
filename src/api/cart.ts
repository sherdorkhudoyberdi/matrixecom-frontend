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
