import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  TrendingUp,
  Users,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  canManageCatalog,
  canManageOrders,
  canManageStock,
  canManageUsers,
  canViewProfitLoss,
  canViewReports,
} from '@/lib/roles'
import { cn } from '@/lib/utils'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-brand-gray-50',
    isActive && 'bg-brand-black text-brand-white hover:bg-brand-black',
  )

export function AdminLayout() {
  const { roleId } = useAuth()

  return (
    <div className="min-h-screen bg-brand-gray-50">
      <div className="border-b border-brand-gray-100 bg-brand-white">
        <div className="container-shop flex h-16 items-center justify-between">
          <NavLink to="/" className="text-xl font-black">
            SHOP.CO <span className="text-sm font-semibold text-brand-gray-400">Admin</span>
          </NavLink>
          <NavLink to="/" className="text-sm font-medium text-brand-gray-600 hover:text-brand-black">
            ← Back to store
          </NavLink>
        </div>
      </div>
      <div className="container-shop grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-brand-gray-100 bg-brand-white p-3">
          <nav className="space-y-1">
            <NavLink to="/admin" end className={linkClass}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </NavLink>
            {canManageCatalog(roleId) ? (
              <>
                <NavLink to="/admin/products" className={linkClass}>
                  <Package className="h-4 w-4" /> Products
                </NavLink>
                <NavLink to="/admin/categories" className={linkClass}>
                  <Tags className="h-4 w-4" /> Categories
                </NavLink>
              </>
            ) : null}
            {canManageOrders(roleId) ? (
              <NavLink to="/admin/orders" className={linkClass}>
                <ShoppingCart className="h-4 w-4" /> Orders
              </NavLink>
            ) : null}
            {canManageStock(roleId) ? (
              <NavLink to="/admin/stock" className={linkClass}>
                <Boxes className="h-4 w-4" /> Stock
              </NavLink>
            ) : null}
            {canManageUsers(roleId) ? (
              <NavLink to="/admin/users" className={linkClass}>
                <Users className="h-4 w-4" /> Users
              </NavLink>
            ) : null}
            {canViewReports(roleId) ? (
              <NavLink to="/admin/reports" className={linkClass}>
                <BarChart3 className="h-4 w-4" /> Reports
              </NavLink>
            ) : null}
            {canViewProfitLoss(roleId) ? (
              <NavLink to="/admin/profit-loss" className={linkClass}>
                <TrendingUp className="h-4 w-4" /> Profit & Loss
              </NavLink>
            ) : null}
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
