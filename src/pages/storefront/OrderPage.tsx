import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import * as ordersApi from '@/api/orders'
import * as paymentApi from '@/api/payment'
import * as reviewsApi from '@/api/reviews'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateTime, formatPrice } from '@/lib/format'
import { getErrorMessage } from '@/lib/utils'
import { useState } from 'react'

function statusTone(status?: string) {
  switch (status) {
    case 'paid':
    case 'delivered':
      return 'success' as const
    case 'cancelled':
    case 'refunded':
      return 'danger' as const
    case 'processing':
    case 'shipped':
      return 'warning' as const
    default:
      return 'default' as const
  }
}

export function OrderPage() {
  const { id } = useParams<{ id: string }>()
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', products_id: '' })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOrder(id!),
    enabled: !!id,
  })

  const { data: timeline } = useQuery({
    queryKey: ['order-timeline', id],
    queryFn: () => ordersApi.orderTimeline(id!),
    enabled: !!id,
  })

  const payMutation = useMutation({
    mutationFn: () => paymentApi.payOrder(id!),
    onSuccess: () => {
      toast.success('Payment successful')
      void refetch()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewsApi.createOrderReview({
        orders_id: id!,
        products_id: reviewForm.products_id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      }),
    onSuccess: () => {
      toast.success('Review submitted')
      setReviewForm({ rating: 5, comment: '', products_id: '' })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (isLoading || !data?.order) return <Spinner className="min-h-[50vh]" />

  const order = data.order

  return (
    <div className="container-shop py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-lg">Order Details</h1>
          <p className="mt-1 text-sm text-brand-gray-600">
            Placed {formatDateTime(order.created_at)}
          </p>
        </div>
        <Badge tone={statusTone(order.status)}>{order.status ?? 'new'}</Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {(order.items ?? []).map((item) => (
            <div
              key={item.guid}
              className="flex gap-4 rounded-2xl border border-brand-gray-100 p-4"
            >
              <div className="h-20 w-20 overflow-hidden rounded-xl bg-brand-gray-50">
                {item.image ? (
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{item.product_name}</h3>
                {item.variant_label ? (
                  <p className="text-sm text-brand-gray-600">{item.variant_label}</p>
                ) : null}
                <p className="mt-1 text-sm">
                  {item.quantity} × {formatPrice(item.unit_price)}
                </p>
              </div>
              <p className="font-bold">{formatPrice(item.line_total)}</p>
            </div>
          ))}

          {order.status === 'delivered' ? (
            <div className="rounded-2xl border border-brand-gray-100 p-5">
              <h3 className="mb-3 font-bold">Leave a Review</h3>
              <div className="space-y-3">
                <select
                  value={reviewForm.products_id}
                  onChange={(e) =>
                    setReviewForm((f) => ({ ...f, products_id: e.target.value }))
                  }
                  className="h-11 w-full rounded-full border px-4 text-sm"
                >
                  <option value="">Select product</option>
                  {(order.items ?? []).map((item) => (
                    <option key={item.guid} value={item.products_id ?? ''}>
                      {item.product_name}
                    </option>
                  ))}
                </select>
                <Input
                  label="Rating (1-5)"
                  type="number"
                  min={1}
                  max={5}
                  value={String(reviewForm.rating)}
                  onChange={(e) =>
                    setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))
                  }
                />
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Your review..."
                  rows={3}
                  className="w-full rounded-2xl border px-4 py-3 text-sm"
                />
                <Button
                  onClick={() => reviewMutation.mutate()}
                  loading={reviewMutation.isPending}
                  disabled={!reviewForm.products_id}
                >
                  Submit Review
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-brand-gray-200 bg-brand-gray-50 p-5">
              <h3 className="font-bold">Leave a Review</h3>
              <p className="mt-2 text-sm text-brand-gray-600">
                Reviews open after your order is marked as delivered. You can track progress in
                the timeline on the right.
              </p>
              <p className="mt-2 text-sm text-brand-gray-600">
                Find this order anytime under{' '}
                <Link to="/profile" className="font-semibold underline">
                  Profile → Recent Orders
                </Link>
                .
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-gray-100 bg-brand-gray-50 p-5">
            <h3 className="mb-3 font-bold">Delivery</h3>
            <p className="text-sm">{order.recipient_name}</p>
            <p className="text-sm text-brand-gray-600">{order.phone}</p>
            <p className="text-sm text-brand-gray-600">{order.delivery_address}</p>
            {order.comment ? (
              <p className="mt-2 text-sm italic text-brand-gray-600">{order.comment}</p>
            ) : null}
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPrice(order.grand_total)}</span>
              </div>
            </div>
            {order.status === 'new' ? (
              <Button
                className="mt-4 w-full"
                onClick={() => payMutation.mutate()}
                loading={payMutation.isPending}
              >
                Pay Now
              </Button>
            ) : null}
          </div>

          {timeline?.timeline?.length ? (
            <div className="rounded-2xl border border-brand-gray-100 p-5">
              <h3 className="mb-3 font-bold">Timeline</h3>
              <ol className="space-y-3">
                {timeline.timeline.map((event, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-semibold capitalize">{event.status}</p>
                    {event.message ? (
                      <p className="text-brand-gray-600">{event.message}</p>
                    ) : null}
                    <p className="text-xs text-brand-gray-400">
                      {formatDateTime(event.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
