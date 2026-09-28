import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import styles from './DashboardFinanceWidgets.module.css'

const API = 'http://127.0.0.1:8000/api'
const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' },   { value: '04', label: 'April' },
  { value: '05', label: 'May' },     { value: '06', label: 'June' },
  { value: '07', label: 'July' },    { value: '08', label: 'August' },
  { value: '09', label: 'September'},{ value: '10', label: 'October' },
  { value: '11', label: 'November' },{ value: '12', label: 'December' },
]

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' }
}

function fmt(n) { return '₹' + (Number(n) || 0).toLocaleString('en-IN') }

const EXPENSE_CATS = [
  { key: 'consumables', label: 'Consumables' },
  { key: 'dental_materials', label: 'Dental Materials' },
  { key: 'doctor_salary', label: 'Doctor Salary' },
  { key: 'rent_electricity', label: 'Rent & Electricity' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'other', label: 'Other' },
]

// Custom tooltip for bar chart
function IncomeTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 600 }}>
            {p.name}: {fmt(p.value)}
          </div>
        ))}
      </div>
    )
  }
  return null
}

// Custom label for pie chart
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function DashboardFinanceWidgets() {
  const today = new Date()
  const [activeTab, setActiveTab] = useState('income')
  const [filterMode, setFilterMode] = useState('month') // 'month' | 'date'
  const [selMonth, setSelMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'))
  const [selYear, setSelYear] = useState(String(today.getFullYear()))
  const [selDate, setSelDate] = useState(today.toISOString().split('T')[0])

  const [loading, setLoading] = useState(true)
  const [dailyIncome, setDailyIncome] = useState({ total: 0 })
  const [monthlyIncome, setMonthlyIncome] = useState({ total: 0, week_wise: [], consultation: 0, treatment: 0, pharmacy: 0, other: 0 })
  const [doctorRevenue, setDoctorRevenue] = useState([])
  const [pharmacySales, setPharmacySales] = useState({ total_profit: 0, items: [] })

  const [expenses, setExpenses] = useState({})
  const [dayByDayExpense, setDayByDayExpense] = useState([])

  const [expenseForm, setExpenseForm] = useState({
    title: '', category: 'consumables', amount: '', date: today.toISOString().split('T')[0]
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let url = ''
      if (filterMode === 'month') {
        url = `${API}/finance/dashboard/?filter_type=monthly&month=${selMonth}&year=${selYear}`
      } else {
        url = `${API}/finance/dashboard/?filter_type=custom&start_date=${selDate}&end_date=${selDate}`
      }

      const res = await fetch(url, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setDailyIncome(data.dailyIncome || { total: 0 })
        setMonthlyIncome(data.monthlyIncome || { total: 0, week_wise: [], consultation: 0, treatment: 0, pharmacy: 0, other: 0 })
        setDoctorRevenue(data.doctorRevenue || [])
        setPharmacySales(data.pharmacySales || { total_profit: 0, items: [] })

        // Expense data
        const expParams = filterMode === 'month'
          ? `month=${selMonth}&year=${selYear}`
          : `start_date=${selDate}&end_date=${selDate}`
        const expRes = await fetch(`${API}/finance/total-expenses/?${expParams}`, { headers: getHeaders() })
        if (expRes.ok) {
          const expData = await expRes.json()
          setExpenses(expData || {})
          setDayByDayExpense(expData.daily_trend || [])
        } else {
          setExpenses(data.expenses || {})
          setDayByDayExpense(data.dayByDayExpense || [])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterMode, selMonth, selYear, selDate])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSaveExpense = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API}/finance/expenses/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(expenseForm)
      })
      if (res.ok) {
        alert('Expense logged successfully!')
        setExpenseForm({ ...expenseForm, title: '', amount: '' })
        fetchData()
      } else {
        alert('Failed to log expense')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const totalExpense = expenses.grand_total !== undefined
    ? expenses.grand_total
    : Object.values(expenses).reduce((acc, v) => acc + Number(v), 0)

  // Build income pie data from consultation / treatment / pharmacy / other
  const incomePieData = [
    { name: 'Consultation', value: Number(monthlyIncome.consultation) || 0 },
    { name: 'Treatment', value: Number(monthlyIncome.treatment) || 0 },
    { name: 'Pharmacy', value: Number(monthlyIncome.pharmacy) || 0 },
    { name: 'Other', value: Number(monthlyIncome.other) || 0 },
  ].filter(d => d.value > 0)

  // Build week-wise bar data
  const weekData = (monthlyIncome.week_wise || []).map(w => ({
    week: w.week,
    Income: Math.round(w.total),
  }))

  const filterLabel = filterMode === 'month'
    ? `${MONTHS.find(m => m.value === selMonth)?.label || ''} ${selYear}`
    : selDate

  return (
    <div className={styles.widgetContainer}>
      {/* ─── Header: Tabs + Filters ─── */}
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'income' ? styles.activeIncome : ''}`}
            onClick={() => setActiveTab('income')}
          >
            💰 Income Analytics
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'expenses' ? styles.activeExpense : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            💸 Expenses & Outflows
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {/* Toggle: month vs date */}
          <div className={styles.filterToggle}>
            <button
              className={`${styles.toggleBtn} ${filterMode === 'month' ? styles.toggleActive : ''}`}
              onClick={() => setFilterMode('month')}
            >📅 Month</button>
            <button
              className={`${styles.toggleBtn} ${filterMode === 'date' ? styles.toggleActive : ''}`}
              onClick={() => setFilterMode('date')}
            >📆 Date</button>
          </div>

          {filterMode === 'month' ? (
            <>
              <select value={selMonth} onChange={e => setSelMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={selYear} onChange={e => setSelYear(e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          ) : (
            <input
              type="date"
              value={selDate}
              max={today.toISOString().split('T')[0]}
              onChange={e => setSelDate(e.target.value)}
            />
          )}

          <button className={styles.applyBtn} onClick={fetchData}>Apply</button>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingBox}>Loading Financial Insights for {filterLabel}...</div>
      )}

      {/* ─── INCOME TAB ─── */}
      {!loading && activeTab === 'income' && (
        <div className={styles.contentGrid}>
          {/* Summary stat cards */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Today's Income</div>
              <div className={styles.statValue}>{fmt(dailyIncome.total)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>{filterMode === 'month' ? 'Month' : 'Date'} Total Income</div>
              <div className={styles.statValue} style={{ color: '#2563eb' }}>{fmt(monthlyIncome.total)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Consultation</div>
              <div className={styles.statValue} style={{ color: '#10b981' }}>{fmt(monthlyIncome.consultation)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Treatment</div>
              <div className={styles.statValue} style={{ color: '#f59e0b' }}>{fmt(monthlyIncome.treatment)}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Pharmacy Profit</div>
              <div className={styles.statValue} style={{ color: '#8b5cf6' }}>{fmt(pharmacySales.total_profit)}</div>
            </div>
          </div>

          {/* Charts row */}
          <div className={styles.chartsGrid}>
            {/* Chart 1: Weekly Income Bar */}
            <div className={styles.chartBox}>
              <h3>📊 Weekly Income Summary</h3>
              {weekData.length > 0 ? (
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                      />
                      <Tooltip content={<IncomeTooltip />} />
                      <Bar dataKey="Income" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                        {weekData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={index === weekData.length - 1 ? '#2563eb' : `hsl(${210 - index * 10}, 80%, ${60 + index * 3}%)`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={styles.emptyChart}>No income data for this period</div>
              )}
            </div>

            {/* Chart 2: Income Breakdown Pie */}
            <div className={styles.chartBox}>
              <h3>🥧 Income Breakdown</h3>
              {incomePieData.length > 0 ? (
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        labelLine={false}
                        label={PieLabel}
                      >
                        {incomePieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Legend
                        formatter={(value, entry) => (
                          <span style={{ color: '#0f172a', fontSize: 12 }}>
                            {value}: {fmt(entry.payload.value)}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={styles.emptyChart}>No income data for this period</div>
              )}
            </div>
          </div>

          {/* Doctor Revenue */}
          {doctorRevenue.length > 0 && (
            <div className={styles.chartsGrid} style={{ marginTop: 20 }}>
              <div className={styles.chartBox} style={{ gridColumn: '1 / -1' }}>
                <h3>👨‍⚕️ Doctor-wise Revenue</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={doctorRevenue} barSize={50}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="doctor_name" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                      />
                      <Tooltip content={<IncomeTooltip />} />
                      <Bar dataKey="consultation_revenue" name="Consultation" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                      <Bar dataKey="treatment_revenue" name="Treatment" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── EXPENSES TAB ─── */}
      {!loading && activeTab === 'expenses' && (
        <div className={styles.contentGrid}>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Expenses ({filterLabel})</div>
              <div className={styles.statValue} style={{ color: '#ef4444' }}>{fmt(totalExpense)}</div>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartBox}>
              <h3>📉 Expense Trend (Week-wise)</h3>
              {dayByDayExpense.length > 0 ? (
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayByDayExpense} barSize={30}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                      />
                      <Tooltip content={<IncomeTooltip />} />
                      <Bar dataKey="amount" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={styles.emptyChart}>No expense data for this period</div>
              )}
            </div>

            <div className={styles.chartBox}>
              <h3>➕ Quick Add Expense</h3>
              <form onSubmit={handleSaveExpense} className={styles.expenseForm}>
                <input
                  type="text"
                  placeholder="Expense Title (e.g. Rent)"
                  value={expenseForm.title}
                  onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  required
                />
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  {EXPENSE_CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                />
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
                <button type="submit">💾 Record Expense</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
