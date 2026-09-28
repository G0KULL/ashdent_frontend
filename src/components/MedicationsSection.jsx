import React, { useState, useEffect } from 'react';
import { useConsultation } from '../context/ConsultationContext';

export default function MedicationsSection() {
  const [medicines, setMedicines] = useState([]);
  const { prescriptions: rxItems, setPrescriptions: setRxItems } = useConsultation();
  const [medSearch, setMedSearch] = useState('');
  const [showMedResults, setShowMedResults] = useState(false);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/medicine-master/list/')
      .then(r => r.json())
      .then(setMedicines)
      .catch(console.error);
  }, []);

  const addMedicine = (med) => {
    if (!med) return;
    setRxItems(prev => [...prev, { 
      name: med.name, 
      content: med.content || 'Amoxycillin (500mg) + Clavulanic Acid (125mg)', 
      content: med.content || 'Amoxycillin (500mg) + Clavulanic Acid (125mg)', 
      unit_price: med.sales_rate || 0,
      dosage: med.frequency || 'Select', 
      time: 'Select',
      duration: 1, 
      quantity: 1, 
      advice: 'Before Food',
      notes: ''
    }]);
  };

  const addCustomMedicine = () => {
    const name = prompt('Enter Medicine Name:');
    if (!name) return;
    setRxItems(prev => [...prev, { 
      name, 
      content: '-',
      content: '-',
      unit_price: 0, 
      dosage: 'Select', 
      time: 'Select',
      duration: 1,
      quantity: 1, 
      advice: 'Before Food',
      notes: '' 
    }]);
  };

  const updateRxItem = (idx, field, val) => {
    setRxItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)', border: '1px solid #e2e8f0', marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.5rem 0' }}>Medications</h2>
      
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Click to search or select medicines..."
              value={medSearch}
              onChange={e => {
                setMedSearch(e.target.value);
                setShowMedResults(true);
              }}
              onFocus={() => setShowMedResults(true)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box', color: '#334155' }}
            />
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
              ▼
            </div>
          </div>

          <button onClick={addCustomMedicine}
            style={{ padding: '12px 20px', borderRadius: 8, background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Create New Medicine
          </button>
        </div>

        {showMedResults && medSearch.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 12, marginTop: 6,
            maxHeight: 250, overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            {medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())).length === 0 ? (
              <div style={{ padding: '12px', fontSize: 13, color: '#64748b', textAlign: 'center' }}>No matches. Click "+ Create New Medicine" to add.</div>
            ) : (
              medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())).map(m => (
                <div
                  key={m.id}
                  onClick={() => {
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
                    <span style={{ color: '#10b981' }}>₹{m.sales_rate}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{m.dosage} · {m.frequency}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {rxItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14, background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
          No medicines added. Search or click "Create New Medicine" to add one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '30px 1.2fr 1.5fr 70px 90px 90px 90px 50px 110px 40px', gap: 12, fontSize: 12, fontWeight: 600, color: '#64748b', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
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
          {rxItems.map((it, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '30px 1.2fr 1.5fr 70px 90px 90px 90px 50px 110px 40px', gap: 12, alignItems: 'center', background: '#fff', padding: '12px 16px', borderBottom: idx !== rxItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{idx + 1}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{it.name}</span>
              <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{it.content}</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>₹</span>
                <input type="number" value={it.unit_price} onChange={e => updateRxItem(idx, 'unit_price', e.target.value)}
                  style={{ width: '100%', padding: '6px 4px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff', fontWeight: 600 }} />
              </div>
              
              <input type="text" value={it.dosage} onChange={e => updateRxItem(idx, 'dosage', e.target.value)} placeholder="e.g. 500mg, 1 Tab" style={{ padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff' }} />

              <select value={it.time} onChange={e => updateRxItem(idx, 'time', e.target.value)} style={{ padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff' }}>
                <option value="Select">Select</option>
                <option value="1-0-1">1-0-1</option>
                <option value="1-1-1">1-1-1</option>
                <option value="0-0-1">0-0-1</option>
                <option value="1-0-0">1-0-0</option>
                <option value="SOS">SOS</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                <button onClick={() => updateRxItem(idx, 'duration', Math.max(1, parseInt(it.duration) - 1))} style={{ padding: '6px 8px', background: '#f8fafc', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b' }}>-</button>
                <input type="number" min="1" value={it.duration} onChange={e => updateRxItem(idx, 'duration', parseInt(e.target.value) || 1)} style={{ width: '100%', padding: '6px 0', fontSize: 12, border: 'none', textAlign: 'center', outline: 'none' }} />
                <button onClick={() => updateRxItem(idx, 'duration', parseInt(it.duration) + 1)} style={{ padding: '6px 8px', background: '#f8fafc', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b' }}>+</button>
              </div>

              <span style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>-</span>
              
              <select value={it.advice} onChange={e => updateRxItem(idx, 'advice', e.target.value)} style={{ padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569', background: '#fff' }}>
                <option value="Select">Select</option>
                <option value="Before Food">Before Food</option>
                <option value="After Food">After Food</option>
              </select>

              <button onClick={() => setRxItems(p => p.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
