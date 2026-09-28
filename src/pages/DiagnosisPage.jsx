import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import styles from './DiagnosisPage.module.css';
import { usePatients } from '../context/PatientContext';

const DIAGNOSIS_CATEGORIES = [
  'Dental Caries', 'Pulpitis', 'Necrotic Pulp', 'Periapical Lesion',
  'Gingivitis', 'Periodontitis', 'Tooth Fracture', 'Missing Tooth',
  'Impacted Tooth', 'Attrition', 'Abrasion', 'Abfraction', 'Mobility',
  'Infection', 'Abscess', 'Existing Restoration', 'Failed Restoration',
  'Other'
];

const TREATMENTS = [
  'Examination', 'Prophylaxis', 'Composite Restoration', 'GIC Restoration',
  'Root Canal Treatment', 'Crown', 'Bridge', 'Extraction', 'Implant',
  'Scaling and Root Planing', 'Denture', 'Veneer', 'Inlay / Onlay',
  'Fluoride', 'Sealant', 'Other'
];

const ALL_TEETH = [
  '11', '12', '13', '14', '15', '16', '17', '18',
  '21', '22', '23', '24', '25', '26', '27', '28',
  '31', '32', '33', '34', '35', '36', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48',
  '51', '52', '53', '54', '55',
  '61', '62', '63', '64', '65',
  '71', '72', '73', '74', '75',
  '81', '82', '83', '84', '85'
];

