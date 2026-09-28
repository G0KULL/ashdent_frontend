import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '../context/PatientContext'
import styles from './FollowUps.module.css'

// Fallback dummy doctors if API fails
const DUMMY_DOCTORS = [
  { id: 'd1', name: 'Dr. Sarah Jenkins' },
  { id: 'd2', name: 'Dr. Navas Kp' },
  { id: 'd3', name: 'Dr. Smith' },
]

export default function FollowUps({ onNavigate }) {
  const { setActivePatient } = usePatients()
  const navigate = useNavigate()
  const [followUps, setFollowUps] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState(DUMMY_DOCTORS)
  const [changingDoctor, setChangingDoctor] = useState({}) // { [followUpId]: doctorId }
  const [expandedRow, setExpandedRow] = useState(null)

  const today = new Date().toISOString().split('T')[0]
  const [filters, setFilters] = useState({
    status: 'all',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    fetchFollowUps()
    // Load doctors
    fetch('http://127.0.0.1:8000/api/doctors/')
      .then(r => r.json())
      .then(data => { if (data?.length) setDoctors(data) })
      .catch(() => {}) // fallback stays as DUMMY_DOCTORS
  }, [search, filters])

  const fetchFollowUps = async () => {
    setLoading(true)
    try {
      const { status, start_date, end_date } = filters
      let url = `http://127.0.0.1:8000/api/follow-ups/?q=${search}&status=${status}`
      if (start_date) url += `&start_date=${start_date}`
      if (end_date) url += `&end_date=${end_date}`

      const res = await fetch(url)
      const data = await res.json()
      setFollowUps(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error fetching follow-ups:", err)
      setFollowUps([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id, payload) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/follow-ups/update/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setFollowUps(followUps.map(f => f.id === id ? { ...f, ...payload } : f))
        if (payload.follow_up_status && payload.follow_up_status !== filters.status && filters.status !== 'all') {
          setFollowUps(prev => prev.filter(f => f.id !== id))
        }
      }
    } catch (err) {
      console.error("Error updating follow-up:", err)
    }
  }

  const handleChangeDoctor = async (followUpId, doctorId) => {
    setChangingDoctor(prev => ({ ...prev, [followUpId]: doctorId }))
    try {
      // Try API first
      await fetch(`http://127.0.0.1:8000/api/follow-ups/update/${followUpId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor: doctorId })
      })
      const doctorName = doctors.find(d => String(d.id) === String(doctorId))?.name || ''
      setFollowUps(prev => prev.map(f => f.id === followUpId ? { ...f, doctor: doctorId, doctor_name: doctorName } : f))
    } catch (err) {
      console.error('Failed to change doctor:', err)
    }
  }

  const openPatient = (f) => {
    setActivePatient({ id: f.patient_id, name: f.patient_name, phone: f.patient_phone })
    if (onNavigate) onNavigate('search-patient')
  }

  const getStatusClass = (f) => {
    if (f.follow_up_status === 'Completed') return styles.completed
    if (f.follow_up_status === 'Missed') return styles.past
    const dateStr = f.follow_up_date
    const todayStr = new Date().toISOString().split('T')[0]
    if (dateStr === todayStr) return styles.today
    if (dateStr < todayStr) return styles.past
    return styles.upcoming
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              background: 'linear-gradient(135deg, rgba(219,39,119,0.15), rgba(168,85,247,0.15))',
              border: '1px solid rgba(219,39,119,0.35)',
              borderRadius: 8, color: '#f9a8d4', fontSize: 12,
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(219,39,119,0.35), rgba(168,85,247,0.3))'; e.currentTarget.style.color = '#fff' }}
            onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(219,39,119,0.15), rgba(168,85,247,0.15))'; e.currentTarget.style.color = '#f9a8d4' }}
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 9h2v9h5v-5h2v5h5V9h2L10 2z" fill="currentColor" />
            </svg>
            Home
          </button>
          <h2>Patient Follow-ups</h2>
        </div>
        <div className={styles.searchBar}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="7" />
            <path d="M14 14l4 4" />
          </svg>
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <label>From Date</label>
          <input
            type="date"
            className={styles.filterSelect}
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>To Date</label>
          <input
            type="date"
            className={styles.filterSelect}
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          />
        </div>
        <div className={styles.filterGroup} style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            className={styles.completeBtn}
            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', height: '35px', marginTop: '18px' }}
            onClick={() => setFilters({ ...filters, start_date: '', end_date: '' })}
          >
            All Dates
          </button>
          <button
            className={styles.completeBtn}
            style={{ background: '#3b82f6', color: '#ffffff', border: 'none', height: '35px', marginTop: '18px' }}
            onClick={() => setFilters({ ...filters, start_date: today, end_date: today })}
          >
            Today's Follow-ups
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>Loading...</div>
        ) : followUps.length === 0 ? (
          <div className={styles.empty}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No follow-ups found for these filters</p>
          </div>
        ) : (
          <table className={styles.table}>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Group & Balance</th>
                  <th>Follow-up Date</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
            <tbody>
              {followUps.map((f) => (
                <React.Fragment key={f.id}>
                  <tr>
                    <td>
                    <div className={styles.patientInfo}>
                      <span className={styles.patientName}>{f.patient_name}</span>
                      <span className={styles.patientPhone}>{f.patient_phone}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.patientInfo}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {(f.patient_groups && f.patient_groups.length > 0) ? f.patient_groups.join(', ') : 'General'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: parseFloat(f.patient_balance) > 0 ? '#dc2626' : '#16a34a' }}>
                        Bal: ₹{parseFloat(f.patient_balance || 0).toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={f.follow_up_date}
                      onChange={(e) => handleUpdate(f.id, { follow_up_date: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={changingDoctor[f.id] || f.doctor || ''}
                      onChange={(e) => handleChangeDoctor(f.id, e.target.value)}
                      style={{
                        padding: '5px 8px', borderRadius: 8, border: '1.5px solid var(--border-light)',
                        fontSize: 12, fontWeight: 600, color: 'var(--slate-800)', outline: 'none',
                        background: 'transparent', cursor: 'pointer', width: '100%'
                      }}
                    >
                      <option value="">— Unassigned —</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className={`${styles.filterSelect} ${styles.status} ${getStatusClass(f)}`}
                      style={{ border: 'none', fontWeight: 700, padding: '4px 8px' }}
                      value={f.follow_up_status}
                      onChange={(e) => handleUpdate(f.id, { follow_up_status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Missed">Missed</option>
                    </select>
                  </td>
                  <td>
                    <div className={styles.note} title={f.follow_up_note}>
                      {f.follow_up_note || 'No note'}
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionRow}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openPatient(f)}
                        style={{ background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                      >
                        Profile
                      </button>
                      {parseFloat(f.patient_balance) > 0 && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => {
                            setActivePatient({ id: f.patient_id, name: f.patient_name, phone: f.patient_phone })
                            if (onNavigate) onNavigate('billing')
                          }}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                        >
                          Pay
                        </button>
                      )}
                      <button
                        className={styles.actionBtn}
                        onClick={() => setExpandedRow(expandedRow === f.id ? null : f.id)}
                        style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                      >
                        {expandedRow === f.id ? 'Hide Details' : 'Past Details'}
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => {
                          const msg = encodeURIComponent(`Hi ${f.patient_name}, this is a follow-up reminder for your dental visit. How are you feeling today?`)
                          window.open(`https://wa.me/91${f.patient_phone}?text=${msg}`, '_blank')
                        }}
                        style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                      >
                        WhatsApp
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === f.id && (
                  <tr key={`${f.id}-expanded`}>
                    <td colSpan="7" style={{ padding: 0 }}>
                      <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#0f172a', textTransform: 'uppercase' }}>Previous Visit Details</h4>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Last Visit Date</div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{f.last_visit_date ? new Date(f.last_visit_date).toLocaleDateString() : 'N/A'}</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Clinical Notes & Findings</div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#334155', whiteSpace: 'pre-wrap' }}>{f.last_clinical_notes || 'No clinical notes recorded.'}</div>
                          </div>
                          {(f.last_treatments && f.last_treatments.length > 0) && (
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Treatments Done</div>
                              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                                {f.last_treatments.map((t, idx) => (
                                  <li key={idx}>{t}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
