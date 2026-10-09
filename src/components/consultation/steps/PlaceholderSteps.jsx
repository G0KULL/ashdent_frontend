import React from 'react';

const PlaceholderStep = ({ title, description, icon }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '4rem 2rem',
      textAlign: 'center',
      border: '1px dashed #cbd5e1',
      color: '#64748b',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      width: '100%',
      flex: 1
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        background: '#f8fafc',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem'
      }}>
        {icon || '🚧'}
      </div>
      <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>{title}</h2>
      <p style={{ maxWidth: '400px', margin: '0 auto' }}>{description}</p>
    </div>
  );
};

export const PeriodontalChartStep = () => (
  <PlaceholderStep 
    title="Periodontal Chart" 
    description="This step will allow recording of pocket depths, recession, mobility, and furcation involvement."
    icon="🦷"
  />
);

export const TreatmentReviewStep = () => (
  <PlaceholderStep 
    title="Treatment Review & Patient Consent" 
    description="Review proposed treatments, discuss risks and alternatives, and capture digital patient consent."
    icon="✍️"
  />
);

export const TreatmentSchedulingStep = () => (
  <PlaceholderStep 
    title="Treatment Scheduling" 
    description="Schedule the required visits for the accepted treatment plan."
    icon="📅"
  />
);

export const TreatmentVisitStep = () => (
  <PlaceholderStep 
    title="Treatment Visit Execution" 
    description="Record procedures performed, materials used, anesthesia, and attach post-op RVGs."
    icon="⚕️"
  />
);

export const BillingStep = () => (
  <PlaceholderStep 
    title="Billing & Payment" 
    description="Generate invoices for completed treatments and record payments."
    icon="💳"
  />
);

export const FollowUpStep = () => (
  <PlaceholderStep 
    title="Follow-up & Case History" 
    description="Schedule follow-up appointments and close the case into the patient's history."
    icon="📝"
  />
);
