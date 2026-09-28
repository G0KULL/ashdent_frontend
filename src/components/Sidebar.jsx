import { useState } from 'react'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  {
    id: 'dashboard', label: 'Home', roles: ['Admin', 'Receptionist', 'Doctor'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="1" width="8" height="8" rx="2" fill="currentColor" />
        <rect x="11" y="1" width="8" height="8" rx="2" fill="currentColor" opacity=".6" />
        <rect x="1" y="11" width="8" height="8" rx="2" fill="currentColor" opacity=".6" />
        <rect x="11" y="11" width="8" height="8" rx="2" fill="currentColor" opacity=".3" />
      </svg>
    )
  },
  {
    id: 'add-patients', label: 'Add Patients',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="8" cy="7" r="4" fill="currentColor" opacity=".7" />
        <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 5v6M12 8h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'appointments', label: 'Appointments',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="7" cy="13" r="1" fill="currentColor" />
        <circle cx="10" cy="13" r="1" fill="currentColor" />
        <circle cx="13" cy="13" r="1" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'today-patients', label: 'Today Patients',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="8" r="4" fill="currentColor" opacity=".7" />
        <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 3l1.5 1.5L18 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'follow-ups', label: 'Follow-ups',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M17.5 10c0 4.142-3.358 7.5-7.5 7.5s-7.5-3.358-7.5-7.5S5.858 2.5 10 2.5s7.5 3.358 7.5 7.5z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'pre-bookings', label: 'Pre-bookings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'search-patient', label: 'Search Patient',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
]

