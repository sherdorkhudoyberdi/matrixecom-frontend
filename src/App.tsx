import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { StoreLayout } from '@/components/layout/StoreLayout'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import {
  canManageCatalog,
  canManageOrders,
  canManageStock,
  canManageUsers,
  canViewProfitLoss,
  canViewReports,
  isAdmin,
  ROLES,
} from '@/lib/roles'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage'
import { AdminProductEditPage } from '@/pages/admin/AdminProductEditPage'
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage'
import { AdminProfitLossPage } from '@/pages/admin/AdminProfitLossPage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { AdminStockPage } from '@/pages/admin/AdminStockPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { CartPage } from '@/pages/storefront/CartPage'
import { CatalogPage } from '@/pages/storefront/CatalogPage'
import { CheckoutPage } from '@/pages/storefront/CheckoutPage'
import { HomePage } from '@/pages/storefront/HomePage'
import { OrderPage } from '@/pages/storefront/OrderPage'
import { ProductPage } from '@/pages/storefront/ProductPage'
import { ProfilePage } from '@/pages/storefront/ProfilePage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Spinner className="min-h-[50vh]" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { roleId, isLoading } = useAuth()
  if (isLoading) return <Spinner className="min-h-[50vh]" />
  if (!isAdmin(roleId)) return <Navigate to="/" replace />
  return <>{children}</>
}

function RoleGuard({
  check,
  children,
}: {
  check: (roleId?: string | null) => boolean
  children: React.ReactNode
}) {
  const { roleId, isLoading } = useAuth()
  if (isLoading) return <Spinner className="min-h-[50vh]" />
  if (!check(roleId)) return <Navigate to="/admin" replace />
  return <>{children}</>
}

function ClientGuard({ children }: { children: React.ReactNode }) {
  const { roleId, isLoading, isAuthenticated } = useAuth()
  if (isLoading) return <Spinner className="min-h-[50vh]" />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roleId !== ROLES.Client) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="cart"
          element={
            <ClientGuard>
              <CartPage />
            </ClientGuard>
          }
        />
        <Route
          path="checkout"
          element={
            <ClientGuard>
              <CheckoutPage />
            </ClientGuard>
          }
        />
        <Route
          path="orders/:id"
          element={
            <AuthGuard>
              <OrderPage />
            </AuthGuard>
          }
        />
        <Route
          path="profile"
          element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          }
        />
      </Route>

      <Route
        path="admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route
          path="products"
          element={
            <RoleGuard check={canManageCatalog}>
              <AdminProductsPage />
            </RoleGuard>
          }
        />
        <Route
          path="products/:id"
          element={
            <RoleGuard check={canManageCatalog}>
              <AdminProductEditPage />
            </RoleGuard>
          }
        />
        <Route
          path="categories"
          element={
            <RoleGuard check={canManageCatalog}>
              <AdminCategoriesPage />
            </RoleGuard>
          }
        />
        <Route
          path="orders"
          element={
            <RoleGuard check={canManageOrders}>
              <AdminOrdersPage />
            </RoleGuard>
          }
        />
        <Route
          path="stock"
          element={
            <RoleGuard check={canManageStock}>
              <AdminStockPage />
            </RoleGuard>
          }
        />
        <Route
          path="users"
          element={
            <RoleGuard check={canManageUsers}>
              <AdminUsersPage />
            </RoleGuard>
          }
        />
        <Route
          path="reports"
          element={
            <RoleGuard check={canViewReports}>
              <AdminReportsPage />
            </RoleGuard>
          }
        />
        <Route
          path="profit-loss"
          element={
            <RoleGuard check={canViewProfitLoss}>
              <AdminProfitLossPage />
            </RoleGuard>
          }
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
