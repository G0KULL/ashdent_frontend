import React, { useState, useEffect } from 'react';
import styles from './PurchaseEntry.module.css';
const API_BASE = 'http://127.0.0.1:8000/api';

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' };
}

export default function PurchaseEntry({ onCancel }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    setLoading(true);
    fetch(`${API_BASE}/stock/purchase/history/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📦 Stock Purchase History</h2>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Medicine / Type</th>
              <th>Supplier</th>
              <th>Invoice No</th>
              <th>Total Amount</th>
              <th>Paid Amount</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading purchase history...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No stock purchases recorded yet.
                </td>
              </tr>
            ) : (
              history.sort((a, b) => new Date(b.date) - new Date(a.date)).map(item => (
                <tr key={item.id}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td><strong>{item.medicine_name}</strong></td>
                  <td>{item.supplier}</td>
                  <td>{item.invoice_no || '--'}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>₹{parseFloat(item.total_amount || 0).toFixed(2)}</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>₹{parseFloat(item.paid_amount || 0).toFixed(2)}</td>
                  <td>
                    <span className={styles.badge} style={{ background: '#f1f5f9', color: '#475569' }}>
                      {item.payment_method}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}