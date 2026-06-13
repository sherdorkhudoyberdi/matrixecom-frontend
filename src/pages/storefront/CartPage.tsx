import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import * as cartApi from '@/api/cart'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { formatPrice } from '@/lib/format'
import { getErrorMessage } from '@/lib/utils'

export function CartPage() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    enabled: isAuthenticated,
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['cart'] })

  const updateMutation = useMutation({
    mutationFn: ({ guid, quantity }: { guid: string; quantity: number }) =>
      cartApi.updateCartItem(guid, quantity),
    onSuccess: invalidate,
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const removeMutation = useMutation({
    mutationFn: (guid: string) => cartApi.removeCartItem(guid),
    onSuccess: () => {
      invalidate()
      toast.success('Item removed')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (!isAuthenticated) {
    return (
      <div className="container-shop py-20 text-center">
        <h1 className="heading-lg mb-4">Your Cart</h1>
        <p className="mb-6 text-brand-gray-600">Sign in to view your cart.</p>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) return <Spinner className="min-h-[50vh]" />

  const items = data?.items ?? []

  return (
    <div className="container-shop py-10">
      <h1 className="heading-lg mb-8">Your Cart</h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-brand-gray-100 bg-brand-gray-50 py-16 text-center">
          <p className="text-brand-gray-600">Your cart is empty.</p>
          <Link to="/catalog" className="mt-4 inline-block">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.guid}
                className="flex gap-4 rounded-2xl border border-brand-gray-100 bg-brand-white p-4"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-gray-50">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-semibold">{item.product_name}</h3>
                    {item.variant_label ? (
                      <p className="text-sm text-brand-gray-600">{item.variant_label}</p>
                    ) : null}
                    <p className="mt-1 font-bold">{formatPrice(item.unit_price)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-brand-gray-200">
                      <button
                        type="button"
                        className="p-2"
                        onClick={() =>
                          updateMutation.mutate({
                            guid: item.guid,
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="p-2"
                        onClick={() =>
                          updateMutation.mutate({
                            guid: item.guid,
                            quantity: item.quantity + 1,
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate(item.guid)}
                      className="rounded-full p-2 text-brand-accent hover:bg-brand-accent/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-brand-gray-100 bg-brand-gray-50 p-6">
            <h2 className="mb-4 text-xl font-bold">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-gray-600">Items ({data?.item_count})</span>
                <span className="font-semibold">{formatPrice(data?.grand_total)}</span>
              </div>
              <div className="flex justify-between border-t border-brand-gray-200 pt-3 text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(data?.grand_total)}</span>
              </div>
            </div>
            <Link to="/checkout" className="mt-6 block">
              <Button className="w-full" size="lg">
                Go to Checkout
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
