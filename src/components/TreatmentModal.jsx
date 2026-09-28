import { useState, useEffect, useMemo } from 'react'
import styles from './ClinicalNotesModal.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' }
}

export default function TreatmentModal({ patientId, appointmentId, patientName, onClose, onSaved }) {
  const [treatmentsList, setTreatmentsList] = useState([])
  const [search, setSearch] = useState('')
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('')

  const [selectedTreatments, setSelectedTreatments] = useState([])
  const [discountType, setDiscountType] = useState('Amt')
  const [discountAmt, setDiscountAmt] = useState(0)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/treatment-master/list/`, { headers: getHeaders() })
      .then(res => res.json())
      .then(json => setTreatmentsList(json))
      .catch(console.error)

    fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
      .then(res => res.json())
      .then(json => {
        setDoctors(json)
        if (json.length > 0) setSelectedDoctor(json[0].id)
      })
      .catch(console.error)
  }, [])

  const filteredList = useMemo(() => {
    return treatmentsList.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
  }, [treatmentsList, search])

  const addTreatment = (t) => {
    if (selectedTreatments.find(st => st.id === t.id)) return;
    setSelectedTreatments([...selectedTreatments, {
      ...t,
      qty: 1,
      discount: 0,
      taxMethod: 'Tax',
      teeth: ''
    }])
  }

  const removeTreatment = (id) => {
    setSelectedTreatments(selectedTreatments.filter(t => t.id !== id))
  }

  const updateTreatment = (id, field, value) => {
    setSelectedTreatments(selectedTreatments.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ))
  }

  const subTotal = selectedTreatments.reduce((acc, t) => acc + (t.price * t.qty) - (parseFloat(t.discount) || 0), 0)
  const grandTotal = discountType === 'Amt' ? subTotal - discountAmt : subTotal - (subTotal * discountAmt / 100)

  const handleSave = async () => {
    if (selectedTreatments.length === 0) return alert('Select at least one treatment')
    setSaving(true)
    try {
      const resV = await fetch(`${API_BASE}/visit/get-or-create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patient_id: patientId })
      })
      const vData = await resV.json()
      const visitId = vData.visit_id || vData.id

      // For each treatment selected, we could send it to backend
      const res = await fetch(`${API_BASE}/create-billing/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          visit_id: visitId,
          appointment_id: appointmentId,
          doctor_id: selectedDoctor,
          treatment_ids: selectedTreatments.map(t => ({
            id: t.id,
            price: t.price,
            qty: t.qty,
            discount: t.discount,
            teeth: t.teeth
          })),
          paid_amount: 0, // It's just adding treatment to bill/ledger
          payment_method: 'Cash',
          include_prior_balance: false,
          grand_total: grandTotal
        })
      })
      if (res.ok) {
        if (onSaved) onSaved()
        onClose()
      } else {
        alert("Failed to save")
      }
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  return (
    <div className={styles.overlay} onClick={onClose} style={{ zIndex: 3000 }}>
      <div className={styles.modal} style={{ maxWidth: '1000px', width: '95%', height: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: 'var(--slate-900)', fontSize: '18px' }}>Add New Treatment</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '12px', color: '#64748b' }}>
              <img src="https://www.w3schools.com/howto/img_avatar.png" alt="Patient" style={{ width: 24, height: 24, borderRadius: '50%' }} />
              <strong style={{ color: 'var(--slate-900)' }}>{patientName}</strong>
              <span>ID: {patientId}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar - Treatment List */}
          <div style={{ width: '300px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
            <div style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--slate-700)' }}>Add Treatments</h4>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, border: '1px solid var(--border-light)', padding: '10px', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                Treatment List
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 6, fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredList.map(t => (
                <div
                  key={t.id}
                  onClick={() => addTreatment(t)}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--slate-900)', transition: '0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                >
                  <span style={{ textTransform: 'uppercase' }}>{t.name}</span>
                  <span style={{ color: '#0ea5e9' }}>{t.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Area - Selected Treatments */}
          <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <select style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 6, fontSize: '13px', outline: 'none' }}>
                <option>Please select package</option>
              </select>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid var(--border-light)', fontSize: '12px', color: 'var(--slate-700)' }}>Treatment</th>
                  <th style={{ textAlign: 'center', padding: '10px', borderBottom: '2px solid var(--border-light)', fontSize: '12px', color: 'var(--slate-700)' }}>Qty</th>
                  <th style={{ textAlign: 'center', padding: '10px', borderBottom: '2px solid var(--border-light)', fontSize: '12px', color: 'var(--slate-700)' }}>Price</th>
                  <th style={{ textAlign: 'center', padding: '10px', borderBottom: '2px solid var(--border-light)', fontSize: '12px', color: 'var(--slate-700)' }}>Discount</th>
                  <th style={{ textAlign: 'center', padding: '10px', borderBottom: '2px solid var(--border-light)', fontSize: '12px', color: 'var(--slate-700)' }}>Tax%</th>
                  <th style={{ textAlign: 'right', padding: '10px', borderBottom: '2px solid var(--border-light)', fontSize: '12px', color: 'var(--slate-700)' }}>Amount</th>
                  <th style={{ width: 40, borderBottom: '2px solid var(--border-light)' }}></th>
                </tr>
              </thead>
              <tbody>
                {selectedTreatments.map(t => (
                  <tr key={t.id}>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--slate-900)', marginBottom: 6 }}>{t.name}</div>
                      <input
                        type="text"
                        placeholder="Teeth (e.g. 11, 12)"
                        value={t.teeth}
                        onChange={e => updateTreatment(t.id, 'teeth', e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid var(--border-light)', borderRadius: 4, width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border-light)', textAlign: 'center' }}>
                      <input type="number" value={t.qty} onChange={e => updateTreatment(t.id, 'qty', e.target.value)} style={{ width: 50, padding: 6, border: '1px solid var(--border-light)', borderRadius: 4, textAlign: 'center' }} />
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border-light)', textAlign: 'center', fontWeight: 600 }}>{t.price}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border-light)', textAlign: 'center' }}>
                      <input type="number" value={t.discount} onChange={e => updateTreatment(t.id, 'discount', e.target.value)} style={{ width: 60, padding: 6, border: '1px solid var(--border-light)', borderRadius: 4, textAlign: 'center' }} />
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border-light)', textAlign: 'center' }}>
                      <select value={t.taxMethod} onChange={e => updateTreatment(t.id, 'taxMethod', e.target.value)} style={{ padding: 6, border: '1px solid var(--border-light)', borderRadius: 4 }}>
                        <option>Amt</option>
                        <option>Tax</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border-light)', textAlign: 'right', fontWeight: 700, color: 'var(--slate-900)' }}>
                      {((t.price * t.qty) - (parseFloat(t.discount) || 0)).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--border-light)', textAlign: 'right' }}>
                      <button onClick={() => removeTreatment(t.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', width: 28, height: 28, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

              {/* Discount inputs */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Discount</label>
                  <input type="number" value={discountAmt} onChange={e => setDiscountAmt(e.target.value)} style={{ width: 80, padding: '8px', border: '1px solid var(--border-light)', borderRadius: 6 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Discount Type</label>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={{ width: 80, padding: '8px', border: '1px solid var(--border-light)', borderRadius: 6 }}>
                    <option>Amt</option>
                    <option>%</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Discount Amount</label>
                  <input type="text" readOnly value={discountType === 'Amt' ? discountAmt : (subTotal * discountAmt / 100).toFixed(2)} style={{ width: 100, padding: '8px', border: '1px solid var(--border-light)', background: 'transparent', borderRadius: 6 }} />
                </div>
              </div>

              {/* Summary */}
              <div style={{ width: 300 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13px', fontWeight: 600 }}>
                  <span>Sub Total</span>
                  <span>{subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13px', fontWeight: 600 }}>
                  <span>TAX</span>
                  <span>0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                  <span>Grand Total</span>
                  <span>{grandTotal.toFixed(2)}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent' }}>
          <div style={{ display: 'flex', gap: 24, fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Noted by:
              <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} style={{ padding: '6px', border: '1px solid var(--border-light)', borderRadius: 4, outline: 'none' }}>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Date:
              <input type="date" value={new Date().toISOString().split('T')[0]} readOnly style={{ padding: '6px', border: '1px solid var(--border-light)', borderRadius: 4, outline: 'none' }} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              disabled={saving}
              onClick={() => { window.print(); handleSave(); }}
              style={{ background: 'transparent', color: 'var(--slate-900)', border: '1px solid var(--border-light)', padding: '10px 24px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
            >
              Print & Save
            </button>
            <button
              disabled={saving}
              onClick={handleSave}
              style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
