import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '../context/PatientContext'
import styles from './TodayPatients.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' }
}

const STATUS_STYLE = {
  Scheduled: { bg: '#e0f2fe', color: '#0284c7', border: '#bae6fd' },
  Completed: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
  Missed: { bg: '#fee2e2', color: '#ef4444', border: '#fecaca' },
  Rescheduled: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'Follow-up': { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' },
  Cancelled: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
  Waiting: { bg: '#fff7ed', color: '#ea580c', border: '#ffedd5' },
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_PALETTE = [
  { bg: '#e8f5e9', fg: '#2e7d32' },
  { bg: '#e3f2fd', fg: '#1565c0' },
  { bg: '#ede7f6', fg: '#4527a0' },
  { bg: '#fce4ec', fg: '#880e4f' },
  { bg: '#fff3e0', fg: '#e65100' },
  { bg: '#e0f7fa', fg: '#006064' },
]


// ── Reschedule Modal ─────────────────────────────────────────────────────────
function RescheduleModal({ appt, onConfirm, onCancel, onRefresh }) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const [date, setDate] = useState(tomorrowStr)
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('Scheduled')

  // New: Profile and History
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [activeTab, setActiveTab] = useState('notes') // notes | rx | treatments
  const [payAmount, setPayAmount] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/patient/${appt.patient}/profile/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setLoadingProfile(false)
      })
      .catch(e => {
        console.error(e)
        setLoadingProfile(false)
      })
  }, [appt.patient])

  const handlePayBalance = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return
    setPaying(true)
    try {
      const vRes = await fetch(`${API_BASE}/visit/get-or-create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patient_id: appt.patient, appointment_id: appt.id })
      })
      const vData = await vRes.json()

      const res = await fetch(`${API_BASE}/bill/create-advanced/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: appt.patient,
          visit: vData.visit_id || vData.id,
          total_amount: 0,
          paid_amount: parseFloat(payAmount),
          payment_method: 'Cash',
          items: [{ name: 'Balance Payment (Reschedule)', quantity: 1, unit_price: 0 }],
          notes: 'Paid during rescheduling'
        })
      })
      if (res.ok) {
        setPayAmount('')
        // Refresh profile
        const pRes = await fetch(`${API_BASE}/patient/${appt.patient}/profile/`, { headers: getHeaders() })
        setProfile(await pRes.json())
        if (onRefresh) onRefresh()
        alert('Payment recorded successfully!')
      }
    } catch (e) { console.error(e) }
    setPaying(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date) return
    setSaving(true)
    await onConfirm(appt, date, time, status)
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        background: 'var(--slate-100)', borderRadius: 20, padding: 0,
        width: 800, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18
          }}>🔄</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--slate-900)' }}>Reschedule Appointment</div>
            <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>{appt.patient_name}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ fontSize: 12, color: 'var(--slate-400)', display: 'block', marginBottom: 5, fontWeight: 600 }}>New Date *</label>
            <input type="date" required value={date} min={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13, boxSizing: 'border-box', background: 'var(--slate-200)' }} />
          </div>
          <div style={{ marginBottom: 15 }}>
            <label style={{ fontSize: 12, color: 'var(--slate-400)', display: 'block', marginBottom: 5, fontWeight: 600 }}>New Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13, boxSizing: 'border-box', background: 'var(--slate-200)' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 25 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px 0', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>{saving ? '...' : 'Confirm'}</button>
            <button type="button" onClick={onCancel} style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TodayPatients({ onNavigate, userRole }) {
  const { setActivePatient } = usePatients()
  const [allToday, setAllToday] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState(null)
  const [rescheduleAppt, setRescheduleAppt] = useState(null)
  const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA'))

  const fetchToday = useCallback(async () => {
    setLoading(true)
    try {
      const isToday = filterDate === new Date().toLocaleDateString('en-CA')
      const url = isToday ? `${API_BASE}/appointments/today/` : `${API_BASE}/appointments/all/?date=${filterDate}`
      const res = await fetch(url, { headers: getHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAllToday(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch today appointments:', err)
      setError('Could not reach server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [filterDate])

  useEffect(() => {
    fetchToday()
    const iv = setInterval(fetchToday, 10000)
    return () => clearInterval(iv)
  }, [fetchToday, filterDate])

  const handleStatusChange = async (appt, newStatus) => {
    if (newStatus === 'Rescheduled') {
      setRescheduleAppt(appt)
      return
    }
    setUpdatingId(appt.id)
    try {
      const res = await fetch(`${API_BASE}/appointments/${appt.id}/status/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setAllToday(prev => prev.map(a => a.id === appt.id ? { ...a, status: newStatus } : a))
      }
    } catch (err) {
      console.error('Status update failed:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const navigate = useNavigate()

  const startConsultation = (appt) => {
    setActivePatient({
      id: appt.patient,
      name: appt.patient_name,
      firstName: appt.patient_name?.split(' ')[0] || '',
      lastName: appt.patient_name?.split(' ').slice(1).join(' ') || '',
      mobile: appt.patient_phone,
      phone: appt.patient_phone,
      total_balance: appt.patient_balance,
      age: appt.patient_age,
      gender: appt.patient_gender,
    })
    if (onNavigate) {
      onNavigate('search-patient', { state: { initialTab: 'general' } })
    } else {
      const role = userRole?.toLowerCase() || 'doctor'
      navigate(`/${role}/search-patient`, { state: { initialTab: 'general' } })
    }
  }

  const handleRescheduleConfirm = async (appt, newDate, newTime, newStatus) => {
    try {
      await fetch(`${API_BASE}/appointments/${appt.id}/status/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          status: 'Rescheduled',
          rescheduled_to_date: newDate,
          rescheduled_to_time: newTime || null,
        }),
      })

      await fetch(`${API_BASE}/appointment/create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: appt.patient,
          doctor: appt.doctor || null,
          date: newDate,
          time: newTime || null,
          status: newStatus || 'Scheduled',
        }),
      })

      setAllToday(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'Rescheduled', rescheduled_to_date: newDate } : a))
      setRescheduleAppt(null)
      alert(`✅ ${appt.patient_name} rescheduled to ${newDate}${newTime ? ' at ' + newTime : ''}`)
    } catch (err) {
      console.error('Reschedule failed:', err)
    }
  }

  const counts = {
    total: allToday.length,
    Scheduled: allToday.filter(a => a.status === 'Scheduled').length,
    Completed: allToday.filter(a => a.status === 'Completed').length,
    Missed: allToday.filter(a => a.status === 'Missed').length,
    Rescheduled: allToday.filter(a => a.status === 'Rescheduled').length,
    Cancelled: allToday.filter(a => a.status === 'Cancelled').length,
  }

  return (
    <div className={styles.page}>
      {rescheduleAppt && (
        <RescheduleModal
          appt={rescheduleAppt}
          onConfirm={handleRescheduleConfirm}
          onCancel={() => setRescheduleAppt(null)}
        />
      )}

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{filterDate === new Date().toLocaleDateString('en-CA') ? "Today's Patients" : "Daily Patients"}</h1>
          <p className={styles.pageSub}>
            {new Date(filterDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)',
              fontSize: 13, fontWeight: 600, outline: 'none'
            }}
          />
          <button
            onClick={() => setFilterDate(new Date().toLocaleDateString('en-CA'))}
            style={{ background: 'transparent', color: 'var(--slate-900)', border: '1px solid var(--border-light)', padding: '10px 16px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            📅 Today
          </button>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={() => { setLoading(true); fetchToday() }}
          title="Refresh"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 12a8 8 0 0114.93-3M20 4v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
          padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Summary Counts ── */}
      <div className={styles.summaryRow}>
        {[
          { label: 'Total', count: counts.total, color: '#6366f1', icon: '📋' },
          { label: 'Scheduled', count: counts.Scheduled, color: '#0284c7', icon: '📅' },
          { label: 'Completed', count: counts.Completed, color: '#16a34a', icon: '✅' },
          { label: 'Missed', count: counts.Missed, color: '#ef4444', icon: '❌' },
          { label: 'Rescheduled', count: counts.Rescheduled, color: '#d97706', icon: '🔄' },
          { label: 'Cancelled', count: counts.Cancelled, color: '#64748b', icon: '🚫' },
        ].map(s => (
          <div key={s.label} className={styles.summaryCard}>
            <div className={styles.summaryIcon} style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div className={styles.summaryCount} style={{ color: s.color }}>{s.count}</div>
              <div className={styles.summaryLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading today's appointments…</p>
        </div>
      ) : allToday.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📅</div>
          <h3>No Appointments Today</h3>
          <p>You have no appointments scheduled for today.</p>
        </div>
      ) : (
        <div className={styles.patientList}>
          {/* List header */}
          <div className={styles.listHeader}>
            <div>#</div>
            <div>Patient</div>
            <div>Time</div>
            <div>Doctor</div>
            <div style={{ textAlign: 'center' }}>Status</div>
            <div>Balance</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {allToday.map((appt, idx) => {
            const av = AVATAR_PALETTE[idx % AVATAR_PALETTE.length]
            const statusStyle = STATUS_STYLE[appt.status] || { bg: '#f0f4f8', color: 'var(--slate-700)', border: '#e2e8f0' }
            const isUpdating = updatingId === appt.id

            return (
              <div
                key={appt.id}
                className={`${styles.patientRow} ${styles[appt.status?.toLowerCase()]}`}
                onClick={() => startConsultation(appt)}
                style={{ cursor: 'pointer' }}
              >
                {/* # */}
                <div className={styles.rowNum}>{idx + 1}</div>

                {/* Patient */}
                <div className={styles.patientCell}>
                  <div className={styles.avatar} style={{ background: av.bg, color: av.fg }}>
                    {getInitials(appt.patient_name)}
                  </div>
                  <div>
                    <div className={styles.patName}>{appt.patient_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className={styles.patPhone}>{appt.patient_phone}</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const phone = appt.patient_phone.replace(/\D/g, '');
                          const fullPhone = phone.length === 10 ? `91${phone}` : phone;
                          window.open(`https://wa.me/${fullPhone}`, '_blank');
                        }}
                        style={{
                          background: '#25D366',
                          border: 'none',
                          borderRadius: '50%',
                          width: 18,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Message on WhatsApp"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.895-5.335 11.895-11.893 0-3.176-1.237-6.164-3.483-8.411" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Time */}
                <div className={styles.timeCell}>{appt.time_formatted || appt.time || '—'}</div>

                {/* Doctor */}
                <div className={styles.doctorCell}>
                  {appt.doctor_color && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: appt.doctor_color, flexShrink: 0
                    }} />
                  )}
                  <span>{appt.doctor_name || '—'}</span>
                </div>

                {/* Status dropdown */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <select
                    value={appt.status}
                    disabled={isUpdating}
                    onChange={e => { e.stopPropagation(); handleStatusChange(appt, e.target.value) }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                      padding: '5px 10px',
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      outline: 'none',
                      opacity: isUpdating ? 0.6 : 1,
                    }}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Completed">Completed</option>
                    <option value="Missed">Missed</option>
                    <option value="Rescheduled">Rescheduled 🔄</option>
                    <option value="Cancelled">Cancelled 🚫</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>

                {/* Balance */}
                <div className={styles.balanceCell} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, color: parseFloat(appt.patient_balance) > 0 ? '#dc2626' : '#16a34a' }}>
                    ₹{Math.max(0, parseFloat(appt.patient_balance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  {!['Receptionist'].includes(userRole) && (
                    <button
                      className={`${styles.iconBtn} ${styles.consultBtn}`}
                      onClick={(e) => { e.stopPropagation(); startConsultation(appt) }}
                      style={{
                        background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                        color: '#fff', border: 'none',
                        padding: '5px 12px', borderRadius: 8,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                      }}
                    >
                      🩺 Consult
                    </button>
                  )}

                  {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                    <button
                      disabled={isUpdating}
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(appt, 'Completed') }}
                      style={{
                        background: '#e8f5e9', color: '#2e7d32',
                        border: 'none', padding: '5px 12px', borderRadius: 8,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      ✓ Done
                    </button>
                  )}

                  {appt.status !== 'Rescheduled' && appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                    <button
                      disabled={isUpdating}
                      onClick={(e) => { e.stopPropagation(); setRescheduleAppt(appt) }}
                      style={{
                        background: '#fffbeb', color: '#d97706',
                        border: '1px solid #fde68a', padding: '5px 10px', borderRadius: 8,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      🔄 Reschedule
                    </button>
                  )}
                  {appt.status === 'Completed' && (
                    <span style={{ fontSize: 18 }}>✅</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
