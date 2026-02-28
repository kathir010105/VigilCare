import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Caregiver from './pages/Caregiver'
import CrisisReported from './pages/CrisisReported'

function ProtectedRoute({ children, role }) {
  const { user } = useUser()
  if (!user) return <Navigate to="/" />
  if (role && user.role !== role) return <Navigate to="/" />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/dashboard" element={
        <ProtectedRoute role="patient"><Dashboard /></ProtectedRoute>
      } />
      <Route path="/crisis-reported" element={
        <ProtectedRoute role="patient"><CrisisReported /></ProtectedRoute>
      } />
      <Route path="/caregiver" element={
        <ProtectedRoute role="caregiver"><Caregiver /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <UserProvider>
      <Router>
        <AppRoutes />
      </Router>
    </UserProvider>
  )
}
