import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { usePatients } from '../context/PatientContext'
import AddPatient from './AddPatient'
import ClinicalNotesModal from './ClinicalNotesModal'
import TreatmentModal from './TreatmentModal'
import PrescriptionModal from './PrescriptionModal'
import PatientProfileView from './PatientProfileView'
import styles from './SearchPatient.module.css'
import Swal from 'sweetalert2'

const API_BASE = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' }
}

const AVATAR_COLORS = [
  { bg: '#e8f5e9', fg: '#4CAF50' }, { bg: '#e3f2fd', fg: '#1E88E5' },
  { bg: '#ede7f6', fg: '#7E57C2' }, { bg: '#fce4ec', fg: '#E91E63' },
  { bg: '#fff3e0', fg: '#F57C00' }, { bg: '#e0f7fa', fg: '#00838F' },
]
function avatarColor(idx) { return AVATAR_COLORS[idx % AVATAR_COLORS.length] }
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

function StatusTag({ s }) {
  const style = STATUS_PILL[s] || { bg: '#f0f4f8', color: '#5a6a7e' }
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700
    }}>{s}</span>
  )
}

// ────────────────────────────────────────────────────────────────────────────
export default function SearchPatient({ onAddNew, onNavigate, userRole }) {
  const { patients, fetchPatients, searchQuery, setSearchQuery, activePatient, setActivePatient } = usePatients()

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const searchInputRef = useRef(null)
  const [viewPatient, setViewPatient] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  // Auto-focus search on load
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus()
  }, [])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showNotes, setShowNotes] = useState(null)
  const [showTreatment, setShowTreatment] = useState(null)
  const [showPrescription, setShowPrescription] = useState(null)
  // Profile data from `/patient/{id}/profile/`
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [payOldAmount, setPayOldAmount] = useState('')

  // New appointment form inside profile
  const [doctors, setDoctors] = useState([])
  const [newAppt, setNewAppt] = useState({ doctor: '', date: '', time: '', status: 'Scheduled' })
  const [apptSaving, setApptSaving] = useState(false)

  // Bill form inside profile
  const [newBill, setNewBill] = useState({ total_amount: '', paid_amount: '', payment_method: 'Cash', visit_id: '' })
  const [billSaving, setBillSaving] = useState(false)
  /** Quick clinical bill from profile (optional outstanding balance rolled in). */
  const [quickBill, setQuickBill] = useState({
    description: 'Consultation / procedure',
    amount: '',
    paid: '',
    payment_method: 'Cash',
    includePrior: false,
  })

  // Quick Booking Modal
  const [bookingPatient, setBookingPatient] = useState(null)
  const [quickBooking, setQuickBooking] = useState({ doctor: '', date: new Date().toISOString().split('T')[0], time: '', status: 'Scheduled' })
  const [quickBookingSaving, setQuickBookingSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // ── Sync activePatient from context (navigation from Appointments page) ──
  useEffect(() => {
    if (activePatient) {
      openPatientProfile(activePatient)
    }
  }, [activePatient])

  // ── Load doctors once ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(setDoctors)
      .catch(console.error)
  }, [])

  // ── Open full profile ──────────────────────────────────────────────────────
  const openPatientProfile = useCallback(async (patient) => {
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
      if (res.ok) setProfile(await res.json())
    } catch (e) { console.error(e) }
  }, [viewPatient])

  const closeProfile = () => {
    setViewPatient(null)
    setProfile(null)
    setActivePatient(null)
    setShowNotes(null)
    setShowTreatment(false)
    setShowPrescription(null)
  }

  const openPrescription = (appt = null) => {
    setShowPrescription({
      appointmentId: appt?.id || null,
      clinicalNoteId: appt?.clinical_notes?.id || null
    })
  }

  const [historyTab, setHistoryTab] = useState('appointments')

  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('All')
  const [ledgerError, setLedgerError] = useState(null)

  const fetchLedger = async (patientId) => {
    setLoadingHistory(true)
    setLedgerError(null)
    try {
      const url = `${API_BASE}/billing/search/?patient_id=${encodeURIComponent(patientId)}`
      const res = await fetch(url, { headers: getHeaders() })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setHistory([])
        setLedgerError(data.error || data.detail || `Could not load ledger (HTTP ${res.status})`)
        return
      }
      const rows = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : Array.isArray(data?.data) ? data.data : [])
      setHistory(rows)
    } catch (err) {
      console.error(err)
      setHistory([])
      setLedgerError('Network error while loading billing history.')
    } finally {
      setLoadingHistory(false)
    }
  }

  // ── Clear Balance / Advance ──
  const handleClearBalance = async () => {
    const bal = parseFloat(profile?.total_balance || viewPatient.total_balance || 0);
    if (bal >= 0) return alert('No advance balance to clear.');

    const confirmClear_res = await Swal.fire({ title: `This patient has an advance of ₹${Math.abs(bal).toFixed(2)}. Do you want to settle this balance?`, icon: 'warning', showCancelButton: true });
    const confirmClear = confirmClear_res.isConfirmed;
    if (!confirmClear) return;

    try {
      // Create a balancing bill
      const resB = await fetch(`${API_BASE}/bill/create-advanced/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: viewPatient.id,
          total_amount: Math.abs(bal),
          paid_amount: 0,
          payment_method: 'Cash',
          items: [{ name: 'Balance Adjustment / Settlement', quantity: 1, unit_price: Math.abs(bal) }],
          notes: 'Manually cleared balance'
        })
      });
      if (resB.ok) {
        alert('Balance cleared successfully.');
        await refreshProfile();
        await fetchPatients(search);
      } else {
        alert('Failed to clear balance.');
      }
    } catch (e) {
      console.error(e);
      alert('Error clearing balance.');
    }
  }

  useEffect(() => {
    if (viewPatient && historyTab === 'ledger') {
      fetchLedger(viewPatient.id)
    }
  }, [viewPatient, historyTab])

  // Re-fetch patients when search or dateFilter changes
  useEffect(() => {
    fetchPatients(search, dateFilter)
  }, [search, dateFilter, fetchPatients])

  // ── Filtered patient table ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = patients || []
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
    // Ensure profile is closed first to avoid overlapping overlays
    setViewPatient(null)
    setBookingPatient(patient)
    setQuickBooking({
      doctor: doctors[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      status: 'Scheduled'
    })
  }
  const saveQuickBooking = async (e) => {
    e.preventDefault()
    if (!quickBooking.date) return Swal.fire('Error', 'Date is required', 'error')
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
          showConfirmButton: false
        })
        setBookingPatient(null)
        if (viewPatient?.id === bookingPatient.id) refreshProfile()
      } else {
        const err = await res.json()
        Swal.fire('Error', JSON.stringify(err), 'error')
      }
    } catch (e) { console.error(e) }
    setQuickBookingSaving(false)
  }

  // ── Save new appointment ──────────────────────────────────────────────────
  const handleSaveAppt = async (e) => {
    e.preventDefault()
    if (!newAppt.date) return Swal.fire('Error', 'Date is required', 'error')
    setApptSaving(true)
    try {
      const res = await fetch(`${API_BASE}/appointment/create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: viewPatient.id,
          doctor: newAppt.doctor || null,
          date: newAppt.date,
          time: newAppt.time || null,
          status: newAppt.status,
        }),
      })
      if (res.ok) {
        setNewAppt({ doctor: '', date: '', time: '', status: 'Scheduled' })
        Swal.fire({
          title: 'Success!',
          text: 'Appointment saved!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
        refreshProfile() // do this without awaiting so alert pops immediately
      } else {
        const err = await res.json()
        Swal.fire('Error', JSON.stringify(err), 'error')
      }
    } catch (e) { console.error(e) }
    setApptSaving(false)
  }

  // ── Quick Follow-up ───────────────────────────────────────────────────────
  const handleFollowUp = async () => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    try {
      const res = await fetch(`${API_BASE}/appointment/create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: viewPatient.id,
          doctor: doctors[0]?.id || null,
          date: nextWeek.toISOString().split('T')[0],
          time: '10:00:00',
          status: 'Scheduled',
        }),
      })
      if (res.ok) {
        Swal.fire({
          title: 'Success!',
          text: `Follow-up scheduled for ${nextWeek.toLocaleDateString()}`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
        refreshProfile() // background
      }
    } catch (e) { console.error(e) }
  }

  // ── Pay on existing bill ──────────────────────────────────────────────────
  const handlePayBill = async (billId, balance, recordType = 'Billing') => {
    const amount = prompt(`Enter amount to collect (Balance: ₹${balance}):`, balance)
    if (!amount || isNaN(amount)) return
    try {
      const res = await fetch(`${API_BASE}/payment/pay/${billId}/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount, type: recordType }),
      })
      if (res.ok) {
        await refreshProfile()
        await fetchPatients(search)
        if (viewPatient && historyTab === 'ledger') fetchLedger(viewPatient.id)
      }
    } catch (e) { console.error(e) }
  }

  // ── Create visit+bill directly ────────────────────────────────────────────
  const handleCreateBill = async (e) => {
    e.preventDefault()
    if (!newBill.total_amount) return alert('Total amount is required')
    setBillSaving(true)
    try {
      // Get or create visit for today
      const visitRes = await fetch(`${API_BASE}/visit/get-or-create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patient_id: viewPatient.id }),
      })
      const visitData = await visitRes.json()

      // Update payment
      const payRes = await fetch(`${API_BASE}/payment/pay/${visitData.payment_id}/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount: newBill.paid_amount || 0,
          total_amount: newBill.total_amount,
          payment_method: newBill.payment_method,
          type: 'Payment'
        }),
      })
      if (payRes.ok) {
        setNewBill({ total_amount: '', paid_amount: '', payment_method: 'Cash', visit_id: '' })
        await refreshProfile()
        await fetchPatients(search)
      }
    } catch (e) { console.error(e) }
    setBillSaving(false)
  }

  // ── Settle Old Balance ────────────────────────────────────────────────────
  const handleSettleOldBalance = async () => {
    const bal = parseFloat(profile?.total_balance || viewPatient.total_balance || 0);
    if (bal <= 0) return alert('No outstanding balance.');
    const amount = prompt(`Enter amount to settle (Outstanding: ₹${bal.toFixed(2)}):`, bal);
    if (!amount || isNaN(amount) || amount <= 0) return;

    try {
      const visitRes = await fetch(`${API_BASE}/visit/get-or-create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patient_id: viewPatient.id }),
      });
      const visitData = await visitRes.json();

      const resB = await fetch(`${API_BASE}/bill/create-advanced/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: viewPatient.id,
          visit: visitData.visit_id || visitData.id,
          total_amount: 0,
          paid_amount: parseFloat(amount),
          payment_method: 'Cash',
          items: [{ name: 'Old Balance Settlement', quantity: 1, unit_price: 0 }],
          notes: 'Settled from Profile'
        })
      });
      if (resB.ok) {
        alert('Old balance settled successfully.');
        await refreshProfile();
        await fetchPatients(search);
        if (historyTab === 'ledger' && viewPatient) fetchLedger(viewPatient.id)
      } else {
        alert('Failed to settle balance.')
      }
    } catch (e) {
      console.error(e);
      alert('Error settling balance.');
    }
  };

  const handleWaiveOutstanding = async () => {
    const bal = parseFloat(profile?.total_balance || viewPatient.total_balance || 0)
    if (bal <= 0) return alert('No outstanding balance to waive.')
    if (!window.confirm(`Remove (waive) the full outstanding balance of ₹${bal.toFixed(2)} from the ledger?`)) return
    try {
      const res = await fetch(`${API_BASE}/patient/${viewPatient.id}/balance/waiver/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || 'Could not waive balance.')
        return
      }
      alert(`Removed ₹${parseFloat(data.waived).toFixed(2)}. Remaining balance: ₹${parseFloat(data.total_balance).toFixed(2)}`)
      await refreshProfile()
      await fetchPatients(search)
      if (historyTab === 'ledger' && viewPatient) fetchLedger(viewPatient.id)
    } catch (e) {
      console.error(e)
      alert('Error waiving balance.')
    }
  }

  const handleQuickClinicalBill = async (e) => {
    e.preventDefault()
    const amt = parseFloat(quickBill.amount)
    if (!amt || amt <= 0) return alert('Enter the bill amount for this visit (new charges only).')
    const prior = Math.max(0, parseFloat(profile?.total_balance || 0) || 0)
    const include = quickBill.includePrior && prior > 0
    const lineTotal = amt + (include ? prior : 0)
    let paidIn = parseFloat(quickBill.paid)
    if (isNaN(paidIn) || paidIn < 0) paidIn = lineTotal
    if (paidIn > lineTotal) paidIn = lineTotal

    setBillSaving(true)
    try {
      const visitRes = await fetch(`${API_BASE}/visit/get-or-create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patient_id: viewPatient.id }),
      })
      const visitData = await visitRes.json()
      const visitId = visitData.visit_id || visitData.id

      const res = await fetch(`${API_BASE}/bill/create-advanced/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: viewPatient.id,
          visit: visitId,
          total_amount: amt,
          paid_amount: paidIn,
          payment_method: quickBill.payment_method,
          include_prior_balance: include,
          items: [
            {
              name: (quickBill.description || '').trim() || 'Clinical services',
              quantity: 1,
              unit_price: amt,
              fee_type: 'Treatment',
            },
          ],
          notes: 'Recorded from patient profile',
        }),
      })
      if (res.ok) {
        alert(include ? `Bill created with new charges ₹${amt.toFixed(2)} plus prior balance ₹${prior.toFixed(2)}.` : 'Bill recorded successfully.')
        setQuickBill({
          description: 'Consultation / procedure',
          amount: '',
          paid: '',
          payment_method: 'Cash',
          includePrior: false,
        })
        await refreshProfile()
        await fetchPatients(search)
        if (historyTab === 'ledger' && viewPatient) fetchLedger(viewPatient.id)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Could not create bill.')
      }
    } catch (e) {
      console.error(e)
      alert('Network error.')
    }
    setBillSaving(false)
  }

  // helpers
  const patientName = viewPatient ? (viewPatient.name || `${viewPatient.firstName || ''} ${viewPatient.lastName || ''}`.trim()) : ''
  const patientPhone = viewPatient?.phone || viewPatient?.mobile || ''

  // Computed billing totals from profile
  const billingTotals = useMemo(() => {
    const payments = profile?.payments || []
    return payments.reduce((acc, p) => ({
      total: acc.total + parseFloat(p.total_amount || 0),
      paid: acc.paid + parseFloat(p.paid_amount || 0),
      balance: acc.balance + parseFloat(p.balance_amount || 0),
    }), { total: 0, paid: 0, balance: 0 })
  }, [profile])

  const handleUpdatePatientDoctor = async (patientId, doctorId) => {
    try {
      const res = await fetch(`${API_BASE}/patient/${patientId}/profile/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ doctor: doctorId || null })
      })
      if (res.ok) {
        refreshProfile()
        fetchPatients()
      } else {
        alert('Failed to update patient doctor')
      }
    } catch (e) {
      console.error(e)
      alert('Error updating patient doctor')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── Full-page patient profile (replaces list view) ──
  if (viewPatient) {
    return (
      <PatientProfileView
        viewPatient={viewPatient}
        profile={profile}
        profileLoading={profileLoading}
        patientName={patientName}
        patientPhone={patientPhone}
        closeProfile={closeProfile}
        refreshProfile={refreshProfile}
        onNavigate={onNavigate}
        doctors={doctors}
        onUpdateDoctor={handleUpdatePatientDoctor}
        openPrescription={openPrescription}
      />
    )
  }

  return (
    <section className={styles.page} aria-label="Search Patient">

      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.pageTitle}>Patient Records</h2>
          <p className={styles.pageSub}>{filtered.length} patient{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className={styles.topRight}>
          <div className={styles.searchBox}>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              title="Filter by Appointment Date"
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                color: '#64748b', fontSize: 13, paddingRight: 8, marginRight: 8, borderRight: '1px solid #e2e8f0'
              }}
            />
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="#8fa0b4" strokeWidth="1.5" />
              <path d="M13.5 13.5L17 17" stroke="#8fa0b4" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              ref={searchInputRef}
              placeholder="Search by name, ID, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          <button className={styles.addBtn} onClick={() => setShowAdd(true)}>
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
              const name = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim()
              const balance = parseFloat(p.total_balance || 0)
              return (
                <tr key={p.id} className={styles.row} onClick={(e) => {
                  if (e.target.closest('button')) return;
                  openPatientProfile(p);
                }}>
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
                  <td>{p.phone || p.mobile}</td>
                  <td style={{ fontWeight: 700, color: balance > 0 ? '#dc2626' : (balance < 0 ? '#16a34a' : '#64748b') }}>
                    {balance > 0 ? `₹${balance.toFixed(2)}` : (balance < 0 ? `Cr: ₹${Math.abs(balance).toFixed(2)}` : 'Nil')}
                  </td>
                  <td>
                    <span className={`${styles.statusPill} ${p.status === 'Active' ? styles.active : styles.inactive}`}>
                      {p.status}
                    </span>
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
                        onClick={e => { e.stopPropagation(); openPatientProfile(p) }}
                        title="Consultation"
                      >
                        🩺 Consult
                      </button>
                    )}
                    <button
                      className={`${styles.iconBtn} ${styles.viewBtn}`}
                      onClick={e => { e.stopPropagation(); openPatientProfile(p) }}
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
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{bookingPatient.name || `${bookingPatient.firstName} ${bookingPatient.lastName}`}</p>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: parseFloat(bookingPatient.total_balance || 0) > 0 ? '#fee2e2' : '#f0fdf4',
                      color: parseFloat(bookingPatient.total_balance || 0) > 0 ? '#991b1b' : '#166534'
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
                <input type="date" required value={quickBooking.date} onChange={e => setQuickBooking(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className={styles.bookingField}>
                <label>Select Time</label>
                <input type="time" value={quickBooking.time} onChange={e => setQuickBooking(p => ({ ...p, time: e.target.value }))} />
              </div>
              <div className={styles.bookingField}>
                <label>Doctor</label>
                <select value={quickBooking.doctor} onChange={e => setQuickBooking(p => ({ ...p, doctor: e.target.value }))}>
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className={styles.bookingField}>
                <label>Status</label>
                <select value={quickBooking.status} onChange={e => setQuickBooking(p => ({ ...p, status: e.target.value }))}>
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
            setShowAdd(false);
            fetchPatients(search);
          }}
          currentUser={{ role: userRole }}
        />
      )}

    </section>
  );
}
