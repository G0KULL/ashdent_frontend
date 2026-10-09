import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import styles from './TreatmentPlansPage.module.css';
import { ConsultationProvider, useConsultation } from '../context/ConsultationContext';
import TopHeader from '../components/consultation/TopHeader';
import { X } from 'lucide-react';
import ClinicalNotesModal from '../components/ClinicalNotesModal';
import PrescriptionModal from '../components/PrescriptionModal';
import MedicationsSection from '../components/MedicationsSection';
import InvoicePreviewModal from '../components/InvoicePreviewModal';

const PageContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patient, prescriptions } = useConsultation();
  const { caseId } = useParams();
  
  const storageKey = `doctosmart_treatment_${caseId || 'new'}`;
  
  const [plans, setPlans] = useState(() => {
    let data = [];
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            data = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error reading from localStorage", e);
    }

    if (location.state?.diagnoses) {
        // Auto import diagnoses that have recommended treatments and aren't already in the plan
        const imported = location.state.diagnoses
            .filter(d => d.treatment && d.treatment.trim() !== '')
            .map(d => ({
                id: d.id,
                tooth: d.tooth,
                diagnosis: d.category,
                procedure: d.treatment,
                surface: d.surfaces,
                priority: d.priority || 'Routine',
                cost: '',
                visits: 1,
                status: 'Planned',
                notes: d.notes || '',
                description: d.examination || ''
            }));
        
        const merged = [...data];
        imported.forEach(imp => {
            if (!merged.find(m => m.id === imp.id)) {
                merged.push(imp);
            }
        });
        return merged;
    }
    
    return data;
  });

  // Save to local storage whenever plans change
  React.useEffect(() => {
      try {
          localStorage.setItem(storageKey, JSON.stringify(plans));
      } catch (e) {
          console.error("Error saving plans", e);
      }
  }, [plans, storageKey]);

  // Drawer Form State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [drawerForm, setDrawerForm] = useState({
      id: '', tooth: '', diagnosis: '', procedure: '', surface: 'All', 
      description: '', priority: 'Routine', cost: '', discount: '', finalAmount: '',
      duration: '', visits: 1, status: 'Proposed', notes: ''
  });
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);

  const handleFormChange = (field, value) => {
      setDrawerForm(prev => {
          const next = { ...prev, [field]: value };
          if (field === 'cost' || field === 'discount') {
              const c = parseFloat(next.cost) || 0;
              const d = parseFloat(next.discount) || 0;
              next.finalAmount = Math.max(0, c - d).toFixed(2);
          }
          return next;
      });
  };

  const openDrawer = (plan = null) => {
      if (plan) {
          setActivePlan(plan.id);
          setDrawerForm(plan);
      } else {
          setActivePlan(null);
          setDrawerForm({
              id: Date.now(), tooth: '', diagnosis: '', procedure: '', surface: 'All', 
              description: '', priority: 'Routine', cost: '', discount: '', finalAmount: '',
              duration: '', visits: 1, status: 'Proposed', notes: ''
          });
      }
      setDrawerOpen(true);
  };

  const saveDrawerForm = () => {
      if (!drawerForm.tooth || !drawerForm.procedure) {
          alert("Tooth and Procedure are required");
          return;
      }
      if (activePlan) {
          setPlans(plans.map(p => p.id === activePlan ? drawerForm : p));
      } else {
          setPlans([...plans, { ...drawerForm, id: Date.now() }]);
      }
      setDrawerOpen(false);
  };

  const removePlan = (id) => {
      setPlans(plans.filter(p => p.id !== id));
  };

  const updateStatus = (id, newStatus) => {
      setPlans(plans.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const columns = [
    { id: 'Planned', title: 'Treatment Plan', color: '#fef3c7', textColor: '#d97706' },
    { id: 'In Progress', title: 'In Progress', color: '#e0e7ff', textColor: '#4338ca' },
    { id: 'Completed', title: 'Completed', color: '#dcfce3', textColor: '#15803d' }
  ];


  return (
    <div className={styles.pageWrapper}>
      <div className={styles.mainArea}>
        <TopHeader hidePatientHeader={true} />
        
        {/* Stepper */}
        <div className={styles.stepperContainer} style={{ padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: '500', marginRight: '0.5rem', cursor: 'pointer' }} onClick={() => navigate(-1)}>✓ Case Sheet</div>
          <div style={{ height: '2px', width: '20px', background: '#10b981', marginRight: '0.5rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: '500', marginRight: '0.5rem', cursor: 'pointer' }} onClick={() => navigate(-1)}>✓ Dental Chart</div>
          <div style={{ height: '2px', width: '20px', background: '#10b981', marginRight: '0.5rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: '500', marginRight: '0.5rem', cursor: 'pointer' }} onClick={() => navigate(-1)}>✓ Diagnosis</div>
          <div style={{ height: '2px', width: '20px', background: '#10b981', marginRight: '0.5rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', color: '#0f172a', fontWeight: '600', marginRight: '0.5rem' }}>● Treatment Plan</div>
          <div style={{ height: '2px', width: '20px', background: '#e2e8f0', marginRight: '0.5rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', marginRight: '0.5rem' }}>○ Consent</div>
          <div style={{ height: '2px', width: '20px', background: '#e2e8f0', marginRight: '0.5rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', marginRight: '0.5rem' }}>○ Treatment</div>
          <div style={{ height: '2px', width: '20px', background: '#e2e8f0', marginRight: '0.5rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>○ Billing</div>
        </div>

        <div className={styles.scrollContainer}>

          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.headerTitle}>Treatment Plans</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className={styles.btnSecondary}>Save Draft</button>
                <button className={styles.btnSecondary} onClick={() => navigate(-1)}>Back to Diagnosis</button>
                <button className={styles.btnPrimary} onClick={() => openDrawer()}>+ Add Treatment</button>
                <button className={styles.btnPrimary} onClick={() => setIsInvoicePreviewOpen(true)} style={{backgroundColor: '#10b981'}}>Continue</button>
              </div>
            </div>

            <div className={styles.kanbanBoard}>
              {columns.map(col => (
                <div key={col.id} className={styles.kanbanColumn}>
                  <div className={styles.kanbanColumnHeader} style={{ backgroundColor: col.color, color: col.textColor }}>
                    {col.title} 
                    <span className={styles.kanbanCount}>
                      {plans.filter(p => (p.status === col.id || (col.id === 'Planned' && (p.status === 'Proposed' || p.status === 'Pending Patient Approval')))).length}
                    </span>
                  </div>
                  <div className={styles.kanbanColumnBody}>
                    {plans.filter(p => (p.status === col.id || (col.id === 'Planned' && (p.status === 'Proposed' || p.status === 'Pending Patient Approval')))).map(p => (
                       <div key={p.id} className={styles.kanbanCard}>
                          <div className={styles.cardHeader} style={{display: 'block', marginBottom: '0'}}>
                              <div className={styles.cardDate}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              
                              <div className={styles.cardRow}>
                                <div className={styles.cardCol}>
                                  <span className={styles.cardLabel}>Teeth</span>
                                  <div className={styles.cardValue}>
                                      <img src={`/${parseInt(p.tooth) >= 11 ? 'molar' : 'incisor'}.png`} alt="tooth" className={styles.cardToothImg} />
                                      {p.tooth}
                                  </div>
                                </div>
                                <div className={styles.cardCol}>
                                  <span className={styles.cardLabel}>Diagnosis</span>
                                  <div className={styles.cardValue}>{p.diagnosis || '-'}</div>
                                </div>
                              </div>
                              
                              <div className={styles.cardRow}>
                                <div className={styles.cardCol} style={{flex: 2}}>
                                  <span className={styles.cardLabel}>Treatment Name</span>
                                  <div className={styles.cardValue}>{p.procedure || '-'}</div>
                                </div>
                                <div className={styles.cardCol} style={{flex: 1}}>
                                  <span className={styles.cardLabel}>Qty</span>
                                  <div className={styles.cardValue}>
                                    <select className={styles.cardQtySelect} defaultValue="1">
                                      <option value="1">1</option>
                                      <option value="2">2</option>
                                      <option value="3">3</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                              
                              <div className={styles.cardRow} style={{marginBottom: 0}}>
                                <div className={styles.cardCol}>
                                  <span className={styles.cardLabel}>Item Price</span>
                                  <div className={styles.cardValue}>₹{p.cost || '400'} <span style={{fontSize: '0.7rem', color: '#94a3b8', cursor: 'pointer'}}>✎</span></div>
                                </div>
                                <div className={styles.cardCol}>
                                  <span className={styles.cardLabel}>Total</span>
                                  <div className={styles.cardValue}>₹{p.finalAmount || p.cost || '400'}</div>
                                </div>
                                <div className={styles.cardCol}>
                                  <span className={styles.cardLabel}>Doctor</span>
                                  <div className={styles.cardValue}>Arjun</div>
                                </div>
                              </div>
                          </div>
                          
                          <div className={styles.cardFooter} style={{ flexWrap: 'wrap' }}>
                              <button className={styles.btnSecondaryAction} onClick={() => setIsNotesModalOpen(true)}>Consultation Notes</button>
                              <button className={styles.btnSecondaryAction} onClick={() => setIsPrescriptionModalOpen(true)}>Medications</button>
                              
                              {col.id === 'In Progress' && (
                                  <button className={styles.btnSecondaryAction} onClick={() => openDrawer(p)}>Edit Procedure</button>
                              )}
                              
                              {(col.id === 'Planned' || col.id === 'In Progress') && (
                                  <button className={styles.btnSecondaryAction} onClick={() => updateStatus(p.id, 'Completed')}>Mark as completed</button>
                              )}

                              {col.id === 'Planned' && (
                                  <button className={styles.btnSecondaryAction} onClick={() => updateStatus(p.id, 'In Progress')}>Move to in process</button>
                              )}
                          </div>
                          <button className={styles.btnDelete} onClick={() => removePlan(p.id)}>
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                             Delete Treatment
                          </button>
                       </div>
                    ))}
                    {plans.filter(p => (p.status === col.id || (col.id === 'Planned' && (p.status === 'Proposed' || p.status === 'Pending Patient Approval')))).length === 0 && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', marginTop: '2rem' }}>
                          No treatments
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <MedicationsSection />
        </div>
      </div>

      {drawerOpen && (
        <div className={styles.drawerOverlay}>
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Add Treatment</h3>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24}/></button>
            </div>
            
            <div className={styles.drawerBody}>
              <div className={styles.drawerGrid}>
                <div>
                  <label className={styles.drawerLabel}>Tooth Number</label>
                  <input type="text" className={styles.drawerInput} placeholder="e.g. 36" value={drawerForm.tooth} onChange={e => handleFormChange('tooth', e.target.value)} />
                </div>
                <div>
                  <label className={styles.drawerLabel}>Diagnosis</label>
                  <input type="text" className={styles.drawerInput} placeholder="e.g. Pulpitis" value={drawerForm.diagnosis} onChange={e => handleFormChange('diagnosis', e.target.value)} />
                </div>
              </div>

              <div className={styles.drawerGrid}>
                  <div>
                    <label className={styles.drawerLabel}>Procedure / Treatment</label>
                    <input type="text" className={styles.drawerInput} placeholder="Search procedure..." value={drawerForm.procedure} onChange={e => handleFormChange('procedure', e.target.value)} />
                  </div>
                  <div>
                    <label className={styles.drawerLabel}>Surface</label>
                    <input type="text" className={styles.drawerInput} placeholder="e.g. MO" value={drawerForm.surface} onChange={e => handleFormChange('surface', e.target.value)} />
                  </div>
              </div>
              
              <div>
                <label className={styles.drawerLabel}>Description</label>
                <input type="text" className={styles.drawerInput} placeholder="Brief clinical description of the plan..." value={drawerForm.description} onChange={e => handleFormChange('description', e.target.value)} />
              </div>
              
              <div className={styles.drawerGrid}>
                <div>
                  <label className={styles.drawerLabel}>Estimated Cost ($)</label>
                  <input type="number" className={styles.drawerInput} placeholder="0.00" value={drawerForm.cost} onChange={e => handleFormChange('cost', e.target.value)} />
                </div>
                <div>
                  <label className={styles.drawerLabel}>Discount ($)</label>
                  <input type="number" className={styles.drawerInput} placeholder="0.00" value={drawerForm.discount} onChange={e => handleFormChange('discount', e.target.value)} />
                </div>
              </div>

              <div className={styles.drawerGrid}>
                <div>
                  <label className={styles.drawerLabel}>Final Amount ($)</label>
                  <input type="number" className={styles.drawerInput} value={drawerForm.finalAmount} disabled style={{ background: '#f8fafc', fontWeight: 'bold' }} />
                </div>
                <div>
                  <label className={styles.drawerLabel}>Priority</label>
                  <select className={styles.drawerSelect} value={drawerForm.priority} onChange={e => handleFormChange('priority', e.target.value)}>
                    <option>Urgent</option>
                    <option>High</option>
                    <option>Routine</option>
                    <option>Elective</option>
                  </select>
                </div>
              </div>

              <div className={styles.drawerGrid}>
                <div>
                  <label className={styles.drawerLabel}>Expected Duration</label>
                  <input type="text" className={styles.drawerInput} placeholder="e.g. 45 mins" value={drawerForm.duration} onChange={e => handleFormChange('duration', e.target.value)} />
                </div>
                <div>
                  <label className={styles.drawerLabel}>Number of Visits</label>
                  <input type="number" className={styles.drawerInput} defaultValue="1" value={drawerForm.visits} onChange={e => handleFormChange('visits', e.target.value)} />
                </div>
              </div>

              <div className={styles.drawerGrid}>
                <div>
                  <label className={styles.drawerLabel}>Status</label>
                  <select className={styles.drawerSelect} value={drawerForm.status} onChange={e => handleFormChange('status', e.target.value)}>
                    <option>Proposed</option>
                    <option>Pending Patient Approval</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                <input type="checkbox" /> Appointment Required
              </label>

              <div>
                <label className={styles.drawerLabel}>Treatment Notes</label>
                <textarea className={styles.drawerTextarea} rows="3" placeholder="Additional instructions..." value={drawerForm.notes} onChange={e => handleFormChange('notes', e.target.value)}></textarea>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button className={styles.btnSecondary} onClick={() => setDrawerOpen(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={saveDrawerForm}>Save Treatment</button>
            </div>
          </div>
        </div>
      )}
      
      {isNotesModalOpen && (
          <ClinicalNotesModal 
              onClose={() => setIsNotesModalOpen(false)}
              patientId={patient?.id || 'NEW'}
              patientName={patient?.name || 'Walk-in Patient'}
              appointmentId={caseId || 'NEW'}
              notesOnly={true}
          />
      )}
      
      {isPrescriptionModalOpen && (
          <PrescriptionModal 
              onClose={() => setIsPrescriptionModalOpen(false)}
              patientId={patient?.id || 'NEW'}
              patientName={patient?.name || 'Walk-in Patient'}
              appointmentId={caseId || 'NEW'}
              initialTab="medicines"
          />
      )}
      
      {isInvoicePreviewOpen && (
          <InvoicePreviewModal 
              plans={plans}
              medicines={prescriptions}
              patientName={patient?.name || 'Walk-in Patient'}
              onClose={() => setIsInvoicePreviewOpen(false)}
          />
      )}
    </div>
  );
};

const TreatmentPlansPage = () => {
  return (
    <ConsultationProvider>
      <PageContent />
    </ConsultationProvider>
  );
};

export default TreatmentPlansPage;
