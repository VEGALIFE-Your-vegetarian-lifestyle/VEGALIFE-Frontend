import type { JSX } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RequireAuth } from '@/routes/RequireAuth'
import type { UserRole } from '@/types/subscription'

export function renderProtectedLayoutRoute(
  path: string,
  roles: UserRole[],
  element: JSX.Element,
  children: RouteObject[],
): RouteObject {
  return {
    element: <RequireAuth roles={roles} />,
    children: [
      {
        path,
        element,
        children,
      },
    ],
  }
}
