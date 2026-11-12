import React, { useState, useEffect, useCallback } from 'react'
import { API_BASE, getHeaders, getStoredUser } from '../utils/api'
import { useBranch } from '../context/BranchContext'
import styles from './CompanyManagement.module.css'

export default function CompanyManagement() {
  const { activeCompany, switchCompany, fetchCompanies } = useBranch()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, ACTIVE, INACTIVE
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Modals state
  const [modalMode, setModalMode] = useState(null) // 'CREATE', 'EDIT', 'VIEW', 'DELETE'
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    registration_number: '',
    tax_number: '',
    is_active: true
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ message: '', type: '' }) // type: 'success' | 'error'


  // Super Admin validation
  const authUser = getStoredUser()
  const isSuper = authUser?.is_superuser === true || authUser?.role === 'Super Admin'

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '', type: '' }), 4500)
  }

  // Load companies
  const loadCompanies = useCallback(async () => {
    if (!isSuper) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      let url = `${API_BASE}/companies/?page=${page}&page_size=10`
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`
      if (statusFilter === 'ACTIVE') url += `&is_active=true`
      if (statusFilter === 'INACTIVE') url += `&is_active=false`

      const res = await fetch(url, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (data.results) {
          setCompanies(data.results)
          setTotalCount(data.count || 0)
          setTotalPages(data.total_pages || 1)
        } else if (Array.isArray(data)) {
          setCompanies(data)
          setTotalCount(data.length)
          setTotalPages(1)
        }
      } else {
        showToast('Failed to load companies from server.', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Network error while loading companies.', 'error')
    } finally {
      setLoading(false)
    }
  }, [isSuper, page, search, statusFilter])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      code: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      registration_number: '',
      tax_number: '',
      is_active: true
    })
    setFormErrors({})
    setModalMode('CREATE')
  }

  // Open Edit Modal
  const handleOpenEdit = (comp) => {
    setSelectedCompany(comp)
    setFormData({
      name: comp.name || '',
      code: comp.code || '',
      contact_person: comp.contact_person || '',
      phone: comp.phone || '',
      email: comp.email || '',
      address: comp.address || '',
      registration_number: comp.registration_number || '',
      tax_number: comp.tax_number || '',
      is_active: comp.is_active !== false
    })
    setFormErrors({})
    setModalMode('EDIT')
  }

  // Open View Modal
  const handleOpenView = (comp) => {
    setSelectedCompany(comp)
    setModalMode('VIEW')
  }

  // Open Delete Modal
  const handleOpenDelete = (comp) => {
    setSelectedCompany(comp)
    setModalMode('DELETE')
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Company Name is required.'
    if (!formData.code.trim()) errors.code = 'Company Code is required.'
    else if (!/^[A-Za-z0-9_-]+$/.test(formData.code.trim())) {
      errors.code = 'Code must contain only letters, numbers, hyphens or underscores.'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Form Submit (Create / Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const isEdit = modalMode === 'EDIT'
      const url = isEdit ? `${API_BASE}/companies/${selectedCompany.id}/` : `${API_BASE}/companies/`
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (res.ok) {
        showToast(isEdit ? `Company '${data.name}' updated successfully.` : `Company '${data.name}' registered successfully!`, 'success')
        setModalMode(null)
        loadCompanies()
        fetchCompanies() // refresh global sidebar context
      } else {
        const msg = data.code || data.name || data.error || data.detail || 'Validation failed.'
        showToast(Array.isArray(msg) ? msg[0] : String(msg), 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Network error while saving company.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle active status (Activate / Deactivate)
  const handleToggleStatus = async (comp) => {
    const newStatus = !comp.is_active
    try {
      const res = await fetch(`${API_BASE}/companies/${comp.id}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ is_active: newStatus })
      })
      if (res.ok) {
        showToast(`Company '${comp.name}' is now ${newStatus ? 'Active' : 'Deactivated'}.`, 'success')
        loadCompanies()
        fetchCompanies()
      } else {
        showToast('Failed to update status.', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Network error.', 'error')
    }
  }

  // Confirm Permanent Delete
  const handleConfirmDelete = async () => {
    if (!selectedCompany) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/companies/${selectedCompany.id}/`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || `Company '${selectedCompany.name}' permanently deleted.`, 'success')
        setModalMode(null)
        loadCompanies()
        fetchCompanies()
        // If the deleted company was currently active, clear selection
        if (activeCompany && String(activeCompany.id) === String(selectedCompany.id)) {
          switchCompany(null)
        }
      } else {
        showToast(data.message || data.error || 'Cannot delete company.', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Network error while deleting company.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Access check
  if (!isSuper) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBanner}>
          <strong>Access Denied:</strong> Only users with the <code>Super Admin</code> role are authorized to access Company Management.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Toast Notifications */}
      {toast.message && (
        <div className={toast.type === 'error' ? styles.errorBanner : styles.successBanner}>
          {toast.message}
        </div>
      )}

      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1>
            Company Management
            <span className={styles.badgeSuper}>Super Admin</span>
          </h1>
          <p>Register, configure, and isolate multi-clinic dental companies across the platform.</p>
        </div>
        <button className={styles.createBtn} onClick={handleOpenCreate}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Register Company
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by company name, code, contact or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div className={styles.statusTabs}>
          <button
            type="button"
            className={`${styles.statusTab} ${statusFilter === 'ALL' ? styles.statusTabActive : ''}`}
            onClick={() => { setStatusFilter('ALL'); setPage(1) }}
          >
            All Companies ({totalCount})
          </button>
          <button
            type="button"
            className={`${styles.statusTab} ${statusFilter === 'ACTIVE' ? styles.statusTabActive : ''}`}
            onClick={() => { setStatusFilter('ACTIVE'); setPage(1) }}
          >
            Active
          </button>
          <button
            type="button"
            className={`${styles.statusTab} ${statusFilter === 'INACTIVE' ? styles.statusTabActive : ''}`}
            onClick={() => { setStatusFilter('INACTIVE'); setPage(1) }}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Company Listing Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Code / ID</th>
              <th>Contact Person</th>
              <th>Phone & Email</th>
              <th>Registration Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px' }}>
                  Loading companies...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🏢</span>
                    <p>No companies found matching the filter criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              companies.map((comp) => {
                const isSelected = activeCompany && String(activeCompany.id) === String(comp.id)
                return (
                  <tr key={comp.id}>
                    <td>
                      <div className={styles.companyNameWrap}>
                        <div className={styles.companyAvatar}>
                          {comp.name ? comp.name.substring(0, 2).toUpperCase() : 'CO'}
                        </div>
                        <div>
                          <span className={styles.companyMainName}>{comp.name}</span>
                          <span className={styles.companySub}>{comp.address || 'Address not set'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.codeBadge}>{comp.code}</span>
                    </td>
                    <td>
                      <strong>{comp.contact_person || '—'}</strong>
                    </td>
                    <td>
                      <div>{comp.phone || '—'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{comp.email || '—'}</div>
                    </td>
                    <td>
                      {comp.created_at ? new Date(comp.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {comp.is_active ? (
                        <span className={styles.activeBadge}>● Active</span>
                      ) : (
                        <span className={styles.inactiveBadge}>○ Inactive</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionCell} style={{ justifyContent: 'flex-end', gap: '8px' }}>
                        {/* 1-Click Select as Working Context */}
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${isSelected ? styles.actionBtnSelect : ''}`}
                          onClick={() => switchCompany(comp)}
                          title="Set as active working company in dashboard"
                        >
                          {isSelected ? '✓ Active' : 'Select'}
                        </button>

                        {/* View Icon */}
                        <button
                          type="button"
                          className={`${styles.actionIconBtn} ${styles.actionIconBtnView}`}
                          onClick={() => handleOpenView(comp)}
                          title="View Company Details"
                          aria-label="View Details"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>

                        {/* Edit Icon */}
                        <button
                          type="button"
                          className={`${styles.actionIconBtn} ${styles.actionIconBtnEdit}`}
                          onClick={() => handleOpenEdit(comp)}
                          title="Edit Company"
                          aria-label="Edit Company"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        {/* Delete Icon */}
                        <button
                          type="button"
                          className={`${styles.actionIconBtn} ${styles.actionIconBtnDelete}`}
                          onClick={() => handleOpenDelete(comp)}
                          title="Delete Company"
                          aria-label="Delete Company"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Page {page} of {totalPages} ({totalCount} total companies)
            </span>
            <div className={styles.pageBtns}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  className={`${styles.pageBtn} ${page === pNum ? styles.pageBtnActive : ''}`}
                  onClick={() => setPage(pNum)}
                >
                  {pNum}
                </button>
              ))}
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT COMPANY
          ═══════════════════════════════════════════════════════════════ */}
      {(modalMode === 'CREATE' || modalMode === 'EDIT') && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{modalMode === 'CREATE' ? 'Register New Company' : `Edit Company: ${selectedCompany?.name}`}</h2>
              <button className={styles.modalClose} onClick={() => setModalMode(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmitForm}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroupFull}>
                    <label>Company Legal / Clinic Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Apollo Dental Care Pvt Ltd"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    {formErrors.name && <span style={{ color: '#dc2626', fontSize: 12 }}>{formErrors.name}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Unique Company Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. APOLLO_HQ"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />
                    {formErrors.code && <span style={{ color: '#dc2626', fontSize: 12 }}>{formErrors.code}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Contact Person / Medical Director</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Ramesh Kumar"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Primary Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Official Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. admin@apollodental.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {formErrors.email && <span style={{ color: '#dc2626', fontSize: 12 }}>{formErrors.email}</span>}
                  </div>

                  <div className={styles.formGroupFull}>
                    <label>Headquarters / Registered Address</label>
                    <textarea
                      rows="2"
                      placeholder="Full street address, city, state and pincode"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Registration / License Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. CLINIC-REG-2026-908"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tax / GSTIN Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      value={formData.tax_number}
                      onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label>Operational Status</label>
                    <select
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    >
                      <option value="true">Active (Clinics and staff operational)</option>
                      <option value="false">Inactive / Paused</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={submitting}>
                  {submitting ? 'Saving...' : modalMode === 'CREATE' ? 'Register Company' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: VIEW COMPANY DETAILS
          ═══════════════════════════════════════════════════════════════ */}
      {modalMode === 'VIEW' && selectedCompany && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>Company Details: {selectedCompany.name}</h2>
              <button className={styles.modalClose} onClick={() => setModalMode(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Company Code</label>
                  <p className={styles.codeBadge} style={{ display: 'inline-block' }}>{selectedCompany.code}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <p>
                    {selectedCompany.is_active ? (
                      <span className={styles.activeBadge}>● Active</span>
                    ) : (
                      <span className={styles.inactiveBadge}>○ Inactive</span>
                    )}
                  </p>
                </div>
                <div className={styles.formGroup}>
                  <label>Contact Person</label>
                  <p><strong>{selectedCompany.contact_person || 'Not specified'}</strong></p>
                </div>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <p>{selectedCompany.phone || '—'}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <p>{selectedCompany.email || '—'}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>Branches Configured</label>
                  <p><span className={styles.branchPill}>🏛️ {selectedCompany.branch_count || 1} Branches</span></p>
                </div>
                <div className={styles.formGroupFull}>
                  <label>Address</label>
                  <p>{selectedCompany.address || 'Address not recorded.'}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>Registration Number</label>
                  <p>{selectedCompany.registration_number || '—'}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>Tax / GST Number</label>
                  <p>{selectedCompany.tax_number || '—'}</p>
                </div>
                <div className={styles.formGroupFull}>
                  <label>Registered Date</label>
                  <p>{selectedCompany.created_at ? new Date(selectedCompany.created_at).toLocaleString() : '—'}</p>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={() => {
                  switchCompany(selectedCompany)
                  showToast(`Active working company switched to '${selectedCompany.name}'.`, 'success')
                  setModalMode(null)
                }}
              >
                Set as Active Working Company
              </button>
              <button type="button" className={styles.btnCancel} onClick={() => setModalMode(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: DELETE COMPANY CONFIRMATION
          ═══════════════════════════════════════════════════════════════ */}
      {modalMode === 'DELETE' && selectedCompany && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '480px' }}>
            <div className={styles.modalHeader}>
              <h2 style={{ color: '#dc2626' }}>Delete Company</h2>
              <button className={styles.modalClose} onClick={() => setModalMode(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {selectedCompany.code === 'ASHDENT' ? (
                <div className={styles.warningCard} style={{ borderColor: '#ef4444', background: '#fef2f2' }}>
                  <div className={styles.warningCardTitle} style={{ color: '#991b1b' }}>
                    🛡️ Protected Primary Company
                  </div>
                  <div className={styles.warningCardText} style={{ color: '#7f1d1d' }}>
                    The primary system company <strong>AshDent Healthcare (ASHDENT)</strong> is permanently protected and cannot be deleted.
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    background: '#fef2f2',
                    color: '#ef4444',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '24px'
                  }}>
                    🗑️
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                    Permanently Delete {selectedCompany.name}?
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 14px' }}>
                    Are you sure you want to delete company <strong>{selectedCompany.name} ({selectedCompany.code})</strong>?
                    All associated records, patients, and clinical data for this company will be permanently removed.
                  </p>
                  <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600, background: '#fef2f2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    ⚠️ This action is irreversible and cannot be undone.
                  </div>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={() => setModalMode(null)}>
                Cancel
              </button>
              {selectedCompany.code !== 'ASHDENT' && (
                <button
                  type="button"
                  className={styles.btnDanger}
                  disabled={submitting}
                  onClick={handleConfirmDelete}
                >
                  {submitting ? 'Deleting...' : 'Delete Company'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

