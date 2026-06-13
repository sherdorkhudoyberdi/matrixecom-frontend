import { callMethod } from '@/api/client'
import type { PaginatedResult, StockItem, StockMovement } from '@/types/api'

export function adminListStock(params: { page?: number; limit?: number; search?: string } = {}) {
  return callMethod<PaginatedResult<StockItem>>('admin_stock_list', params)
}

export function adminRestock(product_variants_id: string, quantity: number, note?: string) {
  return callMethod<{ item: StockItem }>('admin_stock_restock', {
    product_variants_id,
    quantity,
    note,
  })
}

export function adminAdjustStock(
  product_variants_id: string,
  new_quantity: number,
  note?: string,
) {
  return callMethod<{ item: StockItem }>('admin_stock_adjustment', {
    product_variants_id,
    new_quantity,
    note,
  })
}

export function adminListStockMovements(params: {
  page?: number
  limit?: number
  product_variants_id?: string
} = {}) {
  return callMethod<PaginatedResult<StockMovement>>('admin_stock_movements_list', params)
}
