import React from 'react';
import styles from '../../../pages/ConsultationWorkspace.module.css';

const MedicalHistoryTab = () => {
  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className={styles.card}>
        <h4 className={styles.headerTitle}>Medical Conditions & Allergies</h4>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {['Penicillin Allergy', 'Latex Allergy'].map((alert, idx) => (
            <div key={idx} style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600', border: '1px solid #fecaca' }}>
              {alert}
            </div>
          ))}
          <div style={{ backgroundColor: '#f8fafc', color: '#475569', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '500', border: '1px solid #e2e8f0' }}>
            Mild Hypertension
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h4 className={styles.headerTitle}>Vitals (Today)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Blood Pressure', value: '120/80 mmHg' },
            { label: 'Pulse', value: '72 bpm' },
            { label: 'Temperature', value: '98.6 °F' },
            { label: 'Weight', value: '65 kg' }
          ].map((vital, idx) => (
            <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{vital.label}</div>
              <div style={{ fontWeight: '600', color: '#0f172a' }}>{vital.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <h4 className={styles.headerTitle}>Questionnaire</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { question: 'Are you currently taking any medications?', answer: 'Yes - Lisinopril 10mg daily.' },
            { question: 'Have you had any past surgeries?', answer: 'Appendectomy in 2015.' },
            { question: 'Do you smoke or use tobacco?', answer: 'No.' },
            { question: 'Are you pregnant?', answer: 'No.' }
          ].map((item, idx) => (
            <div key={idx}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>{item.question}</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{item.answer}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <h4 className={styles.headerTitle}>Advices</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            No specific advices added yet.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalHistoryTab;