const NAV_ITEMS_TELE = [

  {
    id: 'communication', label: 'Communication', roles: ['Doctor', 'Admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M18 10c0 4.418-3.582 8-8 8a7.96 7.96 0 01-4-.107L2 19l1.107-4A7.96 7.96 0 012 10c0-4.418 3.582-8 8-8s8 3.582 8 8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 10h6M7 7h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'website-appointment', label: 'Website Appointment', roles: ['Doctor', 'Receptionist', 'Admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2c-2 2-3.5 4.5-3.5 8s1.5 6 3.5 8M10 2c2 2 3.5 4.5 3.5 8S12 16 10 18M2 10h16" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    )
  },
]

const NAV_ITEMS_FINANCE = [
  {
    id: 'billing', label: 'Billing', roles: ['Admin', 'Receptionist', 'Pharmacist', 'Pharmacy'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M5 2h10a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },

  {
    id: 'transactions', label: 'Transactions', roles: ['Admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
      </svg>
    )
  },



  {
    id: 'pharmacy', label: 'Pharmacy', roles: ['Admin', 'Pharmacist', 'Receptionist'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2L21 5.92a2.12 2.12 0 0 0-3-3L4.5 16.5z" />
        <path d="m15 5 4 4" />
      </svg>
    )
  },

  {
    id: 'users', label: 'Staff Management', roles: ['Admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM2 18c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  },


]

export default function Sidebar({ activeNav, setActiveNav, isOpen, userRole, onLogout, currentUser, navItems }) {
  const isPharmacist = (role) => {
    if (!role) return false
    const r = role.toLowerCase()
    return r === 'pharmacist' || r === 'pharmicist' || r === 'pharrmicist'
  }

  const isAllowed = (item) => {
    if (userRole === 'Admin') {
      if (!item.roles) return true
      return item.roles.some(r => r.toLowerCase() === 'admin')
    }

    if (currentUser && Array.isArray(currentUser.permissions) && currentUser.permissions.length > 0) {
      if (userRole === 'Receptionist' && (item.id === 'pre-bookings' || item.id === 'follow-ups')) {
        return true
      }
      return currentUser.permissions.includes(item.id)
    }

    if (!item.roles) return true
    const normalizedUserRole = (userRole || '').toLowerCase()
    const equivalentRoles = (role) => {
      const r = role.toLowerCase()
      if (r === 'pharmacist' || r === 'pharmicist' || r === 'pharrmicist') {
        return ['pharmacist', 'pharmicist', 'pharrmicist']
      }
      return [r]
    }
    const userRoleGroup = equivalentRoles(normalizedUserRole)
    return item.roles.some(role => userRoleGroup.includes(role.toLowerCase()))
  }

  // Role-based sidebar filtering
  const coreItems = NAV_ITEMS.map(i => {
    if (['add-patients', 'appointments', 'today-patients', 'search-patient', 'follow-ups', 'pre-bookings'].includes(i.id))
      return { ...i, roles: ['Doctor', 'Receptionist', 'Admin'] }
    return i
  }).filter(isAllowed)

  return (
    <aside className={`${styles.sidebar} sidebar ${isOpen ? styles.open : styles.closed}`}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2z" fill="rgba(255,255,255,0.15)" />
            <path d="M14 6c-1.105 0-2 .895-2 2v3H9c-1.105 0-2 .895-2 2s.895 2 2 2h3v3c0 1.105.895 2 2 2s2-.895 2-2v-3h3c1.105 0 2-.895 2-2s-.895-2-2-2h-3V8c0-1.105-.895-2-2-2z" fill="white" />
          </svg>
        </div>
        {isOpen && (
          <div className={styles.brandText}>
            <span className={styles.brandName}>DoctoSmart</span>
            <span className={styles.brandSub}>HMS</span>
          </div>
        )}
      </div>

      {/* Profile */}
      {isOpen && (
        <div className={styles.profile}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="14" r="7" fill="rgba(255,255,255,0.9)" />
                <path d="M4 30c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="rgba(255,255,255,0.9)" />
              </svg>
            </div>
            <span className={styles.onlineDot} />
          </div>
          <p className={styles.doctorName}>{currentUser?.name || 'User'}</p>
          <p className={styles.location}>
            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 10, color: 'rgba(255,255,255,0.9)' }}>
              {userRole}
            </span>
          </p>
        </div>
      )}

      {/* Back to Home Button in Sidebar */}
      {activeNav !== 'dashboard' && (
        <div style={{ padding: isOpen ? '0 16px 16px' : '0 8px 16px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setActiveNav('dashboard')}
            title="Back to Home"
            style={{
              width: '100%', padding: isOpen ? '10px' : '10px 0',
              background: 'linear-gradient(135deg, rgba(219,39,119,0.2), rgba(168,85,247,0.2))',
              border: '1px solid rgba(219,39,119,0.4)',
              borderRadius: '10px', color: '#f9a8d4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(219,39,119,0.4), rgba(168,85,247,0.35))'; e.currentTarget.style.color = '#fff' }}
            onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(219,39,119,0.2), rgba(168,85,247,0.2))'; e.currentTarget.style.color = '#f9a8d4' }}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 9h2v9h5v-5h2v5h5V9h2L10 2z" fill="currentColor" />
            </svg>
            {isOpen && <span>Back to Home</span>}
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className={styles.nav}>
        <ul>
          {navItems ? (
            navItems.map(item => (
              <NavItem key={item.id} item={item} active={activeNav === item.id} onClick={() => setActiveNav(item.id)} isOpen={isOpen} />
            ))
          ) : isPharmacist(userRole) ? (
            <>
              {coreItems.filter(isAllowed).map(item => (
                <NavItem key={item.id} item={item} active={activeNav === item.id} onClick={() => setActiveNav(item.id)} isOpen={isOpen} />
              ))}
              {NAV_ITEMS_FINANCE.filter(item => ['pharmacy', 'stock', 'purchases', 'billing'].includes(item.id)).map(item => (
                <NavItem key={item.id} item={item} active={activeNav === item.id} onClick={() => setActiveNav(item.id)} isOpen={isOpen} />
              ))}
            </>
          ) : (
            <>
              {coreItems.filter(isAllowed).map(item => (
                <NavItem key={item.id} item={item} active={activeNav === item.id} onClick={() => setActiveNav(item.id)} isOpen={isOpen} />
              ))}

              {isOpen && coreItems.some(isAllowed) && <li className={styles.divider}>Telemedicine</li>}

              {NAV_ITEMS_TELE.filter(isAllowed).map(item => (
                <NavItem key={item.id} item={item} active={activeNav === item.id} onClick={() => setActiveNav(item.id)} isOpen={isOpen} />
              ))}

              {isOpen && NAV_ITEMS_FINANCE.some(isAllowed) && <li className={styles.divider}>Finance & Inventory</li>}

              {NAV_ITEMS_FINANCE.filter(isAllowed).map(item => (
                <NavItem key={item.id} item={item} active={activeNav === item.id} onClick={() => setActiveNav(item.id)} isOpen={isOpen} />
              ))}
            </>
          )}
        </ul>
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={onLogout}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13 7l4 3-4 3M8 10h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Logout
          </button>
          <span className={styles.version}>v2.4.1</span>
        </div>
      )}
    </aside>
  )
}

function NavItem({ item, active, onClick, isOpen }) {
  return (
    <li className={`${styles.navItem} ${active ? styles.active : ''}`}>
      <button className={styles.navLink} onClick={onClick} title={!isOpen ? item.label : ''}>
        <span className={styles.navIcon}>{item.icon}</span>
        {isOpen && <span className={styles.navLabel}>{item.label}</span>}
        {isOpen && item.badge && <span className={styles.badge}>{item.badge}</span>}
        {active && <span className={styles.activeBar} />}
      </button>
    </li>
  )
}
