import { callMethod } from '@/api/client'
import { normalizeOrderBundle, normalizeOrderRow } from '@/api/orders'
import type { Order, OrderStatus, PaginatedResult } from '@/types/api'

type RawOrderRow = Order & { total?: number }

interface RawOrderBundle {
  order?: RawOrderRow
  items?: Order['items']
  payment?: { status?: string }
}

export async function adminListOrders(params: {
  page?: number
  limit?: number
  status?: OrderStatus | string
  search?: string
} = {}) {
  const data = await callMethod<PaginatedResult<RawOrderRow>>('admin_orders_list', params)
  return {
    ...data,
    items: data.items.map((row) => normalizeOrderRow(row)),
  }
}

export async function adminGetOrder(guid: string) {
  const data = await callMethod<{ order: RawOrderBundle }>('admin_orders_get', { guid })
  return {
    order: normalizeOrderBundle(data.order, guid),
  }
}

export async function adminUpdateOrderStatus(guid: string, status: OrderStatus | string) {
  const data = await callMethod<{ order: Order | RawOrderBundle }>('admin_orders_update_status', {
    guid,
    status,
  })
  if (data.order && typeof data.order === 'object' && 'order' in data.order) {
    return {
      order: normalizeOrderBundle(data.order as RawOrderBundle, guid),
    }
  }
  return {
    order: normalizeOrderRow((data.order ?? { guid }) as RawOrderRow, guid),
  }
}
