import { useEffect, useRef, useState } from 'react'
import styles from './AppointmentStatus.module.css'

// Queue: Waiting → Engaged → Completed  (no "Queue/Scheduled" card on dashboard)
const STATUS_CONFIG = [
  {
    id: 'upcoming', dbStatus: 'Scheduled', label: 'Upcoming', desc: 'Expected today', color: 'teal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.8" />
        <path d="M12 7v5l3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'waiting', dbStatus: 'Waiting', label: 'Waiting', desc: 'In waiting room', color: 'amber',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: 'engaged', dbStatus: 'Engaged', label: 'Engaged', desc: 'In consultation', color: 'blue',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" stroke="white" strokeWidth="1.8" />
        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'done', dbStatus: 'Completed', label: 'Completed', desc: 'Consultation done', color: 'green',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.8" />
        <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

function AnimatedBar({ percent, color }) {
  const barRef = useRef(null)
  useEffect(() => {
    if (!barRef.current) return
    setTimeout(() => {
      if (barRef.current) barRef.current.style.width = percent + '%'
    }, 100)
  }, [percent])

  return (
    <div className={styles.progressTrack}>
      <div
        ref={barRef}
        className={`${styles.progressFill} ${styles[color + 'Fill']}`}
        style={{ width: 0, transition: 'width 1s cubic-bezier(.4,0,.2,1)' }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const API_BASE = 'http://127.0.0.1:8000/api'

export default function AppointmentStatus() {
  const [appointments, setAppointments] = useState([])

  const fetchAppointments = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
      const headers = { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' }
      const res = await fetch(`${API_BASE}/appointments/today/`, { headers })
      if (res.ok) setAppointments(await res.json())
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchAppointments()
    const interval = setInterval(fetchAppointments, 10000)
    return () => clearInterval(interval)
  }, [])

  // Advance status: Waiting → Engaged → Completed
  const handleStatusChange = async (apptId, currentStatus) => {
    let nextStatus = ''
    if (currentStatus === 'Scheduled') nextStatus = 'Waiting'
    else if (currentStatus === 'Waiting') nextStatus = 'Engaged'
    else if (currentStatus === 'Engaged') nextStatus = 'Completed'

    if (!nextStatus) return

    try {
      const res = await fetch(`${API_BASE}/appointments/${apptId}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (res.ok) {
        fetchAppointments()
        if (nextStatus === 'Completed') {
          const appt = appointments.find(a => a.id === apptId)
          if (appt?.patient_phone) {
            const name = appt.patient_name?.split(' ')[0] || 'Patient'
            const msg = `Hello ${name}, your appointment at our Dental Clinic is now complete. Thank you for visiting${appt.doctor_name ? ' ' + appt.doctor_name : ''}. Please take your prescribed medicines on time.`
            window.open(`https://wa.me/91${appt.patient_phone}?text=${encodeURIComponent(msg)}`, '_blank')
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Only Scheduled/Waiting/Engaged/Completed appointments appear in the queue for today
  const queueAppts = appointments.filter(a => ['Scheduled', 'Waiting', 'Engaged', 'Completed'].includes(a.status))
  const totalInQueue = queueAppts.length

  const getStatusData = (dbStatus) => {
    const list = appointments.filter(a => a.status === dbStatus)
    const percent = Math.round((list.length / (totalInQueue || 1)) * 100) || 0
    return { list, percent }
  }

  return (
    <section className={`${styles.section} card flow-card`} aria-label="Appointment Status">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Daily Patient Flow</h2>
          <p className={styles.subtitle}>Queue: Upcoming → Waiting → Engaged → Completed</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.liveBadge}>
            <span className={styles.liveDot} />
            Live
          </span>
        </div>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {STATUS_CONFIG.map(config => {
          const { list, percent } = getStatusData(config.dbStatus)
          return (
            <div key={config.id} className={`${styles.block} ${styles[config.color + 'Block']}`}>
              <div className={styles.blockHeader}>
                <div className={`${styles.statusIcon} ${styles[config.color + 'Icon']}`}>
                  {config.icon}
                </div>
                <div className={styles.statusInfo}>
                  <p className={styles.statusName}>{config.label}</p>
                  <p className={styles.statusDesc}>{config.desc}</p>
                </div>
                <span className={`${styles.countBadge} ${styles[config.color + 'Badge']}`}>
                  {list.length}
                </span>
              </div>

              <div className={styles.progressWrap}>
                <div className={styles.progressMeta}>
                  <span>Progress</span>
                  <strong>{percent}%</strong>
                </div>
                <AnimatedBar percent={percent} color={config.color} />
              </div>

              {list.length > 0 ? (
                <div className={styles.patientList}>
                  {list.map(appt => (
                    <div
                      key={appt.id}
                      className={`${styles.patientChip} ${config.dbStatus !== 'Completed' ? styles.clickableChip : ''}`}
                      onClick={() => config.dbStatus !== 'Completed' && handleStatusChange(appt.id, config.dbStatus)}
                      title={
                        config.dbStatus === 'Scheduled' ? 'Click to move → Waiting' :
                          config.dbStatus === 'Waiting' ? 'Click to move → Engaged' :
                            config.dbStatus === 'Engaged' ? 'Click to mark → Completed' : ''
                      }
                    >
                      <span className={styles.avatarSm} style={{ background: '#f0f4f8', color: 'var(--slate-700)' }}>
                        {getInitials(appt.patient_name)}
                      </span>
                      <span style={{ fontSize: 13, flex: 1 }}>{appt.patient_name}</span>
                      {config.dbStatus === 'Scheduled' && (
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.5 }}>
                          <path d="M3 7h8M8 4l3 3-3 3" stroke="#00838F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {config.dbStatus === 'Waiting' && (
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.5 }}>
                          <path d="M3 7h8M8 4l3 3-3 3" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {config.dbStatus === 'Engaged' && (
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.5 }}>
                          <path d="M3 7h8M8 4l3 3-3 3" stroke="#4527a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {config.dbStatus === 'Completed' && (
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7l3.5 3.5L12 3" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No patients {config.label.toLowerCase()}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
