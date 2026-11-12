import React, { useState, useEffect } from 'react';
import { useConsultation } from '../context/ConsultationContext';

const API = 'http://127.0.0.1:8000/api';

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}');
  return {
    'Content-Type': 'application/json',
    'X-User-Id': user.id || '',
    'X-Username': user.username || ''
  };
}

export default function MedicationsSection({ patientId }) {
  const [medicines, setMedicines] = useState([]);
  const { prescriptions: rxItems, setPrescriptions: setRxItems } = useConsultation();
  const [medSearch, setMedSearch] = useState('');
  const [showMedResults, setShowMedResults] = useState(false);

  // Modal State for "Add New Medicine" matching Pharmacy Module
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingMed, setSavingMed] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    name: '',
    dosage: '',
    frequency: '1-0-1',
    stock_quantity: 0,
    low_stock_threshold: 10,
    purchase_rate: 0,
    sales_rate: 0
  });

  const fetchMedicines = () => {
    fetch(`${API}/medicine-master/list/`, { headers: getHeaders() })
      .then(r => r.json())
      .then(data => setMedicines(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const addMedicine = (med) => {
    if (!med) return;
    setRxItems(prev => [
      ...(Array.isArray(prev) ? prev : []),
      {
        name: med.name,
        content: med.notes || med.dosage || '-',
        unit_price: parseFloat(med.sales_rate) || 0,
        dosage: med.dosage || '500mg',
        time: med.frequency || '1-0-1',
        duration: 5,
        quantity: 1,
        advice: 'After Food',
        notes: ''
      }
    ]);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newMedForm.name || !newMedForm.name.trim()) {
      alert('Medicine name is required');
      return;
    }

    setSavingMed(true);
    try {
      const payload = {
        name: newMedForm.name.trim(),
        dosage: newMedForm.dosage || '',
        frequency: newMedForm.frequency || '1-0-1',
        stock_quantity: parseInt(newMedForm.stock_quantity) || 0,
        low_stock_threshold: parseInt(newMedForm.low_stock_threshold) || 10,
        purchase_rate: parseFloat(newMedForm.purchase_rate) || 0,
        sales_rate: parseFloat(newMedForm.sales_rate) || 0
      };

      // Direct connection with Pharmacy Module's stock API endpoint
      const res = await fetch(`${API}/stock/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        // Refresh catalogue so it appears everywhere in pharmacy & consultation
        fetchMedicines();

        // Automatically add the newly created medicine to current prescription
        addMedicine({
          name: saved.name || newMedForm.name.trim(),
          dosage: saved.dosage || newMedForm.dosage,
          frequency: saved.frequency || newMedForm.frequency,
          sales_rate: saved.sales_rate !== undefined ? saved.sales_rate : newMedForm.sales_rate,
          stock_quantity: saved.stock_quantity !== undefined ? saved.stock_quantity : newMedForm.stock_quantity
        });

        // Reset form & close modal
        setShowCreateModal(false);
        setNewMedForm({
          name: '',
          dosage: '',
          frequency: '1-0-1',
          stock_quantity: 0,
          low_stock_threshold: 10,
          purchase_rate: 0,
          sales_rate: 0
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create medicine in pharmacy.');
      }
    } catch (err) {
      console.error('Error creating medicine:', err);
      alert('Error connecting to server. Please try again.');
    } finally {
      setSavingMed(false);
    }
  };

  const updateRxItem = (idx, field, val) => {
    setRxItems(prev =>
      (Array.isArray(prev) ? prev : []).map((it, i) =>
        i === idx ? { ...it, [field]: val } : it
      )
    );
  };

  const filteredMeds = (Array.isArray(medicines) ? medicines : []).filter(m => {
    if (!m || !m.name) return false;
    const q = medSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      (m.dosage && m.dosage.toLowerCase().includes(q)) ||
      (m.frequency && m.frequency.toLowerCase().includes(q)) ||
      (m.notes && m.notes.toLowerCase().includes(q))
    );
  });

  const safeItems = Array.isArray(rxItems) ? rxItems : [];

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)', border: '1px solid #e2e8f0', marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Medications</h2>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Prescribe medicines from pharmacy inventory for this consultation.
          </div>
        </div>
        <button onClick={fetchMedicines} style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>↻</span> Refresh Catalogue
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Click to search or select pharmacy medicines..."
              value={medSearch}
              onChange={e => {
                setMedSearch(e.target.value);
                setShowMedResults(true);
              }}
              onFocus={() => setShowMedResults(true)}
              onBlur={() => setTimeout(() => setShowMedResults(false), 250)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box', color: '#334155' }}
            />
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
              ▼
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '12px 20px', borderRadius: 8, background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Create New Medicine
          </button>
        </div>

        {showMedResults && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 12, marginTop: 6,
            maxHeight: 250, overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            {filteredMeds.length === 0 ? (
              <div style={{ padding: '14px', fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                No medicines found matching "{medSearch}". Click "+ Create New Medicine" to add to pharmacy.
              </div>
            ) : (
              filteredMeds.map(m => (
                <div
                  key={m.id || m.name}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addMedicine(m);
                    setMedSearch('');
                    setShowMedResults(false);
                  }}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', fontSize: 13, background: 'white' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0f172a' }}>
                    <span>{m.name}</span>
                    <span style={{ color: '#10b981' }}>₹{m.sales_rate || 0}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {m.dosage || ''} {m.frequency ? `· ${m.frequency}` : ''} {m.stock_quantity !== undefined ? `(Stock: ${m.stock_quantity})` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {safeItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8', fontSize: 14, background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
          No medicines prescribed for this visit. Click the search box above to select from the catalogue, or click "+ Create New Medicine".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '30px 1.2fr 1.5fr 75px 90px 90px 90px 50px 110px 40px', gap: 12, fontSize: 12, fontWeight: 600, color: '#64748b', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
            <span>#</span>
            <span>Medicine</span>
            <span>Content</span>
            <span>Price</span>
            <span>Dosage</span>
            <span>Time</span>
            <span>Days</span>
            <span>Qty</span>
            <span>Advice</span>
            <span></span>
          </div>
          {safeItems.map((it, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '30px 1.2fr 1.5fr 75px 90px 90px 90px 50px 110px 40px', gap: 12, alignItems: 'center', background: '#fff', padding: '12px 16px', borderBottom: idx !== safeItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{idx + 1}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{it.name}</span>
              <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{it.content}</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={it.unit_price}
                  onChange={e => updateRxItem(idx, 'unit_price', e.target.value)}
                  style={{ width: '100%', padding: '6px 4px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff', fontWeight: 600 }}
                />
              </div>
              
              <input
                type="text"
                value={it.dosage}
                onChange={e => updateRxItem(idx, 'dosage', e.target.value)}
                placeholder="e.g. 500mg"
                style={{ padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff' }}
              />

              <select
                value={it.time}
                onChange={e => updateRxItem(idx, 'time', e.target.value)}
                style={{ padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff' }}
              >
                <option value="Select">Select</option>
                <option value="1-0-1">1-0-1</option>
                <option value="1-1-1">1-1-1</option>
                <option value="0-0-1">0-0-1</option>
                <option value="1-0-0">1-0-0</option>
                <option value="SOS">SOS</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => updateRxItem(idx, 'duration', Math.max(1, parseInt(it.duration || 1) - 1))}
                  style={{ padding: '6px 8px', background: '#f8fafc', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b' }}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={it.duration || 1}
                  onChange={e => updateRxItem(idx, 'duration', parseInt(e.target.value) || 1)}
                  style={{ width: '100%', padding: '6px 0', fontSize: 12, border: 'none', textAlign: 'center', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => updateRxItem(idx, 'duration', parseInt(it.duration || 1) + 1)}
                  style={{ padding: '6px 8px', background: '#f8fafc', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b' }}
                >
                  +
                </button>
              </div>

              <input
                type="number"
                min="1"
                value={it.quantity || 1}
                onChange={e => updateRxItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                style={{ width: '45px', padding: '6px 4px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff', textAlign: 'center' }}
              />
              
              <select
                value={it.advice}
                onChange={e => updateRxItem(idx, 'advice', e.target.value)}
                style={{ padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff' }}
              >
                <option value="Select">Select</option>
                <option value="Before Food">Before Food</option>
                <option value="After Food">After Food</option>
                <option value="With Food">With Food</option>
                <option value="Empty Stomach">Empty Stomach</option>
              </select>

              <button
                type="button"
                onClick={() => setRxItems(p => (Array.isArray(p) ? p : []).filter((_, i) => i !== idx))}
                title="Remove medicine"
                style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE NEW MEDICINE MODAL (DIRECTLY CONNECTED TO PHARMACY MODULE) ── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, width: '90%', maxWidth: 540,
            padding: '24px 28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Add New Medicine</h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Connected directly with the Pharmacy module and inventory database.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Medicine Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Moxikind CV 625, Paracetamol 500mg"
                  value={newMedForm.name}
                  onChange={e => setNewMedForm({ ...newMedForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Dosage / Strength (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 625mg, 10ml"
                    value={newMedForm.dosage}
                    onChange={e => setNewMedForm({ ...newMedForm, dosage: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Default Frequency (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1-0-1, 1-1-1, SOS"
                    value={newMedForm.frequency}
                    onChange={e => setNewMedForm({ ...newMedForm, frequency: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newMedForm.stock_quantity}
                    onChange={e => setNewMedForm({ ...newMedForm, stock_quantity: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Low Stock Alert (units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={newMedForm.low_stock_threshold}
                    onChange={e => setNewMedForm({ ...newMedForm, low_stock_threshold: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Purchase Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newMedForm.purchase_rate}
                    onChange={e => setNewMedForm({ ...newMedForm, purchase_rate: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Sales Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newMedForm.sales_rate}
                    onChange={e => setNewMedForm({ ...newMedForm, sales_rate: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMed}
                  style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#0284c7', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {savingMed ? 'Saving...' : 'Save & Prescribe Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
