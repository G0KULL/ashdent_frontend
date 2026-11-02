import React, { useState, useEffect, useRef } from 'react';
import styles from './InvestigationsSection.module.css';
import { API_BASE, getHeaders } from '../../utils/api';
import { 
  FileText, Plus, Calendar, User, Clock, CheckCircle2, 
  AlertCircle, XCircle, Eye, Download, Trash2, Edit2, 
  UploadCloud, File, Image as ImageIcon, History, X 
} from 'lucide-react';

export default function InvestigationsSection({
  patient = null,
  appointment = null,
  visit = null,
  doctor = null,
  readOnly = false,
  showHistoryByDefault = false
}) {
  const [activeTab, setActiveTab] = useState(showHistoryByDefault ? 'history' : 'current');
  const [investigations, setInvestigations] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [masters, setMasters] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
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
  const patientId = patient?.id || patient?._id || (typeof patient === 'string' ? patient : null);
  const appointmentId = appointment?.id || appointment?._id || (typeof appointment === 'string' ? appointment : null);
  const visitId = visit?.id || visit?._id || (typeof visit === 'string' ? visit : null);

  // Referring doctor resolution
  const resolvedDoctorId = doctor?.id || appointment?.doctor?.id || appointment?.doctor_id || '';
  const resolvedDoctorName = doctor?.name || appointment?.doctor?.name || appointment?.doctor_name || '';

  // 1. Fetch Masters & Doctors
  useEffect(() => {
    fetchMasters();
    fetchDoctors();
  }, []);

  // 2. Fetch current & historical investigations
  useEffect(() => {
    if (patientId || appointmentId || visitId) {
      fetchCurrentInvestigations();
      if (patientId) {
        fetchHistoryInvestigations();
      }
    }
  }, [patientId, appointmentId, visitId]);

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

  const fetchCurrentInvestigations = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/patient-investigations/?`;
      if (appointmentId) url += `appointment=${appointmentId}&`;
      else if (visitId) url += `visit=${visitId}&`;
      else if (patientId) url += `patient=${patientId}&`;

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
    if (!patientId) return;
    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}/investigations-history/`, {
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
    setFormData({
      investigation_master_id: masters.length > 0 ? masters[0].id : '',
      investigation_name: masters.length > 0 ? masters[0].name : '',
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
    setFormData({
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
    if (!formData.investigation_name && !formData.investigation_master_id) {
      alert('Please select or specify an investigation type');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      if (patientId) payload.append('patient', patientId);
      if (appointmentId) payload.append('appointment', appointmentId);
      if (visitId) payload.append('visit', visitId);
      if (formData.doctor_id) payload.append('doctor', formData.doctor_id);
      if (formData.investigation_master_id) payload.append('investigation_master', formData.investigation_master_id);
      payload.append('investigation_name', formData.investigation_name);
      payload.append('investigation_date', formData.investigation_date);
      payload.append('status', formData.status);
      payload.append('reason', formData.reason);
      payload.append('findings', formData.findings);
      payload.append('remarks', formData.remarks);

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

    if (status === 'Result Pending') {
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
    const name = (att.file_name || att.file_url || '').toLowerCase();
    return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp');
  };

  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://127.0.0.1:8000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const displayList = activeTab === 'history' ? historyList : investigations;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleIcon}>
            <FileText size={20} />
          </div>
          <div>
            <h3 className={styles.title}>Investigations & Imaging</h3>
            <p className={styles.subtitle}>Digital Radiographs, OPG, CBCT & Diagnostic Reports</p>
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
              Add Investigation
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Loading investigations...
          </div>
        ) : displayList.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FileText size={24} />
            </div>
            <div className={styles.emptyTitle}>
              {activeTab === 'history' ? 'No Investigation History' : 'No Investigations Requested'}
            </div>
            <div className={styles.emptyDesc}>
              {activeTab === 'history'
                ? 'No past investigations found for this patient.'
                : 'Click "Add Investigation" to order OPG, TMJ, Hand-Wrist, Bitewing, or upload patient scan reports.'}
            </div>
            {!readOnly && activeTab === 'current' && (
              <button
                type="button"
                className={styles.btnAdd}
                onClick={handleOpenAddModal}
              >
                <Plus size={16} />
                Add Investigation
              </button>
            )}
          </div>
        ) : (
          <div className={styles.investigationsGrid}>
            {displayList.map((inv) => (
              <div key={inv.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h4 className={styles.cardTitle}>{inv.investigation_name}</h4>
                    <div className={styles.cardMeta}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        {inv.investigation_date}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <User size={12} />
                        Dr. {inv.doctor_name || inv.doctor || resolvedDoctorName || 'Assigned'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {renderStatusBadge(inv.status)}

                    {!readOnly && (
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="Edit Investigation"
                          onClick={() => handleOpenEditModal(inv)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
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
                  {inv.reason && (
                    <div className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>Reason for Investigation</span>
                      <span className={styles.fieldValue}>{inv.reason}</span>
                    </div>
                  )}

                  {inv.findings && (
                    <div className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>Findings / Interpretation</span>
                      <span className={styles.fieldValue}>{inv.findings}</span>
                    </div>
                  )}

                  {inv.remarks && (
                    <div className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>Clinical Remarks</span>
                      <span className={styles.fieldValue}>{inv.remarks}</span>
                    </div>
                  )}

                  {/* Attachments */}
                  {inv.attachments && inv.attachments.length > 0 && (
                    <div className={styles.attachmentsSection}>
                      <div className={styles.attachmentsLabel}>
                        <FileText size={12} />
                        Uploaded Reports & Scans ({inv.attachments.length})
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
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingId ? 'Edit Investigation' : 'Order New Investigation'}
              </h3>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
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
                    <label className={styles.formLabel}>Investigation Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.investigation_name}
                      onChange={(e) => setFormData({ ...formData, investigation_name: e.target.value })}
                      placeholder="e.g. Digital OPG Panoramic"
                      required
                    />
                  </div>
                </div>

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

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Investigation Status</label>
                    <select
                      className={styles.select}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Requested">Requested</option>
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
                      placeholder="e.g. Evaluation of 3rd molar impaction / bone loss"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Findings / Results</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.findings}
                    onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                    placeholder="Enter diagnostic report findings, radiolucencies, observations..."
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Additional Remarks</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Any patient notes, technique instructions, or follow-up notes..."
                    rows={2}
                  />
                </div>

                {/* File Upload Section */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Upload Scans / Reports (PDF, JPG, PNG)</label>
                  <div
                    className={styles.dropzone}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={styles.dropzoneIcon}>
                      <UploadCloud size={28} />
                    </div>
                    <div className={styles.dropzoneText}>
                      Click or drag files here to upload
                    </div>
                    <div className={styles.dropzoneSubtext}>
                      Supports PDF documents, JPG, and PNG radiographic images
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

                  {selectedFiles.length > 0 && (
                    <div className={styles.filePreviewList}>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className={styles.previewItem}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {file.type.startsWith('image/') ? <ImageIcon size={14} /> : <File size={14} />}
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                          <button
                            type="button"
                            className={styles.fileBtn}
                            onClick={() => handleRemoveSelectedFile(idx)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.tabBtn}
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnAdd}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {previewAttachment.isImg ? <ImageIcon size={20} /> : <FileText size={20} />}
              <span style={{ fontWeight: 600 }}>{previewAttachment.file_name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {previewAttachment.fullUrl && (
                <a
                  href={previewAttachment.fullUrl}
                  download={previewAttachment.file_name}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                >
                  <Download size={18} /> Download
                </a>
              )}
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
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

