import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function PharmacyLayout({ currentUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['Pharmacist', 'Pharmacy', 'pharmacy', 'Admin'] },
    { id: 'pharmacy', label: 'Pharmacy Queue', icon: '💊', roles: ['Pharmacist', 'Pharmacy', 'pharmacy', 'Admin'] },
    { id: 'stock', label: 'Medicine Stock', icon: '📦', roles: ['Pharmacist', 'Pharmacy', 'pharmacy', 'Admin'] },
    { id: 'purchases', label: 'Purchases', icon: '🛒', roles: ['Pharmacist', 'Pharmacy', 'pharmacy', 'Admin'] },
    { id: 'prescriptions', label: 'All Prescriptions', icon: '🧾', roles: ['Pharmacist', 'Pharmacy', 'pharmacy', 'Admin', 'Doctor'] },
    { id: 'sales', label: 'Sales & Profit', icon: '💹', roles: ['Pharmacist', 'Pharmacy', 'pharmacy', 'Admin'] },
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
        setActiveNav={(path) => navigate(`/pharmacy/${path}`)}
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
          onNavigate={(path) => navigate(`/pharmacy/${path}`)}
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
