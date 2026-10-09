import StatsCards from '../components/StatsCards'
import DashboardCharts from '../components/DashboardCharts'
import RecentPatients from '../components/RecentPatients'
import UpcomingAppointments from '../components/UpcomingAppointments'
import AppointmentStatus from '../components/AppointmentStatus'
import DashboardCalendar from '../components/DashboardCalendar'
import QuickActions from '../components/QuickActions'
import PendingReminders from '../components/PendingReminders'
import styles from './Dashboard.module.css'
import { useNavigate } from 'react-router-dom'

export default function Dashboard({ userRole }) {
  const navigate = useNavigate()
  const basePath = userRole ? `/${userRole.toLowerCase()}` : '/admin'

  const handleNavigate = (path) => {
    navigate(`${basePath}/${path}`)
  }

  return (
    <>
      <StatsCards onNavigate={handleNavigate} />

      <DashboardCharts />

      <AppointmentStatus />

      <div className={styles.lowerRow1}>
        <DashboardCalendar />
        <QuickActions onNavigate={handleNavigate} userRole={userRole} />
        <RecentPatients />
      </div>

      <div className={styles.lowerRow2}>
        <UpcomingAppointments />
        <PendingReminders />
      </div>
    </>
  )
}
