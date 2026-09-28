import { useState, useEffect } from 'react'
import styles from './DoctorSlots.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function DoctorSlots() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  const isAdmin = user.role === 'Admin'

  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')

  const [form, setForm] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00'
  })
  const [saving, setSaving] = useState(false)

  const fetchSchedules = async () => {
    try {
      let url = `${API_BASE}/doctor-schedules/`
      if (isAdmin) {
        if (!selectedDoctorId) {
          setSchedules([])
          setLoading(false)
          return
        }
        url += `?doctor_id=${selectedDoctorId}`
      }
      
      const res = await fetch(url, { headers: getHeaders() })
      if (res.ok) {
        setSchedules(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
        .then(r => r.json())
        .then(data => setDoctors(data))
        .catch(console.error)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchSchedules()
  }, [selectedDoctorId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const daysToCreate = form.day_of_week === -1 ? [0, 1, 2, 3, 4, 5, 6] : [form.day_of_week];
      const promises = daysToCreate.map(day => {
        const payload = { ...form, day_of_week: day }
        if (isAdmin) payload.doctor = selectedDoctorId

        return fetch(`${API_BASE}/doctor-schedules/`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }).then(res => {
          if (!res.ok) throw new Error('Failed to add slot')
          return res
        })
      });

      await Promise.all(promises);
      fetchSchedules()
    } catch (err) {
      console.error(err)
      alert('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slot?')) return
    try {
      const res = await fetch(`${API_BASE}/doctor-schedules/${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (res.ok) {
        fetchSchedules()
      } else {
        alert('Failed to delete')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(h, 10))
    date.setMinutes(parseInt(m, 10))
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const grouped = DAYS.map((day, index) => ({
    day,
    slots: schedules.filter(s => s.day_of_week === index).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }))

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Doctor Slots</h1>
          <p>Manage availability and working hours</p>
        </div>
        {isAdmin && (
          <div style={{ marginTop: 16 }}>
            <label style={{ marginRight: 10, fontWeight: 600 }}>Select Doctor:</label>
            <select
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
            >
              <option value="">-- Choose a doctor --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {(!isAdmin || selectedDoctorId) && (
        <div className={styles.content}>
        <div className={styles.formCard}>
          <h3>Add New Slot</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Day of Week</label>
              <select
                value={form.day_of_week}
                onChange={e => setForm({ ...form, day_of_week: parseInt(e.target.value, 10) })}
              >
                <option value={-1}>Everyday (Mon-Sun)</option>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={saving} className={styles.addBtn}>
              {saving ? 'Adding...' : 'Add Slot'}
            </button>
          </form>
        </div>

        <div className={styles.scheduleList}>
          {loading ? (
            <div className={styles.loading}>Loading schedules...</div>
          ) : (
            grouped.map(group => (
              <div key={group.day} className={styles.dayCard}>
                <div className={styles.dayHeader}>{group.day}</div>
                <div className={styles.slotGrid}>
                  {group.slots.length === 0 ? (
                    <div className={styles.emptySlot}>No slots scheduled</div>
                  ) : (
                    group.slots.map(slot => (
                      <div key={slot.id} className={styles.slotTag}>
                        <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                        <button onClick={() => handleDelete(slot.id)} className={styles.deleteBtn}>✕</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      )}
    </div>
  )
}
