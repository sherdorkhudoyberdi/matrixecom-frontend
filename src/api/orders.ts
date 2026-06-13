import { callMethod } from '@/api/client'
import type {
  CheckoutPayload,
  Order,
  OrderItem,
  OrderTimelineEvent,
  PaginatedResult,
} from '@/types/api'

type RawOrderRow = Order & {
  total?: number
}

interface RawOrderBundle {
  order?: RawOrderRow
  items?: Array<OrderItem & { price_at_order?: number }>
  payment?: { status?: string }
}

export function normalizeOrderItem(
  item: OrderItem & { price_at_order?: number; main_image?: string },
): OrderItem {
  return {
    ...item,
    unit_price: item.unit_price ?? item.price_at_order,
    image: item.image ?? item.main_image,
  }
}

export function normalizeOrderRow(row: RawOrderRow, fallbackGuid?: string): Order {
  return {
    ...row,
    guid: row.guid ?? fallbackGuid ?? '',
    grand_total: row.grand_total ?? row.total,
  }
}

export function normalizeOrderBundle(bundle: RawOrderBundle, fallbackGuid?: string): Order {
  const row = bundle.order ?? ({} as RawOrderRow)
  const order = normalizeOrderRow(row, fallbackGuid)
  return {
    ...order,
    items: (bundle.items ?? []).map(normalizeOrderItem),
    payment_status:
      order.payment_status ??
      (typeof bundle.payment?.status === 'string' ? bundle.payment.status : undefined),
  }
}

export async function checkout(payload: CheckoutPayload) {
  const data = await callMethod<{
    order: RawOrderBundle
    guid?: string
    payment_guid?: string
  }>('checkout_create', payload)

  return {
    order: normalizeOrderBundle(data.order, data.guid),
    payment_guid: data.payment_guid,
  }
}

export async function listOrders(params: { page?: number; limit?: number; status?: string } = {}) {
  const data = await callMethod<PaginatedResult<RawOrderRow>>('orders_list', params)
  return {
    ...data,
    items: data.items.map((row) => normalizeOrderRow(row)),
  }
}

export async function getOrder(guid: string) {
  const data = await callMethod<{ order: RawOrderBundle }>('orders_get', { guid })
  return {
    order: normalizeOrderBundle(data.order, guid),
  }
}

export function orderTimeline(guid: string) {
  return callMethod<{ timeline: OrderTimelineEvent[] }>('orders_timeline', { guid })
}
