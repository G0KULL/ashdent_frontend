import React, { useState, useEffect } from 'react'
import styles from './Appointments.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' }
}

function statusStyle(status) {
  if (status === 'Completed') return { bg: '#e8f5e9', color: '#2e7d32' }
  if (status === 'In Progress') return { bg: '#e3f2fd', color: '#1565c0' }
  if (status === 'Pending') return { bg: '#fff8e1', color: '#f57f17' }
  if (status === 'Ordered') return { bg: '#fff8e1', color: '#f57f17' }
  return { bg: '#f3e5f5', color: '#7b1fa2' }
}

export default function Labs() {
  const [labOrders, setLabOrders] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [filterType, setFilterType] = useState('month') // 'month' or 'date'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      let url = `${API_BASE}/lab-orders/`
      if (filterType === 'month') {
        url += `?month=${selectedMonth}&year=${selectedYear}`
      } else {
        url += `?date=${selectedDate}`
      }

      const res = await fetch(url, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setLabOrders(data)
      } else {
        console.error('Failed to fetch lab orders')
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [filterType, selectedMonth, selectedYear, selectedDate])

  return (
    <div className={styles.appointmentsContainer}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className={styles.title}>Laboratory Orders</h1>
          <p style={{ fontSize: 13, color: 'var(--slate-400)', margin: '6px 0 0' }}>
            Track pathology, biochemistry, and dental lab orders across all patients. Configure masters under Pathology Lab in the sidebar.
          </p>
        </div>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13 }}
          >
            <option value="month">Month by Month</option>
            <option value="date">Date by Date</option>
          </select>
          
          {filterType === 'month' ? (
            <>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13 }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <input 
                type="number" 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ width: 80, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13 }}
              />
            </>
          ) : (
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13 }}
            />
          )}
        </div>
      </header>
      
      <div className={styles.listContainer}>
        <div className={styles.listHeader} style={{ gridTemplateColumns: '1fr 1.4fr 1fr 1fr' }}>
          <div>Date</div>
          <div>Test / Item</div>
          <div>Patient</div>
          <div style={{ textAlign: 'right' }}>Status</div>
        </div>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading orders...</div>
        ) : labOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No lab orders found for the selected period.</div>
        ) : (
          labOrders.map(t => {
            const s = statusStyle(t.status)
            return (
              <div key={t.id} className={styles.listItem} style={{ gridTemplateColumns: '1fr 1.4fr 1fr 1fr' }}>
                <div style={{ fontSize: 13 }}>{new Date(t.date).toLocaleDateString()}</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {t.test_name}
                  {t.notes && <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginTop: 4 }}>{t.notes}</div>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--slate-700)' }}>{t.patient_name}</div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: s.bg,
                    color: s.color,
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}>
                    {t.status}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
