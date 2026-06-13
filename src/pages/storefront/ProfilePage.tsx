import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import * as ordersApi from '@/api/orders'
import * as profileApi from '@/api/profile'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RatingStars } from '@/components/ui/RatingStars'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { formatDate, formatPrice, fullName } from '@/lib/format'
import { roleLabel } from '@/lib/roles'
import { getErrorMessage } from '@/lib/utils'
import { normalizePhone, phoneHint, validatePhone } from '@/lib/validation'

export function ProfilePage() {
  const { isAuthenticated, user, roleId, refreshProfile } = useAuth()
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    phone: user?.phone ?? '',
  })
  const [phoneError, setPhoneError] = useState<string>()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    enabled: isAuthenticated,
  })

  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.listOrders({ page: 1, limit: 10 }),
    enabled: isAuthenticated,
  })

  const { data: reviews } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => profileApi.listMyReviews({ page: 1, limit: 10 }),
    enabled: isAuthenticated,
  })

  const updateMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: async () => {
      await refreshProfile()
      toast.success('Profile updated')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (!isAuthenticated) {
    return (
      <div className="container-shop py-20 text-center">
        <h1 className="heading-lg mb-4">Profile</h1>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) return <Spinner className="min-h-[50vh]" />

  const currentUser = profile?.user ?? user!

  return (
    <div className="container-shop py-10">
      <h1 className="heading-lg mb-8">My Profile</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const nextPhoneError = validatePhone(form.phone, { required: true })
            setPhoneError(nextPhoneError)
            if (nextPhoneError) return
            updateMutation.mutate({
              ...form,
              phone: normalizePhone(form.phone),
            })
          }}
          className="space-y-4 rounded-2xl border border-brand-gray-100 bg-brand-white p-6"
        >
          <div>
            <p className="text-sm text-brand-gray-600">Account</p>
            <p className="font-semibold">{currentUser.login}</p>
            <Badge className="mt-2">{roleLabel(roleId)}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            />
            <Input
              label="Last name"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
            />
          </div>
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => {
              setForm((f) => ({ ...f, phone: e.target.value }))
              if (phoneError) setPhoneError(undefined)
            }}
            error={phoneError}
            placeholder="+998901234567"
          />
          {!phoneError ? (
            <p className="-mt-2 text-xs text-brand-gray-500">{phoneHint}</p>
          ) : null}
          <Button type="submit" loading={updateMutation.isPending}>
            Save Changes
          </Button>
        </form>

        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-gray-100 p-6">
            <h2 className="mb-4 text-xl font-bold">Recent Orders</h2>
            <div className="space-y-3">
              {(orders?.items ?? []).map((order) => (
                <Link
                  key={order.guid}
                  to={`/orders/${order.guid}`}
                  className="flex items-center justify-between rounded-xl border border-brand-gray-100 p-4 transition hover:bg-brand-gray-50"
                >
                  <div>
                    <p className="font-semibold">{formatDate(order.created_at)}</p>
                    <p className="text-sm capitalize text-brand-gray-600">{order.status}</p>
                  </div>
                  <p className="font-bold">{formatPrice(order.grand_total)}</p>
                </Link>
              ))}
              {(orders?.items ?? []).length === 0 ? (
                <p className="text-sm text-brand-gray-600">No orders yet.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-gray-100 p-6">
            <h2 className="mb-4 text-xl font-bold">My Reviews</h2>
            <div className="space-y-3">
              {(reviews?.items ?? []).map((review) => (
                <div key={review.guid} className="rounded-xl border border-brand-gray-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {review.product_slug ? (
                      <Link
                        to={`/product/${review.product_slug}`}
                        className="font-semibold hover:underline"
                      >
                        {review.product_name || 'Product'}
                      </Link>
                    ) : (
                      <p className="font-semibold">{review.product_name || 'Product'}</p>
                    )}
                    <p className="text-xs text-brand-gray-400">{formatDate(review.created_at)}</p>
                  </div>
                  <RatingStars value={review.rating} size="sm" className="mt-2" />
                  <p className="mt-2 text-sm text-brand-gray-600">{review.comment}</p>
                </div>
              ))}
              {(reviews?.items ?? []).length === 0 ? (
                <p className="text-sm text-brand-gray-600">No reviews yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-brand-gray-600">
        Signed in as {fullName(currentUser.first_name, currentUser.last_name)}
      </p>
    </div>
  )
}
