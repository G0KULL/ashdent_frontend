import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './Pharmacy.module.css' // Reusing styles for consistency
import StaffOnboardingWizard from './StaffOnboardingWizard'

const API = 'http://127.0.0.1:8000/api'

function StaffInsuranceModal({ staff, onClose, showToast }) {
  const [insurance, setInsurance] = useState({
    id: null,
    is_enabled: true,
    provider: '',
    policy_number: '',
    policy_type: 'Health Insurance',
    coverage_amount: 500000,
    employee_contribution: 1000,
    employer_contribution: 3000,
    start_date: '',
    expiry_date: '',
    status: 'Active',
    notes: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchInsurance()
  }, [staff])

  const fetchInsurance = async () => {
    try {
      const res = await fetch(`${API}/staff/${staff.id}/insurance/`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.length > 0) {
          setInsurance(data[0])
        }
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleSave = async (isRenew = false) => {
    setSaving(true)
    try {
      const payload = { ...insurance }
      if (isRenew) {
        delete payload.id
      }
      const method = (insurance.id && !isRenew) ? 'PUT' : 'POST'
      const res = await fetch(`${API}/staff/${staff.id}/insurance/`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        showToast(isRenew ? '✓ Insurance policy renewed successfully!' : '✓ Insurance details updated successfully!', 'success')
        onClose()
      } else {
        showToast('Failed to save insurance details', 'error')
      }
    } catch (e) {
      console.error(e)
      showToast('Error saving insurance details', 'error')
    }
    setSaving(false)
  }

  const commonInput = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    boxSizing: 'border-box'
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '650px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
          color: '#ffffff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>🏥 Edit Staff Insurance — {staff.name}</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#bae6fd' }}>Update active insurance policy or record policy renewal</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading insurance records...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={insurance.is_enabled}
                    onChange={e => setInsurance({ ...insurance, is_enabled: e.target.checked })}
                  />
                  Insurance Enabled for this Staff Member
                </label>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Insurance Provider</label>
                <input
                  type="text"
                  style={commonInput}
                  placeholder="e.g. HDFC ERGO / Star Health"
                  value={insurance.provider || ''}
                  onChange={e => setInsurance({ ...insurance, provider: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Policy Number</label>
                <input
                  type="text"
                  style={commonInput}
                  placeholder="e.g. POL-2026-0012"
                  value={insurance.policy_number || ''}
                  onChange={e => setInsurance({ ...insurance, policy_number: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Policy Type</label>
                <input
                  type="text"
                  style={commonInput}
                  placeholder="e.g. Health Insurance"
                  value={insurance.policy_type || ''}
                  onChange={e => setInsurance({ ...insurance, policy_type: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Coverage Amount (₹)</label>
                <input
                  type="number"
                  style={commonInput}
                  value={insurance.coverage_amount || 0}
                  onChange={e => setInsurance({ ...insurance, coverage_amount: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Employee Contribution (₹)</label>
                <input
                  type="number"
                  style={commonInput}
                  value={insurance.employee_contribution || 0}
                  onChange={e => setInsurance({ ...insurance, employee_contribution: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Employer Contribution (₹)</label>
                <input
                  type="number"
                  style={commonInput}
                  value={insurance.employer_contribution || 0}
                  onChange={e => setInsurance({ ...insurance, employer_contribution: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Policy Start Date</label>
                <input
                  type="date"
                  style={commonInput}
                  value={insurance.start_date || ''}
                  onChange={e => setInsurance({ ...insurance, start_date: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Policy Expiry Date</label>
                <input
                  type="date"
                  style={commonInput}
                  value={insurance.expiry_date || ''}
                  onChange={e => setInsurance({ ...insurance, expiry_date: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Policy Status</label>
                <select
                  style={commonInput}
                  value={insurance.status || 'Active'}
                  onChange={e => setInsurance({ ...insurance, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Notes</label>
                <input
                  type="text"
                  style={commonInput}
                  placeholder="Notes"
                  value={insurance.notes || ''}
                  onChange={e => setInsurance({ ...insurance, notes: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '16px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #0284c7',
              background: '#e0f2fe',
              color: '#0369a1',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🔄 Save as New Policy Renewal
          </button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
            >
              {saving ? 'Saving...' : 'Save Policy Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const NotificationPopup = ({ toast, onClose }) => {
  if (!toast || !toast.show) return null
  const isError = toast.type === 'error'
  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        minWidth: '320px',
        maxWidth: '550px',
        padding: '14px 20px',
        borderRadius: '12px',
        background: isError ? '#fef2f2' : '#ecfdf5',
        border: `1.5px solid ${isError ? '#fca5a5' : '#6ee7b7'}`,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        color: isError ? '#991b1b' : '#065f46',
        fontSize: '14px',
        fontWeight: '600'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <span style={{ fontSize: '18px' }}>{isError ? '❌' : '✅'}</span>
        <span>{toast.message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: isError ? '#991b1b' : '#065f46',
          fontSize: '16px',
          fontWeight: '700',
          cursor: 'pointer',
          padding: '0 4px',
          lineHeight: 1
        }}
      >
        ✕
      </button>
    </div>,
    document.body
  )
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [insuranceStaff, setInsuranceStaff] = useState(null)
  const [newUser, setNewUser] = useState({
    name: '',
    role: 'Doctor',
    staff_level: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    dob: '',
    blood_group: '',
    address: '',
    status: 'Active',
    emergency_contact: '',
    username: '',
    password: '',
    base_salary: 0,
    additional_details: {
      qualification: '',
      specialization: 'General Dentistry',
      consultation_fee: 500,
      license_no: '',
      registration_council: '',
      experience_years: '',
      previous_workplace: '',
      assistant_certification: '',
      desk_no: '',
      designation: '',
      access_level: 'Super Admin'
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Edit State
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editUserForm, setEditUserForm] = useState({
    id: '',
    name: '',
    role: 'Doctor',
    staff_level: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    dob: '',
    blood_group: '',
    address: '',
    status: 'Active',
    emergency_contact: '',
    username: '',
    password: '',
    base_salary: 0,
    additional_details: {}
  })

  const calcAgeFromDob = (dobStr) => {
    if (!dobStr) return ''
    const birthDate = new Date(dobStr)
    const today = new Date()
    if (isNaN(birthDate.getTime())) return ''
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? String(age) : ''
  }

  const calcDobFromAge = (ageVal, existingDob = '') => {
    if (ageVal === '' || ageVal === null || ageVal === undefined) return ''
    const ageNum = parseInt(ageVal, 10)
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) return ''
    const today = new Date()
    const birthYear = today.getFullYear() - ageNum
    
    let monthStr = '01'
    let dayStr = '01'
    if (existingDob) {
      const parts = existingDob.split('-')
      if (parts.length === 3 && !isNaN(parseInt(parts[1], 10)) && !isNaN(parseInt(parts[2], 10))) {
        monthStr = parts[1]
        dayStr = parts[2]
      }
    }
    return `${birthYear}-${monthStr}-${dayStr}`
  }

  const handleDobChange = (dobVal, isEdit = false) => {
    const computedAge = calcAgeFromDob(dobVal)
    if (isEdit) {
      setEditUserForm(prev => ({ ...prev, dob: dobVal, age: computedAge }))
    } else {
      setNewUser(prev => ({ ...prev, dob: dobVal, age: computedAge }))
    }
  }

  const handleAgeChange = (ageVal, isEdit = false) => {
    if (isEdit) {
      setEditUserForm(prev => {
        const computedDob = ageVal !== '' ? calcDobFromAge(ageVal, prev.dob) : ''
        return { ...prev, age: ageVal, dob: computedDob }
      })
    } else {
      setNewUser(prev => {
        const computedDob = ageVal !== '' ? calcDobFromAge(ageVal, prev.dob) : ''
        return { ...prev, age: ageVal, dob: computedDob }
      })
    }
  }

  const normalizePhone = (phoneStr) => {
    if (!phoneStr) return ''
    let digits = String(phoneStr).replace(/\D/g, '')
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2)
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1)
    }
    return digits
  }

  const [addAvailability, setAddAvailability] = useState({
    username: { available: true, message: '' },
    email: { available: true, message: '' },
    phone: { available: true, message: '' }
  })

  const [editAvailability, setEditAvailability] = useState({
    username: { available: true, message: '' },
    email: { available: true, message: '' },
    phone: { available: true, message: '' }
  })

  const [toast, setToast] = useState({ show: false, message: '', type: 'error' })
  const [addFormErrors, setAddFormErrors] = useState({})
  const [editFormErrors, setEditFormErrors] = useState({})

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type })
  }

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [toast.show])

  const checkFieldAvailability = async (field, value, isEdit = false) => {
    const val = value ? value.trim() : ''
    if (!val) {
      if (isEdit) {
        setEditAvailability(prev => ({ ...prev, [field]: { available: true, message: '' } }))
      } else {
        setAddAvailability(prev => ({ ...prev, [field]: { available: true, message: '' } }))
      }
      return
    }

    try {
      const params = new URLSearchParams()
      params.append(field, val)
      if (isEdit && editUserForm.id) {
        params.append('staff_id', editUserForm.id)
      }

      const res = await fetch(`${API}/staff/check-availability/?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (data[field]) {
          if (isEdit) {
            setEditAvailability(prev => ({ ...prev, [field]: data[field] }))
          } else {
            setAddAvailability(prev => ({ ...prev, [field]: data[field] }))
          }
        }
      }
    } catch (err) {
      console.error(`Error checking ${field} availability:`, err)
    }
  }

  useEffect(() => {
    if (!showAdd) {
      setAddAvailability({
        username: { available: true, message: '' },
        email: { available: true, message: '' },
        phone: { available: true, message: '' }
      })
      setAddFormErrors({})
      return
    }

    const timer = setTimeout(async () => {
      const u = newUser.username.trim()
      const e = newUser.email.trim()
      const p = newUser.phone.trim()

      setAddAvailability(prev => ({
        username: u ? prev.username : { available: true, message: '' },
        email: e ? prev.email : { available: true, message: '' },
        phone: p ? prev.phone : { available: true, message: '' }
      }))

      if (!u && !e && !p) return

      try {
        const params = new URLSearchParams()
        if (u) params.append('username', u)
        if (e) params.append('email', e)
        if (p) params.append('phone', p)

        const res = await fetch(`${API}/staff/check-availability/?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setAddAvailability(prev => ({
            username: u ? (data.username || { available: true, message: '' }) : { available: true, message: '' },
            email: e ? (data.email || { available: true, message: '' }) : { available: true, message: '' },
            phone: p ? (data.phone || { available: true, message: '' }) : { available: true, message: '' }
          }))
        }
      } catch (err) {
        console.error('Error checking availability:', err)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [newUser.username, newUser.email, newUser.phone, showAdd])

  useEffect(() => {
    if (!showEditProfile) {
      setEditAvailability({
        username: { available: true, message: '' },
        email: { available: true, message: '' },
        phone: { available: true, message: '' }
      })
      setEditFormErrors({})
      return
    }

    const timer = setTimeout(async () => {
      const u = editUserForm.username.trim()
      const e = editUserForm.email.trim()
      const p = editUserForm.phone.trim()

      setEditAvailability(prev => ({
        username: u ? prev.username : { available: true, message: '' },
        email: e ? prev.email : { available: true, message: '' },
        phone: p ? prev.phone : { available: true, message: '' }
      }))

      if (!u && !e && !p) return

      try {
        const params = new URLSearchParams()
        if (u) params.append('username', u)
        if (e) params.append('email', e)
        if (p) params.append('phone', p)
        if (editUserForm.id) params.append('staff_id', editUserForm.id)

        const res = await fetch(`${API}/staff/check-availability/?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setEditAvailability(prev => ({
            username: u ? (data.username || { available: true, message: '' }) : { available: true, message: '' },
            email: e ? (data.email || { available: true, message: '' }) : { available: true, message: '' },
            phone: p ? (data.phone || { available: true, message: '' }) : { available: true, message: '' }
          }))
        }
      } catch (err) {
        console.error('Error checking edit availability:', err)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [editUserForm.username, editUserForm.email, editUserForm.phone, editUserForm.id, showEditProfile])

  // Permissions State
  const [editingStaff, setEditingStaff] = useState(null)
  const [tempPermissions, setTempPermissions] = useState([])
  
  // Custom Roles State
  const [availableRoles, setAvailableRoles] = useState(['Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Dental Assistant'])

  const allModules = [
    { id: 'dashboard',           name: 'Dashboard',            roles: ['Admin','Doctor','Receptionist','Pharmacist'] },
    { id: 'add-patients',        name: 'Add Patients',         roles: ['Admin','Doctor','Receptionist'] },
    { id: 'appointments',        name: 'Appointments',         roles: ['Admin','Doctor','Receptionist'] },
    { id: 'today-patients',      name: "Today's Patients",     roles: ['Admin','Doctor','Receptionist'] },
    { id: 'search-patient',      name: 'Search Patient',       roles: ['Admin','Doctor','Receptionist'] },
    { id: 'follow-ups',          name: 'Follow-ups',           roles: ['Admin','Doctor','Receptionist'] },
    { id: 'pre-bookings',        name: 'Pre-bookings',         roles: ['Admin','Doctor','Receptionist'] },
    { id: 'tele-medicine',       name: 'Telemedicine',         roles: ['Admin','Doctor','Receptionist'] },
    { id: 'website-appointment', name: 'Website Appointments', roles: ['Admin','Doctor','Receptionist'] },
    { id: 'communication',       name: 'Communication',        roles: ['Admin','Doctor'] },
    { id: 'billing',             name: 'Billing',              roles: ['Admin','Receptionist'] },
    { id: 'transactions',        name: 'Transactions',         roles: ['Admin'] },
    { id: 'reports',             name: 'EHR Reports',          roles: ['Admin','Doctor'] },
    { id: 'pathology-lab',       name: 'Pathology Lab',        roles: ['Admin'] },
    { id: 'dental-lab',          name: 'Dental Lab',           roles: ['Admin'] },
    { id: 'pharmacy',            name: 'Pharmacy',             roles: ['Admin','Pharmacist'] },
    { id: 'purchases',           name: 'Stock Purchases',      roles: ['Admin','Pharmacist'] },
    { id: 'material-purchases',  name: 'Material Purchases',   roles: ['Admin','Pharmacist','Receptionist'] },
    { id: 'stock',               name: 'Pharmacy Stock',       roles: ['Admin','Pharmacist'] },
    { id: 'prescriptions',       name: 'Prescriptions',        roles: ['Admin','Doctor','Pharmacist'] },
    { id: 'doctor-slots',        name: 'My Slots',             roles: ['Doctor'] },
    { id: 'income',              name: 'My Income',            roles: ['Doctor'] },
    { id: 'users',               name: 'Staff Management',     roles: ['Admin'] },
    { id: 'doctors',             name: 'Doctors',              roles: ['Admin'] },
    { id: 'settings',            name: 'Settings',             roles: ['Admin'] },
  ]

  useEffect(() => {
    fetchUsers()
    fetchAvailableRoles()
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

  const fetchAvailableRoles = async () => {
    try {
      const savedUserStr = localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user')
      const authUser = savedUserStr ? JSON.parse(savedUserStr) : null
      const isSuperAdmin = authUser?.is_superuser === true

      const res = await fetch(`http://127.0.0.1:8000/api/masters/roles/`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        const rolesList = data.map(r => r.name)
        if (rolesList.length > 0) {
          let merged = Array.from(new Set([...rolesList, 'Doctor', 'Pharmacist', 'Receptionist', 'Accountant', 'Dental Assistant']))
          if (isSuperAdmin) {
            merged = Array.from(new Set(['Admin', ...merged]))
          } else {
            merged = merged.filter(r => r.toLowerCase() !== 'admin' && r.toLowerCase() !== 'super admin')
          }
          setAvailableRoles(merged)
          return
        }
      }
      let fallback = ['Doctor', 'Pharmacist', 'Receptionist', 'Accountant', 'Dental Assistant']
      if (isSuperAdmin) {
        fallback = ['Admin', ...fallback]
      }
      setAvailableRoles(fallback)
    } catch (e) { console.error(e) }
  }

  const fetchRoleDefaults = async (role) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/settings/role-defaults/${role}/`)
      if (res.ok) {
        const data = await res.json()
        return data.permissions || []
      }
    } catch (e) { console.error(e) }
    return []
  }

  const handleRoleChange = async (role, isEdit = false) => {
    if (isEdit) {
      setEditUserForm(prev => ({ ...prev, role }))
    } else {
      setNewUser(prev => ({ ...prev, role }))
      const defaults = await fetchRoleDefaults(role)
      setNewUserDefaultPerms(defaults)
    }
  }

  const [newUserDefaultPerms, setNewUserDefaultPerms] = useState([])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/staff/list/`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setAddFormErrors({})

    const trimmedName = newUser.name ? newUser.name.trim() : ''
    const trimmedRole = newUser.role ? newUser.role.trim() : ''
    const trimmedPhone = newUser.phone ? newUser.phone.trim() : ''
    const trimmedEmail = newUser.email ? newUser.email.trim().toLowerCase() : ''
    const trimmedGender = newUser.gender ? newUser.gender.trim() : ''
    const trimmedDob = newUser.dob ? newUser.dob.trim() : ''
    const ageVal = newUser.age
    const trimmedBloodGroup = newUser.blood_group ? newUser.blood_group.trim() : ''
    const trimmedStatus = newUser.status ? newUser.status.trim() : ''
    const trimmedAddress = newUser.address ? newUser.address.trim() : ''
    const trimmedUsername = newUser.username ? newUser.username.trim().toLowerCase() : ''
    const trimmedPassword = newUser.password ? newUser.password.trim() : ''

    const errors = {}
    if (!trimmedName) errors.name = 'Full Name is required'
    if (!trimmedRole) errors.role = 'Staff Role is required'
    if (!trimmedPhone) errors.phone = 'Phone Number is required'
    if (!trimmedGender) errors.gender = 'Gender is required'
    if (!trimmedDob) errors.dob = 'Date of Birth is required'
    if (ageVal === '' || ageVal === null || ageVal === undefined) errors.age = 'Age is required'
    if (!trimmedBloodGroup) errors.blood_group = 'Blood Group is required'
    if (!trimmedStatus) errors.status = 'Status is required'
    if (!trimmedAddress) errors.address = 'Residential Address is required'
    if (!trimmedUsername) errors.username = 'Username is required'
    if (!trimmedPassword) errors.password = 'Password is required'

    const profErrors = validateProfessionalDetails(newUser.role, newUser.additional_details, newUser)
    Object.assign(errors, profErrors)

    if (Object.keys(errors).length > 0) {
      setAddFormErrors(errors)
      showToast('Please fill in all required fields.', 'error')
      return
    }

    // Email format check (ONLY IF EMAIL IS PROVIDED)
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        setAddFormErrors({ email: 'Please enter a valid email address.' })
        showToast('Please enter a valid email address.', 'error')
        return
      }
    }

    // Availability Checks
    if (addAvailability.username && !addAvailability.username.available) {
      setAddFormErrors({ username: addAvailability.username.message || 'Username already exists.' })
      showToast(addAvailability.username.message || 'Username already exists. Please choose another username.', 'error')
      return
    }
    if (trimmedEmail && addAvailability.email && !addAvailability.email.available) {
      setAddFormErrors({ email: addAvailability.email.message || 'This email is already registered.' })
      showToast(addAvailability.email.message || 'This email is already registered.', 'error')
      return
    }
    if (trimmedPhone && addAvailability.phone && !addAvailability.phone.available) {
      setAddFormErrors({ phone: addAvailability.phone.message || 'Phone number is already registered.' })
      showToast(addAvailability.phone.message || 'Phone number is already registered.', 'error')
      return
    }

    // Normalized State Comparison
    if (trimmedUsername && users.some(u => u.username && u.username.trim().toLowerCase() === trimmedUsername)) {
      setAddFormErrors({ username: 'Username already exists. Please choose another username.' })
      showToast('Username already exists. Please choose another username.', 'error')
      return
    }
    const normP = normalizePhone(trimmedPhone)
    if (normP && users.some(u => u.phone && normalizePhone(u.phone) === normP)) {
      setAddFormErrors({ phone: 'Phone number is already registered.' })
      showToast('Phone number is already registered.', 'error')
      return
    }
    if (trimmedEmail && users.some(u => u.email && u.email.trim().toLowerCase() === trimmedEmail)) {
      setAddFormErrors({ email: 'This email is already registered.' })
      showToast('This email is already registered.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      let perms = newUserDefaultPerms
      if (!perms.length) {
        perms = await fetchRoleDefaults(newUser.role)
      }
      const res = await fetch(`${API}/staff/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser, permissions: perms })
      })
      const data = await res.json()
      if (res.ok && data.success !== false) {
        setShowAdd(false)
        setNewUser({
          name: '',
          role: 'Doctor',
          staff_level: '',
          phone: '',
          email: '',
          gender: 'Male',
          age: '',
          dob: '',
          blood_group: '',
          address: '',
          status: 'Active',
          emergency_contact: '',
          username: '',
          password: '',
          base_salary: 0,
          additional_details: {}
        })
        setNewUserDefaultPerms([])
        setAddFormErrors({})
        showToast('Staff created successfully!', 'success')
        fetchUsers()
      } else {
        const fieldErrs = data.errors || {}
        setAddFormErrors(fieldErrs)
        if (fieldErrs.email) {
          setAddAvailability(prev => ({ ...prev, email: { available: false, message: `✕ ${fieldErrs.email}` } }))
        }
        if (fieldErrs.username) {
          setAddAvailability(prev => ({ ...prev, username: { available: false, message: `✕ ${fieldErrs.username}` } }))
        }
        if (fieldErrs.phone) {
          setAddAvailability(prev => ({ ...prev, phone: { available: false, message: `✕ ${fieldErrs.phone}` } }))
        }
        showToast(data.error || 'Staff could not be created. Please correct highlighted fields.', 'error')
      }
    } catch (e) {
      console.error(e)
      showToast('Network error while creating staff account.', 'error')
    }
    setIsSubmitting(false)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: tempPermissions })
      })
      if (res.ok) {
        setEditingStaff(null)
        showToast('Permissions updated successfully!', 'success')
        fetchUsers()
      } else {
        showToast('Failed to update permissions', 'error')
      }
    } catch (e) { console.error(e) }
  }

  const openEditProfile = (u) => {
    setEditUserForm({
      id: u.id,
      name: u.name,
      role: u.role,
      staff_level: u.staff_level || u.additional_details?.staff_level || 'Junior',
      phone: u.phone || '',
      email: u.email || '',
      gender: u.gender || u.additional_details?.gender || 'Male',
      age: u.age !== undefined && u.age !== null ? u.age : (u.additional_details?.age || ''),
      dob: u.dob || u.additional_details?.dob || '',
      blood_group: u.blood_group || u.additional_details?.blood_group || '',
      address: u.address || u.additional_details?.address || '',
      status: u.status || (u.is_active === false ? 'Inactive' : 'Active'),
      emergency_contact: u.emergency_contact || u.additional_details?.emergency_contact || '',
      username: u.username || '',
      password: '',
      base_salary: u.base_salary || 0,
      additional_details: u.additional_details || {}
    })
    setEditFormErrors({})
    setShowEditProfile(true)
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    setEditFormErrors({})

    const trimmedName = editUserForm.name ? editUserForm.name.trim() : ''
    const trimmedRole = editUserForm.role ? editUserForm.role.trim() : ''
    const trimmedPhone = editUserForm.phone ? editUserForm.phone.trim() : ''
    const trimmedEmail = editUserForm.email ? editUserForm.email.trim().toLowerCase() : ''
    const trimmedGender = editUserForm.gender ? editUserForm.gender.trim() : ''
    const trimmedDob = editUserForm.dob ? editUserForm.dob.trim() : ''
    const ageVal = editUserForm.age
    const trimmedBloodGroup = editUserForm.blood_group ? editUserForm.blood_group.trim() : ''
    const trimmedStatus = editUserForm.status ? editUserForm.status.trim() : ''
    const trimmedAddress = editUserForm.address ? editUserForm.address.trim() : ''
    const trimmedUsername = editUserForm.username ? editUserForm.username.trim().toLowerCase() : ''

    const errors = {}
    if (!trimmedName) errors.name = 'Full Name is required'
    if (!trimmedRole) errors.role = 'Staff Role is required'
    if (!trimmedPhone) errors.phone = 'Phone Number is required'
    if (!trimmedGender) errors.gender = 'Gender is required'
    if (!trimmedDob) errors.dob = 'Date of Birth is required'
    if (ageVal === '' || ageVal === null || ageVal === undefined) errors.age = 'Age is required'
    if (!trimmedBloodGroup) errors.blood_group = 'Blood Group is required'
    if (!trimmedStatus) errors.status = 'Status is required'
    if (!trimmedAddress) errors.address = 'Residential Address is required'
    if (!trimmedUsername) errors.username = 'Username is required'

    const profErrors = validateProfessionalDetails(editUserForm.role, editUserForm.additional_details, editUserForm)
    Object.assign(errors, profErrors)

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors)
      showToast('Please fill in all required fields.', 'error')
      return
    }

    // Email format check (ONLY IF EMAIL IS PROVIDED)
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        setEditFormErrors({ email: 'Please enter a valid email address.' })
        showToast('Please enter a valid email address.', 'error')
        return
      }
    }

    // Availability checks
    if (editAvailability.username && !editAvailability.username.available) {
      setEditFormErrors({ username: editAvailability.username.message || 'Username already exists.' })
      showToast(editAvailability.username.message || 'Username already exists. Please choose another username.', 'error')
      return
    }
    if (trimmedEmail && editAvailability.email && !editAvailability.email.available) {
      setEditFormErrors({ email: editAvailability.email.message || 'This email is already registered.' })
      showToast(editAvailability.email.message || 'Email address is already registered to another staff member.', 'error')
      return
    }
    if (trimmedPhone && editAvailability.phone && !editAvailability.phone.available) {
      setEditFormErrors({ phone: editAvailability.phone.message || 'Phone number is already registered.' })
      showToast(editAvailability.phone.message || 'Phone number is already registered to another staff member.', 'error')
      return
    }

    // Normalized State Comparison (excluding self)
    if (trimmedUsername && users.some(u => String(u.id) !== String(editUserForm.id) && u.username && u.username.trim().toLowerCase() === trimmedUsername)) {
      setEditFormErrors({ username: 'Username already exists. Please choose another username.' })
      showToast('Username already exists. Please choose another username.', 'error')
      return
    }
    const normP = normalizePhone(trimmedPhone)
    if (normP && users.some(u => String(u.id) !== String(editUserForm.id) && u.phone && normalizePhone(u.phone) === normP)) {
      setEditFormErrors({ phone: 'Phone number is already registered to another staff member.' })
      showToast('Phone number is already registered to another staff member.', 'error')
      return
    }
    if (trimmedEmail && users.some(u => String(u.id) !== String(editUserForm.id) && u.email && u.email.trim().toLowerCase() === trimmedEmail)) {
      setEditFormErrors({ email: 'This email is already registered to another staff member.' })
      showToast('Email address is already registered to another staff member.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${API}/staff/${editUserForm.id}/update/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm)
      })
      const data = await res.json()
      if (res.ok && data.success !== false) {
        setShowEditProfile(false)
        setEditFormErrors({})
        showToast('Staff updated successfully!', 'success')
        fetchUsers()
      } else {
        const fieldErrs = data.errors || {}
        setEditFormErrors(fieldErrs)
        if (fieldErrs.email) {
          setEditAvailability(prev => ({ ...prev, email: { available: false, message: `✕ ${fieldErrs.email}` } }))
        }
        if (fieldErrs.username) {
          setEditAvailability(prev => ({ ...prev, username: { available: false, message: `✕ ${fieldErrs.username}` } }))
        }
        if (fieldErrs.phone) {
          setEditAvailability(prev => ({ ...prev, phone: { available: false, message: `✕ ${fieldErrs.phone}` } }))
        }
        showToast(data.error || 'Staff could not be updated. Please correct highlighted fields.', 'error')
      }
    } catch (e) {
      console.error(e)
      showToast('Network error while updating staff account.', 'error')
    }
    setIsSubmitting(false)
  }

  // Helper for document file inputs in Clean White Theme
  const renderDocumentUpload = (label, docKey, details, setFormData, formData, formType, accept = ".pdf,image/*", isOptional = false) => {
    const docName = details[`${docKey}_name`] || ''
    
    const handleFileUpload = (e) => {
      const file = e.target.files[0]
      if (!file) return
      if (file.size === 0) {
        alert("Selected file is empty (0 bytes). Please choose a valid file.")
        e.target.value = ''
        return
      }
      if (file.size > 15 * 1024 * 1024) {
        alert("File size exceeds 15MB limit. Please choose a smaller file.")
        e.target.value = ''
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({
          ...formData,
          additional_details: {
            ...details,
            [`${docKey}_name`]: file.name,
            [`${docKey}_file`]: reader.result
          }
        })
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    }

    const handleRemoveDoc = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const updatedDetails = { ...details }
      delete updatedDetails[`${docKey}_name`]
      delete updatedDetails[`${docKey}_file`]
      setFormData({
        ...formData,
        additional_details: updatedDetails
      })
    }

    return (
      <div className={styles.field}>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, color: '#475569', fontWeight: 600 }}>
          <span style={{ fontSize: 13 }}>{label}</span>
          {isOptional && <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>}
        </label>
        <input
          type="file"
          accept={accept}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id={`doc-${docKey}-${formType}`}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label
            htmlFor={`doc-${docKey}-${formType}`}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 14px', borderRadius: 10,
              border: docName ? '1px solid #10b981' : '1px dashed #cbd5e1',
              cursor: 'pointer', background: docName ? '#ecfdf5' : '#f8fafc',
              color: docName ? '#047857' : '#64748b', fontSize: 13, fontWeight: '500',
              transition: 'all 0.2s ease', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}
          >
            {docName ? `✅ ${docName}` : `📁 Choose ${label}`}
          </label>
          {docName && (
            <button
              type="button"
              onClick={handleRemoveDoc}
              title="Remove file"
              style={{
                background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c',
                borderRadius: 8, padding: '10px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }

  const validateProfessionalDetails = (role, details = {}, formData = {}) => {
    const errors = {}
    const staffLevel = formData.staff_level ? String(formData.staff_level).trim() : ''
    const qual = details.qualification ? String(details.qualification).trim() : ''
    const spec = details.specialization ? String(details.specialization).trim() : ''
    const lic = details.license_no ? String(details.license_no).trim() : ''
    const council = details.registration_council ? String(details.registration_council).trim() : ''
    const desig = details.designation ? String(details.designation).trim() : ''
    const fee = details.consultation_fee
    const exp = details.experience_years

    if (!staffLevel) {
      errors.staff_level = 'Staff Level is required'
    }

    if (role === 'Doctor') {
      if (!qual) errors.qualification = 'Qualification is required'
      if (!spec) errors.specialization = 'Specialization is required'
      if (!lic) errors.license_no = 'Dental Registration Number is required'
      if (!council) errors.registration_council = 'Registration Council is required'

      if (fee === '' || fee === null || fee === undefined || (typeof fee === 'string' && fee.trim() === '')) {
        errors.consultation_fee = 'Consultation Fee is required'
      } else {
        const numFee = Number(fee)
        if (isNaN(numFee)) {
          errors.consultation_fee = 'Consultation Fee must be a valid number'
        } else if (numFee < 0) {
          errors.consultation_fee = 'Consultation Fee cannot be negative'
        }
      }
    } else if (role === 'Receptionist') {
      if (!qual) errors.qualification = 'Highest Qualification is required'
    } else if (role === 'Pharmacist') {
      if (!qual) errors.qualification = 'Qualification is required'
      if (!lic) errors.license_no = 'Pharmacy Registration Number is required'
      if (!council) errors.registration_council = 'Registration Council is required'
    } else if (role === 'Dental Assistant' || role === 'Assistant') {
      if (!qual) errors.qualification = 'Qualification is required'
    } else {
      if (!desig) errors.designation = 'Designation / Title is required'
    }

    if (exp === '' || exp === null || exp === undefined || (typeof exp === 'string' && exp.trim() === '')) {
      errors.experience_years = 'Years of Experience is required'
    } else {
      const strExp = String(exp).trim()
      const numExp = Number(strExp)
      if (isNaN(numExp)) {
        errors.experience_years = 'Years of Experience must be a valid number'
      } else if (numExp < 0) {
        errors.experience_years = 'Years of Experience cannot be negative'
      } else if (!Number.isInteger(numExp)) {
        errors.experience_years = 'Years of Experience must be a whole number'
      }
    }

    return errors
  }

  // Dynamic Role-Specific Form Fields Renderer (Light Theme Standard Format)
  const renderRoleSpecificFields = (formData, setFormData, formType, formErrors = {}) => {
    const role = formData.role || 'Doctor'
    const details = formData.additional_details || {}

    const updateDetail = (key, val) => {
      setFormData({
        ...formData,
        additional_details: { ...details, [key]: val }
      })
    }

    // Role Accent Colors (Clean Light Theme Palette)
    const themeColor = role === 'Doctor' ? '#2563eb' : role === 'Pharmacist' ? '#d97706' : role === 'Receptionist' ? '#059669' : (role === 'Dental Assistant' || role === 'Assistant') ? '#7e22ce' : '#4f46e5'
    const themeBg = role === 'Doctor' ? '#f0f9ff' : role === 'Pharmacist' ? '#fffbe6' : role === 'Receptionist' ? '#f0fdf4' : (role === 'Dental Assistant' || role === 'Assistant') ? '#faf5ff' : '#f5f3ff'
    const themeBorder = role === 'Doctor' ? '#bae6fd' : role === 'Pharmacist' ? '#ffe58f' : role === 'Receptionist' ? '#bbf7d0' : (role === 'Dental Assistant' || role === 'Assistant') ? '#e9d5ff' : '#ddd6fe'

    const inputStyle = {
      padding: '10px 14px',
      borderRadius: 10,
      border: '1px solid #cbd5e1',
      width: '100%',
      background: '#ffffff',
      color: '#0f172a',
      fontSize: 14,
      outline: 'none'
    }

    return (
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 2: Professional Information */}
        <div style={{ padding: 20, borderRadius: 14, border: `1px solid ${themeBorder}`, background: themeBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 16 }}>💼</span>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: '700', color: themeColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Professional Information — {role}
            </h3>
          </div>

          {/* Staff Level Dropdown (Required for all roles) */}
          <div className={styles.grid} style={{ marginBottom: 14 }}>
            <div className={styles.field}>
              <label style={{ color: '#475569' }}>Staff Level *</label>
              <select
                style={inputStyle}
                value={formData.staff_level || ''}
                onChange={e => setFormData({ ...formData, staff_level: e.target.value })}
              >
                <option value="">-- Select Staff Level --</option>
                <option value="Senior">Senior</option>
                <option value="Junior">Junior</option>
                <option value="Trainee">Trainee</option>
                <option value="Intern">Intern</option>
                <option value="Consultant">Consultant</option>
                <option value="Other">Other</option>
              </select>
              {formErrors.staff_level && (
                <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.staff_level}</div>
              )}
            </div>
          </div>

          {/* 1. DOCTOR FIELDS */}
          {role === 'Doctor' && (
            <>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Qualification *</label>
                  <select
                    style={inputStyle}
                    value={details.qualification || 'BDS'}
                    onChange={e => updateDetail('qualification', e.target.value)}
                  >
                    <option value="BDS">BDS (Bachelor of Dental Surgery)</option>
                    <option value="MDS">MDS (Master of Dental Surgery)</option>
                    <option value="DMD">DMD (Doctor of Dental Medicine)</option>
                    <option value="BDS, MDS">BDS, MDS</option>
                    <option value="BDS, Fellowship">BDS with Clinical Fellowship</option>
                  </select>
                  {formErrors.qualification && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.qualification}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Specialization *</label>
                  <select
                    style={inputStyle}
                    value={details.specialization || 'General Dentistry'}
                    onChange={e => updateDetail('specialization', e.target.value)}
                  >
                    <option value="General Dentistry">General Dentistry</option>
                    <option value="Orthodontics">Orthodontics & Dentofacial Orthopedics</option>
                    <option value="Endodontics">Endodontics & Conservative Dentistry</option>
                    <option value="Oral Surgery">Oral & Maxillofacial Surgery</option>
                    <option value="Pediatric Dentistry">Pediatric & Preventive Dentistry</option>
                    <option value="Periodontics">Periodontics & Implantology</option>
                    <option value="Prosthodontics">Prosthodontics & Crown Bridge</option>
                    <option value="Cosmetic Dentistry">Cosmetic / Aesthetic Dentistry</option>
                  </select>
                  {formErrors.specialization && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.specialization}</div>
                  )}
                </div>
              </div>
              <div className={styles.grid} style={{ marginTop: 14 }}>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Dental Registration Number *</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. DENT-REG-98742"
                    value={details.license_no || ''}
                    onChange={e => updateDetail('license_no', e.target.value)}
                  />
                  {formErrors.license_no && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.license_no}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Registration Council *</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. State Dental Council / DCI"
                    value={details.registration_council || ''}
                    onChange={e => updateDetail('registration_council', e.target.value)}
                  />
                  {formErrors.registration_council && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.registration_council}</div>
                  )}
                </div>
              </div>
              <div className={styles.grid} style={{ marginTop: 14 }}>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Years of Experience *</label>
                  <input
                    type="number"
                    min="0"
                    style={inputStyle}
                    placeholder="e.g. 8"
                    value={details.experience_years !== undefined && details.experience_years !== null ? details.experience_years : ''}
                    onChange={e => updateDetail('experience_years', e.target.value)}
                  />
                  {formErrors.experience_years && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.experience_years}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Consultation Fee (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    style={inputStyle}
                    placeholder="e.g. 500"
                    value={details.consultation_fee !== undefined && details.consultation_fee !== null ? details.consultation_fee : ''}
                    onChange={e => updateDetail('consultation_fee', e.target.value)}
                  />
                  {formErrors.consultation_fee && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.consultation_fee}</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 2. RECEPTIONIST FIELDS */}
          {role === 'Receptionist' && (
            <>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Highest Qualification *</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. Bachelor's Degree / Diploma"
                    value={details.qualification || ''}
                    onChange={e => updateDetail('qualification', e.target.value)}
                  />
                  {formErrors.qualification && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.qualification}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Years of Experience *</label>
                  <input
                    type="number"
                    min="0"
                    style={inputStyle}
                    placeholder="e.g. 3"
                    value={details.experience_years !== undefined && details.experience_years !== null ? details.experience_years : ''}
                    onChange={e => updateDetail('experience_years', e.target.value)}
                  />
                  {formErrors.experience_years && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.experience_years}</div>
                  )}
                </div>
              </div>
              <div className={styles.grid} style={{ marginTop: 14 }}>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Previous Workplace <span style={{ fontSize: 11, color: '#94a3b8' }}>(Optional)</span></label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. City Dental Clinic / Apollo Health"
                    value={details.previous_workplace || ''}
                    onChange={e => updateDetail('previous_workplace', e.target.value)}
                  />
                </div>
                {/* <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Front Desk / Counter Station No.</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. Counter 1 / Main Reception"
                    value={details.desk_no || ''}
                    onChange={e => updateDetail('desk_no', e.target.value)}
                  />
                </div> */}
              </div>
            </>
          )}

          {/* 3. PHARMACIST FIELDS */}
          {role === 'Pharmacist' && (
            <>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Qualification *</label>
                  <select
                    style={inputStyle}
                    value={details.qualification || 'B.Pharm'}
                    onChange={e => updateDetail('qualification', e.target.value)}
                  >
                    <option value="D.Pharm">D.Pharm (Diploma in Pharmacy)</option>
                    <option value="B.Pharm">B.Pharm (Bachelor of Pharmacy)</option>
                    <option value="M.Pharm">M.Pharm (Master of Pharmacy)</option>
                    <option value="Pharm.D">Pharm.D (Doctor of Pharmacy)</option>
                  </select>
                  {formErrors.qualification && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.qualification}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Pharmacy Registration Number *</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. PHARM-LIC-8812"
                    value={details.license_no || ''}
                    onChange={e => updateDetail('license_no', e.target.value)}
                  />
                  {formErrors.license_no && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.license_no}</div>
                  )}
                </div>
              </div>
              <div className={styles.grid} style={{ marginTop: 14 }}>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Registration Council *</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. State Pharmacy Council"
                    value={details.registration_council || ''}
                    onChange={e => updateDetail('registration_council', e.target.value)}
                  />
                  {formErrors.registration_council && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.registration_council}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Years of Experience *</label>
                  <input
                    type="number"
                    min="0"
                    style={inputStyle}
                    placeholder="e.g. 5"
                    value={details.experience_years !== undefined && details.experience_years !== null ? details.experience_years : ''}
                    onChange={e => updateDetail('experience_years', e.target.value)}
                  />
                  {formErrors.experience_years && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.experience_years}</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 4. DENTAL ASSISTANT FIELDS */}
          {(role === 'Dental Assistant' || role === 'Assistant') && (
            <>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Qualification *</label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. Diploma in Dental Assistance"
                    value={details.qualification || ''}
                    onChange={e => updateDetail('qualification', e.target.value)}
                  />
                  {formErrors.qualification && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.qualification}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Dental Assistant Certification <span style={{ fontSize: 11, color: '#94a3b8' }}>(if applicable)</span></label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. Certified Dental Assistant (CDA)"
                    value={details.assistant_certification || ''}
                    onChange={e => updateDetail('assistant_certification', e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.grid} style={{ marginTop: 14 }}>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Years of Experience *</label>
                  <input
                    type="number"
                    min="0"
                    style={inputStyle}
                    placeholder="e.g. 4"
                    value={details.experience_years !== undefined && details.experience_years !== null ? details.experience_years : ''}
                    onChange={e => updateDetail('experience_years', e.target.value)}
                  />
                  {formErrors.experience_years && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.experience_years}</div>
                  )}
                </div>
                <div className={styles.field}>
                  <label style={{ color: '#475569' }}>Previous Workplace <span style={{ fontSize: 11, color: '#94a3b8' }}>(Optional)</span></label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. Smile Care Dental"
                    value={details.previous_workplace || ''}
                    onChange={e => updateDetail('previous_workplace', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* 5. ADMIN / FALLBACK FIELDS */}
          {role !== 'Doctor' && role !== 'Receptionist' && role !== 'Pharmacist' && role !== 'Dental Assistant' && role !== 'Assistant' && (
            <div className={styles.grid}>
              <div className={styles.field}>
                <label style={{ color: '#475569' }}>Designation / Title *</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="e.g. Practice Administrator / Operations Manager"
                  value={details.designation || ''}
                  onChange={e => updateDetail('designation', e.target.value)}
                />
                {formErrors.designation && (
                  <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.designation}</div>
                )}
              </div>
              <div className={styles.field}>
                <label style={{ color: '#475569' }}>Years of Experience *</label>
                <input
                  type="number"
                  min="0"
                  style={inputStyle}
                  placeholder="e.g. 5"
                  value={details.experience_years !== undefined && details.experience_years !== null ? details.experience_years : ''}
                  onChange={e => updateDetail('experience_years', e.target.value)}
                />
                {formErrors.experience_years && (
                  <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {formErrors.experience_years}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Document Attachments */}
        <div style={{ padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 16 }}>📁</span>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Required & Optional Documents
            </h3>
          </div>

          {/* DOCTOR DOCUMENTS */}
          {role === 'Doctor' && (
            <>
              <div className={styles.grid}>
                {renderDocumentUpload('Profile Photo', 'profile_photo', details, setFormData, formData, formType, 'image/*')}
                {renderDocumentUpload('ID Proof', 'id_proof', details, setFormData, formData, formType)}
              </div>
              <div className={styles.grid} style={{ marginTop: 14 }}>
                {renderDocumentUpload('Dental Registration Certificate', 'registration_cert', details, setFormData, formData, formType)}
                {renderDocumentUpload('Qualification Certificate', 'qualification_cert', details, setFormData, formData, formType)}
              </div>
              <div className={styles.grid} style={{ marginTop: 14 }}>
                {renderDocumentUpload('Experience Certificate', 'experience_cert', details, setFormData, formData, formType, '.pdf,image/*', true)}
              </div>
            </>
          )}

          {/* RECEPTIONIST DOCUMENTS */}
          {role === 'Receptionist' && (
            <>
              <div className={styles.grid}>
                {renderDocumentUpload('Profile Photo', 'profile_photo', details, setFormData, formData, formType, 'image/*')}
                {renderDocumentUpload('ID Proof', 'id_proof', details, setFormData, formData, formType)}
              </div>
              <div className={styles.grid} style={{ marginTop: 14 }}>
                {renderDocumentUpload('Qualification Certificate', 'qualification_cert', details, setFormData, formData, formType, '.pdf,image/*', true)}
                {renderDocumentUpload('Experience Certificate', 'experience_cert', details, setFormData, formData, formType, '.pdf,image/*', true)}
              </div>
            </>
          )}

          {/* PHARMACIST DOCUMENTS */}
          {role === 'Pharmacist' && (
            <>
              <div className={styles.grid}>
                {renderDocumentUpload('Profile Photo', 'profile_photo', details, setFormData, formData, formType, 'image/*')}
                {renderDocumentUpload('ID Proof', 'id_proof', details, setFormData, formData, formType)}
              </div>
              <div className={styles.grid} style={{ marginTop: 14 }}>
                {renderDocumentUpload('Pharmacy Registration Certificate', 'registration_cert', details, setFormData, formData, formType)}
                {renderDocumentUpload('Qualification Certificate', 'qualification_cert', details, setFormData, formData, formType)}
              </div>
              <div className={styles.grid} style={{ marginTop: 14 }}>
                {renderDocumentUpload('Experience Certificate', 'experience_cert', details, setFormData, formData, formType, '.pdf,image/*', true)}
              </div>
            </>
          )}

          {/* DENTAL ASSISTANT DOCUMENTS */}
          {(role === 'Dental Assistant' || role === 'Assistant') && (
            <>
              <div className={styles.grid}>
                {renderDocumentUpload('Profile Photo', 'profile_photo', details, setFormData, formData, formType, 'image/*')}
                {renderDocumentUpload('ID Proof', 'id_proof', details, setFormData, formData, formType)}
              </div>
              <div className={styles.grid} style={{ marginTop: 14 }}>
                {renderDocumentUpload('Qualification / Training Certificate', 'qualification_cert', details, setFormData, formData, formType, '.pdf,image/*', true)}
                {renderDocumentUpload('Experience Certificate', 'experience_cert', details, setFormData, formData, formType, '.pdf,image/*', true)}
              </div>
            </>
          )}

          {/* ADMIN / FALLBACK DOCUMENTS */}
          {role !== 'Doctor' && role !== 'Receptionist' && role !== 'Pharmacist' && role !== 'Dental Assistant' && role !== 'Assistant' && (
            <div className={styles.grid}>
              {renderDocumentUpload('Profile Photo', 'profile_photo', details, setFormData, formData, formType, 'image/*')}
              {renderDocumentUpload('ID Proof', 'id_proof', details, setFormData, formData, formType)}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Helper count uploaded documents
  const countUploadedDocs = (det) => {
    if (!det) return 0
    let count = 0
    const keys = ['profile_photo', 'id_proof', 'registration_cert', 'qualification_cert', 'experience_cert']
    keys.forEach(k => {
      if (det[`${k}_name`] || det[`${k}_file`]) count++
    })
    return count
  }

  const commonInputStyle = {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    width: '100%',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: 14,
    outline: 'none'
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Staff Management</h1>
          <p>Manage Doctors, Receptionists, Pharmacists, Dental Assistants, and Admins</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add Staff Member</button>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role & Professional Info</th>
              {/* <th>Documents</th> */}
              <th>Phone & Email</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7">Loading staff...</td></tr> : users.map(u => {
              const det = u.additional_details || {}
              const docCount = countUploadedDocs(det)
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong>{u.name}</strong>
                      <span style={{ 
                        fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                        background: (u.status === 'Inactive' || u.is_active === false) ? '#fee2e2' : '#dcfce7',
                        color: (u.status === 'Inactive' || u.is_active === false) ? '#991b1b' : '#166534'
                      }}>
                        {(u.status === 'Inactive' || u.is_active === false) ? 'Inactive' : 'Active'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {u.gender && <span>{u.gender}</span>}
                      {(u.age || u.dob) && <span> {u.gender ? '• ' : ''}{u.age ? `${u.age} yrs` : u.dob}</span>}
                      {u.blood_group && <span> • 🩸 {u.blood_group}</span>}
                      {det.qualification && <span> • 🎓 {det.qualification}</span>}
                    </div>
                  </td>
                  <td><code style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>{u.username}</code></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={styles.badgeSuccess} style={{ 
                          background: u.role === 'Doctor' ? '#e0f2fe' : (u.role?.toLowerCase() === 'pharmacist') ? '#fef3c7' : (u.role?.toLowerCase() === 'dental assistant' || u.role?.toLowerCase() === 'assistant') ? '#f3e8ff' : '#f1f5f9', 
                          color: u.role === 'Doctor' ? '#0369a1' : (u.role?.toLowerCase() === 'pharmacist') ? '#92400e' : (u.role?.toLowerCase() === 'dental assistant' || u.role?.toLowerCase() === 'assistant') ? '#7e22ce' : '#475569' 
                        }}>
                          {u.role}
                        </span>
                        {u.staff_level && (
                          <span style={{ 
                            fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                            background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1'
                          }}>
                            {u.staff_level}
                          </span>
                        )}
                      </div>
                      {u.role === 'Doctor' && (
                        <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 500 }}>
                          🩺 {det.specialization || 'General Dentistry'} {det.license_no ? `• Reg: ${det.license_no}` : ''}
                        </span>
                      )}
                      {u.role === 'Pharmacist' && (
                        <span style={{ fontSize: 11, color: '#d97706' }}>
                          💊 {det.qualification || 'Pharmacy'} {det.license_no ? `• Reg: ${det.license_no}` : ''}
                        </span>
                      )}
                      {u.role === 'Receptionist' && (
                        <span style={{ fontSize: 11, color: '#059669' }}>
                          📋 {det.qualification ? `Qual: ${det.qualification}` : ''} {det.experience_years !== undefined && det.experience_years !== null && det.experience_years !== '' ? `• Exp: ${det.experience_years} yrs` : ''}
                        </span>
                      )}
                      {(u.role === 'Dental Assistant' || u.role === 'Assistant') && (
                        <span style={{ fontSize: 11, color: '#9333ea' }}>
                          🦷 {det.assistant_certification || det.qualification || 'Assistant'} {det.experience_years !== undefined && det.experience_years !== null && det.experience_years !== '' ? `• Exp: ${det.experience_years} yrs` : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* <td>
                    {docCount > 0 ? (
                      <span style={{ fontSize: 11, color: '#059669', background: '#ecfdf5', padding: '3px 9px', borderRadius: 6, fontWeight: 600, border: '1px solid #a7f3d0' }}>
                        📎 {docCount} Doc{docCount > 1 ? 's' : ''} Attached
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>No docs</span>
                    )}
                  </td> */}
                  <td>
                    <div style={{ fontSize: 13, color: '#334155' }}>📞 {u.phone || 'N/A'}</div>
                    {u.email && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>✉️ {u.email}</div>}
                    {u.emergency_contact && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>🆘 {u.emergency_contact}</div>}
                  </td>
                  <td>₹{Number(u.base_salary || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button className={styles.editBtn} onClick={() => openEditProfile(u)}>✏️ Edit</button>
                      <button className={styles.editBtn} style={{background: '#10b981', borderColor: '#059669', color: 'white'}} onClick={() => openAccessModal(u)}>🛡️ Access</button>
                      <button className={styles.editBtn} style={{background: '#0284c7', borderColor: '#0369a1', color: 'white'}} onClick={() => setInsuranceStaff(u)}>🏥 Insurance</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Staff Onboarding Wizard */}
      {showAdd && (
        <StaffOnboardingWizard
          onClose={() => setShowAdd(false)}
          onSuccess={() => fetchUsers()}
          showToast={showToast}
          existingUsers={users}
        />
      )}

      {/* Edit Insurance Modal */}
      {insuranceStaff && (
        <StaffInsuranceModal
          staff={insuranceStaff}
          onClose={() => setInsuranceStaff(null)}
          showToast={showToast}
        />
      )}

      {/* Old Add Staff Modal Disabled */}
      {false && (
        <div className={styles.overlay} style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 9000 }}>
          <div className={styles.modal} style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '18px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', padding: 0, zIndex: 9001 }}>
            <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg, #0b132b 0%, #0f172a 40%, #064e3b 85%, #059669 100%)', borderTopLeftRadius: '18px', borderTopRightRadius: '18px', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.3px' }}>Add New Staff Member</h2>
                <p style={{ margin: '6px 0 0 0', color: '#a7f3d0', fontSize: '0.88rem', fontWeight: '400' }}>Create staff credentials, assign permissions, and complete professional registration details.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '700',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginLeft: '12px',
                  flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.85)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                title="Close Modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.form} style={{ padding: '24px' }}>
              {/* Section 1: Account & Personal Information */}
              <div style={{ padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>👤</span>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Account & Personal Details
                  </h3>
                </div>

                <div className={styles.grid}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      style={commonInputStyle}
                      placeholder="e.g. Dr. John Doe" 
                      value={newUser.name}
                      onChange={e => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Staff Role *</label>
                    <select 
                      style={commonInputStyle}
                      value={newUser.role}
                      onChange={e => handleRoleChange(e.target.value, false)}
                    >
                      {availableRoles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.grid} style={{ marginTop: 14 }}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Phone Number *</label>
                    <input 
                      type="text" 
                      required
                      style={commonInputStyle}
                      placeholder="e.g. 9876543210" 
                      value={newUser.phone}
                      onChange={e => setNewUser({...newUser, phone: e.target.value})}
                      onBlur={() => checkFieldAvailability('phone', newUser.phone, false)}
                    />
                    {(newUser.phone.trim() || addFormErrors.phone) && (addAvailability.phone.message || addFormErrors.phone) && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: (addAvailability.phone.available && !addFormErrors.phone) ? '#059669' : '#dc2626' }}>
                        {addFormErrors.phone ? `✕ ${addFormErrors.phone}` : addAvailability.phone.message}
                      </div>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Email Address</label>
                    <input 
                      type="email" 
                      style={commonInputStyle}
                      placeholder="e.g. john@clinic.com" 
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      onBlur={() => checkFieldAvailability('email', newUser.email, false)}
                    />
                    {(newUser.email.trim() || addFormErrors.email) && (addAvailability.email.message || addFormErrors.email) && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: (addAvailability.email.available && !addFormErrors.email) ? '#059669' : '#dc2626' }}>
                        {addFormErrors.email ? `✕ ${addFormErrors.email}` : addAvailability.email.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.grid} style={{ marginTop: 14 }}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Gender *</label>
                    <select
                      required
                      style={commonInputStyle}
                      value={newUser.gender}
                      onChange={e => setNewUser({...newUser, gender: e.target.value})}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {addFormErrors.gender && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {addFormErrors.gender}</div>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Date of Birth (DOB) *</label>
                    <input
                      type="date"
                      required
                      style={commonInputStyle}
                      value={newUser.dob}
                      onChange={e => handleDobChange(e.target.value, false)}
                    />
                    {addFormErrors.dob && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {addFormErrors.dob}</div>
                    )}
                  </div>
                </div>

                <div className={styles.grid} style={{ marginTop: 14 }}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Age *</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      required
                      style={commonInputStyle}
                      placeholder="e.g. 30"
                      value={newUser.age}
                      onChange={e => handleAgeChange(e.target.value, false)}
                    />
                    {addFormErrors.age && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {addFormErrors.age}</div>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Blood Group *</label>
                    <input
                      type="text"
                      list="blood-group-suggestions"
                      required
                      style={commonInputStyle}
                      placeholder="e.g. O+, A+, B-"
                      value={newUser.blood_group}
                      onChange={e => setNewUser({...newUser, blood_group: e.target.value})}
                    />
                    {addFormErrors.blood_group && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {addFormErrors.blood_group}</div>
                    )}
                    <datalist id="blood-group-suggestions">
                      <option value="A+" />
                      <option value="A-" />
                      <option value="B+" />
                      <option value="B-" />
                      <option value="AB+" />
                      <option value="AB-" />
                      <option value="O+" />
                      <option value="O-" />
                    </datalist>
                  </div>
                </div>

                <div className={styles.grid} style={{ marginTop: 14 }}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Emergency Contact</label>
                    <input
                      type="text"
                      style={commonInputStyle}
                      placeholder="e.g. Relative Name: 9876543210"
                      value={newUser.emergency_contact}
                      onChange={e => setNewUser({...newUser, emergency_contact: e.target.value})}
                    />
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Status *</label>
                    <select
                      required
                      style={commonInputStyle}
                      value={newUser.status}
                      onChange={e => setNewUser({...newUser, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className={styles.field} style={{ marginTop: 14 }}>
                  <label style={{ color: '#475569' }}>Residential Address *</label>
                  <input
                    type="text"
                    required
                    style={commonInputStyle}
                    placeholder="e.g. 123 Main Street, Suite 400"
                    value={newUser.address}
                    onChange={e => setNewUser({...newUser, address: e.target.value})}
                  />
                  {addFormErrors.address && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {addFormErrors.address}</div>
                  )}
                </div>

                <div className={styles.grid} style={{ marginTop: 14 }}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Username *</label>
                    <input 
                      type="text" 
                      required 
                      style={commonInputStyle}
                      placeholder="login_id" 
                      value={newUser.username}
                      onChange={e => setNewUser({...newUser, username: e.target.value})}
                      onBlur={() => checkFieldAvailability('username', newUser.username, false)}
                    />
                    {(newUser.username.trim() || addFormErrors.username) && (addAvailability.username.message || addFormErrors.username) && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: (addAvailability.username.available && !addFormErrors.username) ? '#059669' : '#dc2626' }}>
                        {addFormErrors.username ? `✕ ${addFormErrors.username}` : addAvailability.username.message}
                      </div>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Password *</label>
                    <input 
                      type="password" 
                      required 
                      style={commonInputStyle}
                      placeholder="••••••••" 
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                    {addFormErrors.password && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {addFormErrors.password}</div>
                    )}
                  </div>
                </div>

                {newUserDefaultPerms.length > 0 && (
                  <small style={{ color: '#0284c7', fontSize: 11, marginTop: 10, display: 'block', fontWeight: 500 }}>
                    ✅ {newUserDefaultPerms.length} default module permissions will be auto-applied for {newUser.role}.
                  </small>
                )}
              </div>

              {/* Dynamic Sections 2 & 3: Professional Info & Documents */}
              {renderRoleSpecificFields(newUser, setNewUser, 'add', addFormErrors)}

              <div className={styles.modalActions} style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button 
                  type="submit" 
                  className={styles.saveBtn} 
                  disabled={isSubmitting || !addAvailability.username.available || (!!newUser.email.trim() && !addAvailability.email.available) || !addAvailability.phone.available} 
                  style={{ 
                    padding: '10px 24px', borderRadius: 10, border: 'none', 
                    background: (!addAvailability.username.available || (!!newUser.email.trim() && !addAvailability.email.available) || !addAvailability.phone.available) ? '#94a3b8' : '#10b981', 
                    color: '#ffffff', fontWeight: 600, 
                    cursor: (isSubmitting || !addAvailability.username.available || (!!newUser.email.trim() && !addAvailability.email.available) || !addAvailability.phone.available) ? 'not-allowed' : 'pointer', 
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    opacity: (isSubmitting || !addAvailability.username.available || (!!newUser.email.trim() && !addAvailability.email.available) || !addAvailability.phone.available) ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal (Project Theme Dark Gradient Header) */}
      {showEditProfile && (
        <div className={styles.overlay} style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 9000 }}>
          <div className={styles.modal} style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '18px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', padding: 0, zIndex: 9001 }}>
            <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg, #0b132b 0%, #0f172a 40%, #0f4674 85%, #0284c7 100%)', borderTopLeftRadius: '18px', borderTopRightRadius: '18px', borderBottom: '1px solid rgba(14, 165, 233, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.3px' }}>Edit Staff Profile</h2>
                <p style={{ margin: '6px 0 0 0', color: '#bae6fd', fontSize: '0.88rem', fontWeight: '400' }}>Update account information, salary, role details, and qualification certificates.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfile(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '700',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginLeft: '12px',
                  flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.85)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                title="Close Modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSave} className={styles.form} style={{ padding: '24px' }}>
              {/* Section 1: Account & Personal Information */}
              <div style={{ padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>👤</span>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Account & Personal Details
                  </h3>
                </div>

                <div className={styles.grid}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      style={commonInputStyle}
                      placeholder="e.g. John Doe" 
                      value={editUserForm.name}
                      onChange={e => setEditUserForm({...editUserForm, name: e.target.value})}
                    />
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Staff Role *</label>
                    <select 
                      style={commonInputStyle}
                      value={editUserForm.role}
                      onChange={e => handleRoleChange(e.target.value, true)}
                    >
                      {availableRoles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.grid} style={{ marginTop: 14 }}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Phone Number *</label>
                    <input 
                      type="text" 
                      required
                      style={commonInputStyle}
                      placeholder="Mobile number" 
                      value={editUserForm.phone}
                      onChange={e => setEditUserForm({...editUserForm, phone: e.target.value})}
                      onBlur={() => checkFieldAvailability('phone', editUserForm.phone, true)}
                    />
                    {(editUserForm.phone.trim() || editFormErrors.phone) && (editAvailability.phone.message || editFormErrors.phone) && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: (editAvailability.phone.available && !editFormErrors.phone) ? '#059669' : '#dc2626' }}>
                        {editFormErrors.phone ? `✕ ${editFormErrors.phone}` : editAvailability.phone.message}
                      </div>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Email Address</label>
                    <input 
                      type="email" 
                      style={commonInputStyle}
                      placeholder="e.g. john@clinic.com" 
                      value={editUserForm.email}
                      onChange={e => setEditUserForm({...editUserForm, email: e.target.value})}
                      onBlur={() => checkFieldAvailability('email', editUserForm.email, true)}
                    />
                    {(editUserForm.email.trim() || editFormErrors.email) && (editAvailability.email.message || editFormErrors.email) && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: (editAvailability.email.available && !editFormErrors.email) ? '#059669' : '#dc2626' }}>
                        {editFormErrors.email ? `✕ ${editFormErrors.email}` : editAvailability.email.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.grid} style={{ marginTop: 14 }}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Gender *</label>
                    <select
                      required
                      style={commonInputStyle}
                      value={editUserForm.gender}
                      onChange={e => setEditUserForm({...editUserForm, gender: e.target.value})}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {editFormErrors.gender && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {editFormErrors.gender}</div>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Date of Birth (DOB) *</label>
                    <input
                      type="date"
                      required
                      style={commonInputStyle}
                      value={editUserForm.dob}
                      onChange={e => handleDobChange(e.target.value, true)}
                    />
                    {editFormErrors.dob && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {editFormErrors.dob}</div>
                    )}
                  </div>
                </div>

                <div className={styles.grid} style={{ marginTop: 14 }}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Age *</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      required
                      style={commonInputStyle}
                      placeholder="e.g. 30"
                      value={editUserForm.age}
                      onChange={e => handleAgeChange(e.target.value, true)}
                    />
                    {editFormErrors.age && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {editFormErrors.age}</div>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Blood Group *</label>
                    <input
                      type="text"
                      list="blood-group-suggestions"
                      required
                      style={commonInputStyle}
                      placeholder="e.g. O+, A+, B-"
                      value={editUserForm.blood_group}
                      onChange={e => setEditUserForm({...editUserForm, blood_group: e.target.value})}
                    />
                    {editFormErrors.blood_group && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {editFormErrors.blood_group}</div>
                    )}
                  </div>
                </div>

                <div className={styles.grid} style={{ marginTop: 14 }}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Emergency Contact</label>
                    <input
                      type="text"
                      style={commonInputStyle}
                      placeholder="e.g. Spouse / Relative Phone"
                      value={editUserForm.emergency_contact}
                      onChange={e => setEditUserForm({...editUserForm, emergency_contact: e.target.value})}
                    />
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Status *</label>
                    <select
                      required
                      style={commonInputStyle}
                      value={editUserForm.status}
                      onChange={e => setEditUserForm({...editUserForm, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className={styles.field} style={{ marginTop: 14 }}>
                  <label style={{ color: '#475569' }}>Residential Address *</label>
                  <input
                    type="text"
                    required
                    style={commonInputStyle}
                    placeholder="e.g. 123 Main Street, Suite 400"
                    value={editUserForm.address}
                    onChange={e => setEditUserForm({...editUserForm, address: e.target.value})}
                  />
                  {editFormErrors.address && (
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: '#dc2626' }}>✕ {editFormErrors.address}</div>
                  )}
                </div>

                <div className={styles.grid} style={{ marginTop: 14 }}>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Username *</label>
                    <input 
                      type="text" 
                      required 
                      style={commonInputStyle}
                      placeholder="login_id" 
                      value={editUserForm.username}
                      onChange={e => setEditUserForm({...editUserForm, username: e.target.value})}
                      onBlur={() => checkFieldAvailability('username', editUserForm.username, true)}
                    />
                    {(editUserForm.username.trim() || editFormErrors.username) && (editAvailability.username.message || editFormErrors.username) && (
                      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: (editAvailability.username.available && !editFormErrors.username) ? '#059669' : '#dc2626' }}>
                        {editFormErrors.username ? `✕ ${editFormErrors.username}` : editAvailability.username.message}
                      </div>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label style={{ color: '#475569' }}>Password <span style={{ fontSize: 11, color: '#94a3b8' }}>(Leave blank to keep unchanged)</span></label>
                    <input 
                      type="password" 
                      style={commonInputStyle}
                      placeholder="••••••••" 
                      value={editUserForm.password}
                      onChange={e => setEditUserForm({...editUserForm, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Sections 2 & 3: Professional Info & Documents */}
              {renderRoleSpecificFields(editUserForm, setEditUserForm, 'edit', editFormErrors)}

              <div className={styles.modalActions} style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setShowEditProfile(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button 
                  type="submit" 
                  className={styles.saveBtn} 
                  disabled={isSubmitting || !editAvailability.username.available || (!!editUserForm.email.trim() && !editAvailability.email.available) || !editAvailability.phone.available} 
                  style={{ 
                    padding: '10px 24px', borderRadius: 10, border: 'none', 
                    background: (!editAvailability.username.available || (!!editUserForm.email.trim() && !editAvailability.email.available) || !editAvailability.phone.available) ? '#94a3b8' : '#3b82f6', 
                    color: '#ffffff', fontWeight: 600, 
                    cursor: (isSubmitting || !editAvailability.username.available || (!!editUserForm.email.trim() && !editAvailability.email.available) || !editAvailability.phone.available) ? 'not-allowed' : 'pointer', 
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                    opacity: (isSubmitting || !editAvailability.username.available || (!!editUserForm.email.trim() && !editAvailability.email.available) || !editAvailability.phone.available) ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Control Modal (Project Theme Dark Gradient Header) */}
      {editingStaff && (
        <div className={styles.overlay} style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 9000 }}>
          <div className={styles.modal} style={{ maxWidth: '640px', borderRadius: '18px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', padding: 0, zIndex: 9001 }}>
            <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg, #0b132b 0%, #0f172a 40%, #064e3b 85%, #059669 100%)', borderTopLeftRadius: '18px', borderTopRightRadius: '18px', borderBottom: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.35rem', fontWeight: '700', letterSpacing: '-0.3px' }}>Manage Access Permissions</h2>
              <p style={{ color: '#a7f3d0', margin: '6px 0 0 0', fontSize: '0.88rem', fontWeight: '400' }}>Tailor access permissions for {editingStaff.name} ({editingStaff.role})</p>
            </div>
            
            <div style={{ padding: '24px 28px', maxHeight: '50vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {allModules.map(mod => (
                  <label key={mod.id} style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                    background: tempPermissions.includes(mod.id) ? '#eff6ff' : '#f8fafc', 
                    border: `1px solid ${tempPermissions.includes(mod.id) ? '#93c5fd' : '#e2e8f0'}`,
                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={tempPermissions.includes(mod.id)}
                      onChange={() => handleTogglePermission(mod.id)}
                      style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: tempPermissions.includes(mod.id) ? '600' : '500', color: tempPermissions.includes(mod.id) ? '#1d4ed8' : '#334155', fontSize: 13 }}>
                      {mod.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ padding: '18px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc', borderBottomLeftRadius: '18px', borderBottomRightRadius: '18px' }}>
              <button 
                onClick={() => setEditingStaff(null)}
                style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={savePermissions} 
                style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Notification Portal (Always appears ABOVE modals) */}
      <NotificationPopup toast={toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
    </div>
  )
}
