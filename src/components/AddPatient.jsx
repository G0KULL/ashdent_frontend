import { useState, useRef, useEffect } from 'react'
import { usePatients } from '../context/PatientContext'
import styles from './AddPatient.module.css'
import Swal from 'sweetalert2'

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']
const FEE_OPTIONS = ['Standard', 'Premium', 'Budget', 'Insurance', 'Waived']
const TYPE_OPTIONS = ['New', 'Review', 'Emergency', 'Follow-up']
const DOCTOR_OPTIONS = ['Dr. Navas Kp', 'Dr. Anitha Raj', 'Dr. Suresh Nair']

function calcAge(dob) {
  if (!dob) return ''
  const d = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return String(age)
}

export default function AddPatient({ onClose, onSaved, initialData = {}, currentUser }) {
  const { groups, addGroup, addPatient, fetchPatients, nextId } = usePatients()
  const [treatmentsList, setTreatmentsList] = useState([])
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    firstName: '', lastName: '', mobile: initialData.mobile || '',
    state: '', locality: '', address: '', dob: '', age: '',
    gender: '', country: 'India',
    remarks: '', group: '', fee: '', consultationFee: '', type: '',
    medication: '', pregnant: '',
    doctor: '', surgery: '', dentalHistory: '',
    selectedTreatments: [],
    prescriptionNotes: '',
    prescriptionNotes: '',
    paidAmount: 0,
    paymentMethod: 'Cash',
    tax: '',
    time: ''
  })
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const savingRef = useRef(false)          // synchronous guard — prevents double-submit
  const [saveAndPrint, setSaveAndPrint] = useState(false)
  const [groupPopup, setGroupPopup] = useState(false)
  const [newGroup, setNewGroup] = useState('')
  const [groupError, setGroupError] = useState('')
  const popupRef = useRef(null)
  const regId = `REG-${String(nextId).padStart(4, '0')}`

  const [doctorsList, setDoctorsList] = useState([])
  const [patientGroups, setPatientGroups] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [taxesList, setTaxesList] = useState([])

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/treatment-master/list/')
      .then(r => r.json())
      .then(data => setTreatmentsList(data))
      .catch(e => console.error("Error fetching treatments:", e))

    fetch('http://127.0.0.1:8000/api/doctors/')
      .then(r => r.json())
      .then(data => {
        setDoctorsList(data)
        if (currentUser?.role === 'Doctor' && currentUser?.doctor_profile_id) {
          const myDoc = data.find(d => String(d.id) === String(currentUser.doctor_profile_id))
          if (myDoc) {
            set('doctor', String(myDoc.id))
          }
        }
      })
      .catch(e => console.error("Error fetching doctors:", e))

    fetch('http://127.0.0.1:8000/api/patient-groups/')
      .then(r => r.json())
      .then(data => {
        if (!data || data.length === 0) {
          setPatientGroups([{ id: 'ortho', name: 'Ortho' }, { id: 'implant', name: 'Implant' }]);
        } else {
          // ensure Ortho and Implant exist if not present
          const hasOrtho = data.some(g => g.name.toLowerCase() === 'ortho');
          const hasImplant = data.some(g => g.name.toLowerCase() === 'implant');
          const defaults = [];
          if (!hasOrtho) defaults.push({ id: 'mock-ortho', name: 'Ortho' });
          if (!hasImplant) defaults.push({ id: 'mock-implant', name: 'Implant' });
          setPatientGroups([...data, ...defaults]);
        }
      })
      .catch(e => {
        console.error("Error fetching patient groups:", e);
        setPatientGroups([{ id: 'ortho', name: 'Ortho' }, { id: 'implant', name: 'Implant' }]);
      })

    fetch('http://127.0.0.1:8000/api/dropdowns/payment_method/')
      .then(r => r.json())
      .then(data => setPaymentMethods(data.map(d => d.name)))
      .catch(e => console.error("Error fetching payment methods:", e))

    fetch('http://127.0.0.1:8000/api/settings/taxes/')
      .then(r => r.json())
      .then(data => setTaxesList(data.filter(t => t.is_active)))
      .catch(e => console.error("Error fetching taxes:", e))
  }, [])

  // Close popup on outside click
  useEffect(() => {
    function handler(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) setGroupPopup(false)
    }
    if (groupPopup) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [groupPopup])

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
  }

  function handleDob(val) {
    const age = calcAge(val)
    setForm(f => ({ ...f, dob: val, age }))
  }

  function toggleTreatment(id) {
    setForm(f => {
      const current = f.selectedTreatments
      if (current.includes(id)) return { ...f, selectedTreatments: current.filter(x => x !== id) }
      return { ...f, selectedTreatments: [...current, id] }
    })
  }

  function validate() {
    const req = { date: 'Registration Date', firstName: 'First name', lastName: 'Last name', mobile: 'Mobile number', gender: 'Gender', dob: 'Date of birth', doctor: 'Doctor' }
    const e = {}
    for (const [k, label] of Object.entries(req)) {
      if (!form[k]?.trim()) e[k] = `${label} is required`
    }
    if (form.mobile && !/^\d{10}$/.test(form.mobile)) e.mobile = 'Enter a valid 10-digit mobile number'
    setErrors(e)
    if (Object.keys(e).length > 0) {
      const missing = Object.values(e).join('<br/>• ')
      Swal.fire({
        title: 'Please fill required fields',
        html: `<div style="text-align:left">• ${missing}</div>`,
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'OK, got it'
      })
      return false
    }
    return true
  }

  async function handleSave() {
    if (savingRef.current) return   // ← synchronous guard — blocks any re-entry instantly
    if (!validate()) return

    savingRef.current = true        // ← lock synchronously before any await
    setIsSaving(true)               // ← update UI state (button shows spinner)

    const intakeData = {
      date: form.date,
      name: `${form.firstName} ${form.lastName}`,
      phone: form.mobile,
      dob: form.dob || null,
      age: form.age,
      gender: form.gender,
      doctor: form.doctor,
      group_ids: form.group ? [parseInt(form.group)] : [],
      notes: form.remarks || form.dentalHistory,
      treatments: form.selectedTreatments,
      prescription_notes: form.prescriptionNotes,
      paid_amount: form.paidAmount,
      payment_method: form.paymentMethod,
      consultation_fee: form.consultationFee,
      fee_type: form.fee,
      visit_type: form.type,
      time: form.time,
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/patient/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intakeData)
      });

      if (res.ok) {
        // Show success alert immediately — don't wait for fetchPatients
        Swal.fire({
          title: '✅ Patient Saved!',
          text: 'Patient has been registered successfully.',
          icon: 'success',
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Great!',
          timer: 2000,
          timerProgressBar: true,
        }).then(() => {
          if (saveAndPrint) window.print()
          onSaved()
        })

        fetchPatients('') // refresh in background — no await
      } else {
        const errData = await res.json();
        console.error("Save Error:", errData);
        let errorText = "Cannot Save Patient";
        if (errData.phone) {
          errorText = "Phone number already exists or is invalid.";
        } else if (errData.detail) {
          errorText = errData.detail;
        } else {
          errorText = JSON.stringify(errData);
        }
        Swal.fire({
          title: 'Error!',
          text: errorText,
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
        savingRef.current = false   // re-enable on error so user can fix and retry
        setIsSaving(false)
      }
    } catch (err) {
      console.error("Backend error:", err);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to connect to backend',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      savingRef.current = false     // re-enable on network error
      setIsSaving(false)
    }
  }

  async function handleAddGroup() {
    const trimmed = newGroup.trim()
    if (!trimmed) { setGroupError('Enter a group name'); return }
    if (patientGroups.some(g => g.name.toLowerCase() === trimmed.toLowerCase())) { setGroupError('Group already exists'); return }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/patient-groups/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      })
      if (res.ok) {
        const newGrp = await res.json()
        setPatientGroups(prev => [...prev, newGrp])
        setForm(f => ({ ...f, group: String(newGrp.id) }))
        setNewGroup('')
        setGroupError('')
        setGroupPopup(false)
      }
    } catch (err) {
      setGroupError('Failed to create group')
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Add Patient">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="4" fill="white" />
                <path d="M2 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M17 7v6M14 10h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className={styles.headerTitle}>Add New Patient</h2>
              <p className={styles.headerSub}>Fill in the patient details below</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {/* Auto IDs row */}
          <div className={styles.autoRow}>
            <div className={styles.autoField}>
              <label>Registration ID</label>
              <span className={styles.autoValue}>{regId}</span>
            </div>
            <div className={styles.autoField}>
              <label>Rec No</label>
              <span className={styles.autoValue}>{regId.replace('REG', 'REC')}</span>
            </div>
            <div className={styles.autoField}>
              <label>Created At</label>
              <span className={styles.autoValue}>{new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>

          {/* ── Section 1: Basic Info ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: '#1E88E5' }} />
              Basic Information
            </div>
            <div className={styles.grid2}>
              <Field label="Registration Date *" error={errors.date}>
                <input type="date" className={err(errors.date)} value={form.date} onChange={e => set('date', e.target.value)} />
              </Field>
              <Field label="First Name *" error={errors.firstName}>
                <input className={err(errors.firstName)} placeholder="e.g. Arjun" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
              </Field>
              <Field label="Last Name *" error={errors.lastName}>
                <input className={err(errors.lastName)} placeholder="e.g. Menon" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
              </Field>
              <Field label="Mobile No *" error={errors.mobile}>
                <input className={err(errors.mobile)} placeholder="10-digit number" maxLength={10} value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/, ''))} />
              </Field>
              <Field label="Date of Birth *" error={errors.dob}>
                <input type="date" className={err(errors.dob)} value={form.dob} onChange={e => handleDob(e.target.value)} />
              </Field>
              <Field label="Age">
                <input placeholder="Auto-calculated" value={form.age} readOnly className={styles.readOnly} />
              </Field>
              <Field label="Gender *" error={errors.gender}>
                <select className={err(errors.gender)} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Appointment Time">
                <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
              </Field>
              <Field label="Country">
                <input value={form.country} onChange={e => set('country', e.target.value)} />
              </Field>
              <Field label="State">
                <select value={form.state} onChange={e => set('state', e.target.value)}>
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Locality">
                <input placeholder="City / Town" value={form.locality} onChange={e => set('locality', e.target.value)} />
              </Field>
              <Field label="Address" span2>
                <textarea rows={2} placeholder="Full address" value={form.address} onChange={e => set('address', e.target.value)} />
              </Field>
            </div>
          </div>

          {/* ── Section 2: Medical History ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: '#4CAF50' }} />
              Medical History
            </div>
            <div className={styles.grid2}>
              <Field label="Patient Remarks" span2>
                <textarea rows={2} placeholder="Notes or remarks…" value={form.remarks} onChange={e => set('remarks', e.target.value)} />
              </Field>

              {/* Patient Group with + button */}
              <Field label="Patient Group">
                <div className={styles.groupRow} ref={popupRef}>
                  <select value={form.group} onChange={e => set('group', e.target.value)} className={styles.groupSelect}>
                    <option value="">Select group</option>
                    {patientGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <button type="button" className={styles.addGroupBtn} onClick={() => setGroupPopup(o => !o)} title="Add new group">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                  {groupPopup && (
                    <div className={styles.groupPopup}>
                      <p className={styles.groupPopupTitle}>Add New Group</p>
                      <input
                        className={styles.groupInput}
                        placeholder="e.g. Pediatric"
                        value={newGroup}
                        onChange={e => { setNewGroup(e.target.value); setGroupError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                        autoFocus
                      />
                      {groupError && <p className={styles.groupErr}>{groupError}</p>}
                      <div className={styles.groupPopupBtns}>
                        <button className={styles.groupCancelBtn} onClick={() => setGroupPopup(false)}>Cancel</button>
                        <button className={styles.groupSaveBtn} onClick={handleAddGroup}>Add Group</button>
                      </div>
                    </div>
                  )}
                </div>
              </Field>

              <Field label="Assign Doctor *" error={errors.doctor}>
                <select className={err(errors.doctor)} value={form.doctor} onChange={e => set('doctor', e.target.value)}>
                  <option value="">Select doctor</option>
                  {doctorsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* ── Section 4: Consultation & Fees ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: '#FF5722' }} />
              Consultation & Fees
            </div>
            <div className={styles.grid2}>
              <Field label="Prescription Notes" span2>
                <textarea
                  rows={2}
                  placeholder="Medicine / Instructions..."
                  value={form.prescriptionNotes}
                  onChange={e => set('prescriptionNotes', e.target.value)}
                />
              </Field>
              <Field label="Type of Fee">
                <select value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="">Select type</option>
                  {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Consultation Fee (₹)">
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.consultationFee}
                  onChange={e => set('consultationFee', e.target.value)}
                />
              </Field>
              <Field label="Total Paid (₹)">
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.paidAmount}
                  onChange={e => set('paidAmount', e.target.value)}
                />
              </Field>
              <Field label="Payment Method">
                <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map(m => <option key={m}>{m}</option>)
                  ) : (
                    <>
                      <option>Cash</option>
                      <option>Card</option>
                      <option>UPI</option>
                      <option>Cheque</option>
                      <option>Insurance</option>
                      <option>Online</option>
                    </>
                  )}
                </select>
              </Field>

              {/* ── Bill Summary ── */}
              <div style={{
                gridColumn: 'span 2',
                background: 'transparent',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '10px'
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Bill Amount</p>
                  <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)' }}>
                    ₹{(
                      (() => {
                        const baseAmount = form.selectedTreatments.reduce((sum, t) => {
                          return sum + (parseFloat(t.cost) || 0)
                        }, 0) + (parseFloat(form.consultationFee) || 0);
                        const taxRate = parseFloat(form.tax) || 0;
                        return baseAmount + (baseAmount * taxRate / 100);
                      })()
                    ).toFixed(2)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Balance Due</p>
                  <p style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 900,
                    color: (
                      (() => {
                        const baseAmount = form.selectedTreatments.reduce((sum, t) => {
                          return sum + (parseFloat(t.cost) || 0)
                        }, 0) + (parseFloat(form.consultationFee) || 0);
                        const taxRate = parseFloat(form.tax) || 0;
                        const total = baseAmount + (baseAmount * taxRate / 100);
                        return total - (parseFloat(form.paidAmount) || 0);
                      })()
                    ) > 0 ? '#ef4444' : '#10b981'
                  }}>
                    ₹{(
                      (() => {
                        const baseAmount = form.selectedTreatments.reduce((sum, t) => {
                          return sum + (parseFloat(t.cost) || 0)
                        }, 0) + (parseFloat(form.consultationFee) || 0);
                        const taxRate = parseFloat(form.tax) || 0;
                        const total = baseAmount + (baseAmount * taxRate / 100);
                        return total - (parseFloat(form.paidAmount) || 0);
                      })()
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <label className={styles.printCheck}>
            <input type="checkbox" checked={saveAndPrint} onChange={e => setSaveAndPrint(e.target.checked)} />
            <span className={styles.checkCustom} />
            Save &amp; Print
          </label>
          <div className={styles.footerBtns}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isSaving}
              style={isSaving ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
            >
              {isSaving ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="40 20" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10l4 4 8-8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {isSaving ? 'Saving...' : 'Save Patient'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function err(e) { return e ? styles.inputError : '' }
function Field({ label, children, error, span2 }) {
  return (
    <div className={`${styles.field} ${span2 ? styles.span2 : ''}`}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  )
}
