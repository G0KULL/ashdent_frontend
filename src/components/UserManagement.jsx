import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Pharmacy.module.css'

const API = 'http://127.0.0.1:8000/api'

export default function UserManagement() {
  const navigate = useNavigate()
  const [currentUser] = useState(() => {
    const saved = localStorage.getItem('doctosmart_user')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { return null }
    }
    return null
  })

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [companyFilter, setCompanyFilter] = useState('')
  const [companies, setCompanies] = useState([])

  // Details Modal State
  const [selectedStaffDetails, setSelectedStaffDetails] = useState(null)

  // Edit State
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editUserForm, setEditUserForm] = useState({
    id: '', name: '', role: 'Doctor', phone: '', email: '', username: '', password: '', base_salary: 0, company_id: '', employee_id: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Permissions Modal State
  const [editingStaff, setEditingStaff] = useState(null)
  const [tempPermissions, setTempPermissions] = useState([])

  // Company Creation State for Super Admin
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false)
  const [newCompanyForm, setNewCompanyForm] = useState({ name: '', code: '', address: '', email: '', phone: '' })
  const [companySubmitting, setCompanySubmitting] = useState(false)
  const [companyError, setCompanyError] = useState('')

  const handleCreateCompany = async (e) => {
    e.preventDefault()
    if (!newCompanyForm.name.trim()) return
    setCompanySubmitting(true)
    setCompanyError('')
    try {
      const res = await fetch(`${API}/companies/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify(newCompanyForm)
      })
      const data = await res.json()
      if (res.ok) {
        setCompanies(prev => [...prev, data])
        setShowAddCompanyModal(false)
        setNewCompanyForm({ name: '', code: '', address: '', email: '', phone: '' })
        alert(`Company "${data.name}" created successfully!`)
      } else {
        setCompanyError(data.error || 'Failed to create company.')
      }
    } catch (err) {
      setCompanyError('Network error while creating company.')
    }
    setCompanySubmitting(false)
  }

  const allModules = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'add-patients', name: 'Add Patients' },
    { id: 'appointments', name: 'Appointments' },
    { id: 'today-patients', name: "Today's Patients" },
    { id: 'search-patient', name: 'Search Patient' },
    { id: 'follow-ups', name: 'Follow-ups' },
    { id: 'pre-bookings', name: 'Pre-bookings' },
    { id: 'tele-medicine', name: 'Telemedicine' },
    { id: 'website-appointment', name: 'Website Appointments' },
    { id: 'communication', name: 'Communication' },
    { id: 'billing', name: 'Billing' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'reports', name: 'EHR Reports' },
    { id: 'pathology-lab', name: 'Pathology Lab' },
    { id: 'dental-lab', name: 'Dental Lab' },
    { id: 'pharmacy', name: 'Pharmacy' },
    { id: 'purchases', name: 'Stock Purchases' },
    { id: 'material-purchases', name: 'Material Purchases' },
    { id: 'stock', name: 'Pharmacy Stock' },
    { id: 'prescriptions', name: 'Prescriptions' },
    { id: 'doctor-slots', name: 'My Slots' },
    { id: 'income', name: 'My Income' },
    { id: 'users', name: 'Staff Management' },
    { id: 'doctors', name: 'Doctors' },
    { id: 'settings', name: 'Settings' },
  ]

  useEffect(() => {
    fetchUsers()
    if (isSuperAdmin) {
      fetchCompanies()
    }
  }, [roleFilter, statusFilter, companyFilter, search])

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API}/companies/`, {
        headers: { 'X-User-Id': currentUser?.id || '' }
      })
      if (res.ok) {
        const data = await res.json()
        setCompanies(data)
      }
    } catch (e) { console.error(e) }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let url = `${API}/staff/list/?`
      if (roleFilter !== 'All') url += `role=${encodeURIComponent(roleFilter)}&`
      if (statusFilter !== 'All') url += `status=${statusFilter.toLowerCase()}&`
      if (companyFilter) url += `company_id=${companyFilter}&`
      if (search) url += `search=${encodeURIComponent(search)}&`

      const res = await fetch(url, {
        headers: { 'X-User-Id': currentUser?.id || '' }
      })
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setUsers([])
    }
    setLoading(false)
  }

  const handleToggleStatus = async (staffId) => {
    try {
      const res = await fetch(`${API}/staff/${staffId}/toggle-status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        }
      })
      if (res.ok) {
        fetchUsers()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to toggle account status.')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const openAccessModal = (user) => {
    setEditingStaff(user)
    setTempPermissions(user.permissions || [])
  }

  const handleTogglePermission = (modId) => {
    if (tempPermissions.includes(modId)) {
      setTempPermissions(tempPermissions.filter(p => p !== modId))
    } else {
      setTempPermissions([...tempPermissions, modId])
    }
  }

  const savePermissions = async () => {
    try {
      const res = await fetch(`${API}/staff/${editingStaff.id}/permissions/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({ permissions: tempPermissions })
      })
      if (res.ok) {
        setEditingStaff(null)
        fetchUsers()
      } else {
        alert('Failed to update permissions')
      }
    } catch (e) { console.error(e) }
  }

  const openEditProfile = (u) => {
    setEditUserForm({
      id: u.id,
      name: u.name || '',
      role: u.role || 'Doctor',
      phone: u.phone || '',
      email: u.email || '',
      username: u.username || '',
      password: '',
      base_salary: u.base_salary || 0,
      company_id: u.company || currentUser?.company_id || '',
      employee_id: u.employee_id || ''
    })
    setShowEditProfile(true)
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API}/staff/${editUserForm.id}/update/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify(editUserForm)
      })
      if (res.ok) {
        setShowEditProfile(false)
        fetchUsers()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to update staff member.')
      }
    } catch (e) { console.error(e) }
    setIsSubmitting(false)
  }

  const getRoleBadgeStyle = (role) => {
    switch (role?.toLowerCase()) {
      case 'doctor':
        return { background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }
      case 'dental assistant':
        return { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }
      case 'pharmacist':
        return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
      case 'accountant':
        return { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }
      case 'admin':
      case 'super admin':
        return { background: '#fae8ff', color: '#86198f', border: '1px solid #f5d0fe' }
      default:
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }
    }
  }

  return (
    <div className={styles.container} style={{ padding: '2rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.3rem 0', fontSize: '1.75rem', fontWeight: 700, color: '#1e293b' }}>Staff Management</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Manage Doctors, Dental Assistants, Pharmacists, Accountants, and Admins across clinics.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isSuperAdmin && (
            <button 
              onClick={() => setShowAddCompanyModal(true)}
              style={{
                background: '#ffffff',
                color: '#059669',
                border: '1px solid #10b981',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              + Create New Company
            </button>
          )}
          <button 
            onClick={() => navigate('/staff/signup')}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Onboard New Staff
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e9d5ff',
        borderRadius: '14px',
        padding: '1.2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(168, 85, 247, 0.04)'
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid #e9d5ff',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Role Filter */}
        <div style={{ minWidth: '160px' }}>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid #e9d5ff', fontSize: '0.9rem' }}
          >
            <option value="All">All Roles</option>
            <option value="Doctor">Doctor</option>
            <option value="Dental Assistant">Dental Assistant</option>
            <option value="Pharmacist">Pharmacist</option>
            <option value="Accountant">Accountant</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: '140px' }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid #e9d5ff', fontSize: '0.9rem' }}
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Company Filter (Super Admin Only) */}
        {isSuperAdmin && companies.length > 0 && (
          <div style={{ minWidth: '180px' }}>
            <select
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid #e9d5ff', fontSize: '0.9rem' }}
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Staff Table */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e9d5ff', overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(168, 85, 247, 0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f7f4fe', borderBottom: '1px solid #e9d5ff', color: '#475569', fontWeight: 600 }}>
              <th style={{ padding: '1rem 1.25rem' }}>Staff Member</th>
              <th style={{ padding: '1rem 1.25rem' }}>Role</th>
              <th style={{ padding: '1rem 1.25rem' }}>Employee ID</th>
              <th style={{ padding: '1rem 1.25rem' }}>Company</th>
              <th style={{ padding: '1rem 1.25rem' }}>Contact</th>
              <th style={{ padding: '1rem 1.25rem' }}>Status</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading staff members...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No staff members found matching criteria.</td></tr>
            ) : (
              users.map(u => {
                const badgeStyle = getRoleBadgeStyle(u.role)
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f3e8ff', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{u.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>@{u.username}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'inline-block',
                        ...badgeStyle
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', color: '#475569' }}>
                      {u.employee_id || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#475569' }}>
                      {u.company_name || 'Main Clinic'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div>{u.phone || 'N/A'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email || ''}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: u.is_active ? '#dcfce7' : '#fee2e2',
                        color: u.is_active ? '#15803d' : '#b91c1c'
                      }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSelectedStaffDetails(u)}
                          style={{ background: '#f3e8ff', border: '1px solid #e9d5ff', color: '#7e22ce', padding: '0.4rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          👁️ Profile
                        </button>
                        <button
                          onClick={() => openEditProfile(u)}
                          style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '0.4rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => openAccessModal(u)}
                          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.4rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          🛡️ Access
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          style={{
                            background: u.is_active ? '#fff1f2' : '#f0fdf4',
                            border: `1px solid ${u.is_active ? '#fecdd3' : '#bbf7d0'}`,
                            color: u.is_active ? '#be123c' : '#15803d',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem'
                          }}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Staff Profile Details Modal */}
      {selectedStaffDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '640px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>{selectedStaffDetails.name}</h2>
                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>{selectedStaffDetails.role} — {selectedStaffDetails.company_name || 'Main Clinic'}</span>
              </div>
              <button onClick={() => setSelectedStaffDetails(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div><strong>Employee ID:</strong> {selectedStaffDetails.employee_id || 'N/A'}</div>
              <div><strong>Username:</strong> {selectedStaffDetails.username}</div>
              <div><strong>Mobile:</strong> {selectedStaffDetails.phone || 'N/A'}</div>
              <div><strong>Email:</strong> {selectedStaffDetails.email || 'N/A'}</div>
              <div><strong>Qualification:</strong> {selectedStaffDetails.qualification || 'N/A'}</div>
              <div><strong>Joining Date:</strong> {selectedStaffDetails.joining_date || 'N/A'}</div>
              {selectedStaffDetails.role === 'Doctor' && (
                <>
                  <div><strong>Specialization:</strong> {selectedStaffDetails.specialization}</div>
                  <div><strong>Reg Number:</strong> {selectedStaffDetails.registration_number || 'N/A'}</div>
                  <div><strong>Consultation Fee:</strong> ₹{selectedStaffDetails.consultation_fee}</div>
                  <div><strong>Follow-up Fee:</strong> ₹{selectedStaffDetails.followup_fee}</div>
                </>
              )}
              {selectedStaffDetails.role === 'Pharmacist' && (
                <div><strong>Pharmacy Reg:</strong> {selectedStaffDetails.registration_number || 'N/A'}</div>
              )}
              <div><strong>Account Status:</strong> {selectedStaffDetails.is_active ? 'Active' : 'Inactive'}</div>
              <div><strong>Salary:</strong> ₹{selectedStaffDetails.base_salary} / month</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setSelectedStaffDetails(null)} style={{ background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)', color: '#fff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Profile Modal */}
      {showEditProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '600px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: '0 0 1.25rem 0', color: '#1e293b' }}>Edit Staff Profile</h2>
            <form onSubmit={handleEditSave}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Full Name</label>
                  <input type="text" required value={editUserForm.name} onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Role</label>
                  <select value={editUserForm.role} onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                    <option value="Doctor">Doctor</option>
                    <option value="Dental Assistant">Dental Assistant</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Mobile Number</label>
                  <input type="text" value={editUserForm.phone} onChange={e => setEditUserForm({ ...editUserForm, phone: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Email Address</label>
                  <input type="email" value={editUserForm.email} onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Username</label>
                  <input type="text" value={editUserForm.username} onChange={e => setEditUserForm({ ...editUserForm, username: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>New Password (Optional)</label>
                  <input type="password" placeholder="••••••••" value={editUserForm.password} onChange={e => setEditUserForm({ ...editUserForm, password: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowEditProfile(false)} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)', color: '#fff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  {isSubmitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Permissions Modal */}
      {editingStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '640px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: '0 0 0.4rem 0', color: '#1e293b' }}>Manage Module Access</h2>
            <p style={{ color: '#64748b', margin: '0 0 1.25rem 0', fontSize: '0.9rem' }}>Customize access permissions for {editingStaff.name} ({editingStaff.role})</p>

            <div style={{ maxHeight: '45vh', overflowY: 'auto', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {allModules.map(mod => {
                const checked = tempPermissions.includes(mod.id)
                return (
                  <label key={mod.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.8rem',
                    background: checked ? '#ecfdf5' : '#ffffff',
                    border: `1px solid ${checked ? '#10b981' : '#e2e8f0'}`,
                    borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem'
                  }}>
                    <input type="checkbox" checked={checked} onChange={() => handleTogglePermission(mod.id)} style={{ accentColor: '#10b981' }} />
                    <span style={{ fontWeight: checked ? 600 : 400, color: checked ? '#059669' : '#334155' }}>{mod.name}</span>
                  </label>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setEditingStaff(null)} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={savePermissions} style={{ background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)', color: '#fff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Save Access Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin: Create New Company Modal */}
      {showAddCompanyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: '0 0 0.4rem 0', color: '#1e293b' }}>Create New Company / Clinic</h2>
            <p style={{ color: '#64748b', margin: '0 0 1.25rem 0', fontSize: '0.9rem' }}>Add a new dental branch or multi-tenant company to the system.</p>

            {companyError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {companyError}
              </div>
            )}

            <form onSubmit={handleCreateCompany}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: '#475569' }}>Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SmileCare Dental Clinic"
                    value={newCompanyForm.name}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: '#475569' }}>Company Code (Short ID)</label>
                  <input
                    type="text"
                    placeholder="e.g. SMILE-MUM"
                    value={newCompanyForm.code}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, code: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: '#475569' }}>Contact Email</label>
                  <input
                    type="email"
                    placeholder="info@smilecare.com"
                    value={newCompanyForm.email}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, email: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: '#475569' }}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={newCompanyForm.phone}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: '#475569' }}>Address</label>
                  <textarea
                    rows="2"
                    placeholder="Clinic address..."
                    value={newCompanyForm.address}
                    onChange={e => setNewCompanyForm({ ...newCompanyForm, address: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddCompanyModal(false)} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={companySubmitting} style={{ background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)', color: '#fff', border: 'none', padding: '0.66rem 1.4rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  {companySubmitting ? 'Creating...' : '+ Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
