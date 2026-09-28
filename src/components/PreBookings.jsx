import { useState, useEffect } from 'react'
import styles from './PreBookings.module.css'

export default function PreBookings({ onNavigate }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ name: '', phone: '', expected_date: '', notes: '' })
  const [filterStatus, setFilterStatus] = useState('Pending')

  const fetchList = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/pre-bookings/?status=${filterStatus}`)
      const data = await res.json()
      setList(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [filterStatus])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('http://127.0.0.1:8000/api/pre-bookings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ name: '', phone: '', expected_date: '', notes: '' })
        fetchList()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleBook = async (id) => {
    if (!confirm("Are you sure you want to convert this to an active booking?")) return
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/pre-bookings/book/${id}/`, {
        method: 'POST'
      })
      if (res.ok) {
        alert("Booking created successfully! Patient added to Today's Queue.")
        fetchList()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const syncMissed = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/pre-bookings/sync-missed/', { method: 'POST' })
      const data = await res.json()
      alert(`Sync Complete!\nUpdated Pre-bookings: ${data.updated_prebookings}\nOverdue Follow-ups found: ${data.overdue_followups}`)
      fetchList()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Pre-Booking Management</h2>
        <button className={styles.syncBtn} onClick={syncMissed}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Sync Missed
        </button>
      </div>

      <div className={styles.layout}>
        {/* Form */}
        <div className={styles.formCard}>
          <h3>Add New Prospect</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Patient Name</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Full Name"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Phone Number</label>
              <input 
                type="tel" 
                required 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                placeholder="91XXXXXXXXXX"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Expected Visit Date</label>
              <input 
                type="date" 
                value={formData.expected_date} 
                onChange={e => setFormData({...formData, expected_date: e.target.value})} 
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Notes</label>
              <textarea 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
                placeholder="Any details..."
              />
            </div>
            <button type="submit" className={styles.submitBtn}>Save Pre-booking</button>
          </form>
        </div>

        {/* List */}
        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <h3>Pre-booking List</h3>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={styles.select}>
              <option value="Pending">Pending</option>
              <option value="Booked">Booked</option>
              <option value="Missed">Missed</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className={styles.listContent}>
            {loading ? <p>Loading...</p> : list.length === 0 ? <p>No records found.</p> : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Expected Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.patientInfo}>
                          <span className={styles.pName}>{item.name}</span>
                          <span className={styles.pPhone} onClick={() => handleBook(item.id)} style={{ cursor: 'pointer', color: '#0ea5e9', textDecoration: 'underline' }}>
                            {item.phone}
                          </span>
                        </div>
                      </td>
                      <td>{item.expected_date || 'TBD'}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[item.status.toLowerCase()]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {item.status === 'Pending' && (
                          <button className={styles.bookBtn} onClick={() => handleBook(item.id)}>
                            Book Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
