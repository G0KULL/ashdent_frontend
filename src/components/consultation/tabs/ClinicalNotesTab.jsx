import React from 'react';
import Swal from 'sweetalert2';
import styles from '../../../pages/ConsultationWorkspace.module.css';

const ClinicalNotesTab = () => {
  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 className={styles.headerTitle} style={{ margin: 0 }}>Clinical Notes (SOAP)</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className={styles.btnSecondary} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>🎙️ Voice Note</button>
              <button className={styles.btnSecondary} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Use Template</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>S - Subjective (Chief Complaint)</label>
              <textarea rows="2" defaultValue="Patient reports throbbing pain in lower left posterior region for 3 days." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}></textarea>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>O - Objective (Clinical Findings)</label>
              <textarea rows="2" defaultValue="Deep occlusal caries w/ pulp exposure on 36. Tender on percussion." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}></textarea>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>A - Assessment (Diagnosis)</label>
              <textarea rows="2" defaultValue="Irreversible pulpitis with apical periodontitis - 36." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}></textarea>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>P - Plan (Treatment)</label>
              <textarea rows="2" defaultValue="RCT planned. Access opened, extirpation done. Ca(OH)2 placed. Closed dressing given." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}></textarea>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>Advices / Instructions</label>
              <textarea rows="2" placeholder="General advices (diet, rest, etc.)..." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}></textarea>
            </div>
            
            <button 
              className={styles.btnPrimary} 
              style={{ width: 'fit-content', alignSelf: 'flex-start', marginTop: '0.5rem' }}
              onClick={() => {
                Swal.fire({
                  title: 'Success!',
                  text: 'Clinical notes have been saved.',
                  icon: 'success',
                  confirmButtonText: 'OK',
                  confirmButtonColor: '#14b8a6'
                });
              }}
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className={styles.card}>
          <h4 className={styles.headerTitle} style={{ fontSize: '1rem' }}>Past Notes</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ borderLeft: '3px solid #14b8a6', paddingLeft: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Oct 12, 2023 - Dr. Smith</div>
              <div style={{ fontSize: '0.875rem', color: '#334155' }}>Initial consultation. X-ray advised. Prescribed antibiotics for 3 days to reduce swelling.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalNotesTab;
