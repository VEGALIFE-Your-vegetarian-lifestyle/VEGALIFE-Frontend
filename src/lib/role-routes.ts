import type { UserRole } from '@/types/subscription'

export const roleRoutes: Record<UserRole, string> = {
  USER: '/dashboard',
  STAFF: '/staff',
  ADMIN: '/admin',
}
