import React, { useState, useEffect } from 'react';
import styles from './SettingsShared.module.css';

const API = 'http://127.0.0.1:8000/api';

export default function PathologyLabSettings() {
  const [activeSubTab, setActiveSubTab] = useState('Header');
  const [loading, setLoading] = useState(false);

  const subTabs = [
    { id: 'Header', label: 'Header', icon: '📝' },
    { id: 'Lab', label: 'Lab', icon: '🧪' },
    { id: 'Lab Test', label: 'Lab Test', icon: '📊' },
    { id: 'Lab Test Details', label: 'Lab Test Details', icon: '🔍' },
    { id: 'Lab Test Package', label: 'Lab Test Package', icon: '📦' }
  ];

  const [headers, setHeaders] = useState([]);
  const [newHeader, setNewHeader] = useState('');

  const [labs, setLabs] = useState([]);
  const [newLab, setNewLab] = useState({ name: '', phone: '', address: '' });

  const [tests, setTests] = useState([]);
  const [newTest, setNewTest] = useState({ name: '', code: '', category: 'General', price: '' });

  const [testDetails, setTestDetails] = useState([]);
  const [newDetail, setNewDetail] = useState({ testId: '', parameter: '', unit: '', range: '' });

  const [packages, setPackages] = useState([]);
  const [newPackage, setNewPackage] = useState({ name: '', tests: '', price: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, lRes, tRes, pRes] = await Promise.all([
        fetch(`${API}/settings/lab-headers/`),
        fetch(`${API}/settings/laboratories/`),
        fetch(`${API}/settings/lab-tests/`),
        fetch(`${API}/settings/lab-packages/`)
      ]);
      const [hData, lData, tData, pData] = await Promise.all([
        hRes.json(), lRes.json(), tRes.json(), pRes.json()
      ]);
      setHeaders(hData);
      setLabs(lData);
      setTests(tData);
      setPackages(pData);
    } catch (e) {
      console.error("Error fetching pathology settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHeader = async () => {
    if (!newHeader) return;
    try {
      const res = await fetch(`${API}/settings/lab-headers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHeader })
      });
      if (res.ok) {
        const saved = await res.json();
        setHeaders([...headers, saved]);
        setNewHeader('');
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveLab = async () => {
    if (!newLab.name) return;
    try {
      const res = await fetch(`${API}/settings/laboratories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLab)
      });
      if (res.ok) {
        const saved = await res.json();
        setLabs([...labs, saved]);
        setNewLab({ name: '', phone: '', address: '' });
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveTest = async () => {
    if (!newTest.name) return;
    try {
      const res = await fetch(`${API}/settings/lab-tests/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTest)
      });
      if (res.ok) {
        const saved = await res.json();
        setTests([...tests, saved]);
        setNewTest({ name: '', code: '', category: 'General', price: '' });
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveDetail = async () => {
    if (!newDetail.parameter || !newDetail.testId) return;
    try {
      const res = await fetch(`${API}/settings/lab-parameters/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: newDetail.testId,
          name: newDetail.parameter,
          unit: newDetail.unit,
          normal_range: newDetail.range
        })
      });
      if (res.ok) {
        const saved = await res.json();
        // Refresh tests to get updated parameters
        fetchData();
        setNewDetail({ testId: '', parameter: '', unit: '', range: '' });
      }
    } catch (e) { console.error(e); }
  };

  const handleSavePackage = async () => {
    if (!newPackage.name) return;
    try {
      const res = await fetch(`${API}/settings/lab-packages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPackage.name,
          price: newPackage.price,
          tests: [] // For now, simple implementation. Frontend needs a multi-select for tests.
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setPackages([...packages, saved]);
        setNewPackage({ name: '', tests: '', price: '' });
      }
    } catch (e) { console.error(e); }
  };

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'Header':
        return (
          <div className={styles.sideBySide}>
            <div className={styles.sideForm} style={{ width: '350px' }}>
              <h4 className={styles.label} style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 700 }}>Add Report Header</h4>
              <div className={styles.formGroup}>
                <label className={styles.label}>Header</label>
                <input
                  className={styles.input}
                  placeholder="Header"
                  value={newHeader}
                  onChange={(e) => setNewHeader(e.target.value)}
                />
              </div>
              <button className={styles.saveBtn} style={{ width: '100%', background: '#3b82f6' }} onClick={handleSaveHeader}>
                <span style={{ marginRight: 8 }}>✔</span> Save
              </button>
            </div>

            <div className={styles.sideTable}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 className={styles.label} style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>List All Header</h4>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Show 10 entries</span>
                    <div style={{ position: 'relative' }}>
                      <input
                        className={styles.input}
                        placeholder="Search..."
                        style={{ width: '180px', paddingLeft: '12px', height: '32px' }}
                      />
                    </div>
                  </div>
                </div>
                <table className={styles.table}>
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      <th style={{ width: '100px' }}>Action</th>
                      <th>Header</th>
                      <th style={{ width: '120px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No data available in table</td></tr>
                    ) : (
                      headers.map(h => (
                        <tr key={h.id}>
                          <td>
                            <button className={styles.actionBtn}>✏️</button>
                            <button className={styles.actionBtn} style={{ color: '#ef4444' }}>🗑️</button>
                          </td>
                          <td style={{ fontWeight: 500 }}>{h.name}</td>
                          <td><span className={styles.statusBadge}>{h.is_active ? 'Active' : 'Inactive'}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, fontSize: 13, color: '#64748b' }}>
                  <span>Showing 0 to {headers.length} of {headers.length} entries</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button disabled style={{ padding: '4px 10px', border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 4 }}>Previous</button>
                    <button disabled style={{ padding: '4px 10px', border: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 4 }}>Next</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Lab':
        return (
          <div className={styles.sideBySide}>
            <div className={styles.sideForm}>
              <h4 className={styles.label} style={{ fontSize: '16px', marginBottom: '16px' }}>Add Lab</h4>
              <div className={styles.formGroup}>
                <label className={styles.label}>Lab Name</label>
                <input
                  className={styles.input}
                  placeholder="Lab Name"
                  value={newLab.name}
                  onChange={(e) => setNewLab({ ...newLab, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone</label>
                <input
                  className={styles.input}
                  placeholder="Phone Number"
                  value={newLab.phone}
                  onChange={(e) => setNewLab({ ...newLab, phone: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Address</label>
                <textarea
                  className={styles.input}
                  placeholder="Address"
                  style={{ minHeight: '80px' }}
                  value={newLab.address}
                  onChange={(e) => setNewLab({ ...newLab, address: e.target.value })}
                />
              </div>
              <button className={styles.saveBtn} style={{ width: '100%' }} onClick={handleSaveLab}>
                💾 Save
              </button>
            </div>

            <div className={styles.sideTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Action</th>
                    <th>Lab Name</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th style={{ width: '100px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {labs.map(l => (
                    <tr key={l.id}>
                      <td>
                        <button className={styles.actionBtn}>✏️</button>
                        <button className={styles.actionBtn} style={{ color: '#ef4444' }}>🗑️</button>
                      </td>
                      <td style={{ fontWeight: 500 }}>{l.name}</td>
                      <td>{l.phone}</td>
                      <td>{l.address}</td>
                      <td><span className={styles.statusBadge}>{l.is_active ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'Lab Test':
        return (
          <div className={styles.sideBySide}>
            <div className={styles.sideForm}>
              <h4 className={styles.label} style={{ fontSize: '16px', marginBottom: '16px' }}>Add Lab Test</h4>
              <div className={styles.formGroup}>
                <label className={styles.label}>Test Name</label>
                <input
                  className={styles.input}
                  placeholder="Test Name"
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Test Code</label>
                <input
                  className={styles.input}
                  placeholder="e.g. CBC"
                  value={newTest.code}
                  onChange={(e) => setNewTest({ ...newTest, code: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Category</label>
                <select className={styles.input} value={newTest.category} onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}>
                  <option>General</option>
                  <option>Hematology</option>
                  <option>Radiology</option>
                  <option>Biochemistry</option>
                  <option>Dental Lab Works</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Price (₹)</label>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="0.00"
                  value={newTest.price}
                  onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
                />
              </div>
              <button className={styles.saveBtn} style={{ width: '100%' }} onClick={handleSaveTest}>
                💾 Save
              </button>
            </div>

            <div className={styles.sideTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Action</th>
                    <th>Code</th>
                    <th>Test Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th style={{ width: '100px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map(t => (
                    <tr key={t.id}>
                      <td>
                        <button className={styles.actionBtn}>✏️</button>
                        <button className={styles.actionBtn} style={{ color: '#ef4444' }}>🗑️</button>
                      </td>
                      <td style={{ fontWeight: 600 }}>{t.code}</td>
                      <td>{t.name}</td>
                      <td>{t.category}</td>
                      <td>₹{t.price}</td>
                      <td><span className={styles.statusBadge}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'Lab Test Details':
        return (
          <div className={styles.sideBySide}>
            <div className={styles.sideForm}>
              <h4 className={styles.label} style={{ fontSize: '16px', marginBottom: '16px' }}>Add Test Parameters</h4>
              <div className={styles.formGroup}>
                <label className={styles.label}>Select Test</label>
                <select className={styles.input} value={newDetail.testId} onChange={(e) => setNewDetail({ ...newDetail, testId: e.target.value })}>
                  <option value="">Select Test</option>
                  {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Parameter Name</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Hemoglobin"
                  value={newDetail.parameter}
                  onChange={(e) => setNewDetail({ ...newDetail, parameter: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Unit</label>
                <input
                  className={styles.input}
                  placeholder="e.g. g/dL"
                  value={newDetail.unit}
                  onChange={(e) => setNewDetail({ ...newDetail, unit: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Normal Range</label>
                <input
                  className={styles.input}
                  placeholder="e.g. 13.5-17.5"
                  value={newDetail.range}
                  onChange={(e) => setNewDetail({ ...newDetail, range: e.target.value })}
                />
              </div>
              <button className={styles.saveBtn} style={{ width: '100%' }} onClick={handleSaveDetail}>
                💾 Save
              </button>
            </div>

            <div className={styles.sideTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Action</th>
                    <th>Test</th>
                    <th>Parameter</th>
                    <th>Unit</th>
                    <th>Normal Range</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.flatMap(t => (t.parameters || []).map(p => (
                    <tr key={p.id}>
                      <td><button className={styles.actionBtn} style={{ color: '#ef4444' }}>🗑️</button></td>
                      <td>{t.name}</td>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td>{p.unit}</td>
                      <td>{p.normal_range}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'Lab Test Package':
        return (
          <div className={styles.sideBySide}>
            <div className={styles.sideForm}>
              <h4 className={styles.label} style={{ fontSize: '16px', marginBottom: '16px' }}>Add Test Package</h4>
              <div className={styles.formGroup}>
                <label className={styles.label}>Package Name</label>
                <input
                  className={styles.input}
                  placeholder="Package Name"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Included Tests</label>
                <input
                  className={styles.input}
                  placeholder="e.g. X-Ray, Oral Exam"
                  value={newPackage.tests}
                  onChange={(e) => setNewPackage({ ...newPackage, tests: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Package Price (₹)</label>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="0.00"
                  value={newPackage.price}
                  onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                />
              </div>
              <button className={styles.saveBtn} style={{ width: '100%' }} onClick={handleSavePackage}>
                💾 Save
              </button>
            </div>

            <div className={styles.sideTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Action</th>
                    <th>Package Name</th>
                    <th>Tests</th>
                    <th>Price</th>
                    <th style={{ width: '100px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map(p => (
                    <tr key={p.id}>
                      <td>
                        <button className={styles.actionBtn}>✏️</button>
                        <button className={styles.actionBtn} style={{ color: '#ef4444' }}>🗑️</button>
                      </td>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td>{p.tests?.map(tid => tests.find(t => t.id === tid)?.name).join(', ') || 'No tests'}</td>
                      <td>₹{p.price}</td>
                      <td><span className={styles.statusBadge}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.pathologyContainer}>
      <header style={{ marginBottom: '24px' }}>
        <h2 className={styles.pageTitle} style={{ fontSize: '22px' }}>Pathology Lab Settings</h2>
        <div className={styles.breadcrumb}>
          <a href="#">🏠 Home</a>
          <span>/</span>
          <span>Pathology Lab Settings</span>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
        {/* Internal Vertical Sidebar */}
        <div style={{ width: '240px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '12px', height: 'fit-content' }}>
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: activeSubTab === tab.id ? '#f1f5f9' : 'transparent',
                color: activeSubTab === tab.id ? '#3b82f6' : '#64748b',
                fontSize: '14px',
                fontWeight: activeSubTab === tab.id ? '600' : '500',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                marginBottom: '4px',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '18px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1 }}>
          {renderSubContent()}
        </div>
      </div>
    </div>
  );
}
