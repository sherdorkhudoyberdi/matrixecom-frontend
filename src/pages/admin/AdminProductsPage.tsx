import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as adminCatalogApi from '@/api/adminCatalog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Spinner } from '@/components/ui/Spinner'

export function AdminProductsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () =>
      adminCatalogApi.adminListProducts({ page, limit: 20, search: search || undefined }),
  })

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / 20))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black">Products</h1>
        <Link to="/admin/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>

      <Input
        label="Search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder="Search by name..."
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-brand-gray-100 bg-brand-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-gray-100 bg-brand-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Reviews</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((product) => (
                  <tr key={product.guid} className="border-b border-brand-gray-50">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-brand-gray-600">{product.slug}</td>
                    <td className="px-4 py-3">
                      <Badge tone={product.is_active ? 'success' : 'outline'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{product.review_count ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/products/${product.guid}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
