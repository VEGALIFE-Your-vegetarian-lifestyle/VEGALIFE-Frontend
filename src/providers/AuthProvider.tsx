import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import type { AuthUser } from '@/types/subscription'

const AUTH_USER_KEY = 'authUser'
const ACCESS_TOKEN_KEY = 'accessToken'

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)

  useEffect(() => {
    const userJson = localStorage.getItem(AUTH_USER_KEY)
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)

    if (!userJson || !token) {
      clearSession()
      return
    }

    try {
      const user = JSON.parse(userJson) as AuthUser
      setSession(user, token)
    } catch {
      clearSession()
    }
  }, [clearSession, setSession])

  return children
}
