import { useState, useEffect } from 'react'
import styles from './PendingReminders.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

export default function PendingReminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState(null)

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/reminders/pending/`)
      if (res.ok) {
        const data = await res.json()
        setReminders(data)
      }
    } catch (err) {
      console.error('Failed to fetch pending reminders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (reminder) => {
    setSendingId(reminder.patient_id + reminder.type)
    try {
      // Use whatsapp web to send the message professionally
      const phone = reminder.patient_phone || '';
      const text = encodeURIComponent(reminder.message);

      // Open WhatsApp Web in a new tab
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');

      // Optional: Log the communication to backend
      const payload = {
        patient_ids: [reminder.patient_id],
        message: reminder.message,
        channels: ['WhatsApp']
      }
      const res = await fetch(`${API_BASE}/communication-logs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setReminders(prev => prev.filter(r => r.patient_id !== reminder.patient_id || r.type !== reminder.type))
      }
    } catch (err) {
      console.error('Failed to send reminder:', err)
    } finally {
      setSendingId(null)
    }
  }

  return (
    <section className={`${styles.card} card reminder-card`} aria-label="Tomorrow's Reminders">
      <div className={styles.header}>
        <h2 className={styles.title}>Tomorrow's Reminders</h2>
        <button className={styles.viewAll} onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'follow-ups' }))}>View All →</button>
      </div>

      {loading && reminders.length === 0 ? (
        <p className={styles.empty}>Loading...</p>
      ) : reminders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✨</div>
          <p>All caught up!</p>
          <span className={styles.emptySub}>No pending reminders for tomorrow.</span>
        </div>
      ) : (
        <ul className={styles.list}>
          {reminders.map((reminder, i) => {
            const isSending = sendingId === (reminder.patient_id + reminder.type)
            return (
              <li key={i} className={styles.item}>
                <div className={styles.info}>
                  <div className={styles.patientInfo}>
                    <span className={styles.name}>{reminder.patient_name}</span>
                    <span className={styles.typeBadge}>{reminder.type}</span>
                  </div>
                  <p className={styles.messagePreview}>{reminder.message}</p>
                </div>
                <button
                  className={styles.sendBtn}
                  onClick={() => handleSend(reminder)}
                  disabled={isSending}
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
