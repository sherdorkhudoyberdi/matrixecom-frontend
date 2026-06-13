import { callMethod } from '@/api/client'
import type {
  Brand,
  Category,
  PaginatedResult,
  ProductDetail,
  ProductListItem,
  ProductsListParams,
} from '@/types/api'

export function listCategories() {
  return callMethod<{ items: Category[] }>(
    'public_categories_list',
    {},
    { auth: false },
  )
}

export function listBrands(params: { page?: number; limit?: number } = {}) {
  return callMethod<PaginatedResult<Brand>>('public_brands_list', params, {
    auth: false,
  })
}

export function listProducts(params: ProductsListParams = {}) {
  return callMethod<PaginatedResult<ProductListItem>>(
    'public_products_list',
    params as Record<string, unknown>,
    { auth: false },
  )
}

export function getProduct(params: { slug?: string; guid?: string }) {
  return callMethod<{ item: ProductDetail }>(
    'public_product_get',
    params,
    { auth: false },
  )
}

export function similarProducts(params: {
  slug?: string
  guid?: string
  limit?: number
}) {
  return callMethod<{ items: ProductListItem[] }>(
    'public_products_similar',
    params,
    { auth: false },
  )
}
