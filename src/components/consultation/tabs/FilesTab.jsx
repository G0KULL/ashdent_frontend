import React from 'react';
import styles from '../../../pages/ConsultationWorkspace.module.css';

const FilesTab = () => {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h4 className={styles.headerTitle} style={{ margin: 0 }}>Documents & Files</h4>
          <button className={styles.btnPrimary}>+ Upload File</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>File Name</th>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Uploaded By</th>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'RCT_Consent_Signed.pdf', cat: 'Consent Form', user: 'Dr. Smith', date: 'Oct 12, 2023' },
              { name: 'Patient_Intraoral_PreOp.jpg', cat: 'Before Image', user: 'Jane Doe (Asst)', date: 'Oct 12, 2023' },
              { name: 'Insurance_Card_Copy.pdf', cat: 'Insurance', user: 'Reception', date: 'Oct 10, 2023' }
            ].map((file, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem', fontWeight: '500', color: '#2563eb', cursor: 'pointer' }}>📄 {file.name}</td>
                <td style={{ padding: '1rem', color: '#475569' }}>
                  <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{file.cat}</span>
                </td>
                <td style={{ padding: '1rem', color: '#475569' }}>{file.user}</td>
                <td style={{ padding: '1rem', color: '#475569' }}>{file.date}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginRight: '1rem' }}>Preview</button>
                  <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>⬇️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FilesTab;
