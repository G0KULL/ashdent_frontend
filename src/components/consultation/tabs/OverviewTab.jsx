import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from '../../../pages/ConsultationWorkspace.module.css';

const OverviewTab = () => {
  const { caseId, appointmentId } = useParams();
  const activeId = caseId || appointmentId;
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeId) {
      const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
      const headers = { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };
      
      fetch(`http://127.0.0.1:8000/api/clinical-notes/${activeId}/`, { headers })
        .then(res => res.json())
        .then(data => {
          setNotes(data);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [activeId]);

  if (loading) return <div style={{ marginTop: '1.5rem' }}>Loading clinical notes...</div>;

  const chiefComplaint = notes?.chief_complaint || notes?.complaints?.join(', ') || 'No chief complaint recorded.';
  const diagnosis = notes?.diagnosis?.join(', ') || 'No diagnosis recorded.';
  const clinicalNotes = notes?.notes || 'No clinical findings recorded.';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
      <div className={styles.card}>
        <h4 className={styles.headerTitle}>Chief Complaint</h4>
        <p style={{ color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {chiefComplaint}
        </p>
      </div>

      <div className={styles.card}>
        <h4 className={styles.headerTitle}>Diagnosis</h4>
        <p style={{ color: '#334155', lineHeight: 1.5 }}>
          {diagnosis}
        </p>
      </div>
      
      <div className={styles.card} style={{ gridColumn: 'span 2' }}>
        <h4 className={styles.headerTitle}>Clinical Findings & Notes</h4>
        <p style={{ color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {clinicalNotes}
        </p>
      </div>

      <div className={styles.card}>
        <h4 className={styles.headerTitle}>Current Procedure</h4>
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontWeight: '600', color: '#0f172a' }}>Root Canal Treatment (Step 2)</div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>Cleaning and Shaping of canals</div>
        </div>
      </div>

      <div className={styles.card}>
        <h4 className={styles.headerTitle}>Next Procedure</h4>
        <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontWeight: '600', color: '#9a3412' }}>Obturation & Post Core</div>
          <div style={{ fontSize: '0.875rem', color: '#c2410c', marginTop: '0.25rem' }}>Planned for next visit.</div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
