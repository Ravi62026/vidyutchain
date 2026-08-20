import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { AuthContext } from './auth-context.js'

const STORAGE_KEY = 'vidyutchain.session'

function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)
  const [isRestoring, setIsRestoring] = useState(Boolean(readStoredSession()?.accessToken))

  const persistSession = useCallback((nextSession) => {
    setSession(nextSession)
    if (nextSession) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const accessToken = session?.accessToken

    async function restore() {
      if (!accessToken) {
        setIsRestoring(false)
        return
      }

      try {
        const result = await api.me(accessToken)
        if (!cancelled) {
          persistSession({ accessToken, user: result.user })
        }
      } catch {
        if (!cancelled) {
          persistSession(null)
        }
      } finally {
        if (!cancelled) {
          setIsRestoring(false)
        }
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [persistSession, session?.accessToken])

  const login = useCallback(async (credentials) => {
    const result = await api.login(credentials)
    persistSession({ accessToken: result.accessToken, user: result.user })
    return result.user
  }, [persistSession])

  const register = useCallback(async (credentials) => {
    const result = await api.register(credentials)
    persistSession({ accessToken: result.accessToken, user: result.user })
    return result.user
  }, [persistSession])

  const logout = useCallback(() => {
    persistSession(null)
  }, [persistSession])

  const value = useMemo(() => ({
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isAuthenticated: Boolean(session?.accessToken && session?.user),
    isRestoring,
    login,
    register,
    logout,
  }), [session, isRestoring, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

