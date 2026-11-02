import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ExistingCaseSheet.module.css';
import Sidebar from '../components/consultation/Sidebar';
import TopHeader from '../components/consultation/TopHeader';
import { ConsultationProvider } from '../context/ConsultationContext';
import { Activity, Clock, Shield, Pill, Download, Image as ImageIcon } from 'lucide-react';

const CaseSheetContent = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />
      <div className={styles.mainArea}>
        <TopHeader />
        
        <div className={styles.scrollContainer}>
          {/* Patient Summary Card */}
          <div className={styles.card}>
            <div className={styles.sectionTitle}><Activity size={24} color="#14b8a6"/> Patient Summary</div>
            <div className={styles.grid3Col}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Patient</span>
                <span className={styles.metaValue}>Sarah Jenkins (34, F)</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Patient ID</span>
                <span className={styles.metaValue}>UHID-8942</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Doctor</span>
                <span className={styles.metaValue}>Dr. Smith</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Chief Complaint</span>
                <span className={styles.metaValue}>Severe pain in lower left jaw</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Current Diagnosis</span>
                <span className={styles.metaValue}>Irreversible Pulpitis (Tooth 36)</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Medical Alerts</span>
                <span className={`${styles.badge} ${styles.badgeAlert}`}>Diabetic</span>
              </div>
            </div>
            
            <div className={styles.timeline}>
              <div className={styles.timelineLine}></div>
              <div className={styles.timelineProgress} style={{ width: '50%' }}></div>
              {['Case Created', 'Diagnosis', 'RCT Started', 'Crown Delivery'].map((step, i) => (
                <div key={i} className={styles.timelineStep}>
                  <div className={`${styles.timelineDot} ${i <= 2 ? styles.active : ''}`}></div>
                  <span className={styles.timelineLabel}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Treatment Plan Table */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Treatment Plan</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Tooth</th>
                  <th className={styles.th}>Procedure</th>
                  <th className={styles.th}>Diagnosis</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Doctor</th>
                  <th className={styles.th}>Est. Cost</th>
                  <th className={styles.th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.td}>36</td>
                  <td className={styles.td}>Root Canal Treatment</td>
                  <td className={styles.td}>Irreversible Pulpitis</td>
                  <td className={styles.td}><span className={styles.statusCompleted}>Completed</span></td>
                  <td className={styles.td}>Dr. Smith</td>
                  <td className={styles.td}>$500.00</td>
                  <td className={styles.td}>Canals obturated</td>
                </tr>
                <tr>
                  <td className={styles.td}>36</td>
                  <td className={styles.td}>Porcelain Crown</td>
                  <td className={styles.td}>Irreversible Pulpitis</td>
                  <td className={styles.td}><span className={styles.statusInProgress}>In Progress</span></td>
                  <td className={styles.td}>Dr. Smith</td>
                  <td className={styles.td}>$400.00</td>
                  <td className={styles.td}>Impressions taken</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Clinical Notes (SOAP) */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Clinical Notes (SOAP)</h3>
            <div className={styles.grid2Col}>
              <div>
                <label className={styles.metaLabel} style={{ display: 'block', marginBottom: '0.5rem' }}>Subjective (S)</label>
                <textarea className={styles.textarea} rows="3" defaultValue="Patient reports continuous throbbing pain."></textarea>
              </div>
              <div>
                <label className={styles.metaLabel} style={{ display: 'block', marginBottom: '0.5rem' }}>Objective (O)</label>
                <textarea className={styles.textarea} rows="3" defaultValue="Tender on percussion on tooth 36."></textarea>
              </div>
              <div>
                <label className={styles.metaLabel} style={{ display: 'block', marginBottom: '0.5rem' }}>Assessment (A)</label>
                <textarea className={styles.textarea} rows="3" defaultValue="Irreversible Pulpitis."></textarea>
              </div>
              <div>
                <label className={styles.metaLabel} style={{ display: 'block', marginBottom: '0.5rem' }}>Plan (P)</label>
                <textarea className={styles.textarea} rows="3" defaultValue="Proceed with RCT and subsequent crown."></textarea>
              </div>
            </div>
          </div>

          {/* RVG Reports */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>RVG Reports & Attachments</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className={styles.btnSecondary} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ImageIcon size={18}/> Upload X-Ray</button>
            </div>
            <div className={styles.uploadGrid}>
              {[1, 2].map(i => (
                <div key={i} className={styles.uploadItem}>
                  <div className={styles.uploadThumb}>
                    <ImageIcon size={32} />
                  </div>
                  <div className={styles.uploadDetails}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>IOPA_36_{i}.jpg</div>
                    <div style={{ color: '#64748b' }}>Oct 12, 2023</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prescriptions & Labs */}
          <div className={styles.grid2Col}>
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}><Pill size={20} color="#14b8a6"/> Prescription</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Medicine</th>
                    <th className={styles.th}>Dosage</th>
                    <th className={styles.th}>Freq</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className={styles.td}>Amoxicillin</td><td className={styles.td}>500mg</td><td className={styles.td}>1-1-1 (5 days)</td></tr>
                  <tr><td className={styles.td}>Ibuprofen</td><td className={styles.td}>400mg</td><td className={styles.td}>SOS</td></tr>
                </tbody>
              </table>
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Lab Orders</h3>
              <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontWeight: '600' }}>Crown Fabrication (Porcelain)</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Status: Pending Delivery</div>
              </div>
            </div>
          </div>

          {/* Billing & Next Appointment */}
          <div className={styles.grid2Col}>
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Billing Summary</h3>
              <div className={styles.billingSummary}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Total Treatment Cost</span>
                  <span style={{ fontWeight: '600' }}>$900.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Paid Amount</span>
                  <span style={{ fontWeight: '600', color: '#10b981' }}>$500.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #99f6e4', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: '600' }}>Pending Balance</span>
                  <span style={{ fontWeight: '700', color: '#ef4444' }}>$400.00</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.sectionTitle}><Clock size={20} color="#14b8a6"/> Next Appointment</h3>
              <div style={{ padding: '1.5rem', border: '1px solid #bfdbfe', borderRadius: '8px', backgroundColor: '#eff6ff' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e40af' }}>Oct 26, 2023 - 10:00 AM</div>
                <div style={{ color: '#3b82f6', marginTop: '0.5rem' }}>Crown Placement & Final Polish</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input type="checkbox" defaultChecked /> <span style={{ fontSize: '0.875rem', color: '#1e40af' }}>Send WhatsApp Reminder</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sticky Action Footer */}
        <div className={styles.bottomBar}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className={styles.btnSecondary}>Save Draft</button>
            <button className={styles.btnSecondary}>Refer</button>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className={styles.btnSecondary}>Print</button>
            <button className={styles.btnSecondary}>Gen. Prescription</button>
            <button className={styles.btnSecondary}>Gen. Invoice</button>
            <button className={styles.btnPrimary}>Complete Consultation</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExistingCaseSheet = () => {
  return (
    <ConsultationProvider>
      <CaseSheetContent />
    </ConsultationProvider>
  );
};

export default ExistingCaseSheet;
