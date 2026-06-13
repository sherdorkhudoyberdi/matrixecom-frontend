import { callMethod } from '@/api/client'
import type {
  AdminProduct,
  AttributeValue,
  Brand,
  CatalogAttribute,
  Category,
  PaginatedResult,
  ProductDetail,
  ProductSpecification,
  ProductVariant,
  VariantAttributeValueLink,
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

// Attributes
export function adminListAttributes(params: { page?: number; limit?: number } = {}) {
  return callMethod<PaginatedResult<CatalogAttribute>>('admin_attributes_list', params)
}

export function adminListAttributeValues(
  params: { page?: number; limit?: number; attributes_id?: string } = {},
) {
  return callMethod<PaginatedResult<AttributeValue>>('admin_attribute_values_list', params)
}

export function adminListVariantAttributeValues(product_variants_id: string) {
  return callMethod<{ items: VariantAttributeValueLink[] }>(
    'admin_variant_attribute_values_list',
    { product_variants_id, page: 1, limit: 100 },
  )
}

export function adminCreateVariantAttributeValue(payload: {
  product_variants_id: string
  attribute_values_id: string
}) {
  return callMethod<{ item: VariantAttributeValueLink }>(
    'admin_variant_attribute_values_create',
    payload,
  )
}

export function adminDeleteVariantAttributeValue(guid: string) {
  return callMethod<{ success: boolean }>('admin_variant_attribute_values_delete', { guid })
}

export async function linkVariantAttributes(
  product_variants_id: string,
  attribute_value_ids: string[],
) {
  for (const attribute_values_id of attribute_value_ids) {
    if (!attribute_values_id) continue
    await adminCreateVariantAttributeValue({ product_variants_id, attribute_values_id })
  }
}

export async function replaceVariantAttributes(
  product_variants_id: string,
  existingLinks: VariantAttributeValueLink[],
  attribute_value_ids: string[],
) {
  for (const link of existingLinks) {
    await adminDeleteVariantAttributeValue(link.guid)
  }
  await linkVariantAttributes(product_variants_id, attribute_value_ids)
}

export async function deleteVariantWithAttributes(
  variantGuid: string,
  attributeLinks: VariantAttributeValueLink[],
) {
  for (const link of attributeLinks) {
    await adminDeleteVariantAttributeValue(link.guid)
  }
  await adminDeleteVariant(variantGuid)
}

export async function loadVariantAttributeMap(variantIds: string[]) {
  const entries = await Promise.all(
    variantIds.map(async (variantId) => {
      const res = await adminListVariantAttributeValues(variantId)
      return [variantId, res.items] as const
    }),
  )
  return Object.fromEntries(entries) as Record<string, VariantAttributeValueLink[]>
}

export interface DraftVariantInput {
  sku: string
  price: number
  stock_quantity: number
  compare_at_price?: number
  cost_price?: number
  images?: string[]
  attribute_value_ids?: string[]
}

export interface DraftSpecInput {
  spec_key: string
  spec_value: string
}

export async function createProductWithDetails(payload: {
  product: Partial<AdminProduct> & { images?: string[] }
  variants: DraftVariantInput[]
  specs: DraftSpecInput[]
}) {
  const { product, variants, specs } = payload

  const created = await adminCreateProduct({
    ...product,
    images: product.images?.length ? product.images : undefined,
  })

  const productId = created.item?.guid ?? (created as { guid?: string }).guid
  if (!productId) {
    throw new Error('Product was created but no ID was returned')
  }

  for (const variant of variants) {
    const created = await adminCreateVariant({
      products_id: productId,
      sku: variant.sku,
      price: variant.price,
      stock_quantity: variant.stock_quantity,
      compare_at_price: variant.compare_at_price,
      cost_price: variant.cost_price,
      images: variant.images?.length ? variant.images : undefined,
      is_active: true,
    })

    const variantId = created.item?.guid ?? (created as { guid?: string }).guid
    if (variantId && variant.attribute_value_ids?.length) {
      await linkVariantAttributes(variantId, variant.attribute_value_ids)
    }
  }

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i]!
    await adminCreateSpec({
      products_id: productId,
      spec_key: spec.spec_key,
      spec_value: spec.spec_value,
      sort_order: i + 1,
    })
  }

  return { guid: productId, item: created.item }
}
