import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import styles from './TreatmentPlansPage.module.css';
import { ConsultationProvider, useConsultation } from '../context/ConsultationContext';
import { usePatients } from '../context/PatientContext';
import TopHeader from '../components/consultation/TopHeader';
import { X, LayoutList, LayoutGrid, Edit2, Trash2, FileText, Pill } from 'lucide-react';
import ClinicalNotesModal from '../components/ClinicalNotesModal';
import PrescriptionModal from '../components/PrescriptionModal';
import MedicationsSection from '../components/MedicationsSection';
import InvestigationsSection from '../components/investigations/InvestigationsSection';
import EstimateModal from '../components/EstimateModal';
import ClinicalCombobox from '../components/ClinicalCombobox';

const PageContent = ({ defaultFilter: propDefaultFilter }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patient, prescriptions } = useConsultation();
  const { caseId: paramCaseId } = useParams();
  const { activePatient } = usePatients();
  
  const caseId = paramCaseId || location.state?.patientId || activePatient?.id || 'new';
  const storageKey = `ashdent_treatment_${caseId}`;
  const [assignedDoctor, setAssignedDoctor] = useState(location.state?.doctorName || '');
  const [assignedDoctorId, setAssignedDoctorId] = useState(location.state?.doctorId || null);
  const [planId, setPlanId] = useState(null);
  
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

  // View switcher & filter state (Strategy 1: Dual-Mode Switcher)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('ashdent_treatment_view_mode') || 'table';
    } catch (e) {
      return 'table';
    }
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('ashdent_treatment_view_mode', mode);
    } catch (e) {}
  };

  const initialFilter = location.state?.defaultFilter || location.state?.filter || propDefaultFilter || 'All';
  const [tableFilter, setTableFilter] = useState(initialFilter);

  const getNormalizedStatus = (status) => {
    if (status === 'Proposed' || status === 'Pending Patient Approval' || !status) return 'Planned';
    return status;
  };

  const filteredPlans = useMemo(() => {
    if (tableFilter === 'All') return plans;
    return plans.filter(p => getNormalizedStatus(p.status) === tableFilter);
  }, [plans, tableFilter]);

  const planCounts = useMemo(() => {
    const planned = plans.filter(p => getNormalizedStatus(p.status) === 'Planned').length;
    const inProgress = plans.filter(p => getNormalizedStatus(p.status) === 'In Progress').length;
    const completed = plans.filter(p => getNormalizedStatus(p.status) === 'Completed').length;
    return { all: plans.length, planned, inProgress, completed };
  }, [plans]);

  const totalEstimatedCost = useMemo(() => {
    return filteredPlans.reduce((sum, p) => sum + (parseFloat(p.finalAmount || p.cost || 400) || 0), 0);
  }, [filteredPlans]);

  // Helper to persist plans to backend database with deduplication
  const savePlansToBackend = React.useCallback(async (plansToSave) => {
    if (!caseId || caseId === 'new') return;
    try {
      const user = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}');
      const headers = { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };
      
      const uniqueItems = [];
      const seen = new Set();
      (plansToSave || []).forEach(p => {
        const k = `${p.tooth || ''}_${(p.procedure || '').toLowerCase().trim()}_${(p.surface || 'All').toLowerCase().trim()}`;
        if (!seen.has(k)) {
          seen.add(k);
          uniqueItems.push(p);
        }
      });

      const res = await fetch(`http://127.0.0.1:8000/api/patients/${caseId}/treatment-plans/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          plan_id: planId || undefined,
          title: 'Comprehensive Dental Treatment Plan',
          status: 'Proposed',
          doctor_id: assignedDoctorId || location.state?.doctorId || null,
          items: uniqueItems
        })
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.plan_id) setPlanId(resData.plan_id);
      }
    } catch (err) {
      console.warn("Could not persist treatment plan to backend:", err);
    }
  }, [caseId, planId, assignedDoctorId, location.state]);

  // Load persistent plans from database on mount (primary plan only to prevent duplication loop)
  React.useEffect(() => {
    if (!caseId || caseId === 'new') return;
    fetch(`http://127.0.0.1:8000/api/patients/${caseId}/treatment-plans/`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const primaryPlan = data[0];
          setPlanId(primaryPlan.id);
          const firstDoc = primaryPlan.doctor_name || primaryPlan.doctor;
          if (firstDoc && firstDoc !== 'Doctor not assigned') {
            setAssignedDoctor(firstDoc);
            if (primaryPlan.doctor_id) setAssignedDoctorId(primaryPlan.doctor_id);
          }
          const rawItems = primaryPlan.items || [];
          const dedupedItems = [];
          const seen = new Set();
          rawItems.forEach(it => {
            const k = `${it.tooth_number || it.tooth || ''}_${(it.procedure_name || it.procedure || '').toLowerCase().trim()}`;
            if (!seen.has(k)) {
              seen.add(k);
              dedupedItems.push({
                id: it.id,
                tooth: it.tooth_number || it.tooth,
                diagnosis: it.diagnosis,
                procedure: it.procedure_name || it.procedure,
                surface: it.surface || 'All',
                priority: it.priority || 'Routine',
                cost: it.cost || it.estimated_cost || '',
                finalAmount: it.finalAmount || it.final_cost || '',
                visits: it.visits || it.estimated_visits || 1,
                status: it.status || 'Planned',
                doctor: it.doctor || it.doctor_name || primaryPlan.doctor_name || primaryPlan.doctor || '',
                notes: it.notes || '',
                description: it.description || ''
              });
            }
          });
          if (dedupedItems.length > 0) {
            setPlans(dedupedItems);
          }
        }
      })
      .catch(err => console.warn("Could not load backend treatment plans:", err));
  }, [caseId]);

  // Load assigned doctor from patient profile or latest appointment
  React.useEffect(() => {
    if (!caseId || caseId === 'new') return;
    fetch(`http://127.0.0.1:8000/api/patient/${caseId}/profile/`)
      .then(r => r.ok ? r.json() : null)
      .then(prof => {
        if (!prof) return;
        if (prof.patient?.doctor_name) {
          setAssignedDoctor(prof.patient.doctor_name);
          if (prof.patient.doctor) setAssignedDoctorId(prof.patient.doctor);
        } else if (prof.appointments?.length > 0 && prof.appointments[0].doctor_name) {
          setAssignedDoctor(prof.appointments[0].doctor_name);
          if (prof.appointments[0].doctor) setAssignedDoctorId(prof.appointments[0].doctor);
        }
      })
      .catch(() => {});
  }, [caseId]);


  // Save to local storage and sync to backend database whenever plans change
  React.useEffect(() => {
      try {
          localStorage.setItem(storageKey, JSON.stringify(plans));
      } catch (e) {
          console.error("Error saving plans", e);
      }
      if (plans.length > 0) {
        savePlansToBackend(plans);
      }
  }, [plans, storageKey, savePlansToBackend]);

  // Master Catalogues (Backed by Clinical Masters API)
  const [treatmentOptions, setTreatmentOptions] = useState([]);
  const [diagnosisOptions, setDiagnosisOptions] = useState([]);

  React.useEffect(() => {
    Promise.all([
      fetch('http://127.0.0.1:8000/api/masters/treatments/?active_only=true').then(r => r.ok ? r.json() : []),
      fetch('http://127.0.0.1:8000/api/masters/diagnoses/?active_only=true').then(r => r.ok ? r.json() : [])
    ]).then(([txData, dxData]) => {
      if (Array.isArray(txData)) setTreatmentOptions(txData.map(t => t.name));
      if (Array.isArray(dxData)) setDiagnosisOptions(dxData.map(d => d.name));
    }).catch(err => console.warn("Could not load masters for treatment plans:", err));
  }, []);

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
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);

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
          setDrawerForm({
              id: plan.id,
              tooth: plan.tooth || '',
              diagnosis: plan.diagnosis || '',
              procedure: plan.procedure || '',
              surface: plan.surface || 'All',
              description: plan.description || '',
              priority: plan.priority || 'Routine',
              cost: plan.cost ?? '',
              discount: plan.discount ?? '',
              finalAmount: plan.finalAmount ?? '',
              duration: plan.duration || '',
              visits: plan.visits ?? 1,
              status: plan.status || 'Proposed',
              notes: plan.notes || ''
          });
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

  const saveDrawerForm = async () => {
      if (!drawerForm.tooth || !drawerForm.procedure) {
          alert("Tooth and Procedure are required");
          return;
      }

      let updatedProcedure = drawerForm.procedure;
      let updatedDiagnosis = drawerForm.diagnosis;

      try {
          const payload = {};
          if (drawerForm.procedure && drawerForm.procedure.trim()) payload.treatment = drawerForm.procedure.trim();
          if (drawerForm.diagnosis && drawerForm.diagnosis.trim()) payload.diagnosis = drawerForm.diagnosis.trim();
          if (drawerForm.cost) payload.price = parseFloat(drawerForm.cost) || 0.0;

          const res = await fetch('http://127.0.0.1:8000/api/masters/resolve-treatment-masters/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (res.ok) {
              const data = await res.json();
              if (data.resolved?.treatment?.name) updatedProcedure = data.resolved.treatment.name;
              if (data.resolved?.diagnosis?.name) updatedDiagnosis = data.resolved.diagnosis.name;
              if (data.catalogues) {
                  if (data.catalogues.treatments?.length) setTreatmentOptions(data.catalogues.treatments);
                  if (data.catalogues.diagnoses?.length) setDiagnosisOptions(data.catalogues.diagnoses);
              }
          }
      } catch (err) {
          console.warn("Could not auto-create masters in TreatmentPlansPage, proceeding with form values:", err);
      }

      const formToSave = {
          ...drawerForm,
          procedure: updatedProcedure,
          diagnosis: updatedDiagnosis
      };

      if (activePlan) {
          setPlans(plans.map(p => p.id === activePlan ? formToSave : p));
      } else {
          setPlans([...plans, { ...formToSave, id: Date.now() }]);
      }
      setDrawerOpen(false);
  };

  const removePlan = (id) => {
      setPlans(plans.filter(p => p.id !== id));
  };

  const updateStatus = async (id, newStatus) => {
      const updated = plans.map(p => p.id === id ? { ...p, status: newStatus } : p);
      setPlans(updated);
      if (caseId && caseId !== 'new') {
        try {
          const isRealDbId = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
          if (isRealDbId) {
            if (newStatus === 'Completed') {
              await fetch(`http://127.0.0.1:8000/api/treatment-plan-items/${id}/convert-to-treatment/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: 'Completed',
                  doctor_id: assignedDoctorId || location.state?.doctorId || null
                })
              });
            } else {
              await fetch(`http://127.0.0.1:8000/api/treatment-plan-items/${id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
              });
            }
          } else {
            savePlansToBackend(updated);
          }
        } catch (e) {
          console.warn("Could not sync item status to backend:", e);
        }
      }
  };

  const columns = [
    { id: 'Planned', title: 'Treatment Plan', color: '#fef3c7', textColor: '#d97706' },
    { id: 'In Progress', title: 'In Progress', color: '#e0e7ff', textColor: '#4338ca' },
    { id: 'Completed', title: 'Completed', color: '#dcfce3', textColor: '#15803d' }
  ];


  return (
    <div className={styles.pageWrapper}>
      <div className={styles.mainArea}>
        <TopHeader hidePatientHeader={true} doctorName={assignedDoctor} />
        
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <h2 className={styles.headerTitle}>Treatment Plans</h2>
                <div className={styles.viewSwitcher}>
                  <button 
                    type="button"
                    className={`${styles.switcherBtn} ${viewMode === 'table' ? styles.switcherBtnActive : ''}`}
                    onClick={() => handleViewModeChange('table')}
                    title="Compact Clinical Table View"
                  >
                    <LayoutList size={15} />
                    <span>Compact Table</span>
                  </button>
                  <button 
                    type="button"
                    className={`${styles.switcherBtn} ${viewMode === 'kanban' ? styles.switcherBtnActive : ''}`}
                    onClick={() => handleViewModeChange('kanban')}
                    title="Kanban Board View"
                  >
                    <LayoutGrid size={15} />
                    <span>Kanban Cards</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className={styles.btnSecondary}>Save Draft</button>
                <button className={styles.btnSecondary} onClick={() => navigate(-1)}>Back to Diagnosis</button>
                <button className={styles.btnPrimary} onClick={() => openDrawer()}>+ Add Treatment</button>
                <button className={styles.btnPrimary} onClick={() => setIsEstimateModalOpen(true)} style={{backgroundColor: '#10b981'}}>Continue</button>
              </div>
            </div>

            {viewMode === 'table' ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className={styles.tableToolbar}>
                  <div className={styles.filterTabs}>
                    <button 
                      type="button" 
                      className={`${styles.filterTab} ${tableFilter === 'All' ? styles.filterTabActive : ''}`}
                      onClick={() => setTableFilter('All')}
                    >
                      All <span className={styles.filterTabCount}>{planCounts.all}</span>
                    </button>
                    <button 
                      type="button" 
                      className={`${styles.filterTab} ${tableFilter === 'Planned' ? styles.filterTabActive : ''}`}
                      onClick={() => setTableFilter('Planned')}
                    >
                      Treatment Plan <span className={styles.filterTabCount}>{planCounts.planned}</span>
                    </button>
                    <button 
                      type="button" 
                      className={`${styles.filterTab} ${tableFilter === 'In Progress' ? styles.filterTabActive : ''}`}
                      onClick={() => setTableFilter('In Progress')}
                    >
                      In Progress <span className={styles.filterTabCount}>{planCounts.inProgress}</span>
                    </button>
                    <button 
                      type="button" 
                      className={`${styles.filterTab} ${tableFilter === 'Completed' ? styles.filterTabActive : ''}`}
                      onClick={() => setTableFilter('Completed')}
                    >
                      Completed <span className={styles.filterTabCount}>{planCounts.completed}</span>
                    </button>
                  </div>

                  <div className={styles.summaryMeta}>
                    <span>Procedures: <strong>{filteredPlans.length}</strong></span>
                    <span>Total Estimate: <strong>₹{totalEstimatedCost.toFixed(2)}</strong></span>
                  </div>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.clinicalTable}>
                    <thead>
                      <tr>
                        <th className={styles.clinicalTh} style={{ width: '40px', textAlign: 'center' }}>#</th>
                        <th className={styles.clinicalTh} style={{ width: '110px' }}>Tooth</th>
                        <th className={styles.clinicalTh}>Treatment / Procedure</th>
                        <th className={styles.clinicalTh}>Diagnosis</th>
                        <th className={styles.clinicalTh} style={{ width: '60px', textAlign: 'center' }}>Qty</th>
                        <th className={styles.clinicalTh} style={{ width: '110px' }}>Rate (₹)</th>
                        <th className={styles.clinicalTh} style={{ width: '110px' }}>Total (₹)</th>
                        <th className={styles.clinicalTh}>Doctor</th>
                        <th className={styles.clinicalTh} style={{ width: '135px' }}>Status</th>
                        <th className={styles.clinicalTh} style={{ width: '145px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlans.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                            No treatments found for current filter. Click <strong>+ Add Treatment</strong> to add one.
                          </td>
                        </tr>
                      ) : (
                        filteredPlans.map((p, idx) => (
                          <tr key={p.id} className={styles.clinicalTr}>
                            <td className={styles.clinicalTd} style={{ textAlign: 'center', color: '#94a3b8', fontWeight: '500' }}>
                              {idx + 1}
                            </td>
                            <td className={styles.clinicalTd}>
                              <div className={styles.toothCell}>
                                <img 
                                  src={`/${parseInt(p.tooth) >= 11 ? 'molar' : 'incisor'}.png`} 
                                  alt="tooth" 
                                  className={styles.toothCellImg} 
                                />
                                <span>#{p.tooth}</span>
                              </div>
                            </td>
                            <td className={styles.clinicalTd}>
                              <div style={{ fontWeight: '600', color: '#0f172a' }}>
                                {p.procedure || '-'}
                                {p.surface && p.surface !== 'All' && (
                                  <span className={styles.surfaceBadge}>{p.surface}</span>
                                )}
                              </div>
                            </td>
                            <td className={styles.clinicalTd} style={{ color: '#475569' }}>
                              {p.diagnosis || '-'}
                            </td>
                            <td className={styles.clinicalTd} style={{ textAlign: 'center', fontWeight: '500' }}>
                              1
                            </td>
                            <td className={styles.clinicalTd}>
                              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <span>₹{p.cost || '400'}</span>
                                {p.finalAmount && p.finalAmount !== p.cost && (
                                  <span className={styles.customPriceTag}>Custom</span>
                                )}
                              </div>
                            </td>
                            <td className={styles.clinicalTd} style={{ fontWeight: '600', color: '#0f172a' }}>
                              ₹{p.finalAmount || p.cost || '400'}
                            </td>
                            <td className={styles.clinicalTd} style={{ color: '#475569', fontSize: '0.825rem' }}>
                              {p.doctor || assignedDoctor || 'Doctor not assigned'}
                            </td>
                            <td className={styles.clinicalTd}>
                              <select 
                                value={getNormalizedStatus(p.status)} 
                                onChange={(e) => updateStatus(p.id, e.target.value)} 
                                className={`${styles.statusSelect} ${
                                  getNormalizedStatus(p.status) === 'Completed' 
                                    ? styles.statusCompleted 
                                    : getNormalizedStatus(p.status) === 'In Progress' 
                                      ? styles.statusInProgress 
                                      : styles.statusPlanned
                                }`}
                              >
                                <option value="Planned">Planned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                            <td className={styles.clinicalTd} style={{ textAlign: 'center' }}>
                              <div className={styles.tableActions}>
                                <button 
                                  type="button" 
                                  className={styles.actionIconBtn} 
                                  onClick={() => openDrawer(p)} 
                                  title="Edit procedure and custom price"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button 
                                  type="button" 
                                  className={styles.actionIconBtn} 
                                  onClick={() => setIsNotesModalOpen(true)} 
                                  title="Consultation Notes"
                                >
                                  <FileText size={13} />
                                </button>
                                <button 
                                  type="button" 
                                  className={styles.actionIconBtn} 
                                  onClick={() => setIsPrescriptionModalOpen(true)} 
                                  title="Medications"
                                >
                                  <Pill size={13} />
                                </button>
                                <button 
                                  type="button" 
                                  className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`} 
                                  onClick={() => removePlan(p.id)} 
                                  title="Delete treatment"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
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
                                  <div className={styles.cardValue}>{p.doctor || assignedDoctor || 'Doctor not assigned'}</div>
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
            )}
          </div>
          
          <MedicationsSection patientId={caseId} />
          <InvestigationsSection patient={patient} />
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
                  <label className={styles.drawerLabel}>Tooth Number <strong style={{ color: '#ef4444' }}>*</strong></label>
                  <input type="text" className={styles.drawerInput} placeholder="e.g. 36" value={drawerForm.tooth} onChange={e => handleFormChange('tooth', e.target.value)} />
                </div>
                <div>
                  <ClinicalCombobox
                    label="Diagnosis"
                    value={drawerForm.diagnosis}
                    onChange={val => handleFormChange('diagnosis', val)}
                    options={diagnosisOptions}
                    placeholder="Search or enter diagnosis..."
                    customTypeLabel="Diagnosis"
                  />
                </div>
              </div>

              <div className={styles.drawerGrid}>
                  <div>
                    <ClinicalCombobox
                      label="Procedure / Treatment"
                      value={drawerForm.procedure}
                      onChange={val => handleFormChange('procedure', val)}
                      options={treatmentOptions}
                      placeholder="Search or enter procedure..."
                      customTypeLabel="Treatment Procedure"
                      required={true}
                    />
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
                  <input type="number" className={styles.drawerInput} value={drawerForm.visits ?? 1} onChange={e => handleFormChange('visits', e.target.value)} />
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
              patientId={caseId && caseId !== 'new' ? caseId : (patient?.id || 'NEW')}
              patientName={location.state?.patientName || patient?.name || 'Walk-in Patient'}
              appointmentId={location.state?.appointmentId || (caseId && caseId !== 'new' ? caseId : 'NEW')}
              doctorId={assignedDoctorId || location.state?.doctorId}
              doctorName={assignedDoctor}
              notesOnly={true}
          />
      )}
      
      {isPrescriptionModalOpen && (
          <PrescriptionModal 
              onClose={() => setIsPrescriptionModalOpen(false)}
              patientId={caseId && caseId !== 'new' ? caseId : (patient?.id || 'NEW')}
              patientName={location.state?.patientName || patient?.name || 'Walk-in Patient'}
              appointmentId={location.state?.appointmentId || (caseId && caseId !== 'new' ? caseId : 'NEW')}
              doctorId={assignedDoctorId || location.state?.doctorId}
              doctorName={assignedDoctor}
              initialTab="medicines"
          />
      )}
      
      {isEstimateModalOpen && (
          <EstimateModal 
              patientId={caseId && caseId !== 'new' ? caseId : (patient?.id || 'NEW')}
              patientName={location.state?.patientName || patient?.name || 'Walk-in Patient'}
              doctorId={assignedDoctorId || location.state?.doctorId}
              doctorName={assignedDoctor}
              plans={plans}
              treatmentPlanId={planId}
              onClose={() => setIsEstimateModalOpen(false)}
          />
      )}
    </div>
  );
};

const TreatmentPlansPage = ({ defaultFilter }) => {
  return (
    <ConsultationProvider>
      <PageContent defaultFilter={defaultFilter} />
    </ConsultationProvider>
  );
};

export default TreatmentPlansPage;
