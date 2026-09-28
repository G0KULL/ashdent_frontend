import { useState, useEffect } from 'react'
import styles from './ClinicalNotesModal.module.css'

const API = 'http://127.0.0.1:8000/api'

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

const TAB_STYLE = (active) => ({
  padding: '8px 18px',
  borderRadius: '8px 8px 0 0',
  border: 'none',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  background: active ? '#4f46e5' : '#f1f5f9',
  color: active ? '#fff' : '#64748b',
  transition: 'all 0.2s',
})

// Removing hardcoded LAB_TESTS list

export default function PrescriptionModal({ patientId, patientName, patientPhone, appointmentId, clinicalNoteId, onClose, onOpenBilling, onNavigate, initialTab = 'medicines' }) {
  const [tab, setTab] = useState(initialTab)
  const [saving, setSaving] = useState(false)

  // After-save state — shows print/share screen
  const [savedRxId, setSavedRxId] = useState(null) // prescription ID after save
  const [createdBillId, setCreatedBillId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null) // null or { autoPrint }

  // — Medicines —
  const [medicines, setMedicines] = useState([])
  const [rxItems, setRxItems] = useState([])
  const [rxNotes, setRxNotes] = useState('')

  // — Treatments —
  const [treatmentMaster, setTreatmentMaster] = useState([])
  const [selectedTreatments, setSelectedTreatments] = useState([])
  const [treatmentSearch, setTreatmentSearch] = useState('')
  const [medSearch, setMedSearch] = useState('')
  const [showMedResults, setShowMedResults] = useState(false)

  // — Lab Tests —
  const [labMaster, setLabMaster] = useState([])
  const [labItems, setLabItems] = useState([])
  const [customLab, setCustomLab] = useState('')

  // — Billing Data —
  const [billingData, setBillingData] = useState({ paid_amount: '', payment_method: 'Cash' })
  const [patientDetails, setPatientDetails] = useState(null)

  useEffect(() => {
    fetch(`${API}/medicine-master/list/`)
      .then(r => r.json()).then(setMedicines).catch(console.error)
    fetch(`${API}/treatment-master/list/`)
      .then(r => r.json()).then(setTreatmentMaster).catch(console.error)
    fetch(`${API}/settings/lab-tests/`)
      .then(r => r.json()).then(setLabMaster).catch(console.error)
    // Fetch latest patient balance
    fetch(`${API}/patient/${patientId}/profile/`)
      .then(r => r.json()).then(setPatientDetails).catch(console.error)
  }, [patientId])

  const filteredTreatments = treatmentMaster.filter(t =>
    t.name.toLowerCase().includes(treatmentSearch.toLowerCase())
  )



  // Calculate totals
  const currentItemsTotal = (selectedTreatments.reduce((s, t) => s + t.price * t.qty, 0) + labItems.reduce((s, l) => s + (parseFloat(l.price) || 0), 0))
  const prevBalance = parseFloat(patientDetails?.total_balance || 0)
  const currentBill = currentItemsTotal
  const paid = parseFloat(billingData.paid_amount) || 0

  // USER REQUEST: Lab items are considered paid. So they don't contribute to the balance.
  const labTotal = labItems.reduce((s, l) => s + (parseFloat(l.price) || 0), 0)
  const treatmentTotal = selectedTreatments.reduce((s, t) => s + t.price * t.qty, 0)

  // Balance is only from treatments minus whatever was paid (after covering lab costs)
  const finalBalance = Math.max(0, treatmentTotal - Math.max(0, paid - labTotal))

  /* ─── SAVE ─── */

  /* ─── MEDICINES ─── */
  const addMedicine = (med) => {
    if (!med) return
    setRxItems(prev => [...prev, { 
      name: med.name, 
      content: med.content || 'Amoxycillin (500mg) + Clavulanic Acid (125mg)', // Dummy content if missing
      unit_price: med.sales_rate || 0,
      dosage: med.frequency || 'Select', 
      time: 'Select',
      duration: 1, // Days
      quantity: 1, 
      advice: 'Before Food',
      notes: ''
    }])
  }
  const addCustomMedicine = () => {
    const name = prompt('Enter Medicine Name:')
    if (!name) return
    setRxItems(prev => [...prev, { 
      name, 
      content: '-',
      unit_price: 0, 
      dosage: 'Select', 
      time: 'Select',
      duration: 1,
      quantity: 1, 
      advice: 'Before Food',
      notes: '' 
    }])
  }
  const updateRxItem = (idx, field, val) =>
    setRxItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it))

  /* ─── TREATMENTS ─── */
  const toggleTreatment = (t) => {
    setSelectedTreatments(prev => {
      const exists = prev.find(x => x.id === t.id)
      if (exists) return prev.filter(x => x.id !== t.id)
      return [...prev, { id: t.id, name: t.name, price: t.price, qty: 1 }]
    })
  }
  const updateTreatmentQty = (id, qty) =>
    setSelectedTreatments(prev => prev.map(t => t.id === id ? { ...t, qty: parseInt(qty) || 1 } : t))

  /* ─── LAB TESTS ─── */
  const addLabTest = (testObj) => {
    if (!testObj || labItems.find(l => l.name === testObj.name)) return
    setLabItems(prev => [...prev, { name: testObj.name, notes: '', price: testObj.price || 0, status: 'Ordered' }])
  }
  const addCustomLab = () => {
    if (!customLab.trim()) return
    addLabTest({ name: customLab.trim(), price: 0 })
    setCustomLab('')
  }

  /* ─── SAVE ─── */
  const handleSave = async (autoPrint = false) => {
    if (!hasAnything) return

    if (rxItems.length === 0 && (selectedTreatments.length > 0 || labItems.length > 0)) {
      setShowConfirm({ autoPrint })
      return
    }

    await executeSave(autoPrint)
  }

  const executeSave = async (autoPrint = false) => {
    setShowConfirm(null)
    setSaving(true)
    let lastRxId = null
    try {
      // 1) Get/create visit
      const resV = await fetch(`${API}/visit/get-or-create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, appointment_id: appointmentId })
      })
      if (!resV.ok) throw new Error('Failed to create/get visit record.')
      const vData = await resV.json()
      const visitId = vData.visit_id || vData.id

      // 2) Save medicines AND lab tests in ONE prescription record
      const labNotes = labItems.length > 0
        ? '\nLAB TESTS:\n' + labItems.map(l => `• ${l.name}${l.notes ? ' — ' + l.notes : ''}`).join('\n')
        : '';

      const combinedNotes = (rxNotes + labNotes).trim();

      if (rxItems.length > 0 || labItems.length > 0) {
        const resP = await fetch(`${API}/prescription/add/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visit: visitId,
            patient: patientId,
            clinical_note: clinicalNoteId || null,
            notes: combinedNotes,
            items: rxItems.map(it => ({
              medicine_name: it.name,
              dosage: it.dosage,
              duration: it.duration,
              quantity: parseInt(it.quantity) || 1,
              unit_price: parseFloat(it.unit_price) || 0,
              notes: it.notes
            }))
          })
        })
        if (!resP.ok) {
          const errData = await resP.json().catch(() => ({ error: 'Unknown server error' }))
          throw new Error(errData.error || 'Failed to save prescription.')
        }
        const json = await resP.json()
        lastRxId = json.id
      }

      // 3) Bill treatments and billable lab tests
      let billId = null
      const billableLabs = labItems.filter(l => parseFloat(l.price) > 0).map(l => ({
        name: l.name,
        quantity: 1,
        unit_price: parseFloat(l.price)
      }))

      const totalPaid = parseFloat(billingData.paid_amount || 0)
      const bNotes = billingData.notes

      const hasBillableItems =
        selectedTreatments.length > 0 ||
        billableLabs.length > 0 ||
        (totalPaid > 0)

      if (hasBillableItems) {
        const combinedItems = [
          ...selectedTreatments.map(t => ({ treatment: t.id, quantity: t.qty, unit_price: t.price })),
          ...billableLabs
        ]

        if (combinedItems.length === 0 && totalPaid > 0) {
          combinedItems.push({ name: 'Old Balance Settlement / Advance', quantity: 1, unit_price: 0 })
        }

        const resB = await fetch(`${API}/bill/create-advanced/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient: patientId,
            visit: visitId,
            total_amount: currentBill,
            paid_amount: totalPaid,
            payment_method: billingData.payment_method || 'Cash',
            items: combinedItems,
            notes: bNotes
          })
        })
        if (!resB.ok) {
          const errText = await resB.text()
          throw new Error(`Billing Failed: ${errText || resB.statusText}`)
        }
        const billJson = await resB.json()
        billId = billJson.id
      }

      // Success logic: auto-print if requested, then close and navigate
      if (autoPrint) {
        if (lastRxId && lastRxId !== 'success_only_billing') {
          printPdf(`${API}/prescription/${lastRxId}/pdf/`);
        }
        if (billId) {
          printPdf(`${API}/billing/latest/?patient_id=${patientId}`);
        }
      }

      // Final Step: Clear items after successful save
      setRxItems([])
      setSelectedTreatments([])
      setLabItems([])
      setRxNotes('')
      setBillingData({ paid_amount: '', payment_method: 'Cash', notes: '' })

      if (rxItems.length > 0 && onNavigate) {
        onNavigate('pharmacy');
        // We don't close immediately if they want to print, success screen handles it
      } else if (selectedTreatments.length > 0 || labItems.length > 0) {
        setTab('billing');
        setCreatedBillId(billId);
        setSavedRxId(lastRxId || 'success_only_billing');
      } else {
        setSavedRxId('success_only_billing');
      }

      return true
    } catch (e) {
      console.error(e)
      alert(e.message || 'Error saving prescription')
      setSaving(false)
      return false
    }
  }

  // Pre-save validation
  const handleFinalSave = async (isPrint) => {
    if (saving) return;

    // Validate medicines
    if (rxItems.length > 0) {
      const invalid = rxItems.find(m => !m.name || !m.quantity);
      if (invalid) {
        return alert(`Please enter name and quantity for all medicines.`);
      }
    }

    setSaving(true);
    await handleSave(isPrint);
  }

  /* ─── PRINT / WHATSAPP ─── */
  const pdfUrl = (savedRxId && savedRxId !== 'success_only_billing')
    ? `${API}/prescription/${savedRxId}/pdf/`
    : null

  const handlePrint = () => {
    if (pdfUrl) {
      printPdf(pdfUrl)
    } else {
      // If no prescription, try to print the latest bill for this patient
      printPdf(`${API}/billing/latest/?patient_id=${patientId}`)
    }
  }

  const handleWhatsApp = () => {
    const url = pdfUrl || `${API}/billing/latest/?patient_id=${patientId}`
    const phone = (patientPhone || '').replace(/\D/g, '')
    const type = pdfUrl ? 'prescription' : 'invoice'
    const msg = encodeURIComponent(
      `Hello ${patientName}, your ${type} is ready.\nDownload / View here: ${url}`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  const hasAnything = rxItems.length > 0 || selectedTreatments.length > 0 || labItems.length > 0

  if (showConfirm) {
    return (
      <div className={styles.overlay} style={{ zIndex: 9999 }}>
        <div className={styles.modal} style={{ maxWidth: 480, width: '90vw' }}>
          <div style={{ padding: '32px' }}>
            <div style={{ fontSize: 48, marginBottom: 16, textAlign: 'center' }}>⚠️</div>
            <h2 style={{ margin: '0 0 16px', fontSize: 20, color: 'var(--slate-900)', textAlign: 'center' }}>
              Continue without prescription?
            </h2>
            <p style={{ color: 'var(--slate-700)', fontSize: 14, marginBottom: 20 }}>
              This visit will be saved without adding a prescription.
            </p>
            <ul style={{ color: 'var(--slate-700)', fontSize: 13, marginBottom: 24, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Selected treatments will be recorded in the patient’s treatment history</li>
              <li>Added lab items will be saved to the patient’s lab records</li>
              <li>A separate bill will be generated including all treatments and lab charges</li>
              <li>Payment details (paid amount and balance) will be recorded</li>
            </ul>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 24, fontStyle: 'italic', textAlign: 'center' }}>
              You can add or attach a prescription to this visit later at any time.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(null)}
                style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--slate-700)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => executeSave(showConfirm.autoPrint)}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─── SUCCESS SCREEN ─── */
  if (savedRxId !== null) {
    const isOnlyBilling = savedRxId === 'success_only_billing'
    const hasPrescription = pdfUrl !== null
    const hasBill = !!createdBillId

    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} style={{ maxWidth: 500, width: '90vw' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ padding: '36px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>✅</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, color: 'var(--slate-900)' }}>
              {isOnlyBilling ? 'Record Saved!' : 'Prescription Saved!'}
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
              Data for <strong>{patientName}</strong> has been recorded successfully.
            </p>

            {/* Print Options Section */}
            {(hasPrescription || hasBill) && (
              <div style={{
                background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.15)',
                borderRadius: 14, padding: '16px 18px', marginBottom: 16
              }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>
                  🖨️ Print Options
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {hasPrescription && (
                    <button
                      onClick={() => printPdf(pdfUrl)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px 18px', borderRadius: 10,
                        background: '#4f46e5', color: '#fff',
                        border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(79,70,229,0.25)'
                      }}
                    >
                      💊 Print Prescription (Rx)
                    </button>
                  )}
                  {hasBill && (
                    <button
                      onClick={() => printPdf(`${API}/billing/latest/?patient_id=${patientId}`)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px 18px', borderRadius: 10,
                        background: '#0891b2', color: '#fff',
                        border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(8,145,178,0.25)'
                      }}
                    >
                      🧾 Print Treatment Bill
                    </button>
                  )}
                  {!hasPrescription && !hasBill && (
                    <button
                      onClick={handlePrint}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px 18px', borderRadius: 10,
                        background: '#4f46e5', color: '#fff',
                        border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                      }}
                    >
                      🖨️ Print {isOnlyBilling ? 'Invoice' : 'Prescription'}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {createdBillId && (
                <button
                  onClick={() => onOpenBilling({ billingId: createdBillId })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '13px 20px', borderRadius: 10,
                    background: '#16a34a', color: '#fff',
                    border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(22,163,74,0.3)'
                  }}
                >
                  💰 Collect Payment (₹)
                </button>
              )}

              <button
                onClick={handleWhatsApp}
                disabled={!patientPhone}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '13px 20px', borderRadius: 10,
                  background: '#25d366', color: '#fff',
                  border: 'none', fontWeight: 700, fontSize: 14, cursor: patientPhone ? 'pointer' : 'not-allowed',
                  opacity: patientPhone ? 1 : 0.5,
                  boxShadow: '0 4px 15px rgba(37,211,102,0.3)'
                }}
              >
                💬 WhatsApp {isOnlyBilling ? 'Invoice' : 'Prescription'}
              </button>

              <button
                onClick={onClose}
                style={{
                  padding: '11px 20px', borderRadius: 10,
                  background: 'transparent', color: 'var(--slate-700)',
                  border: '1px solid var(--border-light)', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            <p style={{ marginTop: 18, fontSize: 11, color: '#94a3b8' }}>
              You can also view &amp; print this from the <strong>Prescriptions</strong> tab in the patient profile.
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ─── MAIN FORM ─── */
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 700, width: '95vw' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <img src="https://www.w3schools.com/howto/img_avatar.png" className={styles.patAvatar} alt="patient" />
            <div>
              <h3>{patientName}</h3>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Prescription & Orders · Appt #{appointmentId}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </header>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '14px 20px 0', borderBottom: '2px solid #e2e8f0', background: 'transparent' }}>
          <button style={TAB_STYLE(tab === 'medicines')} onClick={() => setTab('medicines')}>💊 Medicines</button>
          <button style={TAB_STYLE(tab === 'treatments')} onClick={() => setTab('treatments')}>🦷 Treatments</button>
          <button style={TAB_STYLE(tab === 'lab')} onClick={() => setTab('lab')}>🧪 Lab Tests</button>
          <button onClick={() => setTab('billing')}
            style={{ ...TAB_STYLE(tab === 'billing'), color: tab === 'billing' ? '#fff' : '#16a34a', borderBottom: tab === 'billing' ? 'none' : '2px solid #bbf7d0' }}
          >💰 Billing</button>
        </div>

        <div className={styles.body} style={{ padding: '20px 24px', minHeight: 340, maxHeight: '60vh', overflowY: 'auto' }}>

          {/* ── MEDICINES TAB ── */}
          {tab === 'medicines' && (
            <div>
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Click to search or select medicines..."
                      value={medSearch}
                      onChange={e => {
                        setMedSearch(e.target.value)
                        setShowMedResults(true)
                      }}
                      onFocus={() => setShowMedResults(true)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box', color: '#334155' }}
                    />
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                      ▼
                    </div>
                  </div>

                  <button onClick={addCustomMedicine}
                    style={{ padding: '12px 20px', borderRadius: 8, background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Create New Medicine
                  </button>
                </div>

                {showMedResults && medSearch.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'var(--slate-100)', border: '1px solid var(--border-light)', borderRadius: 12, marginTop: 6,
                    maxHeight: 250, overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}>
                    {medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())).length === 0 ? (
                      <div style={{ padding: '12px', fontSize: 13, color: '#64748b', textAlign: 'center' }}>No matches. Click "+ Custom" to add.</div>
                    ) : (
                      medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())).map(m => (
                        <div
                          key={m.id}
                          onClick={() => {
                            addMedicine(m)
                            setMedSearch('')
                            setShowMedResults(false)
                          }}
                          style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--slate-900)' }}>
                            <span>{m.name}</span>
                            <span style={{ color: '#10b981' }}>₹{m.sales_rate}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{m.dosage} · {m.frequency}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {rxItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14, background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                  No medicines added. Search or click "Create New Medicine" to add one.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '30px 1.2fr 1.5fr 70px 90px 90px 90px 50px 110px 40px', gap: 12, fontSize: 12, fontWeight: 600, color: '#64748b', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
                    <span>#</span>
                    <span>Medicine</span>
                    <span>Content</span>
                    <span>Price</span>
                    <span>Dosage</span>
                    <span>Time</span>
                    <span>Days</span>
                    <span>Qty</span>
                    <span>Advice</span>
                    <span></span>
                  </div>
                  {rxItems.map((it, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '30px 1.2fr 1.5fr 70px 90px 90px 90px 50px 110px 40px', gap: 12, alignItems: 'center', background: '#fff', padding: '12px 16px', borderBottom: idx !== rxItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{idx + 1}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{it.name}</span>
                      <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{it.content}</span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>₹</span>
                        <input type="number" value={it.unit_price} onChange={e => updateRxItem(idx, 'unit_price', e.target.value)}
                          style={{ width: '100%', padding: '6px 4px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff', fontWeight: 600 }} />
                      </div>
                      
                      <input type="text" value={it.dosage} onChange={e => updateRxItem(idx, 'dosage', e.target.value)} placeholder="e.g. 500mg, 1 Tab" style={{ padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff' }} />

                      <select value={it.time} onChange={e => updateRxItem(idx, 'time', e.target.value)} style={{ padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff' }}>
                        <option value="Select">Select</option>
                        <option value="1-0-1">1-0-1</option>
                        <option value="1-1-1">1-1-1</option>
                        <option value="0-0-1">0-0-1</option>
                        <option value="1-0-0">1-0-0</option>
                        <option value="SOS">SOS</option>
                      </select>

                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                        <button onClick={() => updateRxItem(idx, 'duration', Math.max(1, parseInt(it.duration) - 1))} style={{ padding: '6px 8px', background: '#f8fafc', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b' }}>-</button>
                        <input type="number" min="1" value={it.duration} onChange={e => updateRxItem(idx, 'duration', parseInt(e.target.value) || 1)} style={{ width: '100%', padding: '6px 0', fontSize: 12, border: 'none', textAlign: 'center', outline: 'none' }} />
                        <button onClick={() => updateRxItem(idx, 'duration', parseInt(it.duration) + 1)} style={{ padding: '6px 8px', background: '#f8fafc', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b' }}>+</button>
                      </div>

                      <span style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>-</span>
                      
                      <select value={it.advice} onChange={e => updateRxItem(idx, 'advice', e.target.value)} style={{ padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff' }}>
                        <option value="Select">Select</option>
                        <option value="Before Food">Before Food</option>
                        <option value="After Food">After Food</option>
                      </select>

                      <button onClick={() => setRxItems(p => p.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Extra Notes (Advices) */}
              <div style={{ marginTop: '16px' }}>
                <label style={{
                  display: 'block', fontSize: 13, fontWeight: 600,
                  color: 'var(--slate-800)', marginBottom: 8
                }}>
                  Advices / Instructions
                </label>
                <textarea
                  value={rxNotes}
                  onChange={e => setRxNotes(e.target.value)}
                  placeholder="General advices (diet, rest, follow-up etc.)..."
                  style={{
                    width: '100%', minHeight: '80px', padding: '12px',
                    borderRadius: 8, border: '1px solid var(--border-light)',
                    background: '#fff', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>
            </div>
          )}

          {/* ── TREATMENTS TAB ── */}
          {tab === 'treatments' && (
            <div>
              {/* Treatment History Section (Priority) */}
              <div style={{ background: 'transparent', borderRadius: 12, border: '1px solid var(--border-light)', padding: 16, marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, color: 'var(--slate-700)', textTransform: 'uppercase' }}>Treatment History</h4>
                {patientDetails?.payments?.filter(p => p.items?.length > 0).length === 0 ? (
                  <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: '10px 0' }}>No past treatments recorded</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                    {[...patientDetails.payments].filter(p => p.items?.length > 0).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(p => (
                      <div key={p.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                          <strong>{new Date(p.created_at).toLocaleDateString()}</strong>
                          <span>₹{p.total_amount}</span>
                        </div>
                        {p.items.map((it, i) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--slate-900)', fontWeight: 600 }}>• {it.treatment_name || 'Treatment'}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Treatments Section */}
              <h4 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, color: 'var(--slate-700)', textTransform: 'uppercase' }}>Add New Treatment</h4>
              <div style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  placeholder="🔍 Search treatments to add..."
                  value={treatmentSearch}
                  onChange={e => setTreatmentSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: 13, background: 'rgba(255, 255, 255, 0.03)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredTreatments.map(t => {
                  const selected = selectedTreatments.find(x => x.id === t.id)
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 8,
                      border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border-light)'}`,
                      background: selected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }} onClick={() => toggleTreatment(t)}>
                      <input type="checkbox" readOnly checked={!!selected}
                        style={{ width: 16, height: 16, accentColor: '#4f46e5', cursor: 'pointer' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-900)' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{t.fee_type}</div>
                      </div>
                      {selected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <label style={{ fontSize: 11, color: '#64748b' }}>Qty:</label>
                          <input type="number" min={1} value={selected.qty}
                            onChange={e => updateTreatmentQty(t.id, e.target.value)}
                            style={{ width: 52, padding: '4px 6px', borderRadius: 6, border: '1px solid #a5b4fc', fontSize: 12, textAlign: 'center' }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── LAB TESTS TAB ── */}
          {tab === 'lab' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <select value="" onChange={e => {
                  const test = labMaster.find(t => String(t.id) === String(e.target.value))
                  if (test) addLabTest(test)
                }}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13 }}>
                  <option value="">⚡ Select Lab Test from Settings…</option>
                  {labMaster.map(t => <option key={t.id} value={t.id}>{t.name} (₹{t.price})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input value={customLab} onChange={e => setCustomLab(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomLab()}
                  placeholder="Custom lab test name…"
                  style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13, background: 'var(--slate-200)', color: 'var(--slate-900)' }} />
                <button onClick={addCustomLab}
                  style={{ padding: '0 16px', borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  + Add
                </button>
              </div>
              {labItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>No lab tests ordered yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: 12, color: '#10b981', marginBottom: 4 }}>
                    ℹ️ Lab tests are considered <strong>Cash/Paid</strong> items and do not add to patient credit.
                  </div>
                  {labItems.map((lab, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      <span style={{ fontSize: 16 }}>🧪</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-900)' }}>{lab.name}</div>
                        <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>₹{lab.price}</div>
                        <input value={lab.notes}
                          onChange={e => setLabItems(p => p.map((l, i) => i === idx ? { ...l, notes: e.target.value } : l))}
                          placeholder="Additional notes…"
                          style={{ marginTop: 4, width: '100%', padding: '4px 8px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border-light)', boxSizing: 'border-box', background: 'var(--slate-200)', color: 'var(--slate-900)' }} />
                      </div>
                      <button onClick={() => setLabItems(p => p.filter((_, i) => i !== idx))}
                        style={{ border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: 6, cursor: 'pointer', fontWeight: 700, padding: '4px 8px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── BILLING TAB ── */}
          {tab === 'billing' && (
            <div style={{ background: 'transparent', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', gridColumn: 'span 2' }}>
                <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Today's Bill</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#4f46e5' }}>₹{currentItemsTotal.toFixed(0)}</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '16px', borderRadius: '12px', marginBottom: '20px', color: '#fff', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Total Amount Payable</p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 900 }}>₹{currentItemsTotal.toFixed(0)}</p>
              </div>


              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Items & Prices</p>
                <div style={{ fontSize: 13, color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedTreatments.map(t => (
                    <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 100px', gap: 10, alignItems: 'center' }}>
                      <span>{t.name}</span>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>x{t.qty}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#94a3b8' }}>₹</span>
                        <input type="number" value={t.price}
                          onChange={e => setSelectedTreatments(prev => prev.map(x => x.id === t.id ? { ...x, price: parseFloat(e.target.value) || 0 } : x))}
                          style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid var(--border-light)', fontSize: 12 }}
                        />
                      </div>
                    </div>
                  ))}
                  {labItems.map((l, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 100px', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: '#0369a1' }}>🧪 {l.name}</span>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>1</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#94a3b8' }}>₹</span>
                        <input type="number" value={l.price}
                          onChange={e => setLabItems(prev => prev.map((x, idx) => idx === i ? { ...x, price: parseFloat(e.target.value) || 0 } : x))}
                          style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid var(--border-light)', fontSize: 12 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pay For Today's Bill</p>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: finalBalance > 0 ? '#dc2626' : '#16a34a' }}>
                    Remaining (Today): ₹{finalBalance.toFixed(0)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="number"
                      placeholder="Pay for today's treatments..."
                      value={billingData.paid_amount}
                      onChange={e => setBillingData({ ...billingData, paid_amount: e.target.value })}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #4f46e5', fontSize: '15px', fontWeight: 700, boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setBillingData({ ...billingData, paid_amount: currentBill.toString() })}
                      style={{
                        position: 'absolute', right: 8, top: 8, bottom: 8,
                        background: '#4f46e5', color: '#fff', border: 'none',
                        borderRadius: 6, padding: '0 10px', fontSize: 11,
                        fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      Pay Full Today
                    </button>
                  </div>
                  <select
                    value={billingData.payment_method}
                    onChange={e => setBillingData({ ...billingData, payment_method: e.target.value })}
                    style={{ width: '130px', padding: '12px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '14px', fontWeight: 600 }}
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Note for today's payment..."
                  value={billingData.notes || ''}
                  onChange={e => setBillingData({ ...billingData, notes: e.target.value })}
                  style={{ width: '100%', marginTop: '10px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>


            </div>
          )}
        </div>

        {/* Footer */}
        <footer className={styles.footer} style={{ justifyContent: 'space-between', padding: '14px 24px', background: 'transparent', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {rxItems.length > 0 && <span>💊 {rxItems.length} med(s) &nbsp;</span>}
            {selectedTreatments.length > 0 && <span>· 🦷 {selectedTreatments.length} treatment(s) &nbsp;</span>}
            {labItems.length > 0 && <span>· 🧪 {labItems.length} lab test(s)</span>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {tab !== 'billing' && (selectedTreatments.length > 0 || labItems.length > 0 || rxItems.length > 0) && (
              <button
                onClick={() => {
                  if (rxItems.length > 0 && selectedTreatments.length === 0 && labItems.length === 0) {
                    // If ONLY medicines, save and go to Pharmacy Hub
                    handleSave(false).then(() => {
                      if (onNavigate) onNavigate('pharmacy');
                    });
                  } else {
                    setTab('billing');
                  }
                }}
                style={{
                  background: '#16a34a', color: '#fff', border: 'none', padding: '11px 20px',
                  borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14
                }}
              >
                💰 {rxItems.length > 0 && selectedTreatments.length === 0 ? 'Go to Pharmacy' : 'Go to Billing'}
              </button>
            )}
            <button
              disabled={saving || !hasAnything}
              style={{
                background: '#e2e8f0', color: 'var(--slate-800)', border: 'none', padding: '11px 20px',
                borderRadius: 8, fontWeight: 700, cursor: hasAnything ? 'pointer' : 'not-allowed',
                fontSize: 14, opacity: saving ? 0.7 : 1
              }}
              onClick={() => handleFinalSave(false)}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              disabled={saving || !hasAnything}
              style={{
                background: hasAnything ? '#4f46e5' : '#94a3b8',
                color: '#fff', border: 'none', padding: '11px 28px',
                borderRadius: 8, fontWeight: 700, cursor: hasAnything ? 'pointer' : 'not-allowed',
                fontSize: 14, opacity: saving ? 0.7 : 1
              }}
              onClick={() => handleFinalSave(true)}
            >
              {saving ? 'Saving…' : 'Save & Print'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
