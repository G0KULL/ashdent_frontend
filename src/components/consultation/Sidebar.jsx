import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Users, Activity, 
  Pill, FileText, PieChart, Package, 
  MessageSquare, Settings, LogOut
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor/dashboard' },
    { icon: Calendar, label: 'Appointments', path: '/appointments' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: Activity, label: 'Treatment Cases', path: '/cases', active: true },
    { icon: Pill, label: 'Prescriptions', path: '/prescriptions' },
    { icon: FileText, label: 'Billing', path: '/billing' },
    { icon: PieChart, label: 'Reports', path: '/reports' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div style={{
      width: '260px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: '#14b8a6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
          D
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>DentalHMS</span>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
        {navItems.map((item, index) => (
          <div 
            key={index} 
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: item.active ? '#f0fdfa' : 'transparent',
              color: item.active ? '#0d9488' : '#64748b',
              marginBottom: '0.25rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { if (!item.active) { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#334155' } }}
            onMouseLeave={(e) => { if (!item.active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b' } }}
          >
            <item.icon size={20} />
            <span style={{ fontWeight: item.active ? '600' : '500' }}>{item.label}</span>
          </div>
        ))}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '0.5rem', marginTop: 0 }}>Today's Appts</h4>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>12 <span style={{fontSize:'0.875rem', color:'#10b981'}}>Remaining</span></div>
        </div>

        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#ef4444',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <LogOut size={20} />
          <span style={{ fontWeight: '500' }}>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
