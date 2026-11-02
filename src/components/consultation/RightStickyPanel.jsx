import React from 'react';
import { useConsultation } from '../../context/ConsultationContext';
import { FileSignature, Stethoscope, Image as ImageIcon, Receipt, CalendarPlus } from 'lucide-react';
import styles from '../../pages/ConsultationWorkspace.module.css';

const RightStickyPanel = () => {
  const { currentCase, patient } = useConsultation();

  return (
    <div style={{ 
      width: '280px', 
      borderLeft: '1px solid #e2e8f0', 
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      overflowY: 'auto'
    }}>
      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 1rem 0' }}>Current Case Status</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Status</div>
          <div style={{ fontWeight: '500', color: '#0f172a' }}>{currentCase.status}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Treatment Progress</div>
          <div style={{ fontWeight: '600', color: '#14b8a6' }}>{currentCase.progress}% Completed</div>
          <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', marginTop: '0.5rem' }}>
            <div style={{ width: `${currentCase.progress}%`, height: '100%', backgroundColor: '#14b8a6' }}></div>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 1rem 0' }}>Today's Procedures</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.875rem' }}>
        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <strong>RCT (Step 2)</strong> - Tooth 36
        </div>
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 1rem 0' }}>Financials</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#991b1b' }}>Outstanding Balance</span>
          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#ef4444' }}>${patient.outstanding.toFixed(2)}</span>
        </div>
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 1rem 0' }}>Next Appointment</h3>
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1rem', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.25rem' }}>Nov 15, 2023 at 10:00 AM</div>
        <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Crown Placement - Tooth 36</div>
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 1rem 0' }}>Quick Actions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[
          { icon: FileSignature, label: 'Write Prescription' },
          { icon: ImageIcon, label: 'Upload RVG' },
          { icon: Stethoscope, label: 'Add Clinical Note' },
          { icon: Receipt, label: 'Generate Invoice' },
          { icon: CalendarPlus, label: 'Schedule Follow-up' }
        ].map((action, idx) => (
          <button key={idx} className={styles.btnSecondary} style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}>
            <action.icon size={16} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RightStickyPanel;
