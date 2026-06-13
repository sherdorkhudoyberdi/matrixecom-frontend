import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authApi from '@/api/auth'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/api/client'
import { ROLES } from '@/lib/roles'
import type { AuthTokens, User } from '@/types/api'

interface AuthContextValue {
  user: User | null
  roleId: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (login: string, password: string) => Promise<AuthTokens>
  register: (payload: authApi.RegisterPayload) => Promise<AuthTokens>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function applyAuth(tokens: AuthTokens, setUser: (u: User) => void, setRoleId: (r: string) => void) {
  setTokens(tokens.access_token, tokens.refresh_token, tokens.user.guid)
  setUser(tokens.user)
  setRoleId(tokens.role_id)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [roleId, setRoleId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      setRoleId(null)
      return
    }

    try {
      const { user: profile } = await authApi.me()
      setUser(profile)
      setRoleId(profile.role_id ?? ROLES.Client)
    } catch {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearTokens()
        setUser(null)
        setRoleId(null)
        return
      }

      try {
        const tokens = await authApi.refresh(refreshToken)
        applyAuth(tokens, setUser, setRoleId)
      } catch {
        clearTokens()
        setUser(null)
        setRoleId(null)
      }
    }
  }, [])

  useEffect(() => {
    void (async () => {
      await refreshProfile()
      setIsLoading(false)
    })()
  }, [refreshProfile])

  const login = useCallback(async (loginValue: string, password: string) => {
    const tokens = await authApi.login({ login: loginValue, password })
    applyAuth(tokens, setUser, setRoleId)
    return tokens
  }, [])

  const register = useCallback(async (payload: authApi.RegisterPayload) => {
    const tokens = await authApi.register(payload)
    applyAuth(tokens, setUser, setRoleId)
    return tokens
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    setRoleId(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      roleId,
      isAuthenticated: !!user && !!getAccessToken(),
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, roleId, isLoading, login, register, logout, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
