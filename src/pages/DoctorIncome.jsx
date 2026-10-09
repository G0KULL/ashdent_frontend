import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './DoctorDashboard.module.css'

const API = 'http://127.0.0.1:8000/api'

export default function DoctorIncome({ currentUser }) {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [filterType, setFilterType] = useState('monthly') // 'today', 'yesterday', 'monthly', 'custom'
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  
  const [summary, setSummary] = useState({ total: 0, cash: 0, upi: 0, card: 0 })

  const userId = currentUser?.id

  useEffect(() => {
    if (!userId) return
    fetchIncomeData()
  }, [userId, filterType, startDate, endDate])

  const fetchIncomeData = async () => {
    setLoading(true)
    try {
      let url = `${API}/finance/dashboard/?filter_type=${filterType}`
      if (filterType === 'custom') {
        url += `&start_date=${startDate}&end_date=${endDate}`
      }
      
      const res = await fetch(url, {
        headers: { 'X-User-Id': userId, 'X-User-Role': 'Doctor' }
      })
      
      if (res.ok) {
        const data = await res.json()
        setRecords(data.detailedIncome || [])
        setSummary({
          total: data.monthlyIncome?.total || 0,
          cash: data.monthlyIncome?.cash || 0,
          upi: data.monthlyIncome?.upi || 0,
          card: data.monthlyIncome?.card || 0
        })
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontWeight: 600, padding: 0, marginBottom: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>My Revenue Records</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: 14 }}>Track your consultations and treatments</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.03)', padding: 16, borderRadius: 12, border: '1px solid var(--border-light)', marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-700)' }}>Time Filter:</div>
        <select 
          value={filterType} 
          onChange={e => setFilterType(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 14, outline: 'none', cursor: 'pointer' }}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="monthly">This Month</option>
          <option value="custom">Custom Range</option>
        </select>

        {filterType === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 14, outline: 'none' }}
            />
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 14, outline: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', padding: 20, borderRadius: 12, color: 'white', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, marginBottom: 8 }}>Total Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>₹{summary.total.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 20, borderRadius: 12, border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Cash Collected</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--slate-900)' }}>₹{summary.cash.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 20, borderRadius: 12, border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>UPI Collected</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--slate-900)' }}>₹{summary.upi.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 20, borderRadius: 12, border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Card Collected</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--slate-900)' }}>₹{summary.card.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: 'transparent' }}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--slate-900)' }}>Income Records</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: '#64748b', fontSize: 13, background: 'transparent' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Patient</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Service Type</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Method</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading records...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No income records found for this period.</td></tr>
              ) : (
                records.map((r, i) => (
                  <tr key={r.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', color: 'var(--slate-800)', fontSize: 14 }}>{r.date}</td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--slate-900)' }}>{r.patient_name}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        background: r.service_type === 'Consultation' ? '#eff6ff' : '#f5f3ff', 
                        color: r.service_type === 'Consultation' ? '#3b82f6' : '#8b5cf6',
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 
                      }}>
                        {r.service_type}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: 14 }}>{r.payment_method}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--slate-700)', fontSize: 14, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.description}>
                      {r.description}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 700, color: '#10b981', fontSize: 15 }}>
                      ₹{Number(r.amount).toLocaleString('en-IN')}
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
