import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getHeaders, API_BASE } from '../utils/api'

const BranchContext = createContext(null)

export function BranchProvider({ children }) {
  const [companies, setCompanies] = useState([])
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
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  // Determine if current user is Super Admin
  const isSuperAdmin = useCallback(() => {
    try {
      const user = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}')
      return user.is_superuser === true || user.role === 'Super Admin'
    } catch {
      return false
    }
  }, [])

  // Fetch all companies (Super Admin only)
  const fetchCompanies = useCallback(async () => {
    if (!isSuperAdmin()) return []
    setLoadingCompanies(true)
    try {
      const res = await fetch(`${API_BASE}/companies/`, {
        headers: getHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.results || [])
        setCompanies(list)
        return list
      }
    } catch (err) {
      console.error('Failed to load companies:', err)
    } finally {
      setLoadingCompanies(false)
    }
    return []
  }, [isSuperAdmin])

  // Fetch branches scoped to the active company
  const fetchBranches = useCallback(async (forcedCompany = null) => {
    try {
      const user = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}')
      if (!user.id && !user.username) {
        setLoadingBranches(false)
        return
      }

      const superUser = user.is_superuser === true || user.role === 'Super Admin'
      const comp = forcedCompany || activeCompany

      // If Super Admin and no company selected, do not load branches
      if (superUser && (!comp || !comp.id)) {
        setBranches([])
        setActiveBranch(null)
        setLoadingBranches(false)
        return
      }

      const url = superUser && comp?.id
        ? `${API_BASE}/branches/?company_id=${comp.id}`
        : `${API_BASE}/branches/`

      const res = await fetch(url, {
        headers: getHeaders()
      })

      if (res.ok) {
        const data = await res.json()
        const branchList = Array.isArray(data) ? data : (data.results || [])
        if (branchList.length > 0) {
          setBranches(branchList)

          setActiveBranch(prev => {
            const match = prev ? branchList.find(b => String(b.id) === String(prev.id)) : null
            const defaultBranch = branchList.find(b => b.code === 'MAIN' || b.name === 'Main Branch' || b.is_main) || branchList[0]
            const chosen = match || defaultBranch
            localStorage.setItem('ashdent_active_branch', JSON.stringify(chosen))

            // For non-superadmin, sync active company from branch
            if (!superUser) {
              const assignedComp = {
                id: chosen.company || chosen.company_id,
                name: chosen.company_name || 'AshDent Healthcare'
              }
              setActiveCompany(assignedComp)
              localStorage.setItem('ashdent_active_company', JSON.stringify(assignedComp))
            }

            return chosen
          })
        } else {
          setBranches([])
          setActiveBranch(null)
          localStorage.removeItem('ashdent_active_branch')
        }
      }
    } catch (err) {
      console.error('Failed to load branches:', err)
    } finally {
      setLoadingBranches(false)
    }
  }, [activeCompany])

  // Initial load
  useEffect(() => {
    if (isSuperAdmin()) {
      fetchCompanies()
    }
    fetchBranches()
  }, [isSuperAdmin, fetchCompanies, fetchBranches])

  // Switch active company (Super Admin)
  const switchCompany = async (company) => {
    if (!company) {
      setActiveCompany(null)
      setActiveBranch(null)
      setBranches([])
      localStorage.removeItem('ashdent_active_company')
      localStorage.removeItem('ashdent_active_branch')
      window.dispatchEvent(new CustomEvent('ashdent:companyChanged', { detail: null }))
      window.dispatchEvent(new CustomEvent('ashdent:branchChanged', { detail: null }))
      return
    }

    const compObj = {
      id: company.id || company._id,
      name: company.name,
      code: company.code
    }

    setActiveCompany(compObj)
    localStorage.setItem('ashdent_active_company', JSON.stringify(compObj))

    // Fetch branches for newly selected company
    try {
      const res = await fetch(`${API_BASE}/branches/?company_id=${compObj.id}`, {
        headers: getHeaders({ 'X-Company-Id': String(compObj.id) })
      })
      if (res.ok) {
        const data = await res.json()
        const branchList = Array.isArray(data) ? data : (data.results || [])
        setBranches(branchList)
        const chosenBranch = branchList.find(b => b.code === 'MAIN' || b.name === 'Main Branch' || b.is_main) || branchList[0] || null
        if (chosenBranch) {
          setActiveBranch(chosenBranch)
          localStorage.setItem('ashdent_active_branch', JSON.stringify(chosenBranch))
        } else {
          setActiveBranch(null)
          localStorage.removeItem('ashdent_active_branch')
        }

        // Broadcast events to update open screens
        window.dispatchEvent(new CustomEvent('ashdent:companyChanged', { detail: compObj }))
        window.dispatchEvent(new CustomEvent('ashdent:branchChanged', { detail: chosenBranch }))
      }
    } catch (err) {
      console.error('Failed to switch company branches:', err)
    }
  }

  // Switch active branch
  const switchBranch = (branchId) => {
    const found = branches.find(b => String(b.id) === String(branchId))
    if (found) {
      setActiveBranch(found)
      localStorage.setItem('ashdent_active_branch', JSON.stringify(found))

      // Broadcast event so any active screens can react
      window.dispatchEvent(new CustomEvent('ashdent:branchChanged', { detail: found }))
    }
  }

  return (
    <BranchContext.Provider value={{
      companies,
      branches,
      activeBranch,
      activeCompany,
      loadingBranches,
      loadingCompanies,
      switchCompany,
      switchBranch,
      fetchCompanies,
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
      companies: [],
      branches: branch ? [branch] : [],
      activeBranch: branch,
      activeCompany: company,
      loadingBranches: false,
      loadingCompanies: false,
      switchCompany: () => {},
      switchBranch: () => {},
      fetchCompanies: () => {},
      fetchBranches: () => {},
    }
  }
  return ctx
}
