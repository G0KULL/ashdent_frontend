import React, { useState } from 'react';

const TreatmentPlanStep = () => {
  const [treatments, setTreatments] = useState([
    { id: 1, tooth: '16', procedure: 'Composite Filling', priority: 'High', cost: 150.00, visits: 1, notes: '' }
  ]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 1rem 0' }}>Plan Treatment</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Tooth / Teeth</label>
            <input type="text" placeholder="e.g. 16, 17" style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Procedure</label>
            <select style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <option>Select Procedure...</option>
              <option>Composite Filling</option>
              <option>Root Canal Treatment</option>
              <option>Extraction</option>
              <option>Crown</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Priority</label>
            <select style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <option>High</option>
              <option>Normal</option>
              <option>Low</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Est. Cost ($)</label>
            <input type="number" placeholder="0.00" style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Visits</label>
            <input type="number" defaultValue="1" style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Notes</label>
          <input type="text" placeholder="Add specific notes..." style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
        </div>
        
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ background: '#4f46e5', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>+ Add to Plan</button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: 1 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 1rem 0' }}>Proposed Treatment Plan</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Tooth</th>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Procedure</th>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Priority</th>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Est. Cost</th>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Visits</th>
              <th style={{ padding: '0.75rem', color: '#475569', fontSize: '0.875rem', fontWeight: '600' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {treatments.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{t.tooth}</td>
                <td style={{ padding: '0.75rem' }}>{t.procedure}</td>
                <td style={{ padding: '0.75rem' }}><span style={{ padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{t.priority}</span></td>
                <td style={{ padding: '0.75rem' }}>${t.cost.toFixed(2)}</td>
                <td style={{ padding: '0.75rem' }}>{t.visits}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
            <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '600' }}>Total Estimated Cost:</span>
            <span style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '800' }}>$150.00</span>
        </div>
      </div>
    </div>
  );
};

export default TreatmentPlanStep;
