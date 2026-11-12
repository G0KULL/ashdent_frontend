import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Trash2, Printer, CheckCircle, XCircle, RefreshCw, FileText, PlusCircle } from 'lucide-react';
import styles from './InvoicePreviewModal.module.css';
import Swal from 'sweetalert2';

const API_BASE = 'http://127.0.0.1:8000/api';

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}');
  return {
    'Content-Type': 'application/json',
    'X-User-Id': user.id || '',
    'X-Username': user.username || ''
  };
}

const printPdf = async (url) => {
  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    let iframe = document.getElementById('print-pdf-iframe');
    if (iframe) {
      if (iframe.dataset.blobUrl) URL.revokeObjectURL(iframe.dataset.blobUrl);
    } else {
      iframe = document.createElement('iframe');
      iframe.id = 'print-pdf-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    iframe.dataset.blobUrl = blobUrl;
    iframe.src = blobUrl;

    let isPrinted = false;
    const doPrint = () => {
      if (isPrinted) return;
      isPrinted = true;
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };
    iframe.onload = doPrint;
    setTimeout(doPrint, 1500);
  } catch (e) {
    console.error("Failed to print PDF:", e);
    alert("Could not print PDF: " + e.message);
  }
};

export default function EstimateModal({
  patientId,
  patientName = 'Patient',
  doctorId,
  doctorName = '',
  plans = [],
  treatmentPlanId = null,
  onClose
}) {
  const [estimatesList, setEstimatesList] = useState([]);
  const [activeEstimate, setActiveEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('create'); // 'create' | 'view' | 'staged_bill'

  // Draft form state for new estimate
  const [draftItems, setDraftItems] = useState(() => {
    return (plans || []).map(p => {
      const stdPrice = parseFloat(p.standard_price || p.cost || 400);
      const uPrice = parseFloat(p.finalAmount || p.cost || stdPrice);
      return {
        plan_item_id: p.id,
        tooth_number: p.tooth || p.tooth_number || '',
        procedure_name: p.procedure || p.procedure_name || 'Treatment',
        surface: p.surface || 'All',
        quantity: 1,
        standard_price: stdPrice,
        unit_price: uPrice,
        discount: parseFloat(p.discount || 0)
      };
    });
  });

  const [taxPercent, setTaxPercent] = useState('0');
  const [generalDiscount, setGeneralDiscount] = useState('0');
  const [notes, setNotes] = useState('');

  // Staged billing state
  const [stagedSelection, setStagedSelection] = useState({});
  const [stagedPaidAmount, setStagedPaidAmount] = useState('');
  const [stagedPaymentMethod, setStagedPaymentMethod] = useState('Cash');

  // Load patient's existing estimates
  const fetchEstimates = async () => {
    if (!patientId || patientId === 'new') return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/patients/${patientId}/estimates/`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEstimatesList(data || []);
        if (data && data.length > 0 && !activeEstimate) {
          setActiveEstimate(data[0]);
          setMode('view');
        }
      }
    } catch (err) {
      console.warn("Could not fetch estimates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, [patientId]);

  // Calculations for Draft Mode
  const draftSubtotal = draftItems.reduce((acc, it) => acc + (it.unit_price * (it.quantity || 1)), 0);
  const draftItemDiscounts = draftItems.reduce((acc, it) => acc + (parseFloat(it.discount) || 0), 0);
  const draftTotalDiscount = draftItemDiscounts + (parseFloat(generalDiscount) || 0);
  const draftTaxable = Math.max(0, draftSubtotal - draftTotalDiscount);
  const draftTaxAmount = draftTaxable * ((parseFloat(taxPercent) || 0) / 100);
  const draftGrandTotal = Math.max(0, draftTaxable + draftTaxAmount);

  // Handle saving a new Estimate
  const handleSaveEstimate = async () => {
    if (draftItems.length === 0) {
      return alert("Please add at least one treatment item.");
    }
    setLoading(true);
    try {
      const payload = {
        doctor_id: doctorId || null,
        treatment_plan_id: treatmentPlanId || null,
        status: 'Draft',
        tax_percent: parseFloat(taxPercent) || 0,
        discount: parseFloat(generalDiscount) || 0,
        notes: notes,
        items: draftItems
      };

      const res = await fetch(`${API_BASE}/patients/${patientId}/estimates/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        Swal.fire({
          title: 'Estimate Created',
          text: `Estimate #${data.estimate_number} saved successfully for ₹${data.grand_total.toFixed(2)}`,
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        await fetchEstimates();
        setMode('view');
      } else {
        const err = await res.text();
        alert("Failed to save estimate: " + err);
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  // Status Change (Accept / Reject)
  const handleStatusChange = async (estId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/estimates/${estId}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        Swal.fire('Updated', `Estimate status set to ${newStatus}`, 'success');
        fetchEstimates();
      }
    } catch (e) {
      alert("Could not update status.");
    }
  };

  // Handle Staged Conversion into Final Bill
  const handleConvertToBill = async () => {
    if (!activeEstimate) return;
    const itemsToBill = [];
    (activeEstimate.items || []).forEach(it => {
      if (stagedSelection[it.id]) {
        itemsToBill.push({
          estimate_item_id: it.id,
          quantity: stagedSelection[it.id].qty || it.remaining_quantity || 1,
          unit_price: it.unit_price,
          discount: it.discount
        });
      }
    });

    if (itemsToBill.length === 0) {
      return alert("Please select at least one completed procedure to bill.");
    }

    try {
      setLoading(true);
      const payload = {
        items: itemsToBill,
        paid_amount: parseFloat(stagedPaidAmount) || 0,
        payment_method: stagedPaymentMethod,
        notes: `Staged bill from Estimate #${activeEstimate.estimate_number}`
      };

      const res = await fetch(`${API_BASE}/estimates/${activeEstimate.id}/convert-to-bill/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        Swal.fire({
          title: 'Invoice Generated!',
          text: `Invoice #${data.invoice_number} generated for ₹${data.total_amount.toFixed(2)}. Remaining balance: ₹${data.balance_amount.toFixed(2)}`,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'Print Tax Invoice',
          cancelButtonText: 'Close',
          confirmButtonColor: '#10b981'
        }).then(result => {
          if (result.isConfirmed) {
            printPdf(`${API_BASE}/billing/${data.billing_id}/pdf/`);
          }
          fetchEstimates();
          setMode('view');
        });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to generate bill.");
      }
    } catch (e) {
      console.error(e);
      alert("Server error converting to bill.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '960px', width: '95vw' }}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>
              {mode === 'create' ? 'Create Treatment Estimate' : mode === 'staged_bill' ? 'Staged Billing from Estimate' : 'Estimate & Quotation Management'}
            </h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Patient: <strong>{patientName}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {estimatesList.length > 0 && mode !== 'create' && (
              <button 
                onClick={() => setMode('create')} 
                style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <PlusCircle size={14} /> New Estimate
              </button>
            )}
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Version Switcher Bar */}
        {estimatesList.length > 0 && (
          <div style={{ background: '#f8fafc', padding: '10px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', overflowX: 'auto', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginRight: '4px' }}>Saved Estimates:</span>
            {estimatesList.map(est => (
              <button
                key={est.id}
                onClick={() => { setActiveEstimate(est); setMode('view'); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: activeEstimate?.id === est.id ? '2px solid #10b981' : '1px solid #cbd5e1',
                  background: activeEstimate?.id === est.id ? '#ecfdf5' : 'white',
                  color: activeEstimate?.id === est.id ? '#065f46' : '#334155',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                #{est.estimate_number} (v{est.version}) - {est.status}
              </button>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div className={styles.body}>

          {/* ════ MODE: VIEW / MANAGE EXISTING ESTIMATE ════ */}
          {mode === 'view' && activeEstimate && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '12px 16px', background: '#f1f5f9', borderRadius: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                    Estimate #{activeEstimate.estimate_number} 
                    <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: activeEstimate.status === 'Accepted' ? '#dcfce7' : activeEstimate.status === 'Converted' ? '#dbeafe' : '#fef3c7', color: activeEstimate.status === 'Accepted' ? '#15803d' : activeEstimate.status === 'Converted' ? '#1e40af' : '#b45309', fontWeight: 'bold' }}>
                      {activeEstimate.status}
                    </span>
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Doctor: Dr. {activeEstimate.doctor} | Issued: {activeEstimate.created_at} | Valid: {activeEstimate.valid_until || '30 days'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => printPdf(`${API_BASE}/estimates/${activeEstimate.id}/pdf/`)}
                    style={{ padding: '6px 12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Printer size={14} /> Print PDF
                  </button>

                  {activeEstimate.status === 'Draft' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(activeEstimate.id, 'Accepted')}
                        style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCircle size={14} /> Accept
                      </button>
                      <button
                        onClick={() => handleStatusChange(activeEstimate.id, 'Rejected')}
                        style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}

                  {(activeEstimate.status === 'Accepted' || activeEstimate.status === 'Partially Converted') && (
                    <button
                      onClick={() => {
                        // Pre-populate staged items selection
                        const initialSel = {};
                        (activeEstimate.items || []).forEach(it => {
                          if (it.remaining_quantity > 0) {
                            initialSel[it.id] = { selected: true, qty: it.remaining_quantity };
                          }
                        });
                        setStagedSelection(initialSel);
                        setMode('staged_bill');
                      }}
                      style={{ padding: '6px 14px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      ⚡ Bill Completed Items
                    </button>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className={styles.tableWrapper}>
                <table className={styles.treatmentTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '8%' }}>Tooth</th>
                      <th style={{ width: '40%' }}>Treatment Procedure</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Total Qty</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Billed</th>
                      <th style={{ width: '14%', textAlign: 'right' }}>Unit Rate</th>
                      <th style={{ width: '18%', textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeEstimate.items || []).map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td style={{ fontWeight: '600' }}>{it.tooth_number ? `#${it.tooth_number}` : 'Gen'}</td>
                        <td style={{ fontWeight: '500' }}>{it.procedure_name}</td>
                        <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                        <td style={{ textAlign: 'center', color: it.billed_quantity > 0 ? '#10b981' : '#64748b', fontWeight: '600' }}>
                          {it.billed_quantity}
                        </td>
                        <td style={{ textAlign: 'right' }}>₹{it.unit_price.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{it.total_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <div style={{ width: '280px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>
                    <span>Subtotal:</span>
                    <span>₹{activeEstimate.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>
                    <span>Discount:</span>
                    <span>- ₹{activeEstimate.discount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>
                    <span>Tax:</span>
                    <span>+ ₹{activeEstimate.tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #cbd5e1', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                    <span>Grand Total:</span>
                    <span style={{ color: '#10b981' }}>₹{activeEstimate.grand_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ MODE: STAGED FINAL BILLING CONVERSION ════ */}
          {mode === 'staged_bill' && activeEstimate && (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <h4 style={{ margin: 0, color: '#065f46', fontSize: '14px' }}>Staged Final Billing Selection</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#047857' }}>
                  Select the treatments actually completed during this visit. Only selected items will be billed. Remaining items can be billed in subsequent visits.
                </p>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.treatmentTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%', textAlign: 'center' }}>Select</th>
                      <th style={{ width: '10%' }}>Tooth</th>
                      <th style={{ width: '40%' }}>Procedure</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Remaining Qty</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Rate (₹)</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Bill Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeEstimate.items || []).filter(it => it.remaining_quantity > 0).map(it => {
                      const isChecked = !!stagedSelection[it.id]?.selected;
                      return (
                        <tr key={it.id} style={{ background: isChecked ? '#f0fdf4' : 'transparent' }}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                setStagedSelection(prev => ({
                                  ...prev,
                                  [it.id]: { selected: e.target.checked, qty: it.remaining_quantity }
                                }));
                              }}
                            />
                          </td>
                          <td style={{ fontWeight: '600' }}>#{it.tooth_number || 'Gen'}</td>
                          <td style={{ fontWeight: '500' }}>{it.procedure_name}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{it.remaining_quantity}</td>
                          <td style={{ textAlign: 'right' }}>₹{it.unit_price.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>
                            ₹{(it.unit_price * (stagedSelection[it.id]?.qty || it.remaining_quantity)).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Payment on Generation */}
              <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className={styles.inputLabel}>Amount Received Now (₹)</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    placeholder="0.00 (leave 0 if unpaid)"
                    value={stagedPaidAmount}
                    onChange={e => setStagedPaidAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className={styles.inputLabel}>Payment Method</label>
                  <select
                    className={styles.inputField}
                    value={stagedPaymentMethod}
                    onChange={e => setStagedPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => setMode('view')}
                    style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConvertToBill}
                    disabled={loading}
                    style={{ flex: 2, padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {loading ? 'Generating...' : 'Issue Final Bill'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════ MODE: CREATE DRAFT ESTIMATE ════ */}
          {mode === 'create' && (
            <div>
              <div className={styles.tableWrapper}>
                <table className={styles.treatmentTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Tooth</th>
                      <th style={{ width: '38%' }}>Treatment Procedure</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>Qty</th>
                      <th style={{ width: '14%', textAlign: 'right' }}>Std Rate</th>
                      <th style={{ width: '16%', textAlign: 'right' }}>Negotiated Rate</th>
                      <th style={{ width: '14%', textAlign: 'right' }}>Line Total</th>
                      <th style={{ width: '6%', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftItems.map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="text"
                            value={it.tooth_number}
                            onChange={e => {
                              const copy = [...draftItems];
                              copy[idx].tooth_number = e.target.value;
                              setDraftItems(copy);
                            }}
                            style={{ width: '50px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ fontWeight: '500' }}>{it.procedure_name}</td>
                        <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                        <td style={{ textAlign: 'right', color: '#94a3b8' }}>₹{it.standard_price.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <span>₹</span>
                            <input
                              type="number"
                              value={it.unit_price}
                              onChange={e => {
                                const copy = [...draftItems];
                                copy[idx].unit_price = parseFloat(e.target.value) || 0;
                                setDraftItems(copy);
                              }}
                              style={{ width: '80px', marginLeft: '4px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', fontWeight: 'bold' }}
                            />
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>
                          ₹{(it.unit_price * it.quantity - it.discount).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Trash2
                            size={16}
                            style={{ color: '#ef4444', cursor: 'pointer' }}
                            onClick={() => setDraftItems(draftItems.filter((_, i) => i !== idx))}
                          />
                        </td>
                      </tr>
                    ))}
                    {draftItems.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                          No treatment procedures in estimate draft.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Controls and Summary Grid */}
              <div className={styles.bottomSection}>
                <div className={styles.bottomLeft}>
                  <div className={styles.inputsWrapper}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Additional Discount (₹)</label>
                      <input
                        type="number"
                        className={styles.inputField}
                        placeholder="0.00"
                        value={generalDiscount}
                        onChange={e => setGeneralDiscount(e.target.value)}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Tax (%)</label>
                      <input
                        type="number"
                        className={styles.inputField}
                        placeholder="0"
                        value={taxPercent}
                        onChange={e => setTaxPercent(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={styles.inputLabel}>Notes & Quotation Terms</label>
                    <textarea
                      rows="2"
                      className={styles.inputField}
                      placeholder="Special clinical instructions, package terms, or payment schedule..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.bottomRight}>
                  <div className={styles.summaryBox}>
                    <h3 className={styles.summaryTitle}>Estimate Calculation</h3>
                    <div className={styles.summaryRow}>
                      <span>Subtotal</span>
                      <span>₹{draftSubtotal.toFixed(2)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Total Discounts</span>
                      <span style={{ color: '#ef4444' }}>- ₹{draftTotalDiscount.toFixed(2)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Tax Amount</span>
                      <span>+ ₹{draftTaxAmount.toFixed(2)}</span>
                    </div>
                    <div className={styles.netPayable}>
                      <span>Estimated Grand Total</span>
                      <span style={{ color: '#10b981' }}>₹{draftGrandTotal.toFixed(2)}</span>
                    </div>

                    <button
                      className={styles.generateBtn}
                      onClick={handleSaveEstimate}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Formal Estimate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

