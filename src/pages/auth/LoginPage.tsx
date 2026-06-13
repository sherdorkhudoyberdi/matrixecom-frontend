import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage } from '@/lib/utils'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ login: '', password: '' })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.login, form.password)
      toast.success('Welcome back!')
      navigate('/')
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
            onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
            required
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
        <p className="text-center text-sm text-brand-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-black underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
