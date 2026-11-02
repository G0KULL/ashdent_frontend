import { useState, useEffect, useCallback } from 'react'
import styles from './Accounts.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

const CATEGORIES = {
  Income: ['Patient Payment', 'Consultation', 'Treatment', 'Medicine Sale', 'Other Income'],
  Expense: ['Salary', 'Materials', 'Lab Fee', 'Maintenance', 'Rent', 'Electricity', 'Marketing', 'Other Expense']
}

export default function Accounts() {
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net_profit: 0 })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [patientQuery, setPatientQuery] = useState('')
  
  // Filters
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0], // Start of month
    end_date: new Date().toISOString().split('T')[0],
    doctor: '',
    category: '',
    type: ''
  })

  const [formData, setFormData] = useState({
    type: 'Income',
    amount: '',
    category: 'Patient Payment',
    doctor: '',
    patient: '',
    notes: '',
    payment_method: 'Cash',
    date: new Date().toISOString().split('T')[0]
  })

  const fetchSummary = useCallback(async () => {
    try {
      const q = new URLSearchParams(filters).toString()
      const res = await fetch(`${API_BASE}/accounts/summary/?${q}`)
      const data = await res.json()
      setSummary(data)
    } catch (e) { console.error(e) }
  }, [filters])

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams(filters).toString()
      const res = await fetch(`${API_BASE}/transactions/?${q}`)
      const data = await res.json()
      setTransactions(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchSummary()
    fetchTransactions()
  }, [fetchSummary, fetchTransactions])

  useEffect(() => {
    // Load Doctors
    fetch(`${API_BASE}/doctors/`).then(r => r.json()).then(setDoctors)
  }, [])

  useEffect(() => {
    if (patientQuery.length > 2) {
      fetch(`${API_BASE}/patient/search/?q=${patientQuery}`)
        .then(r => r.json())
        .then(setPatients)
    } else {
      setPatients([])
    }
  }, [patientQuery])

  const handleAddTransaction = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/transactions/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowAddModal(false)
        setFormData({ ...formData, amount: '', notes: '', patient: '' })
        setPatientQuery('')
        fetchSummary()
        fetchTransactions()
      }
    } catch (e) { console.error(e) }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Accounts & Finance</h1>
          <p className={styles.subtitle}>Track your clinic's income and expenses</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          + Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.card} ${styles.incomeCard}`}>
          <div className={styles.cardLabel}>Total Income</div>
          <div className={styles.cardValue}>₹{summary.total_income.toLocaleString()}</div>
          <div className={styles.cardIcon}>📈</div>
        </div>
        <div className={`${styles.card} ${styles.expenseCard}`}>
          <div className={styles.cardLabel}>Total Expenses</div>
          <div className={styles.cardValue}>₹{summary.total_expense.toLocaleString()}</div>
          <div className={styles.cardIcon}>📉</div>
        </div>
        <div className={`${styles.card} ${styles.profitCard}`}>
          <div className={styles.cardLabel}>Net Profit</div>
          <div className={styles.cardValue} style={{ color: summary.net_profit >= 0 ? '#16a34a' : '#dc2626' }}>
            ₹{summary.net_profit.toLocaleString()}
          </div>
          <div className={styles.cardIcon}>💰</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label>From</label>
          <input type="date" value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value})} />
        </div>
        <div className={styles.filterGroup}>
          <label>To</label>
          <input type="date" value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value})} />
        </div>
        <div className={styles.filterGroup}>
          <label>Type</label>
          <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value, category: ''})}>
            <option value="">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Doctor</label>
          <select value={filters.doctor} onChange={e => setFilters({...filters, doctor: e.target.value})}>
            <option value="">All Doctors</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Recent Transactions</h2>
          <button className={styles.refreshBtn} onClick={() => {fetchSummary(); fetchTransactions()}}>Refresh</button>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Details</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>Loading transactions...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>No transactions found for this period.</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{new Date(t.date).toLocaleDateString()}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(t.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td>
                      <span className={t.type === 'Income' ? styles.tagIncome : styles.tagExpense}>
                        {t.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{t.notes || '--'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {t.patient_name ? `Pat: ${t.patient_name}` : ''} 
                        {t.doctor_name ? ` · Dr: ${t.doctor_name}` : ''}
                      </div>
                    </td>
                    <td>{t.payment_method}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: t.type === 'Income' ? '#16a34a' : '#dc2626' }}>
                      {t.type === 'Income' ? '+' : '-'} ₹{parseFloat(t.amount).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Add New Transaction</h2>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddTransaction} className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Type</label>
                  <div className={styles.typeToggle}>
                    <button 
                      type="button" 
                      className={formData.type === 'Income' ? styles.activeIncome : ''}
                      onClick={() => setFormData({...formData, type: 'Income', category: 'Patient Payment'})}
                    >Income</button>
                    <button 
                      type="button" 
                      className={formData.type === 'Expense' ? styles.activeExpense : ''}
                      onClick={() => setFormData({...formData, type: 'Expense', category: 'Materials'})}
                    >Expense</button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})} 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES[formData.type].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Doctor (Optional)</label>
                <select value={formData.doctor} onChange={e => setFormData({...formData, doctor: e.target.value})}>
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className={styles.formGroup} style={{ position: 'relative' }}>
                <label>Patient (Optional)</label>
                <input 
                  placeholder="Search patient name..." 
                  value={patientQuery}
                  onChange={e => setPatientQuery(e.target.value)}
                />
                {patients.length > 0 && (
                  <div className={styles.searchResults}>
                    {patients.map(p => (
                      <div 
                        key={p.id} 
                        className={styles.searchItem}
                        onClick={() => {
                          setFormData({...formData, patient: p.id})
                          setPatientQuery(p.name)
                          setPatients([])
                        }}
                      >
                        {p.name} ({p.phone})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Notes / Description</label>
                <textarea 
                  rows="2" 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="e.g. Salary for June, Paid for Implants, etc."
                ></textarea>
              </div>

              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <select value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <button type="submit" className={styles.saveBtn}>Save Transaction</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
