import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function PharmacistLayout({ currentUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['Pharmacist', 'pharmicist', 'pharrmicist', 'Admin'] },
    { id: 'pharmacy', label: 'Pharmacy Queue', icon: '💊', roles: ['Pharmacist', 'pharmicist', 'pharrmicist', 'Admin'] },
    { id: 'stock', label: 'Medicine Stock', icon: '📦', roles: ['Pharmacist', 'pharmicist', 'pharrmicist', 'Admin'] },
    { id: 'purchases', label: 'Purchases', icon: '🛒', roles: ['Pharmacist', 'pharmicist', 'pharrmicist', 'Admin'] },
    { id: 'prescriptions', label: 'All Prescriptions', icon: '🧾', roles: ['Pharmacist', 'pharmicist', 'pharrmicist', 'Admin', 'Doctor'] },
    { id: 'sales', label: 'Sales & Profit', icon: '💹', roles: ['Pharmacist', 'pharmicist', 'pharrmicist', 'Admin'] },
  ]

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('doctosmart_user')
      window.location.href = '/login'
    }
  }

  const activeNav = location.pathname.split('/').pop()

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar
        navItems={navItems}
        activeNav={activeNav}
        setActiveNav={(path) => navigate(`/pharmacist/${path}`)}
        isOpen={sidebarOpen}
        userRole={currentUser.role}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="main-wrapper">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
          onAddPatient={() => {}} // Pharmacists usually don't add patients
          onNavigate={(path) => navigate(`/pharmacist/${path}`)}
          userRole={currentUser.role}
          currentUser={currentUser}
        />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
