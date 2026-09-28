import React, { useState } from 'react';
import { X, ArrowLeft, Trash2 } from 'lucide-react';
import styles from './InvoicePreviewModal.module.css';
import dentobeesLogo from '../assets/react.svg'; // Using a placeholder for logo

import Swal from 'sweetalert2';

export default function InvoicePreviewModal({ plans = [], medicines = [], patientName, amountPaid = 0, onClose }) {
  const [discount, setDiscount] = useState('');
  const [localPlans, setLocalPlans] = useState(plans);
  const [localMedicines, setLocalMedicines] = useState(medicines);

  const [localAmountPaid, setLocalAmountPaid] = useState(amountPaid);

  // Calculate totals
  const totalTreatment = localPlans.reduce((sum, p) => sum + (parseFloat(p.finalAmount || p.cost || p.rate || '400') || 0), 0);
  const totalMedicine = localMedicines.reduce((sum, m) => sum + (parseFloat(m.price || m.unit_price) * parseFloat(m.qty || m.quantity || 1) || 0), 0);
  const discountAmount = parseFloat(discount) || 0;
  
  const netPayable = Math.max(0, totalTreatment + totalMedicine - discountAmount);
  const balance = Math.max(0, netPayable - localAmountPaid);

  const handleGenerate = () => {
    Swal.fire({
      title: 'Invoice Generated',
      text: 'The invoice has been successfully generated and is ready for printing.',
      icon: 'success',
      confirmButtonColor: '#14b8a6'
    }).then(() => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft} onClick={onClose}>
            <ArrowLeft size={20} className={styles.backIcon} />
            <h2 className={styles.title}>Invoice Preview</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.body}>
          
          {/* Treatments Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.treatmentTable}>
              <thead>
                <tr>
                  <th style={{ width: '42%' }}>Treatment Name</th>
                  <th style={{ width: '18%' }}>Status</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Rate</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Amount</th>
                  <th style={{ width: '8%', textAlign: 'center' }}></th>
                </tr>
              </thead>
            <tbody>
              {localPlans.map((p, index) => {
                const price = parseFloat(p.finalAmount || p.cost || p.rate || '400') || 0;
                return (
                  <tr key={`t-${index}`}>
                    <td style={{ fontWeight: '500' }}>{p.procedure || p.diagnosis || 'Treatment'}</td>
                    <td>{p.status || 'Completed'}</td>
                    <td style={{ textAlign: 'center' }}>1</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <span>₹</span>
                        <input 
                          type="number" 
                          value={p.rate !== undefined ? p.rate : price} 
                          onChange={(e) => {
                            const newPlans = [...localPlans];
                            newPlans[index] = { ...newPlans[index], rate: e.target.value, finalAmount: e.target.value };
                            setLocalPlans(newPlans);
                          }}
                          style={{ width: '60px', marginLeft: '4px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right' }}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>₹{price.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Trash2 size={16} style={{ color: '#ef4444', cursor: 'pointer' }} />
                    </td>
                  </tr>
                );
              })}
              {localPlans.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>No treatments added</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

          {/* Medicine Table */}
          <h3 className={styles.sectionTitle}>Medicine</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.medicineTable}>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Medicine Name</th>
                  <th style={{ width: '40%' }}>Content</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Price</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
            <tbody>
              {localMedicines.map((m, index) => {
                const price = parseFloat(m.price || m.unit_price) || 0;
                const qty = parseFloat(m.qty || m.quantity || 1);
                const total = price * qty;
                return (
                  <tr key={`m-${index}`}>
                    <td style={{ fontWeight: '500' }}>{m.name || m.medicine_name}</td>
                    <td>{m.content || 'N/A'}</td>
                    <td style={{ textAlign: 'center' }}><span className={styles.badge}>{qty}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <span>₹</span>
                        <input 
                          type="number" 
                          value={price} 
                          onChange={(e) => {
                            const newMeds = [...localMedicines];
                            newMeds[index] = { ...newMeds[index], price: e.target.value };
                            setLocalMedicines(newMeds);
                          }}
                          style={{ width: '60px', marginLeft: '4px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right' }}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>₹{total.toFixed(2)}</td>
                  </tr>
                );
              })}
              {localMedicines.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No medicines added</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

          <div className={styles.bottomSection}>
            <div className={styles.bottomLeft}>
              <div className={styles.inputsWrapper}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Add New Treatment</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="Search and select treatment" 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Enter Discount (₹)</label>
                  <input 
                    type="number" 
                    className={styles.inputField} 
                    placeholder="e.g. 100" 
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.bottomRight}>
              <div className={styles.summaryBox}>
                <h4 className={styles.summaryTitle}>Summary</h4>
                <div className={styles.summaryRow}>
                  <span>Total Treatment</span>
                  <span>₹{totalTreatment.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Total Medicine</span>
                  <span>₹{totalMedicine.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Discount Applied</span>
                  <span>₹{discountAmount.toFixed(2)}</span>
                </div>
                <div className={styles.netPayable}>
                  <span>Net Payable</span>
                  <span>₹{netPayable.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow} style={{ marginTop: '0.75rem', alignItems: 'center' }}>
                  <span>Amount Paid</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: '#10b981', fontWeight: 600, marginRight: '4px' }}>₹</span>
                    <input 
                      type="number" 
                      value={localAmountPaid}
                      onChange={(e) => setLocalAmountPaid(parseFloat(e.target.value) || 0)}
                      style={{
                        width: '80px',
                        padding: '4px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        textAlign: 'right',
                        color: '#10b981',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
                <div className={styles.summaryRow}>
                  <span>Balance</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>₹{balance.toFixed(2)}</span>
                </div>

                <button className={styles.generateBtn} onClick={handleGenerate}>
                  Generate Invoice & Print
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
