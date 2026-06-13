import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import * as adminOrdersApi from '@/api/adminOrders'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateTime, formatPrice } from '@/lib/format'
import type { Order, OrderStatus } from '@/types/api'
import { getErrorMessage } from '@/lib/utils'

const STATUSES: OrderStatus[] = [
  'new',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

export function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>('processing')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: () =>
      adminOrdersApi.adminListOrders({
        page,
        limit: 20,
        status: statusFilter || undefined,
      }),
  })

  const detailQuery = useQuery({
    queryKey: ['admin-order', selected?.guid],
    queryFn: () => adminOrdersApi.adminGetOrder(selected!.guid),
    enabled: !!selected?.guid,
  })

  const updateMutation = useMutation({
    mutationFn: () => adminOrdersApi.adminUpdateOrderStatus(selected!.guid, newStatus),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-order', selected?.guid] })
      toast.success('Status updated')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / 20))
  const order = detailQuery.data?.order ?? selected

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Orders</h1>

      <div className="flex flex-wrap gap-4">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="min-w-[180px]"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-brand-gray-100 bg-brand-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-brand-gray-50">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((o) => (
                  <tr key={o.guid} className="border-b border-brand-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{o.guid.slice(0, 8)}…</td>
                    <td className="px-4 py-3">{o.recipient_name}</td>
                    <td className="px-4 py-3 capitalize">
                      <Badge>{o.status ?? 'new'}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(o.grand_total)}</td>
                    <td className="px-4 py-3 text-brand-gray-600">
                      {formatDateTime(o.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => setSelected(o)}>
                        View
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Order Detail">
        {order ? (
          <div className="space-y-4 text-sm">
            <p>
              <strong>Status:</strong> <span className="capitalize">{order.status}</span>
            </p>
            <p>
              <strong>Recipient:</strong> {order.recipient_name} · {order.phone}
            </p>
            <p>
              <strong>Address:</strong> {order.delivery_address}
            </p>
            <p>
              <strong>Total:</strong> {formatPrice(order.grand_total)}
            </p>
            <ul className="space-y-2 border-t pt-3">
              {(order.items ?? []).map((item) => (
                <li key={item.guid} className="flex justify-between">
                  <span>
                    {item.product_name} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 border-t pt-3">
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="min-w-[160px] flex-1"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>
                Update
              </Button>
            </div>
          </div>
        ) : (
          <Spinner label="Loading order..." />
        )}
      </Modal>
    </div>
  )
}
