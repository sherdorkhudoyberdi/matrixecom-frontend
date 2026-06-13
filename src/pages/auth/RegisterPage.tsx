import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { finishAuthRedirect } from '@/lib/pendingAuth'
import { getErrorMessage } from '@/lib/utils'
import {
  normalizePhone,
  passwordHint,
  phoneHint,
  validateNewPassword,
  validatePhone,
} from '@/lib/validation'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    login: '',
    password: '',
    phone: '',
    first_name: '',
    last_name: '',
  })
  const [errors, setErrors] = useState<{
    login?: string
    password?: string
    phone?: string
  }>({})

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors = {
      login: form.login.trim() ? undefined : 'Email or login is required',
      password: validateNewPassword(form.password),
      phone: validatePhone(form.phone, { required: true }),
    }
    setErrors(nextErrors)
    if (nextErrors.login || nextErrors.password || nextErrors.phone) return

    setLoading(true)
    try {
      const tokens = await register({
        ...form,
        login: form.login.trim(),
        phone: normalizePhone(form.phone),
      })
      toast.success('Account created!')
      await finishAuthRedirect(tokens.role_id, navigate, queryClient, returnTo)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-shop flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="heading-lg">Create Account</h1>
          <p className="mt-2 text-brand-gray-600">Join SHOP.CO and start shopping</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-brand-gray-100 bg-brand-white p-8 shadow-sm">
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
            label="Email or login"
            type="text"
            value={form.login}
            onChange={(e) => {
              setForm((f) => ({ ...f, login: e.target.value }))
              if (errors.login) setErrors((prev) => ({ ...prev, login: undefined }))
            }}
            error={errors.login}
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => {
              setForm((f) => ({ ...f, phone: e.target.value }))
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
            }}
            error={errors.phone}
            placeholder="+998901234567"
          />
          {!errors.phone ? (
            <p className="-mt-2 text-xs text-brand-gray-500">{phoneHint}</p>
          ) : null}
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => {
              setForm((f) => ({ ...f, password: e.target.value }))
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            error={errors.password}
            autoComplete="new-password"
          />
          {!errors.password ? (
            <p className="-mt-2 text-xs text-brand-gray-500">{passwordHint}</p>
          ) : null}
          <Button type="submit" className="w-full" loading={loading}>
            Create Account
          </Button>
        </form>
        <p className="text-center text-sm text-brand-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            state={returnTo ? { returnTo } : undefined}
            className="font-semibold text-brand-black underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
