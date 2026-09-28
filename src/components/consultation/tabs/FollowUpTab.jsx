import React from 'react';
import styles from '../../../pages/ConsultationWorkspace.module.css';

const FollowUpTab = () => {
  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem' }}>
      <div className={styles.card} style={{ flex: 1 }}>
        <h4 className={styles.headerTitle}>Schedule Next Visit</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Date & Time</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <input type="date" style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="time" style={{ width: '150px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>
          
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Procedure for Next Visit</label>
            <input type="text" placeholder="e.g., Crown preparation" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Instructions for Patient</label>
            <textarea rows="3" placeholder="Any specific instructions before next visit..." style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.25rem' }}></textarea>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155', display: 'block', marginBottom: '0.5rem' }}>Reminders</label>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><input type="checkbox" defaultChecked /> SMS</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><input type="checkbox" defaultChecked /> WhatsApp</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><input type="checkbox" /> Email</label>
            </div>
          </div>

          <button className={styles.btnPrimary} style={{ alignSelf: 'flex-start' }}>Book Appointment</button>
        </div>
      </div>
      
      <div className={styles.card} style={{ width: '320px', backgroundColor: '#f8fafc' }}>
        <h4 className={styles.headerTitle}>Upcoming Appointments</h4>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #14b8a6' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>Nov 15, 2023 at 10:00 AM</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Crown Placement - Tooth 36</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}>Reschedule</button>
            <button style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowUpTab;
