import { useState, useEffect } from 'react'

const API = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' }
}

export default function PrescriptionView() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchPrescriptions()
    const interval = setInterval(fetchPrescriptions, 30000)
    return () => clearInterval(interval)
  }, [filterDate])

  const fetchPrescriptions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/pharmacy/queue/?date=${filterDate}`, { headers: getHeaders() })
      const data = await res.json()
      setPrescriptions(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filtered = prescriptions.filter(rx => {
    const matchSearch = (rx.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(rx.patient_phone || '').includes(search)
    const matchStatus = filterStatus === 'ALL' || rx.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'transparent' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--slate-900)' }}>
          📋 Prescription Records
        </h1>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
          View-only access · Showing all active prescriptions
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Search by patient name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 220, padding: '10px 16px', borderRadius: 10,
            border: '1px solid var(--border-light)', fontSize: 14, outline: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}
        />
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{
            padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-light)',
            fontSize: 14, background: 'rgba(255, 255, 255, 0.03)', color: 'var(--slate-900)'
          }}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: 14, background: 'rgba(255, 255, 255, 0.03)' }}>
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="BILLED">Billed</option>
        </select>
        <button onClick={fetchPrescriptions}
          style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)', cursor: 'pointer', fontSize: 14 }}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: prescriptions.length, color: '#4f46e5' },
          { label: 'Pending', value: prescriptions.filter(r => r.status === 'PENDING').length, color: '#f59e0b' },
          { label: 'Billed', value: prescriptions.filter(r => r.status === 'BILLED').length, color: '#10b981' },
        ].map(chip => (
          <div key={chip.label} style={{
            background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', borderRadius: 12,
            padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{chip.label}</span>
            <strong style={{ fontSize: 22, color: chip.color }}>{chip.value}</strong>
          </div>
        ))}
      </div>

      {/* Prescription list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
          No prescriptions found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(rx => (
            <div key={rx.prescription_id} style={{
              background: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, border: '1px solid var(--border-light)',
              padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderLeft: `4px solid ${rx.status === 'BILLED' ? '#10b981' : '#f59e0b'}`
            }}>
              {/* Patient header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, color: 'var(--slate-900)' }}>{rx.patient_name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                    📞 {rx.patient_phone} {rx.patient_age && `· Age: ${rx.patient_age}`}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>{rx.date}</p>
                </div>
                <span style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: rx.status === 'BILLED' ? '#d1fae5' : '#fef3c7',
                  color: rx.status === 'BILLED' ? '#065f46' : '#92400e'
                }}>
                  {rx.status === 'BILLED' ? '✅ Billed' : '⏳ Pending'}
                </span>
              </div>

              {/* Medicine table (no prices for receptionist) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'transparent', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', borderRadius: '8px 0 0 8px', color: 'var(--slate-700)' }}>Medicine</th>
                    <th style={{ padding: '8px 12px', color: 'var(--slate-700)' }}>Dosage</th>
                    <th style={{ padding: '8px 12px', color: 'var(--slate-700)' }}>Duration</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--slate-700)', borderRadius: '0 8px 8px 0' }}>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {rx.items.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: idx < rx.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--slate-900)' }}>{item.name}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--slate-700)' }}>{item.dosage}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--slate-700)' }}>{item.duration}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#4f46e5' }}>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Read-only notice */}
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'transparent', borderRadius: 8, fontSize: 12, color: '#94a3b8' }}>
                🔒 View only · Contact pharmacist for billing and stock details
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
