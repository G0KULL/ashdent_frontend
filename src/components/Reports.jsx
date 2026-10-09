import React from 'react'
import styles from './Reports.module.css'

// Custom SVGs matching the visual style in the screenshot
const icons = {
  appointment: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
      <path d="M12 13v4m-2-2h4" strokeLinecap="round"/>
    </svg>
  ),
  patient: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
      <circle cx="8" cy="12" r="3"></circle>
      <line x1="14" y1="10" x2="19" y2="10" strokeLinecap="round"></line>
      <line x1="14" y1="14" x2="17" y2="14" strokeLinecap="round"></line>
    </svg>
  ),
  emr: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="12" height="16" rx="1"></rect>
      <path d="M8 8h12v12H8z" fill="none" stroke="currentColor"></path>
      <path d="M11 12h6m-6 4h4" strokeLinecap="round"></path>
    </svg>
  ),
  invoice: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <circle cx="12" cy="15" r="3"></circle>
    </svg>
  ),
  receipt: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2H4z"></path>
      <line x1="8" y1="6" x2="16" y2="6"></line>
      <line x1="8" y1="10" x2="16" y2="10"></line>
      <line x1="8" y1="14" x2="12" y2="14"></line>
      <path d="M12 14v4M10 16h4" strokeLinecap="round" />
    </svg>
  ),
  gst: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2H4z"></path>
      <line x1="8" y1="8" x2="16" y2="8"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
      <line x1="8" y1="16" x2="12" y2="16"></line>
    </svg>
  ),
  lab: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2H4z"></path>
      <line x1="8" y1="6" x2="16" y2="6"></line>
      <line x1="8" y1="10" x2="16" y2="10"></line>
    </svg>
  ),
  pharmacy: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2H4z"></path>
      <path d="M12 6v6m-3-3h6" strokeLinecap="round"></path>
    </svg>
  ),
  clinical_notes: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
      <circle cx="8" cy="12" r="3"></circle>
      <line x1="14" y1="10" x2="19" y2="10" strokeLinecap="round"></line>
      <line x1="14" y1="14" x2="17" y2="14" strokeLinecap="round"></line>
    </svg>
  ),
  document: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <circle cx="12" cy="14" r="3"></circle>
    </svg>
  ),
  treatments: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  ),
  expense: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round"></path>
    </svg>
  ),
  pre_booking: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
      <circle cx="12" cy="15" r="2"></circle>
    </svg>
  ),
  communication: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  )
}

const reportTiles = [
  { id: 'appointment', title: 'Appointment', color: '#6ebd45', icon: 'appointment' },
  { id: 'patient', title: 'Patient', color: '#3da8db', icon: 'patient' },
  { id: 'clinical_notes', title: 'Clinical Notes', color: '#fa5b2d', icon: 'clinical_notes' },
  { id: 'treatments', title: 'Treatments Done', color: '#eab308', icon: 'treatments' },
  { id: 'invoice', title: 'Clinical Invoice', color: '#7a7ccb', icon: 'invoice' },
  { id: 'receipt', title: 'Income Receipts', color: '#10b981', icon: 'receipt' },
  { id: 'expense', title: 'Expenses', color: '#ef4444', icon: 'expense', forceNewRow: true },
  { id: 'pharmacy', title: 'Pharmacy Sales', color: '#f97316', icon: 'pharmacy' },
  { id: 'prescription', title: 'Prescription', color: '#8b5cf6', icon: 'document' },
  { id: 'stock', title: 'Stock Purchases', color: '#2a3f9b', icon: 'document' },
  { id: 'pre_booking', title: 'Pre-Bookings', color: '#06b6d4', icon: 'pre_booking', forceNewRow: true },
  { id: 'communication', title: 'Communications', color: '#6366f1', icon: 'communication' }
]

