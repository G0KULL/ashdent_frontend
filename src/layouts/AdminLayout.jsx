import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import AddPatient from '../components/AddPatient'

export default function AdminLayout({ currentUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showAddPatient, setShowAddPatient] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('doctosmart_user')
      window.location.href = '/login'
    }
  }

  // derive activeNav from pathname
  const activeNav = location.pathname.split('/').pop()

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar
        activeNav={activeNav}
        setActiveNav={(path) => {
          if (path === 'add-patients') setShowAddPatient(true)
          else navigate(`/admin/${path}`)
        }}
        isOpen={sidebarOpen}
        userRole={currentUser.role}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="main-wrapper">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
          onAddPatient={() => setShowAddPatient(true)}
          onNavigate={(path) => navigate(`/admin/${path}`)}
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
            navigate('/admin/search-patient')
          }}
        />
      )}
    </div>
  )
}
