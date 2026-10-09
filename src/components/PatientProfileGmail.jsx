import React, { useState } from 'react'
import styles from './SearchPatient.module.css'

export default function PatientProfileGmail({ email, patientName }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const handleSend = () => {
    if (!email) return alert('This patient does not have an email address registered.')
    if (!subject.trim() || !body.trim()) return alert('Please enter both subject and message body.')
    
    const encodedSubject = encodeURIComponent(subject)
    const encodedBody = encodeURIComponent(body)
    window.open(`mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`, '_blank')
    
    setSubject('')
    setBody('')
  }

  return (
    <div className={styles.treatmentsTabBody} style={{ padding: '24px 32px' }}>
      <h3 className={styles.sectionTitle}>Send Email via Gmail</h3>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
        Compose an email to <strong>{patientName}</strong> ({email || 'No email registered'}). Clicking send will open your default email client.
      </p>

      <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', maxWidth: 600 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="E.g., Your upcoming appointment"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #cbd5e1', outline: 'none',
              fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
            Message Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Hi ${patientName},\n\n...`}
            style={{
              width: '100%', height: 160, padding: 12, borderRadius: 8,
              border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical',
              fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSend}
            style={{
              background: '#ea4335', color: '#fff', border: 'none', padding: '10px 24px',
              borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 6px -1px rgba(234, 67, 53, 0.2)'
            }}
          >
            ✉️ Compose Email
          </button>
        </div>
      </div>
    </div>
  )
}
