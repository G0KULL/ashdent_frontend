import { useState, useEffect } from 'react'
import styles from './UpcomingAppointments.module.css'

function getInitials(name) {
  if (!name) return ''
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function RecentPatients() {
  const [patients, setPatients] = useState([])

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/patients/recent/')
      .then(res => res.json())
      .then(data => setPatients(data.slice(0, 3)))
      .catch(console.error)
  }, [])

  return (
    <section className={styles.card} aria-label="Recent Patients">
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Patients</h2>
        <button className={styles.viewAll} onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'search-patient' }))}>View All →</button>
      </div>
      {patients.length === 0 ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyIcon}>👤</div>
          <p className={styles.emptyTitle}>No patients</p>
          <p className={styles.emptySub}>Add a new patient to see them here</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {patients.map((p, i) => {
            return (
              <li key={p.id || i} className={styles.item} tabIndex={0}>
                <div className={styles.timeWrap}>
                  <span className={styles.hour}>NEW</span>
                </div>
                <div className={styles.avatar}>
                  {getInitials(p.name)}
                </div>
                <div className={styles.details}>
                  <p className={styles.patientName}>{p.name}</p>
                  <p className={styles.apptType}>{p.phone || 'No phone'}</p>
                </div>
                <span className={`${styles.statusPill} ${styles.engagedPill}`}>
                  View
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
