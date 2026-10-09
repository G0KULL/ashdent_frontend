import { useState, useEffect, useRef } from 'react'
import styles from './Bills.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' }
}

const printPdf = async (url) => {
  try {
    const response = await fetch(url, { headers: getHeaders() })
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
    console.error("Failed to print PDF:", e)
    alert("Could not print PDF: " + e.message)
  }
}

const STATUS_STYLE = {
  Paid: { bg: '#dcfce7', color: '#15803d' },
  Partial: { bg: '#fef9c3', color: '#a16207' },
  Pending: { bg: '#fee2e2', color: '#b91c1c' },
  Advance: { bg: '#dcfce7', color: '#16a34a' },
}

// ── Patient Picker for new bill ──────────────────────────────────────────────
function PatientPicker({ onSelect }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/patient/search/?q=${encodeURIComponent(q)}`, { headers: getHeaders() })
        if (res.ok) { setResults(await res.json()); setOpen(true) }
      } catch (e) { console.error(e) }
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const choose = (p) => {
    setSelected(p)
    setQ('')
    setResults([])
    setOpen(false)
    onSelect(p)
  }

  const clear = () => { setSelected(null); setQ(''); onSelect(null) }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      {selected ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderRadius: 8, border: '1px solid #a5b4fc',
          background: '#f8faff', fontSize: 13
        }}>
          <div>
            <strong>{selected.name}</strong>
            <span style={{ color: '#64748b', marginLeft: 6 }}>{selected.phone}</span>
          </div>
          <button onClick={clear} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}>✕</button>
        </div>
      ) : (
        <input
          placeholder="Search patient name / phone..."
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13, outline: 'none' }}
          autoComplete="off"
        />
      )}

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', borderRadius: 8,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto',
          marginTop: 4
        }}>
          {results.map(p => (
            <div
              key={p.id}
              onClick={() => choose(p)}
              style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <strong>{p.name}</strong> <span style={{ color: '#64748b', fontSize: 11 }}>· {p.phone}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Bills() {
  const [bills, setBills] = useState([])
  const [q, setQ] = useState('')
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const firstDay = `${y}-${m}-01`;
  const lastDayObj = new Date(y, today.getMonth() + 1, 0);
  const lastDay = `${y}-${m}-${String(lastDayObj.getDate()).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewingBill, setViewingBill] = useState(null)

  // New bill form state
  const [showAdd, setShowAdd] = useState(false)
  const [billForm, setBillForm] = useState({
    patient: null,
    amount: '',
    paid_amount: '',
    payment_method: 'Cash',
    doctor_id: '',
    includePrior: false
  })
  const [doctors, setDoctors] = useState([])
  const [saving, setSaving] = useState(false)

  // Pay modal
  const [payModal, setPayModal] = useState(null) // { billId, balance, patientName }
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Cash')
  const [paying, setPaying] = useState(false)

  const [exactTotalDebt, setExactTotalDebt] = useState(0)

  const fetchBills = async () => {
    setLoading(true)
    try {
      const url = new URL(`${API_BASE}/payments/search/`)
      if (q) url.searchParams.append('q', q)
      if (startDate) url.searchParams.append('start_date', startDate)
      if (endDate) url.searchParams.append('end_date', endDate)

      const res = await fetch(url, { headers: getHeaders() })
      const data = await res.json()
      setBills(Array.isArray(data) ? data : [])

      await fetch(`${API_BASE}/credits/`, { headers: getHeaders() })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            let filteredCredits = data;
            if (q) {
              const query = q.toLowerCase();
              filteredCredits = data.filter(c =>
                (c.name || '').toLowerCase().includes(query) || String(c.phone || '').includes(query)
              );
            }
            setExactTotalDebt(filteredCredits.reduce((sum, c) => sum + Math.max(0, parseFloat(c.total_balance || 0)), 0))
          }
        })
        .catch(console.error);
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  useEffect(() => { fetchBills() }, [q, startDate, endDate])

  const stats = bills.reduce((acc, b) => {
    const pid = String(b.patient_id || b.patient?.id || 'unknown');
    const billed = parseFloat(b.total_amount || 0);
    const paid = parseFloat(b.paid_amount || 0);

    acc.totalBilled += billed;
    acc.totalPaid += paid;

    if (pid !== 'unknown') {
      acc.pBals[pid] = (acc.pBals[pid] || 0) + (billed - paid);
    }
    return acc;
  }, { totalBilled: 0, totalPaid: 0, pBals: {} });

  const totalDebt = (startDate || endDate)
    ? bills.reduce((sum, b) => sum + Math.max(0, parseFloat(b.balance_amount || 0)), 0)
    : exactTotalDebt;
  const totalCollected = stats.totalPaid; // Or stats.totalBilled - totalDebt if we want to ignore advances in 'collected'


  const filtered = filterStatus
    ? bills.filter(b => b.status === filterStatus)
    : bills

  const handlePay = (bill) => {
    setPayModal({ billId: bill.id, type: bill.type, balance: parseFloat(bill.balance_amount || 0), patientName: bill.patient_name })
    setPayAmount(parseFloat(bill.balance_amount || 0).toFixed(2))
    setPayMethod('Cash')
  }

  const confirmPay = async () => {
    if (!payModal || !payAmount || parseFloat(payAmount) <= 0) return
    setPaying(true)
    try {
      const res = await fetch(`${API_BASE}/payment/pay/${payModal.billId}/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount: payAmount, payment_method: payMethod, type: payModal.type }),
      })
      if (res.ok) {
        setPayModal(null)
        fetchBills()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPaying(false)
    }
  }

  const handleCreateBill = async (e) => {
    e.preventDefault()
    if (!billForm.patient) return alert('Select a patient')
    if (!billForm.doctor_id) return alert('Select a doctor')
    const amt = parseFloat(billForm.amount)
    if (isNaN(amt) || amt < 0) return alert('Enter valid bill amount for new charges')

    const prior = Math.max(0, parseFloat(billForm.patient.total_balance || 0))
    const include = billForm.includePrior && prior > 0
    const lineTotal = amt + (include ? prior : 0)

    let paidIn = parseFloat(billForm.paid_amount)
    if (isNaN(paidIn) || paidIn < 0) paidIn = lineTotal
    if (paidIn > lineTotal) paidIn = lineTotal

    setSaving(true)
    try {
      const visitRes = await fetch(`${API_BASE}/visit/get-or-create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patient_id: billForm.patient.id })
      })
      const visitData = await visitRes.json()
      const visitId = visitData.visit_id || visitData.id

      const res = await fetch(`${API_BASE}/bill/create-advanced/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: billForm.patient.id,
          visit: visitId,
          total_amount: amt,
          paid_amount: paidIn,
          payment_method: billForm.payment_method,
          include_prior_balance: include,
          items: [{ name: 'Clinical services', quantity: 1, unit_price: amt, fee_type: 'Treatment' }],
          doctor_id: billForm.doctor_id || null
        })
      })
      if (res.ok) {
        setShowAdd(false)
        setBillForm({ patient: null, amount: '', paid_amount: '', payment_method: 'Cash', doctor_id: '', includePrior: false })
        fetchBills()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Could not create bill.')
      }
    } catch (err) {
      console.error(err)
      alert('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleWaiveOutstanding = async () => {
    if (!billForm.patient) return
    const bal = parseFloat(billForm.patient.total_balance || 0)
    if (bal <= 0) return alert('No outstanding balance to waive.')
    if (!window.confirm(`Remove (waive) the full outstanding balance of ₹${bal.toFixed(2)}?`)) return

    try {
      const res = await fetch(`${API_BASE}/patient/${billForm.patient.id}/balance/waiver/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return alert(data.error || 'Could not waive balance.')
      }
      alert('Balance waived successfully.')
      // Refresh patient data in form by forcing a clear or something, or just hiding form
      setBillForm(prev => ({ ...prev, patient: { ...prev.patient, total_balance: 0 }, includePrior: false }))
      fetchBills()
    } catch (e) {
      console.error(e)
      alert('Error waiving balance.')
    }
  }

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Billing & Payments</h1>
          <p>Complete transaction history across all patients</p>
        </div>
        <div className={styles.stats}>
          <div className={`${styles.statCard} ${styles.billed}`}>
            <span>Total Billed</span>
            <strong>₹{stats.totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div className={`${styles.statCard} ${styles.collected}`}>
            <span>Total Collected</span>
            <strong className={styles.success}>
              ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className={`${styles.statCard} ${styles.outstanding}`}>
            <span>Total Debt</span>
            <strong className={styles.danger}>
              ₹{totalDebt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setShowAdd(!showAdd)}
          style={{ background: '#4f46e5', color: '#fff', padding: '12px 24px', borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
        >
          {showAdd ? '✕ Close' : '+ Create Direct Bill'}
        </button>
      </header>

      {/* ── New Bill Form ── */}
      {showAdd && (
        <form onSubmit={handleCreateBill} style={{
          background: 'transparent', borderRadius: 16, padding: '24px', marginBottom: 24,
          border: '1px solid var(--border-light)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--slate-900)', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🧾</span> Create Direct Bill
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>Select Patient *</label>
              <PatientPicker onSelect={p => setBillForm({ ...billForm, patient: p })} />

              {billForm.patient && parseFloat(billForm.patient.total_balance) > 0 && (
                <div style={{ marginTop: 12, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#92400e' }}>OUTSTANDING BALANCE:</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#dc2626' }}>₹{parseFloat(billForm.patient.total_balance).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#b45309', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={billForm.includePrior}
                        onChange={e => setBillForm({ ...billForm, includePrior: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#d97706' }}
                      />
                      Add to this bill
                    </label>
                    <button
                      type="button"
                      onClick={handleWaiveOutstanding}
                      style={{ padding: '6px 12px', fontSize: 11, background: 'rgba(255, 255, 255, 0.03)', color: '#9a3412', border: '1px solid #fdba74', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}
                    >
                      Remove / Waive
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>Doctor *</label>
              <select
                value={billForm.doctor_id}
                onChange={e => setBillForm({ ...billForm, doctor_id: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)', outline: 'none' }}
              >
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>New Charges (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={billForm.amount}
                onChange={e => setBillForm({ ...billForm, amount: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-light)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>Amount Collecting Now (₹)</label>
              <input
                type="number"
                placeholder="Leave blank for full"
                value={billForm.paid_amount}
                onChange={e => setBillForm({ ...billForm, paid_amount: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-light)', outline: 'none', fontWeight: 600, color: '#16a34a' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--slate-700)', marginBottom: 6 }}>Payment Method</label>
              <select
                value={billForm.payment_method}
                onChange={e => setBillForm({ ...billForm, payment_method: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)', outline: 'none' }}
              >
                <option>Cash</option>
                <option>Card</option>
                <option>UPI</option>
                <option>Online</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1' }}>
              <button
                type="submit"
                disabled={saving || !billForm.patient}
                style={{
                  width: '100%', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', padding: '12px', borderRadius: 10,
                  border: 'none', fontWeight: 800, fontSize: 14, cursor: saving || !billForm.patient ? 'not-allowed' : 'pointer',
                  opacity: saving || !billForm.patient ? 0.7 : 1, boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                }}
              >
                {saving ? 'Creating Bill...' : 'Save Bill Transaction'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            placeholder="Search by patient name or phone…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          {q && <button onClick={() => setQ('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}>✕</button>}
        </div>

        <div className={styles.filters}>
          <div className={styles.filterTabs}>
            {['', 'Pending', 'Partial', 'Paid'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`${styles.filterBtn} ${filterStatus === s ? styles.active : ''}`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className={styles.dateGroup}>
            <label>From:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className={styles.dateGroup}>
            <label>To:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className={styles.clearBtn} onClick={() => { setQ(''); setStartDate(''); setEndDate(''); setFilterStatus('') }}>
            Reset
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>No.</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Patient Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Total(₹)</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Discount(₹)</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Received(₹)</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Balance(₹)</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Payment</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className={styles.loading}>
                <span className={styles.spinner} /> Loading bills…
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="9" className={styles.loading}>
                No transactions matching your criteria.
              </td></tr>
            ) : (
              filtered.map((bill, index) => {
                const balance = parseFloat(bill.balance_amount || 0)
                const discount = parseFloat(bill.discount_amount || bill.discount || 0)
                return (
                  <tr key={bill.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>{index + 1}</td>
                    <td style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>
                      <div style={{ fontWeight: 500, color: '#334155' }}>
                        {new Date(bill.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(bill.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                          {(bill.patient_name || 'U')[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, color: '#334155', fontSize: '14px' }}>{bill.patient_name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 500, color: '#475569', fontSize: '14px' }}>
                      {parseFloat(bill.total_amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 500, color: '#475569', fontSize: '14px' }}>
                      {discount.toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 500, color: '#475569', fontSize: '14px' }}>
                      {parseFloat(bill.paid_amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 500, color: balance > 0 ? '#ef4444' : '#475569', fontSize: '14px' }}>
                      {balance.toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {balance > 0 ? (
                        <button
                          onClick={() => handlePay(bill)}
                          style={{
                            backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 20px',
                            borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(16,185,129,0.2)'
                          }}
                        >
                          Pay
                        </button>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', color: '#10b981' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                        <button
                          onClick={() => setViewingBill(bill)}
                          title="History/View"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><polyline points="12 7 12 12 15 15"></polyline></svg>
                        </button>
                        <button
                          title="Delete"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                        <button
                          onClick={() => printPdf(`${API_BASE}/billing/${bill.id}/pdf/`)}
                          title="Print Invoice"
                          style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {!loading && filtered.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 32, padding: '18px 24px',
            borderTop: '2px solid #f1f5f9', background: 'transparent',
            fontSize: 12, fontWeight: 800,
          }}>
            <span style={{ color: '#94a3b8', textTransform: 'uppercase' }}>
              {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--slate-900)' }}>BILLED: ₹{stats.totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span style={{ color: '#10b981' }}>COLLECTED: ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span style={{ color: '#ef4444' }}>TOTAL DEBT: ₹{totalDebt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>

      {/* ── Payment Modal ── */}
      {payModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setPayModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, padding: '28px 32px',
            width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--slate-900)' }}>💰 Collect Payment</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
              Patient: <strong>{payModal.patientName}</strong> · Balance: <strong style={{ color: '#dc2626' }}>₹{payModal.balance.toFixed(2)}</strong>
            </p>

            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Amount (₹) *</label>
            <input
              type="number"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              min="0.01" step="0.01"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 15, fontWeight: 700, marginBottom: 14, boxSizing: 'border-box' }}
              autoFocus
            />

            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Payment Method</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {['Cash', 'Card', 'UPI', 'Online', 'Cheque'].map(m => (
                <button key={m} type="button"
                  onClick={() => setPayMethod(m)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1.5px solid',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    borderColor: payMethod === m ? '#4f46e5' : '#e2e8f0',
                    background: payMethod === m ? '#eef2ff' : '#f8fafc',
                    color: payMethod === m ? '#4f46e5' : '#64748b',
                  }}
                >{m}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={confirmPay}
                disabled={paying || !payAmount || parseFloat(payAmount) <= 0}
                style={{
                  flex: 1, padding: '11px', background: '#16a34a', color: '#fff',
                  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', opacity: paying ? 0.7 : 1
                }}
              >
                {paying ? 'Processing…' : `✓ Collect ₹${parseFloat(payAmount || 0).toFixed(2)} via ${payMethod}`}
              </button>
              <button onClick={() => setPayModal(null)} style={{
                padding: '11px 18px', background: 'rgba(255, 255, 255, 0.02)', border: 'none',
                borderRadius: 8, cursor: 'pointer', fontWeight: 600
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bill Details Modal ── */}
      {viewingBill && (
        <div className={styles.modalOverlay} onClick={() => setViewingBill(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h2>🧾 Transaction Details (ID: #{viewingBill.id})</h2>
              <button className={styles.closeBtn} onClick={() => setViewingBill(null)}>✕</button>
            </header>

            <main className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Patient</span>
                  <span className={styles.detailValue}>{viewingBill.patient_name} ({viewingBill.patient_phone || 'No Phone'})</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Date & Time</span>
                  <span className={styles.detailValue}>
                    {new Date(viewingBill.created_at).toLocaleString('en-IN', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Doctor</span>
                  <span className={styles.detailValue}>{viewingBill.doctor_name ? `Dr. ${viewingBill.doctor_name}` : 'General Clinic / Unassigned'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Payment Method</span>
                  <span className={styles.detailValue} style={{ textTransform: 'uppercase' }}>{viewingBill.payment_method}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Total Amount</span>
                  <span className={styles.detailValue} style={{ color: 'var(--slate-900)', fontWeight: 800 }}>₹{parseFloat(viewingBill.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Amount Paid</span>
                  <span className={styles.detailValue} style={{ color: '#16a34a', fontWeight: 800 }}>₹{parseFloat(viewingBill.paid_amount || 0).toFixed(2)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Balance Due</span>
                  <span className={styles.detailValue} style={{ color: parseFloat(viewingBill.balance_amount || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: 800 }}>
                    ₹{parseFloat(viewingBill.balance_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Bill Type</span>
                  <span className={styles.detailValue}>{viewingBill.bill_type || viewingBill.type || 'Clinical'}</span>
                </div>
                {viewingBill.notes && (
                  <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.detailLabel}>Notes / Description</span>
                    <span className={styles.detailValue} style={{ fontWeight: 400, fontStyle: 'italic', color: 'var(--slate-700)', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', marginTop: 4 }}>
                      {viewingBill.notes}
                    </span>
                  </div>
                )}
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--slate-900)', margin: '24px 0 12px' }}>📦 Itemized Breakdown</h3>
              {viewingBill.items && viewingBill.items.length > 0 ? (
                <table className={styles.modalItemsTable}>
                  <thead>
                    <tr>
                      <th>Service / Product</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingBill.items.map((item, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{item.name}</td>
                        <td>
                          <span style={{ fontSize: 11, background: 'rgba(255, 255, 255, 0.02)', color: 'var(--slate-700)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                            {item.fee_type || 'Treatment'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.qty}</td>
                        <td style={{ textAlign: 'right' }}>₹{parseFloat(item.price || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--slate-900)' }}>₹{parseFloat((item.price || 0) * item.qty).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', background: 'transparent', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                  No itemized lines recorded for this transaction.
                </div>
              )}
            </main>

            <footer className={styles.modalFooter}>
              <button
                className={styles.clearBtn}
                onClick={() => setViewingBill(null)}
                style={{ padding: '10px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Close View
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
