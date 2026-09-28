import { useState, useEffect, useMemo } from 'react'
import styles from './SearchPatient.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return {
    'Content-Type': 'application/json',
    'X-User-Id': user.id || '',
    'X-Username': user.username || ''
  }
}

export default function PatientProfileTreatment({ viewPatient, profile, refreshProfile }) {
  const [showAdd, setShowAdd] = useState(false)

  // Master lists
  const [treatmentsList, setTreatmentsList] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('')

  // Builder state
  const [search, setSearch] = useState('')
  const [selectedTreatments, setSelectedTreatments] = useState([])
  const [discountType, setDiscountType] = useState('Amt')
  const [discountAmt, setDiscountAmt] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/treatment-master/list/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTreatmentsList(data) })
      .catch(console.error)

    fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDoctors(data)
          if (data.length > 0) setSelectedDoctor(data[0].id)
        }
      })
      .catch(console.error)
  }, [])

  const filteredList = useMemo(
    () => treatmentsList.filter(t => t.name.toLowerCase().includes(search.toLowerCase())),
    [treatmentsList, search]
  )

  const addTreatment = (t) => {
    if (selectedTreatments.find(st => st.id === t.id)) return
    setSelectedTreatments(prev => [...prev, { ...t, qty: 1, discount: 0, taxMethod: 'Tax', teeth: '' }])
  }

  const removeTreatment = (id) =>
    setSelectedTreatments(prev => prev.filter(t => t.id !== id))

  const updateTreatment = (id, field, value) =>
    setSelectedTreatments(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))

  const subTotal = selectedTreatments.reduce(
    (acc, t) => acc + (t.price * t.qty) - (parseFloat(t.discount) || 0), 0
  )
  const grandTotal =
    discountType === 'Amt'
      ? subTotal - discountAmt
      : subTotal - (subTotal * discountAmt / 100)

  const handleSave = async () => {
    if (selectedTreatments.length === 0) return alert('Select at least one treatment')
    setSaving(true)
    try {
      const resV = await fetch(`${API_BASE}/visit/get-or-create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patient_id: viewPatient.id })
      })
      const vData = await resV.json()
      const visitId = vData.visit_id || vData.id

      const res = await fetch(`${API_BASE}/create-billing/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          visit_id: visitId,
          doctor_id: selectedDoctor,
          treatment_ids: selectedTreatments.map(t => ({
            id: t.id, price: t.price, qty: t.qty, discount: t.discount, teeth: t.teeth
          })),
          paid_amount: 0,
          payment_method: 'Cash',
          include_prior_balance: false,
          grand_total: grandTotal
        })
      })

      if (res.ok) {
        alert('Treatment saved successfully!')
        setShowAdd(false)
        setSelectedTreatments([])
        setDiscountAmt(0)
        setSearch('')
        if (refreshProfile) await refreshProfile()
      } else {
        alert('Failed to save treatment.')
      }
    } catch (e) {
      console.error(e)
      alert('Error saving treatment.')
    }
    setSaving(false)
  }

  /* ─── HISTORY VIEW ─── */
  if (!showAdd) {
    return (
      <div className={styles.treatmentsTabBody}>
        {/* Actions Row */}
        <div className={styles.treatmentActionsRow}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--slate-900)' }}>
            Treatments &amp; Planning
          </h3>
          <button
            onClick={() => { setShowAdd(true); setSelectedTreatments([]); setDiscountAmt(0); setSearch('') }}
            style={{
              background: '#3b82f6', color: 'white', border: 'none',
              padding: '8px 16px', borderRadius: 6, fontWeight: 700,
              cursor: 'pointer', fontSize: 13
            }}
          >
            + Add Treatment
          </button>
        </div>

        {/* Treatments history table */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border-light)', padding: 16 }}>
          <table className={styles.treatmentListTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Treatments</th>
                <th>Doctor</th>
                <th>Grand Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(!profile?.payments || profile.payments.filter(p => p.bill_type === 'Clinical' || !p.bill_type).length === 0) ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                    No treatment records found.
                  </td>
                </tr>
              ) : (
                profile.payments
                  .filter(p => p.bill_type === 'Clinical' || !p.bill_type)
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .slice(0, 3)
                  .map((b) => (
                    <tr key={b.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                      <td>
                        {b.items?.map((it, idx) => (
                          <div key={it.id || idx} style={{ fontSize: 13, marginBottom: 4 }}>
                            <strong>{it.treatment_name || it.name}</strong>
                            {it.teeth ? <span style={{ color: '#64748b', fontSize: 11 }}> (Teeth: {it.teeth})</span> : ''}
                            {' '}× {it.qty || it.quantity || 1}
                          </div>
                        ))}
                      </td>
                      <td style={{ fontSize: 13 }}>{b.doctor_name || '—'}</td>
                      <td style={{ fontWeight: 700 }}>₹{parseFloat(b.total_amount || 0).toFixed(2)}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                          background: b.status === 'Paid' ? '#dcfce7' : b.status === 'Partial' ? '#fef9c3' : '#fee2e2',
                          color: b.status === 'Paid' ? '#15803d' : b.status === 'Partial' ? '#a16207' : '#b91c1c'
                        }}>
                          {b.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  /* ─── ADD TREATMENT VIEW ─── */
  return (
    <div className={styles.treatmentsTabBody}>
      <div
        style={{
          background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0',
          overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: '0 0 2px 0', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Add New Treatment
            </h3>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Patient: <strong style={{ color: '#0f172a' }}>{viewPatient?.name || viewPatient?.patient_name || ''}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Doctor Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>👤 Doctor</span>
              <select
                value={selectedDoctor}
                onChange={e => setSelectedDoctor(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1',
                  fontSize: 13, color: '#334155', outline: 'none', background: '#ffffff'
                }}
              >
                <option value="">-- Select Doctor --</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <button
              onClick={() => setShowAdd(false)}
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body - two pane layout */}
        <div style={{ display: 'flex', minHeight: 460 }}>
          {/* Left Pane – treatment list */}
          <div style={{
            width: 280, borderRight: '1px solid #e2e8f0',
            padding: 20, background: '#f8fafc',
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
              TREATMENT LIST
            </span>
            <input
              type="text"
              placeholder="Search treatment..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6,
                border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }}
            />
            <div style={{
              border: '1px solid #cbd5e1', borderRadius: 6, background: '#ffffff',
              flex: 1, overflowY: 'auto', maxHeight: 340
            }}>
              {filteredList.length === 0 ? (
                <div style={{ padding: 16, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                  No treatments found.
                </div>
              ) : (
                filteredList.map(t => (
                  <div
                    key={t.id}
                    onClick={() => addTreatment(t)}
                    style={{
                      padding: '10px 12px', fontSize: 12, cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>{t.name}</span>
                    <span style={{ fontWeight: 700, color: '#10b981', fontSize: 11 }}>₹{t.price}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Pane – selected treatments */}
          <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column' }}>
            {/* Selected Treatments Table */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 20 }}>
              <table className={styles.treatmentListTable} style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Treatment</th>
                    <th style={{ textAlign: 'center', width: 80 }}>Qty</th>
                    <th style={{ textAlign: 'center', width: 100 }}>Price</th>
                    <th style={{ textAlign: 'center', width: 90 }}>Discount</th>
                    <th style={{ textAlign: 'left', width: 110 }}>Teeth</th>
                    <th style={{ textAlign: 'right', width: 100 }}>Amount</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTreatments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                        Click a treatment from the left panel to add it here.
                      </td>
                    </tr>
                  ) : (
                    selectedTreatments.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600, color: '#334155' }}>{t.name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number" min="1" value={t.qty}
                            onChange={e => updateTreatment(t.id, 'qty', parseInt(e.target.value) || 1)}
                            style={{ width: 50, padding: 6, border: '1px solid #cbd5e1', borderRadius: 6, textAlign: 'center', outline: 'none' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>₹{t.price}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number" min="0" value={t.discount}
                            onChange={e => updateTreatment(t.id, 'discount', parseFloat(e.target.value) || 0)}
                            style={{ width: 60, padding: 6, border: '1px solid #cbd5e1', borderRadius: 6, textAlign: 'center', outline: 'none' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text" placeholder="e.g. 11,12" value={t.teeth}
                            onChange={e => updateTreatment(t.id, 'teeth', e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none', fontSize: 12, boxSizing: 'border-box' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          ₹{((t.price * t.qty) - (parseFloat(t.discount) || 0)).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => removeTreatment(t.id)}
                            style={{ border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: 6, cursor: 'pointer', padding: '4px 8px', fontSize: 12, fontWeight: 'bold' }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals & Save */}
            <div style={{
              borderTop: '1px solid #e2e8f0', paddingTop: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'
            }}>
              {/* Discount inputs */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Discount</label>
                  <input
                    type="number" value={discountAmt}
                    onChange={e => setDiscountAmt(parseFloat(e.target.value) || 0)}
                    style={{ width: 80, padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Type</label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value)}
                    style={{ width: 70, padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }}
                  >
                    <option>Amt</option>
                    <option>%</option>
                  </select>
                </div>
              </div>

              {/* Summary Box */}
              <div style={{
                width: 280, background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  <span>Sub Total</span>
                  <span style={{ color: '#334155' }}>₹{subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  <span>Discount</span>
                  <span style={{ color: '#ef4444' }}>
                    - ₹{discountType === 'Amt' ? parseFloat(discountAmt || 0).toFixed(2) : (subTotal * (discountAmt || 0) / 100).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: 10, fontSize: 15, fontWeight: 800, color: '#4f46e5' }}>
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: '#10b981', color: 'white', border: 'none',
                    padding: '10px', borderRadius: 8, fontWeight: 800, fontSize: 14,
                    cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.2)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                  onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                >
                  {saving ? 'Saving...' : 'Save Treatment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
