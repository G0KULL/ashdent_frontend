import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '../context/PatientContext'
import AddPatient from './AddPatient'
import ClinicalNotesModal from './ClinicalNotesModal'
import PrescriptionModal from './PrescriptionModal'
import PatientProfileView from './PatientProfileView'
import styles from './SearchPatient.module.css'
import Swal from 'sweetalert2'
import { API_BASE, getHeaders } from '../utils/api'

const AVATAR_COLORS = [
  { bg: '#e8f5e9', fg: '#4CAF50' },
  { bg: '#e3f2fd', fg: '#1E88E5' },
  { bg: '#ede7f6', fg: '#7E57C2' },
  { bg: '#fce4ec', fg: '#E91E63' },
  { bg: '#fff3e0', fg: '#F57C00' },
  { bg: '#e0f7fa', fg: '#00838F' },
]

function avatarColor(idx) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length]
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const STATUS_PILL = {
  Scheduled: { bg: '#e3f2fd', color: '#1565c0' },
  Waiting: { bg: '#fff8e1', color: '#f57f17' },
  Engaged: { bg: '#ede7f6', color: '#4527a0' },
  Completed: { bg: '#e8f5e9', color: '#2e7d32' },
  Missed: { bg: '#fce4ec', color: '#b71c1c' },
  Upcoming: { bg: '#e0f7fa', color: '#006064' },
}

