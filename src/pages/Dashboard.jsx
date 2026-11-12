import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBranch } from '../context/BranchContext'
import StatsCards from '../components/StatsCards'
import DashboardCharts from '../components/DashboardCharts'
import DoctorPerformance from '../components/DoctorPerformance'
import RecentPatients from '../components/RecentPatients'
import UpcomingAppointments from '../components/UpcomingAppointments'
import AppointmentStatus from '../components/AppointmentStatus'
import DashboardCalendar from '../components/DashboardCalendar'
import QuickActions from '../components/QuickActions'
import PendingReminders from '../components/PendingReminders'
import styles from './Dashboard.module.css'

export default function Dashboard({ userRole }) {
  const navigate = useNavigate()
  const { activeCompany, companies, switchCompany } = useBranch()
  const basePath = userRole ? `/${userRole.toLowerCase()}` : '/admin'

  const user = JSON.parse(
    localStorage.getItem('ashdent_user') ||
    localStorage.getItem('doctosmart_user') ||
    '{}'
  )
  const isSuperAdmin = Boolean(
    user?.is_superuser === true ||
    user?.role === 'Super Admin' ||
    userRole === 'Super Admin'
  )

  const handleNavigate = (path) => {
    navigate(`${basePath}/${path}`)
  }

  if (isSuperAdmin && !activeCompany?.id) {
    return (
      <div style={{
        padding: '32px 24px',
        maxWidth: '850px',
        margin: '40px auto',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(14, 165, 233, 0.15))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          margin: '0 auto 16px'
        }}>
          🏢
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Select Company Context
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
          You are signed in as <strong>Super Admin</strong>. Please select a company from the left sidebar to view clinic metrics, appointments, and patient records, or manage companies below.
        </p>

        {Array.isArray(companies) && companies.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            {companies.filter(c => c.is_active !== false).map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => switchCompany(c)}
                style={{
                  padding: '8px 16px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#1e293b',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#ecfdf5'
                  e.currentTarget.style.borderColor = '#10b981'
                  e.currentTarget.style.color = '#059669'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = '#f8fafc'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.color = '#1e293b'
                }}
              >
                🏢 {c.name} ({c.code})
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/admin/company-management')}
          style={{
            padding: '10px 22px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
        >
          Open Company Management
        </button>
      </div>
    )
  }

  return (
    <>
      <StatsCards onNavigate={handleNavigate} />

      <DashboardCharts />

      <DoctorPerformance userRole={userRole} />

      <AppointmentStatus />

      <div className={styles.lowerRow1}>
        <DashboardCalendar />
        <QuickActions onNavigate={handleNavigate} userRole={userRole} />
        <RecentPatients onNavigate={handleNavigate} />
      </div>

      <div className={styles.lowerRow2}>
        <UpcomingAppointments onNavigate={handleNavigate} />
        <PendingReminders onNavigate={handleNavigate} />
      </div>
    </>
  )
}
