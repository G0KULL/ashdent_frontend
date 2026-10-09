import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import styles from './ConsultationPage.module.css';
import ToothChartUIKit from './ToothChartUIKit';

const API_BASE = 'http://127.0.0.1:8000/api';

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
  return { 
    'Content-Type': 'application/json', 
    'X-User-Id': user.id || '', 
    'X-Username': user.username || '' 
  };
}

export default function ConsultationPage() {
  const { appointmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialApptData = location.state || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apptInfo, setApptInfo] = useState(initialApptData);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('Overview');

  // Case Case Details
  const [caseDetails, setCaseDetails] = useState({
    caseNumber: '',
    visitNumber: 1,
    createdDate: '',
    consultingDoctor: '',
    status: 'In Progress',
    estimatedCompletion: '',
    progress: 30
  });

  // Last Saved Status
  const [saveStatus, setSaveStatus] = useState('Saved just now');
  const [lastSavedTime, setLastSavedTime] = useState(new Date().toLocaleTimeString());

  // Form States corresponding to tabs
  const [chiefComplaint, setChiefComplaint] = useState({ complaints: [], description: '', painScale: 5 });
  const [medicalHistory, setMedicalHistory] = useState({ conditions: [], currentMedication: '', drugAllergy: '', previousSurgery: '', vitals: { bp: '', pulse: '', temp: '', weight: '', height: '' }, emergencyContact: '', doctorNotes: '', advices: '' });
  const [dentalChart, setDentalChart] = useState({ dentition: 'Permanent', selectedTooth: null });
  const [treatmentPlan, setTreatmentPlan] = useState([{ id: 1, tooth: '36', procedure: 'Root Canal Treatment', priority: 'High', cost: 4500, doctor: 'Dr. Harshad', status: 'Planned', insurance: 'Not Covered', remarks: '' }]);
  const [todaysVisit, setTodaysVisit] = useState({ visitDate: new Date().toISOString().split('T')[0], chairNumber: 'Chair 1', assistant: '', procedureDone: '', localAnesthesia: '', clinicalFindings: '', procedureNotes: '', complications: '', nextVisitAdvice: '', chairTime: '', procedureDuration: '' });
  const [prescriptions, setPrescriptions] = useState([{ id: 1, medicine: 'Amoxicillin 500mg', strength: '500mg', frequency: 'Three times a day', duration: '5 Days', morning: true, afternoon: true, night: true, foodRelation: 'After Food', notes: '' }]);
  const [investigations, setInvestigations] = useState({ type: 'RVG', uploadedFiles: [] });
  const [clinicalNotes, setClinicalNotes] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [files, setFiles] = useState([]);
  const [billingSummary, setBillingSummary] = useState({ treatmentCharges: 5700, discount: 500, tax: 936, paid: 1000, pending: 5136 });
  const [followUp, setFollowUp] = useState({ nextVisitDate: '', appointmentTime: '10:00', instructions: '', sms: true, whatsapp: true, email: false });

  // Load patient
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let currentPatientId = apptInfo.patientId;
        if (!apptInfo.patientName && appointmentId) {
          const res = await fetch(`${API_BASE}/appointments/all/`, { headers: getHeaders() });
          if (res.ok) {
            const list = await res.json();
            const found = list.find(a => String(a.id) === String(appointmentId));
            if (found) {
              setApptInfo({
                appointmentId: found.id, patientId: found.patient, patientName: found.patient_name,
                patientPhone: found.patient_phone, patientAge: found.patient_age, patientGender: found.patient_gender,
                doctorName: found.doctor_name, appointmentDate: found.date, appointmentTime: found.time_formatted || found.time,
              });
              currentPatientId = found.patient;
            }
          }
        }

        const defaultCase = {
          caseNumber: `CS-${currentPatientId || '101'}-${Date.now().toString().slice(-4)}`,
          visitNumber: 1,
          createdDate: new Date().toISOString().split('T')[0],
          consultingDoctor: apptInfo.doctorName || 'Dr. Assigned',
          status: 'In Progress',
          estimatedCompletion: '2026-08-01',
          progress: 30
        };

        setCaseDetails(defaultCase);
      } catch (err) {
        console.error("Error loading workspace", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [appointmentId, location.state]);

  const handleSaveWorkspace = async () => {
    setSaving(true);
    setSaveStatus('Saving...');
    setTimeout(() => {
      setSaving(false);
      setLastSavedTime(new Date().toLocaleTimeString());
      setSaveStatus('Saved draft');
    }, 1000);
  };

  const handleCompleteVisit = () => {
    alert('Visit Completed successfully!');
    navigate(-1);
  };

  if (loading) {
    return <div className={styles.layout} style={{ justifyContent: 'center', alignItems: 'center' }}>Loading Workspace...</div>;
  }

  return (
    <div className={styles.layout}>
      {/* LEFT SIDEBAR */}
      <aside className={styles.leftSidebar}>
        <div className={styles.logoArea}>DentalHMS</div>
        <div className={styles.menuList}>
          {['Dashboard', 'Appointments', 'Patients', 'Treatment Cases', 'Prescriptions', 'Billing', 'Reports', 'Inventory', 'Messages', 'Settings'].map(menu => (
            <button key={menu} className={`${styles.menuItem} ${menu === 'Treatment Cases' ? styles.active : ''}`}>
              <span>{menu === 'Dashboard' ? '📊' : menu === 'Appointments' ? '📅' : menu === 'Patients' ? '👥' : menu === 'Treatment Cases' ? '🩻' : '📁'}</span>
              {menu}
            </button>
          ))}
        </div>
        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarCard}>
            <h4>Today's Appointments</h4>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>12 Scheduled</div>
          </div>
          <div className={styles.sidebarCard}>
            <h4>Upcoming Follow-ups</h4>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>5 Pending</div>
          </div>
          <button className={styles.menuItem} style={{ color: '#ef4444' }}><span>🚪</span>Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={styles.mainContent}>
        
        {/* TOP HEADER */}
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <input type="text" className={styles.searchInput} placeholder="Search patients, cases..." />
          </div>
          <div className={styles.headerRight}>
            <button className={styles.btnSecondary}>Quick Add +</button>
            <button className={styles.btnSecondary}>🔔</button>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#14b8a6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Dr</div>
          </div>
        </header>

        {/* PATIENT HEADER CARD */}
        <div className={styles.patientHeader}>
          <div className={styles.patientProfileInfo}>
            <div className={styles.patientAvatar}>
              {apptInfo.patientName ? apptInfo.patientName.substring(0, 2).toUpperCase() : 'PT'}
            </div>
            <div className={styles.patientDetails}>
              <h1>{apptInfo.patientName || 'Harshad'}</h1>
              <div className={styles.patientMeta}>
                <span>Age: <strong>{apptInfo.patientAge || '32'}</strong></span>
                <span>Gender: <strong>{apptInfo.patientGender || 'Male'}</strong></span>
                <span>UHID: <strong>#{apptInfo.patientId || '101'}</strong></span>
                <span>Phone: <strong>{apptInfo.patientPhone || '9876543210'}</strong></span>
                <span>Blood: <strong>B+</strong></span>
              </div>
              <div className={styles.badges}>
                <span className={`${styles.badge} ${styles.badgeAlert}`}>Allergy: Penicillin</span>
                <span className={`${styles.badge} ${styles.badgeCase}`}>Active Case</span>
                <span className={`${styles.badge} ${styles.badgeBalance}`}>Balance: ₹{billingSummary.pending}</span>
              </div>
            </div>
          </div>
          <div className={styles.patientActions}>
            <div style={{ textAlign: 'right', marginRight: '16px', fontSize: '12px' }}>
              <div style={{ color: 'var(--text-muted)' }}>Next Appt</div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>24 Aug 2026</div>
            </div>
            <button className={styles.btnSecondary}>Patient Profile</button>
            <button className={styles.btnSecondary}>Change Case</button>
          </div>
        </div>

        {/* CASE HEADER */}
        <div className={styles.caseHeader}>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Case</span>
              <div className={styles.caseTitle}>Root Canal Treatment (Tooth 36)</div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Case ID</span>
              <div style={{ fontWeight: '600' }}>{caseDetails.caseNumber}</div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
              <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{caseDetails.status}</div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Started</span>
              <div style={{ fontWeight: '600' }}>{caseDetails.createdDate}</div>
            </div>
          </div>
          <div style={{ width: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span>Progress</span>
              <span>{caseDetails.progress}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${caseDetails.progress}%`, background: 'var(--primary)' }}></div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className={styles.tabsContainer}>
          {['Overview', 'Medical History', 'Dental Chart', 'Treatment Plan', 'Today\'s Visit', 'Prescription', 'Investigations', 'Clinical Notes', 'Files', 'Billing', 'Follow-up'].map(tab => (
            <button 
              key={tab} 
              className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* WORKSPACE SPLIT */}
        <div className={styles.workspaceSplit}>
          
          <div className={styles.tabContentScroll}>
            
            {activeTab === 'Overview' && (
              <div className={styles.card}>
                <h2>Case Overview</h2>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}><label>Chief Complaint</label><div style={{ fontWeight: '600' }}>{chiefComplaint.complaints.join(', ') || 'Severe pain in lower left back tooth'}</div></div>
                  <div className={styles.formGroup}><label>Diagnosis</label><div style={{ fontWeight: '600' }}>Irreversible Pulpitis w/ Apical Periodontitis</div></div>
                  <div className={styles.formGroup}><label>Next Procedure</label><div style={{ fontWeight: '600' }}>BMP & Obturation</div></div>
                  <div className={styles.formGroup}><label>Pain Score</label><div style={{ fontWeight: '600', color: 'var(--danger)' }}>{chiefComplaint.painScale} / 10</div></div>
                </div>
              </div>
            )}

            {activeTab === 'Medical History' && (
              <div className={styles.card}>
                <h2>Medical History & Vitals</h2>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.colFull}`}>
                    <label>Medical Conditions</label>
                    <div className={styles.checkboxGroup}>
                      {['Diabetes', 'Hypertension', 'Pregnancy', 'Asthma'].map(c => (
                        <label key={c} className={styles.checkboxItem}><input type="checkbox" /> {c}</label>
                      ))}
                    </div>
                  </div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}>
                    <label>Habits</label>
                    <div className={styles.checkboxGroup}>
                      {['Smoking', 'Alcohol', 'Tobacco'].map(c => (
                        <label key={c} className={styles.checkboxItem}><input type="checkbox" /> {c}</label>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formGroup}><label>Current Medications</label><input type="text" className={styles.input} /></div>
                  <div className={styles.formGroup}><label>Allergies</label><input type="text" className={styles.input} /></div>
                  <div className={styles.formGroup}><label>Past Surgery</label><input type="text" className={styles.input} /></div>
                  <div className={styles.formGroup}><label>Emergency Contact</label><input type="text" className={styles.input} /></div>
                  
                  <div className={`${styles.formGroup} ${styles.colFull}`}>
                    <label>Vitals</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                      <input type="text" className={styles.input} placeholder="BP (mmHg)" />
                      <input type="text" className={styles.input} placeholder="Pulse (bpm)" />
                      <input type="text" className={styles.input} placeholder="Temp (°F)" />
                      <input type="text" className={styles.input} placeholder="Weight (kg)" />
                      <input type="text" className={styles.input} placeholder="Height (cm)" />
                    </div>
                  </div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}><label>Doctor Notes</label><textarea className={styles.textarea} value={medicalHistory.doctorNotes} onChange={(e) => setMedicalHistory({...medicalHistory, doctorNotes: e.target.value})} /></div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}><label>Advices</label><textarea className={styles.textarea} placeholder="General medical advices..." value={medicalHistory.advices} onChange={(e) => setMedicalHistory({...medicalHistory, advices: e.target.value})} /></div>
                </div>
              </div>
            )}

            {activeTab === 'Dental Chart' && (
              <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2>FDI Dental Chart</h2>
                  <select className={styles.select} value={dentalChart.dentition} onChange={e => setDentalChart({...dentalChart, dentition: e.target.value})}>
                    <option>Permanent Dentition</option>
                    <option>Primary Dentition</option>
                    <option>Mixed Dentition</option>
                  </select>
                </div>
                <div className={styles.dentalChartWrapper}>
                  <div className={styles.chartContainer}>
                    <ToothChartUIKit />
                  </div>
                  <div className={styles.toothDetailPanel}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>Tooth Details</h3>
                    <div className={styles.formGroup}>
                      <label>Tooth Number</label>
                      <input type="text" className={styles.input} value="36" readOnly />
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: '12px' }}>
                      <label>Condition</label>
                      <select className={styles.select}>
                        <option>Healthy</option>
                        <option>Caries</option>
                        <option>Restoration</option>
                        <option>Root Canal</option>
                        <option>Crown</option>
                        <option>Extraction Planned</option>
                        <option>Missing Tooth</option>
                        <option>Implant</option>
                      </select>
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: '12px' }}>
                      <label>Surfaces</label>
                      <div className={styles.checkboxGroup} style={{ gap: '8px' }}>
                        {['O', 'M', 'D', 'B', 'L', 'P'].map(s => (
                          <label key={s} className={styles.checkboxItem}><input type="checkbox" /> {s}</label>
                        ))}
                      </div>
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: '12px' }}>
                      <label>Clinical Notes</label>
                      <textarea className={styles.textarea} style={{ minHeight: '60px' }}></textarea>
                    </div>
                    <button className={styles.btnPrimary} style={{ width: '100%', marginTop: '16px' }}>Save Condition</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Treatment Plan' && (
              <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2>Proposed Treatment Plan</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className={styles.btnSecondary}>Add Procedure</button>
                    <button className={styles.btnSecondary}>Print Estimate</button>
                    <button className={styles.btnPrimary}>Approve Plan</button>
                  </div>
                </div>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Tooth</th>
                      <th>Procedure</th>
                      <th>Priority</th>
                      <th>Doctor</th>
                      <th>Status</th>
                      <th>Est. Cost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treatmentPlan.map(plan => (
                      <tr key={plan.id}>
                        <td>{plan.tooth}</td>
                        <td style={{ fontWeight: '600' }}>{plan.procedure}</td>
                        <td><span style={{ padding: '2px 8px', borderRadius: '12px', background: '#FEE2E2', color: '#DC2626', fontSize: '11px', fontWeight: 'bold' }}>{plan.priority}</span></td>
                        <td>{plan.doctor}</td>
                        <td>{plan.status}</td>
                        <td>₹{plan.cost}</td>
                        <td>
                          <button style={{ border: 'none', background: 'transparent', color: 'var(--secondary)', cursor: 'pointer', marginRight: '8px' }}>Edit</button>
                          <button style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'Today\'s Visit' && (
              <div className={styles.card}>
                <h2>Today's Visit Details</h2>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}><label>Visit Date</label><input type="date" className={styles.input} value={todaysVisit.visitDate} readOnly /></div>
                  <div className={styles.formGroup}><label>Chair Number</label><input type="text" className={styles.input} value={todaysVisit.chairNumber} /></div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}><label>Procedure Done Today</label><input type="text" className={styles.input} /></div>
                  <div className={styles.formGroup}><label>Local Anesthesia</label><input type="text" className={styles.input} /></div>
                  <div className={styles.formGroup}><label>Complications</label><input type="text" className={styles.input} /></div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}><label>Clinical Findings</label><textarea className={styles.textarea} /></div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}><label>Procedure Notes</label><textarea className={styles.textarea} /></div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}><label>Next Visit Advice</label><textarea className={styles.textarea} /></div>
                </div>
              </div>
            )}

            {activeTab === 'Prescription' && (
              <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2>Prescription (Rx)</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className={styles.btnSecondary}>Add Medicine</button>
                    <button className={styles.btnPrimary}>Print Rx</button>
                  </div>
                </div>
                {prescriptions.map(rx => (
                  <div key={rx.id} className={styles.prescriptionRow}>
                    <div className={styles.formGroup}><label>Medicine</label><input type="text" className={styles.input} value={rx.medicine} /></div>
                    <div className={styles.formGroup}><label>Frequency</label><input type="text" className={styles.input} value={rx.frequency} /></div>
                    <div className={styles.formGroup}><label>Duration</label><input type="text" className={styles.input} value={rx.duration} /></div>
                    <div className={styles.formGroup}>
                      <label>Timings</label>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                        <span style={{ padding: '4px 8px', background: 'white', borderRadius: '4px', fontSize: '11px', border: '1px solid var(--border-light)' }}>M</span>
                        <span style={{ padding: '4px 8px', background: 'white', borderRadius: '4px', fontSize: '11px', border: '1px solid var(--border-light)' }}>A</span>
                        <span style={{ padding: '4px 8px', background: 'white', borderRadius: '4px', fontSize: '11px', border: '1px solid var(--border-light)' }}>N</span>
                      </div>
                    </div>
                    <div className={styles.formGroup}><label>Instructions</label><input type="text" className={styles.input} value={rx.foodRelation} /></div>
                    <div className={styles.formGroup}><label>&nbsp;</label><button style={{ padding: '10px', background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-btn)', color: 'var(--danger)', cursor: 'pointer' }}>🗑</button></div>
                  </div>
                ))}
                
                <div style={{ marginTop: '24px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px', display: 'block' }}>Advices / Instructions</label>
                  <textarea 
                    className={styles.textarea} 
                    placeholder="General advices (diet, rest, etc.)..."
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'Investigations' && (
              <div className={styles.card}>
                <h2>Investigations & Imaging</h2>
                <div style={{ border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-card)', padding: '40px', textAlign: 'center', background: 'var(--bg-hover)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📸</div>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>Drag and Drop X-Rays / Reports here</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Supported: IOPA, RVG, OPG, CBCT, PDF</div>
                  <button className={styles.btnSecondary}>Browse Files</button>
                </div>
              </div>
            )}

            {activeTab === 'Clinical Notes' && (
              <div className={styles.card}>
                <h2>SOAP Notes</h2>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.colFull}`}><label>Subjective (Patient's complaints)</label><textarea className={styles.textarea} /></div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}><label>Objective (Clinical findings)</label><textarea className={styles.textarea} /></div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}><label>Assessment (Diagnosis)</label><textarea className={styles.textarea} /></div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}><label>Plan (Treatment plan)</label><textarea className={styles.textarea} /></div>
                </div>
              </div>
            )}

            {activeTab === 'Files' && (
              <div className={styles.card}>
                <h2>Files & Consents</h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ width: '200px', height: '150px', background: 'var(--bg-hover)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Files Uploaded</div>
                </div>
              </div>
            )}

            {activeTab === 'Billing' && (
              <div className={styles.card}>
                <h2>Billing & Payments</h2>
                <table className={styles.dataTable} style={{ marginBottom: '24px' }}>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Discount</th>
                      <th>Tax</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Root Canal Treatment (36)</td>
                      <td>₹4500</td>
                      <td>₹500</td>
                      <td>₹720</td>
                      <td>₹4720</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '300px' }}>
                    <div className={styles.statRow}><span>Total Charges</span><span>₹{billingSummary.treatmentCharges}</span></div>
                    <div className={styles.statRow}><span>Discount</span><span style={{ color: 'var(--danger)' }}>-₹{billingSummary.discount}</span></div>
                    <div className={styles.statRow}><span>Tax</span><span>+₹{billingSummary.tax}</span></div>
                    <div className={styles.statRow}><span>Amount Paid</span><span style={{ color: 'var(--emerald)' }}>-₹{billingSummary.paid}</span></div>
                    <div className={`${styles.statRow} ${styles.total}`}><span>Outstanding Balance</span><span style={{ color: 'var(--danger)' }}>₹{billingSummary.pending}</span></div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button className={styles.btnSecondary}>Add Payment</button>
                  <button className={styles.btnPrimary}>Generate Invoice</button>
                </div>
              </div>
            )}

            {activeTab === 'Follow-up' && (
              <div className={styles.card}>
                <h2>Next Visit Follow-up</h2>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}><label>Next Visit Date</label><input type="date" className={styles.input} /></div>
                  <div className={styles.formGroup}><label>Appointment Time</label><input type="time" className={styles.input} /></div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}><label>Instructions / Purpose</label><input type="text" className={styles.input} placeholder="e.g. For Crown preparation" /></div>
                  <div className={`${styles.formGroup} ${styles.colFull}`}>
                    <label>Reminders</label>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxItem}><input type="checkbox" defaultChecked /> SMS Reminder</label>
                      <label className={styles.checkboxItem}><input type="checkbox" defaultChecked /> WhatsApp Reminder</label>
                      <label className={styles.checkboxItem}><input type="checkbox" /> Email Reminder</label>
                    </div>
                  </div>
                  <div className={`${styles.formGroup} ${styles.colFull}`} style={{ marginTop: '12px' }}>
                    <button className={styles.btnPrimary} style={{ width: 'max-content' }}>Book Appointment</button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT STICKY PANEL */}
          <aside className={styles.rightPanel}>
            <div className={styles.panelSection}>
              <h3>Case Summary</h3>
              <div className={styles.statRow}><span>Status</span><strong style={{ color: 'var(--primary)' }}>{caseDetails.status}</strong></div>
              <div className={styles.statRow}><span>Total Cost</span><strong>₹{billingSummary.treatmentCharges}</strong></div>
              <div className={styles.statRow}><span>Paid Amount</span><strong style={{ color: 'var(--emerald)' }}>₹{billingSummary.paid}</strong></div>
              <div className={styles.statRow}><span>Outstanding</span><strong style={{ color: 'var(--danger)' }}>₹{billingSummary.pending}</strong></div>
              <div className={styles.statRow}><span>Next Visit</span><strong>24 Aug 2026</strong></div>
            </div>

            <div className={styles.panelSection}>
              <h3>Quick Actions</h3>
              <button className={styles.quickActionBtn} onClick={() => setActiveTab('Prescription')}>💊 Write Prescription</button>
              <button className={styles.quickActionBtn} onClick={() => setActiveTab('Clinical Notes')}>📝 Add Clinical Note</button>
              <button className={styles.quickActionBtn} onClick={() => setActiveTab('Investigations')}>📸 Upload X-Ray</button>
              <button className={styles.quickActionBtn} onClick={() => setActiveTab('Billing')}>💵 Generate Invoice</button>
              <button className={styles.quickActionBtn} onClick={() => setActiveTab('Follow-up')}>📅 Book Follow-up</button>
            </div>
          </aside>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className={styles.bottomActionBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{saveStatus} at {lastSavedTime}</span>
          </div>
          <div className={styles.actionButtons}>
            <button className={styles.btnSecondary} onClick={() => navigate(-1)}>Cancel</button>
            <button className={styles.btnSecondary} onClick={handleSaveWorkspace}>{saving ? 'Saving...' : 'Save Draft'}</button>
            <button className={styles.btnPrimary} onClick={handleCompleteVisit}>Complete Visit</button>
          </div>
        </div>

      </main>
    </div>
  );
}
