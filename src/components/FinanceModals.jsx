import React, { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API = 'http://127.0.0.1:8000/api'

function fmt(n) { return '₹' + (Number(n) || 0).toLocaleString('en-IN') }

export function IncomeModal({ onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const d = new Date()
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const url = `${API}/finance/report/?filter_type=monthly&start_date=${y}-${m}-01&end_date=${y}-${m}-31`
        const res = await fetch(url)
        if (res.ok) {
          const d = await res.json()
          setData(d)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: 40, textAlign: 'center' }}>
          <h3>Loading Income Data...</h3>
        </div>
      </div>
    )
  }

  const monthlyIncome = data?.monthlyIncome?.total || 0
  const pharmacyRevenue = data?.pharmacySales?.total_profit || 0
  const totalExpense = Object.values(data?.expenses || {}).reduce((a, b) => a + Number(b), 0)
  const totalProfit = monthlyIncome + pharmacyRevenue - totalExpense

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={contentStyle}>
        <div style={headerStyle}>
          <h2>Income Overview (This Month)</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={statsGridStyle}>
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Total Income</div>
            <div style={{ ...statValueStyle, color: '#3b82f6' }}>{fmt(monthlyIncome)}</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Pharmacy Revenue</div>
            <div style={{ ...statValueStyle, color: '#10b981' }}>{fmt(pharmacyRevenue)}</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Total Expense</div>
            <div style={{ ...statValueStyle, color: '#ef4444' }}>{fmt(totalExpense)}</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Total Profit</div>
            <div style={{ ...statValueStyle, color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>{fmt(totalProfit)}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
          <div style={chartBoxStyle}>
            <h3 style={chartTitleStyle}>Day-by-Day Revenue</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.monthlyIncome?.day_by_day || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#bfdbfe" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={chartBoxStyle}>
            <h3 style={chartTitleStyle}>Doctor-wise Revenue</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.doctorRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="doctor_name" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip />
                  <Bar dataKey="total_revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ExpenseModal({ onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const d = new Date()
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const url = `${API}/finance/report/?filter_type=monthly&start_date=${y}-${m}-01&end_date=${y}-${m}-31`
        const res = await fetch(url)
        if (res.ok) {
          const d = await res.json()
          setData(d)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: 40, textAlign: 'center' }}>
          <h3>Loading Expenses...</h3>
        </div>
      </div>
    )
  }

  const expenses = data?.expenses || {}
  const expenseEntries = Object.entries(expenses).filter(([k,v]) => Number(v) > 0)
  const totalExpense = Object.values(expenses).reduce((a, b) => a + Number(b), 0)

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={{ ...contentStyle, maxWidth: 600 }}>
        <div style={headerStyle}>
          <h2>Expense Breakdown (This Month)</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={statsGridStyle}>
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Total Monthly Expenses</div>
            <div style={{ ...statValueStyle, color: '#ef4444' }}>{fmt(totalExpense)}</div>
          </div>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Category</th>
              <th style={{...thStyle, textAlign: 'right'}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenseEntries.map(([cat, amount]) => (
              <tr key={cat} style={trStyle}>
                <td style={tdStyle}>{cat.replace('_', ' ').toUpperCase()}</td>
                <td style={{...tdStyle, textAlign: 'right', fontWeight: 600, color: '#ef4444'}}>{fmt(amount)}</td>
              </tr>
            ))}
            {expenseEntries.length === 0 && (
              <tr>
                <td colSpan="2" style={{...tdStyle, textAlign: 'center'}}>No expenses recorded this month</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20
}

const contentStyle = {
  background: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, width: '100%', maxWidth: 900,
  maxHeight: '90vh', overflowY: 'auto', padding: 24,
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
}

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16
}

const closeBtnStyle = {
  background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b'
}

const statsGridStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16
}

const statBoxStyle = {
  background: 'transparent', padding: 16, borderRadius: 12,
  border: '1px solid var(--border-light)'
}

const statLabelStyle = {
  fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4
}

const statValueStyle = {
  fontSize: 24, fontWeight: 800, fontFamily: 'Outfit, sans-serif'
}

const chartBoxStyle = {
  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid #f1f5f9', borderRadius: 12, padding: 16
}

const chartTitleStyle = {
  fontSize: 14, color: 'var(--slate-800)', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 8
}

const tableStyle = {
  width: '100%', borderCollapse: 'collapse', marginTop: 24
}

const thStyle = {
  textAlign: 'left', padding: '12px 16px', background: 'transparent',
  borderBottom: '2px solid #e2e8f0', color: 'var(--slate-700)', fontSize: 13, textTransform: 'uppercase'
}

const tdStyle = {
  padding: '16px', borderBottom: '1px solid #f1f5f9', fontSize: 14, color: 'var(--slate-800)'
}

const trStyle = {
  transition: 'background 0.2s'
}
