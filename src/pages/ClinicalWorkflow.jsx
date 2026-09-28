import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ClinicalWorkflow.module.css';

// Existing Pages / Components
import NewTreatmentCaseForm from './NewTreatmentCaseForm';
import OdontogramPage from './OdontogramPage';
import DiagnosisStep from '../components/consultation/steps/DiagnosisStep';
import TreatmentPlanStep from '../components/consultation/steps/TreatmentPlanStep';
import { 
  PeriodontalChartStep, TreatmentReviewStep, TreatmentSchedulingStep, 
  TreatmentVisitStep, BillingStep, FollowUpStep 
} from '../components/consultation/steps/PlaceholderSteps';

// The linear flow array
const WORKFLOW_STEPS = [
  { id: 'case-sheet', label: 'Case Sheet', component: NewTreatmentCaseForm },
  { id: 'dental-chart', label: 'Dental Chart', component: OdontogramPage },
  { id: 'diagnosis', label: 'Diagnosis', component: DiagnosisStep },
  { id: 'perio-chart', label: 'Periodontal Chart', component: PeriodontalChartStep },
  { id: 'treatment-plan', label: 'Treatment Plan', component: TreatmentPlanStep },
  { id: 'review-consent', label: 'Patient Consent', component: TreatmentReviewStep },
  { id: 'scheduling', label: 'Scheduling', component: TreatmentSchedulingStep },
  { id: 'visit', label: 'Treatment Visit', component: TreatmentVisitStep },
  { id: 'billing', label: 'Billing', component: BillingStep },
  { id: 'follow-up', label: 'Follow-Up', component: FollowUpStep }
];

export default function ClinicalWorkflow() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const currentStep = WORKFLOW_STEPS[currentStepIndex];
  const StepComponent = currentStep.component;

  const handleNext = () => {
    if (currentStepIndex < WORKFLOW_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSaveDraft = () => {
    alert("Draft saved successfully.");
  };

  return (
    <div className={styles.workflowWrapper}>
      
      {/* Top Header / Stepper */}
      <div className={styles.workflowHeader}>
        <div className={styles.workflowTitle}>Case #{caseId || 'NEW'} Workflow</div>
        <div className={styles.stepperContainer}>
          {WORKFLOW_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            return (
              <React.Fragment key={step.id}>
                <div 
                  className={`${styles.stepIndicator} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}
                  onClick={() => setCurrentStepIndex(index)}
                >
                  <div className={styles.stepNumber}>{isCompleted ? '✓' : (index + 1)}</div>
                  {step.label}
                </div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className={`${styles.stepDivider} ${isCompleted ? styles.completed : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.workflowContent}>
        {/* We render the component. Note: we might need to pass props to them to hide their own bottom bars if they have them. */}
        <StepComponent isWorkflowStep={true} />
      </div>

      {/* Master Bottom Action Bar */}
      <div className={styles.bottomBar}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={styles.btnSecondary} onClick={() => navigate(-1)} style={{ color: '#ef4444', borderColor: '#fca5a5' }}>Close Workflow</button>
          <button className={styles.btnSecondary} onClick={handleSaveDraft}>Save Progress</button>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={styles.btnSecondary} 
            onClick={handlePrev} 
            disabled={currentStepIndex === 0}
          >
            Previous
          </button>
          
          {currentStepIndex < WORKFLOW_STEPS.length - 1 ? (
            <button className={styles.btnPrimary} onClick={handleNext}>
              Next: {WORKFLOW_STEPS[currentStepIndex + 1].label}
            </button>
          ) : (
            <button className={styles.btnPrimary} style={{ background: '#10b981' }} onClick={() => navigate('/doctor/dashboard')}>
              Complete Case
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
