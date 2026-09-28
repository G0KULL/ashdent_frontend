import React, { useState, useEffect } from 'react';
import styles from './SearchPatient.module.css';

export default function PatientTreatmentHistoryTab({ patientId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
      const headers = { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };
      
      fetch(`http://127.0.0.1:8000/api/patient/${patientId}/treatment-history/`, { headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setHistory(data);
          }
        })
        .catch(err => console.error("Failed to fetch treatment history", err))
        .finally(() => setLoading(false));
    }
  }, [patientId]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading treatment history...</div>;

  return (
    <div className={styles.treatmentsTabBody}>
      <h3 className={styles.sectionTitle}>Treatment History</h3>
      {history.length === 0 ? (
        <div style={{ color: '#64748b', fontStyle: 'italic' }}>No treatment history found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Tooth</th>
                <th>Diagnosis</th>
                <th>Treatment</th>
                <th>Doctor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.tooth_number || '-'}</td>
                  <td>{item.diagnosis?.length > 0 ? item.diagnosis.join(', ') : '-'}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.treatment || '-'}</td>
                  <td>{item.doctor}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${item.status?.toLowerCase() === 'completed' ? styles.statusCompleted : styles.statusPending}`}>
                      {item.status || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