const MultiSelectDropdown = ({ options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  
  const toggle = (opt) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt));
    else onChange([...selected, opt]);
  };
  
  const selectAll = () => onChange(options);
  const clearAll = () => onChange([]);
  
  // Close when clicking outside
  useEffect(() => {
      const close = () => setIsOpen(false);
      if (isOpen) document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <div 
        className={styles.formInput} 
        style={{ cursor: 'pointer', minHeight: '40px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? <span style={{color: '#94a3b8'}}>{placeholder}</span> : 
         selected.map(s => <span key={s} style={{background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem'}}>{s}</span>)}
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', zIndex: 10, marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', flexDirection: 'column' }}>
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} onClick={e => e.stopPropagation()} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <button onClick={(e) => { e.stopPropagation(); selectAll(); }} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}>Select All</button>
              <button onClick={(e) => { e.stopPropagation(); clearAll(); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Clear All</button>
            </div>
          </div>
          <div style={{ overflowY: 'auto', padding: '4px' }}>
            {filtered.map(opt => (
              <div key={opt} style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); toggle(opt); }}>
                <input type="checkbox" checked={selected.includes(opt)} readOnly style={{ cursor: 'pointer' }} />
                <span style={{ fontSize: '0.875rem' }}>{opt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MAP_CONDITION_TO_DIAGNOSIS = {
  'Caries': 'Dental Caries',
  'Root Canal': 'Root Canal / Endodontic condition',
  'Crown': 'Crown / Existing Crown',
  'Missing': 'Missing Tooth',
  'Fracture': 'Tooth Fracture',
  'Mobility': 'Tooth Mobility',
  'Implant': 'Dental Implant',
  'Bridge': 'Dental Bridge',
  'Extraction': 'Tooth requiring Extraction',
  'Filled': 'Existing Restoration',
  'Sealant': 'Dental Sealant',
  'Existing Treatment': 'Existing Treatment',
  'Planned Treatment': 'Planned Treatment'
};

export default function DiagnosisPage() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const location = useLocation();
  const { activePatient } = usePatients();
  
  // Try to grab passed state from Odontogram or LocalStorage
  const [passedData, setPassedData] = useState(() => {
    let data = location.state?.chartData;
    if (!data) {
        try {
            const stored = localStorage.getItem(`doctosmart_dental_chart_${caseId || 'new'}`);
            if (stored) {
                data = JSON.parse(stored);
            }
        } catch (e) {
            console.error("Error reading dental chart from localStorage", e);
        }
    }
    return data || {};
  });
  
  // Local storage key based on caseId or a default if new
  const storageKey = `doctosmart_diagnosis_${caseId || 'new'}`;
  
  // Teeth Data extraction
  const teethData = passedData.teeth || (passedData['11'] || passedData['16'] ? passedData : {});

  // Initialize state with lazy loading from localStorage or defaults
  const getInitialState = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[key] !== undefined && parsed[key].length > 0) return parsed[key];
      }
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
    
    // Auto-map if asking for diagnoses and none are stored
    if (key === 'diagnoses') {
        const autoDiagnoses = [];
        const processCondition = (toothNum, cond, surfaceStr) => {
             const diagCategory = MAP_CONDITION_TO_DIAGNOSIS[cond.type || cond.condition];
             if (diagCategory) {
                 autoDiagnoses.push({
                     id: Date.now() + Math.random(),
                     tooth: toothNum.toString(),
                     surfaces: surfaceStr || 'Whole',
                     category: diagCategory,
                     severity: 'Moderate',
                     treatment: '',
                     priority: 'Routine',
                     notes: ''
                 });
             }
        };

        if (Array.isArray(passedData)) {
            passedData.forEach(item => {
                processCondition(item.toothNumber, item, item.surfaces && item.surfaces.length > 0 ? item.surfaces.join(', ') : 'Whole');
            });
        } else {
            Object.values(teethData).forEach((toothObj) => {
                toothObj.conditions?.forEach((cond) => {
                    processCondition(toothObj.toothNumber, cond, cond.surfaces?.length > 0 ? cond.surfaces.join(', ') : 'Whole');
                });
            });
        }
        if (autoDiagnoses.length > 0) {
            return autoDiagnoses;
        }
    }
    
    return defaultValue;
  };

  const [diagnoses, setDiagnoses] = useState(() => getInitialState('diagnoses', []));
  const [findings, setFindings] = useState(() => getInitialState('findings', {
    extraoral: '',
    intraoral: '',
    softTissue: '',
    occlusion: 'Normal',
    periodontal: 'Healthy',
    additional: ''
  }));
  const [attachments, setAttachments] = useState(() => getInitialState('attachments', [
    { id: 1, name: 'OPG_Scan_2026.jpg', type: 'Image', date: 'May 12, 2026' }
  ]));
  const [clinicalNotes, setClinicalNotes] = useState(() => getInitialState('clinicalNotes', ''));

  // Save to local storage whenever main data changes
  useEffect(() => {
    try {
      const dataToSave = {
        diagnoses,
        findings,
        attachments,
        clinicalNotes
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }, [diagnoses, findings, attachments, clinicalNotes, storageKey]);

  // Form State
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [selectedSurfaces, setSelectedSurfaces] = useState([]);
  const [diagnosisCategories, setDiagnosisCategories] = useState([]);
  const [severity, setSeverity] = useState('Moderate');
  const [recommendedTreatment, setRecommendedTreatment] = useState('');
  const [priority, setPriority] = useState('Routine');
  const [notes, setNotes] = useState('');

  // When multiple teeth are selected, some might be anterior, some posterior.
  // For simplicity if any anterior is selected we could show I/F, else O/B. 
  // Let's just show all possible surfaces M, I, O, D, F, B, L and let the clinician choose appropriately.
  const availableSurfaces = ['M', 'I', 'O', 'D', 'F', 'B', 'L'];

  const toggleSurface = (surf) => {
    setSelectedSurfaces(prev => 
      prev.includes(surf) ? prev.filter(s => s !== surf) : [...prev, surf]
    );
  };

  const handleAddDiagnosis = () => {
    if (selectedTeeth.length === 0 || diagnosisCategories.length === 0) {
      alert("Tooth Number and Diagnosis Category are required.");
      return;
    }
    
    const newDiagnoses = [];
    selectedTeeth.forEach(tooth => {
        diagnosisCategories.forEach(category => {
            newDiagnoses.push({
              id: Date.now() + Math.random(),
              tooth: tooth,
              surfaces: selectedSurfaces.join(', ') || 'Whole',
              category: category,
              severity,
              treatment: recommendedTreatment,
              priority,
              notes
            });
        });
    });
    
    setDiagnoses([...diagnoses, ...newDiagnoses]);
    
    // Reset basic form
    setSelectedTeeth([]);
    setSelectedSurfaces([]);
    setDiagnosisCategories([]);
    setRecommendedTreatment('');
    setNotes('');
  };

  const removeDiagnosis = (id) => {
    setDiagnoses(diagnoses.filter(d => d.id !== id));
  };

  const handleSaveAndContinue = () => {
    // Pass everything to the treatment plan
    // Set status to PLANNED for treatments automatically in the Treatment Plan component
    // But we'll pass the exact data as requested.
    
    const preparedDiagnoses = diagnoses.map(d => ({
        ...d,
        status: 'PLANNED'
    }));

    navigate(`/doctor/treatment-plans/${caseId || 'new'}`, {
      state: { 
        diagnoses: preparedDiagnoses,
        findings,
        chartData: passedData 
      }
    });
  };

  const handleSaveDraft = () => {
      alert("Draft saved successfully.");
  };

  const handleSaveDiagnosis = () => {
      if (diagnoses.length === 0) {
          alert("Please add at least one diagnosis before saving.");
          return;
      }
      alert("Diagnosis saved successfully.");
  };

  // Extract chart findings for display based on strict schema array OR fallback object
  const chartFindings = Array.isArray(passedData) ? passedData.map(item => ({
      toothNumber: item.toothNumber,
      surface: item.surfaces && item.surfaces.length > 0 ? item.surfaces.join(', ') : 'Whole',
      condition: item.condition
  })) : Object.values(teethData).flatMap(toothObj => 
    (toothObj.conditions || []).map(cond => ({
      toothNumber: toothObj.toothNumber,
      surface: cond.surfaces && cond.surfaces.length > 0 ? cond.surfaces.join(', ') : 'Whole',
      condition: cond.type
    }))
  );

  const removeFinding = (toothNumber, condition) => {
     // A mock function for visual completeness; ideally this would update chartData in parent state too
     alert(`Finding removed: Tooth ${toothNumber} - ${condition}`);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.scrollContainer}>
        
        {/* Patient Header */}
        <div className={styles.patientStickyHeader}>
          <div className={styles.patientInfoGrid}>
            <div className={styles.patientMetaItem}>
              <span className={styles.patientMetaLabel}>Patient</span>
              <span className={styles.patientMetaValue}>{activePatient?.name || 'Sneha Nair'}</span>
            </div>
            <div className={styles.patientMetaItem}>
              <span className={styles.patientMetaLabel}>Patient ID</span>
              <span className={styles.patientMetaValue}>{activePatient?.id || '6A12D966'}</span>
            </div>
            <div className={styles.patientMetaItem}>
              <span className={styles.patientMetaLabel}>Age/Gender</span>
              <span className={styles.patientMetaValue}>{activePatient?.age || 34} / {activePatient?.gender || 'Female'}</span>
            </div>
            <div className={styles.patientMetaItem}>
              <span className={styles.patientMetaLabel}>Phone</span>
              <span className={styles.patientMetaValue}>{activePatient?.phone || '9876123450'}</span>
            </div>
            <div className={styles.patientMetaItem}>
              <span className={styles.patientMetaLabel}>Appointment Date</span>
              <span className={styles.patientMetaValue}>May 12, 2026</span>
            </div>
            <div className={styles.patientMetaItem}>
              <span className={styles.patientMetaLabel}>Location</span>
              <span className={styles.patientMetaValue}>New York Clinic</span>
            </div>
            <div className={styles.patientMetaItem}>
              <span className={styles.patientMetaLabel}>Alert</span>
              <span className={styles.patientMetaValue} style={{ color: '#ef4444' }}>Diabetic</span>
            </div>
          </div>
          <div className={styles.quickActions}>
            <button className={styles.btnSecondary}>View Profile</button>
            <button className={styles.btnSecondary} onClick={() => navigate(-1)}>Back to Dental Chart</button>
          </div>
        </div>

        {/* Stepper */}
        <div className={styles.stepperContainer}>
          <div className={`${styles.stepIndicator} ${styles.completed}`} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>✓ Case Sheet</div>
          <div className={`${styles.stepDivider} ${styles.completed}`} />
          <div className={`${styles.stepIndicator} ${styles.completed}`} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>✓ Dental Chart</div>
          <div className={`${styles.stepDivider} ${styles.completed}`} />
          <div className={`${styles.stepIndicator} ${styles.active}`}>● Diagnosis</div>
          <div className={styles.stepDivider} />
          <div className={styles.stepIndicator}>○ Treatment Plan</div>
          <div className={styles.stepDivider} />
          <div className={styles.stepIndicator}>○ Consent</div>
          <div className={styles.stepDivider} />
          <div className={styles.stepIndicator}>○ Treatment</div>
          <div className={styles.stepDivider} />
          <div className={styles.stepIndicator}>○ Billing</div>
        </div>

        <div className={styles.contentLayout}>
          
          <div style={{ marginBottom: '1rem' }}>
              <h1 className={styles.headerTitle}>Diagnosis & Clinical Assessment</h1>
              <p className={styles.headerSubtitle}>Review the dental chart findings and record the patient's clinical diagnosis.</p>
          </div>

          {/* Dental Chart Findings */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Imported Dental Chart Findings</div>
            {chartFindings.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {chartFindings.map((finding, idx) => (
                        <div key={idx} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                            <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0f172a' }}>Tooth {finding.toothNumber}</div>
                            <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.25rem' }}>Surface: <strong>{finding.surface}</strong></div>
                            <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.75rem' }}>Condition: <strong style={{ color: '#ef4444' }}>{finding.condition}</strong></div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className={styles.btnSecondary} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', flex: 1 }} onClick={() => {
                                    setSelectedTeeth([finding.toothNumber.toString()]);
                                    setSelectedSurfaces(finding.surface === 'Whole' ? [] : finding.surface.split(', '));
                                    setDiagnosisCategories([MAP_CONDITION_TO_DIAGNOSIS[finding.condition] || finding.condition]);
                                    document.getElementById('add-diagnosis-form').scrollIntoView({ behavior: 'smooth' });
                                }}>Edit</button>
                                <button className={styles.btnSecondary} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => removeFinding(finding.toothNumber, finding.condition)}>Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{ color: '#64748b' }}>No abnormal dental findings were recorded.</p>
            )}
            
            <div style={{ marginTop: '1.5rem' }}>
                <button className={styles.btnPrimary} onClick={() => document.getElementById('add-diagnosis-form').scrollIntoView({ behavior: 'smooth' })}>
                    + Add Additional Diagnosis
                </button>
            </div>
          </div>

          {/* Add Diagnosis Form */}
          <div id="add-diagnosis-form" className={styles.card}>
            <div className={styles.cardTitle}>Add Diagnosis</div>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tooth Number [Multi Select]</label>
                <MultiSelectDropdown 
                   options={ALL_TEETH} 
                   selected={selectedTeeth} 
                   onChange={setSelectedTeeth} 
                   placeholder="Search / Select Teeth..." 
                />
              </div>
              
              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.formLabel}>Surface [Multi Select]</label>
                <div className={styles.surfacesList}>
                  {availableSurfaces.map(surf => (
                    <div 
                      key={surf} 
                      className={`${styles.surfaceTag} ${selectedSurfaces.includes(surf) ? styles.selected : ''}`}
                      onClick={() => toggleSurface(surf)}
                    >
                      {surf}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Diagnosis Category [Multi Select]</label>
                <MultiSelectDropdown 
                   options={DIAGNOSIS_CATEGORIES} 
                   selected={diagnosisCategories} 
                   onChange={setDiagnosisCategories} 
                   placeholder="Searchable Dropdown..." 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Severity</label>
                <select className={styles.formInput} value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Recommended Treatment</label>
                <select className={styles.formInput} value={recommendedTreatment} onChange={(e) => setRecommendedTreatment(e.target.value)}>
                  <option value="">Select recommended treatment...</option>
                  {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Priority</label>
                <select className={styles.formInput} value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Routine">Routine</option>
                  <option value="Elective">Elective</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Diagnosis Notes</label>
              <textarea 
                className={styles.textareaInput} 
                style={{ minHeight: '60px' }}
                placeholder="Enter diagnostic observations and clinical reasoning..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1.5rem' }}>
              <button className={styles.btnPrimary} onClick={handleAddDiagnosis}>+ Add Another Diagnosis</button>
            </div>
          </div>

          {/* Diagnoses Table */}
          {diagnoses.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>Diagnosis Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {diagnoses.map(d => (
                  <div key={d.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Tooth {d.tooth}</div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className={styles.btnIcon} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#f1f5f9' }}>Edit</button>
                              <button className={styles.btnIcon} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#ef4444' }} onClick={() => removeDiagnosis(d.id)}>Delete</button>
                          </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.25rem' }}>Surface: <strong>{d.surfaces || 'Whole'}</strong></div>
                      <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.25rem' }}>Diagnosis: <strong>{d.category}</strong></div>
                      <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.25rem' }}>Severity: <span className={`${styles.severityBadge} ${styles['severity' + d.severity]}`}>{d.severity}</span></div>
                      {d.treatment && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0' }}>
                              <div style={{ fontSize: '0.9rem', color: '#475569' }}>Rec. Treatment: <strong>{d.treatment}</strong></div>
                              <div style={{ fontSize: '0.9rem', color: '#475569' }}>Priority: <strong>{d.priority}</strong></div>
                          </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Findings */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Clinical Examination</div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Extraoral Findings</label>
                <textarea className={styles.textareaInput} value={findings.extraoral} onChange={e => setFindings({...findings, extraoral: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Intraoral Findings</label>
                <textarea className={styles.textareaInput} value={findings.intraoral} onChange={e => setFindings({...findings, intraoral: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Soft Tissue Findings</label>
                <textarea className={styles.textareaInput} value={findings.softTissue} onChange={e => setFindings({...findings, softTissue: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Additional Clinical Findings</label>
                <textarea className={styles.textareaInput} value={findings.additional} onChange={e => setFindings({...findings, additional: e.target.value})} />
              </div>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Occlusion</label>
                <select className={styles.formInput} value={findings.occlusion} onChange={e => setFindings({...findings, occlusion: e.target.value})}>
                  <option>Normal</option>
                  <option>Class I</option>
                  <option>Class II</option>
                  <option>Class III</option>
                  <option>Crossbite</option>
                  <option>Open Bite</option>
                  <option>Deep Bite</option>
                  <option>Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Periodontal Assessment</label>
                <select className={styles.formInput} value={findings.periodontal} onChange={e => setFindings({...findings, periodontal: e.target.value})}>
                  <option>Healthy</option>
                  <option>Gingivitis</option>
                  <option>Mild Periodontitis</option>
                  <option>Moderate Periodontitis</option>
                  <option>Severe Periodontitis</option>
                </select>
              </div>
            </div>
          </div>

          {/* Diagnostic Attachments */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Diagnostic Attachments</div>
            <div 
                className={styles.fileUploadArea} 
                style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '2rem', textAlign: 'center', background: '#f8fafc', cursor: 'pointer', marginBottom: '1.5rem' }}
                onClick={() => {
                    const name = prompt("Enter simulated filename (e.g., OPG.jpg)");
                    if(name) {
                        setAttachments([...attachments, { id: Date.now(), name, type: name.split('.').pop().toUpperCase() || 'FILE', date: new Date().toLocaleDateString() }]);
                    }
                }}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📄</span>
              <div style={{ fontWeight: '600', color: 'var(--slate-700)', fontSize: '1.1rem' }}>Upload RVG / X-Ray, OPG, CBCT, Intraoral Photo, Extraoral Photo, PDF</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginTop: '0.5rem' }}>Click or drag files to upload (Simulation)</div>
            </div>
            
            <div className={styles.fileCards} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {attachments.map(file => (
                <div key={file.id} className={styles.fileCard} style={{ display: 'flex', gap: '1rem', alignItems: 'center', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
                    <div style={{ width: '48px', height: '48px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {file.type === 'JPG' || file.type === 'PNG' ? '🖼️' : '📄'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className={styles.fileName} style={{ fontWeight: '600', fontSize: '0.95rem' }}>{file.name}</div>
                        <div className={styles.fileMeta} style={{ fontSize: '0.8rem', color: '#64748b' }}>{file.type} • Uploaded {file.date}</div>
                    </div>
                    <button className={styles.btnIcon} style={{ color: '#ef4444', background: '#fee2e2', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }} onClick={() => setAttachments(attachments.filter(a => a.id !== file.id))}>Delete</button>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Diagnosis Notes */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Clinical Notes</div>
            <div className={styles.formGroup}>
                <label className={styles.formLabel}>Clinical Diagnosis Notes</label>
                <textarea 
                    className={styles.textareaInput} 
                    style={{ minHeight: '120px' }}
                    placeholder="Enter diagnostic observations, clinical reasoning and relevant findings..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                />
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Actions */}
      <div className={styles.bottomBar}>
        <button className={styles.btnSecondary} onClick={() => navigate(-1)} style={{ color: '#ef4444', borderColor: '#fca5a5' }}>Cancel</button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={styles.btnSecondary} onClick={handleSaveDraft}>Save Draft</button>
          <button className={styles.btnSecondary} onClick={handleSaveDiagnosis}>Save Diagnosis</button>
          <button className={styles.btnPrimary} onClick={handleSaveAndContinue}>Save & Continue</button>
        </div>
      </div>
    </div>
  );
}
