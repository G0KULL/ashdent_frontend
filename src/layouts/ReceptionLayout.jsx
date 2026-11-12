import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { usePatients } from '../context/PatientContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import AddPatient from '../components/AddPatient'
import { confirmLogout } from '../utils/logout'

export default function ReceptionLayout({ currentUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 768 : true))
  const [showAddPatient, setShowAddPatient] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { activePatient } = usePatients()

  // Automatically close mobile drawer when navigating to a new route
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  const handleLogout = () => {
    confirmLogout()
  }

  const activeNav = location.pathname.split('/').pop()

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar
        activeNav={activeNav}
        setActiveNav={(path) => {
          if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            setSidebarOpen(false)
          }
          if (path === 'add-patients') setShowAddPatient(true)
          else if (path === 'follow-ups') {
            const patientId = activePatient?.id || activePatient?.patient_id
            if (patientId) {
              navigate(`/receptionist/treatment-plans/${patientId}`, {
                state: {
                  patientId: patientId,
                  patientName: activePatient.name,
                  patientPhone: activePatient.phone || activePatient.mobile,
                  patientAge: activePatient.age,
                  patientGender: activePatient.gender,
                  defaultFilter: 'In Progress'
                }
              })
            } else {
              navigate('/receptionist/treatment-plans', { state: { defaultFilter: 'In Progress' } })
            }
          }
          else navigate(`/receptionist/${path}`)
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={currentUser.role}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      {sidebarOpen && <div className="sidebar-mobile-backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="main-wrapper">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
          onAddPatient={() => setShowAddPatient(true)}
          onNavigate={(path) => navigate(`/receptionist/${path}`)}
          userRole={currentUser.role}
          currentUser={currentUser}
        />
        <main className="content">
          <Outlet />
        </main>
      </div>

      {showAddPatient && (
        <AddPatient
          onClose={() => setShowAddPatient(false)}
          onSaved={() => {
            setShowAddPatient(false)
            navigate('/receptionist/search-patient')
          }}
        />
      )}
    </div>
  )
}
