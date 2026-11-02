import { useState, useEffect, useCallback } from 'react'
import { useBranch } from '../context/BranchContext'
import { getHeaders, API_BASE } from '../utils/api'
import styles from './DoctorSlots.module.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function DoctorSlots({ userRole }) {
  const user = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}')
  const isAdmin = userRole === 'Admin' || (user.role && user.role.toLowerCase() === 'admin')
  const { activeBranch } = useBranch()

  // Doctors list (for Admin) & Selected Doctor
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDoctorObj, setSelectedDoctorObj] = useState(null)

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState(isAdmin ? 'queue' : 'propose') // 'queue' | 'active' | 'direct' | 'propose' | 'leaves' | 'history'

  // Schedules and Proposals State
  const [activeSchedules, setActiveSchedules] = useState([])
  const [pendingProposals, setPendingProposals] = useState([])
  const [allProposals, setAllProposals] = useState([])
  const [overrides, setOverrides] = useState([])
  const [loading, setLoading] = useState(true)

  // Proposal / Direct Configuration Builder Form
  const [slotDuration, setSlotDuration] = useState(30)
  const [sessions, setSessions] = useState([
    { day_of_week: 0, start_time: '09:00', end_time: '13:00', session_name: 'Morning Session' },
    { day_of_week: 0, start_time: '14:00', end_time: '17:00', session_name: 'Afternoon Session' }
  ])
  const [proposalNotes, setProposalNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  // Leave / Override Form
  const [leaveForm, setLeaveForm] = useState({
    date: new Date().toISOString().split('T')[0],
    override_type: 'LEAVE',
    leave_type: 'Casual Leave',
    start_time: '',
    end_time: '',
    reason: ''
  })
  const [savingLeave, setSavingLeave] = useState(false)

  // Rejection Modal
  const [rejectModalProposal, setRejectModalProposal] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Pre-approval Conflicts Modal
  const [conflictData, setConflictData] = useState(null)
  const [loadingConflicts, setLoadingConflicts] = useState(false)

  // 1. Fetch Doctors list for Admin
  useEffect(() => {
    fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDoctors(data)
          if (data.length > 0 && !selectedDoctorId) {
            setSelectedDoctorId(String(data[0].id))
            setSelectedDoctorObj(data[0])
            setSlotDuration(data[0].slot_duration || 30)
          }
        }
      })
      .catch(console.error)
  }, [])

  // 2. Fetch Data for Active Doctor / Admin View
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const branchParam = activeBranch?.id ? `branch_id=${activeBranch.id}` : ''
      // 1. Fetch Active Schedules
      const schedParams = [
        isAdmin && selectedDoctorId ? `doctor_id=${selectedDoctorId}` : '',
        branchParam
      ].filter(Boolean).join('&')
      const schedUrl = `${API_BASE}/doctor-schedules/${schedParams ? '?' + schedParams : ''}`
      const sRes = await fetch(schedUrl, { headers: getHeaders() })
      if (sRes.ok) {
        const sData = await sRes.json()
        setActiveSchedules(sData)
      }

      // 2. Fetch Proposals
      const propParams = [
        isAdmin && selectedDoctorId ? `doctor_id=${selectedDoctorId}` : '',
        branchParam
      ].filter(Boolean).join('&')
      const propUrl = `${API_BASE}/doctor-schedule-proposals/${propParams ? '?' + propParams : ''}`
      const pRes = await fetch(propUrl, { headers: getHeaders() })
      if (pRes.ok) {
        const pData = await pRes.json()
        setAllProposals(pData)
        setPendingProposals(pData.filter(p => p.status === 'PENDING_APPROVAL'))
      }

      // 3. Fetch Overrides
      const ovParams = [
        selectedDoctorId ? `doctor_id=${selectedDoctorId}` : '',
        branchParam
      ].filter(Boolean).join('&')
      const ovUrl = `${API_BASE}/doctor-date-overrides/${ovParams ? '?' + ovParams : ''}`
      const oRes = await fetch(ovUrl, { headers: getHeaders() })
      if (oRes.ok) {
        const oData = await oRes.json()
        setOverrides(oData)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, selectedDoctorId, activeBranch?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Update selectedDoctorObj when dropdown changes
  const handleDoctorChange = (id) => {
    setSelectedDoctorId(id)
    const doc = doctors.find(d => String(d.id) === String(id))
    setSelectedDoctorObj(doc || null)
    if (doc) setSlotDuration(doc.slot_duration || 30)
  }

  // Session Handlers
  const handleAddSession = () => {
    setSessions(prev => [
      ...prev,
      { day_of_week: 0, start_time: '09:00', end_time: '12:00', session_name: `Session ${prev.length + 1}` }
    ])
  }

  const handleRemoveSession = (idx) => {
    setSessions(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateSession = (idx, field, val) => {
    setSessions(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  // Submit Schedule Proposal (Doctor Mode)
  const handleSubmitProposal = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const payload = {
        proposal_type: 'RECURRING_SCHEDULE',
        slot_duration: parseInt(slotDuration, 10),
        proposed_slots: sessions,
        notes: proposalNotes,
        branch: activeBranch?.id || null
      }
      if (isAdmin && selectedDoctorId) payload.doctor = selectedDoctorId

      const res = await fetch(`${API_BASE}/doctor-schedule-proposals/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: `Schedule proposal for ${activeBranch?.name || 'current branch'} submitted successfully for Administrator approval!` })
        fetchData()
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to submit proposal' })
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Network connection failed' })
    } finally {
      setSaving(false)
    }
  }

  // Direct Schedule Management (Admin Mode)
  const handleDirectScheduleSave = async (e) => {
    e.preventDefault()
    if (!selectedDoctorId) {
      alert('Please select a doctor')
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`${API_BASE}/doctor-schedules/direct/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          doctor: selectedDoctorId,
          branch: activeBranch?.id || null,
          slot_duration: parseInt(slotDuration, 10),
          slots: sessions
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: `Doctor working hours for ${activeBranch?.name || 'current branch'} directly updated and activated immediately!` })
        fetchData()
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to update schedule' })
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Network connection failed' })
    } finally {
      setSaving(false)
    }
  }

  // Withdraw Proposal (Doctor)
  const handleWithdrawProposal = async (proposalId) => {
    if (!window.confirm('Are you sure you want to withdraw this pending schedule proposal?')) return
    try {
      const res = await fetch(`${API_BASE}/doctor-schedule-proposals/${proposalId}/withdraw/`, {
        method: 'POST',
        headers: getHeaders()
      })
      if (res.ok) {
        fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to withdraw proposal')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Pre-approval conflict inspector
  const handleInspectConflicts = async (proposalId) => {
    setLoadingConflicts(true)
    try {
      const res = await fetch(`${API_BASE}/doctor-schedule-proposals/${proposalId}/conflicts/`, {
        headers: getHeaders()
      })
      if (res.ok) {
        setConflictData(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingConflicts(false)
    }
  }

  // Approve Proposal (Admin)
  const handleApproveProposal = async (proposalId) => {
    if (!window.confirm('Approve this proposal? Active doctor schedules will be replaced immediately.')) return
    try {
      const res = await fetch(`${API_BASE}/doctor-schedule-proposals/${proposalId}/approve/`, {
        method: 'POST',
        headers: getHeaders()
      })
      if (res.ok) {
        alert('Proposal approved! Schedule is now live.')
        setConflictData(null)
        fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to approve proposal')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Reject Proposal (Admin)
  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.')
      return
    }
    try {
      const res = await fetch(`${API_BASE}/doctor-schedule-proposals/${rejectModalProposal.id}/reject/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rejection_reason: rejectionReason.trim() })
      })
      if (res.ok) {
        setRejectModalProposal(null)
        setRejectionReason('')
        fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to reject proposal')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Submit Leave / Override Request
  const handleSubmitLeave = async (e) => {
    e.preventDefault()
    setSavingLeave(true)
    try {
      const payload = {
        ...leaveForm,
        doctor: selectedDoctorId || undefined,
        branch: activeBranch?.id || null
      }
      const res = await fetch(`${API_BASE}/doctor-date-overrides/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        alert('Leave/Override request submitted successfully!')
        setLeaveForm({
          date: new Date().toISOString().split('T')[0],
          override_type: 'LEAVE',
          leave_type: 'Casual Leave',
          start_time: '',
          end_time: '',
          reason: ''
        })
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to submit leave request')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingLeave(false)
    }
  }

  // Format Helper
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    try {
      const [h, m] = timeStr.split(':')
      const d = new Date()
      d.setHours(parseInt(h, 10))
      d.setMinutes(parseInt(m, 10))
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return timeStr
    }
  }

  // Check if doctor has a pending proposal
  const ownPendingProposal = pendingProposals.find(p => !selectedDoctorId || String(p.doctor) === String(selectedDoctorId))

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Doctor Slot Scheduling & Approvals</h1>
          <p>Configure recurring sessions, slot durations, date overrides, and administrator approval workflows</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '12px',
              fontWeight: 600,
              color: '#0284c7',
              background: '#e0f2fe',
              padding: '3px 10px',
              borderRadius: '6px',
              border: '1px solid #bae6fd'
            }}>
              🏥 Active Branch: {activeBranch?.name || 'Main Branch'} ({activeBranch?.code || 'MAIN'})
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className={styles.doctorSelector}>
            <label>Doctor:</label>
            <select
              value={selectedDoctorId}
              onChange={e => handleDoctorChange(e.target.value)}
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialization || 'Specialist'})</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Doctor Pending Proposal Notice Banner */}
      {ownPendingProposal && (
        <div className={styles.pendingBanner}>
          <div className={styles.pendingBannerContent}>
            <h4>⏳ Schedule Proposal Pending Approval</h4>
            <p>
              Submitted on {new Date(ownPendingProposal.submitted_at).toLocaleDateString()} with {ownPendingProposal.slot_duration} min slots.
              Your currently active schedule remains bookable while this proposal is reviewed by Clinic Administrators.
            </p>
          </div>
          <button
            onClick={() => handleWithdrawProposal(ownPendingProposal.id)}
            className={styles.withdrawBtn}
          >
            Withdraw Proposal
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className={styles.tabsBar}>
        {isAdmin && (
          <button
            className={`${styles.tabBtn} ${activeTab === 'queue' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            Approval Queue
            {pendingProposals.length > 0 && (
              <span className={styles.tabBadge}>{pendingProposals.length}</span>
            )}
          </button>
        )}
        <button
          className={`${styles.tabBtn} ${activeTab === 'active' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Schedule
        </button>
        {isAdmin ? (
          <button
            className={`${styles.tabBtn} ${activeTab === 'direct' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('direct')}
          >
            Direct Schedule Management
          </button>
        ) : (
          <button
            className={`${styles.tabBtn} ${activeTab === 'propose' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('propose')}
          >
            Propose Schedule Change
          </button>
        )}
        <button
          className={`${styles.tabBtn} ${activeTab === 'leaves' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          Date Overrides & Leaves
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Proposal History
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: 600,
          fontSize: '13px',
          background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {msg.text}
        </div>
      )}

      {/* TAB 1: ADMIN APPROVAL QUEUE */}
      {isAdmin && activeTab === 'queue' && (
        <div className={styles.queueList}>
          {pendingProposals.length === 0 ? (
            <div className={styles.card} style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
                🎉 No proposals pending review. All doctor schedules are up to date!
              </p>
            </div>
          ) : (
            pendingProposals.map(prop => (
              <div key={prop.id} className={styles.proposalCard}>
                <div className={styles.proposalHeader}>
                  <div className={styles.proposalMeta}>
                    <h4>Dr. {prop.doctor_name}</h4>
                    <p>Submitted by <strong>{prop.submitted_by_username || 'Doctor'}</strong> · {new Date(prop.submitted_at).toLocaleString()}</p>
                    <p style={{ marginTop: 4 }}>Slot Duration: <strong>{prop.slot_duration} minutes</strong></p>
                  </div>
                  <span className={`${styles.statusPill} ${styles.pending}`}>Pending Approval</span>
                </div>

                {prop.notes && (
                  <p style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic', marginBottom: '14px' }}>
                    Note from submitter: "{prop.notes}"
                  </p>
                )}

                {/* Proposed Sessions Grid */}
                <div style={{ marginBottom: 16 }}>
                  <h5 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#334155' }}>Proposed Working Hours:</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {prop.proposed_slots.map((s, idx) => (
                      <div key={idx} className={styles.sessionChip}>
                        <span>{DAYS[s.day_of_week]}:</span>
                        <span>{s.session_name || 'Session'} ({formatTime(s.start_time)} - {formatTime(s.end_time)})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pre-approval Conflict Inspector */}
                <div style={{ marginBottom: 16 }}>
                  <button
                    onClick={() => handleInspectConflicts(prop.id)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Inspect Conflicts with Existing Bookings
                  </button>
                </div>

                {conflictData && conflictData.proposal_id === String(prop.id) && (
                  <div className={styles.conflictAlert}>
                    {conflictData.has_conflicts ? (
                      <div>
                        <strong>⚠️ {conflictData.conflict_count} Conflicting Appointment(s) Detected!</strong>
                        <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: 12 }}>
                          {conflictData.conflicts.map((c, ci) => (
                            <li key={ci}>
                              {c.patient_name} on {c.date} at {c.time}: {c.reason}
                            </li>
                          ))}
                        </ul>
                        <p style={{ margin: '6px 0 0', fontSize: 11, opacity: 0.9 }}>
                          Note: Approving will NOT delete or silently alter these appointments. Reschedule them safely with patients.
                        </p>
                      </div>
                    ) : (
                      <span style={{ color: '#166534' }}>✅ No conflicts found with upcoming booked appointments. Safe to approve!</span>
                    )}
                  </div>
                )}

                {/* Approval & Rejection Actions */}
                <div className={styles.actionRow}>
                  <button
                    onClick={() => setRejectModalProposal(prop)}
                    className={styles.rejectBtn}
                  >
                    Reject with Reason
                  </button>
                  <button
                    onClick={() => handleApproveProposal(prop.id)}
                    className={styles.approveBtn}
                  >
                    ✓ Approve & Activate
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE SCHEDULE */}
      {activeTab === 'active' && (
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3>Currently Approved Working Schedule</h3>
              <p className={styles.cardSub}>
                Only appointments scheduled within these approved active hours are bookable by reception and patients.
              </p>
            </div>
            <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
              Slot Duration: {selectedDoctorObj?.slot_duration || 30} mins
            </div>
          </div>

          <div className={styles.weekGrid}>
            {DAYS.map((dayName, dayIdx) => {
              const daySlots = activeSchedules.filter(s => s.day_of_week === dayIdx && s.is_active)
              return (
                <div key={dayIdx} className={styles.dayCard}>
                  <div className={styles.dayName}>{dayName}</div>
                  <div className={styles.daySessions}>
                    {daySlots.length === 0 ? (
                      <span className={styles.emptyDay}>No active hours scheduled (Off)</span>
                    ) : (
                      daySlots.map(slot => (
                        <div key={slot.id} className={styles.sessionChip}>
                          <span>{slot.session_name || 'Working Hours'}:</span>
                          <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PROPOSE / DIRECT SCHEDULE BUILDER */}
      {(activeTab === 'propose' || activeTab === 'direct') && (
        <div className={styles.contentGrid}>
          {/* Builder Form */}
          <div className={styles.card}>
            <h3>{isAdmin ? 'Direct Schedule Configuration' : 'Propose Working Hours'}</h3>
            <p className={styles.cardSub}>
              {isAdmin
                ? 'Changes saved here activate immediately with zero wait time.'
                : 'Propose your recurring schedule. Changes will become live upon Administrator approval.'}
            </p>

            <form onSubmit={isAdmin ? handleDirectScheduleSave : handleSubmitProposal}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Appointment Slot Duration
                </label>
                <select
                  value={slotDuration}
                  onChange={e => setSlotDuration(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                >
                  <option value={15}>15 Minutes per slot</option>
                  <option value={20}>20 Minutes per slot</option>
                  <option value={30}>30 Minutes per slot (Recommended)</option>
                  <option value={45}>45 Minutes per slot</option>
                  <option value={60}>60 Minutes per slot</option>
                </select>
              </div>

              {/* Sessions List */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Configured Sessions</label>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Non-overlapping sessions</span>
                </div>

                {sessions.map((sess, idx) => (
                  <div key={idx} className={styles.sessionItem}>
                    <div className={styles.sessionItemHeader}>
                      <input
                        type="text"
                        value={sess.session_name}
                        onChange={e => handleUpdateSession(idx, 'session_name', e.target.value)}
                        className={styles.sessionNameInput}
                        placeholder="e.g. Morning OPD"
                      />
                      {sessions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSession(idx)}
                          className={styles.removeSessionBtn}
                          title="Remove session"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className={styles.timeRow}>
                      <select
                        value={sess.day_of_week}
                        onChange={e => handleUpdateSession(idx, 'day_of_week', parseInt(e.target.value, 10))}
                        style={{ flex: 1.5 }}
                      >
                        {DAYS.map((d, di) => (
                          <option key={di} value={di}>{d}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={sess.start_time}
                        onChange={e => handleUpdateSession(idx, 'start_time', e.target.value)}
                        style={{ flex: 1 }}
                        required
                      />
                      <span style={{ color: '#94a3b8' }}>to</span>
                      <input
                        type="time"
                        value={sess.end_time}
                        onChange={e => handleUpdateSession(idx, 'end_time', e.target.value)}
                        style={{ flex: 1 }}
                        required
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSession}
                  className={styles.addSessionBtn}
                >
                  + Add Another Session
                </button>
              </div>

              {!isAdmin && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    Notes / Reason for Proposal (Optional)
                  </label>
                  <textarea
                    value={proposalNotes}
                    onChange={e => setProposalNotes(e.target.value)}
                    placeholder="e.g. Adjusting morning OPD timings to accommodate OT schedule..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 60, boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className={styles.submitBtn}
              >
                {saving
                  ? 'Saving...'
                  : isAdmin
                    ? '⚡ Save & Activate Schedule'
                    : '📤 Submit Proposal for Approval'}
              </button>
            </form>
          </div>

          {/* Preview of Configured Sessions */}
          <div className={styles.card}>
            <h3>Schedule Preview</h3>
            <p className={styles.cardSub}>Organized by day of week</p>
            <div className={styles.weekGrid}>
              {DAYS.map((dayName, dayIdx) => {
                const daySessions = sessions.filter(s => s.day_of_week === dayIdx)
                return (
                  <div key={dayIdx} className={styles.dayCard}>
                    <div className={styles.dayName}>{dayName}</div>
                    <div className={styles.daySessions}>
                      {daySessions.length === 0 ? (
                        <span className={styles.emptyDay}>No sessions</span>
                      ) : (
                        daySessions.map((s, si) => (
                          <div key={si} className={styles.sessionChip}>
                            <span>{s.session_name}:</span>
                            <span>{formatTime(s.start_time)} - {formatTime(s.end_time)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATE OVERRIDES & LEAVES */}
      {activeTab === 'leaves' && (
        <div className={styles.contentGrid}>
          {/* Submit Leave / Override Form */}
          <div className={styles.card}>
            <h3>Request Leave or Blocked Time</h3>
            <p className={styles.cardSub}>
              Block specific dates or specific hour ranges without altering your recurring schedule.
            </p>
            <form onSubmit={handleSubmitLeave}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Target Date
                </label>
                <input
                  type="date"
                  value={leaveForm.date}
                  onChange={e => setLeaveForm({ ...leaveForm, date: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Override Type
                </label>
                <select
                  value={leaveForm.override_type}
                  onChange={e => setLeaveForm({ ...leaveForm, override_type: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                >
                  <option value="LEAVE">Full Day Leave</option>
                  <option value="BLOCKED">Blocked Partial Hours</option>
                  <option value="AVAILABLE">Extra Available Hours</option>
                </select>
              </div>

              {leaveForm.override_type === 'LEAVE' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    Leave Type
                  </label>
                  <select
                    value={leaveForm.leave_type}
                    onChange={e => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                    <option value="Conference / Training">Conference / Training</option>
                  </select>
                </div>
              )}

              {leaveForm.override_type === 'BLOCKED' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={leaveForm.start_time}
                      onChange={e => setLeaveForm({ ...leaveForm, start_time: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={leaveForm.end_time}
                      onChange={e => setLeaveForm({ ...leaveForm, end_time: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Reason
                </label>
                <input
                  type="text"
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="e.g. Attending dental surgery seminar"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingLeave}
                className={styles.submitBtn}
              >
                {savingLeave ? 'Submitting...' : 'Submit Override / Leave'}
              </button>
            </form>
          </div>

          {/* List of Existing Overrides */}
          <div className={styles.card}>
            <h3>Active & Pending Overrides</h3>
            <p className={styles.cardSub}>Doctor leaves and clinic blocked windows</p>
            {overrides.length === 0 ? (
              <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No date-specific overrides recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {overrides.map(ov => (
                  <div
                    key={ov.id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{ov.date}</span>
                        <span className={`${styles.statusPill} ${styles[ov.status.toLowerCase()] || styles.pending}`}>
                          {ov.status}
                        </span>
                        <span style={{ fontSize: 11, background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                          {ov.override_type} {ov.leave_type ? `(${ov.leave_type})` : ''}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                        {ov.reason || 'No reason provided'}
                        {ov.start_time && ` · ${formatTime(ov.start_time)} to ${formatTime(ov.end_time)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PROPOSAL HISTORY */}
      {activeTab === 'history' && (
        <div className={styles.card}>
          <h3>Schedule Change & Proposal History</h3>
          <p className={styles.cardSub}>Complete audit trail of all doctor-submitted and administrator schedule revisions</p>

          {allProposals.length === 0 ? (
            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No proposal history found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {allProposals.map(prop => (
                <div
                  key={prop.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Dr. {prop.doctor_name}</span>
                      <span className={`${styles.statusPill} ${styles[prop.status.toLowerCase()] || styles.pending}`}>
                        {prop.status}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        Submitted {new Date(prop.submitted_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p style={{ margin: '4px 0', fontSize: 12, color: '#475569' }}>
                      Slot Duration: {prop.slot_duration} mins · {prop.proposed_slots.length} recurring session(s)
                    </p>

                    {prop.rejection_reason && (
                      <div style={{ marginTop: 6, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#991b1b' }}>
                        <strong>Rejection Reason:</strong> {prop.rejection_reason}
                      </div>
                    )}

                    {prop.reviewed_at && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>
                        Reviewed by {prop.reviewed_by_username || 'Administrator'} on {new Date(prop.reviewed_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {prop.status === 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => handleWithdrawProposal(prop.id)}
                      className={styles.withdrawBtn}
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalProposal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Reject Schedule Proposal</h3>
            <p>
              Please provide a clear reason for rejecting Dr. {rejectModalProposal.doctor_name}'s schedule proposal.
              The doctor will receive an in-app notification with this reason.
            </p>
            <textarea
              className={styles.modalTextarea}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Overlapping coverage with other specialists, please adjust afternoon slots..."
              required
            />
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => { setRejectModalProposal(null); setRejectionReason(''); }}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className={styles.rejectBtn}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
