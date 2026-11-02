import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://127.0.0.1:8000/api'

export default function PharmacistDashboard({ currentUser }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pendingRx: 0, lowStock: 0, todayBilled: 0, totalMedicines: 0 })
  const [recentRx, setRecentRx] = useState([])
  const [loading, setLoading] = useState(true)

  const userId = currentUser?.id || ''
  const username = currentUser?.username || ''

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-User-Id': userId,
    'X-Username': username,
  })

  useEffect(() => {
    fetchStats()
    fetchRecentPrescriptions()
    const iv = setInterval(() => { fetchStats(); fetchRecentPrescriptions() }, 30000)
    return () => clearInterval(iv)
  }, [])

  const fetchStats = async () => {
    try {
      const [rxRes, stockRes] = await Promise.all([
        fetch(`${API}/pharmacy/queue/`, { headers: getHeaders() }),
        fetch(`${API}/medicines/`, { headers: getHeaders() }).catch(() => ({ ok: false }))
      ])
      const rxData = rxRes.ok ? await rxRes.json() : []
      const stockData = stockRes.ok ? await stockRes.json() : []

      const allRx = Array.isArray(rxData) ? rxData : []
      const allMeds = Array.isArray(stockData) ? stockData : (stockData.results || [])

      setStats({
        pendingRx: allRx.filter(r => r.status === 'PENDING').length,
        lowStock: allMeds.filter(m => (m.stock_quantity || 0) < 10).length,
        todayBilled: allRx.filter(r => r.status === 'BILLED').length,
        totalMedicines: allMeds.length,
      })
    } catch (e) { console.error(e) }
  }

  const fetchRecentPrescriptions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/pharmacy/queue/`, { headers: getHeaders() })
      const data = res.ok ? await res.json() : []
      const allRx = Array.isArray(data) ? data : []
      setRecentRx(allRx.slice(0, 8))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const statusColor = (s) => {
    if (s === 'BILLED' || s === 'DISPENSED') return '#10b981'
    if (s === 'PENDING') return '#f59e0b'
    return '#64748b'
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        color: 'white', padding: '32px', borderRadius: 18,
        marginBottom: 24, boxShadow: '0 8px 32px rgba(15,23,42,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <span style={{ background: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Pharmacist Portal 💊
          </span>
          <h1 style={{ margin: '8px 0 6px 0', fontSize: 28, fontWeight: 700 }}>Pharmacist Dashboard</h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>
            Logged in as {currentUser?.name || 'Pharmacist'} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/pharmacist/pharmacy')}
          style={{ padding: '12px 24px', background: '#3b82f6', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
          onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
          onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
        >
          💊 Dispense Prescription
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Pending Prescriptions', value: stats.pendingRx, icon: '📋', color: '#f59e0b', bg: '#fffbeb', path: '/pharmacist/pharmacy' },
          { label: 'Billed Today', value: stats.todayBilled, icon: '✅', color: '#10b981', bg: '#ecfdf5', path: '/pharmacist/pharmacy' },
          { label: 'Low Stock Alerts', value: stats.lowStock, icon: '⚠️', color: '#ef4444', bg: '#fef2f2', path: '/pharmacist/stock' },
          { label: 'Total Medicines', value: stats.totalMedicines, icon: '📦', color: '#3b82f6', bg: '#eff6ff', path: '/pharmacist/stock' },
        ].map(card => (
          <div
            key={card.label}
            onClick={() => navigate(card.path)}
            style={{
              background: 'rgba(255, 255, 255, 0.03)', padding: 20, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${card.color}`, display: 'flex', alignItems: 'center', gap: 16,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: card.color, lineHeight: 1.2 }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        {/* Prescription Queue */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--slate-900)' }}>Prescription Queue</h3>
            <button onClick={() => navigate('/pharmacist/pharmacy')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Manage Queue →</button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading prescriptions...</div>
          ) : recentRx.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <p>No prescriptions in queue</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentRx.map((rx, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'transparent', borderRadius: 10, borderLeft: `3px solid ${statusColor(rx.status)}` }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--slate-900)', fontSize: 14 }}>{rx.patient_name || rx.patient || 'Patient'}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {rx.date || rx.created_at?.split('T')[0] || 'Today'} · Dr. {rx.doctor_name || rx.doctor || 'Doctor'}
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${statusColor(rx.status)}20`, color: statusColor(rx.status) }}>
                    {rx.status || 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 20 }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 600, color: 'var(--slate-900)', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: '💊', label: 'Dispense', path: '/pharmacist/pharmacy' },
                { icon: '📦', label: 'Stock', path: '/pharmacist/stock' },
                { icon: '🛒', label: 'Purchases', path: '/pharmacist/purchases' },
                { icon: '💹', label: 'Sales & Profit', path: '/pharmacist/sales' },
              ].map(btn => (
                <button
                  key={btn.path}
                  onClick={() => navigate(btn.path)}
                  style={{
                    padding: '16px 10px', background: '#f0f9ff', border: '1px solid #e0f2fe',
                    borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontWeight: 600,
                    fontSize: 13, color: '#0369a1', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6, transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.transform = 'none' }}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 20 }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 600, color: 'var(--slate-900)', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Pharmacist Menu</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: '💊 Pharmacy Queue', path: '/pharmacist/pharmacy' },
                { label: '📦 Medicine Stock', path: '/pharmacist/stock' },
                { label: '🛒 Stock Purchases', path: '/pharmacist/purchases' },
                { label: '💹 Sales & Profit', path: '/pharmacist/sales' },
                { label: '🧾 All Prescriptions', path: '/pharmacist/prescriptions' },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{ width: '100%', textAlign: 'left', padding: '9px 12px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500, transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.borderColor = '#bfdbfe' }}
                  onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
