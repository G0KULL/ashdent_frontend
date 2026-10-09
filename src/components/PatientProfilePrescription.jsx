import React, { useState, useEffect } from 'react'
import styles from './SearchPatient.module.css'

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

export default function PatientProfilePrescription({ viewPatient, profile, refreshProfile }) {
  const [showAdd, setShowAdd] = useState(false)
  
  const [medicines, setMedicines] = useState([])
  const [rxItems, setRxItems] = useState([])
  const [rxNotes, setRxNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [medSearch, setMedSearch] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/medicine-master/list/`)
      .then(r => r.json())
      .then(setMedicines)
      .catch(console.error)
  }, [])

  const filteredMedicines = medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()))

  const addMedicine = (med) => {
    setRxItems(prev => [...prev, { name: med.name, dosage: med.dosage || '', quantity: 1, frequency: med.frequency || '1-0-1', duration: '5 days', instruction: '', price: med.sales_rate || 0 }])
  }

  const handleSavePrescription = async () => {
    if (rxItems.length === 0) return alert('Please add at least one medicine.')
    setSaving(true)
    try {
      // 1) Get visit
      const resV = await fetch(`${API_BASE}/visit/get-or-create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patient_id: viewPatient.id })
      })
      const vData = await resV.json()
      
      const payload = {
        patient: viewPatient.id,
        visit: vData.visit_id || vData.id,
        notes: rxNotes,
        items: rxItems.map(it => ({
          medicine_name: it.name,
          dosage: it.dosage,
          duration: it.duration,
          quantity: it.quantity,
          unit_price: it.price,
          notes: it.instruction
        }))
      }

      const res = await fetch(`${API_BASE}/prescription/add/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        alert('Prescription saved successfully!')
        setShowAdd(false)
        setRxItems([])
        setRxNotes('')
        await refreshProfile()
      } else {
        alert('Failed to save prescription.')
      }
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  return (
    <div className={styles.treatmentsTabBody}>
      {!showAdd ? (
        <>
          <div className={styles.treatmentActionsRow}>
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--slate-900)' }}>Prescriptions</h3>
            <button 
              onClick={() => setShowAdd(true)}
              style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
            >
              Add New Prescription
            </button>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, border: '1px solid var(--border-light)', padding: 16 }}>
            <table className={styles.treatmentListTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Medicines</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {!profile?.prescriptions || profile.prescriptions.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No prescriptions found.</td></tr>
                ) : (
                  profile.prescriptions
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 3)
                    .map(p => (
                    <tr key={p.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td>
                        {p.items?.map(it => (
                          <div key={it.id} style={{ fontSize: 13, marginBottom: 4 }}>
                            <strong>{it.medicine_name}</strong> - {it.dosage} ({it.duration})
                          </div>
                        ))}
                      </td>
                      <td style={{ fontSize: 13 }}>{p.notes || '-'}</td>
                      <td>
                        <button onClick={() => printPdf(`${API_BASE}/prescription/${p.id}/pdf/`)} style={{ border: 'none', background: '#eef2ff', color: '#4f46e5', borderRadius: 6, cursor: 'pointer', fontWeight: 600, padding: '4px 10px', fontSize: 11 }}>Print</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--slate-900)' }}>Add New Prescription</h3>
            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
          
          <div style={{ display: 'flex', minHeight: 450 }}>
            {/* Left Pane */}
            <div style={{ width: 260, borderRight: '1px solid #e2e8f0', padding: 16, background: 'transparent', display: 'flex', flexDirection: 'column' }}>
              <input 
                type="text" 
                placeholder="Search Drug..." 
                value={medSearch} 
                onChange={e => setMedSearch(e.target.value)} 
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-light)', marginBottom: 12, boxSizing: 'border-box' }} 
              />
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', borderRadius: 6, flex: 1, overflowY: 'auto' }}>
                <div style={{ background: '#e2e8f0', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--slate-700)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Drug Name</span>
                  <span>Type</span>
                </div>
                {filteredMedicines.map(m => (
                  <div key={m.id} onClick={() => addMedicine(m)} style={{ padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{m.name}</div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>{m.dosage}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Pane */}
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column' }}>
              <table className={styles.treatmentListTable} style={{ marginBottom: 20 }}>
                <thead>
                  <tr>
                    <th>Drug Name</th>
                    <th>Dosage</th>
                    <th>Qty</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Instruction</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rxItems.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Select drugs from the left list.</td></tr>
                  ) : (
                    rxItems.map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{it.name}</td>
                        <td><input type="text" value={it.dosage} onChange={e => setRxItems(p => p.map((x, i) => i === idx ? { ...x, dosage: e.target.value } : x))} style={{ width: 60, padding: 4, border: '1px solid var(--border-light)', borderRadius: 4 }} /></td>
                        <td><input type="number" min="1" value={it.quantity} onChange={e => setRxItems(p => p.map((x, i) => i === idx ? { ...x, quantity: parseInt(e.target.value) || 1 } : x))} style={{ width: 40, padding: 4, border: '1px solid var(--border-light)', borderRadius: 4, textAlign: 'center' }} /></td>
                        <td><input type="text" value={it.frequency} onChange={e => setRxItems(p => p.map((x, i) => i === idx ? { ...x, frequency: e.target.value } : x))} style={{ width: 60, padding: 4, border: '1px solid var(--border-light)', borderRadius: 4 }} /></td>
                        <td><input type="text" value={it.duration} onChange={e => setRxItems(p => p.map((x, i) => i === idx ? { ...x, duration: e.target.value } : x))} style={{ width: 60, padding: 4, border: '1px solid var(--border-light)', borderRadius: 4 }} /></td>
                        <td><input type="text" value={it.instruction} onChange={e => setRxItems(p => p.map((x, i) => i === idx ? { ...x, instruction: e.target.value } : x))} placeholder="After food..." style={{ width: 100, padding: 4, border: '1px solid var(--border-light)', borderRadius: 4 }} /></td>
                        <td>
                          <button onClick={() => setRxItems(p => p.filter((_, i) => i !== idx))} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: 4, cursor: 'pointer', padding: '2px 6px' }}>✕</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: 'auto' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-700)', marginBottom: 4, display: 'block' }}>Notes</label>
                <textarea 
                  value={rxNotes} 
                  onChange={e => setRxNotes(e.target.value)} 
                  style={{ width: '100%', height: 60, padding: 10, borderRadius: 6, border: '1px solid var(--border-light)', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button onClick={() => setShowAdd(false)} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--slate-700)', fontWeight: 600, cursor: 'pointer' }}>Close</button>
                  <button onClick={handleSavePrescription} disabled={saving} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Prescription'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
