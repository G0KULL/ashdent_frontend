import { useState, useEffect } from 'react'
import styles from './PharmacyStock.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

export default function PharmacyStock() {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const fetchStock = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/pharmacy/stock/batches/`)
      const data = await res.json()
      setStocks(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    fetchStock()
  }, [])

  const filtered = stocks.filter(s => 
    s.medicine_name.toLowerCase().includes(filter.toLowerCase()) ||
    s.batch_no.toLowerCase().includes(filter.toLowerCase())
  )

  const isExpired = (date) => new Date(date) < new Date()
  const isExpiringSoon = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = d - now
    return diff > 0 && diff < (30 * 24 * 60 * 60 * 1000) // 30 days
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Batch-wise Inventory</h1>
        <div className={styles.controls}>
          <input 
            placeholder="Filter by medicine or batch..." 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className={styles.searchBar}
          />
          <button className={styles.refreshBtn} onClick={fetchStock}>↻ Refresh</button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Batch No</th>
              <th>Expiry Date</th>
              <th style={{ textAlign: 'right' }}>Current Qty</th>
              <th style={{ textAlign: 'right' }}>Purchase Price</th>
              <th style={{ textAlign: 'right' }}>MRP</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>Loading inventory...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>No stock found.</td></tr>
            ) : (
              filtered.map(s => {
                const expired = isExpired(s.expiry_date)
                const soon = isExpiringSoon(s.expiry_date)
                
                return (
                  <tr key={s.id}>
                    <td><div style={{ fontWeight: 700 }}>{s.medicine_name}</div></td>
                    <td><code className={styles.batchCode}>{s.batch_no}</code></td>
                    <td style={{ color: expired ? '#ef4444' : soon ? '#f59e0b' : 'inherit' }}>
                      {new Date(s.expiry_date).toLocaleDateString()}
                      {expired && <span className={styles.badgeDanger}>Expired</span>}
                      {soon && <span className={styles.badgeWarning}>Soon</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>{s.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₹{s.purchase_price}</td>
                    <td style={{ textAlign: 'right' }}>₹{s.mrp}</td>
                    <td>
                      <div className={styles.statusDot} style={{ background: s.quantity > 10 ? '#10b981' : '#f59e0b' }} />
                      {s.quantity > 10 ? 'Healthy' : 'Low Stock'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
