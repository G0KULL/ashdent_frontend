import { useState, useEffect } from 'react'
import styles from './Pharmacy.module.css'
import PharmacyStock from './PharmacyStock'
import Suppliers from './Suppliers'
import PurchaseEntry from './PurchaseEntry'


const API = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' }
}

/** PDF routes need auth headers; a bare window.open() does not send X-User-Id. */
async function openBillingPdf(billId) {
  if (billId == null || billId === '') {
    alert('Billing record not found for this item.')
    return
  }
  try {
    const res = await fetch(`${API}/billing/${billId}/pdf/`, { headers: getHeaders() })
    const ct = res.headers.get('content-type') || ''
    if (!res.ok) {
      if (ct.includes('application/json')) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Could not open receipt.')
      } else {
        alert(`Could not open receipt (HTTP ${res.status}).`)
      }
      return
    }
    if (!ct.includes('application/pdf')) {
      const text = await res.text()
      try {
        const j = JSON.parse(text)
        alert(j.error || 'Unexpected response when loading receipt.')
      } catch {
        alert('Receipt could not be loaded.')
      }
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    
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
    
    iframe.dataset.blobUrl = url
    iframe.src = url
    
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
    console.error(e)
    alert('Network error while loading receipt.')
  }
}

export default function Pharmacy({ userRole, initialTab = 'stock' }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [queue, setQueue] = useState([])
  const [stock, setStock] = useState([])
  const [recentBills, setRecentBills] = useState([])
  const [purchaseHistory, setPurchaseHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Finance Analytics States
  const [financeMonth, setFinanceMonth] = useState(new Date().getMonth() + 1)
  const [financeYear, setFinanceYear] = useState(new Date().getFullYear())
  const [financeFilterType, setFinanceFilterType] = useState('monthly')
  const [financeStartDate, setFinanceStartDate] = useState(new Date().toISOString().split('T')[0])
  const [financeEndDate, setFinanceEndDate] = useState(new Date().toISOString().split('T')[0])
  const [financeData, setFinanceData] = useState(null)
  const [loadingFinance, setLoadingFinance] = useState(false)

  // Sync activeTab if initialTab changes (when clicking sidebar items)
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  // Pharmacy settings (from Settings → Pharmacy Settings)
  const [pharmSettings, setPharmSettings] = useState({
    default_payment_method: 'Cash',
    low_stock_threshold: 10,
    require_prescription: false,
    allow_partial_dispensing: true,
    auto_deduct_stock_on_bill: true,
    auto_print_receipt: false,
  })

  // Bill preview modal
  const [billPreview, setBillPreview] = useState(null) // { rx, items }
  const [editableItems, setEditableItems] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [billing, setBilling] = useState(false)
  const [patientProfile, setPatientProfile] = useState(null)
  const [viewingBill, setViewingBill] = useState(null) // { id, patient_name, items, ... }
  const [editingBill, setEditingBill] = useState(null) // { items: [] }
  const [showDirectBill, setShowDirectBill] = useState(false)
  const [billSuccess, setBillSuccess] = useState(null) // { id, total, patient }
  const [previewSearchMed, setPreviewSearchMed] = useState('')
  const [previewMedResults, setPreviewMedResults] = useState([])


  // Add stock modal
  const [showAddStock, setShowAddStock] = useState(false)
  const [showPurchase, setShowPurchase] = useState(false)
  const [editStock, setEditStock] = useState(null)
  const [newMed, setNewMed] = useState({ name: '', stock_quantity: 0, purchase_rate: 0, sales_rate: 0, low_stock_threshold: 10 })
  const [purchaseData, setPurchaseData] = useState({ medicine_name: '', supplier: '', quantity: 0, purchase_rate: 0, sales_rate: 0 })

  const isPharmacist = ['Pharmacist', 'Admin', 'Doctor'].includes(userRole)

  // Load pharmacy settings on mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/settings/pharmacy/')
      .then(r => r.json())
      .then(data => {
        setPharmSettings(data)
        // Apply default payment method from settings
        setPaymentMethod(data.default_payment_method || 'Cash')
      })
      .catch(e => console.error('Failed to load pharmacy settings:', e))
  }, [])

  useEffect(() => {
    fetchQueue()
    if (isPharmacist) {
      fetchStock()
      fetchRecentBills()
      fetchPurchaseHistory()
    }
    const interval = setInterval(() => {
      fetchQueue()
      if (isPharmacist) {
        fetchStock()
        fetchRecentBills()
        fetchPurchaseHistory()
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [userRole, selectedDate])


  useEffect(() => {
    if (activeTab === 'finance' && isPharmacist) {
      fetchFinanceData()
    }
  }, [activeTab, financeFilterType, financeMonth, financeYear, financeStartDate, financeEndDate, isPharmacist])

  const fetchFinanceData = async () => {
    setLoadingFinance(true)
    try {
      let url = `${API}/finance/dashboard/?filter_type=${financeFilterType}`
      if (financeFilterType === 'monthly') {
        url += `&month=${financeMonth}&year=${financeYear}`
      } else if (financeFilterType === 'custom') {
        url += `&start_date=${financeStartDate}&end_date=${financeEndDate}`
      }
      const res = await fetch(url, { headers: getHeaders() })
      const data = await res.json()
      setFinanceData(data)
    } catch (e) {
      console.error(e)
    }
    setLoadingFinance(false)
  }

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const url = selectedDate ? `${API}/pharmacy/queue/?date=${selectedDate}` : `${API}/pharmacy/queue/`
      const res = await fetch(url, { headers: getHeaders() })
      const data = await res.json()
      setQueue(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchStock = async () => {
    try {
      const res = await fetch(`${API}/stock/`, { headers: getHeaders() })
      const data = await res.json()
      setStock(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  const fetchRecentBills = async () => {
    try {
      const url = selectedDate ? `${API}/payments/recent/?type=Pharmacy&date=${selectedDate}` : `${API}/payments/recent/?type=Pharmacy`
      const res = await fetch(url, { headers: getHeaders() })
      const data = await res.json()
      setRecentBills(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  const fetchPurchaseHistory = async () => {
    try {
      const res = await fetch(`${API}/stock/purchase/history/`, { headers: getHeaders() })
      const data = await res.json()
      setPurchaseHistory(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  const addExtraToPreview = (med) => {
    // Prevent duplicates in preview
    if (med.id && editableItems.find(i => i.id === med.id)) return

    setEditableItems([...editableItems, {
      id: med.id || Date.now(),
      name: med.name,
      quantity: 1,
      unit_price: med.sales_rate || med.price || 0,
      dosage: '-',
      duration: '-'
    }])
    setPreviewSearchMed('')
    setPreviewMedResults([])
  }

  const removePreviewItem = (index) => {
    setEditableItems(editableItems.filter((_, i) => i !== index))
  }

  const handleAddToBill = (rx) => {
    setBillPreview(rx)
    setEditableItems(rx.items.map(i => ({ ...i })))
    // Fetch patient profile for balance
    fetch(`${API}/patient/${rx.patient_id}/profile/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => setPatientProfile(data))
      .catch(e => console.error(e))
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...editableItems]
    updated[index][field] = value
    setEditableItems(updated)
  }

  const confirmBill = async () => {
    if (!billPreview) return
    setBilling(true)
    try {
      const res = await fetch(`${API}/pharmacy/bill/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          prescription_id: billPreview.prescription_id,
          payment_method: paymentMethod,
          items: editableItems // Send overridden items
        })
      })
      const data = await res.json()
      if (res.ok) {
        setBillSuccess({
          id: data.bill_id,
          total: data.total_amount,
          patient: billPreview.patient_name,
          alerts: data.low_stock_alerts
        })
        setBillPreview(null)
        // Try auto-open, but success modal is fallback
        openBillingPdf(data.bill_id)
        fetchQueue()
        if (isPharmacist) {
          fetchStock()
          fetchRecentBills()
        }
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (e) {
      console.error(e)
      alert('Network error. Please try again.')
    }
    setBilling(false)
  }

  const handleViewBill = async (rx) => {
    try {
      const res = await fetch(`${API}/payments/search/?q=${rx.patient_phone}`, { headers: getHeaders() })
      const data = await res.json()
      // Find the bill for this prescription in the patient's bills
      const bill = data.find(b => b.notes?.includes(`#${rx.prescription_id}`))
      if (bill) {
        setViewingBill(bill)
      } else {
        alert('Could not find bill details.')
      }
    } catch (e) { console.error(e) }
  }

  const handleSaveStock = async (e) => {
    e.preventDefault()
    try {
      const url = editStock ? `${API}/stock/${editStock.id}/` : `${API}/stock/`
      const method = editStock ? 'PATCH' : 'POST'

      const payload = {
        ...newMed,
        stock_quantity: parseInt(newMed.stock_quantity) || 0,
        low_stock_threshold: parseInt(newMed.low_stock_threshold) || 10,
        purchase_rate: parseFloat(newMed.purchase_rate) || 0,
        sales_rate: parseFloat(newMed.sales_rate) || 0
      }

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setShowAddStock(false)
        setEditStock(null)
        setNewMed({ name: '', stock_quantity: 0, purchase_rate: 0, sales_rate: 0, low_stock_threshold: 10 })
        fetchStock()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to save')
      }
    } catch (e) {
      console.error(e)
      alert('Error connecting to server. Please check your network.')
    }
  }

  const openEdit = (med) => {
    setEditStock(med)
    setNewMed({ name: med.name, stock_quantity: med.stock_quantity, purchase_rate: med.purchase_rate, sales_rate: med.sales_rate, low_stock_threshold: med.low_stock_threshold })
    setShowAddStock(true)
  }

  const lowStockCount = stock.filter(m =>
    m.stock_quantity <= (pharmSettings.low_stock_threshold || m.low_stock_threshold || 10)
  ).length

  const pendingCount = queue.filter(q => q.status === 'PENDING').length

  const handleSavePurchase = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API}/stock/purchase/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(purchaseData)
      })
      if (res.ok) {
        setShowPurchase(false)
        setPurchaseData({ medicine_name: '', supplier: '', quantity: 0, purchase_rate: 0, sales_rate: 0 })
        alert('Stock purchase recorded successfully!')
        fetchStock()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to record purchase')
      }
    } catch (e) { alert('Network error') }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>💊 Pharmacy Hub</h1>
          <div className={styles.tabs}>
            {isPharmacist && (
              <>
                <button className={activeTab === 'stock' ? styles.activeTab : ''} onClick={() => setActiveTab('stock')}>
                  Stock & Medicines
                </button>
                <button className={activeTab === 'purchases' ? styles.activeTab : ''} onClick={() => setActiveTab('purchases')}>
                  Stock Purchases
                </button>
                <button className={activeTab === 'bills' ? styles.activeTab : ''} onClick={() => setActiveTab('bills')}>
                  Recent Bills
                </button>
                <button className={activeTab === 'finance' ? styles.activeTab : ''} onClick={() => setActiveTab('finance')}>
                  📊 Financial Analytics
                </button>
              </>
            )}
          </div>
        </div>
        {(activeTab === 'bills') && (
          <div className={styles.filterBar}>
            <div className={styles.dateFilter}>
              <label>Filter by Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
          </div>
        )}
        {activeTab === 'finance' && isPharmacist && (
          <div className={styles.filterBar}>
            <div className={styles.dateFilter} style={{ gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Filter Type:</label>
              <select
                value={financeFilterType}
                onChange={e => setFinanceFilterType(e.target.value)}
                className={styles.dateInput}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom Range</option>
              </select>

              {financeFilterType === 'monthly' && (
                <>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Month:</label>
                  <select
                    value={financeMonth}
                    onChange={e => setFinanceMonth(parseInt(e.target.value))}
                    className={styles.dateInput}
                  >
                    <option value={1}>January</option>
                    <option value={2}>February</option>
                    <option value={3}>March</option>
                    <option value={4}>April</option>
                    <option value={5}>May</option>
                    <option value={6}>June</option>
                    <option value={7}>July</option>
                    <option value={8}>August</option>
                    <option value={9}>September</option>
                    <option value={10}>October</option>
                    <option value={11}>November</option>
                    <option value={12}>December</option>
                  </select>

                  <label style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginLeft: 8 }}>Year:</label>
                  <select
                    value={financeYear}
                    onChange={e => setFinanceYear(parseInt(e.target.value))}
                    className={styles.dateInput}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </>
              )}

              {financeFilterType === 'custom' && (
                <>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Start:</label>
                  <input
                    type="date"
                    value={financeStartDate}
                    onChange={e => setFinanceStartDate(e.target.value)}
                    className={styles.dateInput}
                    style={{ width: '130px' }}
                  />
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginLeft: 8 }}>End:</label>
                  <input
                    type="date"
                    value={financeEndDate}
                    onChange={e => setFinanceEndDate(e.target.value)}
                    className={styles.dateInput}
                    style={{ width: '130px' }}
                  />
                </>
              )}
            </div>
          </div>
        )}
        {activeTab === 'stock' && isPharmacist && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button className={styles.addBtn} style={{ background: '#10b981' }} onClick={() => setShowDirectBill(true)}>
              🧾 Direct Medicine Bill
            </button>
            <button className={styles.addBtn} style={{ background: '#6366f1' }} onClick={() => setShowPurchase(true)}>
              📥 Record Purchase
            </button>
            <button className={styles.addBtn} onClick={() => { setEditStock(null); setNewMed({ name: '', stock_quantity: 0, purchase_rate: 0, sales_rate: 0, low_stock_threshold: 10 }); setShowAddStock(true) }}>
              + Add New Medicine
            </button>
          </div>
        )}
      </header>

      {/* ── STOCK TAB ── */}
      {activeTab === 'stock' && isPharmacist && (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span>Total Medicines</span>
              <strong>{stock.length}</strong>
            </div>
            <div className={styles.statCard} style={{ borderLeft: '4px solid #ef4444' }}>
              <span>Low Stock Alerts</span>
              <strong style={{ color: '#ef4444' }}>{lowStockCount}</strong>
            </div>
          </div>

          <div className={styles.toolbar} style={{ justifyContent: 'space-between' }}>
            <input type="text" placeholder="🔍 Search medicines..." className={styles.search}
              value={search} onChange={e => setSearch(e.target.value)} style={{ width: '40%' }} />

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setNewMed({ name: '', stock_quantity: 0, low_stock_threshold: 10, purchase_rate: 0, sales_rate: 0 });
                  setEditStock(null);
                  setShowAddStock(true);
                }}
                style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                + Add New Medicine
              </button>
              <button
                onClick={() => {
                  const printWin = window.open('', '_blank')
                  if (!printWin) {
                    alert('Please allow popups for this site to print the price list.')
                    return
                  }
                  const rows = stock.map(m => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #eee;">${m.name}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${m.stock_quantity}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹${parseFloat(m.sales_rate).toFixed(2)}</td>
                    </tr>
                  `).join('');

                  printWin.document.write(`
                    <html>
                      <head>
                        <title>Medicine Price List</title>
                        <style>
                          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
                          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                          th { background: #f8fafc; text-align: left; padding: 12px 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
                          h1 { margin-bottom: 5px; }
                          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>Medicine Price List</h1>
                          <p>Date: ${new Date().toLocaleDateString()}</p>
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th>Medicine Name</th>
                              <th style="text-align: center;">Available Stock</th>
                              <th style="text-align: right;">Price (MRP)</th>
                            </tr>
                          </thead>
                          <tbody>${rows}</tbody>
                        </table>
                        <div style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">
                          Generated by DoctoSmart HMS
                        </div>
                        <script>window.print();</script>
                      </body>
                    </html>
                  `);
                  printWin.document.close();
                }}
                style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#4f46e5', border: '1.5px solid #4f46e5', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                🖨️ Print Price List
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>In Stock</th>
                  <th>Purchase Price</th>
                  <th>Sales Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stock.filter(m => (m.name || '').toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No medicines found. {search && 'Try a different search or '} click "Add New Medicine".
                    </td>
                  </tr>
                ) : (
                  stock.filter(m => (m.name || '').toLowerCase().includes(search.toLowerCase())).map(m => {
                    const globalThreshold = pharmSettings.low_stock_threshold || 10
                    const isLow = m.stock_quantity <= globalThreshold
                    return (
                      <tr key={m.id} className={isLow ? styles.lowStockRow : ''}>
                        <td><strong>{m.name}</strong></td>
                        <td className={isLow ? styles.lowStock : ''}>
                          {m.stock_quantity}
                          {isLow && (
                            <span style={{ marginLeft:6, fontSize:11, background:'#fee2e2', color:'#dc2626',
                              padding:'2px 6px', borderRadius:4, fontWeight:700 }}>⚠️ Low</span>
                          )}
                        </td>
                        <td>₹{m.purchase_rate}</td>
                        <td>₹{m.sales_rate}</td>
                        <td style={{ display: 'flex', gap: 8 }}>
                          <button
                            className={styles.addBtn}
                            style={{ background: '#6366f1', padding: '4px 8px', fontSize: 11 }}
                            onClick={() => {
                              setPurchaseData({ ...purchaseData, medicine_name: m.name, purchase_rate: m.purchase_rate, sales_rate: m.sales_rate });
                              setShowPurchase(true);
                            }}
                          >
                            📥 Add Stock
                          </button>
                          <button className={styles.editBtn} onClick={() => openEdit(m)}>Edit</button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── STOCK PURCHASES TAB ── */}
      {activeTab === 'purchases' && isPharmacist && (
        <PurchaseEntry onCancel={() => setActiveTab('stock')} />
      )}

      {/* ── RECENT BILLS TAB ── */}
      {activeTab === 'bills' && isPharmacist && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Items</th>
                <th>Total</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentBills.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No recent pharmacy bills.</td></tr>
              ) : (
                recentBills.map(bill => (
                  <tr key={bill.id}>
                    <td>{new Date(bill.created_at).toLocaleDateString()}</td>
                    <td>
                      <strong>{bill.patient_name}</strong>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{bill.patient_phone}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--slate-700)' }}>
                      {bill.items?.length || 0} items
                    </td>
                    <td style={{ fontWeight: 700, color: '#4f46e5' }}>₹{parseFloat(bill.total_amount).toFixed(2)}</td>
                    <td><span className={styles.badgeSuccess} style={{ background: '#f0fdf4', color: '#166534' }}>{bill.payment_method}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openBillingPdf(bill.id)}
                        className={styles.printBtnSmall}
                        style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                      >
                        🖨️ Print Bill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FINANCIAL ANALYTICS TAB ── */}
      {activeTab === 'finance' && isPharmacist && (
        <div className={styles.financeGrid}>
          {loadingFinance ? (
            <div className={styles.loaderContainer}>
              <div className={styles.loaderSpinner}></div>
              <p>Fetching financial records...</p>
            </div>
          ) : !financeData ? (
            <div className={styles.empty}>
              <p>Failed to load financial records.</p>
            </div>
          ) : (
            <>
              {/* Financial Explanation Info Panel */}
              <div className={styles.financeInfoPanel}>
                <div className={styles.infoIcon}>💡</div>
                <div className={styles.infoText}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--slate-900)' }}>Understand Pharmacy Revenue Calculations</h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--slate-700)', lineHeight: 1.4 }}>
                    Your Pharmacy financials are calculated in real-time as: <strong>Net Profit = Total Sales − Stock Purchase Expenses</strong>. 
                    This represents actual cash flow margin (sales generated minus supplier invoices paid), rather than estimated medicine cost (COGS).
                  </p>
                </div>
              </div>

              {/* Stat Cards with Math Operators */}
              <div className={styles.financeStatsEquation}>
                <div className={`${styles.financeCard} ${styles.salesCard}`}>
                  <span className={styles.financeCardLabel}>Total Sales</span>
                  <strong className={styles.financeCardVal}>
                    ₹{parseFloat(financeData.pharmacySales?.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                  <span className={styles.financeCardDesc}>Gross revenue collected from pharmacy bills</span>
                  <div className={styles.cardBgPattern}>📈</div>
                </div>

                <div className={styles.financeStatsOperator}>−</div>

                <div className={`${styles.financeCard} ${styles.expenseCard}`}>
                  <span className={styles.financeCardLabel}>Stock Purchase Expenses</span>
                  <strong className={styles.financeCardVal}>
                    ₹{parseFloat(financeData.pharmacySales?.total_expenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                  <span className={styles.financeCardDesc}>Actual spent on stock purchases (Advanced + Simple)</span>
                  <div className={styles.cardBgPattern}>📉</div>
                </div>

                <div className={styles.financeStatsOperator}>=</div>

                <div className={`${styles.financeCard} ${styles.profitCard}`}>
                  <span className={styles.financeCardLabel}>Net Profit</span>
                  <strong className={styles.financeCardVal}>
                    ₹{parseFloat(financeData.pharmacySales?.total_profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                  <span className={styles.financeCardDesc}>Total Sales minus Stock Purchase Expenses</span>
                  <div className={styles.cardBgPattern}>💰</div>
                </div>
              </div>

              {/* Medicine-wise Profitability Margins Table */}
              <div className={styles.financeSection}>
                <h3 className={styles.financeSectionTitle}>
                  <span>💊 Medicine Profitability Margins</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>Sorted by Net Profit</span>
                </h3>
                <div className={styles.tableWrap}>
                  <table className={styles.financeTable}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Medicine Name</th>
                        <th style={{ textAlign: 'center' }}>Qty Sold</th>
                        <th style={{ textAlign: 'right' }}>Total Sales</th>
                        <th style={{ textAlign: 'right' }}>Est. Cost (COGS)</th>
                        <th style={{ textAlign: 'right' }}>Est. Profit</th>
                        <th style={{ textAlign: 'right' }}>Est. Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!financeData.pharmacySales?.items || financeData.pharmacySales.items.length === 0) ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                            No sales records found for this month.
                          </td>
                        </tr>
                      ) : (
                        financeData.pharmacySales.items.map((item, index) => {
                          const marginPct = item.sale_price > 0 ? ((item.profit / item.sale_price) * 100) : 0;
                          return (
                            <tr key={index}>
                              <td style={{ textAlign: 'left', fontWeight: 600 }}>{item.name}</td>
                              <td style={{ textAlign: 'center' }}>{item.qty}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                ₹{parseFloat(item.sale_price).toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'right', color: '#64748b' }}>
                                ₹{parseFloat(item.cost).toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }} className={item.profit >= 0 ? styles.profitText : styles.lossText}>
                                ₹{parseFloat(item.profit).toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }} className={marginPct >= 0 ? styles.profitText : styles.lossText}>
                                {marginPct.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daily Sales vs Expenses Breakdown */}
              <div className={styles.financeSection}>
                <h3 className={styles.financeSectionTitle}>📅 Daily Sales & Expenses Trend</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.financeTable}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Date</th>
                        <th style={{ textAlign: 'right' }}>Sales (Revenue)</th>
                        <th style={{ textAlign: 'right' }}>Expenses (Purchases)</th>
                        <th style={{ textAlign: 'right' }}>Net Margin</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!financeData.pharmacySales?.day_by_day || financeData.pharmacySales.day_by_day.length === 0) ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                            No daily sales or purchases logged for this month.
                          </td>
                        </tr>
                      ) : (
                        financeData.pharmacySales.day_by_day.map((day, index) => {
                          const netMargin = day.sales - day.expenses;
                          return (
                            <tr key={index}>
                              <td style={{ textAlign: 'left', fontWeight: 600 }}>
                                {new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                                ₹{parseFloat(day.sales).toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                                ₹{parseFloat(day.expenses).toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }} className={netMargin > 0 ? styles.profitText : netMargin < 0 ? styles.lossText : styles.neutralText}>
                                ₹{parseFloat(netMargin).toFixed(2)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {netMargin > 0 ? (
                                  <span className={styles.badgeSuccess}>Net Gain</span>
                                ) : netMargin < 0 ? (
                                  <span className={styles.badgeDanger}>Expense Outflow</span>
                                ) : (
                                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Balanced</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── BILL PREVIEW MODAL ── */}
      {billPreview && (
        <div className={styles.overlay}>
          <div className={styles.modal} style={{ maxWidth: 520 }}>
            <h2 style={{ margin: '0 0 4px', color: 'var(--slate-900)' }}>🧾 Bill Preview</h2>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>
              Patient: <strong>{billPreview.patient_name}</strong> · {billPreview.patient_phone}
            </p>

            <div style={{ marginBottom: 20, position: 'relative' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8 }}>+ Add Extra Medicine to this Bill</label>
              <input
                type="text"
                placeholder="🔍 Search medicine to add..."
                value={previewSearchMed}
                onFocus={() => { if (!previewSearchMed) setPreviewMedResults(stock.slice(0, 10)) }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && previewMedResults.length > 0) addExtraToPreview(previewMedResults[0])
                }}
                onChange={e => {
                  const val = e.target.value
                  setPreviewSearchMed(val)
                  if (val.length > 0) {
                    setPreviewMedResults(stock.filter(m => m.name.toLowerCase().includes(val.toLowerCase())).slice(0, 10))
                  } else {
                    setPreviewMedResults(stock.slice(0, 10))
                  }
                }}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-light)' }}
              />
              {previewSearchMed.length > 0 && previewMedResults.length === 0 && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownItem} onClick={() => addExtraToPreview({ name: previewSearchMed, price: 0 })} style={{ color: '#4f46e5', fontWeight: 700 }}>
                    + Add "{previewSearchMed}" as custom item
                  </div>
                </div>
              )}
              {previewMedResults.length > 0 && (
                <div className={styles.dropdown} onMouseLeave={() => setPreviewMedResults([])}>
                  {previewMedResults.map(m => (
                    <div key={m.id} onClick={() => addExtraToPreview(m)} className={styles.dropdownItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <strong>{m.name}</strong>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>₹{m.sales_rate}</span>
                      </div>
                      <small>Stock: {m.stock_quantity}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'transparent', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Medicine</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '8px 12px' }}></th>
                </tr>
              </thead>
              <tbody>
                {editableItems.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.dosage} · {item.duration}</div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input type="number" value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-light)', textAlign: 'center' }} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <input type="number" value={item.unit_price}
                        onChange={e => handleItemChange(idx, 'unit_price', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        style={{ width: 80, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-light)', textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                      ₹{((item.unit_price || 0) * item.quantity).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => removePreviewItem(idx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, fontSize: 14 }}>Subtotal:</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, fontSize: 16, color: 'var(--slate-700)' }}>
                    ₹{editableItems.reduce((s, i) => s + (i.unit_price || 0) * i.quantity, 0).toFixed(2)}
                  </td>
                </tr>
                {pharmSettings.apply_gst && (
                  <tr>
                    <td colSpan="3" style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, fontSize: 14 }}>GST ({pharmSettings.gst_percent}%):</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, fontSize: 16, color: 'var(--slate-700)' }}>
                      ₹{(editableItems.reduce((s, i) => s + (i.unit_price || 0) * i.quantity, 0) * ((parseFloat(pharmSettings.gst_percent) || 0) / 100)).toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan="3" style={{ padding: '12px', textAlign: 'right', fontWeight: 800, fontSize: 16, borderTop: '2px solid #e2e8f0' }}>Amount to Pay:</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, fontSize: 22, color: '#4f46e5', borderTop: '2px solid #e2e8f0' }}>
                    ₹{(editableItems.reduce((s, i) => s + (i.unit_price || 0) * i.quantity, 0) * (pharmSettings.apply_gst ? (1 + ((parseFloat(pharmSettings.gst_percent) || 0) / 100)) : 1)).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style={{ marginTop: 20, padding: '10px 15px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fee2e2' }}>
              <p style={{ margin: 0, color: '#b91c1c', fontSize: 12, fontWeight: 700 }}>
                ⚠️ No Credit Policy: Medicines must be paid in full and will not be added to patient dues.
              </p>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-700)' }}>Payment Method:</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 14 }}>
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
              </select>
            </div>

            <div className={styles.modalActions} style={{ marginTop: 20 }}>
              <button onClick={() => setBillPreview(null)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={confirmBill} disabled={billing}
                style={{ background: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                {billing ? 'Processing…' : '✅ Confirm & Generate Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STOCK PURCHASE MODAL ── */}
      {showPurchase && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>📥 Record Stock Purchase</h2>
            <form onSubmit={handleSavePurchase} className={styles.form}>
              <div className={styles.field}>
                <label>Medicine Name</label>
                <input type="text" placeholder="Search or type new medicine..." required value={purchaseData.medicine_name}
                  onChange={e => setPurchaseData({ ...purchaseData, medicine_name: e.target.value })} />
                <p style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>If it's a new medicine, it will be added to the master list.</p>
              </div>
              <div className={styles.field}>
                <label>Supplier / Vendor Name</label>
                <input type="text" required value={purchaseData.supplier}
                  onChange={e => setPurchaseData({ ...purchaseData, supplier: e.target.value })} />
              </div>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>Quantity Purchased</label>
                  <input type="number" min="1" required value={purchaseData.quantity}
                    onChange={e => setPurchaseData({ ...purchaseData, quantity: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>Purchase Rate (₹ per unit)</label>
                  <input type="number" step="0.01" min="0" required value={purchaseData.purchase_rate}
                    onChange={e => setPurchaseData({ ...purchaseData, purchase_rate: e.target.value })} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Selling Rate (₹ per unit) - <i>Optional Update</i></label>
                <input type="number" step="0.01" min="0" value={purchaseData.sales_rate}
                  onChange={e => setPurchaseData({ ...purchaseData, sales_rate: e.target.value })} />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowPurchase(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn} style={{ background: '#6366f1' }}>Record Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT STOCK MODAL ── */}
      {showAddStock && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>{editStock ? 'Update Stock' : 'Add New Medicine'}</h2>
            <form onSubmit={handleSaveStock} className={styles.form}>
              <div className={styles.field}>
                <label>Medicine Name</label>
                <input type="text" required value={newMed.name} disabled={!!editStock}
                  onChange={e => setNewMed({ ...newMed, name: e.target.value })} />
              </div>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>Stock Quantity</label>
                  <input type="number" min="0" value={newMed.stock_quantity}
                    onChange={e => setNewMed({ ...newMed, stock_quantity: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>Low Stock Alert (units)</label>
                  <input type="number" min="1" value={newMed.low_stock_threshold}
                    onChange={e => setNewMed({ ...newMed, low_stock_threshold: e.target.value })} />
                </div>
              </div>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>Purchase Rate (₹)</label>
                  <input type="number" step="0.01" min="0" value={newMed.purchase_rate}
                    onChange={e => setNewMed({ ...newMed, purchase_rate: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>Sales Rate (₹)</label>
                  <input type="number" step="0.01" min="0" value={newMed.sales_rate}
                    onChange={e => setNewMed({ ...newMed, sales_rate: e.target.value })} />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => { setShowAddStock(false); setEditStock(null) }}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>{editStock ? 'Update' : 'Save Medicine'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── VIEW BILL MODAL ── */}
      {viewingBill && (
        <div className={styles.overlay}>
          <div className={styles.modal} style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2>🧾 Bill Details #{viewingBill.id}</h2>
              <button onClick={() => { setViewingBill(null); setEditingBill(null); }} className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.billDetails}>
              <p>Patient: <strong>{viewingBill.patient_name}</strong></p>
              <p>Date: <strong>{new Date(viewingBill.created_at).toLocaleString()}</strong></p>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '12px 0' }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Method:</label>
                {editingBill ? (
                  <select value={editingBill.payment_method}
                    onChange={e => setEditingBill({ ...editingBill, payment_method: e.target.value })}>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                  </select>
                ) : (
                  <strong>{viewingBill.payment_method}</strong>
                )}
              </div>

              <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border-light)' }} />

              <table style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b' }}>
                    <th>Medicine</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(editingBill ? editingBill.items : viewingBill.items).map((item, i) => (
                    <tr key={i}>
                      <td style={{ padding: '8px 0' }}>
                        {item.treatment_name?.replace('Pharmacy: ', '')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {editingBill ? (
                          <input type="number" value={item.qty} style={{ width: 50, textAlign: 'center' }}
                            onChange={e => {
                              const newItems = [...editingBill.items];
                              newItems[i].qty = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                              setEditingBill({ ...editingBill, items: newItems });
                            }} />
                        ) : (
                          item.qty
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {editingBill ? (
                          <input type="number" value={item.price} style={{ width: 70, textAlign: 'right' }}
                            onChange={e => {
                              const newItems = [...editingBill.items];
                              newItems[i].price = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                              setEditingBill({ ...editingBill, items: newItems });
                            }} />
                        ) : (
                          `₹${parseFloat(item.price).toFixed(2)}`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 800, fontSize: 16 }}>
                    <td colSpan="2" style={{ paddingTop: 16 }}>Total:</td>
                    <td style={{ textAlign: 'right', paddingTop: 16, color: '#4f46e5' }}>
                      ₹{(editingBill ? editingBill.items.reduce((s, it) => s + it.qty * it.price, 0) : viewingBill.total_amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                {editingBill ? (
                  <>
                    <button onClick={() => setEditingBill(null)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)' }}>Cancel</button>
                    <button onClick={async () => {
                      try {
                        const total = editingBill.items.reduce((s, it) => s + it.qty * it.price, 0);
                        const res = await fetch(`${API}/billing/${viewingBill.id}/update/`, {
                          method: 'PATCH',
                          headers: getHeaders(),
                          body: JSON.stringify({
                            payment_method: editingBill.payment_method,
                            total_amount: total,
                            items: editingBill.items
                          })
                        });
                        if (res.ok) {
                          alert('Bill updated successfully!');
                          setViewingBill(null);
                          setEditingBill(null);
                          fetchQueue();
                          fetchStock();
                        } else {
                          const err = await res.json();
                          alert(err.error || 'Update failed');
                        }
                      } catch (e) { console.error(e); }
                    }} className={styles.saveBtn} style={{ flex: 1 }}>Save Changes</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditingBill({ ...viewingBill, items: viewingBill.items.map(it => ({ ...it })) })}
                      style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #4f46e5', color: '#4f46e5', background: 'rgba(255, 255, 255, 0.03)', fontWeight: 700 }}>
                      Edit Bill
                    </button>
                    <button onClick={() => openBillingPdf(viewingBill.id)}
                      className={styles.printBtn} style={{ flex: 1 }}>
                      🖨️ Print Receipt
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DIRECT BILLING MODAL ── */}
      {showDirectBill && (
        <DirectBillModal
          onClose={() => setShowDirectBill(false)}
          fetchQueue={fetchQueue}
          fetchStock={fetchStock}
          stock={stock}
          setBillSuccess={setBillSuccess}
        />
      )}

      {/* ── BILL SUCCESS MODAL ── */}
      {billSuccess && (
        <div className={styles.overlay}>
          <div className={styles.modal} style={{ textAlign: 'center', maxWidth: 400, padding: '40px 20px' }}>
            <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
            <h2 style={{ margin: '0 0 10px' }}>Bill Generated!</h2>
            <p style={{ color: '#64748b', marginBottom: 24 }}>
              Bill for <strong>{billSuccess.patient}</strong> of <strong>₹{billSuccess.total.toFixed(2)}</strong> has been recorded.
            </p>

            {billSuccess.alerts?.length > 0 && (
              <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: 12, borderRadius: 8, marginBottom: 20, textAlign: 'left' }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#9a3412' }}>⚠️ Low Stock Warning:</p>
                {billSuccess.alerts.map(a => <div key={a} style={{ fontSize: 11, color: '#c2410c' }}>• {a}</div>)}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => {
                  openBillingPdf(billSuccess.id)
                }}
                style={{ padding: '14px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}
              >
                🖨️ Print Receipt Now
              </button>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Tip: If the print window doesn't open, click the blue button above.
              </div>
              <button
                onClick={() => setBillSuccess(null)}
                style={{ padding: '12px', borderRadius: 12, border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)', color: '#64748b', fontWeight: 600, cursor: 'pointer', marginTop: 8 }}
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DirectBillModal({ onClose, fetchQueue, fetchStock, stock, setBillSuccess }) {
  const [patient, setPatient] = useState(null)
  const [items, setItems] = useState([]) // { id, name, quantity, price }
  const [searchMed, setSearchMed] = useState('')
  const [medResults, setMedResults] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [saving, setSaving] = useState(false)

  const addItem = (med) => {
    // If it's a stock item, prevent duplicates by ID
    if (med.id && items.find(i => i.id === med.id)) return
    // If it's a custom item, prevent duplicates by name
    if (!med.id && items.find(i => i.name === med.name)) return

    setItems([...items, {
      id: med.id || null,
      name: med.name,
      quantity: 1,
      price: med.sales_rate || med.price || 0
    }])
    setSearchMed('')
    setMedResults([])
  }

  const updateItem = (index, field, val) => {
    const updated = [...items]
    updated[index][field] = val
    setItems(updated)
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const gstAmount = pharmSettings.apply_gst ? subtotal * ((parseFloat(pharmSettings.gst_percent) || 0) / 100) : 0
  const total = subtotal + gstAmount

  const handleConfirm = async () => {
    if (pharmSettings.require_prescription) {
      return alert('⚠️ Direct billing is disabled. A doctor prescription is required as per Pharmacy Settings.')
    }
    if (!patient) return alert('Please select a patient')
    if (items.length === 0) return alert('Please add at least one medicine')
    setSaving(true)
    try {
      // 1. Create a Visit for Direct Bill
      const visitRes = await fetch(`${API}/visit/get-or-create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patient_id: patient.id })
      })
      const { visit_id } = await visitRes.json()

      // 2. Generate Billing
      const billRes = await fetch(`${API}/bill/create-advanced/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patient: patient.id,
          visit: visit_id,
          payment_method: paymentMethod,
          paid_amount: total,
          items: [
            ...items.map(i => ({
              name: `Pharmacy: ${i.name}`,
              quantity: i.quantity,
              unit_price: i.price,
              fee_type: 'Pharmacy'
            })),
            ...(pharmSettings.apply_gst && gstAmount > 0 ? [{
              name: `Pharmacy GST (${pharmSettings.gst_percent}%)`,
              quantity: 1,
              unit_price: gstAmount,
              fee_type: 'Pharmacy'
            }] : [])
          ]
        })
      })

      if (billRes.ok) {
        const data = await billRes.json()
        // 3. Deduct Stock Manually (as this is direct bill)
        if (pharmSettings.auto_deduct_stock_on_bill) {
          for (const item of items) {
            const currentStock = stock.find(s => s.id === item.id)
            if (currentStock) {
              await fetch(`${API}/stock/${item.id}/`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ stock_quantity: currentStock.stock_quantity - item.quantity })
              })
            }
          }
        }

        if (data.bill_id) {
          setBillSuccess({
            id: data.bill_id,
            total: total,
            patient: patient.name,
            alerts: []
          })
          openBillingPdf(data.bill_id)
        }
        fetchQueue()
        fetchStock()
        onClose()
      } else {
        const err = await billRes.json()
        alert(`❌ Failed: ${err.error || 'Failed to generate bill'}`)
      }
    } catch (e) {
      console.error(e)
      alert('⚠️ Something went wrong. Check console for details.')
    }
    setSaving(false)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2>🧾 Direct Medicine Bill</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        <div className={styles.field} style={{ marginBottom: 20 }}>
          <label>Select Patient</label>
          <PatientPicker onSelect={setPatient} />
        </div>

        <div className={styles.field} style={{ marginBottom: 20 }}>
          <label>Add Medicines</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Search medicine from stock..."
              value={searchMed}
              onFocus={() => { if (!searchMed) setMedResults(stock.slice(0, 10)) }}
              onKeyDown={e => {
                if (e.key === 'Enter' && medResults.length > 0) {
                  addItem(medResults[0])
                }
              }}
              onChange={e => {
                const val = e.target.value
                setSearchMed(val)
                if (val.length > 0) {
                  const filtered = stock.filter(m => m.name.toLowerCase().includes(val.toLowerCase())).slice(0, 10)
                  setMedResults(filtered)
                } else {
                  setMedResults(stock.slice(0, 10))
                }
              }}
            />
            {searchMed.length > 0 && medResults.length === 0 && (
              <div className={styles.dropdown}>
                <div
                  className={styles.dropdownItem}
                  onClick={() => addItem({ name: searchMed, price: 0 })}
                  style={{ color: '#4f46e5', fontWeight: 700 }}
                >
                  + Add "{searchMed}" as custom item
                </div>
              </div>
            )}
            {medResults.length > 0 && (
              <div className={styles.dropdown} onMouseLeave={() => setMedResults([])}>
                {medResults.map(m => (
                  <div key={m.id} onClick={() => addItem(m)} className={styles.dropdownItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <strong>{m.name}</strong>
                      <span style={{ color: m.is_low_stock ? '#ef4444' : '#10b981', fontWeight: 700 }}>₹{m.sales_rate}</span>
                    </div>
                    <small>Available Stock: {m.stock_quantity}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <table style={{ width: '100%', marginBottom: 20 }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: 12, color: '#64748b' }}>
              <th>Medicine</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td style={{ padding: '8px 0' }}>{it.name}</td>
                <td>
                  <input type="number" value={it.quantity} style={{ width: 50 }}
                    onChange={e => updateItem(idx, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value) || 0)} />
                </td>
                <td>
                  <input type="number" value={it.price} style={{ width: 70 }}
                    onChange={e => updateItem(idx, 'price', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                </td>
                <td>₹{(it.price * it.quantity).toFixed(2)}</td>
                <td><button onClick={() => removeItem(idx)} style={{ color: '#ef4444', border: 'none', background: 'none' }}>✕</button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {pharmSettings.apply_gst && (
              <>
                <tr>
                  <td colSpan="3" style={{ paddingTop: 6, fontWeight: 500, fontSize: 13 }}>Subtotal:</td>
                  <td style={{ paddingTop: 6, fontSize: 13 }}>₹{subtotal.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan="3" style={{ paddingTop: 6, fontWeight: 500, fontSize: 13 }}>GST ({pharmSettings.gst_percent}%):</td>
                  <td style={{ paddingTop: 6, fontSize: 13 }}>₹{gstAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
              </>
            )}
            <tr style={{ fontWeight: 800 }}>
              <td colSpan="3" style={{ paddingTop: 10, borderTop: '1px solid #cbd5e1' }}>Total:</td>
              <td style={{ paddingTop: 10, borderTop: '1px solid #cbd5e1' }}>₹{total.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Payment:</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option>Cash</option>
            <option>UPI</option>
            <option>Card</option>
          </select>
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleConfirm} disabled={saving}>
            {saving ? 'Saving...' : 'Confirm Bill'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PatientPicker({ onSelect }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/patient/search/?q=${encodeURIComponent(q)}`, { headers: getHeaders() })
        if (res.ok) { setResults(await res.json()); setOpen(true) }
      } catch (e) { console.error(e) }
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  const choose = (p) => {
    setSelected(p)
    setQ('')
    setResults([])
    setOpen(false)
    onSelect(p)
  }

  return (
    <div style={{ position: 'relative' }}>
      {selected ? (
        <div style={{ padding: '8px 12px', border: '1px solid #4f46e5', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
          <strong>{selected.name}</strong>
          <button onClick={() => { setSelected(null); onSelect(null) }} style={{ border: 'none', background: 'none' }}>✕</button>
        </div>
      ) : (
        <input
          placeholder="🔍 Search patient by name or phone..."
          value={q}
          onFocus={() => { if (!q) setOpen(true) }}
          onChange={e => setQ(e.target.value)}
        />
      )}
      {open && results.length > 0 && (
        <div className={styles.dropdown}>
          {results.map(p => (
            <div key={p.id} onClick={() => choose(p)} className={styles.dropdownItem}>
              {p.name} · {p.phone}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
