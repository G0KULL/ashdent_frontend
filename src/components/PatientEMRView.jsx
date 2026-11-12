import React, { useState, useEffect } from 'react';
import styles from './PatientEMRView.module.css';

export default function PatientEMRView({ patientId, patientName, onEditNote }) {
  const [emrData, setEmrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVisitId, setSelectedVisitId] = useState('all');

  const fetchEMR = async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/patients/${patientId}/emr/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEmrData(data);
    } catch (err) {
      console.error("Error fetching patient EMR:", err);
      setError("Unable to load electronic medical record. Please ensure server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEMR();
  }, [patientId]);

  const handleDownloadPDF = (visitId = null) => {
    let url = `http://127.0.0.1:8000/api/patients/${patientId}/emr-report/pdf/`;
    if (visitId && visitId !== 'all') {
      url += `?appointment_id=${visitId}`;
    }
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
        <div>Loading Complete Electronic Medical Record...</div>
      </div>
    );
  }

  if (error || !emrData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
        <p>{error || "No EMR record available."}</p>
        <button className={styles.btnPdfSecondary} onClick={fetchEMR} style={{ margin: '0 auto' }}>
          Try Again
        </button>
      </div>
    );
  }

  const { patient, medical_alerts, tooth_conditions, treatment_plans, performed_treatments, treatment_sessions, prescriptions, investigations, visits_timeline, estimates = [], financial_summary = {} } = emrData;

  // Filter visits timeline if a specific visit is selected
  const activeTimeline = selectedVisitId === 'all'
    ? visits_timeline
    : visits_timeline.filter(v => String(v.appointment_id) === String(selectedVisitId));

  return (
    <div className={styles.emrContainer}>
      {/* Top Bar with PDF Download actions */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.topBarTitle}>
            <span>📋</span> Electronic Medical Record (EMR)
            <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '6px' }}>
              Verified Dental Record
            </span>
          </div>
          <div className={styles.topBarSubtitle}>
            UHID: #{patient.id} • {patient.name} • {patient.age || '—'} Y / {patient.gender || '—'} • {patient.branch}
          </div>
        </div>

        <div className={styles.actionButtonGroup}>
          {visits_timeline && visits_timeline.length > 0 && (
            <select
              className={styles.visitSelect}
              value={selectedVisitId}
              onChange={(e) => setSelectedVisitId(e.target.value)}
              title="Filter by Visit"
            >
              <option value="all">Lifetime EMR (All Visits)</option>
              {visits_timeline.map(v => (
                <option key={v.appointment_id} value={v.appointment_id}>
                  Visit: {v.date} ({v.doctor})
                </option>
              ))}
            </select>
          )}

          <button
            className={styles.btnPdfPrimary}
            onClick={() => handleDownloadPDF(selectedVisitId === 'all' ? null : selectedVisitId)}
            title="Download Official Medical Record as PDF"
          >
            <span>📄</span> {selectedVisitId === 'all' ? 'Download Lifetime EMR (PDF)' : 'Download Visit EMR (PDF)'}
          </button>

          <button className={styles.btnPdfSecondary} onClick={fetchEMR} title="Refresh latest data">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* 1. Medical Alerts & Risk Factors */}
      {(medical_alerts?.allergies?.length > 0 || medical_alerts?.medical_history?.length > 0) && (
        <div className={styles.alertBox}>
          <div className={styles.alertTitle}>
            <span>⚠️</span> Critical Clinical Alerts & Medical History
          </div>
          <div className={styles.alertText}>
            {medical_alerts.allergies?.length > 0 && (
              <div><strong>Drug / Contact Allergies:</strong> {medical_alerts.allergies.join(', ')}</div>
            )}
            {medical_alerts.medical_history?.length > 0 && (
              <div style={{ marginTop: '2px' }}><strong>Systemic Medical Conditions:</strong> {medical_alerts.medical_history.join(', ')}</div>
            )}
          </div>
        </div>
      )}

      {/* 2. Unified Odontogram & Charted Conditions */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span>🦷</span> 1. Odontogram & Tooth Conditions Chart
          </h3>
          <span className={styles.sectionBadge}>{tooth_conditions.length} Teeth Recorded</span>
        </div>
        <div className={styles.sectionBody}>
          {tooth_conditions.length === 0 ? (
            <div className={styles.emptyState}>No specific tooth conditions charted yet. All teeth sound / intact.</div>
          ) : (
            <div className={styles.teethGrid}>
              {tooth_conditions.map(tc => {
                const isTaken = tc.condition.includes('Treatment Taken Before');
                const isRemoved = tc.condition.includes('Teeth Removed');
                let pillClass = styles.conditionPill;
                if (isTaken) pillClass = `${styles.conditionPill} ${styles.conditionPillTaken}`;
                else if (isRemoved) pillClass = `${styles.conditionPill} ${styles.conditionPillRemoved}`;

                return (
                  <div key={tc.tooth_number} className={styles.toothCard}>
                    <div className={styles.toothNumBadge}>
                      <span>Tooth #{tc.tooth_number}</span>
                      <span className={pillClass}>
                        {tc.condition.length > 0 ? tc.condition.join(', ') : 'Sound'}
                      </span>
                    </div>
                    {tc.surfaces?.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Surfaces: {tc.surfaces.join(', ')}
                      </div>
                    )}
                    {tc.diagnosis?.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#1e293b', fontWeight: 600 }}>
                        Dx: {tc.diagnosis.join(', ')}
                      </div>
                    )}
                    {tc.examination?.length > 0 && (
                      <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                        {tc.examination.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Recommended Treatment Plans */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span>📋</span> 2. Recommended Treatment Plans (Proposed Procedures)
          </h3>
          <span className={styles.sectionBadge}>
            {treatment_plans.reduce((acc, p) => acc + (p.items?.length || 0), 0)} Proposed Items
          </span>
        </div>
        <div className={styles.sectionBody}>
          {treatment_plans.length === 0 || treatment_plans.every(p => !p.items || p.items.length === 0) ? (
            <div className={styles.emptyState}>No recommended treatment plans recorded.</div>
          ) : (
            <table className={styles.emrTable}>
              <thead>
                <tr>
                  <th>Tooth #</th>
                  <th>Procedure Name</th>
                  <th>Priority</th>
                  <th>Visits</th>
                  <th>Estimated Cost</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {treatment_plans.flatMap(p => p.items || []).map((it, idx) => {
                  let statusClass = styles.statusProposed;
                  if (it.status === 'Completed') statusClass = styles.statusCompleted;
                  else if (it.status === 'In Progress') statusClass = styles.statusInProgress;
                  else if (it.status === 'Accepted') statusClass = styles.statusAccepted;
                  else if (it.status === 'Cancelled') statusClass = styles.statusCancelled;

                  return (
                    <tr key={it.id || idx}>
                      <td><strong>#{it.tooth_number || 'General'}</strong></td>
                      <td>
                        <strong>{it.procedure_name}</strong>
                        {it.surface && it.surface !== 'All' && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Surfaces: {it.surface}</div>
                        )}
                      </td>
                      <td>{it.priority}</td>
                      <td>{it.estimated_visits || 1}</td>
                      <td><strong>₹{it.final_cost ? it.final_cost.toLocaleString() : '0.00'}</strong></td>
                      <td><span className={`${styles.statusPill} ${statusClass}`}>{it.status}</span></td>
                      <td style={{ color: '#64748b' }}>{it.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. Treatments Actually Performed */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span>💉</span> 3. Treatments Performed & Procedures Executed
          </h3>
          <span className={styles.sectionBadge}>{performed_treatments.length} Completed</span>
        </div>
        <div className={styles.sectionBody}>
          {performed_treatments.length === 0 ? (
            <div className={styles.emptyState}>No completed clinical procedures recorded yet.</div>
          ) : (
            <table className={styles.emrTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tooth #</th>
                  <th>Procedure</th>
                  <th>Operating Doctor</th>
                  <th>Status</th>
                  <th>Clinical Notes</th>
                </tr>
              </thead>
              <tbody>
                {performed_treatments.map(t => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td><strong>#{t.tooth_number}</strong></td>
                    <td><strong>{t.procedure_name}</strong></td>
                    <td>{t.doctor}</td>
                    <td><span className={`${styles.statusPill} ${styles.statusCompleted}`}>{t.status}</span></td>
                    <td style={{ color: '#475569' }}>{t.notes || 'Procedure completed uneventfully.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 5. Multi-Session Progress Logs */}
      {treatment_sessions && treatment_sessions.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span>🔄</span> 4. Multi-Session Treatment Progress Logs
            </h3>
            <span className={styles.sectionBadge}>{treatment_sessions.length} Sessions</span>
          </div>
          <div className={styles.sectionBody}>
            <table className={styles.emrTable}>
              <thead>
                <tr>
                  <th>Session #</th>
                  <th>Date</th>
                  <th>Tooth #</th>
                  <th>Procedure Step Performed</th>
                  <th>Materials Used</th>
                  <th>Next Session Plan</th>
                </tr>
              </thead>
              <tbody>
                {treatment_sessions.map(s => (
                  <tr key={s.id}>
                    <td><strong>Session {s.session_number}</strong></td>
                    <td>{s.session_date}</td>
                    <td>#{s.tooth_number || 'Gen'}</td>
                    <td>
                      <strong>{s.procedure_performed}</strong>
                      {s.clinical_notes && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.clinical_notes}</div>}
                    </td>
                    <td>{s.materials_used || 'Standard dental materials'}</td>
                    <td>{s.next_session_plan || (s.next_session_date ? `Scheduled: ${s.next_session_date}` : 'Completed')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Diagnostic Investigations & Radiology */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span>🔬</span> 5. Diagnostic Investigations & Radiology
          </h3>
          <span className={styles.sectionBadge}>{investigations.length} Investigations</span>
        </div>
        <div className={styles.sectionBody}>
          {investigations.length === 0 ? (
            <div className={styles.emptyState}>No diagnostic radiology or lab orders recorded.</div>
          ) : (
            <table className={styles.emrTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Investigation Name</th>
                  <th>Indication / Reason</th>
                  <th>Findings & Impression</th>
                  <th>Status</th>
                  <th>Report Files</th>
                </tr>
              </thead>
              <tbody>
                {investigations.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.date}</td>
                    <td><strong>{inv.name}</strong></td>
                    <td>{inv.reason || 'Routine evaluation'}</td>
                    <td>{inv.findings || 'Report pending or verified'}</td>
                    <td><span className={`${styles.statusPill} ${inv.status === 'Completed' ? styles.statusCompleted : styles.statusProposed}`}>{inv.status}</span></td>
                    <td>
                      {inv.attachments && inv.attachments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {inv.attachments.map(att => (
                            <a
                              key={att.id}
                              href={att.file_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '0.8rem' }}
                            >
                              📎 {att.file_name}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>No attachments</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 7. Prescriptions (Rx) */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span>💊</span> 6. Prescribed Medications (Rx)
          </h3>
          <span className={styles.sectionBadge}>{prescriptions.length} Prescriptions</span>
        </div>
        <div className={styles.sectionBody}>
          {prescriptions.length === 0 ? (
            <div className={styles.emptyState}>No prescriptions recorded.</div>
          ) : (
            <table className={styles.emrTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Medicine Name</th>
                  <th>Dosage</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.flatMap(rx => (rx.items || []).map((it, idx) => (
                  <tr key={`${rx.id}-${idx}`}>
                    <td>{rx.date}</td>
                    <td>Dr. {rx.doctor}</td>
                    <td><strong>{it.name}</strong></td>
                    <td>{it.dosage}</td>
                    <td>{it.duration}</td>
                    <td>{it.notes || 'Take after meals'}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 8. Chronological Consultation Visits & Clinical Notes */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span>🗓️</span> 7. Chronological Clinical Consultation Visits
          </h3>
          <span className={styles.sectionBadge}>{activeTimeline.length} Visits</span>
        </div>
        <div className={styles.sectionBody}>
          {activeTimeline.length === 0 ? (
            <div className={styles.emptyState}>No consultation visits found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeTimeline.map(v => (
                <div key={v.appointment_id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{v.date} · {v.time || 'General'}</strong>
                      <span style={{ fontSize: '0.8rem', background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '4px' }}>
                        Dr. {v.doctor}
                      </span>
                      <span className={`${styles.statusPill} ${styles.statusCompleted}`}>{v.status}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={styles.btnPdfSecondary}
                        onClick={() => handleDownloadPDF(v.appointment_id)}
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        title="Download Visit PDF"
                      >
                        📄 Visit PDF
                      </button>
                      {onEditNote && (
                        <button
                          className={styles.btnPdfSecondary}
                          onClick={() => onEditNote(v.appointment_id)}
                          style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#2563eb' }}
                        >
                          ✏️ Edit Note
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Chief Complaints:</span>
                      <div>{v.chief_complaint || (v.complaints?.length ? v.complaints.join(', ') : 'Routine review')}</div>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Observations:</span>
                      <div>{v.observations?.length ? v.observations.join(', ') : (v.notes || 'Normal oral structures')}</div>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Diagnosis:</span>
                      <div style={{ fontWeight: 600, color: '#1e3a8a' }}>{v.diagnosis?.length ? v.diagnosis.join(', ') : 'Under evaluation'}</div>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Follow-up Scheduled:</span>
                      <div>{v.follow_up_date || 'PRN (As needed)'} {v.follow_up_note && `(${v.follow_up_note})`}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 9. Estimates, Invoices & Financial Account Ledger */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span>💳</span> 8. Treatment Estimates, Invoices & Financial Summary
          </h3>
          <span className={styles.sectionBadge}>
            Balance: ₹{parseFloat(financial_summary.balance_due || 0).toFixed(2)}
          </span>
        </div>
        <div className={styles.sectionBody}>
          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL INVOICED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                ₹{parseFloat(financial_summary.total_billed || 0).toFixed(2)}
              </div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>TOTAL COLLECTED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                ₹{parseFloat(financial_summary.total_paid || 0).toFixed(2)}
              </div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>OUTSTANDING BALANCE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>
                ₹{parseFloat(financial_summary.balance_due || 0).toFixed(2)}
              </div>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>ACCEPTED ESTIMATES UNBILLED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
                ₹{parseFloat(financial_summary.unbilled_accepted_estimate_total || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Estimates Breakdown */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📋</span> Formal Treatment Estimates ({estimates.length})
            </h4>
            {estimates.length === 0 ? (
              <div className={styles.emptyState}>No estimates recorded for this patient.</div>
            ) : (
              <table className={styles.emrTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Estimate #</th>
                    <th>Status</th>
                    <th>Procedures</th>
                    <th>Total (₹)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map(est => (
                    <tr key={est.id}>
                      <td>{new Date(est.created_at).toLocaleDateString()}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                        {est.estimate_number} (v{est.version})
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                          background: est.status === 'Accepted' ? '#dcfce7' : est.status === 'Billed' ? '#e0e7ff' : '#f1f5f9',
                          color: est.status === 'Accepted' ? '#166534' : est.status === 'Billed' ? '#4338ca' : '#475569'
                        }}>
                          {est.status}
                        </span>
                      </td>
                      <td>
                        {(est.items || []).map((it, idx) => (
                          <div key={idx} style={{ fontSize: '0.8rem' }}>
                            {it.procedure_name} {it.tooth_number ? `(Tooth ${it.tooth_number})` : ''} x {it.quantity}
                          </div>
                        ))}
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{parseFloat(est.total_amount || 0).toFixed(2)}</td>
                      <td>
                        <button
                          className={styles.btnPdfSecondary}
                          onClick={() => window.open(`http://127.0.0.1:8000/api/estimates/${est.id}/pdf/`, '_blank')}
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        >
                          📄 PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Invoices Breakdown */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🧾</span> Billed Tax Invoices ({financial_summary.bills?.length || 0})
            </h4>
            {(!financial_summary.bills || financial_summary.bills.length === 0) ? (
              <div className={styles.emptyState}>No billing transactions recorded.</div>
            ) : (
              <table className={styles.emrTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice #</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {financial_summary.bills.map(b => (
                    <tr key={b.id}>
                      <td>{new Date(b.created_at).toLocaleDateString()}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5' }}>
                        {b.invoice_number}
                      </td>
                      <td>₹{parseFloat(b.total_amount || 0).toFixed(2)}</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>₹{parseFloat(b.paid_amount || 0).toFixed(2)}</td>
                      <td style={{ color: parseFloat(b.balance_amount || 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                        ₹{parseFloat(b.balance_amount || 0).toFixed(2)}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                          background: b.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                          color: b.status === 'Paid' ? '#166534' : '#991b1b'
                        }}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.btnPdfSecondary}
                          onClick={() => window.open(`http://127.0.0.1:8000/api/billing/${b.id}/pdf/`, '_blank')}
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        >
                          📄 Invoice PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

