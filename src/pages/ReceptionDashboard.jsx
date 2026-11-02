import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://127.0.0.1:8000/api'

/* ── helpers ── */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function toLocalISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/* ── mini calendar ── */
function MiniCalendar({ appointmentDates = {}, onDateSelect, selectedDate }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const todayStr = toLocalISO(today)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button
          onClick={prevMonth}
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
            color: '#a855f7', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.2)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.1)' }}
        >‹</button>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--slate-900)' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
            color: '#a855f7', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.2)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.1)' }}
        >›</button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#64748b', padding: '2px 0', letterSpacing: 0.4 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const hasAppts = appointmentDates[dateStr] > 0
          const apptCount = appointmentDates[dateStr] || 0

          return (
            <button
              key={day}
              title={hasAppts ? `${apptCount} appointment${apptCount > 1 ? 's' : ''}` : ''}
              onClick={() => onDateSelect(dateStr)}
              style={{
                position: 'relative',
                width: '100%', aspectRatio: '1', borderRadius: 8,
                border: isSelected
                  ? '2px solid #a855f7'
                  : isToday
                    ? '2px solid rgba(168,85,247,0.4)'
                    : '2px solid transparent',
                background: isSelected
                  ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                  : isToday
                    ? 'rgba(168,85,247,0.12)'
                    : hasAppts
                      ? 'rgba(236,72,153,0.08)'
                      : 'transparent',
                color: isSelected ? '#fff' : isToday ? '#a855f7' : 'var(--slate-900)',
                fontSize: 12, fontWeight: isToday || isSelected ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                boxShadow: isSelected ? '0 4px 12px rgba(168,85,247,0.35)' : 'none',
              }}
              onMouseOver={e => {
                if (!isSelected) e.currentTarget.style.background = 'rgba(168,85,247,0.15)'
              }}
              onMouseOut={e => {
                if (!isSelected) {
                  e.currentTarget.style.background = isToday
                    ? 'rgba(168,85,247,0.12)'
                    : hasAppts ? 'rgba(236,72,153,0.08)' : 'transparent'
                }
              }}
            >
              <span>{day}</span>
              {hasAppts && (
                <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: isSelected ? 'rgba(255,255,255,0.8)' : '#ec4899',
                  flexShrink: 0,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── status helpers ── */
const statusColor = (s) => {
  if (s === 'Completed') return '#10b981'
  if (s === 'Scheduled') return '#3b82f6'
  if (s === 'Waiting') return '#f59e0b'
  if (s === 'Cancelled') return '#ef4444'
  if (s === 'Missed') return '#94a3b8'
  return '#64748b'
}

const genderIcon = (g) => {
  if (!g) return '👤'
  const lower = g.toLowerCase()
  if (lower === 'male' || lower === 'm') return '👨'
  if (lower === 'female' || lower === 'f') return '👩'
  return '👤'
}

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#a855f7,#7c3aed)',
  'linear-gradient(135deg,#ec4899,#be185d)',
  'linear-gradient(135deg,#0ea5e9,#0284c7)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
]
function avatarColor(name = '') {
  let h = 0
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

/* ══════════════════════════════════════════════════════ */
export default function ReceptionDashboard({ currentUser }) {
  const navigate = useNavigate()

  const [stats, setStats] = useState({ totalPatients: 0, todayAppointments: 0, pending: 0, prebookings: 0 })
  const [appointments, setAppointments] = useState([])
  const [recentPatients, setRecentPatients] = useState([])
  const [appointmentDates, setAppointmentDates] = useState({})
  const [selectedDate, setSelectedDate] = useState(toLocalISO(new Date()))
  const [selectedDateAppts, setSelectedDateAppts] = useState([])
  const [calLoading, setCalLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [patientsLoading, setPatientsLoading] = useState(true)

  const userId = currentUser?.id || ''
  const username = currentUser?.username || ''

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-User-Id': userId,
    'X-Username': username,
  })

  /* ── fetch stats ── */
  const fetchStats = useCallback(async () => {
    try {
      const today = toLocalISO(new Date())
      const [patRes, apptRes, prebookRes] = await Promise.all([
        fetch(`${API}/patient/search/`, { headers: getHeaders() }),
        fetch(`${API}/appointments/all/?date=${today}`, { headers: getHeaders() }),
        fetch(`${API}/pre-bookings/`, { headers: getHeaders() }).catch(() => ({ ok: false })),
      ])
      const patients = patRes.ok ? await patRes.json() : []
      const appts = apptRes.ok ? await apptRes.json() : []
      const prebooks = prebookRes.ok ? await prebookRes.json() : []
      const allPatients = Array.isArray(patients) ? patients : (patients.results || [])
      const allAppts = Array.isArray(appts) ? appts : []
      setStats({
        totalPatients: allPatients.length,
        todayAppointments: allAppts.length,
        pending: allAppts.filter(a => a.status === 'Scheduled' || a.status === 'Waiting').length,
        prebookings: Array.isArray(prebooks) ? prebooks.length : 0,
      })
    } catch (e) { console.error(e) }
  }, [userId, username])

  /* ── fetch today's appointment queue ── */
  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const today = toLocalISO(new Date())
      const res = await fetch(`${API}/appointments/all/?date=${today}`, { headers: getHeaders() })
      const data = res.ok ? await res.json() : []
      setAppointments(Array.isArray(data) ? data.slice(0, 8) : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [userId, username])

  /* ── fetch recent patients ── */
  const fetchRecentPatients = useCallback(async () => {
    setPatientsLoading(true)
    try {
      const res = await fetch(`${API}/patient/search/`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        const all = Array.isArray(data) ? data : (data.results || [])
        // Sort by created_at descending, take first 8
        const sorted = [...all].sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at) : new Date(0)
          const db = b.created_at ? new Date(b.created_at) : new Date(0)
          return db - da
        })
        setRecentPatients(sorted.slice(0, 8))
      }
    } catch (e) { console.error(e) }
    setPatientsLoading(false)
  }, [userId, username])

  /* ── fetch appointments for a specific date (calendar) ── */
  const fetchDateAppointments = useCallback(async (dateStr) => {
    setCalLoading(true)
    try {
      const res = await fetch(`${API}/appointments/all/?date=${dateStr}`, { headers: getHeaders() })
      const data = res.ok ? await res.json() : []
      setSelectedDateAppts(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    setCalLoading(false)
  }, [userId, username])

  /* ── fetch appointment counts for current month (for calendar dots) ── */
  const fetchMonthlyAppointmentCounts = useCallback(async () => {
    try {
      // Fetch all appointments (we can't filter by month on this endpoint, so we use all)
      const res = await fetch(`${API}/appointments/all/`, { headers: getHeaders() })
      if (!res.ok) return
      const data = await res.json()
      const all = Array.isArray(data) ? data : []
      const counts = {}
      for (const a of all) {
        const d = a.date || a.appointment_date
        if (d) counts[d] = (counts[d] || 0) + 1
      }
      setAppointmentDates(counts)
    } catch (e) { console.error(e) }
  }, [userId, username])

  useEffect(() => {
    fetchStats()
    fetchAppointments()
    fetchRecentPatients()
    fetchMonthlyAppointmentCounts()
    fetchDateAppointments(selectedDate)

    const iv = setInterval(() => {
      fetchStats()
      fetchAppointments()
    }, 30000)
    return () => clearInterval(iv)
  }, [])

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr)
    fetchDateAppointments(dateStr)
  }

  const today = toLocalISO(new Date())
  const selectedIsToday = selectedDate === today

  /* ─────────────────────────────────────── JSX ─────────────────────────────────────── */
  return (
    <div style={{ padding: 24, maxWidth: 1500, margin: '0 auto' }}>

      {/* ── Welcome Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #be185d 0%, #db2777 60%, #ec4899 100%)',
        color: 'white', padding: '28px 32px', borderRadius: 18,
        marginBottom: 24, boxShadow: '0 8px 32px rgba(219,39,119,0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: 26, fontWeight: 700 }}>
            Front Desk Portal 💁‍♀️
          </h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>
            Hello {currentUser?.name || 'Receptionist'} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/receptionist/search-patient')}
          style={{
            padding: '10px 20px', background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8,
            color: 'white', fontWeight: 600, cursor: 'pointer',
          }}
        >
          ➕ Register New Patient
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: "Today's Appointments", value: stats.todayAppointments, icon: '📅', color: '#db2777', bg: '#fdf2f8', path: '/receptionist/appointments' },
          { label: 'Pending / Waiting', value: stats.pending, icon: '⏳', color: '#f59e0b', bg: '#fffbeb', path: '/receptionist/today-patients' },
          { label: 'Total Patients', value: stats.totalPatients, icon: '👥', color: '#8b5cf6', bg: '#f5f3ff', path: '/receptionist/search-patient' },
          { label: 'Pre-Bookings', value: stats.prebookings, icon: '📞', color: '#0891b2', bg: '#ecfeff', path: '/receptionist/pre-bookings' },
        ].map(card => (
          <div
            key={card.label}
            onClick={() => navigate(card.path)}
            style={{
              background: 'rgba(255, 255, 255, 0.03)', padding: 20, borderRadius: 14,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${card.color}`, display: 'flex', alignItems: 'center', gap: 16,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: card.color, lineHeight: 1.2 }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main 3-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Column 1: Today's Queue ── */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--slate-900)' }}>Today's Appointment Queue</h3>
            <button onClick={() => navigate('/receptionist/appointments')} style={{ background: 'none', border: 'none', color: '#db2777', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              View All →
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading...</div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <p>No appointments for today</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {appointments.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px', borderRadius: 10, background: 'transparent',
                    borderLeft: `3px solid ${statusColor(a.status)}`,
                    transition: 'background 0.15s', cursor: 'default',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: avatarColor(a.patient_name || a.patient || ''),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff',
                    }}>
                      {getInitials(a.patient_name || a.patient || '')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)', fontSize: 13 }}>
                        {a.patient_name || a.patient || 'Patient'}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                        {a.time || a.appointment_time || '--:--'} · Dr. {a.doctor_name || a.doctor || 'Assigned'}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: `${statusColor(a.status)}20`, color: statusColor(a.status), whiteSpace: 'nowrap',
                  }}>
                    {a.status || 'Scheduled'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Column 2: Calendar + Calendar Day Appointments ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Calendar Widget */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 18 }}>📆</span>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--slate-900)' }}>Appointment Calendar</h3>
            </div>
            <MiniCalendar
              appointmentDates={appointmentDates}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          </div>

          {/* Selected Date Appointments */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--slate-900)' }}>
                {selectedIsToday ? "Today's" : new Date(selectedDate + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} Appointments
              </h3>
              <span style={{
                padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: 'rgba(168,85,247,0.15)', color: '#a855f7',
              }}>
                {calLoading ? '...' : selectedDateAppts.length}
              </span>
            </div>
            {calLoading ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
            ) : selectedDateAppts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#64748b', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>📭</div>
                No appointments on this date
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {selectedDateAppts.map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                    borderLeft: `3px solid ${statusColor(a.status)}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-900)' }}>
                        {a.patient_name || a.patient || 'Patient'}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                        {a.time || a.appointment_time || '--:--'} · Dr. {a.doctor_name || a.doctor || '—'}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                      background: `${statusColor(a.status)}20`, color: statusColor(a.status), whiteSpace: 'nowrap',
                    }}>
                      {a.status || 'Scheduled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Column 3: Recent Patients + Quick Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Recent Patients */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🕐</span>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--slate-900)' }}>Recent Patients</h3>
              </div>
              <button
                onClick={() => navigate('/receptionist/search-patient')}
                style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
              >
                View All →
              </button>
            </div>
            {patientsLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
            ) : recentPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>👤</div>
                No patients yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentPatients.map((p, i) => (
                  <div
                    key={p.id || i}
                    onClick={() => navigate(`/receptionist/search-patient`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                      borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: avatarColor(p.name || ''),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>
                      {getInitials(p.name || '')}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                        {p.phone || '—'} · {p.gender || '—'}{p.age ? ` · ${p.age}y` : ''}
                      </div>
                    </div>
                    {/* Balance badge */}
                    {p.total_balance > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#ef4444',
                        background: 'rgba(239,68,68,0.12)', borderRadius: 6, padding: '2px 6px', whiteSpace: 'nowrap',
                      }}>
                        ₹{p.total_balance}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 20 }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 600, color: 'var(--slate-900)', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: '➕', label: 'Add Patient', path: '/receptionist/search-patient' },
                { icon: '📅', label: 'Book Appt', path: '/receptionist/appointments' },
                { icon: '💳', label: 'Billing', path: '/receptionist/billing' },
                { icon: '🔁', label: 'Follow-ups', path: '/receptionist/follow-ups' },
                { icon: '📞', label: 'Pre-bookings', path: '/receptionist/pre-bookings' },
                { icon: '👥', label: 'All Patients', path: '/receptionist/search-patient' },
              ].map(btn => (
                <button
                  key={btn.path + btn.label}
                  onClick={() => navigate(btn.path)}
                  style={{
                    padding: '11px 8px', background: '#fdf2f8', border: '1px solid #fbcfe8',
                    borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontWeight: 600,
                    fontSize: 12, color: '#be185d', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 5, transition: 'all 0.2s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#fce7f3'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={e => { e.currentTarget.style.background = '#fdf2f8'; e.currentTarget.style.transform = 'none' }}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>{/* end main grid */}
    </div>
  )
}
