import React from 'react';
import styles from './PreviousHistoryModal.module.css';
import { X, Calendar, Clock, FileText, CheckCircle2 } from 'lucide-react';

export default function PreviousHistoryModal({ pastHistory, onClose }) {
  if (!pastHistory || pastHistory.length === 0) return null;

  const lastVisit = pastHistory[0];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBox}>
              <Clock size={20} color="#0284c7" />
            </div>
            <h2 className={styles.title}>Returning Patient History</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.subtitle}>
            This patient has previous consultation history. Here are the details from their last visit.
          </p>

          <div className={styles.detailsCard}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Last Visit Date:</span>
              <span className={styles.value}>{new Date(lastVisit.date).toLocaleDateString()}</span>
            </div>
            
            {lastVisit.doctor && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Consulted By:</span>
                <span className={styles.value}>{lastVisit.doctor}</span>
              </div>
            )}

            {lastVisit.chief_complaint && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Chief Complaint:</span>
                <span className={styles.value}>{lastVisit.chief_complaint}</span>
              </div>
            )}

            {lastVisit.diagnosis && lastVisit.diagnosis.length > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Diagnosis:</span>
                <span className={styles.value}>{lastVisit.diagnosis.join(', ')}</span>
              </div>
            )}

            {lastVisit.treatments && lastVisit.treatments.length > 0 && (
              <div className={styles.treatmentsBox}>
                <h4 className={styles.treatmentsTitle}>Last Treatments:</h4>
                <ul className={styles.treatmentsList}>
                  {lastVisit.treatments.map((t, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>{t.treatment} {t.tooth_number ? `(Tooth ${t.tooth_number})` : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.proceedBtn} onClick={onClose}>
            Proceed to Consultation
          </button>
        </div>
      </div>
    </div>
  );
}
