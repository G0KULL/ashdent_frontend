import { useState, useEffect, useCallback } from 'react'
import { usePatients } from '../context/PatientContext'
import styles from './Credits.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' }
}

export default function Credits({ onNavigate }) {
  const { setActivePatient } = usePatients()
  const [credits, setCredits] = useState([])
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const firstDay = `${y}-${m}-01`;
  const lastDayObj = new Date(y, today.getMonth() + 1, 0);
  const lastDay = `${y}-${m}-${String(lastDayObj.getDate()).padStart(2, '0')}`;

  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const fetchCredits = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`${API_BASE}/credits/`, { headers: getHeaders() })
      const data = await res.json()
      if (!res.ok) {
        setCredits([])
        setLoadError(data.error || data.detail || `Could not load credits (HTTP ${res.status})`)
        return
      }
      setCredits(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setCredits([])
      setLoadError('Network error while loading credits.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  const filtered = credits.filter(c => {
    const name = (c.name || '').toLowerCase()
    const phone = String(c.phone || '')
    const q = search.toLowerCase()
    const matchQ = name.includes(q) || phone.includes(q)

    let matchDate = true
    if (startDate || endDate) {
      if (!c.last_payment_date) {
        matchDate = false
      } else {
        const d = new Date(c.last_payment_date)
        if (startDate && d < new Date(startDate)) matchDate = false
        if (endDate && d > new Date(endDate + 'T23:59:59')) matchDate = false
      }
    }
    return matchQ && matchDate
  })

  const totalOutstanding = filtered.reduce((acc, curr) => acc + Math.max(0, parseFloat(curr.total_balance)), 0)

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [ledgerBalance, setLedgerBalance] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('All')
  const [waiving, setWaiving] = useState(false)

  const openHistory = async (patient) => {
    setSelectedPatient(patient)
    setLedgerBalance(null)
    setLoadingHistory(true)
    try {
      const [histRes, profRes] = await Promise.all([
        fetch(`${API_BASE}/billing/search/?patient_id=${patient.id}&credits_only=true`, { headers: getHeaders() }),
        fetch(`${API_BASE}/patient/${patient.id}/profile/`, { headers: getHeaders() }),
      ])
      const histData = await histRes.json()
      setHistory(Array.isArray(histData) ? histData : [])
      if (profRes.ok) {
        const prof = await profRes.json()
        const bal = prof.total_balance ?? prof.patient?.total_balance
        if (bal != null) setLedgerBalance(parseFloat(bal))
      } else {
        setLedgerBalance(parseFloat(patient.total_balance))
      }
    } catch (err) {
      console.error(err)
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleWaiveBalance = async () => {
    if (!selectedPatient) return
    const display = ledgerBalance ?? parseFloat(selectedPatient.total_balance || 0)
    if (display <= 0) {
      alert('No balance to remove.')
      return
    }
    const amtStr = window.prompt(
      `Waive / remove old balance (administrative write-off).\nOutstanding: ₹${display.toFixed(2)}\nEnter amount to waive, or leave empty to waive all:`,
      ''
    )
    if (amtStr === null) return
    const body = {}
    if (amtStr.trim() !== '') {
      const n = parseFloat(amtStr)
      if (isNaN(n) || n <= 0) return alert('Enter a positive number or leave empty for full waiver.')
      body.amount = n
    }
    setWaiving(true)
    try {
      const res = await fetch(`${API_BASE}/patient/${selectedPatient.id}/balance/waiver/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Waiver failed')
        return
      }
      alert(`Removed ₹${parseFloat(data.waived).toFixed(2)} from ledger. Remaining balance: ₹${parseFloat(data.total_balance).toFixed(2)}`)
      setSelectedPatient(null)
      setLedgerBalance(null)
      fetchCredits()
    } catch (e) {
      console.error(e)
      alert('Network error')
    } finally {
      setWaiving(false)
    }
  }

  const footerBalance = ledgerBalance != null ? ledgerBalance : parseFloat(selectedPatient?.total_balance || 0)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Patient Credits (Outstanding)</h1>
          <p>List of patients with pending balances</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span>Total Outstanding</span>
            <strong>₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <input 
            placeholder="Search by name or phone..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, marginLeft: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            From: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            To: <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          <button onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }} style={{ background: 'none', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', color: '#64748b', fontWeight: 600 }}>Reset</button>
        </div>
        <button type="button" onClick={fetchCredits} className={styles.viewBtn} style={{ marginLeft: 'auto' }}>
          Refresh
        </button>
      </div>

      {loadError && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          {loadError}
        </div>
      )}

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Phone Number</th>
              <th>Last Transaction</th>
              <th className={styles.amountCol}>Pending Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className={styles.loading}>Loading credits...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" className={styles.loading}>No outstanding credits found.</td></tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id}>
                  <td className={styles.nameCell} onClick={() => openHistory(item)} style={{ cursor: 'pointer', color: '#4f46e5' }}>
                    {item.name}
                  </td>
                  <td>{item.phone}</td>
                  <td>{item.last_payment_date ? new Date(item.last_payment_date).toLocaleDateString() : 'N/A'}</td>
                  <td className={`${styles.amountCol} ${styles.danger}`}>
                    ₹{parseFloat(item.total_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className={styles.viewBtn} onClick={() => openHistory(item)}>
                        History
                      </button>
                      <button className={styles.payBtn} onClick={() => {
                        setActivePatient({ id: item.id, name: item.name, phone: item.phone })
                        if (onNavigate) onNavigate('billing')
                      }}>
                        Pay Bill
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedPatient && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPatient(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Financial Ledger</h2>
                <p>{selectedPatient.name} · {selectedPatient.phone}</p>
                <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 800, color: '#dc2626' }}>
                  Current balance: ₹{footerBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedPatient(null)}>✕</button>
            </div>
            
            <div className={styles.modalBody}>
              {loadingHistory ? (
                <p className={styles.loading}>Fetching transaction history...</p>
              ) : (
                <>
                  <div className={styles.historyFilters} style={{ marginBottom: 15, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {['All', 'Treatment', 'Medicine'].map(f => (
                      <button 
                        key={f}
                        onClick={() => setHistoryFilter(f)}
                        className={historyFilter === f ? styles.activeFilter : styles.filterBtn}
                        style={{
                          padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-light)',
                          background: historyFilter === f ? '#4f46e5' : '#fff',
                          color: historyFilter === f ? '#fff' : '#64748b',
                          cursor: 'pointer', fontSize: 12, fontWeight: 600
                        }}
                      >
                        {f === 'Medicine' ? '💊 Medicine' : f === 'Treatment' ? '🦷 Treatment' : '📋 All'}
                      </button>
                    ))}
                  </div>
                  <table className={styles.historyTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Billed Items</th>
                        <th>Billed</th>
                        <th>Paid</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history
                        .filter(h => {
                          if (historyFilter === 'All') return true
                          const items = h.items || []
                          if (historyFilter === 'Treatment') {
                            return items.some(it => it.fee_type !== 'Pharmacy' && it.fee_type !== 'Medicine')
                          }
                          if (historyFilter === 'Medicine') {
                            return items.some(it => it.fee_type === 'Pharmacy' || it.fee_type === 'Medicine')
                          }
                          return true
                        })
                        .map(h => (
                        <tr key={`${h.type}-${h.id}`}>
                          <td>{new Date(h.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className={styles.itemList}>
                              {(h.items || []).map((it, idx) => (
                                <div key={idx} style={{ fontSize: 11, color: 'var(--slate-700)' }}>
                                  • {it.name} (x{it.qty})
                                </div>
                              ))}
                              {(!h.items || h.items.length === 0) && <span style={{ color: '#94a3b8', fontSize: 11 }}>No items listed</span>}
                            </div>
                          </td>
                          <td>₹{parseFloat(h.total_amount).toFixed(2)}</td>
                          <td className={styles.successText}>₹{parseFloat(h.paid_amount).toFixed(2)}</td>
                          <td className={parseFloat(h.balance_amount) > 0 ? styles.dangerText : styles.successText}>
                            ₹{parseFloat(h.balance_amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr className={styles.totalRow}>
                        <td colSpan="4">Current total balance (after write-offs)</td>
                        <td className={Math.max(0, footerBalance) > 0 ? styles.dangerText : styles.successText}>
                          ₹{Math.max(0, footerBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
            <div className={styles.modalFooter} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {footerBalance > 0 && (
                <button
                  type="button"
                  disabled={waiving}
                  onClick={handleWaiveBalance}
                  style={{
                    padding: '12px 18px', borderRadius: 10, border: '1px solid #fca5a5',
                    background: '#fff7ed', color: '#9a3412', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {waiving ? '…' : 'Remove / waive old balance'}
                </button>
              )}
              <button className={styles.payBtnLarge} onClick={() => {
                setActivePatient({ id: selectedPatient.id, name: selectedPatient.name, phone: selectedPatient.phone })
                if (onNavigate) onNavigate('billing')
              }}>
                Collect Payment / Go to Billing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
