export type ApiStatus = 'success' | 'error'

export interface ApiResponse<T = unknown> {
  status: ApiStatus
  data: T
}

export interface ApiErrorData {
  message?: string
  error?: string
}

export interface PaginatedParams {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  limit: number
  count: number
}

export interface User {
  guid: string
  login?: string
  first_name?: string
  last_name?: string
  phone?: string
  role_id?: string
  created_at?: string
  updated_at?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: User
  role_id: string
}

export interface Category {
  guid: string
  name: string
  slug?: string
  categories_id?: string | null
  sort_order?: number
  is_active?: boolean
  children?: Category[]
}

export interface Brand {
  guid: string
  name: string
  slug?: string
  logo?: string
}

export interface ProductListItem {
  guid: string
  name: string
  slug: string
  description?: string
  categories_id?: string
  brands_id?: string
  review_count?: number
  min_price?: number
  max_price?: number
  min_compare_at_price?: number
  in_stock?: boolean
  main_image?: string
}

export interface ProductSpecification {
  guid?: string
  spec_key: string
  spec_value: string
  sort_order?: number
}

export interface VariantAttribute {
  name: string
  value: string
}

export interface ProductVariant {
  guid: string
  sku?: string
  price: number
  compare_at_price?: number
  stock_quantity?: number
  in_stock?: boolean
  is_active?: boolean
  attributes?: VariantAttribute[]
  images?: string[]
}

export interface ProductDetail {
  guid: string
  name: string
  slug: string
  description?: string
  review_count?: number
  avg_rating?: number
  categories_id?: string
  brands_id?: string
  is_active?: boolean
  category?: Category
  category_path?: Category[]
  brand?: Brand
  specifications?: ProductSpecification[]
  images?: string[]
  variants?: ProductVariant[]
}

export interface ProductsListParams extends PaginatedParams {
  search?: string
  categories_id?: string
  brands_id?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  sort?:
    | 'created_at_desc'
    | 'created_at_asc'
    | 'name_asc'
    | 'name_desc'
    | 'price_asc'
    | 'price_desc'
    | 'review_count_desc'
}

export interface Review {
  guid?: string
  rating: number
  comment?: string
  users_id?: string
  products_id?: string
  orders_id?: string
  created_at?: string
  product_name?: string
  product_slug?: string
  user?: Pick<User, 'first_name' | 'last_name' | 'login'>
}

export interface CartItem {
  guid: string
  product_variants_id: string
  quantity: number
  price?: number
  unit_price?: number
  line_total?: number
  product_name?: string
  variant_label?: string
  main_image?: string
  image?: string
  attributes?: Array<{ name?: string; value?: string }>
  stock_quantity?: number
}

export interface Cart {
  items: CartItem[]
  item_count: number
  grand_total: number
}

export type OrderStatus =
  | 'new'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface OrderItem {
  guid?: string
  products_id?: string
  product_variants_id?: string
  quantity?: number
  unit_price?: number
  price_at_order?: number
  line_total?: number
  product_name?: string
  variant_label?: string
  main_image?: string
  image?: string
}

export interface Order {
  guid: string
  status?: OrderStatus
  recipient_name?: string
  phone?: string
  delivery_address?: string
  comment?: string
  grand_total?: number
  item_count?: number
  created_at?: string
  updated_at?: string
  items?: OrderItem[]
  payment_status?: string
}

export interface OrderTimelineEvent {
  status: string
  message?: string
  created_at?: string
}

export interface CheckoutPayload {
  recipient_name: string
  phone: string
  delivery_address: string
  comment?: string
}

export interface AdminProduct {
  guid: string
  name: string
  slug?: string
  description?: string
  categories_id?: string
  brands_id?: string
  is_active?: boolean
  images?: string[]
  review_count?: number
  created_at?: string
}

export interface StockItem {
  guid: string
  sku?: string
  products_id?: string
  product_name?: string
  stock_quantity?: number
  price?: number
  is_active?: boolean
}

export interface StockMovement {
  guid: string
  product_variants_id?: string
  movement_type?: string
  quantity?: number
  note?: string
  created_at?: string
}

export interface ReportRow {
  period?: string
  revenue?: number
  orders?: number
  units?: number
  [key: string]: unknown
}

export interface ProfitLossSummary {
  total_revenue?: number
  total_cost?: number
  gross_profit?: number
  margin_percent?: number
  rows?: ReportRow[]
}

export interface ReportParams {
  date_from?: string
  date_to?: string
  period?: 'day' | 'week' | 'month'
  limit?: number
}
