import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import AddPatient from '../components/AddPatient'
import { confirmLogout } from '../utils/logout'

export default function DoctorLayout({ currentUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showAddPatient, setShowAddPatient] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    confirmLogout()
  }

  // derive activeNav from pathname
  const activeNav = location.pathname.split('/').pop()

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar
        activeNav={activeNav}
        setActiveNav={(path) => {
          if (path === 'add-patients') setShowAddPatient(true)
          else if (currentUser?.role === 'Admin' && (path === 'dashboard' || ['billing', 'transactions', 'pharmacy', 'users', 'masters', 'reports', 'income-analytics'].includes(path))) navigate(`/admin/${path}`)
          else navigate(`/doctor/${path}`)
        }}
        isOpen={sidebarOpen}
        userRole={currentUser?.role}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="main-wrapper">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
          onAddPatient={() => setShowAddPatient(true)}
          onNavigate={(path) => {
            if (currentUser?.role === 'Admin' && (path === 'dashboard' || ['billing', 'transactions', 'pharmacy', 'users', 'masters', 'reports', 'income-analytics'].includes(path))) navigate(`/admin/${path}`)
            else navigate(`/doctor/${path}`)
          }}
          userRole={currentUser?.role}
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
            navigate('/doctor/search-patient')
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}
