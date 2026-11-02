import { useState, useEffect } from 'react'
import styles from './Pharmacy.module.css' // Reusing styles for consistency

const API = 'http://127.0.0.1:8000/api'

export default function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newDoctor, setNewDoctor] = useState({
    name: '', color: 'var(--slate-900)', phone: '', email: '',
    specialization: '', qualification: '', experience_years: 0,
    availability: '', consultation_fee: 500,
    username: '', password: ''
  })

  // Scheduling State
  const [showScheduleFor, setShowScheduleFor] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 0, start_time: '09:00', end_time: '17:00'
  })

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/doctors/`)
      const data = await res.json()
      setDoctors(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!newDoctor.name) {
      alert('Name is required')
      return
    }
    try {
      const res = await fetch(`${API}/doctor/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoctor)
      })
      if (res.ok) {
        setShowAdd(false)
        setNewDoctor({
          name: '', color: 'var(--slate-900)', phone: '', email: '',
          specialization: '', qualification: '', experience_years: 0,
          availability: '', consultation_fee: 500
        })
        fetchDoctors()
      } else {
        const err = await res.json()
        alert(JSON.stringify(err))
      }
    } catch (e) { console.error(e) }
  }

  const openScheduleModal = async (doctor) => {
    setShowScheduleFor(doctor)
    fetchSchedules(doctor.id)
  }

  const fetchSchedules = async (doctorId) => {
    try {
      const res = await fetch(`${API}/doctor-schedules/?doctor_id=${doctorId}`)
      const data = await res.json()
      setSchedules(data)
    } catch (e) { console.error(e) }
  }

  const handleAddSchedule = async (e) => {
    e.preventDefault()
    try {
      const daysToCreate = newSchedule.day_of_week === -1 ? [0, 1, 2, 3, 4, 5, 6] : [newSchedule.day_of_week];
      
      const promises = daysToCreate.map(day => 
        fetch(`${API}/doctor-schedules/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day_of_week: day,
            start_time: newSchedule.start_time,
            end_time: newSchedule.end_time,
            doctor: showScheduleFor.id
          })
        })
      );
      
      await Promise.all(promises);
      fetchSchedules(showScheduleFor.id)
    } catch (e) { console.error(e) }
  }

  const handleDeleteSchedule = async (id) => {
    try {
      const res = await fetch(`${API}/doctor-schedules/${id}/`, { method: 'DELETE' })
      if (res.ok) fetchSchedules(showScheduleFor.id)
    } catch (e) { console.error(e) }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Doctor Management</h1>
          <p>Manage Doctors and their details</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add Doctor</button>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Contact</th>
              <th>Fee</th>
              <th>Experience</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6">Loading doctors...</td></tr> : doctors.map(d => (
              <tr key={d.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: d.color }}></div>
                    <strong>{d.name}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{d.qualification}</div>
                </td>
                <td>{d.specialization || 'N/A'}</td>
                <td>
                  <div>{d.phone || 'N/A'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{d.email}</div>
                </td>
                <td>₹{d.consultation_fee}</td>
                <td>{d.experience_years} Yrs</td>
                <td>{d.availability || 'N/A'}</td>
                <td>
                  <button className={styles.saveBtn} style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => openScheduleModal(d)}>
                    Schedules
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className={styles.overlay}>
          <div className={styles.modal} style={{ maxWidth: '650px', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(to right, #f8fafc, #ffffff)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <h2 style={{ margin: 0, color: 'var(--slate-900)', fontSize: '1.5rem', fontWeight: '600' }}>Add New Doctor</h2>
              <p style={{ color: '#64748b', marginTop: '4px', fontSize: '0.9rem' }}>Enter the doctor's profile and login credentials.</p>
            </div>
            <form onSubmit={handleSave} style={{ padding: '24px 32px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label style={{ fontWeight: '500', color: 'var(--slate-800)' }}>Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Dr. John Doe" 
                    value={newDoctor.name}
                    onChange={e => setNewDoctor({...newDoctor, name: e.target.value})}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div className={styles.field}>
                  <label style={{ fontWeight: '500', color: 'var(--slate-800)' }}>Color Code</label>
                  <input 
                    type="color" 
                    value={newDoctor.color}
                    onChange={e => setNewDoctor({...newDoctor, color: e.target.value})}
                    style={{ padding: '0', height: '42px', width: '100%', cursor: 'pointer', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div style={{ margin: '20px 0', padding: '16px', background: 'transparent', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--slate-900)', fontSize: '1rem' }}>Login Credentials</h4>
                <div className={styles.grid}>
                  <div className={styles.field}>
                    <label style={{ fontWeight: '500', color: 'var(--slate-700)' }}>Login Username *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="doctor_id" 
                      value={newDoctor.username}
                      onChange={e => setNewDoctor({...newDoctor, username: e.target.value})}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)' }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label style={{ fontWeight: '500', color: 'var(--slate-700)' }}>Login Password *</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••" 
                      value={newDoctor.password}
                      onChange={e => setNewDoctor({...newDoctor, password: e.target.value})}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)' }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.grid}>
                <div className={styles.field}>
                  <label style={{ fontWeight: '500', color: 'var(--slate-800)' }}>Specialization</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Orthodontist" 
                    value={newDoctor.specialization}
                    onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div className={styles.field}>
                  <label style={{ fontWeight: '500', color: 'var(--slate-800)' }}>Qualification</label>
                  <input 
                    type="text" 
                    placeholder="e.g. BDS, MDS" 
                    value={newDoctor.qualification}
                    onChange={e => setNewDoctor({...newDoctor, qualification: e.target.value})}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label style={{ fontWeight: '500', color: 'var(--slate-800)' }}>Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="Mobile number" 
                    value={newDoctor.phone}
                    onChange={e => setNewDoctor({...newDoctor, phone: e.target.value})}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div className={styles.field}>
                  <label style={{ fontWeight: '500', color: 'var(--slate-800)' }}>Email</label>
                  <input 
                    type="email" 
                    placeholder="Doctor's email" 
                    value={newDoctor.email}
                    onChange={e => setNewDoctor({...newDoctor, email: e.target.value})}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label style={{ fontWeight: '500', color: 'var(--slate-800)' }}>Experience (Years)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="e.g. 5" 
                    value={newDoctor.experience_years}
                    onChange={e => setNewDoctor({...newDoctor, experience_years: e.target.value})}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div className={styles.field}>
                  <label style={{ fontWeight: '500', color: 'var(--slate-800)' }}>Consultation Fee ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="e.g. 500" 
                    value={newDoctor.consultation_fee}
                    onChange={e => setNewDoctor({...newDoctor, consultation_fee: e.target.value})}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div style={{ padding: '20px 0 0 0', marginTop: '20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--slate-700)', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.4)' }}>Save Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showScheduleFor && (
        <div className={styles.overlay}>
          <div className={styles.modal} style={{ maxWidth: '600px', borderRadius: '16px', background: 'white', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Schedules for {showScheduleFor.name}</h2>
            </div>
            
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Day</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Time</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 24px', color: '#334155', fontSize: '14px' }}>{daysOfWeek[s.day_of_week]}</td>
                      <td style={{ padding: '12px 24px', color: '#334155', fontSize: '14px' }}>{s.start_time} - {s.end_time}</td>
                      <td style={{ padding: '12px 24px' }}>
                        <button onClick={() => handleDeleteSchedule(s.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {schedules.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No schedules added</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <form onSubmit={handleAddSchedule} style={{ padding: '24px', borderTop: '1px solid #e2e8f0', background: 'white' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>Add New Slot</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Day of Week</label>
                  <select 
                    value={newSchedule.day_of_week}
                    onChange={e => setNewSchedule({...newSchedule, day_of_week: parseInt(e.target.value)})}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value={-1}>Everyday (Mon-Sun)</option>
                    {daysOfWeek.map((day, idx) => (
                      <option key={idx} value={idx}>{day}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Start Time</label>
                  <input 
                    type="time" 
                    required
                    value={newSchedule.start_time}
                    onChange={e => setNewSchedule({...newSchedule, start_time: e.target.value})}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>End Time</label>
                  <input 
                    type="time" 
                    required
                    value={newSchedule.end_time}
                    onChange={e => setNewSchedule({...newSchedule, end_time: e.target.value})}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowScheduleFor(null)} style={{ padding: '8px 16px', borderRadius: '6px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Close</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', background: '#4f46e5', border: 'none', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Add Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
