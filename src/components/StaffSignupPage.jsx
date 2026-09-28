import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './StaffSignupPage.module.css'

const API = 'http://127.0.0.1:8000/api'

export default function StaffSignupPage() {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('doctosmart_user')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { return null }
    }
    return null
  })

  // Stepper: 1: Role -> 2: Personal & Company -> 3: Professional -> 4: Credentials -> 5: Review -> 6: Success
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState([])
  const [successData, setSuccessData] = useState(null)

  // Roles Configuration
  const rolesList = [
    {
      id: 'Doctor',
      title: 'Doctor',
      description: 'Manage consultations, clinical records, diagnosis, treatment plans and prescriptions.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49 0 2.87.47 4 1.26V8c0-1.1-.9-2-2-2h-4V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v3H7c-1.1 0-2 .9-2 2v8.26c1.13-.79 2.51-1.26 4-1.26h10z" />
          <path d="M12 11v4" /><path d="M10 13h4" />
          <path d="M19 16v6" /><path d="M16 19h6" />
        </svg>
      )
    },
    {
      id: 'Dental Assistant',
      title: 'Dental Assistant',
      description: 'Support dentists with patient preparation, clinical assistance and treatment workflow.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      )
    },
    {
      id: 'Pharmacist',
      title: 'Pharmacist',
      description: 'Manage prescriptions, medicines, dispensing and pharmacy operations.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
      )
    },
    {
      id: 'Accountant',
      title: 'Accountant',
      description: 'Manage billing, payments, dues, financial records and reports.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
          <path d="M6 15h2" /><path d="M12 15h4" />
        </svg>
      )
    },
    {
      id: 'Admin',
      title: 'Admin',
      description: 'Manage clinic operations, staff, appointments, settings and administrative workflows.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    }
  ]

  // Form State
  const initialFormData = {
    role: 'Doctor',
    company_id: currentUser?.company_id || '',
    is_super_admin: false,
    
    // Personal
    first_name: '',
    last_name: '',
    gender: 'Male',
    dob: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',

    // Credentials
    username: '',
    password: '',
    confirm_password: '',
    is_active: true,

    // Professional / Doctor / Assistant / Pharmacist / Accountant / Admin
    employee_id: '',
    qualification: '',
    specialization: 'General Dentistry',
    registration_number: '',
    medical_council: 'Dental Council of India',
    years_of_experience: 1,
    joining_date: new Date().toISOString().split('T')[0],
    consultation_fee: 500,
    followup_fee: 200,
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    working_hours: '09:00 AM - 06:00 PM',
    break_time: '01:00 PM - 02:00 PM',
    appointment_duration: 30,
    bio: '',
    department: 'General',
    emergency_contact: '',
    base_salary: 0,
    incentive: 0
  }

  const [formData, setFormData] = useState(initialFormData)

  const isSuperAdmin = currentUser?.is_super_admin || currentUser?.role === 'Super Admin'

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API}/companies/`, {
        headers: { 'X-User-Id': currentUser?.id || '' }
      })
      if (res.ok) {
        const data = await res.json()
        setCompanies(data)
        if (data.length > 0 && !formData.company_id) {
          setFormData(prev => ({ ...prev, company_id: data[0].id }))
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (error) setError('')
  }

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const exists = prev.working_days.includes(day)
      const updated = exists
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day]
      return { ...prev, working_days: updated }
    })
  }

  const validateStep = (step) => {
    setError('')
    if (step === 1) {
      if (!formData.role) {
        setError('Please select a staff role.')
        return false
      }
    } else if (step === 2) {
      if (!formData.first_name.trim()) {
        setError('First name is required.')
        return false
      }
      if (!formData.last_name.trim()) {
        setError('Last name is required.')
        return false
      }
      if (!formData.phone.trim()) {
        setError('Mobile number is required.')
        return false
      }
      if (!formData.email.trim()) {
        setError('Email address is required.')
        return false
      }
      if (isSuperAdmin && !formData.company_id && companies.length > 0) {
        setError('Please select a company.')
        return false
      }
    } else if (step === 3) {
      if (formData.role === 'Doctor' && !formData.specialization) {
        setError('Specialization is required for Doctor role.')
        return false
      }
    } else if (step === 4) {
      if (!formData.username.trim()) {
        setError('Username is required.')
        return false
      }
      if (!formData.password) {
        setError('Password is required.')
        return false
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.')
        return false
      }
      if (formData.password !== formData.confirm_password) {
        setError('Password and Confirm Password do not match.')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!validateStep(4)) return

    setLoading(true)
    setError('')

    try {
      const payload = {
        ...formData,
        name: `${formData.first_name} ${formData.last_name}`.strip ? `${formData.first_name} ${formData.last_name}`.trim() : `${formData.first_name} ${formData.last_name}`,
        auth_user_id: currentUser?.id
      }

      const res = await fetch(`${API}/staff/onboard/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.status === 'success') {
        setSuccessData(data.staff)
        setCurrentStep(6)
      } else {
        setError(data.error || data.detail || 'Failed to onboard staff. Please try again.')
      }
    } catch (err) {
      setError('Connection error. Please check your backend server.')
    }
    setLoading(false)
  }

  const handleResetForm = () => {
    setFormData(initialFormData)
    setSuccessData(null)
    setCurrentStep(1)
    setError('')
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dentalSpecializations = [
    'General Dentistry', 'Orthodontics', 'Endodontics', 'Prosthodontics',
    'Periodontics', 'Oral Surgery', 'Pediatric Dentistry', 'Oral Medicine',
    'Implantology', 'Other'
  ]

  const selectedCompanyName = companies.find(c => String(c.id) === String(formData.company_id))?.name || currentUser?.company_name || 'Main Clinic'

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.wrapper}>
        
        {/* Top Header Card */}
        <div className={styles.headerCard}>
          <div className={styles.headerTitleGroup}>
            <h1>Staff Onboarding</h1>
            <p>Create and onboard staff members to your dental clinic with role-based access.</p>
          </div>
          <button className={styles.backBtn} onClick={() => navigate('/admin/users')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Staff Management
          </button>
        </div>

        {/* Stepper Header (Only shown during steps 1-5) */}
        {currentStep <= 5 && (
          <div className={styles.stepper}>
            {[
              { step: 1, label: 'Role' },
              { step: 2, label: 'Personal' },
              { step: 3, label: 'Professional' },
              { step: 4, label: 'Credentials' },
              { step: 5, label: 'Review' },
            ].map((st, idx) => (
              <div key={st.step} style={{ display: 'flex', alignItems: 'center', flex: idx < 4 ? 1 : 'none' }}>
                <div 
                  className={`${styles.stepItem} ${currentStep === st.step ? styles.stepItemActive : currentStep > st.step ? styles.stepItemCompleted : ''}`}
                  onClick={() => { if (st.step < currentStep) setCurrentStep(st.step) }}
                >
                  <div className={styles.stepBubble}>
                    {currentStep > st.step ? '✓' : st.step}
                  </div>
                  <span className={styles.stepLabel}>{st.label}</span>
                </div>
                {idx < 4 && <div className={`${styles.stepLine} ${currentStep > st.step ? styles.stepLineActive : ''}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className={styles.errorAlert}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: ROLE SELECTION */}
        {currentStep === 1 && (
          <div className={styles.formCard}>
            <div className={styles.sectionHeader}>
              <h3>Select Staff Role</h3>
            </div>
            <p style={{ color: 'var(--slate-500)', marginBottom: '1.5rem', fontSize: '0.925rem' }}>
              Choose the primary role for the new staff member. Permissions and fields will automatically adapt based on your selection.
            </p>

            <div className={styles.roleGrid}>
              {rolesList.map(r => (
                <div
                  key={r.id}
                  className={`${styles.roleCard} ${formData.role === r.id ? styles.roleCardSelected : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, role: r.id }))}
                >
                  {formData.role === r.id && (
                    <div className={styles.checkBadge}>✓</div>
                  )}
                  <div className={styles.roleIconWrapper}>
                    {r.icon}
                  </div>
                  <div className={styles.roleTitle}>{r.title}</div>
                  <div className={styles.roleDesc}>{r.description}</div>
                </div>
              ))}
            </div>

            <div className={styles.actionRow} style={{ justifyContent: 'flex-end' }}>
              <button className={styles.primaryBtn} onClick={handleNext}>
                Continue to Personal Information →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PERSONAL & COMPANY INFORMATION */}
        {currentStep === 2 && (
          <div className={styles.formCard}>
            <div className={styles.sectionHeader}>
              <h3>Personal & Company Information</h3>
            </div>

            <div className={styles.formGrid}>
              {/* Company Selection (Readonly for Company Admin, Dropdown for Super Admin) */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Company / Clinic <span className={styles.required}>*</span></label>
                {isSuperAdmin ? (
                  <select name="company_id" value={formData.company_id} onChange={handleChange}>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code || 'MAIN'})</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={selectedCompanyName} disabled />
                )}
              </div>

              <div className={styles.inputGroup}>
                <label>First Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  name="first_name"
                  placeholder="e.g. Rahul"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Last Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  name="last_name"
                  placeholder="e.g. Sharma"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Mobile Number <span className={styles.required}>*</span></label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Email Address <span className={styles.required}>*</span></label>
                <input
                  type="email"
                  name="email"
                  placeholder="rahul@clinic.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Street Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="123 Health Street, Suite 400"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Mumbai"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  placeholder="Maharashtra"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="400001"
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.actionRow}>
              <button className={styles.secondaryBtn} onClick={handleBack}>← Back</button>
              <button className={styles.primaryBtn} onClick={handleNext}>Continue to Professional Info →</button>
            </div>
          </div>
        )}

        {/* STEP 3: ROLE-SPECIFIC PROFESSIONAL DETAILS */}
        {currentStep === 3 && (
          <div className={styles.formCard}>
            <div className={styles.sectionHeader}>
              <h3>{formData.role} Professional Information</h3>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Employee ID</label>
                <input
                  type="text"
                  name="employee_id"
                  placeholder="EMP-1042"
                  value={formData.employee_id}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Joining Date</label>
                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  placeholder={formData.role === 'Doctor' ? 'BDS, MDS (Orthodontics)' : 'B.Pharm / Diploma'}
                  value={formData.qualification}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Years of Experience</label>
                <input
                  type="number"
                  name="years_of_experience"
                  min="0"
                  value={formData.years_of_experience}
                  onChange={handleChange}
                />
              </div>

              {/* DOCTOR SPECIFIC FIELDS */}
              {formData.role === 'Doctor' && (
                <>
                  <div className={styles.inputGroup}>
                    <label>Specialization <span className={styles.required}>*</span></label>
                    <select name="specialization" value={formData.specialization} onChange={handleChange}>
                      {dentalSpecializations.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Dental Registration Number</label>
                    <input
                      type="text"
                      name="registration_number"
                      placeholder="DCI-49821"
                      value={formData.registration_number}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Medical Council Authority</label>
                    <input
                      type="text"
                      name="medical_council"
                      placeholder="Dental Council of India"
                      value={formData.medical_council}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Consultation Fee (₹)</label>
                    <input
                      type="number"
                      name="consultation_fee"
                      value={formData.consultation_fee}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Follow-up Fee (₹)</label>
                    <input
                      type="number"
                      name="followup_fee"
                      value={formData.followup_fee}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Slot Duration (Minutes)</label>
                    <select name="appointment_duration" value={formData.appointment_duration} onChange={handleChange}>
                      <option value="15">15 mins</option>
                      <option value="30">30 mins</option>
                      <option value="45">45 mins</option>
                      <option value="60">60 mins</option>
                    </select>
                  </div>
                </>
              )}

              {/* PHARMACIST SPECIFIC FIELDS */}
              {formData.role === 'Pharmacist' && (
                <div className={styles.inputGroup}>
                  <label>Pharmacy Registration Number</label>
                  <input
                    type="text"
                    name="registration_number"
                    placeholder="PH-88491"
                    value={formData.registration_number}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* ASSISTANT / ACCOUNTANT / ADMIN / PHARMACIST DEPARTMENT & EMERGENCY CONTACT */}
              {(formData.role === 'Dental Assistant' || formData.role === 'Accountant' || formData.role === 'Admin' || formData.role === 'Pharmacist') && (
                <>
                  <div className={styles.inputGroup}>
                    <label>Department</label>
                    <input
                      type="text"
                      name="department"
                      placeholder="General / Billing / Clinical"
                      value={formData.department}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Emergency Contact</label>
                    <input
                      type="tel"
                      name="emergency_contact"
                      placeholder="+91 9123456789"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}

              <div className={styles.inputGroup}>
                <label>Working Hours</label>
                <input
                  type="text"
                  name="working_hours"
                  placeholder="09:00 AM - 06:00 PM"
                  value={formData.working_hours}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Base Salary (₹/month)</label>
                <input
                  type="number"
                  name="base_salary"
                  value={formData.base_salary}
                  onChange={handleChange}
                />
              </div>

              {/* Working Days Checkbox Selector */}
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Working Days</label>
                <div className={styles.checkboxGrid}>
                  {daysOfWeek.map(day => {
                    const isSelected = formData.working_days.includes(day)
                    return (
                      <label key={day} className={`${styles.dayPill} ${isSelected ? styles.dayPillActive : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleDayToggle(day)}
                        />
                        {day.substring(0, 3)}
                      </label>
                    )
                  })}
                </div>
              </div>

              {formData.role === 'Doctor' && (
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Professional Bio</label>
                  <textarea
                    name="bio"
                    rows="3"
                    placeholder="Brief description of experience, certifications, and clinical focus..."
                    value={formData.bio}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <div className={styles.actionRow}>
              <button className={styles.secondaryBtn} onClick={handleBack}>← Back</button>
              <button className={styles.primaryBtn} onClick={handleNext}>Continue to Credentials →</button>
            </div>
          </div>
        )}

        {/* STEP 4: LOGIN CREDENTIALS & ACCOUNT STATUS */}
        {currentStep === 4 && (
          <div className={styles.formCard}>
            <div className={styles.sectionHeader}>
              <h3>Login Credentials & Account Security</h3>
            </div>

            <div className={styles.formGrid}>
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Username / Login ID <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  name="username"
                  placeholder="dr_rahul"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Password <span className={styles.required}>*</span></label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Confirm Password <span className={styles.required}>*</span></label>
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="••••••••"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Account Status</label>
                <select name="is_active" value={formData.is_active} onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}>
                  <option value="true">Active (Can log in immediately)</option>
                  <option value="false">Inactive (Login disabled)</option>
                </select>
              </div>

              {isSuperAdmin && (
                <div className={styles.inputGroup}>
                  <label>Super Admin Rights</label>
                  <select name="is_super_admin" value={formData.is_super_admin} onChange={e => setFormData(prev => ({ ...prev, is_super_admin: e.target.value === 'true' }))}>
                    <option value="false">No (Standard Staff)</option>
                    <option value="true">Yes (Global Super Admin)</option>
                  </select>
                </div>
              )}
            </div>

            <div className={styles.actionRow}>
              <button className={styles.secondaryBtn} onClick={handleBack}>← Back</button>
              <button className={styles.primaryBtn} onClick={handleNext}>Review Information →</button>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW INFORMATION */}
        {currentStep === 5 && (
          <div className={styles.formCard}>
            <div className={styles.sectionHeader}>
              <h3>Review Staff Account Details</h3>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewGrid}>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Staff Role</span>
                  <span className={styles.reviewValue} style={{ color: 'var(--lavender-primary)' }}>{formData.role}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Company</span>
                  <span className={styles.reviewValue}>{selectedCompanyName}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Full Name</span>
                  <span className={styles.reviewValue}>{formData.first_name} {formData.last_name}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Mobile & Email</span>
                  <span className={styles.reviewValue}>{formData.phone} | {formData.email}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Username</span>
                  <span className={styles.reviewValue}>{formData.username}</span>
                </div>
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Employee ID</span>
                  <span className={styles.reviewValue}>{formData.employee_id || 'N/A'}</span>
                </div>
                {formData.role === 'Doctor' && (
                  <>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Specialization</span>
                      <span className={styles.reviewValue}>{formData.specialization}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Consultation Fee</span>
                      <span className={styles.reviewValue}>₹{formData.consultation_fee}</span>
                    </div>
                  </>
                )}
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Account Status</span>
                  <span className={styles.reviewValue}>{formData.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button className={styles.secondaryBtn} onClick={handleBack} disabled={loading}>← Back to Edit</button>
              <button className={styles.primaryBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating Staff Account...' : 'Confirm & Create Account'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: SUCCESS CONFIRMATION */}
        {currentStep === 6 && successData && (
          <div className={styles.successCard}>
            <div className={styles.successIconCircle}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2>Staff Account Created Successfully!</h2>
            <p>The new staff member has been onboarded to your clinic database with the selected role and permissions.</p>

            <div className={styles.successDetailsBox}>
              <div className={styles.reviewItem} style={{ marginBottom: '0.75rem' }}>
                <span className={styles.reviewLabel}>Staff Name</span>
                <span className={styles.reviewValue}>{successData.name}</span>
              </div>
              <div className={styles.reviewItem} style={{ marginBottom: '0.75rem' }}>
                <span className={styles.reviewLabel}>Role & Company</span>
                <span className={styles.reviewValue}>{successData.role} — {successData.company_name || selectedCompanyName}</span>
              </div>
              <div className={styles.reviewItem} style={{ marginBottom: '0.75rem' }}>
                <span className={styles.reviewLabel}>Username</span>
                <span className={styles.reviewValue}>{successData.username}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Account Status</span>
                <span className={styles.reviewValue} style={{ color: successData.is_active ? '#16a34a' : '#dc2626' }}>
                  {successData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button className={styles.secondaryBtn} onClick={handleResetForm}>
                + Onboard Another Staff
              </button>
              <button className={styles.primaryBtn} onClick={() => navigate('/admin/users')}>
                View Staff Management List →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
