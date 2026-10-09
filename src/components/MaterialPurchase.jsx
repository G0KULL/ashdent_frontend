import React, { useState, useEffect } from 'react'

const API = 'http://127.0.0.1:8000/api/finance/materials/'

export default function MaterialPurchase() {
  const [materials, setMaterials] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [purchases, setPurchases] = useState([])
  const [activeTab, setActiveTab] = useState('new') // 'new', 'history', 'materials'
  const [loading, setLoading] = useState(true)

  // New Purchase Form
  const [purchaseForm, setPurchaseForm] = useState({
    material_id: '',
    quantity: 1,
    unit_price: 0,
    supplier_id: '',
    date: new Date().toISOString().split('T')[0]
  })

  // New Material Form
  const [materialForm, setMaterialForm] = useState({
    name: '',
    quantity: 0,
    unit_price: 0,
    supplier_id: '',
    low_stock_threshold: 5
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(API)
      const data = await res.json()
      setMaterials(data.materials || [])
      setSuppliers(data.suppliers || [])
      setPurchases(data.purchases || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handlePurchase = async (e) => {
    e.preventDefault()
    if (!purchaseForm.material_id) {
      alert("Please select a material.")
      return
    }
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          ...purchaseForm
        })
      })
      if (res.ok) {
        alert("Purchase recorded successfully!")
        fetchData()
        setActiveTab('history')
        setPurchaseForm({
          ...purchaseForm,
          material_id: '',
          quantity: 1,
          unit_price: 0
        })
      } else {
        const err = await res.json()
        alert(err.error || "Failed to record purchase")
      }
    } catch (e) {
      alert("Error recording purchase")
    }
  }

  const handleAddMaterial = async (e) => {
    e.preventDefault()
    if (!materialForm.name) {
      alert("Material name is required.")
      return
    }
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_material',
          ...materialForm
        })
      })
      if (res.ok) {
        alert("Material added successfully!")
        fetchData()
        setMaterialForm({
          name: '',
          quantity: 0,
          unit_price: 0,
          supplier_id: '',
          low_stock_threshold: 5
        })
      } else {
        const err = await res.json()
        alert(err.error || "Failed to add material")
      }
    } catch (e) {
      alert("Error adding material")
    }
  }

  const handleMaterialChange = (e) => {
    const matId = e.target.value
    const mat = materials.find(m => String(m.id) === matId)
    setPurchaseForm({
      ...purchaseForm,
      material_id: matId,
      unit_price: mat ? mat.unit_price : 0,
      supplier_id: mat ? (mat.supplier_id || '') : purchaseForm.supplier_id
    })
  }

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', background: 'transparent' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--slate-900)' }}>
            📦 Dental Materials & Consumables
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
            Manage purchases and inventory for dental materials
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
        <button 
          onClick={() => setActiveTab('new')} 
          style={{ padding: '8px 16px', background: activeTab === 'new' ? '#3b82f6' : 'white', color: activeTab === 'new' ? 'white' : '#64748b', borderRadius: 8, border: '1px solid var(--border-light)', cursor: 'pointer', fontWeight: 600 }}
        >
          New Purchase
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          style={{ padding: '8px 16px', background: activeTab === 'history' ? '#3b82f6' : 'white', color: activeTab === 'history' ? 'white' : '#64748b', borderRadius: 8, border: '1px solid var(--border-light)', cursor: 'pointer', fontWeight: 600 }}
        >
          Purchase History
        </button>
        <button 
          onClick={() => setActiveTab('materials')} 
          style={{ padding: '8px 16px', background: activeTab === 'materials' ? '#3b82f6' : 'white', color: activeTab === 'materials' ? 'white' : '#64748b', borderRadius: 8, border: '1px solid var(--border-light)', cursor: 'pointer', fontWeight: 600 }}
        >
          Materials Directory
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading data...</div>
      ) : activeTab === 'new' ? (
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, color: 'var(--slate-900)' }}>Record Material Purchase</h2>
          <form onSubmit={handlePurchase} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Date</label>
              <input type="date" value={purchaseForm.date} onChange={e => setPurchaseForm({...purchaseForm, date: e.target.value})} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-light)' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Supplier (Optional)</label>
              <select value={purchaseForm.supplier_id} onChange={e => setPurchaseForm({...purchaseForm, supplier_id: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)' }}>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Material</label>
              <select value={purchaseForm.material_id} onChange={handleMaterialChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)' }}>
                <option value="">Select Material...</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name} (Stock: {m.quantity})</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Quantity</label>
                <input type="number" min="1" value={purchaseForm.quantity} onChange={e => setPurchaseForm({...purchaseForm, quantity: e.target.value})} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-light)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Unit Price (₹)</label>
                <input type="number" step="0.01" min="0" value={purchaseForm.unit_price} onChange={e => setPurchaseForm({...purchaseForm, unit_price: e.target.value})} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-light)' }} />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', padding: 16, background: 'transparent', borderRadius: 8, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--slate-700)' }}>Total Purchase Amount:</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>₹{(purchaseForm.quantity * purchaseForm.unit_price).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: 16 }}>
              <button type="submit" style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
                Record Purchase
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'history' ? (
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'transparent', color: 'var(--slate-700)', fontSize: 13, textTransform: 'uppercase' }}>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>Date</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>Material</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>Supplier</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>Quantity</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>Unit Price</th>
                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No purchases recorded yet.</td>
                </tr>
              ) : purchases.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--slate-900)' }}>{p.date}</td>
                  <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 500, color: '#3b82f6' }}>{p.material_name}</td>
                  <td style={{ padding: '16px 24px', fontSize: 14, color: '#64748b' }}>{p.supplier_name || '-'}</td>
                  <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--slate-900)' }}>{p.quantity}</td>
                  <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--slate-900)' }}>₹{p.unit_price}</td>
                  <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: 'var(--slate-900)', textAlign: 'right' }}>₹{p.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'transparent', color: 'var(--slate-700)', fontSize: 13, textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>Material Name</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>Supplier</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>Current Stock</th>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', textAlign: 'right' }}>Est. Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No materials configured.</td>
                  </tr>
                ) : materials.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 500, color: 'var(--slate-900)' }}>{m.name}</td>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: '#64748b' }}>{m.supplier_name || '-'}</td>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: m.quantity <= m.low_stock_threshold ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                      {m.quantity} {m.quantity <= m.low_stock_threshold && '(Low)'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--slate-900)', textAlign: 'right' }}>₹{m.unit_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: 'fit-content' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: 'var(--slate-900)' }}>Add New Material</h3>
            <form onSubmit={handleAddMaterial} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Name</label>
                <input type="text" value={materialForm.name} onChange={e => setMaterialForm({...materialForm, name: e.target.value})} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-light)' }} placeholder="e.g., Surgical Masks" />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Initial Quantity (Optional)</label>
                <input type="number" min="0" value={materialForm.quantity} onChange={e => setMaterialForm({...materialForm, quantity: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-light)' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Est. Unit Price (₹)</label>
                <input type="number" step="0.01" min="0" value={materialForm.unit_price} onChange={e => setMaterialForm({...materialForm, unit_price: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-light)' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Low Stock Threshold</label>
                <input type="number" min="0" value={materialForm.low_stock_threshold} onChange={e => setMaterialForm({...materialForm, low_stock_threshold: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-light)' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Supplier (Optional)</label>
                <select value={materialForm.supplier_id} onChange={e => setMaterialForm({...materialForm, supplier_id: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <button type="submit" style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
                Add Material
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
