import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './InvestigationsSection.module.css';
import { API_BASE, getHeaders } from '../../utils/api';
import { 
  FileText, Plus, Calendar, User, Clock, CheckCircle2, 
  AlertCircle, XCircle, Eye, Download, Trash2, Edit2, 
  UploadCloud, File, Image as ImageIcon, History, X,
  Activity, ArrowRight
} from 'lucide-react';

export default function InvestigationsSection({
  patient = null,
  patientId: propPatientId = null,
  patientName: propPatientName = null,
  appointment = null,
  appointmentId: propAppointmentId = null,
  visit = null,
  visitId: propVisitId = null,
  doctor = null,
  doctorId: propDoctorId = null,
  doctorName: propDoctorName = null,
  readOnly = false,
  showHistoryByDefault = false
}) {
  const [activeTab, setActiveTab] = useState(showHistoryByDefault ? 'history' : 'current');
  const [investigations, setInvestigations] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [masters, setMasters] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingAttachments, setEditingAttachments] = useState([]);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patient_id: '',
    investigation_master_id: '',
    investigation_name: '',
    investigation_date: new Date().toISOString().split('T')[0],
    doctor_id: '',
    status: 'Requested',
    reason: '',
    findings: '',
    remarks: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Derived patient & appointment IDs
  const resolvedPatientId = useMemo(() => {
    if (propPatientId && propPatientId !== 'new') return String(propPatientId);
    if (patient) {
      if (typeof patient === 'string' && patient !== 'new') return patient;
      if (patient.id) return String(patient.id);
      if (patient._id) return String(patient._id);
      if (patient.patient_id) return String(patient.patient_id);
      if (patient.pk) return String(patient.pk);
    }
    return '';
  }, [propPatientId, patient]);

  const resolvedPatientName = useMemo(() => {
    if (propPatientName) return propPatientName;
    if (patient && typeof patient === 'object') {
      return patient.name || patient.patient_name || '';
    }
    return '';
  }, [propPatientName, patient]);

  const resolvedAppointmentId = useMemo(() => {
    if (propAppointmentId && propAppointmentId !== 'NEW') return String(propAppointmentId);
    if (appointment) {
      if (typeof appointment === 'string' && appointment !== 'NEW') return appointment;
      if (appointment.id) return String(appointment.id);
      if (appointment._id) return String(appointment._id);
    }
    return '';
  }, [propAppointmentId, appointment]);

  const resolvedVisitId = useMemo(() => {
    if (propVisitId) return String(propVisitId);
    if (visit) {
      if (typeof visit === 'string') return visit;
      if (visit.id) return String(visit.id);
      if (visit._id) return String(visit._id);
    }
    return '';
  }, [propVisitId, visit]);

  // Referring doctor resolution
  const resolvedDoctorId = useMemo(() => {
    if (propDoctorId) return String(propDoctorId);
    if (doctor?.id) return String(doctor.id);
    if (appointment?.doctor?.id) return String(appointment.doctor.id);
    if (appointment?.doctor_id) return String(appointment.doctor_id);
    return '';
  }, [propDoctorId, doctor, appointment]);

  // 1. Fetch Masters, Doctors, and Patients
  useEffect(() => {
    fetchMasters();
    fetchDoctors();
    fetchPatients();
  }, []);

  // 2. Fetch current & historical investigations
  useEffect(() => {
    if (resolvedPatientId || resolvedAppointmentId || resolvedVisitId) {
      fetchCurrentInvestigations();
      if (resolvedPatientId) {
        fetchHistoryInvestigations();
      }
    }
  }, [resolvedPatientId, resolvedAppointmentId, resolvedVisitId]);

  // Lock background scroll when modal or lightbox is active
  useEffect(() => {
    if (isModalOpen || previewAttachment) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isModalOpen, previewAttachment]);

  // Keyboard shortcut: Escape to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (previewAttachment) setPreviewAttachment(null);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, previewAttachment]);

  const fetchMasters = async () => {
    try {
      const res = await fetch(`${API_BASE}/investigation-masters/`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMasters(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to load investigation masters:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE}/doctors/`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDoctorsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to load doctors:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_BASE}/patients/`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results || []);
        setPatientsList(list);
      }
    } catch (err) {
      console.warn('Failed to load patients:', err);
    }
  };

  const fetchCurrentInvestigations = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/patient-investigations/?`;
      if (resolvedAppointmentId) url += `appointment=${resolvedAppointmentId}&`;
      else if (resolvedVisitId) url += `visit=${resolvedVisitId}&`;
      else if (resolvedPatientId) url += `patient=${resolvedPatientId}&`;

      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setInvestigations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Error fetching investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryInvestigations = async () => {
    if (!resolvedPatientId) return;
    try {
      const res = await fetch(`${API_BASE}/patients/${resolvedPatientId}/investigations-history/`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Error fetching patient investigation history:', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setEditingAttachments([]);
    const defaultMaster = masters.length > 0 ? masters[0] : null;
    setFormData({
      patient_id: resolvedPatientId || (patientsList.length > 0 ? patientsList[0].id : ''),
      investigation_master_id: defaultMaster ? defaultMaster.id : '',
      investigation_name: defaultMaster ? defaultMaster.name : '',
      investigation_date: new Date().toISOString().split('T')[0],
      doctor_id: resolvedDoctorId || (doctorsList.length > 0 ? doctorsList[0].id : ''),
      status: 'Requested',
      reason: '',
      findings: '',
      remarks: ''
    });
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inv) => {
    setEditingId(inv.id);
    setEditingAttachments(inv.attachments || []);
    setFormData({
      patient_id: inv.patient || resolvedPatientId || '',
      investigation_master_id: inv.investigation_master || '',
      investigation_name: inv.investigation_name || '',
      investigation_date: inv.investigation_date || new Date().toISOString().split('T')[0],
      doctor_id: inv.doctor || resolvedDoctorId || '',
      status: inv.status || 'Requested',
      reason: inv.reason || '',
      findings: inv.findings || '',
      remarks: inv.remarks || ''
    });
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const handleMasterChange = (e) => {
    const mId = e.target.value;
    const selected = masters.find(m => String(m.id) === String(mId));
    setFormData(prev => ({
      ...prev,
      investigation_master_id: mId,
      investigation_name: selected ? selected.name : prev.investigation_name
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const validFiles = [];
      Array.from(e.target.files).forEach(file => {
        if (file.size === 0) {
          alert(`File "${file.name}" is empty (0 bytes) and cannot be uploaded.`);
          return;
        }
        if (file.size > 25 * 1024 * 1024) {
          alert(`File "${file.name}" exceeds the 25MB limit.`);
          return;
        }
        validFiles.push(file);
      });
      setSelectedFiles(prev => [...prev, ...validFiles]);
      e.target.value = '';
    }
  };

  const handleRemoveSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectivePid = resolvedPatientId || formData.patient_id;
    if (!effectivePid) {
      alert('Please select or specify a Patient for this investigation.');
      return;
    }

    if (!formData.investigation_name && !formData.investigation_master_id) {
      alert('Please select or specify an investigation type.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('patient', effectivePid);
      if (resolvedAppointmentId) payload.append('appointment', resolvedAppointmentId);
      if (resolvedVisitId) payload.append('visit', resolvedVisitId);
      if (formData.doctor_id) payload.append('doctor', formData.doctor_id);
      if (formData.investigation_master_id) payload.append('investigation_master', formData.investigation_master_id);
      payload.append('investigation_name', formData.investigation_name);
      payload.append('investigation_date', formData.investigation_date);
      payload.append('status', formData.status);
      payload.append('reason', formData.reason || '');
      payload.append('findings', formData.findings || '');
      payload.append('remarks', formData.remarks || '');

      selectedFiles.forEach(file => {
        payload.append('files', file);
      });

      const url = editingId 
        ? `${API_BASE}/patient-investigations/${editingId}/`
        : `${API_BASE}/patient-investigations/`;
      
      const method = editingId ? 'PATCH' : 'POST';

      const authHeaders = getHeaders();
      delete authHeaders['Content-Type']; // Let browser set boundary for multipart

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: payload
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCurrentInvestigations();
        fetchHistoryInvestigations();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Error saving investigation: ${JSON.stringify(errData)}`);
      }
    } catch (err) {
      console.error('Save investigation error:', err);
      alert('Failed to save investigation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (invId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/patient-investigations/${invId}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchCurrentInvestigations();
        fetchHistoryInvestigations();
      }
    } catch (err) {
      console.error('Quick status update error:', err);
    }
  };

  const handleDelete = async (invId) => {
    if (!window.confirm('Are you sure you want to delete this investigation record?')) return;
    try {
      const res = await fetch(`${API_BASE}/patient-investigations/${invId}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchCurrentInvestigations();
        fetchHistoryInvestigations();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDeleteAttachment = async (attId) => {
    if (!window.confirm('Delete this report / image attachment?')) return;
    try {
      const res = await fetch(`${API_BASE}/investigation-attachments/${attId}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setEditingAttachments(prev => prev.filter(a => a.id !== attId));
        fetchCurrentInvestigations();
        fetchHistoryInvestigations();
      }
    } catch (err) {
      console.error('Delete attachment error:', err);
    }
  };

  const renderStatusBadge = (status) => {
    let badgeClass = styles.statusRequested;
    let icon = <Clock size={12} style={{ marginRight: 4 }} />;

    if (status === 'In Progress') {
      badgeClass = styles.statusInProgress;
      icon = <Activity size={12} style={{ marginRight: 4 }} />;
    } else if (status === 'Result Pending') {
      badgeClass = styles.statusResultPending;
      icon = <AlertCircle size={12} style={{ marginRight: 4 }} />;
    } else if (status === 'Completed') {
      badgeClass = styles.statusCompleted;
      icon = <CheckCircle2 size={12} style={{ marginRight: 4 }} />;
    } else if (status === 'Cancelled') {
      badgeClass = styles.statusCancelled;
      icon = <XCircle size={12} style={{ marginRight: 4 }} />;
    }

    return (
      <span className={`${styles.statusBadge} ${badgeClass}`}>
        {icon}
        {status}
      </span>
    );
  };

  const isImageFile = (att) => {
    if (att.file_type && att.file_type.startsWith('image/')) return true;
    const name = (att.file_name || att.file_url || att.file || '').toLowerCase();
    return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp');
  };

  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const origin = (API_BASE && API_BASE.replace(/\/api\/?$/, '')) || 'http://127.0.0.1:8000';
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const displayList = activeTab === 'history' ? historyList : investigations;

  return (
    <div className={styles.container}>
      {/* Section Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleIcon}>
            <FileText size={20} />
          </div>
          <div>
            <h3 className={styles.title}>Investigations & Imaging</h3>
            <p className={styles.subtitle}>Digital Radiographs, OPG, CBCT & Diagnostic Lab Reports</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'current' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('current')}
          >
            Current Visit ({investigations.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={14} />
            History ({historyList.length})
          </button>

          {!readOnly && (
            <button
              type="button"
              className={styles.btnAdd}
              onClick={handleOpenAddModal}
            >
              <Plus size={16} />
              Order Investigation
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Clock className="animate-spin" size={24} />
            </div>
            <div className={styles.emptyTitle}>Loading investigations...</div>
          </div>
        ) : displayList.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FileText size={24} />
            </div>
            <div className={styles.emptyTitle}>
              {activeTab === 'current' ? 'No investigations ordered for this visit' : 'No prior investigation history recorded'}
            </div>
            <p className={styles.emptyDesc}>
              {activeTab === 'current'
                ? 'Order digital radiographs, OPG scans, vitality tests or upload lab reports for this patient.'
                : 'Historical radiographs and laboratory investigations will appear here once requested.'}
            </p>
            {!readOnly && (
              <button
                type="button"
                className={styles.btnAdd}
                onClick={handleOpenAddModal}
              >
                <Plus size={16} />
                Order First Investigation
              </button>
            )}
          </div>
        ) : (
          <div className={styles.investigationsGrid}>
            {displayList.map((inv) => (
              <div key={inv.id} className={styles.invCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={styles.invIcon}>
                      <ImageIcon size={18} />
                    </div>
                    <div>
                      <h4 className={styles.invName}>{inv.investigation_name}</h4>
                      {inv.master_name && inv.master_name !== inv.investigation_name && (
                        <span className={styles.invMasterTag}>{inv.master_name}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardHeaderRight}>
                    {renderStatusBadge(inv.status)}
                    {!readOnly && (
                      <div className={styles.actionMenu}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Edit Investigation"
                          onClick={() => handleOpenEditModal(inv)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          title="Delete Investigation"
                          onClick={() => handleDelete(inv.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  {/* Meta Details */}
                  <div className={styles.metaRow}>
                    <span className={styles.metaItem}>
                      <Calendar size={13} />
                      {inv.investigation_date}
                    </span>
                    <span className={styles.metaItem}>
                      <User size={13} />
                      {inv.doctor_name ? `Dr. ${inv.doctor_name}` : 'Clinic Doctor'}
                    </span>
                    {inv.patient_name && (
                      <span className={styles.metaItem}>
                        <FileText size={13} />
                        {inv.patient_name}
                      </span>
                    )}
                  </div>

                  {/* Quick Status Lifecycle Transition */}
                  {!readOnly && (
                    <div className={styles.lifecycleRow}>
                      <span className={styles.lifecycleLabel}>Lifecycle Status:</span>
                      <select
                        className={styles.lifecycleSelect}
                        value={inv.status}
                        onChange={(e) => handleQuickStatusChange(inv.id, e.target.value)}
                      >
                        <option value="Requested">Requested</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Result Pending">Result Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}

                  {/* Clinical Reason */}
                  {inv.reason && (
                    <div className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>Indication / Reason:</span>
                      <span className={styles.fieldValue}>{inv.reason}</span>
                    </div>
                  )}

                  {/* Findings */}
                  {inv.findings && (
                    <div className={styles.fieldHighlight}>
                      <span className={styles.fieldLabel}>Diagnostic Findings:</span>
                      <span className={styles.fieldValue}>{inv.findings}</span>
                    </div>
                  )}

                  {/* Remarks */}
                  {inv.remarks && (
                    <div className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>Clinical Notes:</span>
                      <span className={styles.fieldValue}>{inv.remarks}</span>
                    </div>
                  )}

                  {/* Uploaded Attachments */}
                  {inv.attachments && inv.attachments.length > 0 && (
                    <div className={styles.attachmentsSection}>
                      <div className={styles.attachmentsLabel}>
                        <FileText size={12} />
                        Uploaded Reports & Radiographs ({inv.attachments.length})
                      </div>
                      <div className={styles.attachmentsGrid}>
                        {inv.attachments.map((att) => {
                          const fileUrl = getFullFileUrl(att.file_url || att.file);
                          const isImg = isImageFile(att);

                          return (
                            <div key={att.id} className={styles.attachmentPill}>
                              {isImg ? (
                                <img
                                  src={att.file_data || fileUrl}
                                  alt={att.file_name}
                                  className={styles.thumbImg}
                                />
                              ) : (
                                <File size={16} color="#dc2626" />
                              )}
                              <span className={styles.fileName} title={att.file_name}>
                                {att.file_name}
                              </span>
                              <div className={styles.fileActions}>
                                <button
                                  type="button"
                                  className={styles.fileBtn}
                                  title="View"
                                  onClick={() => setPreviewAttachment({ ...att, fullUrl: fileUrl, isImg })}
                                >
                                  <Eye size={12} />
                                </button>
                                {fileUrl && (
                                  <a
                                    href={fileUrl}
                                    download={att.file_name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.fileBtn}
                                    title="Download"
                                  >
                                    <Download size={12} />
                                  </a>
                                )}
                                {!readOnly && (
                                  <button
                                    type="button"
                                    className={styles.fileBtn}
                                    title="Delete"
                                    onClick={() => handleDeleteAttachment(att.id)}
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Investigation Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Sticky Header */}
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  {editingId ? 'Edit Investigation' : 'Order New Investigation'}
                </h3>
                <p className={styles.modalSubtitle}>
                  Order radiographic imaging, lab tests, and attach diagnostic findings.
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsModalOpen(false)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body with Sticky Footer */}
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.modalBody}>
                {/* Patient Context Indicator or Selector */}
                {resolvedPatientId ? (
                  <div className={styles.patientBanner}>
                    <User size={15} className="text-teal-600" />
                    <span>
                      Patient: <strong className="text-slate-800">{resolvedPatientName || 'Assigned Patient'}</strong>
                      <span className="text-slate-500 text-xs ml-2 font-mono">({resolvedPatientId.slice(0, 10)}...)</span>
                    </span>
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select Patient *</label>
                    <select
                      className={styles.select}
                      value={formData.patient_id}
                      onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Patient --</option>
                      {patientsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.patient_id ? `(${p.patient_id})` : ''} - {p.phone || ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Master Type & Investigation Name */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Investigation Master Type *</label>
                    <select
                      className={styles.select}
                      value={formData.investigation_master_id}
                      onChange={handleMasterChange}
                      required
                    >
                      <option value="">-- Select Master Type --</option>
                      {masters.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.code ? `(${m.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Investigation Name *</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.investigation_name}
                      onChange={(e) => setFormData({ ...formData, investigation_name: e.target.value })}
                      placeholder="e.g. Digital OPG Panoramic / Bitewing"
                      required
                    />
                  </div>
                </div>

                {/* Date & Referring Doctor */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Investigation Date *</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formData.investigation_date}
                      onChange={(e) => setFormData({ ...formData, investigation_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Referring Doctor</label>
                    <select
                      className={styles.select}
                      value={formData.doctor_id}
                      onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                    >
                      <option value="">-- Auto (Appointment Doctor) --</option>
                      {doctorsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.name} {d.specialty ? `(${d.specialty})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status & Reason */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Investigation Status *</label>
                    <select
                      className={styles.select}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Requested">Requested</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Result Pending">Result Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Reason for Investigation</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="e.g. Evaluation of 3rd molar impaction / apical lesion"
                    />
                  </div>
                </div>

                {/* Findings / Results */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Findings / Diagnostic Results</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.findings}
                    onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                    placeholder="Enter diagnostic report findings, radiolucencies, bone height measurements, observations..."
                    rows={3}
                  />
                </div>

                {/* Additional Remarks */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Additional Remarks</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Technique details, patient notes, or follow-up recommendations..."
                    rows={2}
                  />
                </div>

                {/* Existing Attachments in Edit Mode */}
                {editingId && editingAttachments.length > 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Attached Reports & Scans ({editingAttachments.length})</label>
                    <div className={styles.existingAttachmentsGrid}>
                      {editingAttachments.map((att) => {
                        const fileUrl = getFullFileUrl(att.file_url || att.file);
                        const isImg = isImageFile(att);
                        return (
                          <div key={att.id} className={styles.attachmentPill}>
                            {isImg ? (
                              <img src={att.file_data || fileUrl} alt={att.file_name} className={styles.thumbImg} />
                            ) : (
                              <File size={16} color="#dc2626" />
                            )}
                            <span className={styles.fileName}>{att.file_name}</span>
                            <button
                              type="button"
                              className={styles.fileBtn}
                              title="Delete attachment"
                              onClick={() => handleDeleteAttachment(att.id)}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upload Scans / Reports Dropzone */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {editingId ? 'Upload Additional Scans / Reports' : 'Upload Scans / Reports'} (PDF, JPG, PNG)
                  </label>
                  <div
                    className={styles.dropzone}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={styles.dropzoneIcon}>
                      <UploadCloud size={30} />
                    </div>
                    <div className={styles.dropzoneText}>
                      Click to browse or drag and drop files here
                    </div>
                    <div className={styles.dropzoneSubtext}>
                      Supports PDF documents, JPG, PNG radiographs (Max 25MB each)
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,image/png,image/jpeg,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className={styles.filePreviewList}>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className={styles.previewItem}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            {file.type.startsWith('image/') ? <ImageIcon size={14} className="text-teal-600 flex-shrink-0" /> : <File size={14} className="text-rose-600 flex-shrink-0" />}
                            <span className="truncate">{file.name}</span>
                            <span className="text-slate-400 text-[11px] flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                          </span>
                          <button
                            type="button"
                            className={styles.fileBtn}
                            onClick={() => handleRemoveSelectedFile(idx)}
                            title="Remove file"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Investigation' : 'Save Investigation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      {previewAttachment && (
        <div className={styles.lightboxModal} onClick={() => setPreviewAttachment(null)}>
          <div className={styles.lightboxHeader} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {previewAttachment.isImg ? <ImageIcon size={20} /> : <FileText size={20} />}
              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {previewAttachment.file_name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {previewAttachment.fullUrl && (
                <a
                  href={previewAttachment.fullUrl}
                  download={previewAttachment.file_name}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: '0.85rem' }}
                >
                  <Download size={16} /> Download
                </a>
              )}
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 4 }}
                title="Close Lightbox"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            {previewAttachment.isImg ? (
              <img
                src={previewAttachment.file_data || previewAttachment.fullUrl}
                alt={previewAttachment.file_name}
                className={styles.lightboxImg}
              />
            ) : (
              <iframe
                src={previewAttachment.fullUrl}
                title={previewAttachment.file_name}
                className={styles.lightboxIframe}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
