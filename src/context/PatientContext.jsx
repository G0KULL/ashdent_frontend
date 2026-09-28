import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const PatientContext = createContext(null)

export function PatientProvider({ children }) {
  const [patients, setPatients]     = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activePatient, setActivePatient] = useState(null)

  // Re-fetch whenever searchQuery changes (debounce via useEffect)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchPatients = useCallback(async (query = '', date = '') => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/patient/search/?q=${encodeURIComponent(query)}&date=${date}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setPatients(data.map(p => ({
          ...p,
          // Normalize fields so components can use either p.name or firstName/lastName
          firstName: p.name?.split(' ')[0] || '',
          lastName:  p.name?.split(' ').slice(1).join(' ') || '',
          mobile:    p.phone,
          status:    p.status || 'Active',
          gender:    p.gender || '—',
          age:       p.age    || '—',
        })))
      }
    } catch (e) {
      console.error('PatientContext: fetchPatients failed:', e)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchPatients('')
  }, [fetchPatients])

  const [groups, setGroups] = useState(['General', 'Priority', 'VIP'])
  const nextId = (patients.length > 0 && typeof patients[0].id === 'number' 
    ? Math.max(...patients.map(p => p.id)) 
    : Date.now() % 100000) + 1

  function addGroup(name) {
    if (!groups.includes(name)) setGroups([...groups, name])
  }

  function addPatient(data) {
    setPatients(prev => [data, ...prev])
    return data.id
  }

  function updatePatient(id, data) {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
  }

  function deletePatient(id) {
    setPatients(prev => prev.filter(p => p.id !== id))
  }

  return (
    <PatientContext.Provider value={{
      patients,
      fetchPatients,
      searchQuery,
      setSearchQuery,
      activePatient,
      setActivePatient,
      groups,
      addGroup,
      nextId,
      addPatient,
      updatePatient,
      deletePatient,
    }}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatients() {
  return useContext(PatientContext)
}
