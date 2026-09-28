import React from 'react';
import styles from './SearchPatient.module.css';

export default function PatientProfileAppointment({ profile }) {
  const appointments = profile?.appointments || [];

  return (
    <div className={styles.treatmentsTabBody}>
      <h3 className={styles.sectionTitle} style={{ margin: '0 0 16px 0', fontSize: 16, color: 'var(--slate-900)' }}>
        Appointments History
      </h3>
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, border: '1px solid var(--border-light)', padding: 16 }}>
        <table className={styles.treatmentListTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Doctor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                  No appointments found.
                </td>
              </tr>
            ) : (
              [...appointments]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3)
                .map((appt) => (
                <tr key={appt.id}>
                  <td>{new Date(appt.date).toLocaleDateString()}</td>
                  <td>{appt.time_formatted || appt.time}</td>
                  <td>{appt.doctor_name || '—'}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: appt.status === 'Completed' ? '#dcfce7' : appt.status === 'Scheduled' ? '#e0f2fe' : '#f1f5f9',
                      color: appt.status === 'Completed' ? '#15803d' : appt.status === 'Scheduled' ? '#0284c7' : '#475569'
                    }}>
                      {appt.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
