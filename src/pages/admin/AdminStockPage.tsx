import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import * as adminStockApi from '@/api/adminStock'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { formatPrice } from '@/lib/format'
import type { StockItem } from '@/types/api'
import { getErrorMessage } from '@/lib/utils'

export function AdminStockPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<StockItem | null>(null)
  const [action, setAction] = useState<'restock' | 'adjust'>('restock')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stock', page, search],
    queryFn: () =>
      adminStockApi.adminListStock({ page, limit: 20, search: search || undefined }),
  })

  const mutation = useMutation({
    mutationFn: () => {
      const qty = Number(quantity)
      if (action === 'restock') {
        return adminStockApi.adminRestock(selected!.guid, qty, note || undefined)
      }
      return adminStockApi.adminAdjustStock(selected!.guid, qty, note || undefined)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-stock'] })
      setSelected(null)
      setQuantity('')
      setNote('')
      toast.success('Stock updated')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / 20))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Stock</h1>

      <Input
        label="Search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder="SKU or product name..."
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-brand-gray-100 bg-brand-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-brand-gray-50">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((item) => (
                  <tr key={item.guid} className="border-b border-brand-gray-50">
                    <td className="px-4 py-3 font-medium">{item.product_name}</td>
                    <td className="px-4 py-3">{item.sku}</td>
                    <td className="px-4 py-3">{item.stock_quantity}</td>
                    <td className="px-4 py-3">{formatPrice(item.price)}</td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => setSelected(item)}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.product_name ?? 'Stock'}
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-gray-600">
            Current stock: <strong>{selected?.stock_quantity}</strong>
          </p>
          <div className="flex gap-2">
            <Button
              variant={action === 'restock' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setAction('restock')}
            >
              Restock
            </Button>
            <Button
              variant={action === 'adjust' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setAction('adjust')}
            >
              Adjust
            </Button>
          </div>
          <Input
            label={action === 'restock' ? 'Quantity to add' : 'New stock quantity'}
            type="number"
            min={action === 'adjust' ? 0 : 1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
          >
            {action === 'restock' ? 'Restock' : 'Adjust Stock'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
