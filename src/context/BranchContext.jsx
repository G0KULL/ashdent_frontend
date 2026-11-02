import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getHeaders, API_BASE } from '../utils/api'

const BranchContext = createContext(null)

export function BranchProvider({ children }) {
  const [branches, setBranches] = useState([])
  const [activeBranch, setActiveBranch] = useState(() => {
    try {
      const saved = localStorage.getItem('ashdent_active_branch')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [activeCompany, setActiveCompany] = useState(() => {
    try {
      const saved = localStorage.getItem('ashdent_active_company')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loadingBranches, setLoadingBranches] = useState(true)

  const fetchBranches = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}')
      if (!user.id && !user.username) {
        setLoadingBranches(false)
        return
      }

      const res = await fetch(`${API_BASE}/branches/`, {
        headers: getHeaders()
      })

      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setBranches(data)

          // Verify current activeBranch is valid in returned authorized branches
          setActiveBranch(prev => {
            const match = prev ? data.find(b => String(b.id) === String(prev.id)) : null
            const defaultBranch = data.find(b => b.code === 'MAIN' || b.name === 'Main Branch' || b.company_name === 'AshDent Healthcare') || data[0]
            const chosen = match || defaultBranch
            localStorage.setItem('ashdent_active_branch', JSON.stringify(chosen))

            const comp = {
              id: chosen.company || chosen.company_id,
              name: chosen.company_name || 'AshDent Healthcare'
            }
            setActiveCompany(comp)
            localStorage.setItem('ashdent_active_company', JSON.stringify(comp))
            return chosen
          })
        } else {
          setBranches([])
        }
      }
    } catch (err) {
      console.error('Failed to load branches:', err)
    } finally {
      setLoadingBranches(false)
    }
  }, [])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  const switchBranch = (branchId) => {
    const found = branches.find(b => String(b.id) === String(branchId))
    if (found) {
      setActiveBranch(found)
      localStorage.setItem('ashdent_active_branch', JSON.stringify(found))

      const comp = {
        id: found.company || found.company_id,
        name: found.company_name || 'AshDent Healthcare'
      }
      setActiveCompany(comp)
      localStorage.setItem('ashdent_active_company', JSON.stringify(comp))

      // Broadcast event so any active screens can react
      window.dispatchEvent(new CustomEvent('ashdent:branchChanged', { detail: found }))
    }
  }

  return (
    <BranchContext.Provider value={{
      branches,
      activeBranch,
      activeCompany,
      loadingBranches,
      switchBranch,
      fetchBranches,
    }}>
      {children}
    </BranchContext.Provider>
  )
}

export function useBranch() {
  const ctx = useContext(BranchContext)
  if (!ctx) {
    const branch = JSON.parse(localStorage.getItem('ashdent_active_branch') || 'null')
    const company = JSON.parse(localStorage.getItem('ashdent_active_company') || 'null')
    return {
      branches: branch ? [branch] : [],
      activeBranch: branch,
      activeCompany: company,
      loadingBranches: false,
      switchBranch: () => {},
      fetchBranches: () => {},
    }
  }
  return ctx
}
