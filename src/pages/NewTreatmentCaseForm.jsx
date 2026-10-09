import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NewTreatmentCaseForm.module.css';
import Sidebar from '../components/consultation/Sidebar';
import TopHeader from '../components/consultation/TopHeader';
import { ChevronDown, ChevronUp, Upload, Activity, Stethoscope, Syringe, ShieldAlert, BookOpen, ClipboardList, PenTool, Image as ImageIcon, Pill, TestTube, FileText, CheckSquare } from 'lucide-react';
import { ConsultationProvider } from '../context/ConsultationContext';

const Accordion = ({ title, icon: Icon, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.accordionItem}>
      <div className={styles.accordionHeader} onClick={() => setIsOpen(!isOpen)}>
        <h3 className={styles.accordionTitle}>
          {Icon && <Icon size={20} color="#14b8a6" />}
          {title}
        </h3>
        {isOpen ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
      </div>
      {isOpen && (
        <div className={styles.accordionContent}>
          {children}
        </div>
      )}
    </div>
  );
};

const FormContent = ({ isWorkflowStep }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />
      <div className={styles.mainArea}>
        {!isWorkflowStep && <TopHeader />}
        
        <div className={styles.scrollContainer} style={{ paddingBottom: isWorkflowStep ? '2rem' : '100px' }}>
          <div className={styles.headerCard}>
            <div>
              <h2 className={styles.headerTitle}>Create New Treatment Case</h2>
              <div className={styles.headerGrid}>
                <div className={styles.metaGroup}>
                  <span className={styles.metaLabel}>Case Number</span>
                  <span className={styles.metaValue}>CAS-2023-089</span>
                </div>
                <div className={styles.metaGroup}>
                  <span className={styles.metaLabel}>Doctor</span>
                  <span className={styles.metaValue}>Dr. Sarah Jenkins</span>
                </div>
                <div className={styles.metaGroup}>
                  <span className={styles.metaLabel}>Department</span>
                  <span className={styles.metaValue}>General Dentistry</span>
                </div>
                <div className={styles.metaGroup}>
                  <span className={styles.metaLabel}>Date</span>
                  <span className={styles.metaValue}>Oct 12, 2023</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className={styles.metaGroup}>
                <span className={styles.metaLabel}>Priority</span>
                <select className={styles.select} style={{ padding: '0.5rem', width: '120px' }}>
                  <option>Routine</option>
                  <option>Urgent</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div className={styles.metaGroup}>
                <span className={styles.metaLabel}>Status</span>
                <select className={styles.select} style={{ padding: '0.5rem', width: '120px' }}>
                  <option>Draft</option>
                  <option>Active</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 1: Chief Complaint */}
          <Accordion title="1. Chief Complaint" icon={Activity} defaultOpen={true}>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.fieldLabel}>Chief Complaint Details</label>
                <textarea className={styles.textarea} rows="3" placeholder="Describe the primary issue..."></textarea>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Complaint Category</label>
                <select className={styles.select}>
                  <option>Select Category...</option>
                  <option>Pain</option>
                  <option>Sensitivity</option>
                  <option>Swelling</option>
                  <option>Bleeding</option>
                  <option>Broken Tooth</option>
                  <option>Cosmetic</option>
                  <option>Others</option>
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Duration</label>
                <input type="text" className={styles.input} placeholder="e.g. 3 days, 2 weeks" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Pain Scale (0-10)</label>
                <input type="number" className={styles.input} min="0" max="10" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Pain Type</label>
                <select className={styles.select}>
                  <option>None</option>
                  <option>Sharp</option>
                  <option>Dull Ache</option>
                  <option>Throbbing</option>
                </select>
              </div>
            </div>
          </Accordion>

          {/* Section 2: Medical History */}
          <Accordion title="2. Medical History" icon={ShieldAlert}>
            <div className={styles.checkboxGrid} style={{ marginBottom: '1.5rem' }}>
              {['Diabetes', 'Hypertension', 'Heart Disease', 'Pregnancy', 'Asthma', 'Kidney Disease', 'Liver Disease', 'Thyroid', 'Allergy', 'Blood Disorder', 'Smoking', 'Alcohol'].map(item => (
                <label key={item} className={styles.checkboxLabel}>
                  <input type="checkbox" /> {item}
                </label>
              ))}
            </div>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Current Medications</label>
                <textarea className={styles.textarea} rows="2"></textarea>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Previous Surgery / Others</label>
                <textarea className={styles.textarea} rows="2"></textarea>
              </div>
            </div>
          </Accordion>

          {/* Section 3: Dental History */}
          <Accordion title="3. Dental History" icon={BookOpen}>
            <div className={styles.checkboxGrid} style={{ marginBottom: '1.5rem' }}>
              {['Previous Extraction', 'RCT', 'Implant', 'Braces', 'Denture', 'Scaling', 'Crown', 'Bridge', 'Previous Trauma'].map(item => (
                <label key={item} className={styles.checkboxLabel}>
                  <input type="checkbox" /> {item}
                </label>
              ))}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Oral Habits</label>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                <label className={styles.checkboxLabel}><input type="checkbox" /> Bruxism</label>
                <label className={styles.checkboxLabel}><input type="checkbox" /> Thumb Sucking</label>
                <label className={styles.checkboxLabel}><input type="checkbox" /> Mouth Breathing</label>
              </div>
            </div>
          </Accordion>

          {/* Section 4: Clinical Examination */}
          <Accordion title="4. Clinical Examination" icon={Stethoscope}>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Extra Oral Examination</label>
                <textarea className={styles.textarea} rows="3" placeholder="TMJ, Lymph Nodes, Swelling, Facial Symmetry..."></textarea>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Intra Oral Examination (Soft Tissue)</label>
                <textarea className={styles.textarea} rows="3" placeholder="Tongue, Palate, Floor of Mouth, Buccal Mucosa, Gingiva..."></textarea>
              </div>
            </div>
            <div className={styles.checkboxGrid} style={{ marginTop: '1.5rem' }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Plaque Index</label>
                <select className={styles.select}><option>Good</option><option>Fair</option><option>Poor</option></select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Calculus</label>
                <select className={styles.select}><option>None</option><option>Slight</option><option>Moderate</option><option>Heavy</option></select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Bleeding Index</label>
                <input type="text" className={styles.input} placeholder="%" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Occlusion</label>
                <input type="text" className={styles.input} placeholder="Class I, II, III" />
              </div>
            </div>
          </Accordion>

          {/* Section 5: Tooth Selection */}
          <Accordion title="5. Tooth Selection" icon={CheckSquare}>
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'white', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>Interactive Dental Chart (Click to select teeth)</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', maxWidth: '600px', margin: '0 auto' }}>
                {[18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28].map(t => (
                  <button key={t} className={styles.btnSecondary} style={{ padding: '0.5rem', minWidth: '40px' }}>{t}</button>
                ))}
              </div>
            </div>
          </Accordion>

          {/* Section 6: Diagnosis */}
          <Accordion title="6. Diagnosis" icon={ClipboardList}>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Primary Diagnosis</label>
                <select className={styles.select}>
                  <option>Select Diagnosis...</option>
                  <option>Dental Caries</option>
                  <option>Pulpitis</option>
                  <option>Periapical Abscess</option>
                  <option>Periodontitis</option>
                  <option>Gingivitis</option>
                  <option>Impaction</option>
                  <option>Fractured Tooth</option>
                  <option>Missing Tooth</option>
                  <option>Malocclusion</option>
                  <option>Tooth Wear</option>
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Diagnosis Notes</label>
                <textarea className={styles.textarea} rows="2"></textarea>
              </div>
            </div>
          </Accordion>

          {/* Section 7: Treatment Plan */}
          <Accordion title="7. Treatment Plan" icon={PenTool}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Tooth</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Procedure</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Priority</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Est. Cost</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Visits</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Doctor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.75rem' }}><input type="text" className={styles.input} placeholder="36" /></td>
                  <td style={{ padding: '0.75rem' }}><input type="text" className={styles.input} placeholder="RCT" /></td>
                  <td style={{ padding: '0.75rem' }}>
                    <select className={styles.select}><option>High</option><option>Medium</option><option>Low</option></select>
                  </td>
                  <td style={{ padding: '0.75rem' }}><input type="text" className={styles.input} placeholder="$0.00" /></td>
                  <td style={{ padding: '0.75rem' }}><input type="number" className={styles.input} defaultValue="2" /></td>
                  <td style={{ padding: '0.75rem' }}><input type="text" className={styles.input} placeholder="Dr. Smith" /></td>
                </tr>
              </tbody>
            </table>
            <button className={styles.btnSecondary} style={{ marginTop: '1rem' }}>+ Add Procedure</button>
          </Accordion>

          {/* Section 8: RVG Reports & Notes */}
          <Accordion title="8. RVG Reports & Notes" icon={ImageIcon}>
            <div className={styles.uploadArea}>
              <Upload size={40} color="#64748b" />
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Upload RVG, X-ray, OPG, CBCT</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Drag & drop files or click to browse</p>
              </div>
              <button className={styles.btnSecondary}>Select Files</button>
            </div>
          </Accordion>

          {/* Section 9: Prescription */}
          <Accordion title="9. Prescription" icon={Pill}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Medicine</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Dosage</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Frequency</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Duration</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Instructions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.75rem' }}><input type="text" className={styles.input} placeholder="Amoxicillin" /></td>
                  <td style={{ padding: '0.75rem' }}><input type="text" className={styles.input} placeholder="500mg" /></td>
                  <td style={{ padding: '0.75rem' }}><input type="text" className={styles.input} placeholder="1-1-1" /></td>
                  <td style={{ padding: '0.75rem' }}><input type="text" className={styles.input} placeholder="5 days" /></td>
                  <td style={{ padding: '0.75rem' }}><input type="text" className={styles.input} placeholder="After meals" /></td>
                </tr>
              </tbody>
            </table>
            <button className={styles.btnSecondary} style={{ marginTop: '1rem' }}>+ Add Medicine</button>
          </Accordion>

          {/* Section 10: Lab Investigation */}
          <Accordion title="10. Lab Investigation" icon={TestTube}>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Test Name</label>
                <input type="text" className={styles.input} placeholder="e.g. Complete Blood Count" />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Priority</label>
                <select className={styles.select}><option>Routine</option><option>Urgent</option></select>
              </div>
              <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.fieldLabel}>Instructions to Lab</label>
                <textarea className={styles.textarea} rows="2"></textarea>
              </div>
            </div>
          </Accordion>

          {/* Section 11: Patient Instructions */}
          <Accordion title="11. Patient Instructions" icon={FileText}>
            <div className={styles.fieldGroup}>
              <textarea className={styles.textarea} rows="4" placeholder="Enter post-operative or general instructions for the patient..."></textarea>
            </div>
          </Accordion>

          {/* Section 12: Consent */}
          <Accordion title="12. Consent & Signatures" icon={PenTool}>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Patient Signature</label>
                <div className={styles.canvasContainer}>
                  <span>Sign Here</span>
                  <canvas></canvas>
                </div>
                <button className={styles.btnSecondary} style={{ alignSelf: 'flex-start', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Clear</button>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Doctor Signature</label>
                <div className={styles.canvasContainer}>
                  <span>Sign Here</span>
                  <canvas></canvas>
                </div>
                <button className={styles.btnSecondary} style={{ alignSelf: 'flex-start', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Clear</button>
              </div>
            </div>
          </Accordion>

        </div>
        
        {/* Sticky Action Footer */}
        {!isWorkflowStep && (
          <div className={styles.bottomBar}>
            <div style={{ display: 'flex', gap: '1rem' }}>
            <button className={styles.btnSecondary} onClick={() => navigate(-1)} style={{ color: '#ef4444', borderColor: '#fca5a5' }}>Cancel</button>
            <button className={styles.btnSecondary}>Save Draft</button>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className={styles.btnSecondary}>Print Case Sheet</button>
            <button className={styles.btnPrimary} style={{ backgroundColor: '#3b82f6' }}>Save Case</button>
            <button className={styles.btnPrimary} onClick={() => navigate('/doctor/odontogram/CASE-123')}>Save & Continue</button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

const NewTreatmentCaseForm = ({ isWorkflowStep }) => {
  return (
    <ConsultationProvider>
      <FormContent isWorkflowStep={isWorkflowStep} />
    </ConsultationProvider>
  );
};

export default NewTreatmentCaseForm;
