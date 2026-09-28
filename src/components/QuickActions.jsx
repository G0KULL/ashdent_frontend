import styles from './QuickActions.module.css'

const ACTIONS = [
  {
    id: 'add-patient', label: 'Add Patient',
    bg: '#e8f5e9', color: '#4CAF50',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="4" fill="#4CAF50"/>
        <path d="M2 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#4CAF50" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M17 7v6M14 10h6" stroke="#4CAF50" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'schedule', label: 'Schedule',
    bg: '#e3f2fd', color: '#1E88E5',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="#1E88E5" strokeWidth="1.8"/>
        <path d="M7 3v4M17 3v4M3 11h18" stroke="#1E88E5" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'billing', label: 'Billing',
    bg: '#fff3e0', color: '#F57C00',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="#F57C00" strokeWidth="1.8"/>
        <path d="M2 9h20" stroke="#F57C00" strokeWidth="1.8"/>
        <circle cx="6" cy="14" r="1.2" fill="#F57C00"/>
      </svg>
    ),
  },
  {
    id: 'reports', label: 'Reports',
    bg: '#ede7f6', color: '#7E57C2',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M6 2h12a1 1 0 011 1v18a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#7E57C2" strokeWidth="1.8"/>
        <path d="M9 9h6M9 13h6M9 17h4" stroke="#7E57C2" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'lab', label: 'Lab',
    bg: '#fce4ec', color: '#E91E63',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 3v8l-4 7a1 1 0 00.9 1.5h12.2a1 1 0 00.9-1.5l-4-7V3" stroke="#E91E63" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 3h6" stroke="#E91E63" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'finance', label: 'Finance',
    bg: '#e0f7fa', color: '#00838F',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00838F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
  },
  {
    id: 'stock', label: 'Medicine Master',
    bg: '#ede9fe', color: '#6d28d9',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#6d28d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export default function QuickActions({ onNavigate, userRole }) {

  const normalizedRole = (userRole || '').toLowerCase()
  const actions = ACTIONS.filter((a) => {
    if (a.id === 'stock' && normalizedRole !== 'pharmacist') return false
    if (a.id === 'billing' && normalizedRole !== 'admin') return false
    if (a.id === 'finance' && normalizedRole !== 'admin') return false
    if (a.id === 'lab' && !['admin', 'doctor', 'receptionist'].includes(normalizedRole)) return false
    return true
  })

  const handleAction = (id) => {
    switch(id) {
      case 'add-patient':
        onNavigate('add-patients')
        break;
      case 'schedule':
        onNavigate('appointments')
        break;
      case 'billing':
        onNavigate('billing')
        break;
      case 'reports':
        onNavigate('reports')
        break;
      case 'lab':
        onNavigate('lab')
        break;
      case 'prescription':
        onNavigate('prescription')
        break;
      case 'pharmacy':
        onNavigate('pharmacy')
        break;
      case 'stock':
        onNavigate('stock')
        break;
      case 'finance':
        onNavigate('income-analytics')
        break;
      default:
        console.log('Action missing:', id)
    }
  }

  return (
    <section className={styles.card} aria-label="Quick Actions">
      <h2 className={styles.title}>Quick Actions</h2>
      <div className={styles.grid}>
        {actions.map(a => (
          <button 
            key={a.id} 
            className={styles.btn} 
            id={`qa-${a.id}`}
            onClick={() => handleAction(a.id)}
          >
            <span className={styles.iconWrap} style={{ background: a.bg }}>
              {a.icon}
            </span>
            <span className={styles.label}>{a.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
