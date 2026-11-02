import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePatients } from '../context/PatientContext'
import { useBranch } from '../context/BranchContext'
import styles from './Topbar.module.css'

export default function Topbar({ onToggleSidebar, onNavigate, userRole, currentUser }) {
  const { searchQuery, setSearchQuery } = usePatients()
  const { branches, activeBranch, activeCompany, switchBranch } = useBranch()
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const branchRef = useRef(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Determine dashboard home path based on current URL prefix
  const getHomePath = () => {
    const path = location.pathname
    if (path.startsWith('/admin')) return '/admin/dashboard'
    if (path.startsWith('/doctor')) return '/doctor/dashboard'
    if (path.startsWith('/receptionist')) return '/receptionist/dashboard'
    if (path.startsWith('/pharmacist')) return '/pharmacist/dashboard'
    if (path.startsWith('/pharmacy')) return '/pharmacy/dashboard'
    return '/'
  }

  // Show back button when NOT on dashboard
  const isDashboard = location.pathname.endsWith('/dashboard') || location.pathname.endsWith('/')
  const homePath = getHomePath()

  const fetchNotifications = useCallback(async () => {
    try {
      const u = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}')
      const res = await fetch('http://127.0.0.1:8000/api/notifications/', {
        headers: {
          'X-User-Id': u.id || '',
          'X-Username': u.username || '',
          'X-User-Role': u.role || ''
        }
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setNotifications(data)
          setUnreadCount(data.filter(n => !n.is_read).length)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const timer = setInterval(fetchNotifications, 30000)
    return () => clearInterval(timer)
  }, [fetchNotifications])

  const handleMarkRead = async (id) => {
    try {
      const u = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}')
      await fetch(`http://127.0.0.1:8000/api/notifications/${id}/read/`, {
        method: 'POST',
        headers: { 'X-User-Id': u.id || '', 'X-Username': u.username || '' }
      })
      fetchNotifications()
    } catch (e) {
      console.error(e)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const u = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}')
      await fetch(`http://127.0.0.1:8000/api/notifications/mark-all-read/`, {
        method: 'POST',
        headers: { 'X-User-Id': u.id || '', 'X-Username': u.username || '' }
      })
      fetchNotifications()
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
      if (branchRef.current && !branchRef.current.contains(e.target)) {
        setBranchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.toggleBtn} onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* Back to Home button — shown on all sub-module pages */}
        {!isDashboard && (
          <button
            className={styles.homeBtn}
            onClick={() => navigate(homePath)}
            aria-label="Back to Home"
            title="Back to Dashboard"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 9h2v9h5v-5h2v5h5V9h2L10 2z" fill="currentColor" />
            </svg>
            <span>Home</span>
          </button>
        )}

        <div className={styles.titleWrap}>
          <h1 className={styles.title} onClick={() => onNavigate && onNavigate('dashboard')} style={{ cursor: 'pointer' }}>
            {userRole} Dashboard <span className={styles.sep}>|</span> <span className={styles.brand}>AshDent HMS</span>
          </h1>
        </div>

        {/* Branch Selector Widget */}
        <div className={styles.branchSelectorWrap} ref={branchRef}>
          <button
            type="button"
            className={`${styles.branchTrigger} ${branches.length <= 1 ? styles.branchTriggerStatic : ''}`}
            onClick={() => branches.length > 1 && setBranchDropdownOpen(prev => !prev)}
            aria-label="Active Branch"
            title={branches.length > 1 ? "Click to switch branch" : "Current Branch"}
          >
            <svg className={styles.branchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
            </svg>
            <div className={styles.branchInfo}>
              <span className={styles.branchName}>{activeBranch?.name || 'Main Branch'}</span>
              <span className={styles.branchCompany}>{activeCompany?.name || activeBranch?.company_name || 'AshDent Healthcare'}</span>
            </div>
            {branches.length > 1 && (
              <svg className={`${styles.branchChevron} ${branchDropdownOpen ? styles.branchChevronOpen : ''}`} width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {branchDropdownOpen && branches.length > 1 && (
            <div className={styles.branchDropdown}>
              <div className={styles.branchDropdownHeader}>
                Authorized Branches ({branches.length})
              </div>
              {branches.map(b => (
                <button
                  key={b.id}
                  type="button"
                  className={`${styles.branchItem} ${String(b.id) === String(activeBranch?.id) ? styles.branchItemActive : ''}`}
                  onClick={() => {
                    switchBranch(b.id)
                    setBranchDropdownOpen(false)
                  }}
                >
                  <div className={styles.branchItemContent}>
                    <span className={styles.branchItemName}>{b.name}</span>
                    <span className={styles.branchItemCode}>{b.code} {b.city ? `• ${b.city}` : ''}</span>
                  </div>
                  {String(b.id) === String(activeBranch?.id) && (
                    <span className={styles.branchCheckmark}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search with name…"
            autoComplete="off"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              if (onNavigate) onNavigate('search-patient')
            }}
            id="globalSearch"
          />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Notifications */}
          <div className={styles.notifWrap} ref={notifRef}>
            <button
              className={styles.iconBtn}
              onClick={() => setNotifOpen(o => !o)}
              aria-label="Notifications"
            >
              <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a6 6 0 00-6 6v3l-1.707 1.707A1 1 0 003 14h14a1 1 0 00.707-1.707L16 11V8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 16a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>

            {notifOpen && (
              <div className={styles.notifPanel}>
                <div className={styles.notifHeader}>
                  <span>Notifications {unreadCount > 0 && `(${unreadCount} unread)`}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setNotifOpen(false)}>✕</button>
                  </div>
                </div>
                <ul className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <li style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      No notifications yet
                    </li>
                  ) : (
                    notifications.map((n) => (
                      <li
                        key={n.id}
                        className={`${styles.notifItem} ${!n.is_read ? styles.unread : ''}`}
                        onClick={() => !n.is_read && handleMarkRead(n.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className={styles.notifDot} />
                        <div>
                          <p style={{ fontWeight: !n.is_read ? 700 : 500, margin: '0 0 2px' }}>{n.title}</p>
                          <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{n.message}</p>
                          <small style={{ color: '#94a3b8', fontSize: 10 }}>
                            {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Settings */}
          <button className={styles.iconBtn} aria-label="Settings">
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.22 3.22l1.42 1.42M15.36 15.36l1.42 1.42M3.22 16.78l1.42-1.42M15.36 4.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Profile */}
          <button className={`${styles.iconBtn} ${styles.profileBtn}`} aria-label="Profile">
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className={styles.profileLabel}>{currentUser?.name || 'User'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
