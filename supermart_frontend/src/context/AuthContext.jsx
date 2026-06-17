import { createContext, useContext, useState, useEffect } from 'react'
import { getProfile } from '../api/auth'
import { mergeCart } from '../api/cart'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (accessToken) {
      getProfile()
        .then((res) => setUser(res.data))
        .catch(() => clearAuth())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const clearAuth = () => {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  const login = async (userData, tokens) => {
    setUser(userData)
    setAccessToken(tokens.access)
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)

    // Merge guest cart into the user's cart silently
    const sessionId = localStorage.getItem('cart_session_id')
    if (sessionId) {
      try {
        await mergeCart(sessionId)
      } catch (_) {}
    }
  }

  const logout = () => clearAuth()

  const refreshUser = () =>
    getProfile()
      .then((res) => setUser(res.data))
      .catch(() => {})

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
