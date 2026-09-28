import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PatientProvider } from './context/PatientContext'
import LoginPage from './components/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'

import AdminLayout from './layouts/AdminLayout'
import DoctorLayout from './layouts/DoctorLayout'
import ReceptionLayout from './layouts/ReceptionLayout'
import PharmacyLayout from './layouts/PharmacyLayout'
import PharmacistLayout from './layouts/PharmacistLayout'

import Dashboard from './pages/Dashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import ReceptionDashboard from './pages/ReceptionDashboard'
import PharmacyDashboard from './pages/PharmacyDashboard'
import PharmacistDashboard from './pages/PharmacistDashboard'
import PharmacySales from './pages/PharmacySales'

import DoctorSlots from './components/DoctorSlots'
import SearchPatient from './components/SearchPatient'
import Appointments from './components/Appointments'
import TodayPatients from './components/TodayPatients'
import Reports from './components/Reports'
import TreatmentRates from './components/TreatmentRates'
import Bills from './components/Bills'
import PreBookings from './components/PreBookings'
import FollowUps from './components/FollowUps'
import Communication from './components/Communication'
import Pharmacy from './components/Pharmacy'
import UserManagement from './components/UserManagement'
import StaffSignupPage from './components/StaffSignupPage'
import Doctors from './components/Doctors'
import PrescriptionView from './components/PrescriptionView'
import IncomeAnalytics from './components/IncomeAnalytics'
import Transactions from './components/Transactions'
import MaterialPurchase from './components/MaterialPurchase'


