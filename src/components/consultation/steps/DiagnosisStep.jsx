import React, { useState } from 'react';

const DiagnosisStep = () => {
  const [diagnoses, setDiagnoses] = useState([
    { id: 1, tooth: '16', surface: 'Occlusal', diagnosis: 'Dental Caries', severity: 'Moderate', notes: 'Deep cavity near pulp' }
  ]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 1rem 0' }}>Record Diagnosis</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Tooth</label>
            <input type="text" placeholder="e.g. 16" style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Surface</label>
            <input type="text" placeholder="e.g. MOD" style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Diagnosis</label>
            <select style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <option>Select Diagnosis...</option>
              <option>Dental Caries</option>
              <option>Pulpitis</option>
              <option>Periodontitis</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Severity</label>
            <select style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <option>Mild</option>
              <option>Moderate</option>
              <option>Severe</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Clinical Notes</label>
          <textarea rows="2" placeholder="Add specific notes..." style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'inherit' }}></textarea>
        </div>
        
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ background: '#4f46e5', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>+ Add Diagnosis</button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: 1 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 1rem 0' }}>Confirmed Diagnoses</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Tooth</th>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Surface</th>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Diagnosis</th>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Severity</th>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Notes</th>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {diagnoses.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{d.tooth}</td>
                <td style={{ padding: '0.75rem' }}>{d.surface}</td>
                <td style={{ padding: '0.75rem' }}>{d.diagnosis}</td>
                <td style={{ padding: '0.75rem' }}><span style={{ padding: '0.2rem 0.5rem', background: '#fef3c7', color: '#b45309', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{d.severity}</span></td>
                <td style={{ padding: '0.75rem', color: '#64748b' }}>{d.notes}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DiagnosisStep;
