import { useState, useEffect } from 'react'
import styles from './ClinicalNotesModal.module.css' 

export default function BillingModal({ billingId, patientId, patientName, onClose }) {
  const [items, setItems] = useState([])
  const [billMeta, setBillMeta] = useState({
    discount: 0,
    tax_percent: 0,
    paid_amount: 0,
    payment_method: 'Cash',
    notes: '',
    total_amount: 0
  })
  const [treatmentMaster, setTreatmentMaster] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [taxesList, setTaxesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // 1. Load Treatment Master
    fetch('http://127.0.0.1:8000/api/treatment-master/list/')
      .then(r => r.json())
      .then(setTreatmentMaster)

    fetch('http://127.0.0.1:8000/api/dropdowns/payment_method/')
      .then(r => r.json())
      .then(data => setPaymentMethods(data.map(d => d.name)))
      .catch(e => console.error(e))

    fetch('http://127.0.0.1:8000/api/settings/taxes/')
      .then(r => r.json())
      .then(data => setTaxesList(data.filter(t => t.is_active)))
      .catch(e => console.error(e))

    // 2. Load Billing Data if ID exists
    if (billingId) {
      setLoading(true)
      fetch(`http://127.0.0.1:8000/api/bill/list/`) // In production, usually fetch by ID, using list for now
        .then(r => r.json())
        .then(bills => {
            const bill = bills.find(b => b.id === billingId)
            if (bill) {
                setBillMeta({
                    discount: parseFloat(bill.discount || 0),
                    tax_percent: 0,
                    paid_amount: parseFloat(bill.paid_amount || 0),
                    payment_method: bill.payment_method || 'Cash',
                    notes: bill.notes || '',
                    total_amount: parseFloat(bill.total_amount)
                })
                setItems(bill.items.map(item => ({
                    id: item.id,
                    treatment: item.treatment,
                    treatment_name: item.treatment_name || 'Treatment',
                    unit_price: parseFloat(item.price),
                    quantity: item.qty,
                    total_amount: parseFloat(item.price) * item.qty
                })))
            }
        })
        .finally(() => setLoading(false))
    }
  }, [billingId])

  const updateItem = (index, field, val) => {
    const newItems = [...items]
    const item = { ...newItems[index] }
    if (field === 'quantity') item.qty = val
    if (field === 'unit_price') item.unit_price = val
    
    item.total_amount = item.unit_price * (item.qty || item.quantity || 1)
    newItems[index] = item
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total_amount), 0)
  const taxableAmount = subtotal - billMeta.discount
  const taxAmount = taxableAmount * (billMeta.tax_percent / 100)
  const totalAmount = taxableAmount + taxAmount
  const balance = totalAmount - billMeta.paid_amount

  const handleUpdateBill = async () => {
    setSaving(true)
    try {
      const payload = {
        total_amount: totalAmount,
        paid_amount: billMeta.paid_amount,
        payment_method: billMeta.payment_method,
        discount: billMeta.discount,
        items: items.map(it => ({
           id: it.id, // if it's an existing item
           treatment: it.treatment,
           qty: it.qty || it.quantity,
           price: it.unit_price
        }))
      }

      // Use a new advanced update endpoint (or the pay endpoint if we extend it)
      const res = await fetch(`http://127.0.0.1:8000/api/billing/${billingId}/update/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        alert("Bill Updated & Payment Recorded Successfully!")
        onClose()
      } else {
        const errText = await res.text()
        console.error('Update failed:', errText)
        alert("Error saving bill changes")
      }
    } catch (e) {
      console.error(e)
      alert("Network error while saving bill")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
           <h3>Billing Details - {patientName}</h3>
           <button onClick={onClose}>✕</button>
        </header>

        <div className={styles.body} style={{ padding: '20px' }}>
          {loading ? <p>Loading billing data...</p> : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'transparent', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Treatment</th>
                    <th style={{ padding: '12px' }}>Qty (Editable)</th>
                    <th style={{ padding: '12px' }}>Price (₹)</th>
                    <th style={{ padding: '12px' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px' }}>{item.treatment_name || (treatmentMaster.find(t=>t.id===item.treatment)?.name)}</td>
                      <td style={{ padding: '12px' }}>
                        <input 
                            type="number" 
                            value={item.qty || item.quantity} 
                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} 
                            style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--slate-200)', color: 'var(--slate-900)' }} 
                        />
                      </td>
                      <td style={{ padding: '12px' }}>₹{parseFloat(item.unit_price).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>₹{parseFloat(item.total_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
 
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px', marginTop: '30px', borderTop: '2px solid var(--border-light)', paddingTop: '20px' }}>
                <div>
                   <div style={{ background: 'rgba(14, 165, 233, 0.15)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#38bdf8' }}>
                        <strong>Note:</strong> Treatments were pulled directly from Clinical Records. Any adjustments made here will only reflect in this bill.
                      </p>
                   </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal:</span>
                      <strong>₹{subtotal.toFixed(2)}</strong>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b', marginTop: '5px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Tax:
                        <select 
                          value={billMeta.tax_percent} 
                          onChange={e => setBillMeta({...billMeta, tax_percent: parseFloat(e.target.value) || 0})}
                          style={{ padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-light)' }}
                        >
                          <option value="0">No Tax</option>
                          {taxesList.map(t => <option key={t.id} value={t.rate}>{t.name} ({t.rate}%)</option>)}
                        </select>
                      </span>
                      <strong>+ ₹{taxAmount.toFixed(2)}</strong>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', color: '#2563eb', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                      <strong>Grand Total:</strong>
                      <strong>₹{totalAmount.toFixed(2)}</strong>
                   </div>
                </div>

                   <div style={{ marginTop: '10px', background: 'transparent', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>COLLECT PAYMENT (₹)</label>
                        <input 
                          type="number" 
                          value={billMeta.paid_amount} 
                          onChange={e => setBillMeta({...billMeta, paid_amount: parseFloat(e.target.value) || 0})} 
                          style={{ width: '100%', padding: '10px', fontSize: '20px', fontWeight: '800', marginTop: '4px', borderRadius: '8px', border: '1px solid var(--border-light)', color: '#16a34a' }}
                        />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>METHOD</label>
                        <select 
                          value={billMeta.payment_method} 
                          onChange={e => setBillMeta({...billMeta, payment_method: e.target.value})}
                          style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '8px', border: '1px solid var(--border-light)', fontWeight: '600' }}
                        >
                          {paymentMethods.length > 0 ? (
                            paymentMethods.map(m => <option key={m} value={m}>{m}</option>)
                          ) : (
                            <>
                              <option>Cash</option>
                              <option>UPI</option>
                              <option>Card</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '5px' }}>
                        <span>New Balance:</span>
                        <strong style={{ color: balance > 0 ? '#ef4444' : '#16a34a' }}>₹{balance.toFixed(2)}</strong>
                      </div>
                   </div>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <button className={styles.saveBtn} onClick={handleUpdateBill} disabled={saving}>
            {saving ? 'Processing...' : 'Complete Transaction & Print'}
          </button>
        </footer>
      </div>
    </div>
  )
}
