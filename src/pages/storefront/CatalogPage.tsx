import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as catalogApi from '@/api/catalog'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { ProductPriceBlock } from '@/components/storefront/ProductPriceBlock'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import type { ProductsListParams } from '@/types/api'

const SORT_OPTIONS: { value: ProductsListParams['sort']; label: string }[] = [
  { value: 'created_at_desc', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'review_count_desc', label: 'Top Rated' },
]

export function CatalogPage() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(() => {
    const page = Number(params.get('page') ?? '1')
    const search = params.get('search') ?? ''
    const categories_id = params.get('category') ?? ''
    const brands_id = params.get('brand') ?? ''
    const sort = (params.get('sort') as ProductsListParams['sort']) ?? 'created_at_desc'
    const in_stock = params.get('in_stock') === '1'
    const min_price = Number(params.get('min_price') ?? '0') || undefined
    const max_price = Number(params.get('max_price') ?? '0') || undefined

    return {
      page: page > 0 ? page : 1,
      limit: 12,
      search: search || undefined,
      categories_id: categories_id || undefined,
      brands_id: brands_id || undefined,
      sort,
      in_stock: in_stock || undefined,
      min_price,
      max_price,
    }
  }, [params])

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: catalogApi.listCategories,
  })

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => catalogApi.listBrands({ page: 1, limit: 100 }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => catalogApi.listProducts(filters),
  })

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.set('page', '1')
    setParams(next)
  }

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / (filters.limit ?? 12)))

  return (
    <div className="container-shop py-10">
      <h1 className="heading-lg mb-8">Shop All</h1>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6 rounded-2xl border border-brand-gray-100 bg-brand-gray-50 p-5">
          <Input
            label="Search"
            value={params.get('search') ?? ''}
            onChange={(e) => updateParam('search', e.target.value)}
            placeholder="Search products..."
          />

          <Select
            label="Category"
            value={params.get('category') ?? ''}
            onChange={(e) => updateParam('category', e.target.value)}
          >
            <option value="">All categories</option>
            {(categories?.items ?? []).flatMap(function flatten(cat): { guid: string; name: string }[] {
              const self = [{ guid: cat.guid, name: cat.name }]
              const kids = (cat.children ?? []).flatMap(flatten)
              return [...self, ...kids]
            }).map((c) => (
              <option key={c.guid} value={c.guid}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select
            label="Brand"
            value={params.get('brand') ?? ''}
            onChange={(e) => updateParam('brand', e.target.value)}
          >
            <option value="">All brands</option>
            {(brands?.items ?? []).map((b) => (
              <option key={b.guid} value={b.guid}>
                {b.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min price"
              type="number"
              value={params.get('min_price') ?? ''}
              onChange={(e) => updateParam('min_price', e.target.value)}
            />
            <Input
              label="Max price"
              type="number"
              value={params.get('max_price') ?? ''}
              onChange={(e) => updateParam('max_price', e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={params.get('in_stock') === '1'}
              onChange={(e) => updateParam('in_stock', e.target.checked ? '1' : '')}
              className="h-4 w-4 rounded"
            />
            In stock only
          </label>

          <Select
            label="Sort by"
            value={params.get('sort') ?? 'created_at_desc'}
            onChange={(e) => updateParam('sort', e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </aside>

        <div>
          {isLoading ? (
            <Spinner />
          ) : (
            <>
              <p className="mb-6 text-sm text-brand-gray-600">
                {data?.count ?? 0} products found
              </p>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {(data?.items ?? []).map((product) => (
                  <Link
                    key={product.guid}
                    to={`/product/${product.slug}`}
                    className="group overflow-hidden rounded-2xl border border-brand-gray-100 bg-brand-white transition hover:shadow-md"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-brand-gray-50">
                      {product.main_image ? (
                        <img
                          src={product.main_image}
                          alt={product.name}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <div className="space-y-2 p-4">
                      <h3 className="font-semibold">{product.name}</h3>
                      <ProductPriceBlock
                        minPrice={product.min_price}
                        maxPrice={product.max_price}
                        compareAtPrice={product.min_compare_at_price}
                        size="sm"
                      />
                      {!product.in_stock ? <Badge tone="danger">Out of stock</Badge> : null}
                    </div>
                  </Link>
                ))}
              </div>
              <Pagination
                className="mt-10"
                page={filters.page ?? 1}
                totalPages={totalPages}
                onPageChange={(p) => updateParam('page', String(p))}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
