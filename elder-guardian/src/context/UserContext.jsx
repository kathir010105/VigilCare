import React, { createContext, useContext, useState } from 'react'
import { supabase } from '../supabaseClient'

const UserContext = createContext(null)

// Generate 6-digit code
const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [linkedPatients, setLinkedPatients] = useState([])
  const [emergency, setEmergency] = useState(null)
  const [heartRate, setHeartRate] = useState(72)

  // ── Patient Registration ─────────────────────────────────────
  const registerPatient = async (formData) => {
    const code = generateCode()
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name: formData.name,
        age: parseInt(formData.age),
        disability_type: formData.disability,
        role: 'patient',
        patient_code: code
      }])
      .select()
      .single()

    if (error) {
      console.error('Patient register error:', error.message)
      return null
    }

    const fullUser = {
      id: data.id,
      name: data.name,
      age: data.age,
      disability: data.disability_type,
      role: 'patient',
      patient_code: data.patient_code
    }
    setUser(fullUser)
    return { ...fullUser, patient_code: data.patient_code }
  }

  // ── Caregiver Registration ───────────────────────────────────
  const registerCaregiver = async (formData) => {
    // 1) Find patient by code
    const { data: patient, error: findErr } = await supabase
      .from('users')
      .select('id, name, age, disability_type, patient_code')
      .eq('patient_code', formData.linkCode)
      .eq('role', 'patient')
      .single()

    if (findErr || !patient) {
      console.error('Patient not found:', findErr?.message)
      return null
    }

    // 2) Create caregiver user
    const { data: caregiver, error: cgErr } = await supabase
      .from('users')
      .insert([{
        name: formData.name,
        age: 0,
        disability_type: 'None',
        role: 'caregiver',
        caregiver_email: formData.email || null,
        patient_code: null
      }])
      .select()
      .single()

    if (cgErr) {
      console.error('Caregiver register error:', cgErr.message)
      return null
    }

    // 3) Create link
    const { error: linkErr } = await supabase
      .from('caregiver_links')
      .insert([{
        caregiver_id: caregiver.id,
        patient_id: patient.id
      }])

    if (linkErr) {
      console.error('Link error:', linkErr.message)
      return null
    }

    const fullUser = {
      id: caregiver.id,
      name: caregiver.name,
      role: 'caregiver',
      email: formData.email
    }
    setUser(fullUser)
    setLinkedPatients([{
      id: patient.id,
      name: patient.name,
      age: patient.age,
      disability: patient.disability_type,
      patient_code: patient.patient_code
    }])
    return fullUser
  }

  // ── Log heart rate ───────────────────────────────────────────
  const logHeartRate = async (rate, userId) => {
    if (!userId) return
    const status =
      rate < 50 || rate > 120 ? 'Critical' :
      rate < 60 || rate > 100 ? 'Warning' : 'Normal'

    await supabase.from('health_logs').insert([{
      user_id: userId,
      heart_rate: rate,
      status
    }])
  }

  // ── Trigger emergency (patient only) ─────────────────────────
  const triggerEmergency = async (type, currentHeartRate = heartRate) => {
    if (!user?.id || user.role !== 'patient') return

    const risk =
      type === 'Heart Rate Critical' ? 'HIGH' :
      type === 'Fall Detected'       ? 'HIGH' :
      type === 'Manual SOS'          ? 'HIGH' :
      type === 'Voice Emergency'     ? 'MEDIUM' :
      type === 'Gesture Emergency'   ? 'MEDIUM' : 'LOW'

    const event = {
      type, risk,
      heartRate: currentHeartRate,
      timestamp: new Date().toISOString(),
      userName: user.name,
      disability: user.disability
    }
    setEmergency(event)

    await supabase.from('emergency_events').insert([{
      user_id: user.id,
      event_type: type,
      risk_level: risk,
      heart_rate: currentHeartRate,
      disability_type: user.disability
    }])

    if (type === 'Fall Detected') {
      await supabase.from('fall_events').insert([{
        user_id: user.id,
        confirmed: false,
        location_note: 'Home'
      }])
    }
  }

  // ── Resolve (caregiver) ──────────────────────────────────────
  const resolveEmergency = () => {
    setEmergency(null)
  }

  // ── Dismiss crisis (patient side) ────────────────────────────
  const dismissCrisis = () => {
    setEmergency(null)
  }

  // ── Logout ───────────────────────────────────────────────────
  const logoutUser = () => {
    setUser(null)
    setEmergency(null)
    setLinkedPatients([])
    setHeartRate(72)
  }

  return (
    <UserContext.Provider value={{
      user, setUser,
      linkedPatients, setLinkedPatients,
      emergency, setEmergency,
      heartRate, setHeartRate,
      registerPatient,
      registerCaregiver,
      triggerEmergency,
      resolveEmergency,
      dismissCrisis,
      logHeartRate,
      logoutUser
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
