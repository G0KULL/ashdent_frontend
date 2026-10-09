import { useState, useEffect } from 'react'
import styles from './UpcomingAppointments.module.css'

const STATUS_META = {
  completed: { label: 'Completed',    cls: 'done' },
  scheduled:   { label: 'Scheduled',   cls: 'queue' },
  waiting: { label: 'Waiting', cls: 'waiting' },
  engaged: { label: 'Engaged', cls: 'engaged' },
}

const AVATAR_COLORS = [
  { bg: '#e8f5e9', fg: '#4CAF50' },
  { bg: '#e3f2fd', fg: '#1E88E5' },
  { bg: '#ede7f6', fg: '#7E57C2' },
  { bg: '#fce4ec', fg: '#E91E63' },
  { bg: '#fff3e0', fg: '#F57C00' },
]

function getInitials(name) {
  if (!name) return ''
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function UpcomingAppointments() {
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
    const headers = { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' }
    fetch('http://127.0.0.1:8000/api/appointments/today/', { headers })
      .then(res => res.json())
      .then(data => setAppointments(data.slice(0, 5)))
      .catch(console.error)
  }, [])

  return (
    <section className={styles.card} aria-label="Today's Patient List">
      <div className={styles.header}>
        <h2 className={styles.title}>Today's Patient List</h2>
        <button className={styles.viewAll} onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'today-patients' }))}>View Full List →</button>
      </div>
      {appointments.length === 0 ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyIcon}>📅</div>
          <p className={styles.emptyTitle}>No appointments</p>
          <p className={styles.emptySub}>You have a clear schedule today</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {appointments.map((appt, i) => {
            const statusKey = appt.status.toLowerCase()
            const meta = STATUS_META[statusKey] || STATUS_META.scheduled
            const av = AVATAR_COLORS[i % AVATAR_COLORS.length]
            const [timePart, ampmPart] = (appt.time_formatted || ' ').split(' ')
            
            return (
              <li key={appt.id || i} className={`${styles.item} patient-row ${appt.status === 'Completed' ? styles.itemDone : ''}`} tabIndex={0}>
                <div className={styles.left}>
                  <div className={styles.avatar} style={{ background: av.bg, color: av.fg }}>
                    {getInitials(appt.patient_name)}
                  </div>
                  <div className={styles.name}>{appt.patient_name}</div>
                </div>
                <div className={`${styles.status} ${styles[meta.cls + 'Pill']}`}>
                  {meta.label}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
