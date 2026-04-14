// src/features/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import api from '@/api/apiClient'

const AuthContext = createContext(null)
const STORAGE_KEY = 'user'

function clearAdminLogoutFlag() {
  if (typeof window === 'undefined') return false

  const url = new URL(window.location.href)
  if (url.searchParams.get('adminLogout') !== '1') return false

  url.searchParams.delete('adminLogout')
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
  return true
}

export function useAuth() {
  return useContext(AuthContext)
}

function isTokenExpired(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true

    const payloadBase64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const payloadJson = atob(payloadBase64)
    const payload = JSON.parse(payloadJson)

    if (!payload.exp) return false

    const nowInSeconds = Date.now() / 1000
    return payload.exp < nowInSeconds
  } catch (e) {
    console.error('Lỗi decode JWT:', e)
    return true
  }
}

function getInitialUser() {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    if (!parsed?.token) return null

    if (isTokenExpired(parsed.token)) {
      console.warn('Token hết hạn, xoá user khỏi localStorage')
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch (e) {
    console.error('Lỗi parse user từ localStorage:', e)
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getInitialUser())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!clearAdminLogoutFlag()) return

    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY) {
        setUser(getInitialUser())
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  useEffect(() => {
    if (!user?.token || user.phone) return

    let cancelled = false

    const hydrateUserProfile = async () => {
      try {
        const res = await api.get('/auth/profile')
        const profile = res.data
        if (!profile || cancelled) return

        const mergedUser = {
          ...user,
          id: user.id || String(profile.user_id || ''),
          username: profile.username || user.username,
          email: profile.email || user.email,
          phone: profile.phone || '',
        }

        setUser(mergedUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedUser))
      } catch (err) {
        console.error('Lỗi tải profile để đồng bộ user:', err)
      }
    }

    hydrateUserProfile()

    return () => {
      cancelled = true
    }
  }, [user])

  const login = async (arg1, arg2, arg3) => {
    setLoading(true)
    let email, password, rememberMe

    if (typeof arg1 === 'string') {
      email = arg1
      password = arg2
      rememberMe = arg3
    } else if (arg1 && typeof arg1 === 'object') {
      email = arg1.email
      password = arg1.password
      rememberMe = arg1.rememberMe
    }

    try {
      const res = await api.post('/auth/login', { email, password, rememberMe })
      const data = res.data

      const authUser = {
        token: data.token,
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        phone: data.user.phone || '',
        role: data.user.role,
      }

      setUser(authUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))

      return authUser
    } catch (err) {
      console.error('Lỗi login:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async ({ username, email, password, confirmPassword }) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        username,
        email,
        password,
        confirmPassword,
      })
      return res.data
    } catch (err) {
      console.error('Lỗi register:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user?.token,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
