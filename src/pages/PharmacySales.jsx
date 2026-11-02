import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './PharmacyDashboard.module.css'

const API = 'http://127.0.0.1:8000/api'

export default function PharmacySales({ currentUser }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  // Filters
  const [preset, setPreset] = useState('monthly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchStats()
  }, [preset])

  const fetchStats = async () => {
    setLoading(true)
    try {
      let url = `${API}/pharmacy/dashboard/?preset=${preset}`
      if (preset === 'custom' && startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`
      }
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomFilter = () => {
    if (startDate && endDate) {
      setPreset('custom')
      fetchStats()
    }
  }

  // Calculate totals for the selected period
  const totalSales = stats?.daily_report?.reduce((acc, curr) => acc + curr.sales, 0) || 0
  const totalCost = stats?.daily_report?.reduce((acc, curr) => acc + curr.purchase_cost, 0) || 0
  const totalProfit = stats?.daily_report?.reduce((acc, curr) => acc + curr.profit, 0) || 0
  const totalInvoices = stats?.daily_report?.reduce((acc, curr) => acc + curr.invoice_count, 0) || 0

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: 24, color: 'var(--slate-900)', fontWeight: 700 }}>Pharmacy Sales & Profit</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Track revenue, analyze costs, and calculate net profit for your pharmacy.</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, padding: 16, background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, border: '1px solid var(--border-light)', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Time Period</label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 8, outline: 'none', background: 'transparent', width: 160 }}
          >
            <option value="today">Today</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {preset === 'custom' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 8, outline: 'none', background: 'transparent' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 8, outline: 'none', background: 'transparent' }}
              />
            </div>
            <button
              onClick={handleCustomFilter}
              style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              Apply Filter
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading analytics...</div>
      ) : (
        <>
          {/* Top Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 30 }}>
            {/* Sales Card */}
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: 16, padding: 24, color: 'white', boxShadow: '0 4px 15px rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12, fontSize: 20 }}>💰</div>
                <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>₹{totalSales.toFixed(2)}</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 8 }}>From {totalInvoices} Invoices</div>
            </div>

            {/* Cost Card */}
            <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: 16, padding: 24, color: 'white', boxShadow: '0 4px 15px rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12, fontSize: 20 }}>📉</div>
                <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Purchase Expenses</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>₹{totalCost.toFixed(2)}</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 8 }}>Cost of Goods Sold (COGS)</div>
            </div>

            {/* Profit Card */}
            <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: 16, padding: 24, color: 'white', boxShadow: '0 4px 15px rgba(59,130,246,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12, fontSize: 20 }}>📈</div>
                <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Profit</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>₹{totalProfit.toFixed(2)}</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 8 }}>Margin: {totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}%</div>
            </div>
          </div>

          {/* Detailed Data Table */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--slate-900)' }}>Daily Breakdown</h3>
            </div>
            {stats?.daily_report?.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No transactions recorded in this period.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                  <thead style={{ background: 'transparent', color: 'var(--slate-700)' }}>
                    <tr>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Invoices</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Sales (₹)</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Expenses (₹)</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Net Profit (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.daily_report?.filter(day => day.invoice_count > 0 || day.purchase_cost > 0 || day.sales > 0).map((day, idx) => (
                      <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--slate-900)' }}>{day.date}</td>
                        <td style={{ padding: '16px 24px', color: '#64748b' }}>{day.invoice_count}</td>
                        <td style={{ padding: '16px 24px', color: '#10b981', fontWeight: 500 }}>+₹{day.sales.toFixed(2)}</td>
                        <td style={{ padding: '16px 24px', color: '#ef4444', fontWeight: 500 }}>-₹{day.purchase_cost.toFixed(2)}</td>
                        <td style={{ padding: '16px 24px', color: '#3b82f6', fontWeight: 600 }}>₹{day.profit.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
