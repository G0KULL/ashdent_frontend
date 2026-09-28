import { useEffect, useRef, useState } from 'react'
import styles from './StatsCards.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

function useCountUp(target, duration = 1400) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const start = performance.now()
    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.round(eased * target).toLocaleString()
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return ref
}

function StatCard({ card, index, onClick }) {
  const countRef = useCountUp(card.count, 1200 + index * 150)

  return (
    <article
      className={`${styles.card} ${styles[card.color]}`}
      tabIndex={0}
      onClick={onClick}
    >
      <div className={styles.decCircle} />

      <div className={styles.top}>
        <div className={`${styles.iconWrap} ${styles[card.color + 'Bg']}`}>
          {card.icon}
        </div>
        <div className={`${styles.trend} ${card.trendUp === true ? styles.trendUp : card.trendUp === false ? styles.trendGood : styles.trendNeutral}`}>
          {card.trendUp === true && (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M3 11L11 3M11 3H5M11 3v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span>{card.trend}</span>
        </div>
      </div>

      <div className={styles.body}>
        {card.prefix && <span className={styles.prefix}>{card.prefix}</span>}
        <p className={styles.count} ref={countRef}>0</p>
        <p className={styles.label}>{card.label}</p>
      </div>

      <div className={styles.footer}>
        {card.chips ? (
          <div className={styles.chips}>
            {card.chips.map(c => (
              <span key={c.label} className={`${styles.chip} ${styles[c.type + 'Chip']}`}>
                {c.label}
              </span>
            ))}
          </div>
        ) : (
          <>
            <div className={styles.miniBar}>
              <div
                className={`${styles.miniBarFill} ${styles[card.color + 'Fill']}`}
                style={{ '--w': card.barWidth + '%' }}
              />
            </div>
            <span className={styles.sub}>{card.sub}</span>
          </>
        )}
      </div>
    </article>
  )
}

export default function StatsCards({ onNavigate }) {
  const [stats, setStats] = useState({
    total_patients: 0,
    today_total: 0,
    upcoming: 0,
    missed: 0,
    waiting: 0,
    engaged: 0,
    completed: 0,
    follow_up_expected: 0,
    total_revenue: 0,
    total_debt: 0,
    total_collected: 0,
  })

  const [finance, setFinance] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    pendingCredits: 0,
    pharmacySales: 0,
  })

  const [showMissedModal, setShowMissedModal] = useState(false)
  const [missedList, setMissedList] = useState([])
  const [missedLoading, setMissedLoading] = useState(false)

  const now = new Date()

  const fetchStats = () => {
    const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
    fetch('http://127.0.0.1:8000/api/appointments/stats/', {
      headers: { 'X-User-Id': user.id || '', 'X-Username': user.username || '' }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error)
  }

  const fetchMissedList = async () => {
    setMissedLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`${API_BASE}/appointments/all/?date=${today}`, {
        headers: { 'X-User-Id': user.id || '', 'X-Username': user.username || '' }
      })
      const data = await res.json()
      const missed = (Array.isArray(data) ? data : []).filter(a => a.status === 'Missed')
      setMissedList(missed)
    } catch (e) {
      // If API fails, show an empty list
      setMissedList([])
    } finally {
      setMissedLoading(false)
    }
  }

  const fetchFinance = () => {
    const m = now.getMonth() + 1
    const y = now.getFullYear()
    const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
    fetch(`http://127.0.0.1:8000/api/finance/dashboard/?filter_type=monthly&month=${m}&year=${y}`, {
      headers: { 'X-User-Id': user.id || '', 'X-Username': user.username || '' }
    })
      .then(res => res.json())
      .then(data => {
        const income = data?.monthlyIncome?.total || 0
        const expenseObj = data?.expenses || {}
        const expense = Object.values(expenseObj).reduce((a, b) => a + Number(b), 0)
        const pharmSales = data?.pharmacySales?.total_sales || 0
        setFinance({
          totalIncome: Math.round(income),
          totalExpense: Math.round(expense),
          netProfit: Math.round(income - expense),
          pendingCredits: Math.round(data?.pendingPayments || 0),
          pharmacySales: Math.round(pharmSales),
        })
      })
      .catch(console.error)
  }

  useEffect(() => {
    fetchStats()
    fetchFinance()
    const iv = setInterval(() => { fetchStats(); fetchFinance() }, 30000)
    return () => clearInterval(iv)
  }, [])

  const CARDS = [
    {
      id: 'patients',
      label: 'Total Patients',
      count: stats.total_patients || 0,
      color: 'green',
      trend: 'All Time',
      trendUp: true,
      sub: 'Registered patients',
      barWidth: 80,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="8" r="4" fill="currentColor" />
          <path d="M2 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="18" cy="8" r="3" fill="currentColor" opacity=".6" />
          <path d="M22 20c0-2.761-2.239-5-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".6" />
        </svg>
      ),
    },
    {
      id: 'appointments',
      label: "Today's Schedule",
      count: stats.today_total || 0,
      color: 'blue',
      trend: 'Today Only',
      trendUp: null,
      chips: [
        { label: `Waiting: ${stats.waiting || 0}`, type: 'red' },
        { label: `Done: ${stats.completed || 0}`, type: 'teal' },
      ],
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M7 3v4M17 3v4M3 11h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="8" cy="15" r="1.2" fill="currentColor" />
          <circle cx="12" cy="15" r="1.2" fill="currentColor" />
          <circle cx="16" cy="15" r="1.2" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'income',
      label: 'Monthly Income',
      count: finance.totalIncome,
      prefix: '₹',
      color: 'green',
      trend: 'This Month',
      trendUp: true,
      sub: 'Click to view analytics →',
      barWidth: 100,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'expense',
      label: 'Monthly Expenses',
      count: finance.totalExpense,
      prefix: '₹',
      color: 'orange',
      trend: 'This Month',
      trendUp: false,
      sub: 'Click to view details →',
      barWidth: finance.totalIncome > 0 ? Math.min((finance.totalExpense / finance.totalIncome) * 100, 100) : 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'missed',
      label: 'Missed',
      count: stats.missed || 0,
      color: 'red',
      trend: 'Needs Follow-up',
      trendUp: false,
      sub: (stats.missed || 0) === 0 ? 'No missed appts!' : `${stats.missed} past missed`,
      barWidth: (stats.missed || 0) > 0 ? Math.min((stats.missed / Math.max(stats.total_patients, 1)) * 100, 100) : 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'follow-ups',
      label: 'Follow-ups Today',
      count: stats.follow_up_expected_today || 0,
      color: 'orange',
      trend: 'Expected Today',
      trendUp: null,
      sub: 'Patients due for follow-up',
      barWidth: 100,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <section className={styles.grid} aria-label="Key Statistics">
      {/* ── Missed Patients Modal ── */}
      {showMissedModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)', borderRadius: 20, width: 700, maxWidth: '95vw',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>❌ Missed Patients Today</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button
                onClick={() => setShowMissedModal(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', width: 36, height: 36, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >×</button>
            </div>
            {/* Modal Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 28px' }}>
              {missedLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading missed patients…</div>
              ) : missedList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#16a34a' }}>No missed patients today!</div>
                  <div style={{ color: '#64748b', marginTop: 6, fontSize: 13 }}>All patients have been attended to.</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      {['#', 'Patient', 'Phone', 'Time', 'Doctor', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {missedList.map((appt, i) => (
                      <tr key={appt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{appt.patient_name}</div>
                          {parseFloat(appt.patient_balance) > 0 && (
                            <span style={{ fontSize: 10, background: '#fef2f2', color: '#dc2626', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                              Bal ₹{parseFloat(appt.patient_balance).toFixed(0)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{appt.patient_phone || '—'}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{appt.time_formatted || appt.time || '—'}</td>
                        <td style={{ padding: '12px', color: 'var(--slate-800)', fontWeight: 600 }}>{appt.doctor_name || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => {
                                const phone = (appt.patient_phone || '').replace(/\D/g, '')
                                const full = phone.length === 10 ? `91${phone}` : phone
                                const msg = encodeURIComponent(`Dear ${appt.patient_name}, we noticed you missed your dental appointment today. Please call us to reschedule at your earliest convenience. Thank you!`)
                                window.open(`https://wa.me/${full}?text=${msg}`, '_blank')
                              }}
                              style={{ background: '#dcfce7', color: '#16a34a', border: 'none', padding: '5px 10px', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                            >WhatsApp</button>
                            <button
                              onClick={() => { setShowMissedModal(false); onNavigate && onNavigate('today-patients') }}
                              style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '5px 10px', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                            >Reschedule</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowMissedModal(false); onNavigate && onNavigate('today-patients') }}
                style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >View All Today's Patients →</button>
              <button
                onClick={() => setShowMissedModal(false)}
                style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--slate-700)', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >Close</button>
            </div>
          </div>
        </div>
      )}

      {CARDS.map((card, i) => (
        <StatCard
          key={card.id}
          card={card}
          index={i}
          onClick={() => {
            if (!onNavigate) return
            if (card.id === 'income') onNavigate('income-analytics')
            else if (card.id === 'expense') onNavigate('transactions')
            else if (card.id === 'patients') onNavigate('search-patient')
            else if (card.id === 'appointments') onNavigate('today-patients')
            else if (card.id === 'follow-ups') onNavigate('follow-ups')
            else if (card.id === 'missed') {
              fetchMissedList()
              setShowMissedModal(true)
            }
          }}
        />
      ))}
    </section>
  )
}


