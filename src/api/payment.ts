import { callMethod } from '@/api/client'
import type { Order } from '@/types/api'

export function payOrder(guid: string) {
  return callMethod<{ order: Order }>('order_pay', { guid })
}

export function refundOrder(guid: string) {
  return callMethod<{ order: Order }>('order_refund', { guid })
}
