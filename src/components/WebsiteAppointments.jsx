import { useState, useEffect, useCallback } from 'react'
import styles from './WebsiteAppointments.module.css'
import Swal from 'sweetalert2'

const API_BASE = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' }
}

export default function WebsiteAppointments({ userRole }) {
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard | simulator
  const [requests, setRequests] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successData, setSuccessData] = useState(null)

  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState(null)
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', doctorId: '' })

  // Simulator Form state
  const [simForm, setSimForm] = useState({
    name: '',
    phone: '',
    email: '',
    preferred_date: new Date().toISOString().split('T')[0],
    preferred_time: '11:00',
    preferred_doctor: '',
    reason: 'General consultation and checkup'
  })

  // Fetch all bookings
  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/website-appointments/?status=all`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      }
    } catch (e) {
      console.error('Failed to load website requests:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch doctors
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setDoctors(data)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Fetch patient database to map phone numbers
  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/patient/search/`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setPatients(data)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
    fetchDoctors()
    fetchPatients()
  }, [fetchRequests, fetchDoctors, fetchPatients])

  // Simulator submission
  const handleSimSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...simForm,
        preferred_time: simForm.preferred_time + ':00',
        preferred_doctor: simForm.preferred_doctor || null
      }
      const res = await fetch(`${API_BASE}/website-appointments/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const data = await res.json()
        const refNo = 'DS-' + Math.floor(100000 + Math.random() * 900000)
        setSuccessData({ ...data, refNo })
        // Clear form
        setSimForm({
          name: '',
          phone: '',
          email: '',
          preferred_date: new Date().toISOString().split('T')[0],
          preferred_time: '11:00',
          preferred_doctor: '',
          reason: 'General consultation and checkup'
        })
        fetchRequests()
        fetchPatients()
      } else {
        alert('Failed to submit appointment request.')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  // Action: Approve
  const handleApprove = async (id, name) => {
    const confirmApprove_res = await Swal.fire({ title: `Approve website appointment request for ${name}?`, icon: 'warning', showCancelButton: true }); const confirmApprove = confirmApprove_res.isConfirmed;
    if (!confirmApprove) return
    try {
      const res = await fetch(`${API_BASE}/website-appointments/${id}/action/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'approve' })
      })
      if (res.ok) {
        alert('Appointment successfully approved and scheduled!')
        fetchRequests()
        fetchPatients()
      } else {
        alert('Failed to approve appointment request.')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Action: Reject
  const handleReject = async (id, name) => {
    const notes = prompt(`Please enter a rejection reason for ${name}'s request (optional):`, '')
    if (notes === null) return // cancelled
    try {
      const res = await fetch(`${API_BASE}/website-appointments/${id}/action/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'reject', notes })
      })
      if (res.ok) {
        alert('Appointment rejected.')
        fetchRequests()
      } else {
        alert('Failed to reject request.')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Reschedule Form Toggle
  const startReschedule = (req) => {
    setReschedulingId(req.id)
    setRescheduleData({
      date: req.preferred_date,
      time: req.preferred_time ? req.preferred_time.substring(0, 5) : '10:00',
      doctorId: req.preferred_doctor || ''
    })
  }

  const handleSaveReschedule = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/website-appointments/${id}/action/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          action: 'reschedule',
          date: rescheduleData.date,
          time: rescheduleData.time + ':00',
          doctor_id: rescheduleData.doctorId || null,
          notes: 'Rescheduled by Receptionist review'
        })
      })
      if (res.ok) {
        alert('Slot preference updated!')
        setReschedulingId(null)
        fetchRequests()
      } else {
        alert('Failed to reschedule request.')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Check if patient exists by matching phone number in local patient array
  const checkPatientExists = (phone) => {
    const cleanPhone = phone ? phone.replace(/\D/g, '') : ''
    return patients.some(p => {
      const cleanPatPhone = p.phone ? p.phone.replace(/\D/g, '') : ''
      return cleanPatPhone === cleanPhone || (cleanPatPhone && cleanPhone && (cleanPatPhone.includes(cleanPhone) || cleanPhone.includes(cleanPatPhone)))
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Website Booking Requests</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Verify, reschedule, and approve patient bookings submitted online
          </p>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'dashboard' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📥 Clinic Review Dashboard ({requests.filter(r => r.status === 'Pending').length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'simulator' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            🌐 Public Website Simulator
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: '#64748b' }}>Loading booking requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📥</div>
              <h3>No Website Bookings Found</h3>
              <p>There are no appointments submitted from the public site yet.</p>
            </div>
          ) : (
            <div className={styles.listGrid}>
              {requests.map(req => {
                const isExisting = checkPatientExists(req.phone)
                const isPending = req.status === 'Pending'
                const initials = req.name ? req.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'

                return (
                  <div key={req.id} className={styles.requestCard}>
                    <div>
                      <div className={styles.cardHeader}>
                        <div className={styles.patientMeta}>
                          <div className={styles.avatar}>{initials}</div>
                          <div>
                            <h3 className={styles.name}>{req.name}</h3>
                            <p className={styles.contact}>
                              📞 {req.phone} {req.email ? `• ✉️ ${req.email}` : ''}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span className={`${styles.status} ${req.status === 'Approved' ? styles.statusApproved :
                              req.status === 'Rejected' ? styles.statusRejected : styles.statusPending
                            }`}>
                            {req.status}
                          </span>
                          {isPending && (
                            <span className={`${styles.badge} ${isExisting ? styles.existingBadge : styles.newBadge}`}>
                              {isExisting ? 'Existing Patient' : 'New Patient'}
                            </span>
                          )}
                        </div>
                      </div>

                      {reschedulingId === req.id ? (
                        <div className={styles.reschedulePanel}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 700 }}>Reschedule Slot</h4>
                          <div className={styles.inputGrid}>
                            <input
                              type="date"
                              className={styles.inputField}
                              value={rescheduleData.date}
                              onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                            />
                            <input
                              type="time"
                              className={styles.inputField}
                              value={rescheduleData.time}
                              onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                            />
                          </div>
                          <select
                            className={styles.inputField}
                            style={{ marginBottom: 12 }}
                            value={rescheduleData.doctorId}
                            onChange={e => setRescheduleData({ ...rescheduleData, doctorId: e.target.value })}
                          >
                            <option value="">Select Doctor</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className={styles.btn} style={{ background: '#cbd5e1', color: 'var(--slate-900)' }} onClick={() => setReschedulingId(null)}>Cancel</button>
                            <button className={`${styles.btn} ${styles.btnConfirm}`} onClick={() => handleSaveReschedule(req.id)}>Save Updates</button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.appointmentDetails}>
                          <div className={styles.detailRow}>
                            <span className={styles.detailIcon}>📅</span>
                            <span className={styles.detailText}>
                              {new Date(req.preferred_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.detailIcon}>⏰</span>
                            <span className={styles.detailText}>
                              {req.preferred_time ? req.preferred_time.substring(0, 5) : '—'}
                            </span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.detailIcon}>👨‍⚕️</span>
                            <span className={styles.detailText}>
                              Doctor: {req.doctor_name || 'No preferred dentist'}
                            </span>
                          </div>
                          {req.reason && <p className={styles.reasonText}>" {req.reason} "</p>}
                          {req.notes && (
                            <p style={{ margin: '8px 0 0 0', fontSize: 11, color: '#e11d48', fontWeight: 600 }}>
                              Note: {req.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {isPending && reschedulingId !== req.id && (
                      <div className={styles.actions}>
                        <button
                          className={`${styles.btn} ${styles.btnConfirm}`}
                          onClick={() => handleApprove(req.id, req.name)}
                        >
                          ✓ Confirm & Book
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnReschedule}`}
                          onClick={() => startReschedule(req)}
                        >
                          Reschedule
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnReject}`}
                          onClick={() => handleReject(req.id, req.name)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.simulatorWrap}>
          {/* Phone Screen Mockup */}
          <div>
            <div className={styles.phoneMockup}>
              <div className={styles.phoneContent}>
                {successData ? (
                  <div className={styles.successCard}>
                    <div className={styles.successIcon}>✓</div>
                    <h3 className={styles.successTitle}>Request Submitted!</h3>
                    <p className={styles.successText}>
                      We have received your appointment request. Our staff will review availability and confirm your booking via phone call or SMS shortly.
                    </p>
                    <div className={styles.refNumber}>
                      REF: {successData.refNo}
                    </div>
                    <button
                      className={styles.submitBtn}
                      style={{ width: '100%', marginTop: '30px', background: '#334155' }}
                      onClick={() => setSuccessData(null)}
                    >
                      Book Another Consult
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className={styles.simHeader}>
                      <div className={styles.simLogo}>🦷</div>
                      <h2 className={styles.simBrand}>SmileCraft Dental</h2>
                      <p className={styles.simSub}>Book an appointment instantly online</p>
                    </div>

                    <form onSubmit={handleSimSubmit} className={styles.simForm}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Your Name</label>
                        <input
                          type="text"
                          required
                          className={styles.formInput}
                          placeholder="e.g. John Doe"
                          value={simForm.name}
                          onChange={e => setSimForm({ ...simForm, name: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Phone Number</label>
                        <input
                          type="tel"
                          required
                          className={styles.formInput}
                          placeholder="e.g. 9876543210"
                          value={simForm.phone}
                          onChange={e => setSimForm({ ...simForm, phone: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email Address</label>
                        <input
                          type="email"
                          className={styles.formInput}
                          placeholder="e.g. john@example.com"
                          value={simForm.email}
                          onChange={e => setSimForm({ ...simForm, email: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Preferred Dentist</label>
                        <select
                          className={styles.formInput}
                          value={simForm.preferred_doctor}
                          onChange={e => setSimForm({ ...simForm, preferred_doctor: e.target.value })}
                        >
                          <option value="">Any Available Dentist</option>
                          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className={styles.formGroup} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
                        <div>
                          <label className={styles.formLabel}>Select Date</label>
                          <input
                            type="date"
                            required
                            className={styles.formInput}
                            value={simForm.preferred_date}
                            onChange={e => setSimForm({ ...simForm, preferred_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className={styles.formLabel}>Select Time</label>
                          <input
                            type="time"
                            required
                            className={styles.formInput}
                            value={simForm.preferred_time}
                            onChange={e => setSimForm({ ...simForm, preferred_time: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Reason for Visit</label>
                        <textarea
                          className={styles.formInput}
                          style={{ height: '80px', resize: 'none' }}
                          placeholder="Briefly describe your symptoms or treatment required..."
                          value={simForm.reason}
                          onChange={e => setSimForm({ ...simForm, reason: e.target.value })}
                        />
                      </div>
                      <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : '🚀 Submit Request'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guidelines info */}
          <div className={styles.instructions}>
            <h3>How to test this Simulator:</h3>
            <ol>
              <li>Fill out the patient booking request form inside the **mobile phone mockup** screen on the left.</li>
              <li>You can select a specific doctor, appointment date, time, and write a consultation concern.</li>
              <li>Click the **Submit Request** button.</li>
              <li>Once submitted, a confirmation screen will appear inside the mockup.</li>
              <li>Now, click on the **Clinic Review Dashboard** tab above.</li>
              <li>You will see the new request listed at the top as **Pending**.</li>
              <li>The system dynamically labels requests as **[New Patient]** or **[Existing Patient]** depending on whether the phone number matches any record in your patient list.</li>
              <li>Click **Confirm & Book** to register the patient and schedule a real clinic appointment, or **Reschedule / Reject** as necessary!</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
