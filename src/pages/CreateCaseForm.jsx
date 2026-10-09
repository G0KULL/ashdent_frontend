import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import styles from './CreateCaseForm.module.css';
import { ConsultationProvider } from '../context/ConsultationContext';
import TopHeader from '../components/consultation/TopHeader';
import { X, Upload, Mic, Paperclip } from 'lucide-react';
import PreviousHistoryModal from '../components/consultation/PreviousHistoryModal';

const ChipInput = ({ label, placeholder, initialTags = [], options = [], onChange }) => {
  const [tags, setTags] = useState(initialTags);
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        const newTags = [...tags, inputValue.trim()];
        setTags(newTags);
        if (onChange) onChange(newTags);
      }
      setInputValue('');
      setShowDropdown(false);
    }
  };

  const selectOption = (opt) => {
    if (!tags.includes(opt)) {
      const newTags = [...tags, opt];
      setTags(newTags);
      if (onChange) onChange(newTags);
    }
    setInputValue('');
    setShowDropdown(false);
  };

  const removeTag = (idx) => {
    const newTags = tags.filter((_, i) => i !== idx);
    setTags(newTags);
    if (onChange) onChange(newTags);
  };

  const filteredOptions = options.filter(o => o.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(o));

  return (
    <div style={{ marginBottom: '1.5rem', position: 'relative' }} ref={wrapperRef}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.chipInputContainer}>
        {tags.map((tag, idx) => (
          <div key={idx} className={styles.chip}>
            {tag}
            <button type="button" onClick={() => removeTag(idx)}><X size={14} /></button>
          </div>
        ))}
        <input
          type="text"
          className={styles.chipInput}
          placeholder={tags.length === 0 ? placeholder : ''}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {showDropdown && filteredOptions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
          {filteredOptions.map(opt => (
            <div
              key={opt}
              onClick={() => selectOption(opt)}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.875rem', borderBottom: '1px solid #f1f5f9' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FormContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useParams();

  // New state variables for Clinical Notes
  const [complaints, setComplaints] = useState([]);
  const [dentalHistory, setDentalHistory] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [observations, setObservations] = useState([]);
  const [chiefComplaintNotes, setChiefComplaintNotes] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [pastHistory, setPastHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expandedVisitId, setExpandedVisitId] = useState(null);

  // Use state passed from Appointments, fallback to some defaults if missing
  const pState = location.state || {};
  const [loadingPatient, setLoadingPatient] = useState(!pState.patientName);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Format ID helper
  const formatId = (id) => {
    if (!id) return 'Loading...';
    if (id.length > 20) return id.substring(0, 8).toUpperCase();
    return id;
  };

  const [patient, setPatient] = useState({
    name: pState.patientName || 'Loading...',
    gender: pState.patientGender || '-',
    age: pState.patientAge || '-',
    uhid: formatId(pState.patientId || patientId),
    phone: pState.patientPhone || '-',
    appointmentDate: formatDate(pState.appointmentDate)
  });

  useEffect(() => {
    // Always try to fetch fresh data if possible, or if state is missing
    if (patientId) {
      const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
      const headers = { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };

      fetch(`http://127.0.0.1:8000/api/patient/${patientId}/profile/`, { headers })
        .then(res => res.json())
        .then(data => {
          if (data && data.patient) {
            setPatient(prev => ({
              ...prev,
              name: data.patient.name || prev.name,
              gender: data.patient.gender || prev.gender,
              age: data.patient.age || prev.age,
              uhid: formatId(data.patient.id || prev.uhid),
              phone: data.patient.phone || prev.phone
            }));
          }
        })
        .catch(err => console.error("Failed to fetch patient", err))
        .finally(() => setLoadingPatient(false));

      fetch(`http://127.0.0.1:8000/api/patient/${patientId}/clinical-history/`, { headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPastHistory(data);
            if (data.length > 0) {
              setShowHistoryModal(true);
            }
          }
        })
        .catch(err => console.error("Failed to fetch clinical history", err));
    }
  }, [patientId]);

  const handleSave = async (draft = false) => {
    setSaving(true);
    const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
    const headers = { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/clinical-notes/save/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          patient_id: patientId,
          complaints,
          dental_history: dentalHistory,
          medical_history: medicalHistory,
          observations,
          chief_complaint: chiefComplaintNotes,
          notes: clinicalFindings + (clinicalNotes ? "\n\nClinical Notes:\n" + clinicalNotes : ""),
          follow_up_date: followUpDate || null,
          follow_up_note: followUpNote
        })
      });
      if (res.ok) {
        if (!draft) {
          const basePath = location.pathname.startsWith('/admin') ? '/admin' : 
                           location.pathname.startsWith('/receptionist') ? '/receptionist' : '/doctor';
          navigate(`${basePath}/odontogram/${patientId}`);
        }
      } else {
        alert("Failed to save clinical notes.");
      }
    } catch(err) {
      console.error(err);
      alert("Error saving clinical notes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {showHistoryModal && (
        <PreviousHistoryModal 
          pastHistory={pastHistory} 
          onClose={() => setShowHistoryModal(false)} 
        />
      )}
      <div className={styles.mainArea}>
        <TopHeader hidePatientHeader={true} />

        <div className={styles.scrollContainer}>
          {/* Patient Info Card */}
          <div className={styles.patientHorizontalCard}>
            <div className={styles.patientInfoGrid}>
              <div className={styles.patientMetaItem}>
                <span className={styles.patientMetaLabel}>Patient Name</span>
                <span className={styles.patientMetaValue}>{patient.name}</span>
              </div>
              <div className={styles.patientMetaItem}>
                <span className={styles.patientMetaLabel}>Gender</span>
                <span className={styles.patientMetaValue}>{patient.gender}</span>
              </div>
              <div className={styles.patientMetaItem}>
                <span className={styles.patientMetaLabel}>Age</span>
                <span className={styles.patientMetaValue}>{patient.age}</span>
              </div>
              <div className={styles.patientMetaItem}>
                <span className={styles.patientMetaLabel}>Patient ID</span>
                <span className={styles.patientMetaValue}>{patient.uhid}</span>
              </div>
              <div className={styles.patientMetaItem}>
                <span className={styles.patientMetaLabel}>Token Number</span>
                <span className={styles.patientMetaValue}>TKN-45</span>
              </div>
              <div className={styles.patientMetaItem}>
                <span className={styles.patientMetaLabel}>Appointment Date</span>
                <span className={styles.patientMetaValue}>{patient.appointmentDate}</span>
              </div>
              <div className={styles.patientMetaItem}>
                <span className={styles.patientMetaLabel}>Phone Number</span>
                <span className={styles.patientMetaValue}>{patient.phone}</span>
              </div>
              <div className={styles.patientMetaItem}>
                <span className={styles.patientMetaLabel}>Location</span>
                <span className={styles.patientMetaValue}>New York Clinic</span>
              </div>
              <div className={styles.patientMetaItem}>
                <span className={styles.patientMetaLabel}>Alerts</span>
                <span className={`${styles.badge} ${styles.badgeAlert}`}>Diabetic</span>
              </div>
              <div className={styles.viewProfileBtnWrapper}>
                <button className={styles.btnSecondary} onClick={() => navigate(`/patient/${patientId}/profile`)}>View Profile</button>
              </div>
            </div>
          </div>

          {/* Last Treatment Card & Previous Visits */}
          {pastHistory.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* LAST TREATMENT */}
              {pastHistory[0]?.treatments?.length > 0 && (
                <div className={styles.card} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LAST TREATMENT</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Date</div>
                      <div style={{ fontWeight: '500', color: '#334155' }}>{formatDate(pastHistory[0].date)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Treatment</div>
                      <div style={{ fontWeight: '500', color: '#334155' }}>{pastHistory[0].treatments[0].treatment || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Tooth</div>
                      <div style={{ fontWeight: '500', color: '#334155' }}>{pastHistory[0].treatments[0].tooth_number || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Diagnosis</div>
                      <div style={{ fontWeight: '500', color: '#334155' }}>{pastHistory[0].diagnosis?.join(', ') || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Status</div>
                      <div style={{ fontWeight: '500', color: '#334155' }}>{pastHistory[0].treatments[0].status || 'Completed'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Doctor</div>
                      <div style={{ fontWeight: '500', color: '#334155' }}>{pastHistory[0].doctor || 'Unknown'}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <button 
                      className={styles.btnSecondary} 
                      onClick={() => setExpandedVisitId(expandedVisitId === pastHistory[0].appointment_id ? null : pastHistory[0].appointment_id)}
                    >
                      {expandedVisitId === pastHistory[0].appointment_id ? 'Hide Details' : 'View Full Details'}
                    </button>
                  </div>
                </div>
              )}

              {/* PREVIOUS VISITS TIMELINE */}
              <div className={styles.card} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PREVIOUS VISITS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {pastHistory.map((item, idx) => (
                    <div key={idx} style={{ paddingBottom: '1.5rem', borderBottom: idx < pastHistory.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '1rem' }}>{formatDate(item.date)}</div>
                          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{item.doctor}</div>
                        </div>
                        <button 
                          style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '500' }}
                          onClick={() => setExpandedVisitId(expandedVisitId === item.appointment_id ? null : item.appointment_id)}
                        >
                          {expandedVisitId === item.appointment_id ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>
                      
                      <div style={{ fontSize: '0.875rem', color: '#334155', marginBottom: '0.5rem' }}>
                        <strong>Chief Complaint:</strong> {item.chief_complaint || 'None'}
                      </div>

                      {item.treatments && item.treatments.length > 0 && (
                        <div style={{ fontSize: '0.875rem', color: '#334155', marginBottom: '0.5rem' }}>
                          <strong>Treatment:</strong> {item.treatments.map(t => t.treatment).join(', ')}
                        </div>
                      )}

                      {expandedVisitId === item.appointment_id && (
                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '0.875rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {item.medical_history?.length > 0 && <div><strong>Medical History:</strong> {item.medical_history.join(', ')}</div>}
                            {item.dental_history?.length > 0 && <div><strong>Dental History:</strong> {item.dental_history.join(', ')}</div>}
                            {item.observations?.length > 0 && <div><strong>Examination:</strong> {item.observations.join(', ')}</div>}
                            {item.diagnosis?.length > 0 && <div><strong>Diagnosis:</strong> {item.diagnosis.join(', ')}</div>}
                          </div>
                          
                          {item.notes && (
                            <div style={{ marginTop: '1rem' }}>
                              <strong>Clinical Findings & Notes:</strong>
                              <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.25rem', color: '#475569' }}>{item.notes}</p>
                            </div>
                          )}

                          {item.treatments && item.treatments.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                              <strong>Treatments Completed:</strong>
                              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', color: '#475569' }}>
                                {item.treatments.map(t => (
                                  <li key={t.id}>{t.treatment} (Tooth: {t.tooth_number || 'N/A'}) - {t.status}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {item.rvgs && item.rvgs.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                              <strong>RVG / X-Rays:</strong>
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                {item.rvgs.map(rvg => (
                                  <a key={rvg.id} href={rvg.file_url} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>View RVG</a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NEW VISIT SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NEW VISIT</h3>
            
            <div className={styles.formTwoCol}>
            {/* Left Column */}
            <div className={styles.columnCard}>
              <ChipInput
                label="Chief Complaint"
                placeholder="Search complaint..."
                initialTags={complaints}
                options={['Toothache', 'Sensitivity', 'Bleeding Gums', 'Swelling', 'Broken Tooth', 'Loose Tooth', 'Missing Tooth', 'Bad Breath', 'Cosmetic', 'Orthodontic', 'Jaw Pain']}
                onChange={setComplaints}
              />
              <ChipInput
                label="Dental History"
                placeholder="Search history..."
                initialTags={dentalHistory}
                options={['Previous RCT', 'Extraction', 'Implants', 'Braces', 'Scaling', 'Crowns', 'Bridges', 'Dentures', 'Trauma', 'Oral Habits']}
                onChange={setDentalHistory}
              />
              <div>
                <label className={styles.fieldLabel}>Chief Complaint Notes</label>
                <textarea 
                  className={styles.textarea} 
                  placeholder="Enter detailed notes here..."
                  value={chiefComplaintNotes}
                  onChange={e => setChiefComplaintNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            {/* Right Column */}
            <div className={styles.columnCard}>
              <ChipInput
                label="Medical History"
                placeholder="Search history..."
                initialTags={medicalHistory}
                options={['Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Pregnancy', 'Kidney Disease', 'Liver Disease', 'Thyroid', 'Allergy', 'Bleeding Disorder', 'Smoking', 'Alcohol']}
                onChange={setMedicalHistory}
              />
              <ChipInput
                label="On Examination"
                placeholder="Search findings..."
                initialTags={observations}
                options={['Deep Caries', 'Tender on Percussion', 'Mobility Grade I', 'Mobility Grade II', 'Mobility Grade III', 'Calculus', 'Plaque', 'Gingivitis', 'Pocket Depth >3mm', 'Pus Discharge']}
                onChange={setObservations}
              />
              <div>
                <label className={styles.fieldLabel}>Clinical Findings</label>
                <textarea 
                  className={styles.textarea} 
                  placeholder="Enter detailed findings here..."
                  value={clinicalFindings}
                  onChange={e => setClinicalFindings(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          {/* RVG Reports & Notes */}
          <div className={styles.rvgCard}>
            <h3 className={styles.rvgTitle}>RVG Reports & Notes</h3>
            <div className={styles.rvgGrid}>
              <div className={styles.rvgUploadArea}>
                <Upload size={32} color="#94a3b8" />
                <div>
                  <div style={{ fontWeight: '600', color: '#334155' }}>Drop files here or click to upload</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Supports JPG, PNG, PDF up to 10MB</div>
                </div>
                <button className={`${styles.btnSecondary} ${styles.btnAction}`}>Upload RVG</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className={styles.fieldLabel}>Clinical Notes</label>
                <textarea 
                  className={styles.textarea} 
                  placeholder="Start typing clinical notes..."
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                ></textarea>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button className={`${styles.btnSecondary} ${styles.btnAction}`}>
                    <Paperclip size={16} /> Attach
                  </button>
                  <button className={`${styles.btnSecondary} ${styles.btnAction}`}>
                    <Mic size={16} /> Voice Note
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Follow Up Details */}
          <div className={styles.rvgCard} style={{ marginTop: '24px' }}>
            <h3 className={styles.rvgTitle}>Follow-up Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', padding: '24px' }}>
              <div>
                <label className={styles.fieldLabel}>Follow-up Date</label>
                <input 
                  type="date" 
                  className={styles.input} 
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className={styles.fieldLabel}>Follow-up Notes</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Enter details for next visit..."
                  value={followUpNote}
                  onChange={e => setFollowUpNote(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Bottom Action Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomBarLeft}>
            <button className={`${styles.btnSecondary} ${styles.btnCancel}`} onClick={() => navigate(-1)} disabled={saving}>Cancel</button>
            <button className={styles.btnSecondary} onClick={() => handleSave(true)} disabled={saving}>Save Draft</button>
          </div>
          <div className={styles.bottomBarRight}>
            <button className={styles.btnSecondary} onClick={() => handleSave(false)} disabled={saving}>Create Case</button>
            <button className={styles.btnPrimary} onClick={() => handleSave(false)} disabled={saving}>{saving ? 'Saving...' : 'Save & Continue'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateCaseForm = () => {
  return (
    <ConsultationProvider>
      <FormContent />
    </ConsultationProvider>
  );
};

export default CreateCaseForm;
