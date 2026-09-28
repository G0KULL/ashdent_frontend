import React from 'react'
import { Navigate } from 'react-router-dom'

// Maps a role string to its correct dashboard base path
function getDashboardPath(role) {
  if (!role) return '/login'
  switch (role.toLowerCase()) {
    case 'admin':        return '/admin/dashboard'
    case 'doctor':       return '/doctor/dashboard'
    case 'receptionist': return '/receptionist/dashboard'
    case 'pharmacist':   return '/pharmacist/dashboard'
    case 'pharmicist':   return '/pharmacist/dashboard'
    case 'pharrmicist':  return '/pharmacist/dashboard'
    default:             return '/login'
  }
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const saved = localStorage.getItem('doctosmart_user')

  if (!saved) {
    return <Navigate to="/login" replace />
  }

  try {
    const user = JSON.parse(saved)
    const userRole = user?.role

    if (!userRole) return <Navigate to="/login" replace />

    // If user's role is not in the allowed list → redirect them to THEIR dashboard
    if (!allowedRoles.map(r => r.toLowerCase()).includes(userRole.toLowerCase())) {
      return <Navigate to={getDashboardPath(userRole)} replace />
    }

    return children
  } catch (e) {
    localStorage.removeItem('doctosmart_user')
    return <Navigate to="/login" replace />
  }
}
