import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import * as cartApi from '@/api/cart'
import * as ordersApi from '@/api/orders'
import * as paymentApi from '@/api/payment'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { formatPrice } from '@/lib/format'
import { ROLES } from '@/lib/roles'
import { getErrorMessage } from '@/lib/utils'

export function CheckoutPage() {
  const { isAuthenticated, user, roleId } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    recipient_name: [user?.first_name, user?.last_name].filter(Boolean).join(' '),
    phone: user?.phone ?? '',
    delivery_address: '',
    comment: '',
  })

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    enabled: isAuthenticated,
  })

  const checkoutMutation = useMutation({
    mutationFn: ordersApi.checkout,
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const payMutation = useMutation({
    mutationFn: paymentApi.payOrder,
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (!isAuthenticated) {
    return (
      <div className="container-shop py-20 text-center">
        <h1 className="heading-lg mb-4">Checkout</h1>
        <p className="mb-6 text-brand-gray-600">Sign in to checkout.</p>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) return <Spinner className="min-h-[50vh]" />

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (roleId !== ROLES.Client) {
      toast.error('Only customer accounts can place orders')
      return
    }
    try {
      const freshCart = await queryClient.fetchQuery({
        queryKey: ['cart'],
        queryFn: cartApi.getCart,
      })
      if (!freshCart.items?.length) {
        toast.error('Your cart is empty. Add items before checkout.')
        navigate('/catalog')
        return
      }
      const checkoutResult = await checkoutMutation.mutateAsync(form)
      await payMutation.mutateAsync(checkoutResult.order.guid)
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Order placed successfully!')
      navigate(`/orders/${checkoutResult.order.guid}`)
    } catch {
      // errors handled in mutation
    }
  }

  return (
    <div className="container-shop py-10">
      <h1 className="heading-lg mb-8">Checkout</h1>

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4 rounded-2xl border border-brand-gray-100 bg-brand-white p-6">
          <h2 className="text-xl font-bold">Delivery Details</h2>
          <Input
            label="Recipient name"
            value={form.recipient_name}
            onChange={(e) => setForm((f) => ({ ...f, recipient_name: e.target.value }))}
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
          <Input
            label="Delivery address"
            value={form.delivery_address}
            onChange={(e) => setForm((f) => ({ ...f, delivery_address: e.target.value }))}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-gray-600">
              Comment (optional)
            </label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-brand-gray-200 bg-brand-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-black"
            />
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-brand-gray-100 bg-brand-gray-50 p-6">
          <h2 className="mb-4 text-xl font-bold">Summary</h2>
          <p className="text-sm text-brand-gray-600">{cart?.item_count ?? 0} items</p>
          <p className="mt-2 text-2xl font-bold">{formatPrice(cart?.grand_total)}</p>
          <p className="mt-2 text-xs text-brand-gray-600">
            Payment is emulated — your order will be marked as paid automatically.
          </p>
          <Button
            type="submit"
            className="mt-6 w-full"
            size="lg"
            loading={checkoutMutation.isPending || payMutation.isPending}
            disabled={!cart?.item_count}
          >
            Place Order & Pay
          </Button>
        </div>
      </form>
    </div>
  )
}
