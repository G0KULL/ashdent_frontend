import { useState, useEffect, useRef } from 'react'
import styles from './ClinicalNotesModal.module.css'
import ToothChartUIKit from './ToothChartUIKit'

function printClinicalNotes({ patientName, patientId, appointmentId, data }) {
  const fmt = (arr) => arr && arr.length > 0 ? arr.join(', ') : '—'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Clinical Notes – ${patientName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; font-size: 13px; }
        .page { max-width: 760px; margin: 0 auto; padding: 32px 36px; }
        .clinic-header { text-align: center; border-bottom: 2.5px solid #0ea5e9; padding-bottom: 14px; margin-bottom: 20px; }
        .clinic-name { font-size: 22px; font-weight: 900; color: #0ea5e9; }
        .clinic-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
        .doc-title { text-align: center; font-size: 14px; font-weight: 800; letter-spacing: 2px; color: #334155; text-transform: uppercase; margin-bottom: 18px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 12px 16px; background: #f0f9ff; border-radius: 8px; font-size: 12px; }
        .meta strong { display: block; font-size: 14px; font-weight: 800; color: #0369a1; }
        .section { margin-bottom: 14px; }
        .section-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; }
        .section-value { font-size: 13px; color: #1e293b; line-height: 1.6; font-weight: 500; }
        .teeth-box { display: flex; flex-wrap: wrap; gap: 6px; }
        .tooth-tag { background: #e0f2fe; color: #0369a1; padding: 3px 9px; border-radius: 6px; font-size: 12px; font-weight: 700; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px; }
        .notes-box { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.7; white-space: pre-line; }
        .plan-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.7; white-space: pre-line; }
        .followup-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 14px; font-size: 13px; }
        .sign-section { display: flex; justify-content: space-between; margin-top: 48px; }
        .sign-block { text-align: center; width: 200px; }
        .sign-line { border-top: 1px solid #334155; padding-top: 6px; font-size: 11px; color: #64748b; font-weight: 700; margin-top: 36px; }
        .footer-note { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 28px; border-top: 1px dashed #e2e8f0; padding-top: 14px; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style>
    </head>
    <body>
    <div class="page">
      <div class="clinic-header">
        <div class="clinic-name">🦷 Dental Clinic</div>
        <div class="clinic-sub">Clinical Notes &amp; Treatment Record</div>
      </div>
      <div class="doc-title">Clinical Notes</div>
      <div class="meta">
        <div><strong>${patientName}</strong><span>Patient ID: ${patientId}</span></div>
        <div style="text-align:right"><strong>Appt: #${appointmentId || 'N/A'}</strong><span>Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
      </div>

      <div class="grid-2">
        <div class="section">
          <div class="section-label">Complaints</div>
          <div class="section-value">${fmt(data.complaints)}</div>
        </div>
        <div class="section">
          <div class="section-label">Observations</div>
          <div class="section-value">${fmt(data.observations)}</div>
        </div>
        <div class="section">
          <div class="section-label">Diagnosis</div>
          <div class="section-value">${fmt(data.diagnosis)}</div>
        </div>
        <div class="section">
          <div class="section-label">Medical History</div>
          <div class="section-value">${fmt(data.medical_history)}</div>
        </div>
        <div class="section">
          <div class="section-label">Investigations</div>
          <div class="section-value">${fmt(data.investigations)}</div>
        </div>
        ${data.selected_teeth && data.selected_teeth.length > 0 ? `
        <div class="section">
          <div class="section-label">Teeth Selected</div>
          <div class="teeth-box">${data.selected_teeth.map(t => `<span class="tooth-tag">${t}</span>`).join('')}</div>
        </div>` : ''}
      </div>

      ${data.notes ? `
      <div class="section">
        <div class="section-label">Notes</div>
        <div class="notes-box">${data.notes}</div>
      </div>` : ''}

      ${data.treatment_plan ? `
      <div class="section">
        <div class="section-label">Treatment Plan</div>
        <div class="plan-box">${data.treatment_plan}</div>
      </div>` : ''}

      ${data.follow_up_date ? `
      <div class="followup-box">
        ⏰ <strong>Follow-up:</strong> ${new Date(data.follow_up_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
        ${data.follow_up_note ? ` &mdash; ${data.follow_up_note}` : ''}
      </div>` : ''}

      <div class="sign-section">
        <div class="sign-block"><div class="sign-line">Patient Signature</div></div>
        <div class="sign-block"><div class="sign-line">Doctor Signature</div></div>
      </div>
      <div class="footer-note">This is a clinical record generated from DoctoSmart. For internal use only.</div>
    </div>
    <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>
  `
  const win = window.open('', '_blank', 'width=800,height=750')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

// Hardcoded Common Dropdown Options
const COMMON_DROPDOWNS = {
  complaints: [
    'Toothache / Pain', 'Sensitivity (Hot/Cold)', 'Swelling in Gums', 'Bleeding Gums',
    'Broken / Fractured Tooth', 'Loose Tooth (Mobility)', 'Missing Tooth',
    'Stained / Discolored Teeth', 'Bad Breath (Halitosis)', 'Food Lodgement',
    'Decayed Tooth (Caries)', 'Sharp Tooth Edge', 'Cap / Crown Came Out',
    'Food Stuck in Teeth', 'Routine Checkup', 'Scaling / Cleaning',
    'Braces Consultation', 'Implant Consultation', 'Wisdom Tooth Pain', 'Night Grinding',
    'Gingival Receding', 'Dry Mouth', 'Metal Taste', 'Ulcer in Mouth', 'Tongue Pain'
  ],
  observations: [
    'Deep Dental Caries', 'Pulp Exposure Seen', 'Gingivitis (Mild/Severe)',
    'Periodontitis', 'Grade I/II/III Mobility', 'Fractured Crown',
    'Periapical Abscess', 'Impacted Tooth (3rd Molar)', 'Extensive Stains/Calculus',
    'Pericoronitis', 'Attrition / Abrasion', 'Root Piece Present', 'Dry Socket',
    'Carious Exposure', 'Apical Periodontitis', 'Bone Loss', 'Pocket Depth > 4mm',
    'Gingival Hyperplasia', 'Leukoplakia', 'Erythroplakia', 'Fistula Present',
    'Palatal Swelling', 'Buccal Pitting', 'Enamel Hypoplasia'
  ],
  diagnosis: [
    'Irreversible Pulpitis', 'Reversible Pulpitis', 'Acute Periapical Periodontitis',
    'Chronic Generalized Periodontitis', 'Gingival Recession', 'Dental Caries',
    'Impacted / Mesioangular Tooth', 'Aphthous Ulcer', 'Leukoplakia',
    'Partial Edentulous Arch', 'Fractured Restorable Tooth', 'Pulp Necrosis',
    'Acute Apical Abscess', 'Secondary Caries', 'Pulp Polyp', 'Chronic Periapical Periodontitis',
    'Periapical Granuloma', 'Radicular Cyst', 'ANUG', 'Pericoronitis Acute'
  ],
  investigations: [
    'IOPA X-Ray', 'Bitewing X-Ray', 'OPG (Full Mouth X-Ray)', 'CBCT Scan',
    'Blood Glucose (Random)', 'Blood Count (CBC)', 'Bleeding/Clotting Time',
    'Thermal Pulp Testing', 'Percussion Test', 'Vitality Test', 'Impressions/Models',
    'Diagnostic Wax-up', 'Sextant X-ray', 'Saliva Test', 'Biopsy'
  ],
  medical_history: [
    'Diabetes', 'Hypertension (High BP)', 'Thyroid Disorder', 'Asthma', 'Pregnancy',
    'Heart Disease', 'Bleeding Disorder', 'Drug Allergy (Penicillin)', 'Drug Allergy (Sulfa)',
    'Epilepsy', 'Kidney Disease', 'Liver Disease', 'Blood Thinners', 'Dental Phobia',
    'Tuberculosis', 'Arthritis', 'HIV / Hepatitis', 'Bisphosphonates Therapy', 'Chemotherapy History'
  ],
  note_templates: [
    'Patient advised to maintain better oral hygiene.',
    'Symptomatic relief provided. Reviewed after 3 days.',
    'Explained risks and benefits of the procedure.',
    'Patient refused treatment today. Re-scheduled.',
    'Post-operative instructions given to the patient.',
    'Prescribed medicines as per protocol.'
  ]
}
const TOOTH_SHAPES = {
  incisor: "M35,20 L65,20 C72,20 75,25 75,35 L75,50 C75,70 67,85 52,98 C50,100 50,100 48,98 C30,85 22,70 22,50 L22,35 C22,25 25,20 32,20 Z",
  canine: "M50,15 C42,15 35,25 35,45 C35,65 38,75 48,98 C50,102 52,102 54,98 C65,75 68,65 68,45 C68,25 60,15 50,15 Z",
  premolar: "M30,20 C22,20 18,25 18,40 L18,50 C18,65 15,75 25,95 C30,100 40,100 45,95 C55,75 52,65 52,50 L52,40 C52,25 48,20 40,20 L30,20 Z",
  molar: "M25,20 C18,20 15,25 15,35 L15,45 C15,50 12,55 10,70 C8,85 15,95 25,95 C35,95 40,85 40,70 L40,55 L45,55 L45,70 C45,85 50,95 60,95 C70,95 77,85 75,70 C73,55 70,50 70,45 L70,35 C70,25 65,20 60,20 L25,20 Z"
}

function ToothItem({ num, isSelected, onClick }) {
  const getToothType = (n) => {
    const num = parseInt(n)
    if ([11, 12, 21, 22, 31, 32, 41, 42, 51, 52, 61, 62, 71, 72, 81, 82].includes(num)) return 'incisor'
    if ([13, 23, 33, 43, 53, 63, 73, 83].includes(num)) return 'canine'
    if ([14, 15, 24, 25, 34, 35, 44, 45].includes(num)) return 'premolar'
    return 'molar'
  }

  const type = getToothType(num)
  const path = TOOTH_SHAPES[type]

  return (
    <div
      className={`${styles.svgToothCell} ${isSelected ? styles.svgSelected : ''}`}
      onClick={() => onClick(num)}
    >
      <svg viewBox="0 0 100 110" className={styles.toothSvg}>
        <path d={path} />
      </svg>
      <span className={styles.svgToothNum}>{num}</span>
    </div>
  )
}

export default function ClinicalNotesModal({ appointmentId, patientId, patientName, onClose, onOpenBilling, notesOnly = false }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showTeethChart, setShowTeethChart] = useState(false)
  const [activeTab, setActiveTab] = useState('clinical_notes')
  const [billingData, setBillingData] = useState({ paid_amount: '', payment_method: 'Cash' })
  const [dropdowns, setDropdowns] = useState({
    complaints: COMMON_DROPDOWNS.complaints,
    observations: COMMON_DROPDOWNS.observations,
    investigations: COMMON_DROPDOWNS.investigations,
    diagnosis: COMMON_DROPDOWNS.diagnosis,
    medical_history: COMMON_DROPDOWNS.medical_history,
    treatments: [],
    medicines: [],
  })
  const [data, setData] = useState({
    selected_teeth: [],
    complaints: [],
    observations: [],
    investigations: [],
    diagnosis: [],
    medical_history: [],
    notes: '',
    treatment_plan: '',
    follow_up_date: '',
    follow_up_note: '',
    prescription_items: [],
    prescription_notes: '',
    visit_treatments: [], // These are suggested treatments for billing
    visit_id: null
  })

  // New: Profile and History
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [historyTab, setHistoryTab] = useState('notes')
  const [payOldAmount, setPayOldAmount] = useState('')
  const [payingOld, setPayingOld] = useState(false)
  const [historyDateFilter, setHistoryDateFilter] = useState('')
  const [showLatestOnly, setShowLatestOnly] = useState(false)



  useEffect(() => {
    console.log("ClinicalNotesModal mounted with ID:", appointmentId)
    async function loadInitialData() {
      try {
        let jsonNotes = null;
        let visitData = null;

        if (appointmentId) {
          const [resNotes, resVisit] = await Promise.all([
            fetch(`http://127.0.0.1:8000/api/clinical-notes/${appointmentId}/`),
            fetch(`http://127.0.0.1:8000/api/visit/appointment/${appointmentId}/`)
          ])
          jsonNotes = await resNotes.json()
          visitData = resVisit.ok ? await resVisit.json() : null
        }

        const patId = jsonNotes?.patient || visitData?.patient || patientId;
        if (patId) {
          fetch(`http://127.0.0.1:8000/api/patient/${patId}/profile/`)
            .then(r => r.json())
            .then(p => {
              setProfile(p)
              setLoadingProfile(false)
            }).catch(() => setLoadingProfile(false))
        } else {
          setLoadingProfile(false)
        }

        if (jsonNotes) {
          setData(d => ({
            ...d,
            selected_teeth: jsonNotes.selected_teeth || [],
            complaints: jsonNotes.complaints || [],
            observations: jsonNotes.observations || [],
            investigations: jsonNotes.investigations || [],
            diagnosis: jsonNotes.diagnosis || [],
            medical_history: jsonNotes.medical_history || [],
            notes: jsonNotes.notes || '',
            treatment_plan: jsonNotes.treatment_plan || '',
            follow_up_date: jsonNotes.follow_up_date || '',
            follow_up_note: jsonNotes.follow_up_note || '',
            visit_id: visitData?.id || null,
            clinical_note_id: jsonNotes?.id || null
          }))
        }

        // 4. Fetch Dropdowns (Parallel)
        const types = [
          { key: 'complaints', type: 'complaint' },
          { key: 'observations', type: 'observation' },
          { key: 'investigations', type: 'investigation' },
          { key: 'diagnosis', type: 'diagnosis' },
          { key: 'medical_history', type: 'medical_history' }
        ]

        const dropdownPromises = types.map(async (item) => {
          try {
            const res = await fetch(`http://127.0.0.1:8000/api/dropdowns/${item.type}/`)
            if (!res.ok) throw new Error()
            const json = await res.json()
            const fetched = json.map(d => d.name)
            return { key: item.key, options: Array.from(new Set([...(COMMON_DROPDOWNS[item.key] || []), ...fetched])) }
          } catch (e) {
            return { key: item.key, options: COMMON_DROPDOWNS[item.key] || [] }
          }
        })

        const ddResults = await Promise.all(dropdownPromises)
        const ddObj = {}
        ddResults.forEach(r => { ddObj[r.key] = r.options })

        // Fetch Treatment Master
        try {
          const resT = await fetch('http://127.0.0.1:8000/api/treatment-master/list/')
          const jsonT = await resT.json()
          ddObj['treatments_master'] = jsonT
        } catch (e) { }

        // Fetch Lab Test Master for Investigations
        try {
          const resL = await fetch('http://127.0.0.1:8000/api/settings/lab-tests/')
          const jsonL = await resL.json()
          const labNames = jsonL.map(l => l.name)
          ddObj['investigations'] = Array.from(new Set([...(ddObj['investigations'] || []), ...labNames]))
        } catch (e) { }

        setDropdowns(d => ({ ...d, ...ddObj }))

      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [appointmentId])

  const handlePayOldBalance = async () => {
    if (!payOldAmount || !profile) return
    setPayingOld(true)
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/bill/create-advanced/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: profile.id,
          visit: data.visit_id,
          total_amount: 0,
          paid_amount: parseFloat(payOldAmount),
          payment_method: 'Cash',
          items: [{ name: 'Balance Payment (During Notes)', quantity: 1, unit_price: 0 }],
          notes: 'Paid during clinical notes'
        })
      })
      if (res.ok) {
        setPayOldAmount('')
        // Refresh profile
        const pRes = await fetch(`http://127.0.0.1:8000/api/patient/${profile.id}/profile/`)
        setProfile(await pRes.json())
        alert('Balance payment recorded!')
      }
    } catch (e) { console.error(e) }
    setPayingOld(false)
  }

  function toggleTooth(num) {
    if (data.selected_teeth.includes(num)) {
      setData({ ...data, selected_teeth: data.selected_teeth.filter(t => t !== num) })
    } else {
      setData({ ...data, selected_teeth: [...data.selected_teeth, num] })
    }
  }

  function selectAllPermanent(checked) {
    const perm = [
      18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
      48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
    ]
    if (checked) {
      setData({ ...data, selected_teeth: Array.from(new Set([...data.selected_teeth, ...perm])) })
    } else {
      setData({ ...data, selected_teeth: data.selected_teeth.filter(t => !perm.includes(t)) })
    }
  }

  function selectAllPrimary(checked) {
    const primary = [
      55, 54, 53, 52, 51, 61, 62, 63, 64, 65,
      85, 84, 83, 82, 81, 71, 72, 73, 74, 75
    ]
    if (checked) {
      setData({ ...data, selected_teeth: Array.from(new Set([...data.selected_teeth, ...primary])) })
    } else {
      setData({ ...data, selected_teeth: data.selected_teeth.filter(t => !primary.includes(t)) })
    }
  }

  function toggleList(field, value) {
    if (!value) return
    const list = data[field]
    if (list.includes(value)) {
      setData({ ...data, [field]: list.filter(v => v !== value) })
    } else {
      setData({ ...data, [field]: [...list, value] })
    }
  }

  // Searchable Dropdown Helper Component
  function SearchableDropdown({ label, field, options, onAddCustom }) {
    const [query, setQuery] = useState('')
    const [show, setShow] = useState(false)
    const containerRef = useRef(null)

    const opts = options || []
    const filtered = opts.filter(o => o.toLowerCase().includes(query.toLowerCase()))

    return (
      <div className={styles.row}>
        <label>{label}</label>
        <div className={styles.fieldContainer} style={{ position: 'relative' }}>
          <div className={styles.tags} style={{ width: '100%' }}>
            {data[field].map(item => (
              <span key={item} className={styles.tag}>{item} <button onClick={() => toggleList(field, item)}>×</button></span>
            ))}
            <input
              type="text"
              placeholder={`Search or add ${label.toLowerCase()}...`}
              value={query}
              onChange={e => { setQuery(e.target.value); setShow(true) }}
              onFocus={() => setShow(true)}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, minWidth: 150 }}
              onKeyDown={e => {
                if (e.key === 'Enter' && query) {
                  toggleList(field, query)
                  setQuery('')
                }
              }}
            />
          </div>
          {show && (
            <div
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                background: '#1e293b', border: '1px solid #334155', borderRadius: 10, marginTop: 4,
                maxHeight: 250, overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '4px'
              }}
              onMouseLeave={() => setShow(false)}
            >
              {filtered.length > 0 ? filtered.map(o => (
                <div
                  key={o}
                  onClick={() => { toggleList(field, o); setQuery(''); setShow(false) }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: 8, fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0f4c81'; e.currentTarget.style.color = '#38bdf8' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e2e8f0' }}
                >
                  {o}
                </div>
              )) : query && (
                <div
                  onClick={() => { toggleList(field, query); setQuery(''); setShow(false) }}
                  style={{ padding: '12px', cursor: 'pointer', color: '#38bdf8', fontSize: 13, fontWeight: 700, textAlign: 'center', background: 'transparent' }}
                >
                  + Add "{query}" as custom
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  async function handleAddMedicineToMaster() {
    const name = prompt("Enter Medicine Name:")
    if (!name) return
    const dosage = prompt("Enter Dosage (optional):", "500mg")
    const frequency = prompt("Enter Frequency (optional):", "1-0-1")

    try {
      const res = await fetch('http://127.0.0.1:8000/api/medicine-master/list/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, dosage, frequency })
      })
      if (res.ok) {
        const newMed = await res.json()
        setDropdowns(d => ({ ...d, medicines: [...d.medicines, newMed].sort((a, b) => a.name.localeCompare(b.name)) }))
        alert("Medicine added to quick list!")
      }
    } catch (e) {
      alert("Error adding medicine")
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // 1. Save Clinical Notes (including ManyToMany treatments)
      const res = await fetch('http://127.0.0.1:8000/api/teeth/select/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: appointmentId,
          patient_id: patientId, // Used to auto-create appointment if null
          ...data,
          treatments: data.visit_treatments // Syncing with M2M field
        })
      })

      if (!res.ok) {
        const err = await res.json()
        console.error("Save Error:", err)
        throw new Error("Failed to save clinical notes")
      }
      const notesJson = await res.json()
      setData(prev => ({ ...prev, clinical_note_id: notesJson.id }))

      onClose()
    } catch (e) {
      console.error(e)
      alert("Error saving clinical details")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className={styles.overlay}>
      <div className={styles.loadingBox}>
        <div className={styles.spinner}></div>
        <p>Loading Clinical Records...</p>
      </div>
    </div>
  )

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <img src="https://www.w3schools.com/howto/img_avatar.png" className={styles.patAvatar} alt="patient" />
            <div>
              <h3>{patientName}</h3>
              <p>ID: {appointmentId} · Patient Dashboard</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </header>

        {/* Top Balance Bar */}
        {profile && parseFloat(profile.total_balance) > 0 && (
          <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: '4px 8px', background: '#fef3c7', borderRadius: 6, fontSize: 11, fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>Outstanding Balance</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#dc2626' }}>₹{parseFloat(profile.total_balance).toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="Pay Amt"
                value={payOldAmount}
                onChange={e => setPayOldAmount(e.target.value)}
                style={{ width: 100, padding: '6px 10px', borderRadius: 6, border: '1px solid #fcd34d', fontSize: 13 }}
              />
              <button
                onClick={handlePayOldBalance}
                disabled={payingOld || !payOldAmount}
                style={{ background: '#d97706', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
              >
                {payingOld ? '...' : '✓ Pay Now'}
              </button>
            </div>
          </div>
        )}

        <div className={styles.modalContent} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', height: '100%', overflow: 'hidden' }}>
          {/* Main Form Panel */}
          <div className={styles.body} style={{ borderRight: '1px solid #e2e8f0' }}>
            <div className={styles.formSection}>
              {!notesOnly && (
                <>
                  <div className={styles.row}>
                    <label>Teeth Selection</label>
                    <div className={styles.fieldContainer}>
                      <input
                        type="text"
                        className={styles.teethInput}
                        readOnly
                        placeholder="Click to select teeth..."
                        onClick={() => setShowTeethChart(true)}
                        value={data.selected_teeth.length > 0 ? `Tooth No: ${data.selected_teeth.join(', ')}` : ''}
                      />
                    </div>
                  </div>

                  <SearchableDropdown label="Complaints" field="complaints" options={dropdowns.complaints} />
                  <SearchableDropdown label="Observation" field="observations" options={dropdowns.observations} />
                  <SearchableDropdown label="Diagnosis" field="diagnosis" options={dropdowns.diagnosis} />
                  <SearchableDropdown label="Medical History" field="medical_history" options={dropdowns.medical_history} />
                  <SearchableDropdown label="Investigations" field="investigations" options={dropdowns.investigations} />
                </>
              )}

              <div className={styles.fullRow}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Notes</label>
                  <select
                    onChange={e => { if (e.target.value) setData(prev => ({ ...prev, notes: (prev.notes ? prev.notes + '\n' : '') + e.target.value })) }}
                    style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border-light)', cursor: 'pointer' }}
                  >
                    <option value="">+ Add Note Template</option>
                    {COMMON_DROPDOWNS.note_templates.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className={styles.editorBox}>
                  <textarea value={data.notes} onChange={e => setData({ ...data, notes: e.target.value })} placeholder="Type here or use templates above..." style={{ width: '100%', minHeight: '80px', border: 'none', resize: 'vertical' }} />
                </div>
              </div>

              {!notesOnly && (
                <>
                  <div className={styles.fullRow}>
                    <label>Treatment Plan / Future Recommendations</label>
                    <textarea value={data.treatment_plan} onChange={e => setData({ ...data, treatment_plan: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '60px' }} placeholder="Type plan here..." />
                  </div>

                  <div className={styles.row}>
                    <label>Follow-up Date</label>
                    <div className={styles.fieldContainer}>
                      <input
                        type="date"
                        className={styles.select}
                        value={data.follow_up_date}
                        onChange={e => setData({ ...data, follow_up_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className={styles.fullRow}>
                    <label>Follow-up Note</label>
                    <textarea
                      value={data.follow_up_note}
                      onChange={e => setData({ ...data, follow_up_note: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '60px' }}
                      placeholder="Instructions for next visit..."
                    />
                  </div>
                </>
              )}

              {/* Old Balance Section (Secondary) */}
              {profile && parseFloat(profile.total_balance) > 0 && (
                <div style={{ marginTop: 24, padding: 16, background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 12, display: 'none' }}>
                  {/* Hidden because it's now at the top */}
                </div>
              )}
            </div>
          </div>

          {/* Right History Panel */}
          <div className={styles.historyPanel}>
            <div className={styles.historyHeader}>
              <div className={styles.historyIcon}>🕒</div>
              <h4 style={{ margin: 0 }}>Clinical History</h4>
            </div>

            <div className={styles.historyTabs}>
              {['notes', 'rx', 'treatments'].map(t => (
                <button
                  key={t}
                  onClick={() => setHistoryTab(t)}
                  className={`${styles.historyTabBtn} ${historyTab === t ? styles.historyTabActive : ''}`}
                >
                  {t === 'notes' ? '📝 Notes' : t === 'rx' ? '💊 Rx' : '🦷 Tx'}
                </button>
              ))}
            </div>

            {/* Date Filter & Latest Only Toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={historyDateFilter}
                onChange={e => { setHistoryDateFilter(e.target.value); setShowLatestOnly(false) }}
                style={{
                  flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid #334155',
                  background: '#1e293b', color: '#e2e8f0', fontSize: 12, fontWeight: 600
                }}
                title="Filter by date"
              />
              {historyDateFilter && (
                <button
                  onClick={() => setHistoryDateFilter('')}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >✕ Clear</button>
              )}
              <button
                onClick={() => { setShowLatestOnly(v => !v); setHistoryDateFilter('') }}
                style={{
                  background: showLatestOnly ? '#0ea5e9' : '#334155',
                  color: '#fff', border: 'none', borderRadius: 6,
                  padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {showLatestOnly ? '✓ Last Visit' : 'Last Visit Only'}
              </button>
            </div>

            <div className={styles.historyContent}>
              {loadingProfile ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Loading...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {historyTab === 'notes' && (() => {
                    const allNotes = [...(profile?.appointments || [])]
                      .filter(a => a.clinical_notes)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))

                    let filtered = allNotes
                    if (historyDateFilter) {
                      filtered = allNotes.filter(a => {
                        const d = new Date(a.date)
                        const fd = new Date(historyDateFilter)
                        return d.getFullYear() === fd.getFullYear() && d.getMonth() === fd.getMonth() && d.getDate() === fd.getDate()
                      })
                    } else if (showLatestOnly) {
                      filtered = allNotes.slice(0, 1)
                    }

                    if (filtered.length === 0) return (
                      <div className={styles.emptyHistory}>
                        {historyDateFilter ? `No notes found for ${new Date(historyDateFilter).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.` : 'No clinical notes recorded yet.'}
                      </div>
                    )
                    return filtered.map(a => (
                      <div key={a.id} className={styles.historyCard}>
                        <div className={styles.historyCardHeader}>
                          <span className={styles.historyDate}>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className={styles.historyDoctor}>{a.doctor_name}</span>
                        </div>
                        <div className={styles.historyDiagnosis}>{a.clinical_notes.diagnosis?.join(', ') || 'General Checkup'}</div>

                        {a.clinical_notes.complaints?.length > 0 && (
                          <div className={styles.historySubText}><strong>Complaints:</strong> {a.clinical_notes.complaints.join(', ')}</div>
                        )}
                        {a.clinical_notes.observations?.length > 0 && (
                          <div className={styles.historySubText}><strong>Observations:</strong> {a.clinical_notes.observations.join(', ')}</div>
                        )}
                        {a.clinical_notes.investigations?.length > 0 && (
                          <div className={styles.historySubText}><strong>Investigations:</strong> {a.clinical_notes.investigations.join(', ')}</div>
                        )}
                        {a.clinical_notes.medical_history?.length > 0 && (
                          <div className={styles.historySubText} style={{color: '#dc2626'}}><strong>Medical History:</strong> {a.clinical_notes.medical_history.join(', ')}</div>
                        )}
                        {a.clinical_notes.selected_teeth?.length > 0 && (
                          <div className={styles.historyTeeth}>Teeth: {a.clinical_notes.selected_teeth.join(', ')}</div>
                        )}
                        {a.clinical_notes.treatment_plan && (
                          <div className={styles.historySubText}><strong>Plan:</strong> {a.clinical_notes.treatment_plan}</div>
                        )}
                        {a.clinical_notes.notes && (
                          <div className={styles.historyNotes}>"{a.clinical_notes.notes}"</div>
                        )}
                        {a.clinical_notes.follow_up_date && (
                          <div className={styles.historySubText} style={{color: '#ea580c'}}><strong>Follow-up:</strong> {new Date(a.clinical_notes.follow_up_date).toLocaleDateString()} {a.clinical_notes.follow_up_note ? `- ${a.clinical_notes.follow_up_note}` : ''}</div>
                        )}
                        {a.visit?.treatment_records?.length > 0 && (
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #334155' }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Treatments</div>
                            {a.visit.treatment_records.map((tr, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, background: 'rgba(15,118,110,0.1)', padding: '4px 6px', borderRadius: '4px', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 700, color: '#0f766e' }}>{tr.treatment_name || 'Treatment'}</span>
                                <span style={{ fontWeight: 800, color: '#0f766e' }}>₹{tr.price}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  })()}

                  {historyTab === 'rx' && (() => {
                    const allRx = [...(profile?.prescriptions || [])]
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

                    let filtered = allRx
                    if (historyDateFilter) {
                      filtered = allRx.filter(p => {
                        const d = new Date(p.created_at)
                        const fd = new Date(historyDateFilter)
                        return d.getFullYear() === fd.getFullYear() && d.getMonth() === fd.getMonth() && d.getDate() === fd.getDate()
                      })
                    } else if (showLatestOnly) {
                      filtered = allRx.slice(0, 1)
                    }

                    if (filtered.length === 0) return (
                      <div className={styles.emptyHistory}>
                        {historyDateFilter ? `No prescriptions on ${new Date(historyDateFilter).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.` : 'No prescriptions found.'}
                      </div>
                    )
                    return filtered.map(p => (
                      <div key={p.id} className={styles.historyCard} style={{ borderLeftColor: '#7c3aed' }}>
                        <div className={styles.historyCardHeader}>
                          <span className={styles.historyDate} style={{ color: '#7c3aed' }}>{new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className={styles.historyRxList}>
                          {(p.items || []).map((it, i) => (
                            <div key={i} className={styles.historyRxItem}>
                              <span className={styles.historyRxName}>{it.medicine_name || it.name}</span>
                              <span className={styles.historyRxDose}>{it.dosage} · {it.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}

                  {historyTab === 'treatments' && (() => {
                    // Collect treatment records from appointments' visits
                    const allTx = []
                    ;(profile?.appointments || []).forEach(a => {
                      if (a.visit?.treatment_records?.length > 0) {
                        allTx.push({ date: a.date, records: a.visit.treatment_records })
                      }
                    })
                    allTx.sort((a, b) => new Date(b.date) - new Date(a.date))

                    let filtered = allTx
                    if (historyDateFilter) {
                      filtered = allTx.filter(tx => {
                        const d = new Date(tx.date)
                        const fd = new Date(historyDateFilter)
                        return d.getFullYear() === fd.getFullYear() && d.getMonth() === fd.getMonth() && d.getDate() === fd.getDate()
                      })
                    } else if (showLatestOnly) {
                      filtered = allTx.slice(0, 1)
                    }

                    if (filtered.length === 0) return (
                      <div className={styles.emptyHistory}>
                        {historyDateFilter ? `No treatments on ${new Date(historyDateFilter).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.` : 'No treatment history found.'}
                      </div>
                    )
                    return filtered.map((tx, gi) => (
                      <div key={gi} className={styles.historyCard} style={{ borderLeftColor: '#0891b2' }}>
                        <div className={styles.historyCardHeader}>
                          <span className={styles.historyDate} style={{ color: '#0891b2' }}>{new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className={styles.historyTxList}>
                          {tx.records.map((tr, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px dashed #334155' }}>
                              <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>• {tr.treatment_name || 'Treatment'}</span>
                              <span style={{ fontWeight: 800, color: '#0891b2' }}>₹{tr.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className={styles.footer} style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={() => printClinicalNotes({ patientName, patientId, appointmentId, data })}
            style={{
              background: 'transparent', color: '#0ea5e9', border: '1px solid #0ea5e9',
              padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
              fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            🖨️ Print Notes
          </button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>Save</button>
        </footer>

        {showTeethChart && (
          <ToothChartUIKit
            selectedTeeth={data.selected_teeth}
            onSelectionChange={(updated) => setData({ ...data, selected_teeth: updated })}
            onClose={() => setShowTeethChart(false)}
          />
        )}
      </div>
    </div>
  )
}
