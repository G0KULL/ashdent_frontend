import { calcAgeFromDob, calcDobFromAge } from './AddPatient'

function EditPatientModal({ patient, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: patient.name || '',
    phone: patient.phone || '',
    gender: patient.gender || '',
    dob: patient.dob || '',
    age: patient.age !== undefined && patient.age !== null ? String(patient.age) : '',
    address: patient.address || '',
    pincode: patient.pincode || '',
  })
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  function handleDobChange(val) {
    const todayStr = new Date().toISOString().split('T')[0]
    let errDob = ''
    if (val && val > todayStr) errDob = 'Date of birth cannot be in the future'
    const age = calcAgeFromDob(val)
    setFormData(f => ({ ...f, dob: val, age }))
    setErrors(e => ({ ...e, dob: errDob, age: '' }))
  }

  function handleAgeChange(val) {
    const cleanVal = val.replace(/\D/g, '')
    if (cleanVal === '') {
      setFormData(f => ({ ...f, age: '' }))
      setErrors(e => ({ ...e, age: '' }))
      return
    }
    const ageNum = parseInt(cleanVal, 10)
    let errAge = ''
    if (ageNum > 150) errAge = 'Please enter a valid age (0 - 150)'
    const dob = calcDobFromAge(cleanVal, formData.dob)
    setFormData(f => ({ ...f, age: cleanVal, dob }))
    setErrors(e => ({ ...e, age: errAge, dob: errAge ? 'Invalid age' : '' }))
  }

  function handlePincodeChange(val) {
    const cleanVal = val.replace(/\D/g, '').slice(0, 6)
    setFormData(f => ({ ...f, pincode: cleanVal }))
    if (errors.pincode) setErrors(e => ({ ...e, pincode: '' }))
  }

  async function handleSave() {
    const e = {}
    if (!formData.name.trim()) e.name = 'Name is required'
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) e.phone = 'Enter valid 10-digit phone'
    if (formData.dob) {
      const todayStr = new Date().toISOString().split('T')[0]
      if (formData.dob > todayStr) e.dob = 'Date of birth cannot be in the future'
    }
    if (formData.pincode && formData.pincode.trim()) {
      if (!/^\d{6}$/.test(formData.pincode.trim())) e.pincode = 'Pincode must be 6 digits'
    }
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        gender: formData.gender,
        dob: formData.dob || null,
        age: formData.age !== '' && formData.age !== null ? parseInt(formData.age, 10) : null,
        address: formData.address || null,
        pincode: formData.pincode || null,
      }
      const res = await fetch(`http://127.0.0.1:8000/api/patient/${patient.id}/profile/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        onSaved()
        onClose()
      } else {
        const errs = await res.json()
        setErrors(errs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.overlay} role="dialog">
      <div className={styles.modal} style={{ maxWidth: 540 }}>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>Edit Patient Details</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Name *</label>
              <input style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              {errors.name && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.name}</span>}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Phone</label>
              <input style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              {errors.phone && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.phone}</span>}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Gender</label>
              <select style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Date of Birth</label>
              <input type="date" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.dob} onChange={e => handleDobChange(e.target.value)} />
              {errors.dob && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.dob}</span>}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Age</label>
              <input style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} placeholder="Age" value={formData.age} onChange={e => handleAgeChange(e.target.value)} />
              {errors.age && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.age}</span>}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Address</label>
              <textarea rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Pincode</label>
              <input maxLength={6} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} placeholder="6-digit pincode" value={formData.pincode} onChange={e => handlePincodeChange(e.target.value)} />
              {errors.pincode && <span style={{ color: '#ef4444', fontSize: 11 }}>{errors.pincode}</span>}
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }} onClick={onClose}>Cancel</button>
            <button style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const TABS = [
  'Overview', 'Medical History', 'Dental History', 'Appointment History', 'Treatment History', 
  'Dental Chart', 'RVG / X-Rays', 'Clinical Notes', 'Follow-ups',
  'Prescription', 'Invoice', 'Laboratory', 'WhatsApp', 'Gmail'
]

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function PatientProfileView({
  viewPatient, profile, profileLoading, patientName, patientPhone,
  closeProfile, refreshProfile, onNavigate
}) {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.initialTab || 'general')
  const [showNotes, setShowNotes] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Sync initial tab when location state changes
  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab)
    }
  }, [location.state?.initialTab])

  const patData = profile?.patient || viewPatient
  const totalBalance = parseFloat(profile?.total_balance || 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '0px' }}>
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={closeProfile} 
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            ← Back to Patients
          </button>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
            Patient Records ➔ <span style={{ color: '#0f172a', fontWeight: 700 }}>{patData.name || patientName}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#2563eb',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            ✏️ Edit Details
          </button>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
            ID: {viewPatient.id}
          </div>
        </div>
      </div>

      {/* Main Patient Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Patient Profile Row */}
        <div style={{
          padding: '24px 32px 16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: '#ede7f6',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800
            }}>
              {getInitials(patData.name || patientName)}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>
                {patData.name || patientName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                <span>📞 {patData.phone || patientPhone}</span>
                <span>·</span>
                <span>{patData.age !== undefined && patData.age !== null ? `${patData.age} yrs` : '—'}</span>
                <span>·</span>
                <span style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  border: '1px solid #a7f3d0'
                }}>
                  {patData.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Net Balance
            </span>
            <strong style={{
              fontSize: 20,
              fontWeight: 800,
              color: totalBalance > 0 ? '#ef4444' : '#10b981',
              display: 'block',
              marginTop: 2
            }}>
              {totalBalance <= 0 ? 'Nil' : `₹${Math.abs(totalBalance).toFixed(2)}`}
            </strong>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: 0 }} />

        {/* Stepper / Tabs */}
        <div style={{
          display: 'flex',
          gap: 20,
          padding: '0 32px',
          background: '#ffffff',
          overflowX: 'auto',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {TABS.map((t) => {
            const val = t.toLowerCase();
            const isActive = activeTab === val;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(val)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '16px 4px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: isActive ? '#4f46e5' : '#64748b',
                  borderBottom: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap'
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Success Banner */}
        {showSuccess && (
          <div className={styles.successBanner}>
            ✓ Action completed successfully!
          </div>
        )}

        {/* Body content based on tab */}
        <div className={styles.viewBody} style={{ padding: 0 }}>
          {activeTab === 'overview' && (() => {
            return (
              <div className={styles.treatmentsTabBody}>
                <h3 className={styles.sectionTitle}>Overview</h3>
                <div className={styles.viewGrid} style={{ marginBottom: 24 }}>
                  <div className={styles.viewField}><span>Gender</span><strong>{patData.gender || '—'}</strong></div>
                  <div className={styles.viewField}><span>Date of Birth</span><strong>{patData.dob || '—'}</strong></div>
                  <div className={styles.viewField}><span>Age</span><strong>{patData.age !== undefined && patData.age !== null ? `${patData.age} yrs` : '—'}</strong></div>
                  <div className={styles.viewField}><span>Blood Group</span><strong>{patData.blood_group || '—'}</strong></div>
                  <div className={styles.viewField}><span>Address</span><strong>{patData.address || '—'}</strong></div>
                  <div className={styles.viewField}><span>Pincode</span><strong>{patData.pincode || '—'}</strong></div>
                </div>
                <PatientProfileAppointment profile={profile} />
              </div>
            );
          })()}

          {activeTab === 'appointment history' && <PatientProfileAppointment profile={profile} />}
          {activeTab === 'treatment history' && <PatientTreatmentHistoryTab patientId={viewPatient.id} />}
          
          {activeTab === 'clinical notes' && (
            <div className={styles.treatmentsTabBody}>
              <div className={styles.treatmentActionsRow}>
                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Clinical Notes</h3>
                <button className={styles.addBtn} onClick={() => setShowNotes('new')}>+ Add Note</button>
              </div>
              <p style={{ color: '#64748b' }}>View past notes or add new ones by clicking above.</p>
            </div>
          )}

          {activeTab === 'medical history' && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Coming soon...</div>}
          {activeTab === 'dental history' && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Coming soon...</div>}
          {activeTab === 'dental chart' && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Coming soon...</div>}
          {activeTab === 'rvg / x-rays' && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Coming soon...</div>}
          {activeTab === 'follow-ups' && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Coming soon...</div>}

          {/* Legacy Tabs for compatibility */}
          {activeTab === 'general' && <div style={{ padding: '2rem', textAlign: 'center' }}>Please use the 'Overview' tab.</div>}
          {activeTab === 'treatments' && <PatientProfileTreatment viewPatient={viewPatient} profile={profile} refreshProfile={refreshProfile} />}
          {activeTab === 'prescription' && <PatientProfilePrescription viewPatient={viewPatient} profile={profile} refreshProfile={refreshProfile} />}
          {activeTab === 'invoice' && <PatientProfileInvoice viewPatient={viewPatient} profile={profile} refreshProfile={refreshProfile} />}
          {activeTab === 'laboratory' && <PatientProfileLaboratory viewPatient={viewPatient} />}
          {activeTab === 'whatsapp' && <PatientProfileWhatsApp patientPhone={patientPhone} patientName={patientName} />}
          {activeTab === 'gmail' && <PatientProfileGmail email={profile?.patient?.email || viewPatient.email || ''} patientName={patientName} />}
        </div>
      </div>

      {/* ── Modals that sit on top ── */}
      {showEditModal && (
        <EditPatientModal
          patient={patData}
          onClose={() => setShowEditModal(false)}
          onSaved={() => refreshProfile()}
        />
      )}

      {showNotes && (
        <ClinicalNotesModal
          appointmentId={showNotes === 'new' ? null : showNotes}
          patientId={viewPatient.id}
          patientName={patientName}
          onClose={() => { setShowNotes(null); refreshProfile() }}
        />
      )}

    </div>
  )
}
