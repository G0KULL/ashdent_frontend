import { useState, useEffect } from 'react'
import styles from './Pharmacy.module.css'

const API = 'http://127.0.0.1:8000/api'

export default function StaffOnboardingWizard({ onClose, onSuccess, showToast, existingUsers = [] }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  
  // Custom permissions flag to track if user manually touched permissions
  const [hasCustomPermissions, setHasCustomPermissions] = useState(false)
  const [pendingRoleChange, setPendingRoleChange] = useState(null)

  // Step 1 State: Basic & Employment & Role Details
  const savedUserStr = localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user')
  const authUser = savedUserStr ? JSON.parse(savedUserStr) : null
  const isSuperAdmin = authUser?.is_superuser === true

  const [basicData, setBasicData] = useState({
    name: '',
    phone: '',
    email: '',
    emergency_contact: '',
    gender: 'Male',
    dob: '',
    age: '',
    blood_group: 'O+',
    address: '',
    pincode: '',
    city: '',
    state: '',
    country: 'India',
    status: 'Active',
    
    // Employment
    role: 'Doctor',
    staff_level: 'Senior',
    joining_date: new Date().toISOString().split('T')[0],
    base_salary: 0,
    
    // Login
    username: '',
    password: '',
    confirm_password: '',
    
    // Role-specific additional details
    qualification: '',
    specialization: 'General Dentistry',
    license_no: '',
    registration_council: '',
    experience_years: '0',
    consultation_fee: '500',
    previous_workplace: '',
    assistant_certification: '',
    designation: ''
  })

  // Step 2 State: Leave, Benefits, Insurance
  const [leaveConfigs, setLeaveConfigs] = useState([
    { leave_type: 'Casual Leave', annual_entitlement: 12, is_paid: true, allow_carry_forward: true, max_carry_forward: 6, status: 'Active' },
    { leave_type: 'Paid Leave', annual_entitlement: 15, is_paid: true, allow_carry_forward: true, max_carry_forward: 5, status: 'Active' },
    { leave_type: 'Unpaid Leave', annual_entitlement: 30, is_paid: false, allow_carry_forward: false, max_carry_forward: 0, status: 'Active' }
  ])

  const [benefits, setBenefits] = useState([
    { benefit_name: 'Health Benefit', benefit_type: 'Allowance', amount: 2000, description: 'Medical expenses cover', status: 'Active' },
    { benefit_name: 'Transport Benefit', benefit_type: 'Allowance', amount: 1000, description: 'Travel allowance', status: 'Active' }
  ])

  const [insurance, setInsurance] = useState({
    is_enabled: true,
    provider: '',
    policy_number: '',
    policy_type: 'Health Insurance',
    coverage_amount: 500000,
    employee_contribution: 1000,
    employer_contribution: 3000,
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    status: 'Active',
    notes: ''
  })

  // Step 3 State: Permissions
  const [permissions, setPermissions] = useState([])

  // Age <-> DOB helpers
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

  const handleDobChange = (dobVal) => {
    const computedAge = calcAgeFromDob(dobVal)
    setBasicData(prev => ({
      ...prev,
      dob: dobVal,
      age: computedAge !== '' ? computedAge : prev.age
    }))
    if (fieldErrors.dob || fieldErrors.age) {
      setFieldErrors(prev => ({ ...prev, dob: null, age: null }))
    }
  }

  const handleAgeChange = (ageVal) => {
    const computedDob = calcDobFromAge(ageVal, basicData.dob)
    setBasicData(prev => ({
      ...prev,
      age: ageVal,
      dob: computedDob || prev.dob
    }))
    if (fieldErrors.age || fieldErrors.dob) {
      setFieldErrors(prev => ({ ...prev, age: null, dob: null }))
    }
  }

  // Load default permissions for role
  const loadRoleDefaultPermissions = async (roleName) => {
    try {
      const res = await fetch(`${API}/settings/role-defaults/${encodeURIComponent(roleName)}/`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.default_permissions) {
          setPermissions(data.default_permissions)
          return
        }
      }
    } catch (e) {
      console.warn("Could not load backend role defaults, using fallback matrix:", e)
    }

    // Fallback role matrix
    const defaults = {
      Doctor: ['add-patients', 'appointments', 'today-patients', 'search-patient', 'follow-ups', 'pre-bookings', 'prescriptions', 'tele-medicine'],
      Pharmacist: ['pharmacy', 'stock', 'purchases', 'prescriptions', 'search-patient'],
      Accountant: ['income-analytics', 'expense-manager', 'billing', 'purchases', 'search-patient'],
      'Dental Assistant': ['add-patients', 'appointments', 'today-patients', 'prescriptions', 'search-patient'],
      Receptionist: ['add-patients', 'appointments', 'today-patients', 'search-patient', 'follow-ups', 'pre-bookings', 'communication', 'website-appointment'],
      Admin: ['income-analytics', 'expense-manager', 'billing', 'pharmacy', 'stock', 'prescriptions', 'lab', 'users', 'add-patients', 'appointments', 'today-patients', 'search-patient', 'follow-ups', 'pre-bookings', 'communication', 'tele-medicine', 'website-appointment', 'purchases', 'doctors', 'settings', 'pathology-lab', 'dental-lab']
    }
    setPermissions(defaults[roleName] || defaults['Receptionist'])
  }

  // Initial load of role defaults
  useEffect(() => {
    loadRoleDefaultPermissions(basicData.role)
  }, [])

  // Role change logic with confirmation if permissions customized
  const handleRoleSelect = (newRole) => {
    if (newRole === basicData.role) return
    if (hasCustomPermissions) {
      setPendingRoleChange(newRole)
    } else {
      setBasicData(prev => ({ ...prev, role: newRole }))
      loadRoleDefaultPermissions(newRole)
    }
  }

  const confirmRoleChange = () => {
    if (pendingRoleChange) {
      setBasicData(prev => ({ ...prev, role: pendingRoleChange }))
      loadRoleDefaultPermissions(pendingRoleChange)
      setHasCustomPermissions(false)
      setPendingRoleChange(null)
    }
  }

  const cancelRoleChange = () => {
    setPendingRoleChange(null)
  }

  // Permission toggles
  const handleTogglePermission = (permId) => {
    setHasCustomPermissions(true)
    if (permissions.includes(permId)) {
      setPermissions(permissions.filter(p => p !== permId))
    } else {
      setPermissions([...permissions, permId])
    }
  }

  // Available Permission Modules
  const permissionModules = [
    {
      group: 'PATIENTS & RECEPTION',
      items: [
        { id: 'add-patients', label: 'Add & Edit Patients' },
        { id: 'today-patients', label: 'View Today Patients' },
        { id: 'search-patient', label: 'Search Patient Records' },
        { id: 'follow-ups', label: 'Manage Follow-ups' },
        { id: 'pre-bookings', label: 'Manage Pre-Bookings' },
        { id: 'communication', label: 'Communication & SMS Logs' }
      ]
    },
    {
      group: 'APPOINTMENTS & SCHEDULING',
      items: [
        { id: 'appointments', label: 'View & Manage Appointments' },
        { id: 'tele-medicine', label: 'Tele-Medicine Consultations' },
        { id: 'website-appointment', label: 'Online Website Bookings' }
      ]
    },
    {
      group: 'CLINICAL & DOCTORS',
      items: [
        { id: 'prescriptions', label: 'Clinical Notes & Prescriptions' },
        { id: 'doctors', label: 'Doctor Schedule & Roster' }
      ]
    },
    {
      group: 'BILLING & FINANCE',
      items: [
        { id: 'billing', label: 'Patient Billing & Payments' },
        { id: 'income-analytics', label: 'Financial Reports & Income' },
        { id: 'expense-manager', label: 'Expense Manager & Salaries' }
      ]
    },
    {
      group: 'PHARMACY & INVENTORY',
      items: [
        { id: 'pharmacy', label: 'Pharmacy Billing & Queue' },
        { id: 'stock', label: 'Inventory & Medicine Stock' },
        { id: 'purchases', label: 'Supplier Purchases & Orders' }
      ]
    },
    {
      group: 'LABORATORY & PATHOLOGY',
      items: [
        { id: 'pathology-lab', label: 'Pathology Lab Orders' },
        { id: 'dental-lab', label: 'Dental Lab Work Orders' }
      ]
    },
    {
      group: 'ADMINISTRATION & SETTINGS',
      items: [
        { id: 'users', label: 'Staff Management & Permissions' },
        { id: 'settings', label: 'Clinic & Master Settings' }
      ]
    }
  ]

  // Password Real-Time Handlers
  const handlePasswordChange = (val) => {
    setBasicData(prev => ({ ...prev, password: val }))
    setFieldErrors(prev => {
      const updated = { ...prev }
      if (!val) {
        updated.password = 'Password is required.'
      } else {
        delete updated.password
      }

      // Revalidate confirm_password immediately
      if (basicData.confirm_password) {
        if (!val) {
          // Confirm password is entered, but password is empty (Scenario D)
          delete updated.confirm_password
        } else if (val !== basicData.confirm_password) {
          updated.confirm_password = 'Passwords do not match.'
        } else {
          delete updated.confirm_password
        }
      } else if (val && updated.confirm_password) {
        updated.confirm_password = 'Please confirm your password.'
      }
      return updated
    })
  }

  const handleConfirmPasswordChange = (val) => {
    setBasicData(prev => ({ ...prev, confirm_password: val }))
    setFieldErrors(prev => {
      const updated = { ...prev }
      if (!val) {
        if (basicData.password) {
          updated.confirm_password = 'Please confirm your password.'
        } else {
          delete updated.confirm_password
        }
      } else if (basicData.password) {
        if (val !== basicData.password) {
          updated.confirm_password = 'Passwords do not match.'
        } else {
          delete updated.confirm_password
        }
      } else {
        // Confirm password entered, but password is empty (Scenario D)
        updated.password = 'Password is required.'
        delete updated.confirm_password
      }
      return updated
    })
  }

  // Step 1 Field Validation
  const validateStep1 = () => {
    const errs = {}
    if (!basicData.name.trim()) errs.name = 'Full Name is required.'
    if (!basicData.role.trim()) errs.role = 'Staff Role is required.'
    if (!basicData.staff_level.trim()) errs.staff_level = 'Staff Level is required.'
    if (!basicData.phone.trim()) errs.phone = 'Phone Number is required.'
    if (!basicData.gender) errs.gender = 'Gender is required.'
    if (!basicData.dob) errs.dob = 'Date of Birth is required.'
    if (basicData.age === '' || basicData.age === null) errs.age = 'Age is required.'
    if (!basicData.blood_group) errs.blood_group = 'Blood Group is required.'
    if (!basicData.status) errs.status = 'Status is required.'
    if (!basicData.address.trim()) errs.address = 'Residential Address is required.'
    if (!basicData.username.trim()) errs.username = 'Username is required.'
    
    // Password validation
    if (!basicData.password) {
      errs.password = 'Password is required.'
    }
    if (!basicData.confirm_password) {
      if (basicData.password) {
        errs.confirm_password = 'Please confirm your password.'
      }
    } else if (basicData.password && basicData.password !== basicData.confirm_password) {
      errs.confirm_password = 'Passwords do not match.'
    }

    // Optional email validation
    if (basicData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(basicData.email.trim())) {
        errs.email = 'Please enter a valid email address.'
      }
    }

    // Optional pincode validation (6 digits numeric)
    if (basicData.pincode.trim()) {
      if (!/^\d{6}$/.test(basicData.pincode.trim())) {
        errs.pincode = 'Pincode must be exactly 6 numeric digits.'
      }
    }

    // Role specific required validation
    const r = basicData.role
    if (r === 'Doctor') {
      if (!basicData.qualification.trim()) errs.qualification = 'Qualification is required.'
      if (!basicData.specialization.trim()) errs.specialization = 'Specialization is required.'
      if (!basicData.license_no.trim()) errs.license_no = 'Dental Registration Number is required.'
      if (!basicData.registration_council.trim()) errs.registration_council = 'Registration Council is required.'
      if (basicData.consultation_fee === '' || parseFloat(basicData.consultation_fee) < 0) {
        errs.consultation_fee = 'Valid Consultation Fee is required.'
      }
    } else if (r === 'Receptionist') {
      if (!basicData.qualification.trim()) errs.qualification = 'Highest Qualification is required.'
    } else if (r === 'Pharmacist') {
      if (!basicData.qualification.trim()) errs.qualification = 'Qualification is required.'
      if (!basicData.license_no.trim()) errs.license_no = 'Pharmacy Registration Number is required.'
      if (!basicData.registration_council.trim()) errs.registration_council = 'Registration Council is required.'
    } else if (r === 'Dental Assistant' || r === 'Assistant') {
      if (!basicData.qualification.trim()) errs.qualification = 'Qualification is required.'
    } else {
      if (!basicData.designation.trim()) errs.designation = 'Designation / Title is required.'
    }

    if (basicData.experience_years === '' || isNaN(basicData.experience_years) || parseInt(basicData.experience_years, 10) < 0) {
      errs.experience_years = 'Years of Experience must be 0 or greater.'
    }

    // Unique checks against existing frontend users list
    const lowerUsername = basicData.username.trim().toLowerCase()
    if (lowerUsername && existingUsers.some(u => u.username && u.username.trim().toLowerCase() === lowerUsername)) {
      errs.username = 'Username already exists. Please choose another.'
    }

    const cleanPhone = basicData.phone.replace(/\D/g, '')
    if (cleanPhone && existingUsers.some(u => u.phone && u.phone.replace(/\D/g, '') === cleanPhone)) {
      errs.phone = 'Phone number is already registered.'
    }

    const lowerEmail = basicData.email.trim().toLowerCase()
    if (lowerEmail && existingUsers.some(u => u.email && u.email.trim().toLowerCase() === lowerEmail)) {
      errs.email = 'Email address is already registered.'
    }

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Step 2 Field Validation
  const validateStep2 = () => {
    const errs = {}
    leaveConfigs.forEach((l, i) => {
      if (l.annual_entitlement === '' || parseFloat(l.annual_entitlement) < 0) {
        errs[`leave_${i}`] = 'Entitlement cannot be negative.'
      }
    })
    if (insurance.is_enabled) {
      if (insurance.coverage_amount !== '' && parseFloat(insurance.coverage_amount) < 0) {
        errs.coverage_amount = 'Coverage amount cannot be negative.'
      }
      if (insurance.employee_contribution !== '' && parseFloat(insurance.employee_contribution) < 0) {
        errs.employee_contribution = 'Employee contribution cannot be negative.'
      }
      if (insurance.employer_contribution !== '' && parseFloat(insurance.employer_contribution) < 0) {
        errs.employer_contribution = 'Employer contribution cannot be negative.'
      }
      if (insurance.start_date && insurance.expiry_date && insurance.expiry_date < insurance.start_date) {
        errs.expiry_date = 'Expiry date cannot be before start date.'
      }
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNextStep = () => {
    setServerError('')
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2)
      else showToast('Please fix highlighted errors in Step 1.', 'error')
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3)
      else showToast('Please fix highlighted errors in Step 2.', 'error')
    } else if (currentStep === 3) {
      setCurrentStep(4)
    }
  }

  const handlePrevStep = () => {
    setServerError('')
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    setServerError('')

    // Re-verify Step 1 & 2
    if (!validateStep1()) {
      setIsSubmitting(false)
      setCurrentStep(1)
      showToast('Validation failed. Please review Step 1 entries.', 'error')
      return
    }
    if (!validateStep2()) {
      setIsSubmitting(false)
      setCurrentStep(2)
      showToast('Validation failed. Please review Step 2 entries.', 'error')
      return
    }

    const payload = {
      basic_details: {
        name: basicData.name.trim(),
        phone: basicData.phone.trim(),
        email: basicData.email.trim(),
        emergency_contact: basicData.emergency_contact.trim(),
        gender: basicData.gender,
        dob: basicData.dob,
        age: parseInt(basicData.age, 10),
        blood_group: basicData.blood_group,
        address: basicData.address.trim(),
        pincode: basicData.pincode.trim(),
        city: basicData.city.trim(),
        state: basicData.state.trim(),
        country: basicData.country.trim(),
        status: basicData.status
      },
      employment: {
        role: basicData.role,
        staff_level: basicData.staff_level,
        joining_date: basicData.joining_date,
        base_salary: parseFloat(basicData.base_salary) || 0,
        additional_details: {
          qualification: basicData.qualification.trim(),
          specialization: basicData.specialization.trim(),
          license_no: basicData.license_no.trim(),
          registration_council: basicData.registration_council.trim(),
          experience_years: parseInt(basicData.experience_years, 10) || 0,
          consultation_fee: parseFloat(basicData.consultation_fee) || 0,
          previous_workplace: basicData.previous_workplace.trim(),
          assistant_certification: basicData.assistant_certification.trim(),
          designation: basicData.designation.trim()
        }
      },
      login: {
        username: basicData.username.trim().toLowerCase(),
        password: basicData.password,
        confirm_password: basicData.confirm_password
      },
      leave_configs: leaveConfigs,
      benefits: benefits.filter(b => b.benefit_name.trim() !== ''),
      insurance: insurance,
      permissions: permissions
    }

    try {
      const res = await fetch(`${API}/staff/onboarding/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': authUser?.id || authUser?.username || '',
          'X-Username': authUser?.username || '',
          'X-User-Role': authUser?.role || ''
        },
        body: JSON.stringify(payload)
      })

      const resData = await res.json()
      if (res.ok && resData.success !== false) {
        showToast('✓ Staff onboarding completed successfully!', 'success')
        onSuccess()
        onClose()
      } else {
        const errMsg = resData.error || (resData.errors ? 'Please fix the highlighted errors.' : 'Staff creation failed.')
        setServerError(errMsg)
        if (resData.errors) {
          setFieldErrors(resData.errors)
          const step1Keys = [
            'name', 'phone', 'email', 'emergency_contact', 'gender', 'dob', 'age',
            'blood_group', 'status', 'address', 'pincode', 'city', 'state', 'country',
            'username', 'password', 'confirm_password', 'role', 'staff_level',
            'qualification', 'specialization', 'license_no', 'registration_council',
            'consultation_fee', 'experience_years', 'designation'
          ]
          if (Object.keys(resData.errors).some(k => step1Keys.includes(k))) {
            setCurrentStep(1)
          } else {
            const step2Keys = ['coverage_amount', 'employee_contribution', 'employer_contribution', 'expiry_date']
            if (Object.keys(resData.errors).some(k => step2Keys.includes(k) || k.startsWith('leave_'))) {
              setCurrentStep(2)
            }
          }
        }
        showToast(errMsg, 'error')
      }
    } catch (e) {
      console.error(e)
      setServerError('Network connection error while submitting wizard.')
      showToast('Network error while communicating with server.', 'error')
    }
    setIsSubmitting(false)
  }

  // Styles definition
  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#ffffff',
    color: '#1e293b'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '5px'
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '1120px',
        height: '90vh',
        maxHeight: '820px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* WIZARD HEADER */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.3px' }}>
              Staff Onboarding Wizard
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Complete staff details, benefits, leave policy, and role access permissions
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#ffffff',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ✕
          </button>
        </div>

        {/* WIZARD BODY (LEFT STEPS NAV + RIGHT STEP CONTENT) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT SIDEBAR: STEP INDICATOR */}
          <div style={{
            width: '260px',
            background: '#f8fafc',
            borderRight: '1px solid #e2e8f0',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {[
              { id: 1, title: 'Basic Details', subtitle: 'Personal & Role details' },
              { id: 2, title: 'Benefits & Insurance', subtitle: 'Leave, perks & coverage' },
              { id: 3, title: 'Permissions', subtitle: 'Module access rights' },
              { id: 4, title: 'Review & Create', subtitle: 'Summary & confirmation' }
            ].map(step => {
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              return (
                <div
                  key={step.id}
                  onClick={() => {
                    if (isCompleted) setCurrentStep(step.id)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: isActive ? '#ffffff' : 'transparent',
                    border: isActive ? '1.5px solid #2563eb' : '1.5px solid transparent',
                    boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'none',
                    cursor: isCompleted ? 'pointer' : 'default',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isCompleted ? '#10b981' : (isActive ? '#2563eb' : '#e2e8f0'),
                    color: isCompleted || isActive ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '13px',
                    flexShrink: 0
                  }}>
                    {isCompleted ? '✓' : step.id}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: isActive ? '700' : '600',
                      color: isActive ? '#1e293b' : (isCompleted ? '#0f172a' : '#64748b')
                    }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {step.subtitle}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* RIGHT STEP CONTENT AREA */}
          <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', background: '#ffffff' }}>
            {serverError && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                fontSize: '13px',
                marginBottom: '20px',
                fontWeight: '600'
              }}>
                ❌ {serverError}
              </div>
            )}

            {/* STEP 1: BASIC DETAILS */}
            {currentStep === 1 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>
                  Step 1 — Basic Employee Information
                </h3>

                {/* Section 1: Personal Info */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    1. Personal Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        value={basicData.name}
                        onChange={e => setBasicData({ ...basicData, name: e.target.value })}
                      />
                      {fieldErrors.name && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.name}</span>}
                    </div>

                    <div>
                      <label style={labelStyle}>Gender *</label>
                      <select
                        style={inputStyle}
                        value={basicData.gender}
                        onChange={e => setBasicData({ ...basicData, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {fieldErrors.gender && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.gender}</span>}
                    </div>

                    <div>
                      <label style={labelStyle}>Date of Birth *</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={basicData.dob}
                        onChange={e => handleDobChange(e.target.value)}
                      />
                      {fieldErrors.dob && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.dob}</span>}
                    </div>

                    <div>
                      <label style={labelStyle}>Age *</label>
                      <input
                        type="number"
                        min="18"
                        max="100"
                        style={inputStyle}
                        placeholder="e.g. 32"
                        value={basicData.age}
                        onChange={e => handleAgeChange(e.target.value)}
                      />
                      {fieldErrors.age && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.age}</span>}
                    </div>

                    <div>
                      <label style={labelStyle}>Blood Group *</label>
                      <select
                        style={inputStyle}
                        value={basicData.blood_group}
                        onChange={e => setBasicData({ ...basicData, blood_group: e.target.value })}
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                      {fieldErrors.blood_group && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.blood_group}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact Info */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    2. Contact Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Phone Number *</label>
                      <input
                        type="tel"
                        style={inputStyle}
                        placeholder="e.g. 9876543210"
                        value={basicData.phone}
                        onChange={e => setBasicData({ ...basicData, phone: e.target.value })}
                      />
                      {fieldErrors.phone && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.phone}</span>}
                    </div>

                    <div>
                      <label style={labelStyle}>Email Address <span style={{ fontSize: '11px', color: '#94a3b8' }}>(Optional)</span></label>
                      <input
                        type="email"
                        style={inputStyle}
                        placeholder="e.g. rajesh@example.com"
                        value={basicData.email}
                        onChange={e => setBasicData({ ...basicData, email: e.target.value })}
                      />
                      {fieldErrors.email && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.email}</span>}
                    </div>

                    <div>
                      <label style={labelStyle}>Emergency Contact <span style={{ fontSize: '11px', color: '#94a3b8' }}>(Optional)</span></label>
                      <input
                        type="tel"
                        style={inputStyle}
                        placeholder="e.g. 9123456789"
                        value={basicData.emergency_contact}
                        onChange={e => setBasicData({ ...basicData, emergency_contact: e.target.value })}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Residential Address *</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="e.g. 102 Green Park Main Road"
                        value={basicData.address}
                        onChange={e => setBasicData({ ...basicData, address: e.target.value })}
                      />
                      {fieldErrors.address && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.address}</span>}
                    </div>

                    <div>
                      <label style={labelStyle}>Pincode <span style={{ fontSize: '11px', color: '#94a3b8' }}>(6 Digits)</span></label>
                      <input
                        type="text"
                        maxLength="6"
                        style={inputStyle}
                        placeholder="e.g. 110016"
                        value={basicData.pincode}
                        onChange={e => setBasicData({ ...basicData, pincode: e.target.value })}
                      />
                      {fieldErrors.pincode && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.pincode}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 3: Employment Info & Role Selection */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    3. Employment Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Staff Role *</label>
                      <select
                        style={inputStyle}
                        value={basicData.role}
                        onChange={e => handleRoleSelect(e.target.value)}
                      >
                        <option value="Doctor">Doctor</option>
                        <option value="Receptionist">Receptionist</option>
                        <option value="Pharmacist">Pharmacist</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Dental Assistant">Dental Assistant</option>
                        {isSuperAdmin && <option value="Admin">Admin</option>}
                      </select>
                      {fieldErrors.role && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.role}</span>}
                    </div>

                    <div>
                      <label style={labelStyle}>Staff Level *</label>
                      <select
                        style={inputStyle}
                        value={basicData.staff_level}
                        onChange={e => setBasicData({ ...basicData, staff_level: e.target.value })}
                      >
                        <option value="Senior">Senior</option>
                        <option value="Junior">Junior</option>
                        <option value="Trainee">Trainee</option>
                        <option value="Intern">Intern</option>
                        <option value="Consultant">Consultant</option>
                        <option value="Other">Other</option>
                      </select>
                      {fieldErrors.staff_level && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.staff_level}</span>}
                    </div>

                    <div>
                      <label style={labelStyle}>Account Status *</label>
                      <select
                        style={inputStyle}
                        value={basicData.status}
                        onChange={e => setBasicData({ ...basicData, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Joining Date</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={basicData.joining_date}
                        onChange={e => setBasicData({ ...basicData, joining_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Base Salary (₹)</label>
                      <input
                        type="number"
                        min="0"
                        style={inputStyle}
                        placeholder="e.g. 50000"
                        value={basicData.base_salary}
                        onChange={e => setBasicData({ ...basicData, base_salary: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Role-Specific Professional Information */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    4. Professional Information ({basicData.role})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    {basicData.role === 'Doctor' && (
                      <>
                        <div>
                          <label style={labelStyle}>Qualification *</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="e.g. BDS, MDS (Orthodontics)"
                            value={basicData.qualification}
                            onChange={e => setBasicData({ ...basicData, qualification: e.target.value })}
                          />
                          {fieldErrors.qualification && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.qualification}</span>}
                        </div>
                        <div>
                          <label style={labelStyle}>Specialization *</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="e.g. General Dentistry"
                            value={basicData.specialization}
                            onChange={e => setBasicData({ ...basicData, specialization: e.target.value })}
                          />
                          {fieldErrors.specialization && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.specialization}</span>}
                        </div>
                        <div>
                          <label style={labelStyle}>Dental Registration Number *</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="e.g. DENT-REG-5541"
                            value={basicData.license_no}
                            onChange={e => setBasicData({ ...basicData, license_no: e.target.value })}
                          />
                          {fieldErrors.license_no && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.license_no}</span>}
                        </div>
                        <div>
                          <label style={labelStyle}>Registration Council *</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="e.g. State Dental Council"
                            value={basicData.registration_council}
                            onChange={e => setBasicData({ ...basicData, registration_council: e.target.value })}
                          />
                          {fieldErrors.registration_council && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.registration_council}</span>}
                        </div>
                        <div>
                          <label style={labelStyle}>Consultation Fee (₹) *</label>
                          <input
                            type="number"
                            min="0"
                            style={inputStyle}
                            placeholder="e.g. 500"
                            value={basicData.consultation_fee}
                            onChange={e => setBasicData({ ...basicData, consultation_fee: e.target.value })}
                          />
                          {fieldErrors.consultation_fee && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.consultation_fee}</span>}
                        </div>
                      </>
                    )}

                    {basicData.role === 'Pharmacist' && (
                      <>
                        <div>
                          <label style={labelStyle}>Qualification *</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="e.g. B.Pharm / D.Pharm"
                            value={basicData.qualification}
                            onChange={e => setBasicData({ ...basicData, qualification: e.target.value })}
                          />
                          {fieldErrors.qualification && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.qualification}</span>}
                        </div>
                        <div>
                          <label style={labelStyle}>Pharmacy Registration Number *</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="e.g. PHARM-LIC-8812"
                            value={basicData.license_no}
                            onChange={e => setBasicData({ ...basicData, license_no: e.target.value })}
                          />
                          {fieldErrors.license_no && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.license_no}</span>}
                        </div>
                        <div>
                          <label style={labelStyle}>Registration Council *</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="e.g. Pharmacy Council of India"
                            value={basicData.registration_council}
                            onChange={e => setBasicData({ ...basicData, registration_council: e.target.value })}
                          />
                          {fieldErrors.registration_council && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.registration_council}</span>}
                        </div>
                      </>
                    )}

                    {(basicData.role === 'Dental Assistant' || basicData.role === 'Assistant' || basicData.role === 'Receptionist') && (
                      <>
                        <div>
                          <label style={labelStyle}>Highest Qualification *</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="e.g. Diploma in Dental Hygiene / Bachelor's"
                            value={basicData.qualification}
                            onChange={e => setBasicData({ ...basicData, qualification: e.target.value })}
                          />
                          {fieldErrors.qualification && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.qualification}</span>}
                        </div>
                      </>
                    )}

                    {basicData.role !== 'Doctor' && basicData.role !== 'Pharmacist' && basicData.role !== 'Dental Assistant' && basicData.role !== 'Assistant' && basicData.role !== 'Receptionist' && (
                      <div>
                        <label style={labelStyle}>Designation / Title *</label>
                        <input
                          type="text"
                          style={inputStyle}
                          placeholder="e.g. Operations Manager"
                          value={basicData.designation}
                          onChange={e => setBasicData({ ...basicData, designation: e.target.value })}
                        />
                        {fieldErrors.designation && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.designation}</span>}
                      </div>
                    )}

                    <div>
                      <label style={labelStyle}>Years of Experience *</label>
                      <input
                        type="number"
                        min="0"
                        style={inputStyle}
                        placeholder="e.g. 5"
                        value={basicData.experience_years}
                        onChange={e => setBasicData({ ...basicData, experience_years: e.target.value })}
                      />
                      {fieldErrors.experience_years && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.experience_years}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 5: Login Info */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    5. Login Account Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Username *</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="e.g. dr_rajesh"
                        value={basicData.username}
                        onChange={e => setBasicData({ ...basicData, username: e.target.value })}
                      />
                      {fieldErrors.username && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.username}</span>}
                    </div>

                    <div>
                      <label style={labelStyle}>Password *</label>
                      <input
                        type="password"
                        style={inputStyle}
                        placeholder="••••••••"
                        value={basicData.password}
                        onChange={e => handlePasswordChange(e.target.value)}
                      />
                      {fieldErrors.password && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.password}</span>}
                    </div>

                    <div>
                      <label style={labelStyle}>Confirm Password *</label>
                      <input
                        type="password"
                        style={inputStyle}
                        placeholder="••••••••"
                        value={basicData.confirm_password}
                        onChange={e => handleConfirmPasswordChange(e.target.value)}
                      />
                      {fieldErrors.confirm_password && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.confirm_password}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: BENEFITS & INSURANCE */}
            {currentStep === 2 && (
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>
                  Step 2 — Benefits, Leave & Insurance
                </h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                  Configure employee leave entitlements, compensation allowances, and medical insurance coverage.
                </p>

                {/* SECTION A: LEAVE CONFIGURATION */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Section A — Configurable Leave Policy
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {leaveConfigs.map((leave, idx) => (
                      <div key={idx} style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', marginBottom: '10px' }}>
                          {leave.leave_type}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Annual Entitlement (Days)</label>
                            <input
                              type="number"
                              min="0"
                              style={inputStyle}
                              value={leave.annual_entitlement}
                              onChange={e => {
                                const updated = [...leaveConfigs]
                                updated[idx].annual_entitlement = e.target.value
                                setLeaveConfigs(updated)
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#475569' }}>Paid Leave:</span>
                            <input
                              type="checkbox"
                              checked={leave.is_paid}
                              onChange={e => {
                                const updated = [...leaveConfigs]
                                updated[idx].is_paid = e.target.checked
                                setLeaveConfigs(updated)
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#475569' }}>Allow Carry Forward:</span>
                            <input
                              type="checkbox"
                              checked={leave.allow_carry_forward}
                              onChange={e => {
                                const updated = [...leaveConfigs]
                                updated[idx].allow_carry_forward = e.target.checked
                                setLeaveConfigs(updated)
                              }}
                            />
                          </div>

                          {leave.allow_carry_forward && (
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Max Carry Forward (Days)</label>
                              <input
                                type="number"
                                min="0"
                                style={inputStyle}
                                value={leave.max_carry_forward}
                                onChange={e => {
                                  const updated = [...leaveConfigs]
                                  updated[idx].max_carry_forward = e.target.value
                                  setLeaveConfigs(updated)
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION B: BENEFITS & ALLOWANCES */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Section B — Employee Benefits & Allowances
                    </div>
                    <button
                      type="button"
                      onClick={() => setBenefits([...benefits, { benefit_name: '', benefit_type: 'Allowance', amount: 0, description: '', status: 'Active' }])}
                      style={{
                        padding: '6px 12px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Benefit
                    </button>
                  </div>

                  {benefits.map((b, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 3fr 40px', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="Benefit Name (e.g. Health Allowance)"
                        value={b.benefit_name}
                        onChange={e => {
                          const updated = [...benefits]
                          updated[idx].benefit_name = e.target.value
                          setBenefits(updated)
                        }}
                      />
                      <select
                        style={inputStyle}
                        value={b.benefit_type}
                        onChange={e => {
                          const updated = [...benefits]
                          updated[idx].benefit_type = e.target.value
                          setBenefits(updated)
                        }}
                      >
                        <option value="Allowance">Allowance</option>
                        <option value="Bonus">Bonus</option>
                        <option value="Health">Health</option>
                        <option value="Transport">Transport</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        style={inputStyle}
                        placeholder="Amount (₹)"
                        value={b.amount}
                        onChange={e => {
                          const updated = [...benefits]
                          updated[idx].amount = e.target.value
                          setBenefits(updated)
                        }}
                      />
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="Description (Optional)"
                        value={b.description}
                        onChange={e => {
                          const updated = [...benefits]
                          updated[idx].description = e.target.value
                          setBenefits(updated)
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setBenefits(benefits.filter((_, i) => i !== idx))}
                        style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* SECTION C: INSURANCE CONFIGURATION */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Section C — Medical Insurance Configuration
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                      <input
                        type="checkbox"
                        checked={insurance.is_enabled}
                        onChange={e => setInsurance({ ...insurance, is_enabled: e.target.checked })}
                      />
                      Enable Insurance Policy
                    </label>
                  </div>

                  {insurance.is_enabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                      <div>
                        <label style={labelStyle}>Insurance Provider</label>
                        <input
                          type="text"
                          style={inputStyle}
                          placeholder="e.g. HDFC ERGO / Star Health"
                          value={insurance.provider}
                          onChange={e => setInsurance({ ...insurance, provider: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Policy Number</label>
                        <input
                          type="text"
                          style={inputStyle}
                          placeholder="e.g. POL-2026-9901"
                          value={insurance.policy_number}
                          onChange={e => setInsurance({ ...insurance, policy_number: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Policy Type</label>
                        <input
                          type="text"
                          style={inputStyle}
                          placeholder="e.g. Group Health Insurance"
                          value={insurance.policy_type}
                          onChange={e => setInsurance({ ...insurance, policy_type: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Coverage Amount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          style={inputStyle}
                          placeholder="e.g. 500000"
                          value={insurance.coverage_amount}
                          onChange={e => setInsurance({ ...insurance, coverage_amount: e.target.value })}
                        />
                        {fieldErrors.coverage_amount && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.coverage_amount}</span>}
                      </div>

                      <div>
                        <label style={labelStyle}>Employee Contribution (₹/mo)</label>
                        <input
                          type="number"
                          min="0"
                          style={inputStyle}
                          placeholder="e.g. 1000"
                          value={insurance.employee_contribution}
                          onChange={e => setInsurance({ ...insurance, employee_contribution: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Employer Contribution (₹/mo)</label>
                        <input
                          type="number"
                          min="0"
                          style={inputStyle}
                          placeholder="e.g. 3000"
                          value={insurance.employer_contribution}
                          onChange={e => setInsurance({ ...insurance, employer_contribution: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Policy Start Date</label>
                        <input
                          type="date"
                          style={inputStyle}
                          value={insurance.start_date}
                          onChange={e => setInsurance({ ...insurance, start_date: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Policy Expiry Date</label>
                        <input
                          type="date"
                          style={inputStyle}
                          value={insurance.expiry_date}
                          onChange={e => setInsurance({ ...insurance, expiry_date: e.target.value })}
                        />
                        {fieldErrors.expiry_date && <span style={{ color: '#dc2626', fontSize: '11px' }}>{fieldErrors.expiry_date}</span>}
                      </div>

                      <div>
                        <label style={labelStyle}>Notes / Details</label>
                        <input
                          type="text"
                          style={inputStyle}
                          placeholder="e.g. Cashless hospitalization enabled"
                          value={insurance.notes}
                          onChange={e => setInsurance({ ...insurance, notes: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: PERMISSIONS */}
            {currentStep === 3 && (
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>
                  Step 3 — Role-Based Access Permissions
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                  Pre-selected default permissions for <strong>{basicData.role}</strong>. You can check/uncheck module features to customize access for this specific staff member.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {permissionModules.map((modGroup, i) => (
                    <div key={i} style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {modGroup.group}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {modGroup.items.map(item => {
                          const isChecked = permissions.includes(item.id)
                          return (
                            <label
                              key={item.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: isChecked ? '#eff6ff' : '#ffffff',
                                border: isChecked ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: isChecked ? '600' : '400',
                                color: isChecked ? '#1e40af' : '#475569'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(item.id)}
                              />
                              {item.label}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CREATE */}
            {currentStep === 4 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>
                  Step 4 — Review & Final Creation
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Card 1: Personal & Login Info */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Basic Details & Login</span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        style={{ padding: '4px 10px', background: '#e2e8f0', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        [Edit]
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px', color: '#475569' }}>
                      <div><strong>Full Name:</strong> {basicData.name}</div>
                      <div><strong>Gender / Age:</strong> {basicData.gender}, {basicData.age} yrs</div>
                      <div><strong>Blood Group:</strong> {basicData.blood_group}</div>
                      <div><strong>Phone:</strong> {basicData.phone}</div>
                      <div><strong>Email:</strong> {basicData.email || 'N/A'}</div>
                      <div><strong>Emergency Contact:</strong> {basicData.emergency_contact || 'N/A'}</div>
                      <div><strong>Address:</strong> {basicData.address} {basicData.pincode ? `(${basicData.pincode})` : ''}</div>
                      <div><strong>Role / Level:</strong> {basicData.role} ({basicData.staff_level})</div>
                      <div><strong>Username:</strong> {basicData.username}</div>
                    </div>
                  </div>

                  {/* Card 2: Professional Information */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Professional Information</span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        style={{ padding: '4px 10px', background: '#e2e8f0', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        [Edit]
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px', color: '#475569' }}>
                      {basicData.qualification && <div><strong>Qualification:</strong> {basicData.qualification}</div>}
                      {basicData.specialization && <div><strong>Specialization:</strong> {basicData.specialization}</div>}
                      {basicData.license_no && <div><strong>Registration #:</strong> {basicData.license_no}</div>}
                      {basicData.registration_council && <div><strong>Council:</strong> {basicData.registration_council}</div>}
                      {basicData.consultation_fee && <div><strong>Consultation Fee:</strong> ₹{basicData.consultation_fee}</div>}
                      <div><strong>Experience:</strong> {basicData.experience_years} years</div>
                      {basicData.designation && <div><strong>Designation:</strong> {basicData.designation}</div>}
                    </div>
                  </div>

                  {/* Card 3: Benefits, Leave & Insurance */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Benefits, Leave & Insurance</span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        style={{ padding: '4px 10px', background: '#e2e8f0', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        [Edit]
                      </button>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <strong>Leave Entitlements:</strong>{' '}
                        {leaveConfigs.map(l => `${l.leave_type} (${l.annual_entitlement}d)`).join(', ')}
                      </div>
                      <div>
                        <strong>Benefits Configured:</strong>{' '}
                        {benefits.filter(b => b.benefit_name).map(b => `${b.benefit_name} (₹${b.amount})`).join(', ') || 'None'}
                      </div>
                      <div>
                        <strong>Insurance Policy:</strong>{' '}
                        {insurance.is_enabled ? `${insurance.provider || 'Enabled'} - Cover ₹${insurance.coverage_amount} (Policy: ${insurance.policy_number || 'Pending'})` : 'Disabled'}
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Granted Permissions */}
                  <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Granted Module Permissions</span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        style={{ padding: '4px 10px', background: '#e2e8f0', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        [Edit]
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {permissions.map(p => (
                        <span key={p} style={{ padding: '3px 8px', borderRadius: '4px', background: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: '600' }}>
                          ✓ {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WIZARD FOOTER CONTROLS */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isSubmitting}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: currentStep === 1 ? '#e2e8f0' : '#ffffff',
              border: '1px solid #cbd5e1',
              color: currentStep === 1 ? '#94a3b8' : '#334155',
              fontSize: '13px',
              fontWeight: '600',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Back
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: '#2563eb',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              style={{
                padding: '10px 28px',
                borderRadius: '8px',
                background: '#10b981',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                cursor: isSubmitting ? 'wait' : 'pointer',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? 'Creating Staff Account...' : '✓ Create Staff Member'}
            </button>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR ROLE CHANGE PERMISSION RESET */}
      {pendingRoleChange && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#0f172a' }}>
              Confirm Role Change
            </h4>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
              Changing the staff role to <strong>{pendingRoleChange}</strong> will reset custom permissions to default. Continue?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={cancelRoleChange}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRoleChange}
                style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#ffffff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Apply New Role Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
