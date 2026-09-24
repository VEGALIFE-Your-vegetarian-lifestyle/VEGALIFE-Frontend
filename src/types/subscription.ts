export type UserRole = 'USER' | 'STAFF' | 'ADMIN'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}
