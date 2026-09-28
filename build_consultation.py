import os

code = """import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import styles from './ConsultationPage.module.css';
import ToothChartUIKit from './ToothChartUIKit';

const API_BASE = 'http://127.0.0.1:8000/api';

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };
}

const COMMON_DROPDOWNS = {
  diagnosis: ['Irreversible Pulpitis', 'Reversible Pulpitis', 'Dental Caries', 'Pulp Necrosis', 'Gingivitis', 'Periodontitis'],
  medical_history: ['Diabetes', 'Hypertension', 'Asthma', 'Thyroid', 'Cardiac Issue', 'None'],
  dental_history: ['Previous RCT', 'Extraction', 'Orthodontic Treatment', 'None'],
  allergies: ['Penicillin', 'Sulfa Drugs', 'Latex', 'NSAIDs', 'Local Anesthesia', 'None'],
  note_templates: ['Patient advised to maintain better oral hygiene.', 'Symptomatic relief provided.', 'Prescribed medicines.']
};

function SearchableDropdown({ label, field, options, data, setData }) {
  const [query, setQuery] = useState('');
  const [show, setShow] = useState(false);

  const opts = options || [];
  const filtered = opts.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  const toggleList = (val) => {
    if (!val) return;
    const list = data[field] || [];
    if (list.includes(val)) {
      setData(prev => ({ ...prev, [field]: list.filter(v => v !== val) }));
    } else {
      setData(prev => ({ ...prev, [field]: [...list, val] }));
    }
  };

  return (
    <div className={styles.formGroup} style={{ position: 'relative' }}>
      <label className={styles.label}>{label}</label>
      <div className={styles.tags}>
        {(data[field] || []).map(item => (
          <span key={item} className={styles.tag}>
            {item} <button type="button" onClick={() => toggleList(item)}>×</button>
          </span>
        ))}
        <input
          type="text" placeholder={`Search or add ${label.toLowerCase()}...`}
          value={query} onChange={e => { setQuery(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, minWidth: 150 }}
          onKeyDown={e => { if (e.key === 'Enter' && query) { toggleList(query); setQuery(''); e.preventDefault(); } }}
        />
      </div>
      {show && (
        <div className={styles.searchDropdown} onMouseLeave={() => setShow(false)}>
          {filtered.length > 0 ? filtered.map(o => (
            <div key={o} onClick={() => { toggleList(o); setQuery(''); setShow(false); }} className={styles.dropdownItem}>{o}</div>
          )) : query && (
            <div onClick={() => { toggleList(query); setQuery(''); setShow(false); }} className={styles.dropdownItem} style={{ color: '#0ea5e9', fontWeight: 'bold' }}>+ Add "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConsultationPage() {
  const { appointmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialApptData = location.state || {};
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apptInfo, setApptInfo] = useState(initialApptData);
  const [activeTab, setActiveTab] = useState('Basic Details');

  const [clinicalData, setClinicalData] = useState({
    patient_type: 'Adult',
    chief_complaint: '',
    medical_history: [],
    dental_history: [],
    allergies: [],
    ongoing_medications: [],
    diagnosis: [],
    notes: '',
    selected_teeth: []
  });

  const [treatments, setTreatments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labWork, setLabWork] = useState({ workType: '', shade: '', surfaceFinish: '', frameworkType: '', impressionType: '', occlusion: '', material: '', vendor: '', expectedDeliveryDate: '', notes: '' });
  const [images, setImages] = useState([]); // Base64 images
  
  const [masters, setMasters] = useState({ treatmentsList: [], medicinesList: [] });
  const [caseStatus, setCaseStatus] = useState('In Progress');

  // Camera State
  const videoRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let currentPatientId = apptInfo.patientId;
        if (!apptInfo.patientName) {
          const today = new Date().toISOString().split('T')[0];
          const apptRes = await fetch(`${API_BASE}/appointments/all/?date=${today}`, { headers: getHeaders() });
          if (apptRes.ok) {
            const list = await apptRes.json();
            const found = list.find(a => String(a.id) === String(appointmentId));
            if (found) {
              setApptInfo({
                appointmentId: found.id, patientId: found.patient, patientName: found.patient_name,
                patientPhone: found.patient_phone, patientAge: found.patient_age, patientGender: found.patient_gender,
                doctorName: found.doctor_name, appointmentDate: found.date, appointmentTime: found.time_formatted || found.time,
                isNewCase: initialApptData.isNewCase || false
              });
              currentPatientId = found.patient;
            }
          }
        }

        const [txRes, medRes] = await Promise.all([
          fetch(`${API_BASE}/treatment-master/list/`, { headers: getHeaders() }).catch(() => null),
          fetch(`${API_BASE}/medicine-master/list/`, { headers: getHeaders() }).catch(() => null)
        ]);
        setMasters({
          treatmentsList: txRes && txRes.ok ? await txRes.json() : [],
          medicinesList: medRes && medRes.ok ? await medRes.json() : []
        });

        // Fetch Existing
        if (appointmentId && !initialApptData.isNewCase) {
          const notesRes = await fetch(`${API_BASE}/clinical-notes/${appointmentId}/`, { headers: getHeaders() });
          if (notesRes.ok) {
            const notes = await notesRes.json();
            if (notes.id) {
              setClinicalData(prev => ({
                ...prev,
                patient_type: notes.patient_type || 'Adult',
                chief_complaint: notes.chief_complaint || '',
                medical_history: notes.medical_history || [],
                dental_history: notes.dental_history || [],
                allergies: notes.allergies || [],
                ongoing_medications: notes.ongoing_medications || [],
                diagnosis: notes.diagnosis || [],
                notes: notes.notes || '',
                selected_teeth: notes.selected_teeth || []
              }));
            }
          }
        }
        
        // Fetch images if patient is known
        if (currentPatientId) {
            const imgRes = await fetch(`${API_BASE}/patient-images/?patient_id=${currentPatientId}`, { headers: getHeaders() });
            if (imgRes.ok) {
                setImages(await imgRes.json());
            }
        }

      } catch (err) {
        console.error("Error loading consultation data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [appointmentId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Notes
      const notesPayload = {
        appointment_id: appointmentId,
        patient_id: apptInfo.patientId,
        ...clinicalData
      };
      await fetch(`${API_BASE}/clinical-notes/save/`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(notesPayload) });

      // 2. Visit
      let visitId = null;
      const visitRes = await fetch(`${API_BASE}/visit/get-or-create/`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ patient_id: apptInfo.patientId }) });
      if (visitRes.ok) {
        visitId = (await visitRes.json()).id;
      }

      // 3. Treatments
      if (visitId && treatments.length > 0) {
        for (const tx of treatments) {
          if (tx.treatmentName) {
            await fetch(`${API_BASE}/treatment-record/add/`, {
              method: 'POST', headers: getHeaders(),
              body: JSON.stringify({ visit: visitId, treatment_name: tx.treatmentName, price: parseFloat(tx.cost) || 0, tooth_number: tx.toothNumber || null })
            });
          }
        }
      }

      // 4. Prescriptions
      if (prescriptions.length > 0 && prescriptions.some(p => p.medicineName)) {
        await fetch(`${API_BASE}/prescription/add/`, {
          method: 'POST', headers: getHeaders(),
          body: JSON.stringify({
            patient: apptInfo.patientId, appointment: appointmentId,
            items: prescriptions.filter(p => p.medicineName).map(p => ({
              medicine_name: p.medicineName, dosage: p.dosage, duration: p.duration
            }))
          })
        });
      }

      alert("Case Sheet Saved successfully!");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Error saving.");
    } finally {
      setSaving(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied or not available");
      setShowCamera(false);
    }
  };

  const captureCamera = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Stop stream
      const stream = videoRef.current.srcObject;
      if (stream) stream.getTracks().forEach(t => t.stop());
      setShowCamera(false);
      
      // Upload
      uploadImage(dataUrl, 'Camera');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => uploadImage(ev.target.result, 'RVG');
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (base64, type) => {
    try {
      const res = await fetch(`${API_BASE}/patient-images/`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ patient: apptInfo.patientId, visit: null, image_data: base64, image_type: type })
      });
      if (res.ok) {
        setImages([await res.json(), ...images]);
      }
    } catch(e) { console.error(e); }
  };

  const deleteImage = async (id) => {
    try {
        await fetch(`${API_BASE}/patient-images/${id}/`, { method: 'DELETE', headers: getHeaders() });
        setImages(images.filter(i => i.id !== id));
    } catch(e) { console.error(e); }
  }

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Loading Consultation...</div>;

  const tabs = ['Basic Details', 'Clinical Exam', 'Treatments', 'Prescriptions', 'Lab & Attachments'];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Start Consultation</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={caseStatus} onChange={e => setCaseStatus(e.target.value)} className={styles.select} style={{ width: '150px' }}>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : '💾 Save Case'}</button>
        </div>
      </header>

      <div className={styles.infoCard}>
        <div className={styles.patientProfile}>
          <div className={styles.avatar}>{apptInfo.patientName ? apptInfo.patientName.substring(0, 2).toUpperCase() : 'P'}</div>
          <div>
            <h2 className={styles.patientName}>{apptInfo.patientName}</h2>
            <div className={styles.patientDetails}>
              <span>{apptInfo.patientAge} yrs</span> • <span>{apptInfo.patientGender}</span> • <span>📞 {apptInfo.patientPhone}</span>
            </div>
          </div>
        </div>
        <div className={styles.appointmentInfo}>
          <h3 className={styles.appointmentDate}>Token: {appointmentId} | {new Date(apptInfo.appointmentDate).toLocaleDateString()}</h3>
          <span className={styles.doctorName}>👨‍⚕️ {apptInfo.doctorName}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
        {/* Sidebar Nav */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map(t => (
            <div 
              key={t} 
              onClick={() => setActiveTab(t)}
              style={{
                padding: '12px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                background: activeTab === t ? '#e0e7ff' : 'transparent',
                color: activeTab === t ? '#4f46e5' : '#475569',
                borderLeft: activeTab === t ? '4px solid #4f46e5' : '4px solid transparent'
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'Basic Details' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Medical & Dental History</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Patient Type</label>
                  <select className={styles.select} value={clinicalData.patient_type} onChange={e => setClinicalData({...clinicalData, patient_type: e.target.value})}>
                    <option value="Adult">Adult Dentition</option>
                    <option value="Pediatric">Pediatric (Primary)</option>
                    <option value="Mixed">Mixed Dentition</option>
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>Chief Complaint</label>
                  <input className={styles.input} value={clinicalData.chief_complaint} onChange={e => setClinicalData({...clinicalData, chief_complaint: e.target.value})} placeholder="E.g. Pain in lower right jaw..." />
                </div>
                <div className={styles.fullWidth}><SearchableDropdown label="Medical History" field="medical_history" options={COMMON_DROPDOWNS.medical_history} data={clinicalData} setData={setClinicalData} /></div>
                <div className={styles.fullWidth}><SearchableDropdown label="Dental History" field="dental_history" options={COMMON_DROPDOWNS.dental_history} data={clinicalData} setData={setClinicalData} /></div>
                <div className={styles.fullWidth}><SearchableDropdown label="Allergies" field="allergies" options={COMMON_DROPDOWNS.allergies} data={clinicalData} setData={setClinicalData} /></div>
                <div className={styles.fullWidth}>
                    <label className={styles.label}>Ongoing Medications</label>
                    <input className={styles.input} value={(clinicalData.ongoing_medications||[]).join(', ')} onChange={e => setClinicalData({...clinicalData, ongoing_medications: e.target.value.split(',').map(s=>s.trim())})} placeholder="Comma separated list..." />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Clinical Exam' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Examination</h3>
              <div className={styles.formGrid}>
                <div className={styles.fullWidth}><SearchableDropdown label="Diagnosis" field="diagnosis" options={COMMON_DROPDOWNS.diagnosis} data={clinicalData} setData={setClinicalData} /></div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>Clinical Notes / Remarks</label>
                  <textarea className={styles.textarea} value={clinicalData.notes} onChange={e => setClinicalData({...clinicalData, notes: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Treatments' && (
            <div className={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Tooth Selection & Treatments</h3>
                <button className={styles.btnOutline} onClick={() => setTreatments([...treatments, { id: Date.now(), toothNumber: clinicalData.selected_teeth[0] || '', treatmentName: '', cost: '' }])}>+ Add Treatment</button>
              </div>

              <div style={{ marginBottom: 24 }}>
                <ToothChartUIKit
                  selectedTeeth={clinicalData.selected_teeth}
                  onSelectionChange={(updated) => setClinicalData({ ...clinicalData, selected_teeth: updated })}
                  onClose={() => {}} // inline now
                />
              </div>

              {treatments.map((tx) => (
                <div key={tx.id} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                  <select className={styles.select} style={{ width: 120 }} value={tx.toothNumber} onChange={e => setTreatments(treatments.map(t => t.id === tx.id ? {...t, toothNumber: e.target.value} : t))}>
                    <option value="">General</option>
                    {clinicalData.selected_teeth.map(num => <option key={num} value={num}>Tooth {num}</option>)}
                  </select>
                  <input list="treatments-list" className={styles.input} style={{ flex: 1 }} placeholder="Treatment Name" value={tx.treatmentName} onChange={e => {
                    const val = e.target.value;
                    const found = masters.treatmentsList.find(m => m.name === val);
                    setTreatments(treatments.map(t => t.id === tx.id ? {...t, treatmentName: val, cost: found ? found.price : t.cost} : t));
                  }} />
                  <input type="number" className={styles.input} style={{ width: 100 }} placeholder="Cost" value={tx.cost} onChange={e => setTreatments(treatments.map(t => t.id === tx.id ? {...t, cost: e.target.value} : t))} />
                  <button type="button" className={styles.removeBtn} onClick={() => setTreatments(treatments.filter(t => t.id !== tx.id))}>×</button>
                </div>
              ))}
              <datalist id="treatments-list">{masters.treatmentsList.map(m => <option key={m.id} value={m.name} />)}</datalist>
            </div>
          )}

          {activeTab === 'Prescriptions' && (
            <div className={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Prescription Form</h3>
                <button className={styles.btnOutline} onClick={() => setPrescriptions([...prescriptions, { id: Date.now(), medicineName: '', dosage: '', duration: '', batch: '', qty: '' }])}>+ Add Medicine</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {prescriptions.map((rx) => (
                  <div key={rx.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input list="medicines-list" className={styles.input} style={{ flex: 2 }} placeholder="Medicine Name" value={rx.medicineName} onChange={e => setPrescriptions(prescriptions.map(p => p.id === rx.id ? {...p, medicineName: e.target.value} : p))} />
                    <input className={styles.input} style={{ flex: 1 }} placeholder="Dosage (e.g. 1-0-1)" value={rx.dosage} onChange={e => setPrescriptions(prescriptions.map(p => p.id === rx.id ? {...p, dosage: e.target.value} : p))} />
                    <select className={styles.select} style={{ flex: 1 }} onChange={e => setPrescriptions(prescriptions.map(p => p.id === rx.id ? {...p, dosage: p.dosage + ' ' + e.target.value} : p))}>
                        <option value="">Time</option>
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Night">Night</option>
                        <option value="SOS">SOS</option>
                    </select>
                    <input className={styles.input} style={{ width: 80 }} placeholder="Days" value={rx.duration} onChange={e => setPrescriptions(prescriptions.map(p => p.id === rx.id ? {...p, duration: e.target.value} : p))} />
                    <input className={styles.input} style={{ width: 80 }} placeholder="Qty" value={rx.qty} onChange={e => setPrescriptions(prescriptions.map(p => p.id === rx.id ? {...p, qty: e.target.value} : p))} />
                    <button type="button" className={styles.removeBtn} onClick={() => setPrescriptions(prescriptions.filter(p => p.id !== rx.id))}>×</button>
                  </div>
                ))}
              </div>
              <datalist id="medicines-list">{masters.medicinesList.map(m => <option key={m.id} value={m.name} />)}</datalist>
            </div>
          )}

          {activeTab === 'Lab & Attachments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Lab Order Form</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}><label className={styles.label}>Work Type</label><input className={styles.input} value={labWork.workType} onChange={e=>setLabWork({...labWork, workType: e.target.value})} placeholder="Crown, Bridge..." /></div>
                  <div className={styles.formGroup}><label className={styles.label}>Shade</label><input className={styles.input} value={labWork.shade} onChange={e=>setLabWork({...labWork, shade: e.target.value})} /></div>
                  <div className={styles.formGroup}><label className={styles.label}>Impression Type</label><input className={styles.input} value={labWork.impressionType} onChange={e=>setLabWork({...labWork, impressionType: e.target.value})} /></div>
                  <div className={styles.formGroup}><label className={styles.label}>Material</label><input className={styles.input} value={labWork.material} onChange={e=>setLabWork({...labWork, material: e.target.value})} /></div>
                  <div className={styles.formGroup}><label className={styles.label}>Expected Delivery Date</label><input type="date" className={styles.input} value={labWork.expectedDeliveryDate} onChange={e=>setLabWork({...labWork, expectedDeliveryDate: e.target.value})} /></div>
                  <div className={styles.formGroup}><label className={styles.label}>Vendor/Lab</label><input className={styles.input} value={labWork.vendor} onChange={e=>setLabWork({...labWork, vendor: e.target.value})} /></div>
                </div>
              </div>

              <div className={styles.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className={styles.sectionTitle}>Images & Records</h3>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label className={styles.btnOutline} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 12px' }}>
                        📁 Upload RVG <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleFileUpload} />
                    </label>
                    <button className={styles.btnOutline} onClick={startCamera}>📷 Camera</button>
                  </div>
                </div>
                
                {showCamera && (
                    <div style={{ marginTop: 16, background: '#000', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }}></video>
                        <button onClick={captureCamera} style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: 'white', border: 'none', padding: '8px 24px', borderRadius: 20, fontWeight: 'bold', cursor: 'pointer' }}>Capture Photo</button>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                    {images.map(img => (
                        <div key={img.id} style={{ position: 'relative', width: 120, height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <img src={img.image_data} alt={img.image_type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button onClick={() => deleteImage(img.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}>×</button>
                            <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, padding: 2, textAlign: 'center' }}>{img.image_type}</span>
                        </div>
                    ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
"""

with open("src/components/ConsultationPage.jsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Generated successfully!")
