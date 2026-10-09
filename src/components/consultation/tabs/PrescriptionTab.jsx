import React from 'react';
import styles from '../../../pages/ConsultationWorkspace.module.css';

const PrescriptionTab = () => {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h4 className={styles.headerTitle} style={{ margin: 0 }}>Prescription</h4>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className={styles.btnSecondary} onClick={() => window.print()}>Print Rx</button>
            <button className={styles.btnPrimary}>+ Add Medicine</button>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '1.5rem' }}>
          <input 
            type="text" 
            placeholder="Search medicine (e.g., Amoxicillin 500mg)..." 
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} 
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Medicine Name</th>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Dosage</th>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Frequency (M-A-N)</th>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Duration</th>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Instructions</th>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Augmentin (Amoxicillin/Clavulanate)', dose: '625mg', freq: '1-0-1', dur: '5 Days', inst: 'After meals' },
              { name: 'Ketorolac (Ketorol DT)', dose: '10mg', freq: '1-0-1', dur: '3 Days', inst: 'After meals, SOS for pain' },
              { name: 'Pantoprazole', dose: '40mg', freq: '1-0-0', dur: '5 Days', inst: 'Empty stomach' }
            ].map((med, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{med.name}</td>
                <td style={{ padding: '1rem', color: '#334155' }}>{med.dose}</td>
                <td style={{ padding: '1rem', fontWeight: '500', color: '#334155' }}>{med.freq}</td>
                <td style={{ padding: '1rem', color: '#334155' }}>{med.dur}</td>
                <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.75rem' }}>{med.inst}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.card}>
        <h4 className={styles.headerTitle} style={{ marginBottom: '1rem' }}>Advices / Instructions</h4>
        <textarea 
          style={{ 
            width: '100%', 
            boxSizing: 'border-box',
            minHeight: '100px', 
            padding: '1rem', 
            borderRadius: '8px', 
            border: '1px solid #cbd5e1', 
            outline: 'none', 
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: '0.875rem'
          }} 
          placeholder="General advices (diet, rest, follow-up instructions)..."
        />
      </div>
    </div>
  );
};

export default PrescriptionTab;
