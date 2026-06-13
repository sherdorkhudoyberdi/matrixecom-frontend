import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import * as adminOrdersApi from '@/api/adminOrders'
import * as adminCatalogApi from '@/api/adminCatalog'
import { Card, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/context/AuthContext'
import {
  canManageCatalog,
  canManageOrders,
  canManageStock,
  canViewProfitLoss,
  canViewReports,
  roleLabel,
} from '@/lib/roles'

export function AdminDashboard() {
  const { user, roleId } = useAuth()

  const { data: orders } = useQuery({
    queryKey: ['admin-orders-summary'],
    queryFn: () => adminOrdersApi.adminListOrders({ page: 1, limit: 5 }),
    enabled: canManageOrders(roleId),
  })

  const { data: products } = useQuery({
    queryKey: ['admin-products-summary'],
    queryFn: () => adminCatalogApi.adminListProducts({ page: 1, limit: 5 }),
    enabled: canManageCatalog(roleId),
  })

  const links = [
    { to: '/admin/products', label: 'Products', show: canManageCatalog(roleId) },
    { to: '/admin/categories', label: 'Categories', show: canManageCatalog(roleId) },
    { to: '/admin/orders', label: 'Orders', show: canManageOrders(roleId) },
    { to: '/admin/stock', label: 'Stock', show: canManageStock(roleId) },
    { to: '/admin/reports', label: 'Reports', show: canViewReports(roleId) },
    { to: '/admin/profit-loss', label: 'Profit & Loss', show: canViewProfitLoss(roleId) },
  ].filter((l) => l.show)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Dashboard</h1>
        <p className="mt-1 text-brand-gray-600">
          Welcome, {user?.first_name ?? user?.login} · {roleLabel(roleId)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="transition hover:shadow-md">
              <CardTitle>{link.label}</CardTitle>
              <p className="mt-2 text-sm text-brand-gray-600">Manage {link.label.toLowerCase()}</p>
            </Card>
          </Link>
        ))}
      </div>

      {canManageOrders(roleId) && orders?.items.length ? (
        <Card>
          <CardTitle>Recent Orders</CardTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {orders.items.map((o) => (
              <li key={o.guid} className="flex justify-between border-b border-brand-gray-100 py-2">
                <span className="capitalize">{o.status}</span>
                <Link to={`/admin/orders`} className="font-medium underline">
                  {o.guid.slice(0, 8)}…
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {canManageCatalog(roleId) && products?.items.length ? (
        <Card>
          <CardTitle>Recent Products</CardTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {products.items.map((p) => (
              <li key={p.guid} className="flex justify-between border-b border-brand-gray-100 py-2">
                <span>{p.name}</span>
                <Link to={`/admin/products/${p.guid}`} className="font-medium underline">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}
