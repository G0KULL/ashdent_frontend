import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '../context/PatientContext'
import styles from './Appointments.module.css'

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

export default function Appointments({ onNavigate, userRole }) {
  const { setActivePatient } = usePatients()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [doctors, setDoctors] = useState([])
  const [showBooking, setShowBooking] = useState(false)
  const [patientQuery, setPatientQuery] = useState('')
  const [matchedPatients, setMatchedPatients] = useState([])
  const [bookingData, setBookingData] = useState({ patientId: '', patientName: '', doctor: '', date: new Date().toISOString().split('T')[0], time: '10:00', status: 'Scheduled', isVirtual: false, consultationFee: '' })
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [activeHistoryTab, setActiveHistoryTab] = useState('notes') // notes | rx | treatments
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState('Consultation Fee')
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState(false)

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())

  const [showCaseSheetModal, setShowCaseSheetModal] = useState(false)
  const [targetAppt, setTargetAppt] = useState(null)
  const [checkingCaseSheet, setCheckingCaseSheet] = useState(false)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth)

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleSelectDay = (dayNum) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0')
    const formattedDay = String(dayNum).padStart(2, '0')
    setDate(`${currentYear}-${formattedMonth}-${formattedDay}`)
  }

  const isSelected = (dayNum) => {
    const [selYear, selMonth, selDay] = date.split('-').map(Number)
    return selYear === currentYear && selMonth === (currentMonth + 1) && selDay === dayNum
  }

  const isToday = (dayNum) => {
    const t = new Date()
    return t.getFullYear() === currentYear && t.getMonth() === currentMonth && t.getDate() === dayNum
  }

  const calendarCells = []
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i)
  }

  const renderCalendar = () => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        border: '1px solid var(--border-light)',
        padding: '16px',
        boxShadow: 'var(--shadow-sm)',
        width: '300px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', color: 'var(--slate-800)', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>&lt;</button>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)' }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', color: 'var(--slate-800)', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>&gt;</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
          {weekdays.map(d => (
            <span key={d} style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{d}</span>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />
            }
            const active = isSelected(day)
            const current = isToday(day)
            return (
              <button
                type="button"
                key={`day-${day}`}
                onClick={() => handleSelectDay(day)}
                style={{
                  background: active ? '#4f46e5' : 'transparent',
                  color: active ? '#fff' : (current ? '#4f46e5' : 'var(--slate-900)'),
                  border: 'none',
                  borderRadius: '8px',
                  height: '32px',
                  width: '32px',
                  fontSize: '12px',
                  fontWeight: active || current ? 800 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: current && !active ? '0 0 0 1px #4f46e5' : 'none',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const fetchAppointments = useCallback(async (selectedDate) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/appointments/all/?date=${selectedDate}`, { headers: getHeaders() })
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
  }, [])

  useEffect(() => {
    fetchAppointments(date)
    // Load doctors
    fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(setDoctors)
      .catch(console.error)
  }, [date, fetchAppointments])

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
    if (!bookingData.patientId || !bookingData.date) return alert('Please select a patient and date')
    setSaving(true)

    let meetingLink = null
    if (bookingData.isVirtual) {
      const uniqueId = Math.random().toString(36).substring(2, 11)
      meetingLink = `https://meet.jit.si/DoctoSmart_Consultation_${uniqueId}`
    }

    try {
      const res = await fetch(`${API_BASE}/appointment/create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: bookingData.patientId,
          doctor: bookingData.doctor || null,
          date: bookingData.date,
          time: bookingData.time + ':00',
          status: bookingData.status,
          is_virtual: bookingData.isVirtual,
          meeting_link: meetingLink,
        }),
      })
      if (res.ok) {
        // Also charge consultation fee if provided
        if (bookingData.consultationFee && parseFloat(bookingData.consultationFee) > 0) {
          try {
            const vRes = await fetch(`${API_BASE}/visit/get-or-create/`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({ patient_id: bookingData.patientId })
            });
            const vData = await vRes.json();
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
            });
          } catch (feeErr) {
            console.error('Error recording consultation fee:', feeErr);
          }
        }

        setShowBooking(false)
        setBookingData({ ...bookingData, patientId: '', patientName: '', isVirtual: false, consultationFee: '' })
        setSelectedProfile(null)
        setPatientQuery('')
        fetchAppointments(date)
        alert('Appointment booked successfully!')
      }
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handlePayOldBalance = async () => {
    if (!selectedProfile || !paymentAmount || parseFloat(paymentAmount) <= 0) return
    setPaying(true)
    try {
      // Get or create a visit to attach payment
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
    // Fetch full profile for history and balance
    try {
      const res = await fetch(`${API_BASE}/patient/${p.id}/profile/`, { headers: getHeaders() })
      if (res.ok) {
        setSelectedProfile(await res.json())
      }
    } catch (e) { console.error(e) }
  }

  const navigate = useNavigate()

  const startConsultation = async (appt) => {
    setActivePatient({
      id: appt.patient,
      name: appt.patient_name,
      phone: appt.patient_phone,
      total_balance: appt.patient_balance,
      age: appt.patient_age,
      gender: appt.patient_gender,
    })

    setCheckingCaseSheet(true);
    try {
      // Query the patient's entire profile to look for previous clinical notes / active cases
      const profileRes = await fetch(`${API_BASE}/patient/${appt.patient}/profile/`, { headers: getHeaders() });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        const appointmentsWithNotes = profile?.appointments?.filter(a => a.clinical_notes) || [];
        
        let activeCase = null;
        for (const a of appointmentsWithNotes) {
          if (a.clinical_notes?.treatment_plan) {
            try {
              const plan = JSON.parse(a.clinical_notes.treatment_plan);
              // A case is active if it has active status or contains planned/started treatments
              const hasActiveStatus = plan?.caseDetails?.status === 'In Progress' || plan?.caseDetails?.status === 'Open';
              const hasActiveTreatments = plan?.plannedTreatments && plan.plannedTreatments.some(t => t.status === 'Planned' || t.status === 'Started');
              
              if (hasActiveStatus || hasActiveTreatments) {
                activeCase = {
                  caseNumber: plan?.caseDetails?.caseNumber || `CS-${a.id}`,
                  doctor: a.doctor_name || appt.doctor_name || 'Dr. Assigned',
                  createdDate: plan?.caseDetails?.createdDate || new Date(a.date).toLocaleDateString(),
                  lastVisit: new Date(a.date).toLocaleDateString(),
                  currentTreatment: plan?.caseDetails?.currentTreatment || plan?.plannedTreatments?.[0]?.procedure || 'General Consultation',
                  visitsCompleted: plan?.caseDetails?.visitsCompleted || appointmentsWithNotes.length,
                  status: plan?.caseDetails?.status || 'In Progress',
                  appointmentId: a.id
                };
                break;
              }
            } catch (e) {
              console.error('Error parsing treatment plan JSON:', e);
            }
          }
        }

        if (activeCase) {
          setTargetAppt({
            ...appt,
            activeCase: activeCase
          });
          setShowCaseSheetModal(true);
        } else {
          // Open New Treatment Case immediately
          navigateToConsultation(appt, true);
        }
      } else {
        navigateToConsultation(appt, true);
      }
    } catch (e) {
      console.error(e);
      navigateToConsultation(appt, true);
    } finally {
      setCheckingCaseSheet(false);
    }
  }

  const navigateToConsultation = (appt, isNewCase = false, autoGenerateCase = false) => {
    const role = userRole?.toLowerCase() || 'doctor'
    
    if (isNewCase) {
      navigate(`/${role}/create-case/${appt.patient}`, {
        state: { 
          appointmentId: appt.id,
          patientId: appt.patient,
          patientName: appt.patient_name,
          patientPhone: appt.patient_phone,
          patientAge: appt.patient_age,
          patientGender: appt.patient_gender,
          doctorName: appt.doctor_name,
          appointmentDate: appt.date,
          appointmentTime: appt.time_formatted || appt.time,
          isNewCase: isNewCase,
          autoGenerateCase: autoGenerateCase
        }
      });
    } else {
      const caseId = targetAppt?.activeCase?.caseNumber || 'DEFAULT_CASE';
      navigate(`/${role}/case-sheet/${caseId}`);
    }
    
    setShowCaseSheetModal(false);
  }

  return (
    <div className={styles.appointmentsContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Appointments</h1>
          <p style={{ fontSize: 13, color: 'var(--slate-400)', margin: '4px 0 0' }}>
            Manage and track all patient visits
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className={styles.addBtn}
            onClick={() => {
              setShowBooking(!showBooking)
              if (!showBooking) setSelectedProfile(null)
            }}
            style={{
              background: showBooking ? '#ef4444' : '#4f46e5',
              color: 'white', border: 'none', padding: '10px 16px',
              borderRadius: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {showBooking ? '✕ Close' : '➕ Book New'}
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-subtle)',
              fontSize: 13, fontWeight: 600, outline: 'none'
            }}
          />
          <button
            className={styles.doctorBtn}
            onClick={() => setDate(new Date().toISOString().split('T')[0])}
            style={{ background: 'transparent', color: 'var(--slate-900)', border: '1px solid var(--border-light)' }}
          >
            📅 Today
          </button>
          <button className={styles.doctorBtn} onClick={() => fetchAppointments(date)}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {showBooking && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)', padding: 32, borderRadius: 20, marginBottom: 32,
          border: '1px solid var(--border-light)', boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          display: 'grid', gridTemplateColumns: selectedProfile ? '1fr 1fr' : '1fr', gap: 32
        }}>
          <div>
            <h3 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 800, color: 'var(--slate-900)' }}>
              {selectedProfile ? 'Booking for ' + selectedProfile.patient.name : 'Schedule New Appointment'}
            </h3>
            <form onSubmit={handleSaveBooking} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Patient Search</label>
                <input
                  placeholder="Search patient name/phone..."
                  value={bookingData.patientName || patientQuery}
                  onChange={e => {
                    setPatientQuery(e.target.value)
                    if (bookingData.patientId) setBookingData(p => ({ ...p, patientId: '', patientName: '' }))
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--slate-100)', color: 'var(--slate-900)' }}
                />
                {matchedPatients.length > 0 && !bookingData.patientId && (
                  <div style={{
                    background: 'var(--slate-100)', border: '1px solid var(--border-light)', borderRadius: 8, marginTop: 4,
                    maxHeight: 200, overflowY: 'auto', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}>
                    {matchedPatients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', fontSize: 13, color: 'var(--slate-900)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ color: 'var(--slate-400)', fontSize: 11 }}>{p.phone} · Balance: ₹{p.total_balance}</div>
                      </div>
                    ))}
                    <div
                      onClick={() => onNavigate('add-patient')}
                      style={{ padding: '12px 16px', cursor: 'pointer', background: 'rgba(22, 163, 74, 0.1)', color: '#22c55e', fontWeight: 700, fontSize: 13, textAlign: 'center' }}
                    >
                      + Create New Patient
                    </div>
                  </div>
                )}
              </div>

              {selectedProfile && (
                <div style={{
                  background: parseFloat(selectedProfile.patient?.total_balance || selectedProfile.total_balance || 0) > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${parseFloat(selectedProfile.patient?.total_balance || selectedProfile.total_balance || 0) > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                  borderRadius: 12, padding: 16, marginBottom: 20
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Account balance (re-appointment)</p>
                      <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: parseFloat(selectedProfile.patient?.total_balance || selectedProfile.total_balance || 0) > 0 ? '#ef4444' : '#10b981' }}>
                        ₹{parseFloat(selectedProfile.patient?.total_balance ?? selectedProfile.total_balance ?? 0).toFixed(2)}
                      </p>
                      {parseFloat(selectedProfile.patient?.total_balance || selectedProfile.total_balance || 0) <= 0 && (
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#10b981' }}>No dues on file for clinical billing.</p>
                      )}
                    </div>
                    {parseFloat(selectedProfile.patient?.total_balance || selectedProfile.total_balance || 0) > 0 && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="number"
                          placeholder="Amt to pay"
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                          style={{ width: 100, padding: '8px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--slate-100)', color: 'var(--slate-900)', fontSize: 13 }}
                        />
                        <button
                          onClick={handlePayOldBalance}
                          disabled={paying || !paymentAmount}
                          style={{ background: '#d97706', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          {paying ? '...' : 'Pay'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Doctor</label>
                <select
                  value={bookingData.doctor}
                  onChange={e => setBookingData(p => ({ ...p, doctor: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--slate-100)', color: 'var(--slate-900)' }}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Date & Time</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="date" value={bookingData.date} onChange={e => setBookingData(p => ({ ...p, date: e.target.value }))} style={{ flex: 2, padding: '10px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--slate-100)', color: 'var(--slate-900)' }} />
                  <input type="time" value={bookingData.time} onChange={e => setBookingData(p => ({ ...p, time: e.target.value }))} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--slate-100)', color: 'var(--slate-900)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Consultation Fee (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={bookingData.consultationFee}
                    onChange={e => setBookingData(p => ({ ...p, consultationFee: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--slate-100)', color: 'var(--slate-900)' }}
                  />
                </div>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                <input
                  type="checkbox"
                  id="isVirtual"
                  checked={bookingData.isVirtual}
                  onChange={e => setBookingData(p => ({ ...p, isVirtual: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="isVirtual" style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-900)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📹 Telemedicine / Virtual Consultation
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 12 }}>
                <button
                  type="submit"
                  disabled={saving || !bookingData.patientId}
                  style={{
                    width: '100%', padding: '14px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white',
                    border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(79,70,229,0.2)',
                    opacity: (saving || !bookingData.patientId) ? 0.6 : 1
                  }}
                >
                  {saving ? 'Booking...' : '✨ Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>

          {selectedProfile && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[
                  { id: 'notes', label: 'Notes', icon: '📝' },
                  { id: 'rx', label: 'Rx', icon: '💊' },
                  { id: 'treatments', label: 'Treatments', icon: '🦷' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveHistoryTab(t.id)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      background: activeHistoryTab === t.id ? '#4f46e5' : 'rgba(255, 255, 255, 0.05)',
                      color: activeHistoryTab === t.id ? '#fff' : 'var(--slate-400)',
                      transition: '0.2s'
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div style={{
                flex: 1, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 16, border: '1px solid var(--border-light)',
                padding: 20, maxHeight: 400, overflowY: 'auto'
              }}>
                {activeHistoryTab === 'notes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedProfile.appointments?.filter(a => a.clinical_notes).length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 20 }}>No clinical history</p>
                    ) : (
                      selectedProfile.appointments.filter(a => a.clinical_notes)
                        .slice(-3).reverse()
                        .map(a => (
                        <div key={a.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 10, border: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#a855f7' }}>{new Date(a.date).toLocaleDateString()}</span>
                            <span style={{ fontSize: 10, color: 'var(--slate-400)' }}>{a.doctor_name}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--slate-900)' }}>{a.clinical_notes.diagnosis?.join(', ')}</p>
                          {a.clinical_notes.notes && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--slate-400)', fontStyle: 'italic' }}>"{a.clinical_notes.notes}"</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeHistoryTab === 'rx' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedProfile.prescriptions?.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 20 }}>No prescriptions</p>
                    ) : (
                      selectedProfile.prescriptions
                        .slice(-3).reverse()
                        .map(p => (
                        <div key={p.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 10, border: '1px solid var(--border-light)' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#a855f7', marginBottom: 6 }}>{new Date(p.created_at).toLocaleDateString()}</div>
                          {p.items.map((it, i) => (
                            <div key={i} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i === p.items.length - 1 ? 'none' : '1px dashed var(--border-light)' }}>
                              <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{it.medicine_name || it.name || 'Medicine'}</span>
                              <span style={{ color: 'var(--slate-400)' }}>{it.dosage} · {it.duration}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeHistoryTab === 'treatments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedProfile.payments?.filter(p => p.items?.length > 0).length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 20 }}>No treatment records</p>
                    ) : (
                      selectedProfile.payments.filter(p => p.items?.length > 0)
                        .slice(-3).reverse()
                        .map(p => (
                        <div key={p.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 10, border: '1px solid var(--border-light)' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#a855f7', marginBottom: 6 }}>{new Date(p.created_at).toLocaleDateString()}</div>
                          {p.items.map((it, i) => (
                            <div key={i} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                              <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{it.treatment_name || 'Treatment'}</span>
                              <span style={{ fontWeight: 700, color: '#10b981' }}>₹{it.price}</span>
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

      {/* Case Sheet Modal */}
      {showCaseSheetModal && targetAppt && targetAppt.activeCase && (
        <div className={styles.modalOverlay} onClick={() => setShowCaseSheetModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ width: '700px', maxWidth: '95%', textAlign: 'left', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '28px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Treatment Case Available</h2>
              <button onClick={() => setShowCaseSheetModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
                This patient has an active treatment case. You can choose to continue the existing treatment flow or start a brand new treatment case.
              </p>
              
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  Patient: <span style={{ color: '#14b8a6', textTransform: 'none' }}>{targetAppt.patient_name}</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Case Number:</span> <strong style={{ color: '#1e293b', marginLeft: '4px' }}>{targetAppt.activeCase.caseNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Doctor:</span> <strong style={{ color: '#1e293b', marginLeft: '4px' }}>{targetAppt.activeCase.doctor}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Created Date:</span> <strong style={{ color: '#1e293b', marginLeft: '4px' }}>{targetAppt.activeCase.createdDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Last Visit:</span> <strong style={{ color: '#1e293b', marginLeft: '4px' }}>{targetAppt.activeCase.lastVisit}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Current Treatment:</span> <strong style={{ color: '#1e293b', marginLeft: '4px' }}>{targetAppt.activeCase.currentTreatment}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Visits Completed:</span> <strong style={{ color: '#1e293b', marginLeft: '4px' }}>{targetAppt.activeCase.visitsCompleted}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Status:</span> 
                    <span style={{ background: '#eaf7ff', color: '#0284c7', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', marginLeft: '8px', border: '1px solid #bae6fd' }}>
                      {targetAppt.activeCase.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <button 
                onClick={() => setShowCaseSheetModal(false)}
                style={{ padding: '10px 18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                ⚪ Cancel
              </button>
              <button 
                onClick={() => navigateToConsultation(targetAppt, true, true)}
                style={{ padding: '10px 18px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                ➕ Start New Treatment Case
              </button>
              <button 
                onClick={() => navigateToConsultation(targetAppt, false, false)}
                style={{ padding: '10px 18px', background: '#14b8a6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                🟢 Continue Existing Treatment
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginTop: 16 }}>
        {/* Calendar Side Panel */}
        <div style={{ flexShrink: 0 }}>
          {renderCalendar()}
        </div>

        {/* Appointments List / States Side Panel */}
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

          {loading ? (
            <div className={styles.loading}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p>Loading appointments for {date}...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80, color: 'var(--slate-400)', background: 'rgba(255,255,255,0.01)', borderRadius: 20, border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 50, marginBottom: 16 }}>📅</div>
              <h3>No Appointments Found</h3>
              <p>There are no appointments scheduled for {date}.</p>
            </div>
          ) : (
            <div className={styles.listContainer}>
              <div className={styles.listHeader} style={{ gridTemplateColumns: '70px 1.5fr 1fr 1fr 1fr 1fr 1fr 130px' }}>
                <div>Token No.</div>
                <div>Patient Name</div>
                <div>UHID</div>
                <div>Age / Gender</div>
                <div>Time</div>
                <div>Doctor</div>
                <div>Visit Type</div>
                <div style={{ textAlign: 'center' }}>Status</div>
                <div style={{ textAlign: 'right' }}>Actions</div>
              </div>

              {appointments.map((appt, idx) => {
                const av = AVATAR_PALETTE[idx % AVATAR_PALETTE.length]
                const statusStyle = STATUS_STYLE[appt.status] || { bg: '#f0f4f8', color: 'var(--slate-700)', border: '#e2e8f0' }
                const visitType = appt.is_virtual ? 'Telemedicine' : 'In-Office'

                return (
                  <div key={appt.id} className={styles.listItem} style={{ gridTemplateColumns: '70px 1.5fr 1fr 1fr 1fr 1fr 1fr 130px', borderRadius: '12px', margin: '8px 16px', background: '#ffffff', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontSize: 13, fontWeight: '800', color: '#14b8a6', display: 'flex', alignItems: 'center' }}>
                      #{String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className={styles.cellPatient}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 10, background: av.bg, color: av.fg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12
                        }}>
                          {getInitials(appt.patient_name)}
                        </div>
                        <div>
                          <div className={styles.pName} style={{ fontSize: '14px', color: '#0f172a' }}>
                            {appt.patient_name}
                          </div>
                          <span className={styles.pPhone} style={{ fontSize: '11px' }}>{appt.patient_phone}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', fontWeight: '600' }}>
                      #{appt.patient || 'N/A'}
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>
                      {appt.patient_age ? `${appt.patient_age} Y` : 'N/A'} / {appt.patient_gender || 'N/A'}
                    </div>
                    <div className={styles.cellTime} style={{ fontSize: '13px' }}>{appt.time_formatted || appt.time || '—'}</div>
                    <div className={styles.cellDoctor} onClick={e => e.stopPropagation()}>
                      <select
                        value={appt.doctor || ''}
                        onChange={async (e) => {
                          const newDocId = e.target.value;
                          try {
                            const res = await fetch(`${API_BASE}/appointments/${appt.id}/status/`, {
                              method: 'PATCH',
                              headers: getHeaders(),
                              body: JSON.stringify({ doctor: newDocId || null })
                            });
                            if (res.ok) {
                              fetchAppointments(date);
                            } else {
                              alert('Failed to change doctor');
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Error changing doctor');
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 8,
                          border: '1px solid var(--border-light)',
                          fontSize: 12,
                          background: '#ffffff',
                          fontWeight: 600,
                          color: '#475569',
                          outline: 'none',
                          cursor: 'pointer',
                          maxWidth: '100%'
                        }}
                      >
                        <option value="">-- No Doctor --</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: '700', color: appt.is_virtual ? '#14b8a6' : '#64748b' }}>
                      {visitType}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <select
                        value={appt.status}
                        onClick={e => e.stopPropagation()}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            const res = await fetch(`${API_BASE}/appointments/${appt.id}/status/`, {
                              method: 'PATCH',
                              headers: getHeaders(),
                              body: JSON.stringify({ status: newStatus })
                            });
                            if (res.ok) {
                              fetchAppointments(date);
                            } else {
                              alert('Failed to change status');
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Error changing status');
                          }
                        }}
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          outline: 'none',
                          cursor: 'pointer',
                          appearance: 'none',
                          textAlign: 'center'
                        }}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Waiting">Waiting</option>
                        <option value="Engaged">Engaged</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className={styles.cellAction}>
                      {!['Receptionist'].includes(userRole) && (
                        <button className={styles.viewBtn} onClick={(e) => { e.stopPropagation(); startConsultation(appt) }} style={{ background: '#14b8a6', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                          {checkingCaseSheet && targetAppt?.id === appt.id ? '...' : '🩺 Consult'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
