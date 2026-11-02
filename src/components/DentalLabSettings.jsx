import React, { useState, useEffect } from 'react';
import styles from './SettingsShared.module.css'; // Reusing GeneralSettings styles for consistency

export default function DentalLabSettings() {
  const [activeTab, setActiveTab] = useState('Dental work');
  const [loading, setLoading] = useState(false);

  // Dental Work State
  const [works, setWorks] = useState([]);
  const [workForm, setWorkForm] = useState({
    name: '',
    shade: '',
    work_type: '',
    alloy_type: '',
    price: 0
  });

  // Laboratory State
  const [laboratories, setLaboratories] = useState([]);
  const [labForm, setLabForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchWorks();
    fetchLaboratories();
  }, []);

  const fetchWorks = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings/dental-lab-work/');
      const data = await res.json();
      setWorks(data);
    } catch (e) { console.error(e); }
  };

  const fetchLaboratories = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings/dental-laboratories/');
      const data = await res.json();
      setLaboratories(data);
    } catch (e) { console.error(e); }
  };

  const handleWorkSave = async () => {
    if (!workForm.name) return;
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings/dental-lab-work/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workForm)
      });
      if (res.ok) {
        setWorkForm({ name: '', shade: '', work_type: '', alloy_type: '', price: 0 });
        fetchWorks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLabSave = async () => {
    if (!labForm.name) return;
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings/dental-laboratories/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labForm)
      });
      if (res.ok) {
        setLabForm({ name: '', phone: '', email: '', address: '' });
        fetchLaboratories();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteWork = async (id) => {
    const c = await window._SwalBase.fire({ title: 'Delete this lab work item?', icon: 'warning', showCancelButton: true, confirmButtonText: '✅ Yes, Confirm', cancelButtonText: '❌ Cancel' });
    if (!c.isConfirmed) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/settings/dental-lab-work/${id}/`, { method: 'DELETE' });
      if (res.ok) fetchWorks();
    } catch (e) { console.error(e); }
  };

  const deleteLab = async (id) => {
    const c = await window._SwalBase.fire({ title: 'Delete this laboratory?', icon: 'warning', showCancelButton: true, confirmButtonText: '✅ Yes, Confirm', cancelButtonText: '❌ Cancel' });
    if (!c.isConfirmed) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/settings/dental-laboratories/${id}/`, { method: 'DELETE' });
      if (res.ok) fetchLaboratories();
    } catch (e) { console.error(e); }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dental Lab Settings</h1>
          <p className={styles.subtitle}>Manage lab works, pricing, and laboratory details</p>
        </div>
      </div>

      <div className={styles.settingsLayout}>
        <div className={styles.sidebar}>
          <button className={`${styles.navItem} ${activeTab === 'Dental work' ? styles.activeNav : ''}`} onClick={() => setActiveTab('Dental work')}>
            <span className={styles.navIcon}>🦷</span> Dental Work Types
          </button>
          <button className={`${styles.navItem} ${activeTab === 'Laboratory' ? styles.activeNav : ''}`} onClick={() => setActiveTab('Laboratory')}>
            <span className={styles.navIcon}>🔬</span> External Laboratories
          </button>
        </div>

        <div className={styles.contentArea}>
          {activeTab === 'Dental work' && (
            <div className={styles.tabPane}>
              <h2 className={styles.tabTitle}>Dental Work Types</h2>
              <div className={styles.splitLayout}>
                <div className={styles.sideForm}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, color: 'var(--slate-900)', fontWeight: 600 }}>Add New Work</h3>
                  <div className={styles.formGroup}>
                    <input className={styles.input} type="text" placeholder="Work Name" value={workForm.name} onChange={e => setWorkForm({ ...workForm, name: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <input className={styles.input} type="text" placeholder="Shade" value={workForm.shade} onChange={e => setWorkForm({ ...workForm, shade: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <input className={styles.input} type="text" placeholder="Work Type" value={workForm.work_type} onChange={e => setWorkForm({ ...workForm, work_type: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <input className={styles.input} type="text" placeholder="Alloy Type" value={workForm.alloy_type} onChange={e => setWorkForm({ ...workForm, alloy_type: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <input className={styles.input} type="number" placeholder="Price" value={workForm.price} onChange={e => setWorkForm({ ...workForm, price: e.target.value })} />
                  </div>
                  <button className={styles.saveBtn} onClick={handleWorkSave} disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Saving...' : '💾 Save'}
                  </button>
                </div>

                <div className={styles.sideTable}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, color: 'var(--slate-900)', fontWeight: 600 }}>List All Works</h3>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>Action</th>
                        <th>Name</th>
                        <th>Shade</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {works.map((w, i) => (
                        <tr key={i}>
                          <td>
                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => deleteWork(w.id)}>🗑️</button>
                          </td>
                          <td>{w.name}</td>
                          <td>{w.shade}</td>
                          <td>₹{w.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Laboratory' && (
            <div className={styles.tabPane}>
              <h2 className={styles.tabTitle}>External Laboratories</h2>
              <div className={styles.splitLayout}>
                <div className={styles.sideForm}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, color: 'var(--slate-900)', fontWeight: 600 }}>Add New Laboratory</h3>
                  <div className={styles.formGroup}>
                    <input className={styles.input} type="text" placeholder="Lab Name" value={labForm.name} onChange={e => setLabForm({ ...labForm, name: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <input className={styles.input} type="text" placeholder="Phone" value={labForm.phone} onChange={e => setLabForm({ ...labForm, phone: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <input className={styles.input} type="email" placeholder="Email" value={labForm.email} onChange={e => setLabForm({ ...labForm, email: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <textarea
                      className={styles.input}
                      value={labForm.address}
                      onChange={e => setLabForm({ ...labForm, address: e.target.value })}
                      placeholder="Address"
                      style={{ minHeight: 80 }}
                    />
                  </div>

                  <button className={styles.saveBtn} onClick={handleLabSave} disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Saving...' : '💾 Save'}
                  </button>
                </div>

                <div className={styles.sideTable}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, color: 'var(--slate-900)', fontWeight: 600 }}>List All Laboratories</h3>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>Action</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {laboratories.map((l, i) => (
                        <tr key={i}>
                          <td>
                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => deleteLab(l.id)}>🗑️</button>
                          </td>
                          <td>{l.name}</td>
                          <td>{l.phone}</td>
                          <td><span className={styles.statusBadge}>Active</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
