import { useRoutes, type RouteObject } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { StaffLayout } from '@/layouts/StaffLayout'
import { UserLayout } from '@/layouts/UserLayout'
import { LoginPage } from '@/pages/LoginPage/LoginPage'
import { RegisterPage } from '@/pages/Register/RegisterPage'
import { UnauthorizedPage } from '@/pages/auth/UnauthorizedPage'
import { adminLayoutRoutes, staffLayoutRoutes, userLayoutRoutes } from '@/routes/layoutRoutes'
import { renderProtectedLayoutRoute } from '@/routes/renderProtectedLayoutRoute'

const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  renderProtectedLayoutRoute('/', ['USER', 'STAFF', 'ADMIN'], <UserLayout />, userLayoutRoutes),
  renderProtectedLayoutRoute('/staff', ['STAFF', 'ADMIN'], <StaffLayout />, staffLayoutRoutes),
  renderProtectedLayoutRoute('/admin', ['ADMIN'], <AdminLayout />, adminLayoutRoutes),
]

export function AppRoutes() {
  return useRoutes(routes)
}
