import { callMethod } from '@/api/client'
import type {
  AdminProduct,
  Brand,
  Category,
  PaginatedResult,
  ProductDetail,
  ProductSpecification,
  ProductVariant,
} from '@/types/api'

// Categories
export function adminListCategories(params: { tree?: boolean; page?: number; limit?: number } = {}) {
  return callMethod<{ items: Category[] } & Partial<PaginatedResult<Category>>>(
    'admin_categories_list',
    params,
  )
}

export function adminCreateCategory(payload: Partial<Category>) {
  return callMethod<{ item: Category }>('admin_categories_create', payload)
}

export function adminUpdateCategory(payload: Partial<Category> & { guid: string }) {
  return callMethod<{ item: Category }>('admin_categories_update', payload)
}

export function adminDeleteCategory(guid: string) {
  return callMethod<{ success: boolean }>('admin_categories_delete', { guid })
}

// Brands
export function adminListBrands(params: { page?: number; limit?: number } = {}) {
  return callMethod<PaginatedResult<Brand>>('admin_brands_list', params)
}

export function adminCreateBrand(payload: Partial<Brand>) {
  return callMethod<{ item: Brand }>('admin_brands_create', payload)
}

export function adminUpdateBrand(payload: Partial<Brand> & { guid: string }) {
  return callMethod<{ item: Brand }>('admin_brands_update', payload)
}

export function adminDeleteBrand(guid: string) {
  return callMethod<{ success: boolean }>('admin_brands_delete', { guid })
}

// Products
export function adminListProducts(params: { page?: number; limit?: number; search?: string } = {}) {
  return callMethod<PaginatedResult<AdminProduct>>('admin_products_list', params)
}

export function adminGetProduct(guid: string) {
  return callMethod<{ item: ProductDetail }>('admin_products_get', { guid })
}

export function adminCreateProduct(payload: Partial<AdminProduct>) {
  return callMethod<{ item: AdminProduct }>('admin_products_create', payload)
}

export function adminUpdateProduct(payload: Partial<AdminProduct> & { guid: string }) {
  return callMethod<{ item: AdminProduct }>('admin_products_update', payload)
}

export function adminDeleteProduct(guid: string) {
  return callMethod<{ success: boolean }>('admin_products_delete', { guid })
}

// Specifications
export function adminListSpecs(products_id: string) {
  return callMethod<{ items: ProductSpecification[] }>(
    'admin_product_specifications_list',
    { products_id },
  )
}

export function adminCreateSpec(payload: Partial<ProductSpecification> & { products_id: string }) {
  return callMethod<{ item: ProductSpecification }>(
    'admin_product_specifications_create',
    payload,
  )
}

export function adminDeleteSpec(guid: string) {
  return callMethod<{ success: boolean }>('admin_product_specifications_delete', { guid })
}

// Variants
export function adminListVariants(products_id: string) {
  return callMethod<{ items: ProductVariant[] }>('admin_product_variants_list', { products_id })
}

export function adminCreateVariant(payload: Partial<ProductVariant> & { products_id: string }) {
  return callMethod<{ item: ProductVariant }>('admin_product_variants_create', payload)
}

export function adminUpdateVariant(payload: Partial<ProductVariant> & { guid: string }) {
  return callMethod<{ item: ProductVariant }>('admin_product_variants_update', payload)
}

export function adminDeleteVariant(guid: string) {
  return callMethod<{ success: boolean }>('admin_product_variants_delete', { guid })
}
