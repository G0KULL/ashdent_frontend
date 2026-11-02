import React, { useState } from 'react';
import styles from '../../../pages/ConsultationWorkspace.module.css';
import { X } from 'lucide-react';
import InvoicePreviewModal from '../../InvoicePreviewModal';
import { useConsultation } from '../../../context/ConsultationContext';

const TreatmentPlanTab = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  
  const { plannedProcedures, setPlannedProcedures, prescriptions } = useConsultation();

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className={styles.card} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h4 className={styles.headerTitle} style={{ margin: 0 }}>Treatment Plans</h4>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className={styles.btnSecondary}>Save Draft</button>
            <button className={styles.btnSecondary}>Back to Diagnosis</button>
            <button className={styles.btnPrimary} onClick={() => setDrawerOpen(true)}>+ Add Treatment</button>
            <button className={styles.btnPrimary} onClick={() => setIsInvoicePreviewOpen(true)} style={{backgroundColor: '#10b981'}}>Continue</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Tooth</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Procedure</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Priority</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Est. Cost</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Doctor</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Insurance</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plannedProcedures.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{row.tooth || '-'}</td>
                  <td style={{ padding: '1rem', color: '#334155' }}>{row.procedure}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      backgroundColor: row.priority === 'High' ? '#fee2e2' : row.priority === 'Medium' ? '#fef3c7' : '#f1f5f9',
                      color: row.priority === 'High' ? '#b91c1c' : row.priority === 'Medium' ? '#b45309' : '#64748b',
                      padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600'
                    }}>{row.priority || 'Normal'}</span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '500', color: '#334155' }}>${row.cost}</td>
                  <td style={{ padding: '1rem', color: '#334155' }}>{row.dr || 'Dr. Smith'}</td>
                  <td style={{ padding: '1rem', color: '#334155', fontSize: '0.75rem' }}>{row.ins || 'None'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: row.status === 'In Progress' ? '#10b981' : '#64748b', fontWeight: '500' }}>{row.status || 'Planned'}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '0.5rem' }}>Edit</button>
                    <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.card}>
        <h4 className={styles.headerTitle}>Treatment Timeline</h4>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
          {[
            { label: 'Consultation Completed', done: true },
            { label: 'Diagnosis Added', done: true },
            { label: 'Treatment Plan Approved', done: true },
            { label: 'RCT Started', done: true },
            { label: 'Temporary Filling', done: false },
            { label: 'Final Crown Delivered', done: false },
            { label: 'Completed', done: false },
          ].map((step, idx, arr) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', flex: idx === arr.length - 1 ? 'none' : 1 }}>
              <div style={{ 
                width: '16px', height: '16px', borderRadius: '50%', 
                backgroundColor: step.done ? '#14b8a6' : '#e2e8f0',
                border: `2px solid ${step.done ? '#14b8a6' : '#cbd5e1'}`,
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: '500', color: step.done ? '#0f172a' : '#64748b' }}>
                  {step.label}
                </div>
              </div>
              {idx < arr.length - 1 && (
                <div style={{ flex: 1, height: '2px', backgroundColor: step.done ? '#14b8a6' : '#e2e8f0', margin: '0 4px' }}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Side Drawer for Add Procedure */}
      {drawerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '450px', backgroundColor: 'white', height: '100%', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Add Procedure</h3>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24}/></button>
            </div>
            
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Tooth</label>
                <input type="text" placeholder="e.g., 36" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Procedure Category</label>
                <select style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option>Endodontics</option>
                  <option>Restorative</option>
                  <option>Surgical</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Procedure</label>
                <input type="text" placeholder="Search procedure..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Surface</label>
                  <input type="text" placeholder="e.g., MO" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Material</label>
                  <input type="text" placeholder="e.g., Composite" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Estimated Cost</label>
                  <input type="text" placeholder="$0.00" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Discount</label>
                  <input type="text" placeholder="$0.00" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                <input type="checkbox" /> Lab Required
              </label>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Priority</label>
                <select style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Duration (mins)</label>
                <input type="number" defaultValue="30" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Advices / Instructions</label>
                <textarea rows="2" placeholder="Pre or post procedure advices..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}></textarea>
              </div>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className={styles.btnSecondary} onClick={() => setDrawerOpen(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={() => setDrawerOpen(false)}>Save Procedure</button>
            </div>
          </div>
        </div>
      )}
      
      {isInvoicePreviewOpen && (
        <InvoicePreviewModal 
            plans={plannedProcedures}
            medicines={prescriptions}
            patientName={'Walk-in Patient'}
            onClose={() => setIsInvoicePreviewOpen(false)}
        />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}} />
    </div>
  );
};

export default TreatmentPlanTab;
