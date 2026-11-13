import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, tokenStore } from '../services/api.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!tokenStore.get())

  useEffect(() => {
    if (!tokenStore.get()) return
    api('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const startSession = useCallback((r, remember = true) => { tokenStore.set(r.token, remember); setUser(r.user); return r.user }, [])
  const login = async (email, password, remember = true) => startSession(await api('/auth/login', { method: 'POST', body: { email, password } }), remember)
  const register = async (body) => startSession(await api('/auth/register', { method: 'POST', body }))
  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }) } catch { /* token mungkin sudah tidak berlaku */ }
    tokenStore.clear(); setUser(null)
  }

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthContext.Provider>
}
