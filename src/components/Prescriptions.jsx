import { useState, useEffect } from 'react'
import styles from './Bills.module.css' // Reuse billing styles

const API = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' }
}

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    setLoading(true)
    try {
      // The backend should support listing all prescriptions or filtered by query
      const res = await fetch(`${API}/prescription/list/`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setPrescriptions(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Failed to fetch prescriptions:', e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = prescriptions.filter(p =>
    p.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(p.id).includes(searchQuery)
  )

  const handlePrint = async (id) => {
    try {
      const response = await fetch(`${API}/prescription/${id}/pdf/`, { headers: getHeaders() })
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      let iframe = document.getElementById('print-pdf-iframe')
      if (iframe) {
        if (iframe.dataset.blobUrl) {
          URL.revokeObjectURL(iframe.dataset.blobUrl)
        }
      } else {
        iframe = document.createElement('iframe')
        iframe.id = 'print-pdf-iframe'
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        document.body.appendChild(iframe)
      }

      iframe.dataset.blobUrl = blobUrl
      iframe.src = blobUrl

      let isPrinted = false
      const doPrint = () => {
        if (isPrinted) return
        isPrinted = true
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      }
      iframe.onload = doPrint
      setTimeout(doPrint, 1500)
    } catch (e) {
      console.error(e)
      alert('Failed to print prescription')
    }
  }

  const handleWhatsApp = (p) => {
    const pdfUrl = `${API}/prescription/${p.id}/pdf/`
    const message = encodeURIComponent(`Hello ${p.patient_name}, your prescription is ready. Download here: ${pdfUrl}`)
    // We assume patient phone is available in the serializer
    const phone = (p.patient_phone || '').replace(/\D/g, '')
    if (!phone) return alert('No phone number available')
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Prescription Records</h2>
          <p className={styles.subtitle}>View and manage all clinical prescriptions</p>
        </div>
      </header>

      <div className={styles.tableCard}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search by patient name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.refreshBtn} onClick={fetchPrescriptions}>
            Refresh List
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rx ID</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Doctor</th>
                <th>Medicines</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading prescriptions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No prescriptions found.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id}>
                    <td><span className={styles.billId}>#{p.id}</span></td>
                    <td>
                      <div className={styles.patientInfo}>
                        <span className={styles.patientName}>{p.patient_name}</span>
                        <span className={styles.patientPhone}>{p.patient_phone}</span>
                      </div>
                    </td>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>{p.doctor_name || 'Dr. Admin'}</td>
                    <td>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {(p.items || []).slice(0, 2).map(i => i.medicine_name).join(', ')}
                        {(p.items || []).length > 2 && ' ...'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn} onClick={() => handlePrint(p.id)} title="Print">
                          🖨️
                        </button>
                        <button className={styles.actionBtn} onClick={() => handleWhatsApp(p)} title="Share WhatsApp">
                          💬
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

