import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '../lib/authStorage'

type RegisterInput = {
  companyName: string
  representativeName: string
  email: string
  password: string
}

type LoginInput = {
  email: string
  password: string
}

type AuthContextValue = {
  isAuthenticated: boolean
  isBootstrapping: boolean
  accessToken: string | null
  register(input: RegisterInput): Promise<void>
  login(input: LoginInput): Promise<void>
  refresh(): Promise<void>
  logout(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken())
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    setIsBootstrapping(true)
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      setIsBootstrapping(false)
      return
    }
    apiFetch<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    })
      .then((res) => {
        setAccessToken(res.accessToken)
        setRefreshToken(res.refreshToken)
        setAccessTokenState(res.accessToken)
      })
      .catch(() => {
        clearTokens()
        setAccessTokenState(null)
      })
      .finally(() => setIsBootstrapping(false))
  }, [])

  const value: AuthContextValue = useMemo(
    () => ({
      isAuthenticated: !!accessToken,
      isBootstrapping,
      accessToken,
      async register(input) {
        await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(input) })
        await this.login({ email: input.email, password: input.password })
      },
      async login(input) {
        const res = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(input)
        })
        setAccessToken(res.accessToken)
        setRefreshToken(res.refreshToken)
        setAccessTokenState(res.accessToken)
      },
      async refresh() {
        const refreshToken = getRefreshToken()
        if (!refreshToken) throw new Error('No refresh token')
        const res = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken })
        })
        setAccessToken(res.accessToken)
        setRefreshToken(res.refreshToken)
        setAccessTokenState(res.accessToken)
      },
      async logout() {
        const refreshToken = getRefreshToken()
        if (refreshToken) {
          await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => {})
        }
        clearTokens()
        setAccessTokenState(null)
      }
    }),
    [accessToken, isBootstrapping]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

