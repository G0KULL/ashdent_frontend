/**
 * Global API and Authorization Utilities with Multi-Tenant & Multi-Branch Scoping
 */

export const API_BASE = 'http://127.0.0.1:8000/api'

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}')
  } catch {
    return {}
  }
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
  const user = getStoredUser()
  const branch = getStoredBranch()
  const company = getStoredCompany()
  return {
    'Content-Type': 'application/json',
    'X-User-Id': user.id ? String(user.id) : '',
    'X-Username': user.username || '',
    'X-User-Role': user.role || '',
    'X-Branch-Id': branch.id ? String(branch.id) : '',
    'X-Company-Id': (company.id || branch.company || branch.company_id) ? String(company.id || branch.company || branch.company_id) : '',
    ...extra
  }
}
