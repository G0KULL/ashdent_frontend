import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePatients } from '../context/PatientContext'
import styles from './Topbar.module.css'

export default function Topbar({ onToggleSidebar, onNavigate, userRole, currentUser }) {
  const { searchQuery, setSearchQuery } = usePatients()
  const [notifOpen, setNotifOpen] = useState(false)
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

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
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
            {userRole} Dashboard <span className={styles.sep}>|</span> <span className={styles.brand}>DoctoSmart HMS</span>
          </h1>
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
              <span className={styles.badge}>3</span>
            </button>

            {notifOpen && (
              <div className={styles.notifPanel}>
                <div className={styles.notifHeader}>
                  <span>Notifications</span>
                  <button onClick={() => setNotifOpen(false)}>✕</button>
                </div>
                <ul className={styles.notifList}>
                  {[
                    { text: 'New appointment scheduled by Arjun Menon', time: '2 minutes ago', unread: true },
                    { text: 'Lab report ready for patient #1204', time: '15 minutes ago', unread: true },
                    { text: 'Monthly billing summary generated', time: '1 hour ago', unread: false },
                  ].map((n, i) => (
                    <li key={i} className={`${styles.notifItem} ${n.unread ? styles.unread : ''}`}>
                      <span className={styles.notifDot} />
                      <div>
                        <p>{n.text}</p>
                        <small>{n.time}</small>
                      </div>
                    </li>
                  ))}
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
