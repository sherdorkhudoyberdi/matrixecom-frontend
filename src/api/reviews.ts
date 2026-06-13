import { callMethod } from '@/api/client'
import type { PaginatedResult, Review } from '@/types/api'

export function listProductReviews(
  products_id: string,
  params: { page?: number; limit?: number } = {},
) {
  return callMethod<PaginatedResult<Review>>(
    'public_product_reviews_list',
    { products_id, ...params },
    { auth: false },
  )
}

export function createOrderReview(payload: {
  orders_id: string
  products_id: string
  rating: number
  comment?: string
}) {
  return callMethod<{ review: Review }>('order_review_create', payload)
}
