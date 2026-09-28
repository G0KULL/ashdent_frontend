import React from 'react';
import styles from '../../../pages/ConsultationWorkspace.module.css';

const InvestigationsTab = () => {
  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className={styles.card} style={{ border: '2px dashed #cbd5e1', backgroundColor: '#f8fafc', textAlign: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ width: '48px', height: '48px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
          <span style={{ fontSize: '1.5rem' }}>📤</span>
        </div>
        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.5rem 0' }}>Upload X-Rays & Scans</h4>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1.5rem 0' }}>Drag and drop IOPA, OPG, CBCT, or Blood Reports here, or click to browse.</p>
        <button className={styles.btnPrimary}>Browse Files</button>
      </div>

      <div className={styles.card}>
        <h4 className={styles.headerTitle}>Recent Uploads</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { type: 'IOPA', date: 'Oct 12, 2023', tooth: '36', ai: 'Apical Radiolucency Detected' },
            { type: 'OPG', date: 'Oct 10, 2023', tooth: 'All', ai: 'Impacted 48' }
          ].map((item, idx) => (
            <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ height: '120px', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                Image Preview
              </div>
              <div style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0f172a' }}>{item.type}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.date}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginBottom: '0.5rem' }}>Tooth: {item.tooth}</div>
                <div style={{ fontSize: '0.75rem', backgroundColor: '#f0fdfa', color: '#0d9488', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #ccfbf1' }}>
                  🤖 AI: {item.ai}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvestigationsTab;