import PathologyLabSettings from './components/PathologyLabSettings'
import DentalLabSettings from './components/DentalLabSettings'
import TeleMedicine from './components/TeleMedicine'
import WebsiteAppointments from './components/WebsiteAppointments'
import DoctorIncome from './pages/DoctorIncome'
import ConsultationPage from './components/ConsultationPage'
import ConsultationWorkspace from './pages/ConsultationWorkspace'
import TreatmentCases from './pages/TreatmentCases'
import CreateCaseForm from './pages/CreateCaseForm'
import TreatmentPlansPage from './pages/TreatmentPlansPage'
import NewTreatmentCaseForm from './pages/NewTreatmentCaseForm'
import ExistingCaseSheet from './pages/ExistingCaseSheet'
import OdontogramPage from './pages/OdontogramPage'
import DiagnosisPage from './pages/DiagnosisPage'
import ClinicalWorkflow from './pages/ClinicalWorkflow'
import './App.css'

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('doctosmart_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        localStorage.removeItem('doctosmart_user')
      }
    }
    return null
  })

  const getDashboardPath = (role) => {
    if (!role) return '/login'
    switch (role.toLowerCase()) {
      case 'admin': return '/admin/dashboard'
      case 'doctor': return '/doctor/dashboard'
      case 'receptionist': return '/receptionist/dashboard'
      case 'pharmacist': return '/pharmacist/dashboard'
      case 'pharmicist': return '/pharmacist/dashboard'
      case 'pharrmicist': return '/pharmacist/dashboard'
      case 'pharmacy': return '/pharmacy/dashboard'
      default: return '/login'
    }
  }

  return (
    <PatientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={currentUser ? <Navigate to={getDashboardPath(currentUser.role)} replace /> : <LoginPage onLogin={(u) => {
            localStorage.setItem('doctosmart_user', JSON.stringify(u))
            // Hard redirect ensures no stale React state causes wrong dashboard
            window.location.href = getDashboardPath(u.role)
          }} />} />

          <Route path="/" element={<Navigate to={currentUser ? getDashboardPath(currentUser.role) : "/login"} replace />} />

          {/* ADMIN ROUTES */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminLayout currentUser={currentUser} /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard userRole="Admin" />} />
            <Route path="search-patient" element={<SearchPatient userRole="Admin" />} />
            <Route path="today-patients" element={<TodayPatients userRole="Admin" />} />
            <Route path="appointments" element={<Appointments userRole="Admin" />} />
            <Route path="consultation/:appointmentId" element={<ConsultationPage userRole="Admin" />} />
            <Route path="consultation-workspace/:caseId" element={<ConsultationWorkspace />} />
            <Route path="consultation-cases/:patientId" element={<TreatmentCases />} />
            <Route path="create-case/:patientId" element={<CreateCaseForm />} />
            <Route path="odontogram/:patientId" element={<OdontogramPage />} />
            <Route path="treatment-plans/:caseId" element={<TreatmentPlansPage />} />
            <Route path="new-treatment-case/:patientId" element={<NewTreatmentCaseForm />} />
            <Route path="case-sheet/:caseId" element={<ExistingCaseSheet />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="pre-bookings" element={<PreBookings />} />
            <Route path="treatment-rates" element={<TreatmentRates />} />
            <Route path="reports" element={<Reports />} />
            <Route path="income-analytics" element={<IncomeAnalytics />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="billing" element={<Bills />} />
            <Route path="communication" element={<Communication />} />
            <Route path="material-purchases" element={<MaterialPurchase />} />
            <Route path="purchases" element={<Pharmacy userRole="Admin" initialTab="purchases" />} />
            <Route path="pharmacy" element={<Pharmacy userRole="Admin" initialTab="queue" />} />
            <Route path="stock" element={<Pharmacy userRole="Admin" initialTab="stock" />} />
            <Route path="prescriptions" element={<PrescriptionView />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="staff-signup" element={<StaffSignupPage />} />
            <Route path="doctors" element={<Doctors />} />

            <Route path="pathology-lab" element={<PathologyLabSettings />} />
            <Route path="dental-lab" element={<DentalLabSettings />} />
            <Route path="tele-medicine" element={<TeleMedicine userRole="Admin" />} />
            <Route path="website-appointment" element={<WebsiteAppointments userRole="Admin" />} />
          </Route>

          {/* DOCTOR ROUTES */}
          <Route path="/doctor" element={<ProtectedRoute allowedRoles={['Doctor', 'Admin']}><DoctorLayout currentUser={currentUser} /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboard userRole="Doctor" currentUser={currentUser} />} />
            <Route path="doctor-dashboard" element={<DoctorDashboard userRole="Doctor" currentUser={currentUser} />} />
            <Route path="doctor-slots" element={<DoctorSlots />} />
            <Route path="search-patient" element={<SearchPatient userRole="Doctor" />} />
            <Route path="today-patients" element={<TodayPatients userRole="Doctor" />} />
            <Route path="appointments" element={<Appointments userRole="Doctor" />} />
            <Route path="consultation/:appointmentId" element={<ConsultationPage userRole="Doctor" />} />
            <Route path="consultation-workspace/:caseId" element={<ConsultationWorkspace />} />
            <Route path="consultation-cases/:patientId" element={<TreatmentCases />} />
            <Route path="create-case/:patientId" element={<CreateCaseForm />} />
            <Route path="odontogram/:patientId" element={<OdontogramPage />} />
            <Route path="diagnosis/:caseId" element={<DiagnosisPage />} />
            <Route path="clinical-workflow/:caseId" element={<ClinicalWorkflow />} />
            <Route path="treatment-plans/:caseId" element={<TreatmentPlansPage />} />
            <Route path="new-treatment-case/:patientId" element={<NewTreatmentCaseForm />} />
            <Route path="case-sheet/:caseId" element={<ExistingCaseSheet />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="pre-bookings" element={<PreBookings />} />
            <Route path="tele-medicine" element={<TeleMedicine userRole="Doctor" />} />
            <Route path="website-appointment" element={<WebsiteAppointments userRole="Doctor" />} />
            <Route path="communication" element={<Communication />} />
            <Route path="reports" element={<Reports />} />
            <Route path="income" element={<DoctorIncome currentUser={currentUser} />} />
            <Route path="prescriptions" element={<PrescriptionView />} />
          </Route>

          {/* RECEPTION ROUTES */}
          <Route path="/receptionist" element={<ProtectedRoute allowedRoles={['Receptionist', 'Admin']}><ReceptionLayout currentUser={currentUser} /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ReceptionDashboard currentUser={currentUser} />} />
            <Route path="search-patient" element={<SearchPatient userRole="Receptionist" />} />
            <Route path="today-patients" element={<TodayPatients userRole="Receptionist" />} />
            <Route path="appointments" element={<Appointments userRole="Receptionist" />} />
            <Route path="consultation/:appointmentId" element={<ConsultationPage userRole="Receptionist" />} />
            <Route path="consultation-workspace/:caseId" element={<ConsultationWorkspace />} />
            <Route path="consultation-cases/:patientId" element={<TreatmentCases />} />
            <Route path="create-case/:patientId" element={<CreateCaseForm />} />
            <Route path="odontogram/:patientId" element={<OdontogramPage />} />
            <Route path="diagnosis/:caseId" element={<DiagnosisPage />} />
            <Route path="treatment-plans/:caseId" element={<TreatmentPlansPage />} />
            <Route path="new-treatment-case/:patientId" element={<NewTreatmentCaseForm />} />
            <Route path="case-sheet/:caseId" element={<ExistingCaseSheet />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="pre-bookings" element={<PreBookings />} />
            <Route path="tele-medicine" element={<TeleMedicine userRole="Receptionist" />} />
            <Route path="website-appointment" element={<WebsiteAppointments userRole="Receptionist" />} />
            <Route path="material-purchases" element={<MaterialPurchase />} />
            <Route path="billing" element={<Bills />} />
            <Route path="pharmacy" element={<Pharmacy userRole="Receptionist" initialTab="queue" />} />
          </Route>

          {/* PHARMACIST ROUTES */}
          <Route path="/pharmacist" element={<ProtectedRoute allowedRoles={['Pharmacist', 'pharmicist', 'pharrmicist', 'Admin']}><PharmacistLayout currentUser={currentUser} /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PharmacistDashboard currentUser={currentUser} />} />
            <Route path="sales" element={<PharmacySales currentUser={currentUser} />} />
            <Route path="pharmacy" element={<Pharmacy userRole="Pharmacist" initialTab="queue" />} />
            <Route path="material-purchases" element={<MaterialPurchase />} />
            <Route path="purchases" element={<Pharmacy userRole="Pharmacist" initialTab="purchases" />} />
            <Route path="stock" element={<Pharmacy userRole="Pharmacist" initialTab="stock" />} />
            <Route path="prescriptions" element={<PrescriptionView />} />
            <Route path="billing" element={<Bills />} />
          </Route>

          {/* PHARMACY ROUTES */}
          <Route path="/pharmacy" element={<ProtectedRoute allowedRoles={['Pharmacy', 'pharmacy', 'Admin']}><PharmacyLayout currentUser={currentUser} /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PharmacyDashboard currentUser={currentUser} />} />
            <Route path="sales" element={<PharmacySales currentUser={currentUser} />} />
            <Route path="pharmacy" element={<Pharmacy userRole="Pharmacy" initialTab="queue" />} />
            <Route path="purchases" element={<Pharmacy userRole="Pharmacy" initialTab="purchases" />} />
            <Route path="stock" element={<Pharmacy userRole="Pharmacy" initialTab="stock" />} />
            <Route path="prescriptions" element={<PrescriptionView />} />
            <Route path="billing" element={<Bills />} />
          </Route>

          {/* STANDALONE STAFF SIGNUP / ONBOARDING ROUTE */}
          <Route path="/staff/signup" element={<ProtectedRoute allowedRoles={['Admin']}><StaffSignupPage /></ProtectedRoute>} />

          {/* Fallbacks for typos */}
          <Route path="/receptionistt/*" element={<Navigate to="/receptionist/dashboard" replace />} />
          <Route path="/pharmicist/*" element={<Navigate to="/pharmacist/dashboard" replace />} />
          <Route path="/pharrmicist/*" element={<Navigate to="/pharmacist/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </PatientProvider>
  )
}
