import React from 'react';
import { useConsultation } from '../../context/ConsultationContext';
import styles from '../../pages/ConsultationWorkspace.module.css';

const CaseHeader = () => {
  const { currentCase } = useConsultation();

  return (
    <div className={styles.card} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Current Treatment Case</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{currentCase.name}</h3>
          <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>
            Tooth {currentCase.tooth}
          </span>
          <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
            {currentCase.status}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
          <span>Started: <strong style={{ color: '#334155' }}>{currentCase.startedOn}</strong></span>
          <span>Est. Completion: <strong style={{ color: '#334155' }}>{currentCase.estimatedCompletion}</strong></span>
          <span>Case ID: <strong style={{ color: '#334155' }}>{currentCase.id}</strong></span>
        </div>
      </div>
      
      <div style={{ width: '200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>
          <span>Treatment Progress</span>
          <span>{currentCase.progress}%</span>
        </div>
        <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ width: `${currentCase.progress}%`, height: '100%', backgroundColor: '#14b8a6', borderRadius: '9999px' }}></div>
        </div>
      </div>
    </div>
  );
};

export default CaseHeader;
