import React, { useState } from 'react'
import styles from './SearchPatient.module.css'

export default function PatientProfileWhatsApp({ patientPhone, patientName }) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!message.trim()) return alert('Please enter a message to send.')
    const phone = patientPhone?.replace(/[^0-9+]/g, '') || ''
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank')
    setMessage('')
  }

  return (
    <div className={styles.treatmentsTabBody} style={{ padding: '24px 32px' }}>
      <h3 className={styles.sectionTitle}>Send WhatsApp Message</h3>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
        Compose a message to <strong>{patientName}</strong> ({patientPhone}). Clicking send will open WhatsApp with your message ready.
      </p>

      <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', maxWidth: 600 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
          Message Content
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Hi ${patientName}, ...`}
          style={{
            width: '100%', height: 120, padding: 12, borderRadius: 8,
            border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical',
            fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
            marginBottom: 16
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSend}
            style={{
              background: '#25D366', color: '#fff', border: 'none', padding: '10px 24px',
              borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 6px -1px rgba(37, 211, 102, 0.2)'
            }}
          >
            📱 Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
