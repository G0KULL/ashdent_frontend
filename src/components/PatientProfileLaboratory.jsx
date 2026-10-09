import React, { useState, useEffect } from 'react';
import styles from './SearchPatient.module.css';
import PrescriptionModal from './PrescriptionModal';

const API_BASE = 'http://127.0.0.1:8000/api';

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' };
}

export default function PatientProfileLaboratory({ viewPatient }) {
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddLab, setShowAddLab] = useState(false);

  const fetchOrders = () => {
    if (!viewPatient?.id) return;
    setLoading(true);
    fetch(`${API_BASE}/patient/${viewPatient.id}/lab-orders/`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setLabOrders(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [viewPatient]);

  return (
    <div className={styles.treatmentsTabBody}>
      <div className={styles.treatmentActionsRow}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--slate-900)' }}>Laboratory Orders</h3>
        <button 
          onClick={() => setShowAddLab(true)}
          style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
        >
          + Add Lab Test
        </button>
      </div>
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, border: '1px solid var(--border-light)', padding: 16 }}>
        <table className={styles.treatmentListTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Test / Order</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                  Loading laboratory orders...
                </td>
              </tr>
            ) : labOrders.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                  No laboratory orders found.
                </td>
              </tr>
            ) : (
              labOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(order.created_at || order.date).toLocaleDateString()}</td>
                  <td>{order.test_name || order.description || order.name || `Order #${order.id}`}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: order.status === 'Completed' ? '#dcfce7' : '#e0f2fe',
                      color: order.status === 'Completed' ? '#15803d' : '#0284c7'
                    }}>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td>{order.notes || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddLab && (
        <PrescriptionModal
          patientId={viewPatient.id}
          patientName={viewPatient.name || `${viewPatient.firstName || ''} ${viewPatient.lastName || ''}`.trim()}
          patientPhone={viewPatient.phone || viewPatient.mobile}
          appointmentId={null}
          clinicalNoteId={null}
          initialTab="lab"
          onClose={() => {
            setShowAddLab(false);
            fetchOrders();
          }}
          onOpenBilling={() => {
            setShowAddLab(false);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
