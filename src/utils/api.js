/**
 * Global API and Authorization Utilities with Multi-Tenant & Multi-Branch Scoping
 * Centralizes JWT Authentication, Automatic Refresh, and Role/Tenant Protection
 */

export const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://127.0.0.1:8000/api'

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}')
  } catch {
    return {}
  }
}

export function getAccessToken() {
  const token = localStorage.getItem('ashdent_access_token') || localStorage.getItem('token') || localStorage.getItem('access_token')
  if (token) return token
  const user = getStoredUser()
  return user?.access || user?.access_token || user?.token || ''
}

export function getRefreshToken() {
  const token = localStorage.getItem('ashdent_refresh_token') || localStorage.getItem('refresh_token')
  if (token) return token
  const user = getStoredUser()
  return user?.refresh || user?.refresh_token || ''
}

export function setTokens(access, refresh) {
  if (access) {
    localStorage.setItem('ashdent_access_token', access)
    localStorage.setItem('token', access)
  }
  if (refresh) {
    localStorage.setItem('ashdent_refresh_token', refresh)
  }
  const user = getStoredUser()
  if (user && Object.keys(user).length > 0) {
    if (access) {
      user.access = access
      user.access_token = access
      user.token = access
    }
    if (refresh) {
      user.refresh = refresh
      user.refresh_token = refresh
    }
    localStorage.setItem('ashdent_user', JSON.stringify(user))
  }
}

export function clearAuthData() {
  localStorage.removeItem('ashdent_access_token')
  localStorage.removeItem('ashdent_refresh_token')
  localStorage.removeItem('token')
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('ashdent_user')
  localStorage.removeItem('doctosmart_user')
  localStorage.removeItem('ashdent_active_branch')
  localStorage.removeItem('ashdent_active_company')
}

export function getStoredBranch() {
  try {
    return JSON.parse(localStorage.getItem('ashdent_active_branch') || '{}')
  } catch {
    return {}
  }
}

export function getStoredCompany() {
  try {
    return JSON.parse(localStorage.getItem('ashdent_active_company') || '{}')
  } catch {
    return {}
  }
}

export function getHeaders(extra = {}) {
  const branch = getStoredBranch()
  const company = getStoredCompany()
  const token = getAccessToken()

  const headers = {
    'Content-Type': 'application/json',
    'X-Branch-Id': branch.id ? String(branch.id) : '',
    'X-Company-Id': (company.id || branch.company || branch.company_id) ? String(company.id || branch.company || branch.company_id) : '',
    ...extra
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

// Token refresh synchronization to prevent parallel duplicate refreshes
let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback)
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) {
    clearAuthData()
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return null
  }

  try {
    const res = await nativeFetch(`${API_BASE}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh })
    })

    if (!res.ok) {
      clearAuthData()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return null
    }

    const data = await res.json()
    const newAccess = data.access || data.access_token
    const newRefresh = data.refresh || data.refresh_token || refresh
    setTokens(newAccess, newRefresh)
    return newAccess
  } catch (err) {
    clearAuthData()
    return null
  }
}

// Intercept global fetch to provide automatic token injection & seamless 401 retry
const nativeFetch = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : null

if (typeof window !== 'undefined' && nativeFetch) {
  window.fetch = async function (input, init = {}) {
    let url = typeof input === 'string' ? input : (input?.url || '')
    
    // Auto-normalize production API URL if API_BASE is configured to remote HTTPS domain or relative /api
    if (API_BASE && API_BASE !== 'http://127.0.0.1:8000/api' && url.includes('http://127.0.0.1:8000/api')) {
      url = url.replace('http://127.0.0.1:8000/api', API_BASE)
      if (typeof input === 'string') {
        input = url
      }
    }

    // Only intercept API calls
    const isApi = url.includes('/api/') || (API_BASE && url.startsWith(API_BASE))
    const isAuthEndpoint = url.includes('/login/') || url.includes('/token/refresh/')

    if (!isApi || isAuthEndpoint) {
      return nativeFetch(input, init)
    }

    // Ensure Authorization header exists if we have a token
    init = init || {}
    const headers = new Headers(init.headers || {})
    const token = getAccessToken()
    const authHeader = headers.get('Authorization')
    if (token && (!authHeader || authHeader === 'Bearer' || authHeader === 'Bearer ' || authHeader === 'Bearer null' || authHeader === 'Bearer undefined')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    init.headers = headers

    let response = await nativeFetch(input, init)

    // If 401 Unauthorized, attempt refresh once
    if (response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await refreshAccessToken()
        isRefreshing = false
        if (newToken) {
          onRefreshed(newToken)
        } else {
          return response
        }
      }

      // Wait for the active refresh to finish
      const retryToken = await new Promise((resolve) => {
        const currentToken = getAccessToken()
        if (!isRefreshing && currentToken) {
          resolve(currentToken)
        } else {
          addRefreshSubscriber((newToken) => resolve(newToken))
        }
      })

      if (retryToken) {
        const retryHeaders = new Headers(init.headers || {})
        retryHeaders.set('Authorization', `Bearer ${retryToken}`)
        init.headers = retryHeaders
        return nativeFetch(input, init)
      }
    }

    return response
  }
}
