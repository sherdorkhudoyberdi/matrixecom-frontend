import { Search, ShoppingBag, User } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as cartApi from '@/api/cart'
import { useAuth } from '@/context/AuthContext'
import { isAdmin, ROLES } from '@/lib/roles'
import { cn } from '@/lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-4 py-2 text-sm font-medium transition hover:bg-brand-gray-50',
    isActive && 'bg-brand-gray-50',
  )

export function Header() {
  const { isAuthenticated, user, roleId, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const isClient = roleId === ROLES.Client

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    enabled: isAuthenticated && isClient,
    retry: false,
  })

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/catalog?search=${encodeURIComponent(q)}` : '/catalog')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-gray-100 bg-brand-white/95 backdrop-blur">
      <div className="container-shop flex h-16 items-center justify-between gap-4">
        <Link to="/" className="text-2xl font-black tracking-tight">
          SHOP.CO
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/catalog" className={navLinkClass}>
            Shop
          </NavLink>
          {isAdmin(roleId) ? (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          ) : null}
        </nav>

        <form onSubmit={onSearch} className="hidden max-w-md flex-1 lg:flex">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products..."
              className="h-11 w-full rounded-full bg-brand-gray-50 pl-11 pr-4 text-sm outline-none focus:bg-brand-gray-100"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium hover:bg-brand-gray-50 sm:flex"
              >
                <User className="h-4 w-4" />
                {user?.first_name ?? user?.login}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="hidden rounded-full px-3 py-2 text-sm font-medium hover:bg-brand-gray-50 md:block"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-brand-gray-50"
            >
              Sign In
            </Link>
          )}
          <Link
            to="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand-gray-50 hover:bg-brand-gray-100"
          >
            <ShoppingBag className="h-5 w-5" />
            {cart && cart.item_count > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-black px-1 text-xs font-bold text-brand-white">
                {cart.item_count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  )
}
