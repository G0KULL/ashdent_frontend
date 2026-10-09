import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './DoctorDashboard.module.css'

const API = 'http://127.0.0.1:8000/api'

export default function DoctorDashboard({ currentUser }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ todayAppointments: 0, waiting: 0, todayRevenue: 0, totalPatients: 0 })
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const doctorId = currentUser?.doctor_id
  const userId = currentUser?.id
  const username = currentUser?.username || ''

  useEffect(() => {
    if (!userId && !username) return
    fetchStats()
    fetchAppointments()
    // Auto-refresh every 30 seconds
    const iv = setInterval(() => { fetchStats(); fetchAppointments() }, 30000)
    return () => clearInterval(iv)
  }, [userId, username])


  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch appointments filtered by doctor
      const apptRes = await fetch(`${API}/appointments/all/?date=${today}`, {
        headers: { 'X-User-Id': userId, 'X-Username': username, 'X-User-Role': 'Doctor' }
      })
      const apptData = apptRes.ok ? await apptRes.json() : []
      const todayAppts = Array.isArray(apptData) ? apptData : []

      // Fetch patients (use search endpoint with empty query to get all)
      const patRes = await fetch(`${API}/patient/search/?q=`, {
        headers: { 'X-User-Id': userId, 'X-Username': username, 'X-User-Role': 'Doctor' }
      })
      const patData = patRes.ok ? await patRes.json() : []
      const patients = Array.isArray(patData) ? patData : (patData.results || [])

      // Fetch today's revenue from finance dashboard
      let todayRevenue = 0
      try {
        const finRes = await fetch(`${API}/finance/dashboard/?filter_type=today`, {
          headers: { 'X-User-Id': userId, 'X-Username': username, 'X-User-Role': 'Doctor' }
        })
        if (finRes.ok) {
          const finData = await finRes.json()
          todayRevenue = finData?.dailyIncome?.total || 0
        }
      } catch (e) {
        console.error('Revenue fetch error:', e)
      }

      setStats({
        todayAppointments: todayAppts.length,
        waiting: todayAppts.filter(a => a.status === 'Scheduled' || a.status === 'Waiting').length,
        todayRevenue,
        totalPatients: patients.length,
      })
    } catch (e) {
      console.error('Stats fetch error:', e)
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`${API}/appointments/all/?date=${today}`, {
        headers: { 'X-User-Id': userId, 'X-Username': username, 'X-User-Role': 'Doctor' }
      })
      const data = res.ok ? await res.json() : []
      setAppointments(Array.isArray(data) ? data.slice(0, 8) : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }



  const statusColor = (s) => {
    if (!s) return '#64748b'
    if (s === 'Completed') return '#10b981'
    if (s === 'Scheduled') return '#3b82f6'
    if (s === 'Waiting') return '#f59e0b'
    if (s === 'Cancelled') return '#ef4444'
    return '#64748b'
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Welcome Banner */}
      <div className={styles.welcomeSection}>
        <div>
          <h1>Welcome, Dr. {currentUser?.name || currentUser?.username || 'Doctor'} 👨‍⚕️</h1>
          <p>Here is your clinical overview for today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/doctor/appointments')}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(4px)' }}
          >
            📅 Today's Schedule
          </button>
          <button
            onClick={() => navigate('/doctor/doctor-slots')}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(4px)' }}
          >
            ⏰ Manage My Slots
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard} onClick={() => navigate('/doctor/appointments')} style={{ cursor: 'pointer' }}>
          <div className={styles.metricIcon} style={{ background: '#eff6ff' }}>📅</div>
          <div>
            <div className={styles.metricLabel}>Today's Appointments</div>
            <div className={styles.metricValue}>{stats.todayAppointments}</div>
          </div>
        </div>
        <div className={styles.metricCard} style={{ borderLeftColor: '#f59e0b', cursor: 'pointer' }} onClick={() => navigate('/doctor/today-patients')}>
          <div className={styles.metricIcon} style={{ background: '#fffbeb' }}>⏳</div>
          <div>
            <div className={styles.metricLabel}>Patients Waiting</div>
            <div className={styles.metricValue} style={{ color: '#f59e0b' }}>{stats.waiting}</div>
          </div>
        </div>
        <div className={styles.metricCard} style={{ borderLeftColor: '#10b981', cursor: 'pointer' }} onClick={() => navigate('/doctor/search-patient')}>
          <div className={styles.metricIcon} style={{ background: '#ecfdf5' }}>👥</div>
          <div>
            <div className={styles.metricLabel}>My Total Patients</div>
            <div className={styles.metricValue} style={{ color: '#10b981' }}>{stats.totalPatients}</div>
          </div>
        </div>
        <div className={styles.metricCard} style={{ borderLeftColor: '#8b5cf6', cursor: 'pointer' }} onClick={() => navigate('/doctor/reports')}>
          <div className={styles.metricIcon} style={{ background: '#f5f3ff' }}>💰</div>
          <div>
            <div className={styles.metricLabel}>Today's Revenue</div>
            <div className={styles.metricValue} style={{ color: '#8b5cf6' }}>₹{stats.todayRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Today's Appointments */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Today's Appointments</h3>
            <button onClick={() => navigate('/doctor/appointments')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>View All →</button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <p>No appointments scheduled for today</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {appointments.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'transparent', borderRadius: 10, borderLeft: `3px solid ${statusColor(a.status)}` }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--slate-900)', fontSize: 14 }}>{a.patient_name || a.patient || 'Patient'}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{a.time || a.appointment_time || '--:--'} · {a.treatment || a.treatment_type || 'Consultation'}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${statusColor(a.status)}20`, color: statusColor(a.status) }}>
                    {a.status || 'Scheduled'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Quick Actions</h3>
            </div>
            <div className={styles.actionGrid}>
              <button className={styles.actionButton} onClick={() => navigate('/consultation-cases/PATIENT-001')} style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>
                <span>🦷</span> Consultation Workspace
              </button>
              <button className={styles.actionButton} onClick={() => navigate('/doctor/income')} style={{ background: '#f5f3ff', borderColor: '#ddd6fe', color: '#6d28d9' }}>
                <span style={{ filter: 'grayscale(0)' }}>💰</span> My Revenue
              </button>
              <button className={styles.actionButton} onClick={() => navigate('/doctor/today-patients')}>
                <span>📋</span> Clinical Notes
              </button>
              <button className={styles.actionButton} onClick={() => navigate('/doctor/prescriptions')}>
                <span>💊</span> Write Rx
              </button>
              <button className={styles.actionButton} onClick={() => navigate('/doctor/search-patient')}>
                <span>🔍</span> Find Patient
              </button>
              <button className={styles.actionButton} onClick={() => navigate('/doctor/doctor-slots')}>
                <span>⏰</span> My Slots
              </button>
              <button className={styles.actionButton} onClick={() => navigate('/doctor/follow-ups')}>
                <span>🔁</span> Follow-ups
              </button>
              <button className={styles.actionButton} onClick={() => navigate('/doctor/reports')}>
                <span>📊</span> EHR Reports
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>My Access</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: '📅 Appointments (My Patients)', path: '/doctor/appointments' },
                { label: '👥 My Patient List', path: '/doctor/search-patient' },
                { label: '💰 My Revenue Records', path: '/doctor/income' },
                { label: '🔁 Follow-ups', path: '/doctor/follow-ups' },
                { label: '📋 Prescriptions', path: '/doctor/prescriptions' },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{ width: '100%', textAlign: 'left', padding: '9px 12px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500, transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe' }}
                  onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