export default function Reports() {
  const [activeReport, setActiveReport] = React.useState(null)
  
  // Date filters
  const [startDate, setStartDate] = React.useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = React.useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [reportData, setReportData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState(null);

  // Fetch report data from backend
  const fetchReportData = async (reportId, start, end) => {
    if (!reportId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/reports/${reportId}/?start_date=${start}&end_date=${end}`);
      const data = await response.json();
      if (response.ok) {
        setReportData(data.results || []);
      } else {
        console.error("Error fetching report data", data);
        setReportData([]);
      }
    } catch (err) {
      console.error("Network error fetching report data", err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTileClick = (tile) => {
    setActiveReport(tile);
    fetchReportData(tile.id, startDate, endDate);
  };

  // Re-fetch if active report is open and dates change
  React.useEffect(() => {
    if (activeReport) {
      fetchReportData(activeReport.id, startDate, endDate);
    }
  }, [startDate, endDate]);

  return (
    <div className={styles.reportsPage}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          {activeReport ? `${activeReport.title} Report` : 'EHR Reports'}
        </h1>
        <div className={styles.breadcrumb}>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveReport(null); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Home
          </a>
          <span>/</span>
          {activeReport ? (
            <>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveReport(null); }}>EHR Reports</a>
              <span>/</span>
              <span>{activeReport.title}</span>
            </>
          ) : (
            <span>EHR Reports</span>
          )}
        </div>
      </header>

      <div className={styles.container}>
        {!activeReport ? (
          <div className={styles.reportsGrid}>
            {reportTiles.map((tile) => (
              <div 
                key={tile.id} 
                className={`${styles.reportCard} ${tile.forceNewRow ? styles.forceNewRow : ''}`}
                style={{ backgroundColor: tile.color }}
                onClick={() => handleTileClick(tile)}
              >
                <h3 className={styles.cardTitle}>{tile.title}</h3>
                <div className={styles.cardIcon}>
                  {icons[tile.icon]}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.reportDetailView}>
            <div className={styles.reportDetailHeader} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: activeReport.color, padding: '8px', borderRadius: '8px', color: 'white', display: 'flex' }}>
                  {icons[activeReport.icon]}
                </div>
                <h2 style={{ margin: 0, color: 'var(--slate-900)' }}>{activeReport.title} Data</h2>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                  <label style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>From:</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--slate-900)', fontWeight: 500 }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                  <label style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>To:</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--slate-900)', fontWeight: 500 }}
                  />
                </div>
                <button 
                  onClick={() => setActiveReport(null)}
                  style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: 'var(--slate-700)', transition: 'all 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                >
                  ← Back
                </button>
              </div>
            </div>
            
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden', minHeight: '300px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'transparent', borderBottom: '1px solid var(--border-light)' }}>
                  <tr>
                    <th style={{ padding: '16px', color: 'var(--slate-700)', fontWeight: 600, fontSize: '14px', width: '15%' }}>Date</th>
                    <th style={{ padding: '16px', color: 'var(--slate-700)', fontWeight: 600, fontSize: '14px', width: '25%' }}>Patient / Reference</th>
                    <th style={{ padding: '16px', color: 'var(--slate-700)', fontWeight: 600, fontSize: '14px', width: '15%' }}>Status</th>
                    <th style={{ padding: '16px', color: 'var(--slate-700)', fontWeight: 600, fontSize: '14px', width: '45%' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        Loading data...
                      </td>
                    </tr>
                  ) : reportData.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        No records found for the selected date range.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((item, index) => (
                      <tr 
                        key={index} 
                        style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        onClick={() => setSelectedRecord(item)}
                      >
                        <td style={{ padding: '16px', color: 'var(--slate-800)', fontWeight: 500 }}>{item.date}</td>
                        <td style={{ padding: '16px', color: 'var(--slate-900)', fontWeight: 600 }}>{item.reference}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--slate-700)' }}>{item.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--slate-900)', fontSize: '18px' }}>Record Details</h3>
              <button 
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Date</span>
                  <span style={{ fontSize: '15px', color: 'var(--slate-900)', fontWeight: 500 }}>{selectedRecord.date}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Reference / Patient</span>
                  <span style={{ fontSize: '15px', color: 'var(--slate-900)', fontWeight: 500 }}>{selectedRecord.reference}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                  <span style={{ fontSize: '15px', color: 'var(--slate-900)', fontWeight: 500 }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>{selectedRecord.status}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Summary</span>
                  <span style={{ fontSize: '15px', color: 'var(--slate-900)', fontWeight: 500, whiteSpace: 'pre-wrap' }}>{selectedRecord.details}</span>
                </div>
                
                {selectedRecord.full_data && Object.keys(selectedRecord.full_data).length > 0 && (
                  <>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '8px 0' }} />
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--slate-800)', fontSize: '15px' }}>Extended Data</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'transparent', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      {Object.entries(selectedRecord.full_data).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}</span>
                          <span style={{ fontSize: '14px', color: 'var(--slate-900)', fontWeight: 500, wordBreak: 'break-word' }}>{val || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', background: 'transparent', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button 
                onClick={() => setSelectedRecord(null)}
                style={{ padding: '8px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
