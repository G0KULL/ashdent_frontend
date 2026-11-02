import { useState, useEffect } from 'react'
import styles from './Pharmacy.module.css' // Reusing consistent project styling

const API = 'http://127.0.0.1:8000/api'

export default function MastersManager() {
  const [activeTab, setActiveTab] = useState('patient-types') // patient-types, roles, staff-levels, designations, discounts, packages, subscriptions
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  // Data States
  const [patientTypes, setPatientTypes] = useState([])
  const [staffLevels, setStaffLevels] = useState([])
  const [designations, setDesignations] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [packages, setPackages] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [treatments, setTreatments] = useState([])
  const [diagnoses, setDiagnoses] = useState([])
  const [examinations, setExaminations] = useState([])
  const [toothConditions, setToothConditions] = useState([])
  const [investigations, setInvestigations] = useState([])

  // Modal & Form States
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'patient-type', 'staff-level', 'designation', 'role', 'discount', 'package', 'treatment', 'diagnosis', 'examination', 'tooth-condition'
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({})

  const showToastMsg = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000)
  }

  useEffect(() => {
    fetchAllMasters()
  }, [])

  const getAuthHeaders = () => {
    const saved = localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user')
    if (saved) {
      try {
        const u = JSON.parse(saved)
        return {
          'Content-Type': 'application/json',
          'X-User-Id': u.id || u.username || '',
          'X-Username': u.username || '',
          'X-User-Role': u.role || ''
        }
      } catch (e) {}
    }
    return { 'Content-Type': 'application/json' }
  }

  const fetchAllMasters = async () => {
    setLoading(true)
    try {
      const authHeaders = getAuthHeaders()
      const [ptRes, slRes, desRes, roleRes, permRes, discRes, pkgRes, subRes, txRes, dxRes, exRes, tcRes, invRes] = await Promise.all([
        fetch(`${API}/masters/patient-types/`, { headers: authHeaders }),
        fetch(`${API}/masters/staff-levels/`, { headers: authHeaders }),
        fetch(`${API}/masters/designations/`, { headers: authHeaders }),
        fetch(`${API}/masters/roles/`, { headers: authHeaders }),
        fetch(`${API}/masters/permissions/`, { headers: authHeaders }),
        fetch(`${API}/masters/discounts/`, { headers: authHeaders }),
        fetch(`${API}/masters/packages/`, { headers: authHeaders }),
        fetch(`${API}/masters/package-subscriptions/`, { headers: authHeaders }),
        fetch(`${API}/masters/treatments/`, { headers: authHeaders }),
        fetch(`${API}/masters/diagnoses/`, { headers: authHeaders }),
        fetch(`${API}/masters/examinations/`, { headers: authHeaders }),
        fetch(`${API}/masters/tooth-conditions/`, { headers: authHeaders }),
        fetch(`${API}/masters/investigations/?include_inactive=true`, { headers: authHeaders }),
      ])

      if (ptRes.ok) setPatientTypes(await ptRes.json())
      if (slRes.ok) setStaffLevels(await slRes.json())
      if (desRes.ok) setDesignations(await desRes.json())
      if (roleRes.ok) setRoles(await roleRes.json())
      if (permRes.ok) setPermissions(await permRes.json())
      if (discRes.ok) setDiscounts(await discRes.json())
      if (pkgRes.ok) setPackages(await pkgRes.json())
      if (subRes.ok) setSubscriptions(await subRes.json())
      if (txRes.ok) setTreatments(await txRes.json())
      if (dxRes.ok) setDiagnoses(await dxRes.json())
      if (exRes.ok) setExaminations(await exRes.json())
      if (tcRes.ok) setToothConditions(await tcRes.json())
      if (invRes && invRes.ok) setInvestigations(await invRes.json())
    } catch (err) {
      console.error("Failed to load masters data:", err)
      showToastMsg("Failed to connect to Masters backend API", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (endpoint, item) => {
    try {
      const res = await fetch(`${API}/masters/${endpoint}/${item.id}/`, {
        method: endpoint === 'investigations' ? 'PATCH' : 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !item.is_active })
      })
      if (res.ok) {
        showToastMsg(`Updated ${item.name || item.code} status`, "success")
        fetchAllMasters()
      } else {
        const data = await res.json().catch(() => ({}))
        showToastMsg(data.error || "Failed to update status", "error")
      }
    } catch (e) {
      showToastMsg("Failed to update status", "error")
    }
  }

  const openCreateModal = (type) => {
    setModalType(type)
    setEditItem(null)
    setFormData({
      name: '', code: '', description: '', display_order: 0,
      discount_type: 'Percentage', discount_value: 10, applicable_module: 'ALL',
      package_type: 'Combo Treatment', original_price: 2000, package_price: 1500,
      validity_days: 365, max_redemptions: 0,
      price: 400, fee_type: 'Treatment', category: 'General', color: '#3b82f6'
    })
    setShowModal(true)
  }

  const openEditModal = (type, item) => {
    setModalType(type)
    setEditItem(item)
    setFormData({ ...item })
    setShowModal(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    let endpoint = ''
    if (modalType === 'patient-type') endpoint = 'patient-types'
    else if (modalType === 'staff-level') endpoint = 'staff-levels'
    else if (modalType === 'designation') endpoint = 'designations'
    else if (modalType === 'role') endpoint = 'roles'
    else if (modalType === 'discount') endpoint = 'discounts'
    else if (modalType === 'package') endpoint = 'packages'
    else if (modalType === 'treatment') endpoint = 'treatments'
    else if (modalType === 'diagnosis') endpoint = 'diagnoses'
    else if (modalType === 'examination') endpoint = 'examinations'
    else if (modalType === 'tooth-condition') endpoint = 'tooth-conditions'
    else if (modalType === 'investigation') endpoint = 'investigations'

    const url = editItem ? `${API}/masters/${endpoint}/${editItem.id}/` : `${API}/masters/${endpoint}/`
    const method = editItem ? (modalType === 'investigation' ? 'PATCH' : 'PUT') : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (res.ok && data.success !== false) {
        showToastMsg(data.message || "Saved successfully!", "success")
        setShowModal(false)
        fetchAllMasters()
      } else {
        showToastMsg(data.error || "Failed to save record", "error")
      }
    } catch (err) {
      showToastMsg("Network error saving record", "error")
    }
  }

  const renderTable = (items, columns, endpoint) => {
    const filtered = items.filter(i => 
      (i.name && i.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.code && i.code.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {columns.map((col, idx) => <th key={idx} style={{ padding: '12px 16px' }}>{col.header}</th>)}
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No master records found.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#334155' }}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ padding: '14px 16px' }}>
                      {col.render ? col.render(item) : item[col.field]}
                    </td>
                  ))}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        onClick={() => openEditModal(endpoint.slice(0, -1), item)}
                        style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(endpoint, item)}
                        style={{
                          background: item.is_active ? '#fef2f2' : '#ecfdf5',
                          color: item.is_active ? '#dc2626' : '#059669',
                          border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        {item.is_active ? '🚫 Deactivate' : '✅ Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      {/* Toast popup */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#fef2f2' : '#ecfdf5',
          color: toast.type === 'error' ? '#991b1b' : '#065f46',
          border: `1px solid ${toast.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
          borderRadius: 10, padding: '12px 20px', fontWeight: 600, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }}>
          {toast.type === 'error' ? '❌ ' : '✅ '}{toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0b132b 0%, #0f172a 45%, #1e1b4b 100%)',
        borderRadius: 16, padding: '24px 32px', color: '#ffffff', marginBottom: 24,
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
            ⚙️ Masters Central Configuration
          </h1>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Manage clinic-wide patient categories, staff designations, granular permission matrix, discounts, and offer packages.
          </p>
        </div>
        <button
          onClick={fetchAllMasters}
          style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, borderBottom: '2px solid #e2e8f0', marginBottom: 20 }}>
        {[
          { id: 'patient-types', label: '🏷️ Patient Types' },
          { id: 'treatments', label: '🩺 Treatments' },
          { id: 'diagnoses', label: '🔬 Diagnoses' },
          { id: 'examinations', label: '📋 Clinical Findings' },
          { id: 'tooth-conditions', label: '🦷 Tooth Conditions' },
          { id: 'roles', label: '🛡️ Roles & Permissions' },
          { id: 'staff-levels', label: '📊 Staff Levels' },
          { id: 'designations', label: '💼 Designations' },
          { id: 'discounts', label: '🏷️ Discounts' },
          { id: 'packages', label: '🎁 Offer Packages' },
          { id: 'subscriptions', label: '📜 Subscriptions' },
          { id: 'investigations', label: '🔬 Investigations' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: activeTab === t.id ? '#0f172a' : '#f1f5f9',
              color: activeTab === t.id ? '#ffffff' : '#475569',
              boxShadow: activeTab === t.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
        <input
          type="text"
          placeholder={`Search ${activeTab.replace('-', ' ')}...`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #cbd5e1', width: 280, fontSize: 13 }}
        />
        {activeTab !== 'subscriptions' && (
          <button
            onClick={() => {
              const mType = activeTab === 'treatments' ? 'treatment'
                : activeTab === 'diagnoses' ? 'diagnosis'
                : activeTab === 'examinations' ? 'examination'
                : activeTab === 'tooth-conditions' ? 'tooth-condition'
                : activeTab === 'investigations' ? 'investigation'
                : activeTab.slice(0, -1);
              openCreateModal(mType);
            }}
            style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '9px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}
          >
            ➕ Add New {activeTab === 'treatments' ? 'Treatment' : activeTab === 'diagnoses' ? 'Diagnosis' : activeTab === 'examinations' ? 'Examination' : activeTab === 'tooth-conditions' ? 'Tooth Condition' : activeTab.replace('-', ' ').slice(0, -1)}
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Loading Masters configuration...</div>
      ) : (
        <>
          {activeTab === 'patient-types' && renderTable(patientTypes, [
            { header: 'Code', render: item => <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{item.code}</code> },
            { header: 'Name', field: 'name' },
            { header: 'Description', field: 'description' },
            { header: 'Order', field: 'display_order' },
            { header: 'Status', render: item => <span style={{ color: item.is_active ? '#059669' : '#dc2626', fontWeight: 600 }}>{item.is_active ? 'Active' : 'Inactive'}</span> }
          ], 'patient-types')}

          {activeTab === 'treatments' && renderTable(treatments, [
            { header: 'Code', render: item => <code style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{item.code || `TX-${item.id}`}</code> },
            { header: 'Treatment / Procedure', field: 'name' },
            { header: 'Fee Type', render: item => <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 500, fontSize: 12 }}>{item.fee_type || 'Treatment'}</span> },
            { header: 'Standard Price', render: item => <span style={{ fontWeight: 700, color: '#059669' }}>₹{parseFloat(item.price || 0).toFixed(2)}</span> },
            { header: 'Status', render: item => <span style={{ color: item.is_active ? '#059669' : '#dc2626', fontWeight: 600 }}>{item.is_active ? 'Active' : 'Inactive'}</span> }
          ], 'treatments')}

          {activeTab === 'diagnoses' && renderTable(diagnoses, [
            { header: 'Code', render: item => <code style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{item.code}</code> },
            { header: 'Diagnosis Name', field: 'name' },
            { header: 'Category', render: item => <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{item.category || 'General'}</span> },
            { header: 'Description', field: 'description' },
            { header: 'Status', render: item => <span style={{ color: item.is_active ? '#059669' : '#dc2626', fontWeight: 600 }}>{item.is_active ? 'Active' : 'Inactive'}</span> }
          ], 'diagnoses')}

          {activeTab === 'examinations' && renderTable(examinations, [
            { header: 'Code', render: item => <code style={{ background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{item.code}</code> },
            { header: 'Clinical Observation', field: 'name' },
            { header: 'Category', render: item => <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{item.category || 'General'}</span> },
            { header: 'Description', field: 'description' },
            { header: 'Status', render: item => <span style={{ color: item.is_active ? '#059669' : '#dc2626', fontWeight: 600 }}>{item.is_active ? 'Active' : 'Inactive'}</span> }
          ], 'examinations')}

          {activeTab === 'tooth-conditions' && renderTable(toothConditions, [
            { header: 'Code', render: item => <code style={{ background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{item.code}</code> },
            { header: 'Condition Name', render: item => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: item.color || '#3b82f6', display: 'inline-block' }}></span>
                <strong>{item.name}</strong>
              </div>
            )},
            { header: 'Type', render: item => item.is_system ? <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>System Core</span> : <span style={{ color: '#0284c7', fontSize: 12 }}>Custom Condition</span> },
            { header: 'Description', field: 'description' },
            { header: 'Status', render: item => <span style={{ color: item.is_active ? '#059669' : '#dc2626', fontWeight: 600 }}>{item.is_active ? 'Active' : 'Inactive'}</span> }
          ], 'tooth-conditions')}


          {activeTab === 'staff-levels' && renderTable(staffLevels, [
            { header: 'Code', render: item => <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{item.code}</code> },
            { header: 'Level Name', field: 'name' },
            { header: 'Description', field: 'description' },
            { header: 'Order', field: 'display_order' },
            { header: 'Status', render: item => <span style={{ color: item.is_active ? '#059669' : '#dc2626', fontWeight: 600 }}>{item.is_active ? 'Active' : 'Inactive'}</span> }
          ], 'staff-levels')}

          {activeTab === 'designations' && renderTable(designations, [
            { header: 'Code', render: item => <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{item.code}</code> },
            { header: 'Designation Name', field: 'name' },
            { header: 'Description', field: 'description' },
            { header: 'Order', field: 'display_order' },
            { header: 'Status', render: item => <span style={{ color: item.is_active ? '#059669' : '#dc2626', fontWeight: 600 }}>{item.is_active ? 'Active' : 'Inactive'}</span> }
          ], 'designations')}

          {activeTab === 'roles' && renderTable(roles, [
            { header: 'Role Code', render: item => <code style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{item.code}</code> },
            { header: 'Role Name', field: 'name' },
            { header: 'Description', field: 'description' },
            { header: 'System Role', render: item => item.is_system_role ? <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>System Core</span> : <span style={{ color: '#64748b' }}>Custom Role</span> },
            { header: 'Permissions', render: item => <span style={{ fontWeight: 600, color: '#0284c7' }}>{item.permissions?.length || 0} permissions mapped</span> },
            { header: 'Status', render: item => <span style={{ color: item.is_active ? '#059669' : '#dc2626', fontWeight: 600 }}>{item.is_active ? 'Active' : 'Inactive'}</span> }
          ], 'roles')}

          {activeTab === 'discounts' && renderTable(discounts, [
            { header: 'Code', render: item => <code style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{item.code}</code> },
            { header: 'Discount Name', field: 'name' },
            { header: 'Type', field: 'discount_type' },
            { header: 'Value', render: item => <span style={{ fontWeight: 700, color: '#059669' }}>{item.discount_type === 'Percentage' ? `${item.discount_value}%` : `₹${item.discount_value}`}</span> },
            { header: 'Applicable Module', field: 'applicable_module' },
            { header: 'Status', render: item => <span style={{ color: item.is_active ? '#059669' : '#dc2626', fontWeight: 600 }}>{item.is_active ? 'Active' : 'Inactive'}</span> }
          ], 'discounts')}

          {activeTab === 'packages' && renderTable(packages, [
            { header: 'Package Code', render: item => <code style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{item.code}</code> },
            { header: 'Package Name', field: 'name' },
            { header: 'Package Type', field: 'package_type' },
            { header: 'Original Sum', render: item => <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>₹{item.original_price}</span> },
            { header: 'Package Price', render: item => <span style={{ fontWeight: 700, color: '#0d9488', fontSize: 14 }}>₹{item.package_price}</span> },
            { header: 'Validity (Days)', render: item => <span>{item.validity_days} days</span> },
            { header: 'Status', render: item => <span style={{ color: item.is_active ? '#059669' : '#dc2626', fontWeight: 600 }}>{item.is_active ? 'Active' : 'Inactive'}</span> }
          ], 'packages')}

          {activeTab === 'subscriptions' && (
            <div style={{ overflowX: 'auto', marginTop: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Patient Name</th>
                    <th style={{ padding: '12px 16px' }}>Package Subscribed</th>
                    <th style={{ padding: '12px 16px' }}>Purchase Date</th>
                    <th style={{ padding: '12px 16px' }}>Expiry Date</th>
                    <th style={{ padding: '12px 16px' }}>Paid Amount</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No active package subscriptions recorded.</td></tr>
                  ) : (
                    subscriptions.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#334155' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{s.patient_name}</td>
                        <td style={{ padding: '14px 16px', color: '#0284c7', fontWeight: 600 }}>🎁 {s.package_name}</td>
                        <td style={{ padding: '14px 16px' }}>{s.purchase_date}</td>
                        <td style={{ padding: '14px 16px' }}>{s.expiry_date}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700 }}>₹{s.paid_amount}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: s.status === 'ACTIVE' ? '#dcfce7' : '#fef2f2', color: s.status === 'ACTIVE' ? '#15803d' : '#991b1b', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal Popup */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: 500, maxWidth: '90%', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#0f172a' }}>
              {editItem ? 'Edit Master Record' : 'Create New Master Record'}
            </h2>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Name *</label>
                <input
                  type="text" required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>
              {!editItem && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Code * (Unique Identifier)</label>
                  <input
                    type="text" required
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              {modalType === 'discount' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Type</label>
                    <select
                      value={formData.discount_type || 'Percentage'}
                      onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    >
                      <option value="Percentage">Percentage (%)</option>
                      <option value="Fixed Amount">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Value</label>
                    <input
                      type="number" step="0.01" required
                      value={formData.discount_value || 0}
                      onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>
              )}

              {modalType === 'package' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Package Price (₹)</label>
                    <input
                      type="number" step="0.01" required
                      value={formData.package_price || 0}
                      onChange={e => setFormData({ ...formData, package_price: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Validity (Days)</label>
                    <input
                      type="number" required
                      value={formData.validity_days || 365}
                      onChange={e => setFormData({ ...formData, validity_days: parseInt(e.target.value, 10) })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>
              )}

              {modalType === 'treatment' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Standard Price (₹) *</label>
                    <input
                      type="number" step="0.01" required
                      value={formData.price || 0}
                      onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Fee Type / Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Treatment, Surgery"
                      value={formData.fee_type || 'Treatment'}
                      onChange={e => setFormData({ ...formData, fee_type: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>
              )}

              {(modalType === 'diagnosis' || modalType === 'examination') && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Clinical Specialty / Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Endodontics, Periodontics, Restorative, General"
                    value={formData.category || 'General'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
              )}

              {modalType === 'tooth-condition' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Indicator Color</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={formData.color || '#3b82f6'}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      style={{ width: 42, height: 36, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', padding: 2 }}
                    />
                    <input
                      type="text"
                      value={formData.color || '#3b82f6'}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>
              )}


              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button
                  type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#0f172a', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Master Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
