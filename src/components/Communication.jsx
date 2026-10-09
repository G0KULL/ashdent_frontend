import { useState, useEffect } from 'react'
import styles from './Communication.module.css'

export default function Communication() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [selectedPatients, setSelectedPatients] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [messageType, setMessageType] = useState('custom')
  const [message, setMessage] = useState('')
  const [templates, setTemplates] = useState([])
  const [template, setTemplate] = useState('')
  const [channels, setChannels] = useState({ sms: true, whatsapp: true })
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('compose') // compose | history | automations
  const [history, setHistory] = useState([])
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null)
  const [patientGroups, setPatientGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [reminders, setReminders] = useState([])
  const [loadingReminders, setLoadingReminders] = useState(false)

  useEffect(() => {
    fetchPatients()
    fetchGroups()
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings/communication-templates/')
      const data = await res.json()
      setTemplates(data)
    } catch (err) { console.error('Failed to fetch templates:', err) }
  }

  async function fetchGroups() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/patient-groups/')
      const data = await res.json()
      setPatientGroups(data)
    } catch (err) { console.error(err) }
  }

  async function fetchPatients() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/patient/search/')
      const data = await res.json()
      setPatients(data)
    } catch (err) {
      console.error('Failed to fetch patients:', err)
    }
  }

  const filteredPatients = patients.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch = p.name.toLowerCase().includes(q) || p.phone.includes(q)
    
    if (activeFilter === 'all') return matchesSearch
    if (activeFilter === 'groups' && selectedGroup) {
      return matchesSearch && p.groups.some(g => String(g.id) === String(selectedGroup.id))
    }
    
    if (activeFilter === 'recent' || activeFilter === 'today') {
        const checkDate = (dateStr) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            const today = new Date();
            if (activeFilter === 'today') {
                return d.toDateString() === today.toDateString();
            } else {
                const diffTime = today - d;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                return diffDays >= 0 && diffDays <= 7;
            }
        };
        const matchesDate = checkDate(p.created_at) || checkDate(p.last_visit_date) || (p.last_appointment && checkDate(p.last_appointment.date));
        return matchesSearch && matchesDate;
    }
    
    return matchesSearch
  })

  useEffect(() => {
    if (selectedPatients.length === 1) {
      fetchPatientDetails(selectedPatients[0])
      fetchHistory(selectedPatients[0])
    } else {
      setSelectedPatientDetails(null)
      setHistory([])
    }
  }, [selectedPatients])

  async function fetchPatientDetails(id) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/patient/${id}/profile/`)
      const data = await res.json()
      setSelectedPatientDetails(data)
    } catch (err) { console.error(err) }
  }

  async function fetchHistory(id) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/communication-logs/?patient_id=${id}`)
      const data = await res.json()
      setHistory(data)
    } catch (err) { console.error(err) }
  }

  async function fetchReminders() {
    setLoadingReminders(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/reminders/pending/')
      const data = await res.json()
      setReminders(data)
    } catch (err) { console.error(err) } finally { setLoadingReminders(false) }
  }

  useEffect(() => {
    if (activeTab === 'automations') {
      fetchReminders()
    }
  }, [activeTab])

  const handleSelectPatient = (id) => {
    setSelectedPatients(prev => {
      const isSelected = prev.includes(id)
      if (isSelected) return prev.filter(pid => pid !== id)
      return [...prev, id]
    })
  }

  const handleSelectAll = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([])
    } else {
      setSelectedPatients(filteredPatients.map(p => p.id))
    }
  }

  const handleSendMessage = async () => {
    if (selectedPatients.length === 0 || !message) return
    setSending(true)
    
    // Open WhatsApp for selected patients BEFORE fetch to bypass popup blockers
    if (channels.whatsapp) {
      const patientsToMsg = patients.filter(p => selectedPatients.includes(p.id));
      patientsToMsg.forEach(p => {
        const phone = p.phone.replace(/\D/g, '');
        const fullPhone = phone.length === 10 ? `91${phone}` : phone;
        
        let finalMsg = message;
        if (selectedPatients.length === 1) {
          finalMsg = finalMsg.replace('[Name]', p.name);
        }
        
        const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(finalMsg)}`;
        window.open(waUrl, '_blank');
      });
    }
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/communication-logs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_ids: selectedPatients,
          message: message,
          channels: Object.keys(channels).filter(k => channels[k])
        })
      })
      
      if (res.ok) {
        setSuccess(true)

        setMessage('')
        if (selectedPatients.length === 1) fetchHistory(selectedPatients[0])
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to send:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* --- Left Side: Patient Selection --- */}
      <div className={styles.selectionPanel}>
        <div className={styles.panelHeader}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Select Patients</h3>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="Search by name, phone or ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filters}>
            <button 
              className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => { setActiveFilter('all'); setSelectedGroup(null); }}
            >All Patients</button>
            <button 
              className={`${styles.filterBtn} ${activeFilter === 'recent' ? styles.filterBtnActive : ''}`}
              onClick={() => { setActiveFilter('recent'); setSelectedGroup(null); }}
            >Recent</button>
            <button 
              className={`${styles.filterBtn} ${activeFilter === 'groups' ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveFilter('groups')}
            >Groups</button>
            <button 
              className={`${styles.filterBtn} ${activeFilter === 'today' ? styles.filterBtnActive : ''}`}
              onClick={() => { setActiveFilter('today'); setSelectedGroup(null); }}
            >Today</button>
          </div>
        </div>

        {activeFilter === 'groups' && (
          <div className={styles.groupSelector}>
            <div className={styles.groupHeader}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Select Group</span>
              <button className={styles.addGroupBtn} onClick={() => setShowGroupModal(true)}>+</button>
            </div>
            <div className={styles.groupList}>
              {patientGroups.map(group => (
                <div 
                  key={group.id} 
                  className={`${styles.groupItem} ${selectedGroup?.id === group.id ? styles.groupItemActive : ''}`}
                  onClick={() => setSelectedGroup(group)}
                >
                  {group.name} ({group.patient_count})
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.selectAll} onClick={handleSelectAll}>
          <div className={`${styles.checkbox} ${selectedPatients.length === filteredPatients.length && filteredPatients.length > 0 ? styles.checkboxActive : ''}`}>
            {selectedPatients.length === filteredPatients.length && filteredPatients.length > 0 && <span>✓</span>}
          </div>
          Select All ({filteredPatients.length})
        </div>

        <div className={styles.patientList}>
          {filteredPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
              No patients found
            </div>
          ) : filteredPatients.map(p => (
            <div 
              key={p.id} 
              className={`${styles.patientCard} ${selectedPatients.includes(p.id) ? styles.patientCardActive : ''}`}
              onClick={() => handleSelectPatient(p.id)}
            >
              <div className={`${styles.checkbox} ${selectedPatients.includes(p.id) ? styles.checkboxActive : ''}`}>
                {selectedPatients.includes(p.id) && <span>✓</span>}
              </div>
              <div className={styles.patientInfo}>
                <span className={styles.patientName}>{p.name}</span>
                <span className={styles.patientMeta}>{p.phone} • {p.age}Y/{p.gender}</span>
              </div>
            </div>
          ))}
        </div>

        {selectedPatients.length > 0 && (
          <div className={styles.bulkActions}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>Bulk Group Actions</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <select 
                className={styles.select}
                style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
                onChange={async (e) => {
                  const groupId = e.target.value
                  if (!groupId) return
                  const res = await fetch('http://127.0.0.1:8000/api/patients/bulk-group-update/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      patient_ids: selectedPatients,
                      group_id: groupId,
                      action: 'add'
                    })
                  })
                  if (res.ok) {
                    fetchPatients()
                    fetchGroups()
                    e.target.value = ""
                  }
                }}
              >
                <option value="">Add to Group...</option>
                {patientGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* --- Right Side: Message Composition / History --- */}
      <div className={styles.composerPanel}>
        <div className={styles.composerHeader}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Communication</h2>
          <div className={styles.tabSwitcher}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'compose' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('compose')}
            >Compose</button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('history')}
              disabled={selectedPatients.length !== 1}
            >History {selectedPatients.length === 1 && history.length > 0 && `(${history.length})`}</button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'automations' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('automations')}
            >Automated Reminders</button>
          </div>
        </div>

        {/* Selected Patient Context Bar */}
        {selectedPatientDetails && (
          <div className={styles.patientContext}>
            <div className={styles.contextInfo}>
              <span className={styles.contextName}>{selectedPatientDetails.patient.name}</span>
              <span className={styles.contextMeta}>#{selectedPatientDetails.patient.id} • {selectedPatientDetails.patient.age}Y/{selectedPatientDetails.patient.gender} • Balance: <span style={{ color: selectedPatientDetails.patient.total_balance > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>₹{selectedPatientDetails.patient.total_balance}</span></span>
            </div>
            <div style={{ flex: 1 }} />
            <div className={styles.contextActions}>
              <span className={styles.statusBadge}>{selectedPatientDetails.patient.status}</span>
            </div>
          </div>
        )}
        
        {activeTab === 'compose' ? (
          <>
            <div className={styles.messageTypes}>
              <button 
                className={`${styles.typeBtn} ${messageType === 'custom' ? styles.typeBtnActive : ''}`}
                onClick={() => setMessageType('custom')}
              >
                <div className={styles.typeIcon}>✏️</div>
                <span className={styles.typeLabel}>Custom</span>
              </button>
              <button 
                className={`${styles.typeBtn} ${messageType === 'reminder' ? styles.typeBtnActive : ''}`}
                onClick={() => setMessageType('reminder')}
              >
                <div className={styles.typeIcon}>⏰</div>
                <span className={styles.typeLabel}>Reminder</span>
              </button>
              <button 
                className={`${styles.typeBtn} ${messageType === 'patient-wise' ? styles.typeBtnActive : ''}`}
                onClick={() => setMessageType('patient-wise')}
              >
                <div className={styles.typeIcon}>👤</div>
                <span className={styles.typeLabel}>Targeted</span>
              </button>
            </div>

            <div className={styles.composerBody}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Template</label>
                <select 
                  className={styles.select}
                  value={template}
                  onChange={e => {
                    const t = templates.find(x => String(x.id) === String(e.target.value))
                    if (t) {
                       setTemplate(e.target.value)
                       let msg = t.text
                       if (selectedPatients.length === 1 && selectedPatientDetails) {
                           msg = msg.replace(/\{patient\}/g, selectedPatientDetails.patient.name)
                                    .replace(/\[Name\]/g, selectedPatientDetails.patient.name)
                       }
                       setMessage(msg)
                    } else {
                       setTemplate('')
                       setMessage('')
                    }
                  }}
                >
                  <option value="">Select a template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.category} - {t.type}</option>)}
                </select>
              </div>

              <div className={styles.textareaWrapper}>
                <label className={styles.label}>Message Body</label>
                <textarea 
                  className={styles.textarea}
                  placeholder="Type your message here..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                <span className={styles.charCount}>{message.length} characters</span>
              </div>

              <div className={styles.channelsRow}>
                <div className={styles.fieldGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Channels</label>
                  <div className={styles.channels}>
                    <label className={styles.channelOption}>
                      <input 
                        type="checkbox" 
                        checked={channels.sms} 
                        onChange={e => setChannels(prev => ({...prev, sms: e.target.checked}))}
                      />
                      SMS
                    </label>
                    <label className={styles.channelOption}>
                      <input 
                        type="checkbox" 
                        checked={channels.whatsapp} 
                        onChange={e => setChannels(prev => ({...prev, whatsapp: e.target.checked}))}
                      />
                      WhatsApp
                    </label>
                  </div>
                </div>
                <div className={styles.fieldGroup} style={{ flex: 1 }}>
                   <label className={styles.label}>Files</label>
                   <div className={styles.attachmentsSmall}>
                      📎 Attach File
                   </div>
                </div>
              </div>

              <div className={styles.actions}>
                <button className={styles.previewBtn}>Preview</button>
                <button 
                  className={styles.sendBtn}
                  onClick={handleSendMessage}
                  disabled={sending || selectedPatients.length === 0 || !message}
                >
                  {sending ? 'Sending...' : success ? '✓ Sent' : `🚀 Send to ${selectedPatients.length} Patient${selectedPatients.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </>
        ) : activeTab === 'history' ? (
          <div className={styles.historyList}>
            {history.length === 0 ? (
              <div className={styles.emptyHistory}>No communication history found for this patient.</div>
            ) : (
              history.map(log => (
                <div key={log.id} className={styles.historyItem}>
                  <div className={styles.historyMeta}>
                    <span className={styles.historyChannel}>{log.channel}</span>
                    <span className={styles.historyDate}>{new Date(log.sent_at).toLocaleString()}</span>
                  </div>
                  <p className={styles.historyMsg}>{log.message}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={styles.automationsList}>
            <div style={{ padding: '16px', background: 'transparent', borderBottom: '1px solid var(--border-light)' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                <strong>Automated Messages Queue</strong><br/>
                Since true background SMS requires a paid API (like Twilio or Interakt), you can quickly blast out today's Birthdays and tomorrow's Appointment/Follow-up Reminders right here for FREE using WhatsApp Web. Just click "Send via WA" on each!
              </p>
            </div>
            {loadingReminders ? <div style={{ padding: 20 }}>Loading...</div> : reminders.length === 0 ? (
              <div className={styles.emptyHistory}>No pending automated reminders for today/tomorrow.</div>
            ) : (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reminders.map((rem, idx) => (
                  <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 12 }}>{rem.type}</span>
                        <h4 style={{ margin: '8px 0 4px', fontSize: 14 }}>{rem.patient_name}</h4>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{rem.patient_phone}</div>
                      </div>
                      <button 
                        className={styles.sendBtn}
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={async () => {
                          const phone = rem.patient_phone.replace(/\D/g, '');
                          const fullPhone = phone.length === 10 ? `91${phone}` : phone;
                          const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(rem.message)}`;
                          window.open(waUrl, '_blank');
                          
                          // Log it
                          await fetch('http://127.0.0.1:8000/api/communication-logs/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              patient_ids: [rem.patient_id],
                              message: rem.message,
                              channels: ['WhatsApp']
                            })
                          });
                          
                          // Remove from list
                          setReminders(prev => prev.filter((_, i) => i !== idx));
                        }}
                      >Send via WA</button>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--slate-800)', background: 'rgba(255, 255, 255, 0.02)', padding: 8, borderRadius: 6 }}>
                      {rem.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Group Management Modal */}
      {showGroupModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Create New Group</h3>
              <button className={styles.closeBtn} onClick={() => setShowGroupModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Group Name</label>
                <input 
                  type="text" 
                  className={styles.select} 
                  value={newGroupName} 
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g. Ortho Patients, Implant Candidates"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowGroupModal(false)}>Cancel</button>
              <button 
                className={styles.saveBtn} 
                onClick={async () => {
                  if (!newGroupName) return
                  const res = await fetch('http://127.0.0.1:8000/api/patient-groups/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newGroupName })
                  })
                  if (res.ok) {
                    fetchGroups()
                    setShowGroupModal(false)
                    setNewGroupName('')
                  }
                }}
              >Create Group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
