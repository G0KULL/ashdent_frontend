import React from 'react';
import Swal from 'sweetalert2';
import styles from '../../../pages/ConsultationWorkspace.module.css';

const TodaysVisitTab = () => {
  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h4 className={styles.headerTitle} style={{ margin: 0 }}>Visit Details</h4>
          <button className={styles.btnSecondary} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Upload X-Ray</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Date</label>
            <input type="date" defaultValue="2023-10-20" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Chair Number</label>
            <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}>
              <option>Chair 1</option>
              <option>Chair 2</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Assistant</label>
            <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}>
              <option>Jane Doe</option>
              <option>Mark Smith</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h4 className={styles.headerTitle} style={{ margin: 0 }}>Procedure Done Today</h4>
          <button className={styles.btnSecondary} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Prescription Shortcut</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Procedure Name</label>
            <input type="text" defaultValue="Cleaning and Shaping (Tooth 36)" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }} />
          </div>
          
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Anesthesia</label>
            <input type="text" placeholder="e.g., 2% Lignocaine with 1:80000 Adrenaline (1.8ml)" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Clinical Findings</label>
              <textarea rows="3" placeholder="Enter findings..." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}></textarea>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Treatment Notes</label>
              <textarea rows="3" placeholder="Enter treatment steps..." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}></textarea>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Complications</label>
              <input type="text" placeholder="Any complications during procedure..." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Outcome</label>
              <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}>
                <option>Successful</option>
                <option>Partial Completion</option>
                <option>Re-evaluation needed</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Next Visit Notes</label>
            <input type="text" placeholder="What needs to be done next time..." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Advices / Instructions</label>
            <textarea rows="3" placeholder="General advices (diet, rest, etc.)..." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}></textarea>
          </div>

          <button 
            className={styles.btnPrimary} 
            style={{ width: 'fit-content', alignSelf: 'flex-start', marginTop: '1rem' }}
            onClick={() => {
              Swal.fire({
                title: 'Success!',
                text: 'Visit details and notes have been saved.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#14b8a6'
              });
            }}
          >
            Save Visit
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodaysVisitTab;
