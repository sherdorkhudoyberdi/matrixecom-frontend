import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { finishAuthRedirect } from '@/lib/pendingAuth'
import { getErrorMessage } from '@/lib/utils'
import { validateLoginPassword } from '@/lib/validation'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ login: '', password: '' })
  const [errors, setErrors] = useState<{ login?: string; password?: string }>({})

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors = {
      login: form.login.trim() ? undefined : 'Email or login is required',
      password: validateLoginPassword(form.password),
    }
    setErrors(nextErrors)
    if (nextErrors.login || nextErrors.password) return

    setLoading(true)
    try {
      const tokens = await login(form.login.trim(), form.password)
      toast.success('Welcome back!')
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
          <h1 className="heading-lg">Welcome Back</h1>
          <p className="mt-2 text-brand-gray-600">Sign in to your SHOP.CO account</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-brand-gray-100 bg-brand-white p-8 shadow-sm">
          <Input
            label="Email or login"
            type="text"
            value={form.login}
            onChange={(e) => {
              setForm((f) => ({ ...f, login: e.target.value }))
              if (errors.login) setErrors((prev) => ({ ...prev, login: undefined }))
            }}
            error={errors.login}
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => {
              setForm((f) => ({ ...f, password: e.target.value }))
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            error={errors.password}
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
        <p className="text-center text-sm text-brand-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            state={returnTo ? { returnTo } : undefined}
            className="font-semibold text-brand-black underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
