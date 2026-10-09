import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './SearchPatient.module.css'
import ClinicalNotesModal from './ClinicalNotesModal'
import PatientProfileAppointment from './PatientProfileAppointment'
import PatientProfilePrescription from './PatientProfilePrescription'
import PatientProfileInvoice from './PatientProfileInvoice'
import PatientProfileTreatment from './PatientProfileTreatment'
import PatientProfileLaboratory from './PatientProfileLaboratory'
import PatientProfileWhatsApp from './PatientProfileWhatsApp'
import PatientProfileGmail from './PatientProfileGmail'
import PatientTreatmentHistoryTab from './PatientTreatmentHistoryTab'

const TABS = [
  'Overview', 'Medical History', 'Dental History', 'Appointment History', 'Treatment History', 
  'Dental Chart', 'RVG / X-Rays', 'Clinical Notes', 'Follow-ups',
  'Prescription', 'Invoice', 'Laboratory', 'WhatsApp', 'Gmail'
]

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function PatientProfileView({
  viewPatient, profile, profileLoading, patientName, patientPhone,
  closeProfile, refreshProfile, onNavigate
}) {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.initialTab || 'general')
  const [showNotes, setShowNotes] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Sync initial tab when location state changes
  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab)
    }
  }, [location.state?.initialTab])

  const totalBalance = parseFloat(profile?.total_balance || 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '0px' }}>
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={closeProfile} 
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            ← Back to Patients
          </button>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
            Patient Records ➔ <span style={{ color: '#0f172a', fontWeight: 700 }}>{patientName}</span>
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
          ID: {viewPatient.id}
        </div>
      </div>

      {/* Main Patient Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Patient Profile Row */}
        <div style={{
          padding: '24px 32px 16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: '#ede7f6',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800
            }}>
              {getInitials(patientName)}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>
                {patientName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                <span>📞 {patientPhone}</span>
                <span>·</span>
                <span>{viewPatient.age || '—'} yrs</span>
                <span>·</span>
                <span style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  border: '1px solid #a7f3d0'
                }}>
                  {viewPatient.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Net Balance
            </span>
            <strong style={{
              fontSize: 20,
              fontWeight: 800,
              color: totalBalance > 0 ? '#ef4444' : '#10b981',
              display: 'block',
              marginTop: 2
            }}>
              {totalBalance <= 0 ? 'Nil' : `₹${Math.abs(totalBalance).toFixed(2)}`}
            </strong>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: 0 }} />

        {/* Stepper / Tabs */}
        <div style={{
          display: 'flex',
          gap: 20,
          padding: '0 32px',
          background: '#ffffff',
          overflowX: 'auto',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {TABS.map((t) => {
            const val = t.toLowerCase();
            const isActive = activeTab === val;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(val)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '16px 4px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: isActive ? '#4f46e5' : '#64748b',
                  borderBottom: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap'
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Success Banner */}
        {showSuccess && (
          <div className={styles.successBanner}>
            ✓ Action completed successfully!
          </div>
        )}

        {/* Body content based on tab */}
        <div className={styles.viewBody} style={{ padding: 0 }}>
          {activeTab === 'overview' && (() => {
            const patData = profile?.patient || viewPatient;
            return (
              <div className={styles.treatmentsTabBody}>
                <h3 className={styles.sectionTitle}>Overview</h3>
                <div className={styles.viewGrid} style={{ marginBottom: 24 }}>
                  <div className={styles.viewField}><span>Gender</span><strong>{patData.gender || '—'}</strong></div>
                  <div className={styles.viewField}><span>Age</span><strong>{patData.age || '—'}</strong></div>
                  <div className={styles.viewField}><span>Blood Group</span><strong>{patData.blood_group || '—'}</strong></div>
                  <div className={styles.viewField}><span>Address</span><strong>{patData.address || '—'}</strong></div>
                </div>
                <PatientProfileAppointment profile={profile} />
              </div>
            );
          })()}

          {activeTab === 'appointment history' && <PatientProfileAppointment profile={profile} />}
          {activeTab === 'treatment history' && <PatientTreatmentHistoryTab patientId={viewPatient.id} />}
          
          {activeTab === 'clinical notes' && (
            <div className={styles.treatmentsTabBody}>
              <div className={styles.treatmentActionsRow}>
                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Clinical Notes</h3>
                <button className={styles.addBtn} onClick={() => setShowNotes('new')}>+ Add Note</button>
              </div>
              <p style={{ color: '#64748b' }}>View past notes or add new ones by clicking above.</p>
            </div>
          )}

          {activeTab === 'medical history' && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Coming soon...</div>}
          {activeTab === 'dental history' && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Coming soon...</div>}
          {activeTab === 'dental chart' && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Coming soon...</div>}
          {activeTab === 'rvg / x-rays' && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Coming soon...</div>}
          {activeTab === 'follow-ups' && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Coming soon...</div>}

          {/* Legacy Tabs for compatibility */}
          {activeTab === 'general' && <div style={{ padding: '2rem', textAlign: 'center' }}>Please use the 'Overview' tab.</div>}
          {activeTab === 'treatments' && <PatientProfileTreatment viewPatient={viewPatient} profile={profile} refreshProfile={refreshProfile} />}
          {activeTab === 'prescription' && <PatientProfilePrescription viewPatient={viewPatient} profile={profile} refreshProfile={refreshProfile} />}
          {activeTab === 'invoice' && <PatientProfileInvoice viewPatient={viewPatient} profile={profile} refreshProfile={refreshProfile} />}
          {activeTab === 'laboratory' && <PatientProfileLaboratory viewPatient={viewPatient} />}
          {activeTab === 'whatsapp' && <PatientProfileWhatsApp patientPhone={patientPhone} patientName={patientName} />}
          {activeTab === 'gmail' && <PatientProfileGmail email={profile?.patient?.email || viewPatient.email || ''} patientName={patientName} />}
        </div>
      </div>

      {/* ── Modals that sit on top ── */}
      {showNotes && (
        <ClinicalNotesModal
          appointmentId={showNotes === 'new' ? null : showNotes}
          patientId={viewPatient.id}
          patientName={patientName}
          onClose={() => { setShowNotes(null); refreshProfile() }}
        />
      )}

    </div>
  )
}
