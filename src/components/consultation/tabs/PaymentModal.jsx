import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from '../../../pages/ConsultationWorkspace.module.css';

export default function PaymentModal({ totalBilled, currentPaid, onClose, onPay }) {
  const outstanding = Math.max(0, totalBilled - currentPaid);
  
  const [paymentType, setPaymentType] = useState('full');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const handlePay = () => {
    let amountToPay = 0;
    if (paymentType === 'full') {
      amountToPay = outstanding;
    } else {
      amountToPay = parseFloat(customAmount) || 0;
    }

    if (amountToPay <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    onPay(amountToPay, paymentMethod);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', width: '500px',
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>Record Payment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div 
            onClick={() => setPaymentType('full')}
            style={{ 
              border: `2px solid ${paymentType === 'full' ? '#14b8a6' : '#e2e8f0'}`,
              borderRadius: '8px', padding: '16px', cursor: 'pointer',
              backgroundColor: paymentType === 'full' ? '#f0fdfa' : 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input type="radio" checked={paymentType === 'full'} readOnly style={{ accentColor: '#14b8a6' }} />
              <span style={{ fontWeight: 600, color: '#334155' }}>Full payment</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginLeft: '24px' }}>
              ₹{outstanding.toFixed(2)}
            </div>
          </div>

          <div 
            onClick={() => setPaymentType('partial')}
            style={{ 
              border: `2px solid ${paymentType === 'partial' ? '#14b8a6' : '#e2e8f0'}`,
              borderRadius: '8px', padding: '16px', cursor: 'pointer',
              backgroundColor: paymentType === 'partial' ? '#f0fdfa' : 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input type="radio" checked={paymentType === 'partial'} readOnly style={{ accentColor: '#14b8a6' }} />
              <span style={{ fontWeight: 600, color: '#334155' }}>Partial payment</span>
            </div>
            <div style={{ marginLeft: '24px' }}>
              <input 
                type="number" 
                placeholder="Enter Amount" 
                value={customAmount}
                onChange={(e) => {
                  setPaymentType('partial');
                  setCustomAmount(e.target.value);
                }}
                style={{
                  width: '100%', padding: '8px', border: '1px solid #cbd5e1', 
                  borderRadius: '6px', outline: 'none', marginTop: '4px'
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>Payment method</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {['Cash', 'Bank', 'UPI', 'Card'].map(method => (
              <div 
                key={method}
                onClick={() => setPaymentMethod(method)}
                style={{
                  border: `2px solid ${paymentMethod === method ? '#14b8a6' : '#e2e8f0'}`,
                  borderRadius: '8px', padding: '12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: paymentMethod === method ? '#f0fdfa' : 'white'
                }}
              >
                <input type="radio" checked={paymentMethod === method} readOnly style={{ accentColor: '#14b8a6' }} />
                <span style={{ fontWeight: 500, color: '#334155' }}>{method}</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handlePay}
          className={styles.btnPrimary} 
          style={{ width: '100%', padding: '12px', fontSize: '1rem', backgroundColor: '#14b8a6', border: 'none', marginTop: '8px' }}
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
}