export default function SearchPatient({ onAddNew, onNavigate, userRole }) {
  const navigate = useNavigate()
  const { patients, fetchPatients, searchQuery, setSearchQuery, activePatient, setActivePatient } = usePatients()

  // Fallback router navigation for sub-components
  const handleNavigate = useCallback((path, opts) => {
    if (onNavigate) {
      onNavigate(path, opts)
    } else {
      const role = userRole ? userRole.toLowerCase() : 'admin'
      const target = path.startsWith('/') ? path : `/${role}/${path}`
      navigate(target, opts)
    }
  }, [onNavigate, navigate, userRole])

  const [search, setSearch] = useState(searchQuery || '')
  const [dateFilter, setDateFilter] = useState('')
  const searchInputRef = useRef(null)
  const [viewPatient, setViewPatient] = useState(null)
  const [profileInitialTab, setProfileInitialTab] = useState('overview')
  const [showAdd, setShowAdd] = useState(false)

  // Modals overlay
  const [showNotes, setShowNotes] = useState(null)
  const [showPrescription, setShowPrescription] = useState(null)

  // Profile data from `/patient/{id}/profile/`
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Doctors list for booking and assignments
  const [doctors, setDoctors] = useState([])

  // Quick Booking Modal state
  const [bookingPatient, setBookingPatient] = useState(null)
  const [quickBooking, setQuickBooking] = useState({
    doctor: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'Scheduled',
  })
  const [quickBookingSaving, setQuickBookingSaving] = useState(false)

  // Auto-focus search on load
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus()
  }, [])

  // Sync searchQuery from context (e.g. from Topbar)
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== search) {
      setSearch(searchQuery)
    }
  }, [searchQuery])

  const handleSearchChange = (val) => {
    setSearch(val)
    if (setSearchQuery) {
      setSearchQuery(val)
    }
  }

  const handleClearSearch = () => {
    setSearch('')
    if (setSearchQuery) {
      setSearchQuery('')
    }
  }

  // ── Sync activePatient from context (navigation from Appointments or TodayPatients) ──
  useEffect(() => {
    if (activePatient) {
      openPatientProfile(activePatient)
    }
  }, [activePatient])

  // ── Load doctors once ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => setDoctors(Array.isArray(data) ? data : (data?.results || [])))
      .catch(console.error)
  }, [])

  // ── Open full profile ──────────────────────────────────────────────────────
  const openPatientProfile = useCallback(async (patient, initialTab = 'overview') => {
    setProfileInitialTab(initialTab)
    setViewPatient(patient)
    setProfile(null)
    setProfileLoading(true)
    try {
      const res = await fetch(`${API_BASE}/patient/${patient.id}/profile/`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (e) {
      console.error('Failed to load profile:', e)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!viewPatient) return
    try {
      const res = await fetch(`${API_BASE}/patient/${viewPatient.id}/profile/`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (e) {
      console.error(e)
    }
  }, [viewPatient])

  const closeProfile = () => {
    setViewPatient(null)
    setProfile(null)
    setActivePatient(null)
    setShowNotes(null)
    setShowPrescription(null)
    setProfileInitialTab('overview')
  }

  const openPrescription = (appt = null) => {
    setShowPrescription({
      appointmentId: appt?.id || null,
      clinicalNoteId: appt?.clinical_notes?.id || null,
    })
  }

  // Re-fetch patients when search or dateFilter changes
  useEffect(() => {
    fetchPatients(search, dateFilter)
  }, [search, dateFilter, fetchPatients])

  // ── Filtered patient table ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const list = patients || []
    const q = (search || searchQuery || '').toLowerCase().trim()
    if (!q) return list
    return list.filter(p => {
      const name = (p.name || `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase()
      const phone = (p.phone || p.mobile || '').toLowerCase()
      const id = String(p.id || '')
      return name.includes(q) || phone.includes(q) || id.includes(q)
    })
  }, [patients, search, searchQuery])

  // ── Quick Booking Handlers ────────────────────────────────────────────────
  const handleQuickBook = (patient) => {
    setViewPatient(null)
    setBookingPatient(patient)
    setQuickBooking({
      doctor: patient?.doctor || '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      status: 'Scheduled',
    })
  }

  const saveQuickBooking = async (e) => {
    e.preventDefault()
    if (!quickBooking.date) return Swal.fire('Error', 'Date is required', 'error')
    if (!quickBooking.doctor) return Swal.fire('Doctor Required', 'Please select an assigned doctor for the appointment.', 'warning')
    setQuickBookingSaving(true)
    try {
      const res = await fetch(`${API_BASE}/appointment/create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: bookingPatient.id,
          doctor: quickBooking.doctor || null,
          date: quickBooking.date,
          time: quickBooking.time ? quickBooking.time + ':00' : null,
          status: quickBooking.status,
        }),
      })
      if (res.ok) {
        Swal.fire({
          title: 'Success!',
          text: 'Appointment booked successfully!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        })
        setBookingPatient(null)
        if (viewPatient?.id === bookingPatient.id) refreshProfile()
        fetchPatients(search, dateFilter)
      } else {
        const err = await res.json()
        Swal.fire('Error', JSON.stringify(err), 'error')
      }
    } catch (e) {
      console.error(e)
    }
    setQuickBookingSaving(false)
  }

  const handleUpdatePatientDoctor = async (patientId, doctorId) => {
    try {
      const res = await fetch(`${API_BASE}/patient/${patientId}/profile/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ doctor: doctorId || null }),
      })
      if (res.ok) {
        refreshProfile()
        fetchPatients(search, dateFilter)
      } else {
        alert('Failed to update patient doctor')
      }
    } catch (e) {
      console.error(e)
      alert('Error updating patient doctor')
    }
  }

  // Helpers
  const patientName = viewPatient ? (viewPatient.name || `${viewPatient.firstName || ''} ${viewPatient.lastName || ''}`.trim()) : ''
  const patientPhone = viewPatient?.phone || viewPatient?.mobile || ''

  // ─────────────────────────────────────────────────────────────────────────
  // ── Full-page patient profile (replaces list view) ──
  if (viewPatient) {
    return (
      <>
        <PatientProfileView
          viewPatient={viewPatient}
          profile={profile}
          profileLoading={profileLoading}
          patientName={patientName}
          patientPhone={patientPhone}
          closeProfile={closeProfile}
          refreshProfile={refreshProfile}
          onNavigate={handleNavigate}
          doctors={doctors}
          onUpdateDoctor={handleUpdatePatientDoctor}
          openPrescription={openPrescription}
          initialTab={profileInitialTab}
        />

        {showPrescription && (
          <PrescriptionModal
            patientId={viewPatient.id}
            patientName={patientName}
            patientPhone={patientPhone}
            appointmentId={showPrescription.appointmentId}
            clinicalNoteId={showPrescription.clinicalNoteId}
            onClose={() => setShowPrescription(null)}
            onNavigate={handleNavigate}
          />
        )}

        {showNotes && (
          <ClinicalNotesModal
            appointmentId={showNotes === 'new' ? null : showNotes}
            patientId={viewPatient.id}
            patientName={patientName}
            onClose={() => {
              setShowNotes(null)
              refreshProfile()
            }}
          />
        )}
      </>
    )
  }

  return (
    <section className={styles.page} aria-label="Search Patient">
      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.pageTitle}>Patient Records</h2>
          <p className={styles.pageSub}>
            {filtered.length} patient{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className={styles.topRight}>
          <div className={styles.searchBox}>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              title="Filter by Appointment Date"
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: '#64748b',
                fontSize: 13,
                paddingRight: 8,
                marginRight: 8,
                borderRight: '1px solid #e2e8f0',
              }}
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                title="Clear date filter"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: 12,
                  marginRight: 8,
                }}
              >
                ✕
              </button>
            )}
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="#8fa0b4" strokeWidth="1.5" />
              <path d="M13.5 13.5L17 17" stroke="#8fa0b4" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              ref={searchInputRef}
              placeholder="Search by name, ID, phone…"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
            {search && (
              <button className={styles.clearSearch} onClick={handleClearSearch}>✕</button>
            )}
          </div>
          <button
            className={styles.addBtn}
            onClick={() => (onAddNew ? onAddNew() : setShowAdd(true))}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add New
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age / Gender</th>
              <th>Phone</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const av = avatarColor(i)
              const name = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unnamed Patient'
              const balance = parseFloat(p.total_balance || 0)
              return (
                <tr
                  key={p.id}
                  className={styles.row}
                  onClick={(e) => {
                    if (e.target.closest('button')) return
                    openPatientProfile(p, 'overview')
                  }}
                >
                  <td>
                    <div className={styles.patientCell}>
                      <span className={styles.avatar} style={{ background: av.bg, color: av.fg }}>
                        {getInitials(name)}
                      </span>
                      <div>
                        <p className={styles.patName}>{name}</p>
                        <p className={styles.patId}>ID: {p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>{p.age || '—'} yrs · {p.gender || '—'}</td>
                  <td>{p.phone || p.mobile || '—'}</td>
                  <td style={{ fontWeight: 700, color: balance > 0 ? '#dc2626' : (balance < 0 ? '#16a34a' : '#64748b') }}>
                    {balance > 0 ? `₹${balance.toFixed(2)}` : (balance < 0 ? `Cr: ₹${Math.abs(balance).toFixed(2)}` : 'Nil')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className={`${styles.statusPill} ${p.status === 'Active' ? styles.active : styles.inactive}`}>
                        {p.status}
                      </span>
                      {p.last_appointment?.date && (
                        <span style={{ fontSize: 10, color: '#64748b' }}>
                          Appt: {p.last_appointment.date}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={styles.actionCell}>
                    <button
                      className={`${styles.iconBtn} ${styles.bookBtn}`}
                      onClick={e => { e.stopPropagation(); handleQuickBook(p) }}
                      title="Quick Book"
                    >
                      📅 Book
                    </button>
                    {!['Receptionist'].includes(userRole) && (
                      <button
                        className={`${styles.iconBtn} ${styles.consultBtn}`}
                        onClick={e => { e.stopPropagation(); openPatientProfile(p, 'clinical notes') }}
                        title="Consultation & Clinical Notes"
                      >
                        🩺 Consult
                      </button>
                    )}
                    <button
                      className={`${styles.iconBtn} ${styles.viewBtn}`}
                      onClick={e => { e.stopPropagation(); openPatientProfile(p, 'overview') }}
                      title="Full Profile"
                    >
                      👤 Profile
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            <p>No patients found.</p>
            <small>Try a different search or add a new patient.</small>
          </div>
        )}
      </div>

      {/* Quick Booking Modal (Independent of Profile) */}
      {bookingPatient && (
        <div className={styles.viewOverlay} style={{ zIndex: 2000 }} onClick={() => setBookingPatient(null)}>
          <div className={styles.bookingSmallCard} onClick={e => e.stopPropagation()}>
            <div className={styles.bookingHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className={styles.bookingIcon}>📅</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Book Appointment</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                      {bookingPatient.name || `${bookingPatient.firstName} ${bookingPatient.lastName}`}
                    </p>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: parseFloat(bookingPatient.total_balance || 0) > 0 ? '#fee2e2' : '#f0fdf4',
                      color: parseFloat(bookingPatient.total_balance || 0) > 0 ? '#991b1b' : '#166534',
                    }}>
                      Balance: ₹{parseFloat(bookingPatient.total_balance || 0).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
              <button className={styles.viewClose} onClick={() => setBookingPatient(null)}>✕</button>
            </div>
            <form onSubmit={saveQuickBooking} className={styles.bookingForm}>
              <div className={styles.bookingField}>
                <label>Select Date</label>
                <input
                  type="date"
                  required
                  value={quickBooking.date}
                  onChange={e => setQuickBooking(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className={styles.bookingField}>
                <label>Select Time</label>
                <input
                  type="time"
                  value={quickBooking.time}
                  onChange={e => setQuickBooking(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <div className={styles.bookingField}>
                <label>Doctor</label>
                <select
                  value={quickBooking.doctor}
                  onChange={e => setQuickBooking(prev => ({ ...prev, doctor: e.target.value }))}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className={styles.bookingField}>
                <label>Status</label>
                <select
                  value={quickBooking.status}
                  onChange={e => setQuickBooking(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
              </div>
              <button type="submit" disabled={quickBookingSaving} className={styles.bookingSubmit}>
                {quickBookingSaving ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Render AddPatient Modal */}
      {showAdd && (
        <AddPatient
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false)
            fetchPatients(search, dateFilter)
          }}
          currentUser={{ role: userRole }}
        />
      )}
    </section>
  )
}
