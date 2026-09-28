import React from 'react';
import styles from '../../pages/ConsultationWorkspace.module.css';

const BottomActionBar = () => {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: '260px', /* Width of sidebar */
      right: 0,
      height: '80px',
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className={styles.btnSecondary}>Save Draft</button>
        <button className={styles.btnSecondary} style={{ color: '#ef4444', borderColor: '#fca5a5' }}>Cancel</button>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className={styles.btnSecondary}>Print Prescription</button>
        <button className={styles.btnSecondary}>Generate Invoice</button>
        <button className={styles.btnPrimary} style={{ backgroundColor: '#3b82f6' }}>Save Visit</button>
        <button className={styles.btnPrimary} style={{ backgroundColor: '#059669' }}>Complete Visit</button>
        <button className={styles.btnPrimary}>Complete Treatment</button>
      </div>
    </div>
  );
};

export default BottomActionBar;
