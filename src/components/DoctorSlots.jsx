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

  // Navigation Tabs: 'direct' (Weekly Schedule for Admin) | 'propose' (Weekly Schedule for Doctor) | 'active' | 'queue' | 'leaves' | 'history'
  const [activeTab, setActiveTab] = useState(isAdmin ? 'direct' : 'propose')

  // Schedules and Proposals State
  const [activeSchedules, setActiveSchedules] = useState([])
  const [pendingProposals, setPendingProposals] = useState([])
  const [allProposals, setAllProposals] = useState([])
  const [overrides, setOverrides] = useState([])
  const [loading, setLoading] = useState(true)

  // ════════ 7-DAY WEEKLY SCHEDULE STATE ════════
  const [slotDuration, setSlotDuration] = useState(30)
  const [proposalNotes, setProposalNotes] = useState('')
  const [weeklySchedule, setWeeklySchedule] = useState(() =>
    DAYS.map((dayName, dayIdx) => ({
      day_of_week: dayIdx,
      day_name: dayName,
      is_available: dayIdx < 5, // Mon-Fri default available, Sat-Sun off
      sessions: dayIdx < 5 ? [{ start_time: '09:00', end_time: '13:00', session_name: 'Morning Session' }] : []
    }))
  )

  const [savingWeekly, setSavingWeekly] = useState(false)
  const [savingDayIdx, setSavingDayIdx] = useState(null)
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

  // 3. Populate Weekly Schedule editor from activeSchedules
  useEffect(() => {
    if (activeSchedules) {
      const newWeekly = DAYS.map((dayName, dayIdx) => {
        const daySlots = activeSchedules.filter(s => s.day_of_week === dayIdx && s.is_active)
        if (daySlots.length > 0) {
          return {
            day_of_week: dayIdx,
            day_name: dayName,
            is_available: true,
            sessions: daySlots.map(s => ({
              id: s.id,
              start_time: s.start_time ? s.start_time.slice(0, 5) : '09:00',
              end_time: s.end_time ? s.end_time.slice(0, 5) : '13:00',
              session_name: s.session_name || 'Regular Session'
            }))
          }
        } else {
          return {
            day_of_week: dayIdx,
            day_name: dayName,
            is_available: false,
            sessions: []
          }
        }
      })
      setWeeklySchedule(newWeekly)
    }
  }, [activeSchedules])

  // Update selectedDoctorObj when dropdown changes
  const handleDoctorChange = (id) => {
    setSelectedDoctorId(id)
    const doc = doctors.find(d => String(d.id) === String(id))
    setSelectedDoctorObj(doc || null)
    if (doc) setSlotDuration(doc.slot_duration || 30)
  }

  // ════════ 7-DAY WEEKLY SCHEDULE HANDLERS ════════

  // Toggle Day Available / Unavailable
  const handleToggleDay = (dayIdx) => {
    setWeeklySchedule(prev => prev.map(d => {
      if (d.day_of_week !== dayIdx) return d
      const nextAvailable = !d.is_available
      return {
        ...d,
        is_available: nextAvailable,
        sessions: nextAvailable && d.sessions.length === 0
          ? [{ start_time: '09:00', end_time: '13:00', session_name: 'Regular Session' }]
          : d.sessions
      }
    }))
  }

  // Add Session / Time Range to a specific day
  const handleAddSessionToDay = (dayIdx) => {
    setWeeklySchedule(prev => prev.map(d => {
      if (d.day_of_week !== dayIdx) return d
      const count = d.sessions.length + 1
      const defaultStart = count === 2 ? '17:00' : '14:00'
      const defaultEnd = count === 2 ? '20:00' : '17:00'
      return {
        ...d,
        is_available: true,
        sessions: [
          ...d.sessions,
          { start_time: defaultStart, end_time: defaultEnd, session_name: `Session ${count}` }
        ]
      }
    }))
  }

  // Remove Session from a specific day
  const handleRemoveSessionFromDay = (dayIdx, sessionIdx) => {
    setWeeklySchedule(prev => prev.map(d => {
      if (d.day_of_week !== dayIdx) return d
      const filtered = d.sessions.filter((_, i) => i !== sessionIdx)
      return {
        ...d,
        sessions: filtered,
        is_available: filtered.length > 0
      }
    }))
  }

  // Update a session field on a specific day
  const handleUpdateDaySession = (dayIdx, sessionIdx, field, val) => {
    setWeeklySchedule(prev => prev.map(d => {
      if (d.day_of_week !== dayIdx) return d
      const updated = d.sessions.map((s, i) => i === sessionIdx ? { ...s, [field]: val } : s)
      return { ...d, sessions: updated }
    }))
  }

  // Helper validation for day sessions
  const validateDaySessions = (day) => {
    if (!day.is_available || day.sessions.length === 0) return null
    for (let i = 0; i < day.sessions.length; i++) {
      const s = day.sessions[i]
      if (!s.start_time || !s.end_time) {
        return `${day.day_name}: Session #${i + 1} is missing start or end time.`
      }
      if (s.start_time >= s.end_time) {
        return `${day.day_name}: Session #${i + 1} start time (${s.start_time}) must be earlier than end time (${s.end_time}).`
      }
    }
    // Overlap check
    const sorted = [...day.sessions].sort((a, b) => a.start_time.localeCompare(b.start_time))
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].end_time > sorted[i + 1].start_time) {
        return `${day.day_name}: Overlapping sessions detected (${sorted[i].session_name} and ${sorted[i + 1].session_name}). Time ranges must be separated.`
      }
    }
    return null
  }

  // ════════ ACTION 1: SAVE SINGLE DAY ONLY (DAY_SPECIFIC) ════════
  const handleSaveSingleDay = async (dayIdx) => {
    const day = weeklySchedule.find(d => d.day_of_week === dayIdx)
    if (!day) return

    const err = validateDaySessions(day)
    if (err) {
      alert(err)
      return
    }

    setSavingDayIdx(dayIdx)
    setMsg(null)

    const payloadSlots = day.is_available
      ? day.sessions.map(s => ({
          day_of_week: dayIdx,
          start_time: s.start_time,
          end_time: s.end_time,
          session_name: s.session_name || 'Regular Session'
        }))
      : []

    try {
      if (isAdmin) {
        if (!selectedDoctorId) {
          alert('Please select a doctor')
          setSavingDayIdx(null)
          return
        }

        const res = await fetch(`${API_BASE}/doctor-schedules/direct/`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            mode: 'DAY_SPECIFIC',
            doctor: selectedDoctorId,
            branch: activeBranch?.id || null,
            day_of_week: dayIdx,
            is_available: day.is_available,
            slot_duration: parseInt(slotDuration, 10),
            slots: payloadSlots
          })
        })
        const data = await res.json()
        if (res.ok) {
          setMsg({
            type: 'success',
            text: `✅ ${day.day_name} schedule saved & activated! All other 6 days remain completely unchanged.`
          })
          fetchData()
        } else {
          setMsg({ type: 'error', text: data.error || `Failed to update ${day.day_name}` })
        }
      } else {
        // Doctor Mode: Submit day-specific proposal
        const res = await fetch(`${API_BASE}/doctor-schedule-proposals/`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            mode: 'DAY_SPECIFIC',
            day_of_week: dayIdx,
            proposal_type: 'RECURRING_SCHEDULE',
            slot_duration: parseInt(slotDuration, 10),
            proposed_slots: payloadSlots,
            notes: proposalNotes || `Proposed schedule adjustment for ${day.day_name}`,
            branch: activeBranch?.id || null
          })
        })
        const data = await res.json()
        if (res.ok) {
          setMsg({
            type: 'success',
            text: `📤 Proposal for ${day.day_name} submitted successfully for Administrator approval!`
          })
          fetchData()
        } else {
          setMsg({ type: 'error', text: data.error || `Failed to submit proposal for ${day.day_name}` })
        }
      }
    } catch {
      setMsg({ type: 'error', text: 'Network connection failed' })
    } finally {
      setSavingDayIdx(null)
    }
  }

  // ════════ ACTION 2: SAVE ENTIRE WEEKLY SCHEDULE (FULL_WEEK) ════════
  const handleSaveWeeklySchedule = async (e) => {
    if (e) e.preventDefault()

    // Validate all 7 days
    for (const day of weeklySchedule) {
      const err = validateDaySessions(day)
      if (err) {
        alert(err)
        return
      }
    }

    setSavingWeekly(true)
    setMsg(null)

    // Collect all sessions across all active days
    const allSlots = []
    weeklySchedule.forEach(day => {
      if (day.is_available && day.sessions.length > 0) {
        day.sessions.forEach(s => {
          allSlots.push({
            day_of_week: day.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            session_name: s.session_name || 'Regular Session'
          })
        })
      }
    })

    try {
      if (isAdmin) {
        if (!selectedDoctorId) {
          alert('Please select a doctor')
          setSavingWeekly(false)
          return
        }

        const res = await fetch(`${API_BASE}/doctor-schedules/direct/`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            mode: 'FULL_WEEK',
            doctor: selectedDoctorId,
            branch: activeBranch?.id || null,
            slot_duration: parseInt(slotDuration, 10),
            slots: allSlots
          })
        })
        const data = await res.json()
        if (res.ok) {
          setMsg({
            type: 'success',
            text: `⚡ Complete weekly schedule (all 7 days) saved & activated successfully for ${activeBranch?.name || 'current branch'}!`
          })
          fetchData()
        } else {
          setMsg({ type: 'error', text: data.error || 'Failed to update weekly schedule' })
        }
      } else {
        // Doctor Mode: Submit full-week proposal
        const res = await fetch(`${API_BASE}/doctor-schedule-proposals/`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            mode: 'FULL_WEEK',
            proposal_type: 'RECURRING_SCHEDULE',
            slot_duration: parseInt(slotDuration, 10),
            proposed_slots: allSlots,
            notes: proposalNotes || 'Full 7-day recurring schedule proposal',
            branch: activeBranch?.id || null
          })
        })
        const data = await res.json()
        if (res.ok) {
          setMsg({
            type: 'success',
            text: `📤 Complete 7-day schedule proposal submitted successfully for Administrator approval!`
          })
          fetchData()
        } else {
          setMsg({ type: 'error', text: data.error || 'Failed to submit proposal' })
        }
      }
    } catch {
      setMsg({ type: 'error', text: 'Network connection failed' })
    } finally {
      setSavingWeekly(false)
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
    if (!window.confirm('Approve this proposal? Active doctor schedules will be updated immediately.')) return
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

  const ownPendingProposal = pendingProposals.find(p => !selectedDoctorId || String(p.doctor) === String(selectedDoctorId))

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Doctor Weekly Slot Arrangement</h1>
          <p>Configure recurring weekly hours across all seven days, slot durations, date overrides, and approvals</p>
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
            <label>Select Doctor:</label>
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
              Submitted on {new Date(ownPendingProposal.submitted_at).toLocaleDateString()} with {ownPendingProposal.slot_duration} min slots ({ownPendingProposal.schedule_mode || 'Schedule'}).
              Your currently active schedule remains bookable while this proposal is reviewed by Administrators.
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
        <button
          className={`${styles.tabBtn} ${(activeTab === 'direct' || activeTab === 'propose') ? styles.activeTab : ''}`}
          onClick={() => setActiveTab(isAdmin ? 'direct' : 'propose')}
        >
          {isAdmin ? '⚙️ Weekly Schedule Manager' : '⚙️ Propose Weekly Schedule'}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'active' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('active')}
        >
          👁️ Active Schedule View
        </button>
        {isAdmin && (
          <button
            className={`${styles.tabBtn} ${activeTab === 'queue' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            📋 Approval Queue
            {pendingProposals.length > 0 && (
              <span className={styles.tabBadge}>{pendingProposals.length}</span>
            )}
          </button>
        )}
        <button
          className={`${styles.tabBtn} ${activeTab === 'leaves' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          📅 Date Overrides &amp; Leaves
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 Proposal History
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

      {/* ════════ TAB 1: 7-DAY WEEKLY SCHEDULE CONFIGURATION ════════ */}
      {(activeTab === 'direct' || activeTab === 'propose') && (
        <div>
          {/* Top Configuration Controls */}
          <div className={styles.card} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px' }}>
                  {isAdmin
                    ? `Weekly Schedule: Dr. ${selectedDoctorObj?.name || 'Selected Doctor'}`
                    : 'Configure Your Weekly Schedule'}
                </h3>
                <p className={styles.cardSub} style={{ margin: 0 }}>
                  Configure all 7 days with multiple time ranges and break intervals. Save each day individually or save the entire week together.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  Slot Duration:
                </label>
                <select
                  value={slotDuration}
                  onChange={e => setSlotDuration(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#ffffff'
                  }}
                >
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes (Recommended)</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* 7 Days Stacked List */}
          <div className={styles.weeklyEditorList}>
            {weeklySchedule.map((day) => {
              const isDaySaving = savingDayIdx === day.day_of_week
              return (
                <div
                  key={day.day_of_week}
                  className={`${styles.dayConfigCard} ${!day.is_available ? styles.dayUnavailable : ''}`}
                >
                  {/* Day Header Row */}
                  <div className={styles.dayConfigHeader}>
                    <div className={styles.dayTitleGroup}>
                      <span className={styles.dayLabel}>{day.day_name}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleDay(day.day_of_week)}
                        className={`${styles.dayToggleBtn} ${day.is_available ? styles.isAvailable : styles.isOff}`}
                        title="Click to toggle Available / Unavailable"
                      >
                        {day.is_available ? '● Available' : '○ Unavailable / Off'}
                      </button>
                    </div>

                    <div className={styles.dayActionGroup}>
                      {day.is_available && (
                        <button
                          type="button"
                          onClick={() => handleAddSessionToDay(day.day_of_week)}
                          className={styles.addRangeBtn}
                          title="Add another time range for this day"
                        >
                          + Add Time Range
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isDaySaving || savingWeekly}
                        onClick={() => handleSaveSingleDay(day.day_of_week)}
                        className={styles.saveDayBtn}
                        title={`Save only ${day.day_name} without affecting other days`}
                      >
                        {isDaySaving ? 'Saving...' : `💾 Save ${day.day_name} Only`}
                      </button>
                    </div>
                  </div>

                  {/* Day Sessions List or Unavailable Notice */}
                  {day.is_available ? (
                    <div className={styles.daySessionsList}>
                      {day.sessions.map((sess, sIdx) => (
                        <div key={sIdx} className={styles.sessionCard}>
                          <input
                            type="text"
                            value={sess.session_name}
                            onChange={e => handleUpdateDaySession(day.day_of_week, sIdx, 'session_name', e.target.value)}
                            placeholder="e.g. Morning OPD, Evening Clinic"
                          />
                          <input
                            type="time"
                            value={sess.start_time}
                            onChange={e => handleUpdateDaySession(day.day_of_week, sIdx, 'start_time', e.target.value)}
                            required
                          />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>to</span>
                          <input
                            type="time"
                            value={sess.end_time}
                            onChange={e => handleUpdateDaySession(day.day_of_week, sIdx, 'end_time', e.target.value)}
                            required
                          />
                          {day.sessions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSessionFromDay(day.day_of_week, sIdx)}
                              className={styles.removeSessionBtn}
                              title="Delete this session"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.unavailableBanner}>
                      Doctor is marked <strong>Unavailable / Off</strong> on {day.day_name}s (0 slots will be generated).
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom Actions Card */}
          <div className={styles.card} style={{ marginTop: 24, padding: 20 }}>
            {!isAdmin && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Notes / Reason for Proposal (Optional)
                </label>
                <textarea
                  value={proposalNotes}
                  onChange={e => setProposalNotes(e.target.value)}
                  placeholder="e.g. Revised schedule to accommodate surgery sessions..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    minHeight: 60,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                  Save All 7 Days
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Submits and validates all seven days together in a single atomic database transaction.
                </p>
              </div>

              <button
                type="button"
                disabled={savingWeekly || savingDayIdx !== null}
                onClick={handleSaveWeeklySchedule}
                className={styles.submitBtn}
                style={{ width: 'auto', minWidth: 260, padding: '12px 24px', fontSize: 14 }}
              >
                {savingWeekly
                  ? 'Saving Weekly Schedule...'
                  : isAdmin
                    ? '⚡ Save Entire Weekly Schedule (All 7 Days)'
                    : '📤 Submit Full Weekly Schedule for Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ TAB 2: ACTIVE SCHEDULE OVERVIEW ════════ */}
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

      {/* ════════ TAB 3: ADMIN APPROVAL QUEUE ════════ */}
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
                    <p>
                      Submitted by <strong>{prop.submitted_by_username || 'Doctor'}</strong> · {new Date(prop.submitted_at).toLocaleString()}
                    </p>
                    <p style={{ marginTop: 4 }}>
                      Mode: <strong>{prop.schedule_mode === 'DAY_SPECIFIC' ? `Day-Specific (${DAYS[prop.target_day]})` : 'Full Weekly Schedule'}</strong> · Slot Duration: <strong>{prop.slot_duration} minutes</strong>
                    </p>
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
                  <h5 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#334155' }}>
                    Proposed Working Hours:
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {prop.proposed_slots.length === 0 ? (
                      <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>Marked as Unavailable / Day Off</span>
                    ) : (
                      prop.proposed_slots.map((s, idx) => (
                        <div key={idx} className={styles.sessionChip}>
                          <span>{DAYS[s.day_of_week]}:</span>
                          <span>{s.session_name || 'Session'} ({formatTime(s.start_time)} - {formatTime(s.end_time)})</span>
                        </div>
                      ))
                    )}
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
                    ✓ Approve &amp; Activate
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ════════ TAB 4: DATE OVERRIDES & LEAVES ════════ */}
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

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Reason / Notes
                </label>
                <textarea
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Reason for leave or blocked hours..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 60, boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={savingLeave}
                className={styles.submitBtn}
              >
                {savingLeave ? 'Submitting...' : 'Submit Leave / Override'}
              </button>
            </form>
          </div>

          {/* Overrides List */}
          <div className={styles.card}>
            <h3>Active &amp; Approved Overrides</h3>
            <p className={styles.cardSub}>Date exceptions currently applied to appointment slot generation</p>
            {overrides.length === 0 ? (
              <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No active overrides or leaves configured.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {overrides.map(ov => (
                  <div key={ov.id} className={styles.overrideItem}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{ov.date}</span>
                        <span className={`${styles.statusPill} ${ov.override_type === 'LEAVE' ? styles.rejected : styles.approved}`}>
                          {ov.override_type}
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

      {/* ════════ TAB 5: PROPOSAL HISTORY ════════ */}
      {activeTab === 'history' && (
        <div className={styles.card}>
          <h3>Schedule Change &amp; Proposal History</h3>
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
                      Mode: {prop.schedule_mode === 'DAY_SPECIFIC' ? `Day-Specific (${DAYS[prop.target_day]})` : 'Full Weekly'} · Slot Duration: {prop.slot_duration} mins · {prop.proposed_slots.length} recurring session(s)
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
