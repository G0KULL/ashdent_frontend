import React, { useState, useEffect, useRef } from 'react';
import styles from '../../../pages/ConsultationWorkspace.module.css';
import { useConsultation } from '../../../context/ConsultationContext';

const API = 'http://127.0.0.1:8000/api';

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}');
  return {
    'Content-Type': 'application/json',
    'X-User-Id': user.id || '',
    'X-Username': user.username || ''
  };
}

const PrescriptionTab = () => {
  const { patient, prescriptions: contextRx, setPrescriptions: setContextRx } = useConsultation();

  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [advices, setAdvices] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const searchContainerRef = useRef(null);

  // Local prescription items list
  const [items, setItems] = useState(() => {
    if (Array.isArray(contextRx) && contextRx.length > 0) {
      return contextRx.map((it, idx) => ({
        id: it.id || idx + 1,
        name: it.name || it.medicine_name || '',
        dose: it.dose || it.dosage || '500mg',
        freq: it.freq || it.frequency || '1-0-1',
        dur: it.dur || it.duration || '5 Days',
        inst: it.inst || it.notes || it.advice || 'After Food',
        qty: it.qty || it.quantity || 1,
        unit_price: it.price || it.unit_price || 0
      }));
    }
    return [];
  });

  // Fetch live catalogue medicines from backend
  const fetchMedicines = async () => {
    setLoadingMeds(true);
    try {
      const res = await fetch(`${API}/medicine-master/list/`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAvailableMedicines(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching medicine catalogue:', err);
    } finally {
      setLoadingMeds(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Sync back to context whenever items change
  useEffect(() => {
    if (setContextRx) {
      setContextRx(items);
    }
  }, [items, setContextRx]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMedicines = (availableMedicines || []).filter(m => {
    if (!m || !m.name) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      (m.dosage && m.dosage.toLowerCase().includes(q)) ||
      (m.frequency && m.frequency.toLowerCase().includes(q)) ||
      (m.notes && m.notes.toLowerCase().includes(q))
    );
  });

  const handleSelectMedicine = (med) => {
    if (!med) return;
    const newItem = {
      id: Date.now() + Math.random(),
      name: med.name,
      dose: med.dosage || '500mg',
      freq: med.frequency || '1-0-1',
      dur: '5 Days',
      inst: 'After Food',
      qty: 1,
      unit_price: parseFloat(med.sales_rate) || 0
    };
    setItems(prev => [...prev, newItem]);
    setSearch('');
    setShowDropdown(false);
  };

  const handleAddCustom = async () => {
    const name = prompt('Enter Medicine Name:');
    if (!name || !name.trim()) return;
    const dosage = prompt('Enter Dosage/Strength (optional):', '500mg') || '';
    const frequency = prompt('Enter Frequency (optional):', '1-0-1') || '';
    
    // Save to MedicineMaster backend so it persists in the catalogue
    try {
      const res = await fetch(`${API}/medicine-master/list/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: name.trim(), dosage, frequency })
      });
      if (res.ok) {
        const saved = await res.json();
        setAvailableMedicines(prev => [...prev, saved]);
        handleSelectMedicine(saved);
        return;
      }
    } catch (e) {
      console.warn('Could not save to catalogue master, adding locally:', e);
    }

    handleSelectMedicine({ name: name.trim(), dosage, frequency, sales_rate: 0 });
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleSavePrescription = async () => {
    if (items.length === 0) {
      alert('Please select at least one medicine before saving.');
      return;
    }
    setSaving(true);
    setSaveSuccess('');

    try {
      // 1) Get/create visit if real patient exists
      let visitId = null;
      const patId = patient?.id && String(patient.id).toUpperCase() !== 'NEW' ? patient.id : null;

      if (patId) {
        try {
          const resV = await fetch(`${API}/visit/get-or-create/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ patient_id: patId })
          });
          if (resV.ok) {
            const vData = await resV.json();
            visitId = vData.visit_id || vData.id;
          }
        } catch (vErr) {
          console.warn('Could not establish visit for patient:', vErr);
        }
      }

      // 2) Save prescription to backend
      const payload = {
        patient: patId,
        visit: visitId,
        notes: advices.trim(),
        items: items.map(it => ({
          medicine_name: it.name,
          dosage: it.freq ? `${it.dose || ''} (${it.freq})`.trim() : (it.dose || '1-0-1'),
          duration: it.dur || '5 days',
          quantity: parseInt(it.qty) || 1,
          unit_price: parseFloat(it.unit_price) || 0,
          notes: it.inst || ''
        }))
      };

      const resP = await fetch(`${API}/prescription/add/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (resP.ok) {
        setSaveSuccess('Prescription saved successfully and queued in Pharmacy!');
        setTimeout(() => setSaveSuccess(''), 5000);
      } else {
        const err = await resP.json().catch(() => ({}));
        alert(err.error || 'Failed to save prescription to server.');
      }
    } catch (err) {
      console.error('Error saving prescription:', err);
      alert('Failed to connect to prescription service.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h4 className={styles.headerTitle} style={{ margin: 0 }}>Prescription & Pharmacy Medicines</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
              Select medicines from the pharmacy catalogue or type to search.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className={styles.btnSecondary} onClick={() => window.print()}>Print Rx</button>
            <button className={styles.btnSecondary} onClick={fetchMedicines} title="Refresh catalogue">↻ Refresh</button>
            <button className={styles.btnPrimary} onClick={handleAddCustom}>+ Add New Medicine</button>
            <button
              className={styles.btnPrimary}
              onClick={handleSavePrescription}
              disabled={saving || items.length === 0}
              style={{ backgroundColor: '#059669', opacity: items.length === 0 ? 0.6 : 1 }}
            >
              {saving ? 'Saving...' : '💾 Save Prescription'}
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
            ✓ {saveSuccess}
          </div>
        )}

        {/* Search Bar with live autocomplete */}
        <div ref={searchContainerRef} style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <input 
              type="text" 
              placeholder="🔍 Search medicines by name, strength, dosage or notes..." 
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.875rem' }} 
            />
          </div>

          {showDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px',
              maxHeight: '260px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
              {filteredMedicines.length === 0 ? (
                <div style={{ padding: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
                  No matching medicines found. Click <strong>"+ Add New Medicine"</strong> to create one.
                </div>
              ) : (
                filteredMedicines.map(m => (
                  <div
                    key={m.id || m.name}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectMedicine(m);
                    }}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.875rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{m.name}</span>
                      <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#64748b' }}>
                        {m.dosage ? `${m.dosage} ` : ''}{m.frequency ? `· ${m.frequency}` : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {m.stock_quantity !== undefined && (
                        <span style={{ fontSize: '0.75rem', color: m.stock_quantity <= (m.low_stock_threshold || 10) ? '#dc2626' : '#64748b' }}>
                          Stock: {m.stock_quantity}
                        </span>
                      )}
                      <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.8125rem' }}>
                        ₹{parseFloat(m.sales_rate || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected Prescription Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Medicine Name</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Dosage</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Frequency (M-A-N)</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Duration</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Instructions</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600' }}>Qty</th>
                <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                    No medicines in this prescription yet. Search above or click <strong>"+ Add New Medicine"</strong>.
                  </td>
                </tr>
              ) : (
                items.map((med) => (
                  <tr key={med.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#0f172a' }}>
                      {med.name}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <input
                        type="text"
                        value={med.dose}
                        onChange={e => updateItem(med.id, 'dose', e.target.value)}
                        placeholder="e.g. 500mg"
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', width: '90px' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <select
                        value={med.freq}
                        onChange={e => updateItem(med.id, 'freq', e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                      >
                        <option value="1-0-1">1-0-1 (Twice daily)</option>
                        <option value="1-1-1">1-1-1 (Thrice daily)</option>
                        <option value="0-0-1">0-0-1 (Night only)</option>
                        <option value="1-0-0">1-0-0 (Morning only)</option>
                        <option value="SOS">SOS (As needed)</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <input
                        type="text"
                        value={med.dur}
                        onChange={e => updateItem(med.id, 'dur', e.target.value)}
                        placeholder="e.g. 5 Days"
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', width: '80px' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <select
                        value={med.inst}
                        onChange={e => updateItem(med.id, 'inst', e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                      >
                        <option value="After Food">After Food</option>
                        <option value="Before Food">Before Food</option>
                        <option value="With Milk">With Milk</option>
                        <option value="Empty Stomach">Empty Stomach</option>
                        <option value="As Directed">As Directed</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <input
                        type="number"
                        min="1"
                        value={med.qty}
                        onChange={e => updateItem(med.id, 'qty', parseInt(e.target.value) || 1)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', width: '55px' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => removeItem(med.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                      >
                        ✕ Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.card}>
        <h4 className={styles.headerTitle} style={{ marginBottom: '1rem' }}>Advices / Instructions</h4>
        <textarea 
          value={advices}
          onChange={e => setAdvices(e.target.value)}
          style={{ 
            width: '100%', 
            boxSizing: 'border-box',
            minHeight: '100px', 
            padding: '1rem', 
            borderRadius: '8px', 
            border: '1px solid #cbd5e1', 
            outline: 'none', 
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: '0.875rem'
          }} 
          placeholder="General advices (diet, rest, follow-up instructions)..."
        />
      </div>
    </div>
  );
};

export default PrescriptionTab;
