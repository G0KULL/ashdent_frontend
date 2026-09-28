import React, { useState } from 'react';
import Swal from 'sweetalert2';
import styles from '../../../pages/ConsultationWorkspace.module.css';
import InvoicePreviewModal from '../../InvoicePreviewModal';
import PaymentModal from './PaymentModal';
import { useConsultation } from '../../../context/ConsultationContext';

const BillingTab = () => {
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);

  const { plannedProcedures, prescriptions } = useConsultation();

  const subtotal = plannedProcedures.reduce((sum, p) => sum + (parseFloat(p.cost) || 0), 0);
  const tax = subtotal * 0.05;
  const totalBilled = subtotal + tax;
  const outstanding = Math.max(0, totalBilled - amountPaid);

  const handlePayment = (amount, method) => {
    setAmountPaid(prev => prev + amount);
    setIsPaymentModalOpen(false);
    Swal.fire({
      title: 'Payment Recorded',
      text: `Successfully recorded payment of $${amount.toFixed(2)} via ${method}.`,
      icon: 'success',
      confirmButtonColor: '#14b8a6'
    });
  };

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', position: 'relative' }}>
      <div className={styles.card} style={{ flex: 2 }}>
        <h4 className={styles.headerTitle}>Treatment Charges</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Procedure</th>
              <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {plannedProcedures.length > 0 ? plannedProcedures.map((p, idx) => (
              <tr key={idx}>
                <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>Today</td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>{p.procedure}</td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: '500' }}>${p.cost}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No treatments found.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className={styles.btnSecondary}>Add Discount</button>
          <button className={styles.btnPrimary} onClick={() => setIsPaymentModalOpen(true)}>Record Payment</button>
        </div>
      </div>

      <div className={styles.card} style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <h4 className={styles.headerTitle}>Invoice Summary</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Subtotal</span>
            <span style={{ fontWeight: '500', color: '#334155' }}>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Discount</span>
            <span style={{ fontWeight: '500', color: '#10b981' }}>-$0.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Tax (5%)</span>
            <span style={{ fontWeight: '500', color: '#334155' }}>${tax.toFixed(2)}</span>
          </div>
          <div style={{ height: '1px', backgroundColor: '#e2e8f0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem' }}>
            <span style={{ fontWeight: '600', color: '#0f172a' }}>Total Billed</span>
            <span style={{ fontWeight: '700', color: '#0f172a' }}>${totalBilled.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Amount Paid</span>
            <span style={{ fontWeight: '500', color: '#10b981' }}>${amountPaid.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <span style={{ fontWeight: '600', color: '#b91c1c' }}>Outstanding</span>
            <span style={{ fontWeight: '700', color: '#ef4444' }}>${outstanding.toFixed(2)}</span>
          </div>
        </div>
        
        <button 
          className={styles.btnSecondary} 
          style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', backgroundColor: '#14b8a6', color: 'white', border: 'none' }}
          onClick={() => setIsInvoicePreviewOpen(true)}
        >
          Generate Invoice
        </button>
      </div>

      {isPaymentModalOpen && (
        <PaymentModal
          totalBilled={totalBilled}
          currentPaid={amountPaid}
          onClose={() => setIsPaymentModalOpen(false)}
          onPay={handlePayment}
        />
      )}

      {isInvoicePreviewOpen && (
        <InvoicePreviewModal 
            plans={plannedProcedures}
            medicines={prescriptions}
            patientName={'Walk-in Patient'}
            amountPaid={amountPaid}
            onClose={() => setIsInvoicePreviewOpen(false)}
        />
      )}
    </div>
  );
};

export default BillingTab;
