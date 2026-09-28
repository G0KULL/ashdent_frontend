import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './TreatmentCases.module.css';

const TreatmentCases = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();

  // Mock data
  const patient = {
    name: 'Sarah Jenkins',
    uhid: 'UHID-2023-8942',
    age: 34,
    gender: 'Female',
    phone: '+1 555-0198',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Latex'],
    outstanding: 150.00,
    photo: 'https://i.pravatar.cc/150?img=47'
  };

  const cases = [
    {
      id: 'CASE-00921',
      name: 'Root Canal Treatment (Tooth 36)',
      complaint: 'Severe pain on lower left jaw for 3 days.',
      diagnosis: 'Irreversible Pulpitis',
      doctor: 'Dr. Smith',
      started: 'Oct 12, 2023',
      lastVisit: 'Oct 15, 2023',
      progress: 60,
      status: 'In Progress'
    }
  ];

  return (
    <div className={styles.container}>
      {/* Patient Header */}
      <div className={styles.patientHeader}>
        <div className={styles.profileSection}>
          <img src={patient.photo} alt={patient.name} className={styles.profileImg} />
          <div className={styles.infoBlock}>
            <div className={styles.nameRow}>
              <h2 className={styles.name}>{patient.name}</h2>
              <span className={styles.uhid}>{patient.uhid}</span>
            </div>
            <div className={styles.detailsRow}>
              <span>{patient.age} yrs • {patient.gender}</span>
              <span>📞 {patient.phone}</span>
              <span style={{ color: '#ef4444', fontWeight: '500' }}>🩸 {patient.bloodGroup}</span>
              {patient.allergies.length > 0 && (
                <span className={styles.allergyBadge}>Allergies: {patient.allergies.join(', ')}</span>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className={styles.balanceBlock}>
            <div className={styles.balanceLabel}>Outstanding Balance</div>
            <div className={styles.balanceValue}>${patient.outstanding.toFixed(2)}</div>
          </div>
          <button className={styles.btnSecondary} style={{ height: 'fit-content' }}>View Profile</button>
        </div>
      </div>

      {/* Cases List */}
      <div className={styles.casesSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Treatment Cases</h3>
          <button className={styles.btnPrimary} onClick={() => navigate(`/create-case/${patientId}`)}>
            + Create New Case
          </button>
        </div>

        {cases.map((c) => (
          <div key={c.id} className={styles.caseCard}>
            <div className={styles.caseContent}>
              <div className={styles.caseHeader}>
                <h4 className={styles.caseName}>{c.name}</h4>
                <span className={styles.statusBadge}>{c.status}</span>
              </div>
              <div className={styles.caseDetails}>
                <div className={styles.detailItem}><strong>Chief Complaint:</strong> {c.complaint}</div>
                <div className={styles.detailItem}><strong>Diagnosis:</strong> {c.diagnosis}</div>
                <div className={styles.detailItem}><strong>Doctor:</strong> {c.doctor}</div>
                <div className={styles.detailItem}><strong>Started:</strong> {c.started} • <strong>Last Visit:</strong> {c.lastVisit}</div>
              </div>
            </div>
            
            <div className={styles.progressBlock}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                <span>Treatment Progress</span>
                <span>{c.progress}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${c.progress}%`, height: '100%', backgroundColor: '#14b8a6', borderRadius: '9999px' }}></div>
              </div>
            </div>

            <div className={styles.actionsBlock}>
              <button className={styles.btnPrimary} onClick={() => navigate(`/consultation-workspace/${c.id}`)}>Continue Case</button>
              <button className={styles.btnSecondary}>View Plan</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreatmentCases;
