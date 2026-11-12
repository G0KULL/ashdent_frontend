import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePatients } from '../context/PatientContext'
import { useBranch } from '../context/BranchContext'
import { getHeaders, API_BASE } from '../utils/api'
import styles from './Appointments.module.css'

const STATUS_STYLE = {
  Scheduled: { bg: '#e0f2fe', color: '#0284c7', border: '#bae6fd' },
  Completed: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
  Missed: { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
  Rescheduled: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'Follow-up': { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' },
  Cancelled: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
  Waiting: { bg: '#fff7ed', color: '#ea580c', border: '#ffedd5' },
  Engaged: { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' },
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

export default function Appointments({ onNavigate, userRole }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setActivePatient } = usePatients()
  const { activeBranch } = useBranch()

  // Read doctor_id from URL query if navigated from Doctor Performance
  const urlDoctorId = new URLSearchParams(location.search).get('doctor_id') || ''

  // Primary Appointment Data
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [doctorFilter, setDoctorFilter] = useState(urlDoctorId)
  const [statusFilter, setStatusFilter] = useState('')
  const [visitTypeFilter, setVisitTypeFilter] = useState('')

  useEffect(() => {
    const docId = new URLSearchParams(location.search).get('doctor_id')
    if (docId) {
      setDoctorFilter(docId)
    }
  }, [location.search])

  // Booking Modal State
  const [showBooking, setShowBooking] = useState(false)
  const [patientQuery, setPatientQuery] = useState('')
  const [matchedPatients, setMatchedPatients] = useState([])
  const [bookingData, setBookingData] = useState({
    patientId: '',
    patientName: '',
    doctor: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    endTime: '',
    status: 'Scheduled',
    isVirtual: false,
    consultationFee: ''
  })
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [activeHistoryTab, setActiveHistoryTab] = useState('notes') // notes | rx | treatments
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState('Consultation Fee')
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState(false)

  // Edit Appointment Modal State
  const [editingAppt, setEditingAppt] = useState(null)
  const [editForm, setEditForm] = useState({ doctor: '', date: '', time: '', status: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  // Available Slots state for Booking Modal
  const [candidateSlots, setCandidateSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [leaveAlert, setLeaveAlert] = useState(null)

  // Available Slots state for Rescheduling Modal
  const [editCandidateSlots, setEditCandidateSlots] = useState([])
  const [loadingEditSlots, setLoadingEditSlots] = useState(false)
  const [editLeaveAlert, setEditLeaveAlert] = useState(null)

  // Treatment Case Sheet Modal
  const [showCaseSheetModal, setShowCaseSheetModal] = useState(false)
  const [targetAppt, setTargetAppt] = useState(null)
  const [checkingCaseSheet, setCheckingCaseSheet] = useState(false)

  // Fetch slots for Booking Modal
  useEffect(() => {
    if (!bookingData.doctor || !bookingData.date) {
      setCandidateSlots([])
      setLeaveAlert(null)
      return
    }
    setLoadingSlots(true)
    const branchParam = activeBranch?.id ? `&branch_id=${activeBranch.id}` : ''
    fetch(`${API_BASE}/doctors/${bookingData.doctor}/available-slots/?date=${bookingData.date}${branchParam}`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.is_on_leave) {
          setLeaveAlert(data.leave_reason || 'Doctor is on approved leave')
          setCandidateSlots([])
          setBookingData(prev => ({ ...prev, time: '', endTime: '' }))
        } else {
          setLeaveAlert(null)
          const slots = data.slots || []
          setCandidateSlots(slots)
          setBookingData(prev => {
            if (prev.time && !slots.some(s => s.time === prev.time && s.is_available)) {
              return { ...prev, time: '', endTime: '' }
            }
            return prev
          })
        }
      })
      .catch(err => {
        console.error(err)
        setCandidateSlots([])
      })
      .finally(() => setLoadingSlots(false))
  }, [bookingData.doctor, bookingData.date, activeBranch?.id])

  // Fetch slots for Edit/Reschedule Modal
  useEffect(() => {
    if (!editForm.doctor || !editForm.date) {
      setEditCandidateSlots([])
      setEditLeaveAlert(null)
      return
    }
    setLoadingEditSlots(true)
    const branchParam = activeBranch?.id ? `&branch_id=${activeBranch.id}` : ''
    const excludeParam = editingAppt?.id ? `&exclude_appointment_id=${editingAppt.id}` : ''
    fetch(`${API_BASE}/doctors/${editForm.doctor}/available-slots/?date=${editForm.date}${branchParam}${excludeParam}`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.is_on_leave) {
          setEditLeaveAlert(data.leave_reason || 'Doctor is on approved leave')
          setEditCandidateSlots([])
          setEditForm(prev => ({ ...prev, time: '' }))
        } else {
          setEditLeaveAlert(null)
          setEditCandidateSlots(data.slots || [])
        }
      })
      .catch(err => {
        console.error(err)
        setEditCandidateSlots([])
      })
      .finally(() => setLoadingEditSlots(false))
  }, [editForm.doctor, editForm.date, activeBranch?.id, editingAppt?.id])

  // Fetch Appointments
  const fetchAppointments = useCallback(async (selectedDate) => {
    setLoading(true)
    try {
      const branchParam = activeBranch?.id ? `&branch_id=${activeBranch.id}` : ''
      const res = await fetch(`${API_BASE}/appointments/all/?date=${selectedDate}${branchParam}`, { headers: getHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAppointments(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch appointments:', err)
      setError('Failed to load appointments. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [activeBranch?.id])

  useEffect(() => {
    fetchAppointments(date)
    fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(setDoctors)
      .catch(console.error)
  }, [date, fetchAppointments, activeBranch?.id])

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    setDate(d.toISOString().split('T')[0])
  }

  const handleToday = () => {
    setDate(new Date().toISOString().split('T')[0])
  }

  // Clear Filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setDoctorFilter('')
    setStatusFilter('')
    setVisitTypeFilter('')
  }

  const isFilterActive = searchQuery || doctorFilter || statusFilter || visitTypeFilter

  // Filtered Appointments
  const filteredAppointments = appointments.filter(appt => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = appt.patient_name?.toLowerCase().includes(q)
      const matchPhone = appt.patient_phone?.includes(q)
      const matchId = String(appt.patient || '').includes(q)
      if (!matchName && !matchPhone && !matchId) return false
    }
    if (doctorFilter && String(appt.doctor) !== String(doctorFilter)) return false
    if (statusFilter && appt.status !== statusFilter) return false
    if (visitTypeFilter) {
      if (visitTypeFilter === 'Telemedicine' && !appt.is_virtual) return false
      if (visitTypeFilter === 'In-Office' && appt.is_virtual) return false
    }
    return true
  })

  // Patient search for booking
  useEffect(() => {
    if (patientQuery.length > 1) {
      fetch(`${API_BASE}/patient/search/?q=${encodeURIComponent(patientQuery)}`, { headers: getHeaders() })
        .then(r => r.json())
        .then(setMatchedPatients)
        .catch(console.error)
    } else {
      setMatchedPatients([])
    }
  }, [patientQuery])

  const handleSaveBooking = async (e) => {
    e.preventDefault()
    if (!bookingData.patientId || !bookingData.doctor || !bookingData.date || !bookingData.time) {
      return alert('Please select a patient, doctor, appointment date, and an available time slot.')
    }
    setSaving(true)

    let meetingLink = null
    if (bookingData.isVirtual) {
      const uniqueId = Math.random().toString(36).substring(2, 11)
      meetingLink = `https://meet.jit.si/AshDent_Consultation_${uniqueId}`
    }

    try {
      const res = await fetch(`${API_BASE}/appointment/create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: bookingData.patientId,
          doctor: bookingData.doctor || null,
          branch: activeBranch?.id || null,
          date: bookingData.date,
          time: bookingData.time + ':00',
          status: bookingData.status,
          is_virtual: bookingData.isVirtual,
          meeting_link: meetingLink,
        }),
      })
      if (res.ok) {
        if (bookingData.consultationFee && parseFloat(bookingData.consultationFee) > 0) {
          try {
            const vRes = await fetch(`${API_BASE}/visit/get-or-create/`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({ patient_id: bookingData.patientId })
            })
            const vData = await vRes.json()
            await fetch(`${API_BASE}/bill/create-advanced/`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({
                patient: bookingData.patientId,
                visit: vData.visit_id || vData.id,
                total_amount: parseFloat(bookingData.consultationFee),
                paid_amount: parseFloat(bookingData.consultationFee),
                payment_method: 'Cash',
                items: [{ name: 'Consultation Fee', quantity: 1, unit_price: parseFloat(bookingData.consultationFee) }],
                notes: 'Consultation fee paid during booking'
              })
            })
          } catch (feeErr) {
            console.error('Error recording consultation fee:', feeErr)
          }
        }

        setShowBooking(false)
        setBookingData({ ...bookingData, patientId: '', patientName: '', isVirtual: false, consultationFee: '', time: '', endTime: '' })
        setSelectedProfile(null)
        setPatientQuery('')
        fetchAppointments(date)
        alert('Appointment booked successfully!')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to book appointment. Please select an available slot.')
      }
    } catch (e) {
      console.error(e)
      alert('Network error while booking appointment.')
    }
    setSaving(false)
  }

  const handlePayOldBalance = async () => {
    if (!selectedProfile || !paymentAmount || parseFloat(paymentAmount) <= 0) return
    setPaying(true)
    try {
      const vRes = await fetch(`${API_BASE}/visit/get-or-create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patient_id: selectedProfile.patient.id })
      })
      const vData = await vRes.json()

      const res = await fetch(`${API_BASE}/bill/create-advanced/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: selectedProfile.patient.id,
          visit: vData.visit_id || vData.id,
          total_amount: paymentType === 'Consultation Fee' ? parseFloat(paymentAmount) : 0,
          paid_amount: parseFloat(paymentAmount),
          payment_method: 'Cash',
          is_draft: paymentType === 'Consultation Fee',
          items: [{ name: paymentType, quantity: 1, unit_price: paymentType === 'Consultation Fee' ? parseFloat(paymentAmount) : 0 }],
          notes: 'Paid during booking'
        })
      })
      if (res.ok) {
        alert('Payment recorded!')
        setPaymentAmount('')
        const pRes = await fetch(`${API_BASE}/patient/${selectedProfile.patient.id}/profile/`, { headers: getHeaders() })
        if (pRes.ok) setSelectedProfile(await pRes.json())
        fetchAppointments(date)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Could not record payment')
      }
    } catch (e) { console.error(e) }
    setPaying(false)
  }

  const handleSelectPatient = async (p) => {
    setBookingData(prev => ({ ...prev, patientId: p.id, patientName: p.name }))
    setPatientQuery('')
    setMatchedPatients([])
    try {
      const res = await fetch(`${API_BASE}/patient/${p.id}/profile/`, { headers: getHeaders() })
      if (res.ok) {
        setSelectedProfile(await res.json())
      }
    } catch (e) { console.error(e) }
  }

  // Status & Edit Handlers
  const handleUpdateStatus = async (apptId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${apptId}/status/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchAppointments(date)
      } else {
        alert('Failed to update status')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating status')
    }
  }

  const handleOpenEditModal = (appt) => {
    setEditingAppt(appt)
    setEditForm({
      doctor: appt.doctor || '',
      date: appt.date || date,
      time: appt.time ? appt.time.slice(0, 5) : '10:00',
      status: appt.status || 'Scheduled'
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingAppt) return
    setSavingEdit(true)
    try {
      const res = await fetch(`${API_BASE}/appointments/${editingAppt.id}/status/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          doctor: editForm.doctor || null,
          date: editForm.date,
          time: editForm.time + ':00',
          status: editForm.status
        })
      })
      if (res.ok) {
        setEditingAppt(null)
        fetchAppointments(date)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to update appointment details')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving changes')
    }
    setSavingEdit(false)
  }

  // Consultation flow
  const startConsultation = async (appt) => {
    setActivePatient({
      id: appt.patient,
      name: appt.patient_name,
      phone: appt.patient_phone,
      total_balance: appt.patient_balance,
      age: appt.patient_age,
      gender: appt.patient_gender,
      doctor: appt.doctor,
      doctorId: appt.doctor,
      doctor_name: appt.doctor_name,
      doctorName: appt.doctor_name,
      appointmentId: appt.id,
    })

    if (appt.visit_type === 'Follow-up' || appt.status === 'Follow-up') {
      const role = userRole?.toLowerCase() || 'doctor'
      const docObj = doctors.find(d => String(d.id) === String(appt.doctor))
      const docId = appt.doctor || docObj?.id || null
      const docName = appt.doctor_name || docObj?.name || 'Doctor not assigned'
      navigate(`/${role}/treatment-plans/${appt.patient}`, {
        state: {
          appointmentId: appt.id,
          patientId: appt.patient,
          patientName: appt.patient_name,
          patientPhone: appt.patient_phone,
          patientAge: appt.patient_age,
          patientGender: appt.patient_gender,
          doctorId: docId,
          doctorName: docName,
          appointmentDate: appt.date,
          appointmentTime: appt.time_formatted || appt.time,
          defaultFilter: 'In Progress'
        }
      })
      return
    }

    setCheckingCaseSheet(true)
    try {
      const profileRes = await fetch(`${API_BASE}/patient/${appt.patient}/profile/`, { headers: getHeaders() })
      if (profileRes.ok) {
        const profile = await profileRes.json()
        const appointmentsWithNotes = profile?.appointments?.filter(a => a.clinical_notes) || []

        let activeCase = null
        for (const a of appointmentsWithNotes) {
          if (a.clinical_notes?.treatment_plan) {
            try {
              const plan = JSON.parse(a.clinical_notes.treatment_plan)
              const hasActiveStatus = plan?.caseDetails?.status === 'In Progress' || plan?.caseDetails?.status === 'Open'
              const hasActiveTreatments = plan?.plannedTreatments && plan.plannedTreatments.some(t => t.status === 'Planned' || t.status === 'Started')

              if (hasActiveStatus || hasActiveTreatments) {
                activeCase = {
                  caseNumber: plan?.caseDetails?.caseNumber || `CS-${a.id}`,
                  doctor: a.doctor_name || appt.doctor_name || 'Doctor not assigned',
                  createdDate: plan?.caseDetails?.createdDate || new Date(a.date).toLocaleDateString(),
                  lastVisit: new Date(a.date).toLocaleDateString(),
                  currentTreatment: plan?.caseDetails?.currentTreatment || plan?.plannedTreatments?.[0]?.procedure || 'General Consultation',
                  visitsCompleted: plan?.caseDetails?.visitsCompleted || appointmentsWithNotes.length,
                  status: plan?.caseDetails?.status || 'In Progress',
                  appointmentId: a.id
                }
                break
              }
            } catch (e) {
              console.error('Error parsing treatment plan JSON:', e)
            }
          }
        }

        if (activeCase) {
          setTargetAppt({
            ...appt,
            activeCase: activeCase
          })
          setShowCaseSheetModal(true)
        } else {
          navigateToConsultation(appt, true)
        }
      } else {
        navigateToConsultation(appt, true)
      }
    } catch (e) {
      console.error(e)
      navigateToConsultation(appt, true)
    } finally {
      setCheckingCaseSheet(false)
    }
  }

  const navigateToConsultation = (appt, isNewCase = false, autoGenerateCase = false) => {
    const role = userRole?.toLowerCase() || 'doctor'
    const docObj = doctors.find(d => String(d.id) === String(appt.doctor))
    const docId = appt.doctor || docObj?.id || null
    const docName = appt.doctor_name || docObj?.name || 'Doctor not assigned'

    if (isNewCase) {
      navigate(`/${role}/create-case/${appt.patient}`, {
        state: {
          appointmentId: appt.id,
          patientId: appt.patient,
          patientName: appt.patient_name,
          patientPhone: appt.patient_phone,
          patientAge: appt.patient_age,
          patientGender: appt.patient_gender,
          doctorId: docId,
          doctorName: docName,
          appointmentDate: appt.date,
          appointmentTime: appt.time_formatted || appt.time,
          isNewCase: isNewCase,
          autoGenerateCase: autoGenerateCase
        }
      })
    } else {
      const caseId = targetAppt?.activeCase?.caseNumber || 'DEFAULT_CASE'
      navigate(`/${role}/case-sheet/${caseId}`, {
        state: {
          appointmentId: appt.id,
          patientId: appt.patient,
          doctorId: docId,
          doctorName: docName
        }
      })
    }

    setShowCaseSheetModal(false)
  }

  return (
    <div className={styles.appointmentsContainer}>
      {/* ── Page Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Appointments</h1>
          <p className={styles.subtitle}>Manage and track all patient appointments</p>
        </div>

        <div className={styles.headerActions}>
          {/* Compact Date Navigation Bar */}
          <div className={styles.dateControlGroup}>
            <button className={styles.navBtn} onClick={handlePrevDay} title="Previous Day">‹</button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.dateInput}
            />
            <button className={styles.todayBtn} onClick={handleToday}>Today</button>
            <button className={styles.navBtn} onClick={handleNextDay} title="Next Day">›</button>
          </div>

          <button className={styles.refreshBtn} onClick={() => fetchAppointments(date)}>
            ↻ Refresh
          </button>

          <button
            className={styles.bookBtn}
            onClick={() => {
              setShowBooking(!showBooking)
              if (!showBooking) setSelectedProfile(null)
            }}
          >
            {showBooking ? '✕ Close Form' : '+ Book New Appointment'}
          </button>
        </div>
      </div>

      {/* ── Booking Form / Drawer ── */}
      {showBooking && (
        <div style={{
          background: '#ffffff', padding: 28, borderRadius: 16, marginBottom: 24,
          border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
          display: 'grid', gridTemplateColumns: selectedProfile ? '1fr 1fr' : '1fr', gap: 28
        }}>
          <div>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              {selectedProfile ? 'Booking for ' + selectedProfile.patient.name : 'Schedule New Appointment'}
            </h3>
            <form onSubmit={handleSaveBooking} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Patient Search</label>
                <input
                  placeholder="Search patient name / phone..."
                  value={bookingData.patientName || patientQuery}
                  onChange={e => {
                    setPatientQuery(e.target.value)
                    if (bookingData.patientId) setBookingData(p => ({ ...p, patientId: '', patientName: '' }))
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 13, outline: 'none' }}
                />
                {matchedPatients.length > 0 && !bookingData.patientId && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, marginTop: 4,
                    maxHeight: 200, overflowY: 'auto', boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }}>
                    {matchedPatients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#0f172a' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ color: '#64748b', fontSize: 11 }}>{p.phone} · Balance: ₹{p.total_balance}</div>
                      </div>
                    ))}
                    <div
                      onClick={() => onNavigate && onNavigate('add-patient')}
                      style={{ padding: '10px 14px', cursor: 'pointer', background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: 12, textAlign: 'center' }}
                    >
                      + Create New Patient
                    </div>
                  </div>
                )}
              </div>

              {selectedProfile && (
                <div style={{
                  gridColumn: '1 / -1',
                  background: parseFloat(selectedProfile.patient?.total_balance || selectedProfile.total_balance || 0) > 0 ? '#fffbebf0' : '#f0fdf4',
                  border: `1px solid ${parseFloat(selectedProfile.patient?.total_balance || selectedProfile.total_balance || 0) > 0 ? '#fde68a' : '#bbf7d0'}`,
                  borderRadius: 12, padding: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Account balance (re-appointment)</p>
                      <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: parseFloat(selectedProfile.patient?.total_balance || selectedProfile.total_balance || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                        ₹{parseFloat(selectedProfile.patient?.total_balance ?? selectedProfile.total_balance ?? 0).toFixed(2)}
                      </p>
                      {parseFloat(selectedProfile.patient?.total_balance || selectedProfile.total_balance || 0) <= 0 && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#16a34a' }}>No dues on file for clinical billing.</p>
                      )}
                    </div>
                    {parseFloat(selectedProfile.patient?.total_balance || selectedProfile.total_balance || 0) > 0 && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="number"
                          placeholder="Amt to pay"
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                          style={{ width: 100, padding: '8px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 13 }}
                        />
                        <button
                          type="button"
                          onClick={handlePayOldBalance}
                          disabled={paying || !paymentAmount}
                          style={{ background: '#d97706', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          {paying ? '...' : 'Pay'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Doctor</label>
                <select
                  value={bookingData.doctor}
                  onChange={e => setBookingData(p => ({ ...p, doctor: e.target.value, time: '', endTime: '' }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 13 }}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Appointment Date</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={e => setBookingData(p => ({ ...p, date: e.target.value, time: '', endTime: '' }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>
                  Available Candidate Slots {bookingData.time ? (
                    <span style={{ color: '#4f46e5', fontWeight: 800 }}>({bookingData.time}{bookingData.endTime ? ` - ${bookingData.endTime}` : ''})</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontWeight: 500 }}>(Select an available slot below)</span>
                  )}
                </label>
                {loadingSlots ? (
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0' }}>Loading candidate slots...</p>
                ) : leaveAlert ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 8, color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
                    ⚠️ Doctor is on approved leave ({leaveAlert}) on this date.
                  </div>
                ) : !bookingData.doctor ? (
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0', fontStyle: 'italic' }}>Please select a doctor to view candidate slots.</p>
                ) : candidateSlots.length === 0 ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: 8, color: '#92400e', fontSize: 13 }}>
                    ℹ️ No slots available for the selected doctor on this date.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 150, overflowY: 'auto', padding: 4 }}>
                    {candidateSlots.map((slot, sIdx) => {
                      const isSelected = bookingData.time === slot.time
                      if (!slot.is_available) {
                        return (
                          <div
                            key={sIdx}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 8,
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              color: '#94a3b8',
                              fontSize: 12,
                              cursor: 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title={slot.is_blocked ? 'Blocked Period' : 'Already Booked'}
                          >
                            <span>{slot.time}{slot.end_time ? ` - ${slot.end_time}` : ''}</span>
                            <span style={{ fontSize: 10, background: '#e2e8f0', padding: '1px 4px', borderRadius: 4 }}>
                              {slot.status || 'Booked'}
                            </span>
                          </div>
                        )
                      }
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => setBookingData(p => ({ ...p, time: slot.time, endTime: slot.end_time }))}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: isSelected ? '2px solid #4f46e5' : '1px solid #a7f3d0',
                            background: isSelected ? '#4f46e5' : '#ecfdf5',
                            color: isSelected ? '#ffffff' : '#065f46',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {slot.time}{slot.end_time ? ` - ${slot.end_time}` : ''}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Consultation Fee (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={bookingData.consultationFee}
                  onChange={e => setBookingData(p => ({ ...p, consultationFee: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: 13 }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                <input
                  type="checkbox"
                  id="isVirtual"
                  checked={bookingData.isVirtual}
                  onChange={e => setBookingData(p => ({ ...p, isVirtual: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="isVirtual" style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                  📹 Telemedicine / Virtual Consultation
                </label>
              </div>
              <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={saving || !bookingData.patientId || !bookingData.doctor || !bookingData.date || !bookingData.time}
                  style={{
                    width: '100%', padding: '12px', background: '#4f46e5', color: 'white',
                    border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    opacity: (saving || !bookingData.patientId || !bookingData.doctor || !bookingData.date || !bookingData.time) ? 0.6 : 1
                  }}
                >
                  {saving ? 'Booking...' : '✨ Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>

          {selectedProfile && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                {[
                  { id: 'notes', label: 'Notes', icon: '📝' },
                  { id: 'rx', label: 'Rx', icon: '💊' },
                  { id: 'treatments', label: 'Treatments', icon: '🦷' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveHistoryTab(t.id)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      background: activeHistoryTab === t.id ? '#4f46e5' : '#f1f5f9',
                      color: activeHistoryTab === t.id ? '#fff' : '#64748b'
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div style={{
                flex: 1, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0',
                padding: 16, maxHeight: 350, overflowY: 'auto'
              }}>
                {activeHistoryTab === 'notes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedProfile.appointments?.filter(a => a.clinical_notes).length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 20 }}>No clinical history</p>
                    ) : (
                      selectedProfile.appointments.filter(a => a.clinical_notes)
                        .slice(-3).reverse()
                        .map(a => (
                        <div key={a.id} style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5' }}>{new Date(a.date).toLocaleDateString()}</span>
                            <span style={{ fontSize: 10, color: '#64748b' }}>{a.doctor_name}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{a.clinical_notes.diagnosis?.join(', ')}</p>
                          {a.clinical_notes.notes && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>"{a.clinical_notes.notes}"</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeHistoryTab === 'rx' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedProfile.prescriptions?.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 20 }}>No prescriptions</p>
                    ) : (
                      selectedProfile.prescriptions
                        .slice(-3).reverse()
                        .map(p => (
                        <div key={p.id} style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', marginBottom: 4 }}>{new Date(p.created_at).toLocaleDateString()}</div>
                          {p.items.map((it, i) => (
                            <div key={i} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.medicine_name || it.name || 'Medicine'}</span>
                              <span style={{ color: '#64748b', fontSize: 11 }}>{it.dosage} · {it.duration}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeHistoryTab === 'treatments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedProfile.payments?.filter(p => p.items?.length > 0).length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 20 }}>No treatment records</p>
                    ) : (
                      selectedProfile.payments.filter(p => p.items?.length > 0)
                        .slice(-3).reverse()
                        .map(p => (
                        <div key={p.id} style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', marginBottom: 4 }}>{new Date(p.created_at).toLocaleDateString()}</div>
                          {p.items.map((it, i) => (
                            <div key={i} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.treatment_name || 'Treatment'}</span>
                              <span style={{ fontWeight: 700, color: '#16a34a' }}>₹{it.price}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup} style={{ flex: 1.5 }}>
          <label className={styles.filterLabel}>Search Patient</label>
          <input
            type="text"
            placeholder="Search by name / UHID / phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Appointment Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Doctor</label>
          <select
            value={doctorFilter}
            onChange={e => setDoctorFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Waiting">Waiting</option>
            <option value="Engaged">Engaged</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Visit Type</label>
          <select
            value={visitTypeFilter}
            onChange={e => setVisitTypeFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Visit Types</option>
            <option value="In-Office">In-Office</option>
            <option value="Telemedicine">Telemedicine</option>
          </select>
        </div>

        {isFilterActive && (
          <button className={styles.clearFilterBtn} onClick={handleClearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Main Appointment Table ── */}
      <div className={styles.tableCard}>
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: 16, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className={styles.loadingState}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading appointments for {date}...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <h3 className={styles.emptyTitle}>
              {isFilterActive ? 'No Matching Appointments' : 'No Appointments Found'}
            </h3>
            <p className={styles.emptySubtitle}>
              {isFilterActive
                ? 'No appointments match your current search and filter criteria.'
                : `There are no appointments scheduled for ${date}.`}
            </p>
            {isFilterActive ? (
              <button className={styles.todayBtn} onClick={handleClearFilters}>
                Clear Filters
              </button>
            ) : (
              <button className={styles.bookBtn} onClick={() => setShowBooking(true)}>
                + Book New Appointment
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.apptTable}>
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Token</th>
                  <th>Patient</th>
                  <th style={{ width: '110px' }}>Age / Gender</th>
                  <th style={{ width: '145px' }}>Time</th>
                  <th>Doctor</th>
                  {/* <th style={{ width: '120px' }}>Visit Type</th> */}
                  <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '180px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt, idx) => {
                  const av = AVATAR_PALETTE[idx % AVATAR_PALETTE.length]
                  const statusStyle = STATUS_STYLE[appt.status] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }
                  const visitType = appt.is_virtual ? 'Telemedicine' : 'In-Office'
                  const docObj = doctors.find(d => String(d.id) === String(appt.doctor))
                  const doctorName = appt.doctor_name || docObj?.name || 'Doctor not assigned'

                  return (
                    <tr key={appt.id} className={styles.apptRow}>
                      {/* Token */}
                      <td>
                        <span className={styles.tokenBadge}>
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Patient Column */}
                      <td>
                        <div className={styles.patientNameCell}>
                          <div className={styles.patientAvatar} style={{ background: av.bg, color: av.fg }}>
                            {getInitials(appt.patient_name)}
                          </div>
                          <div>
                            <div className={styles.patientName}>
                              {appt.patient_name}
                            </div>
                            <div className={styles.patientMeta}>
                              UHID: #{appt.patient || '—'} {appt.patient_phone ? `· ${appt.patient_phone}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Age / Gender */}
                      <td>
                        {(() => {
                          const age = (appt.patient_age !== undefined && appt.patient_age !== null && appt.patient_age !== '')
                            ? appt.patient_age
                            : (appt.patient?.age !== undefined && appt.patient?.age !== null ? appt.patient.age : null);
                          const gender = appt.patient_gender || appt.patient?.gender || '—';
                          return `${age !== null ? `${age} Y` : '—'} / ${gender}`;
                        })()}
                      </td>

                      {/* Time */}
                      <td>
                        <span className={styles.timeCell}>
                          {(() => {
                            const tf = (appt.time_formatted && appt.time_formatted !== '--:--') ? appt.time_formatted : null;
                            const ef = (appt.end_time_formatted && appt.end_time_formatted !== '--:--') ? appt.end_time_formatted : null;
                            if (tf && ef) return `${tf} - ${ef}`;
                            if (tf) return tf;
                            if (appt.time) {
                              try {
                                const [h, m] = String(appt.time).split(':');
                                const d = new Date();
                                d.setHours(parseInt(h, 10), parseInt(m, 10));
                                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              } catch {
                                return String(appt.time).slice(0, 5);
                              }
                            }
                            return '—';
                          })()}
                        </span>
                      </td>

                      {/* Doctor (Standard Normal Text) */}
                      <td>
                        <span className={styles.docName}>
                          {doctorName}
                        </span>
                      </td>

                      {/* Visit Type */}
                      {/* <td>
                        <span
                          className={styles.visitBadge}
                          style={{
                            background: appt.is_virtual ? '#f0fdf4' : '#f8fafc',
                            color: appt.is_virtual ? '#16a34a' : '#475569',
                            border: `1px solid ${appt.is_virtual ? '#bbf7d0' : '#e2e8f0'}`
                          }}
                        >
                          {appt.is_virtual ? '📹 Telemedicine' : 'In-Office'}
                        </span>
                      </td> */}

                      {/* Status Badge */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={styles.statusBadge}
                          style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`
                          }}
                        >
                          {appt.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td>
                        <div className={styles.actionsCell}>
                          {/* Consult Action */}
                          {!['Receptionist'].includes(userRole) && appt.status !== 'Cancelled' && (
                            <button
                              className={`${styles.actionBtn} ${styles.consultBtn}`}
                              onClick={() => startConsultation(appt)}
                              title="Start Consultation"
                            >
                              {checkingCaseSheet && targetAppt?.id === appt.id ? '...' : '🩺 Consult'}
                            </button>
                          )}

                          {/* Edit Action */}
                          <button
                            className={`${styles.actionBtn} ${styles.editBtn}`}
                            onClick={() => handleOpenEditModal(appt)}
                            title="Edit Appointment Details"
                          >
                            ✏️ Edit
                          </button>

                          {/* Quick Cancel Action if active */}
                          {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                            <button
                              className={`${styles.actionBtn} ${styles.cancelBtn}`}
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to cancel appointment for ${appt.patient_name}?`)) {
                                  handleUpdateStatus(appt.id, 'Cancelled')
                                }
                              }}
                              title="Cancel Appointment"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Appointment Modal ── */}
      {editingAppt && (
        <div className={styles.modalOverlay} onClick={() => setEditingAppt(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Appointment #{editingAppt.id}</h3>
              <button className={styles.closeModalBtn} onClick={() => setEditingAppt(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>
                  Patient Name
                </label>
                <input
                  type="text"
                  disabled
                  value={editingAppt.patient_name || ''}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#475569', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>
                  Doctor Assigned
                </label>
                <select
                  value={editForm.doctor}
                  onChange={e => setEditForm(f => ({ ...f, doctor: e.target.value, time: '' }))}
                  className={styles.filterSelect}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>
                  Appointment Date
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={e => setEditForm(f => ({ ...f, date: e.target.value, time: '' }))}
                  className={styles.searchInput}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>
                  Available Candidate Slots {editForm.time && <span style={{ color: '#4f46e5', fontWeight: 800 }}>({editForm.time})</span>}
                </label>
                {loadingEditSlots ? (
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0' }}>Loading candidate slots...</p>
                ) : editLeaveAlert ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 8, color: '#991b1b', fontSize: 12, fontWeight: 600 }}>
                    ⚠️ Doctor is on approved leave ({editLeaveAlert}) on this date.
                  </div>
                ) : !editForm.doctor ? (
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0', fontStyle: 'italic' }}>Please select a doctor.</p>
                ) : editCandidateSlots.length === 0 ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: 8, color: '#92400e', fontSize: 12 }}>
                    ℹ️ No slots available for the selected doctor on this date.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 130, overflowY: 'auto', padding: 4 }}>
                    {editCandidateSlots.map((slot, sIdx) => {
                      const isSelected = editForm.time?.startsWith(slot.time)
                      if (!slot.is_available) {
                        return (
                          <div
                            key={sIdx}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              color: '#94a3b8',
                              fontSize: 11,
                              cursor: 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span>{slot.time}</span>
                            <span style={{ fontSize: 9, background: '#e2e8f0', padding: '1px 3px', borderRadius: 3 }}>
                              {slot.status || 'Booked'}
                            </span>
                          </div>
                        )
                      }
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => setEditForm(f => ({ ...f, time: slot.time }))}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: isSelected ? '2px solid #4f46e5' : '1px solid #a7f3d0',
                            background: isSelected ? '#4f46e5' : '#ecfdf5',
                            color: isSelected ? '#ffffff' : '#065f46',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {slot.time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className={styles.filterSelect}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Engaged">Engaged / In Consultation</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditingAppt(null)}
                  style={{ padding: '10px 18px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{ padding: '10px 20px', background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Treatment Case Sheet Modal ── */}
      {showCaseSheetModal && targetAppt && targetAppt.activeCase && (
        <div className={styles.modalOverlay} onClick={() => setShowCaseSheetModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ width: '650px', maxWidth: '94vw' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Treatment Case Available</h3>
              <button className={styles.closeModalBtn} onClick={() => setShowCaseSheetModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: '1.5' }}>
                This patient has an active treatment case. You can choose to continue the existing treatment flow or start a brand new treatment case.
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>
                  Patient: <span style={{ color: '#0d9488', textTransform: 'none' }}>{targetAppt.patient_name}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: 12 }}>
                  <div><span style={{ color: '#64748b' }}>Case Number:</span> <strong style={{ color: '#0f172a' }}>{targetAppt.activeCase.caseNumber}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Doctor:</span> <strong style={{ color: '#0f172a' }}>{targetAppt.activeCase.doctor}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Created Date:</span> <strong style={{ color: '#0f172a' }}>{targetAppt.activeCase.createdDate}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Last Visit:</span> <strong style={{ color: '#0f172a' }}>{targetAppt.activeCase.lastVisit}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Current Treatment:</span> <strong style={{ color: '#0f172a' }}>{targetAppt.activeCase.currentTreatment}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Visits Completed:</span> <strong style={{ color: '#0f172a' }}>{targetAppt.activeCase.visitsCompleted}</strong></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              <button
                type="button"
                onClick={() => setShowCaseSheetModal(false)}
                style={{ padding: '9px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => navigateToConsultation(targetAppt, true, true)}
                style={{ padding: '9px 16px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                ➕ Start New Treatment Case
              </button>
              <button
                type="button"
                onClick={() => navigateToConsultation(targetAppt, false, false)}
                style={{ padding: '9px 16px', background: '#0d9488', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                🟢 Continue Existing Treatment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
