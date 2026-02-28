import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #e8eeff 0%, #f5f0ff 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    padding: '20px'
  },
  card: {
    background: '#fff', borderRadius: '28px',
    padding: '40px 32px', width: '100%', maxWidth: '440px',
    boxShadow: '0 8px 40px rgba(10,132,255,0.10)'
  },
  logo: {
    width: 56, height: 56, background: '#0A84FF',
    borderRadius: '16px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 28, marginBottom: 20
  },
  title: { fontSize: 26, fontWeight: 700, color: '#1C1C1E', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8E8E93', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: 600, color: '#3A3A3C', marginBottom: 6, display: 'block' },
  input: {
    width: '100%', padding: '13px 16px', borderRadius: '14px',
    border: '1.5px solid #E5E5EA', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', background: '#F9F9FB',
    marginBottom: 16, fontFamily: 'inherit'
  },
  select: {
    width: '100%', padding: '13px 16px', borderRadius: '14px',
    border: '1.5px solid #E5E5EA', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', background: '#F9F9FB',
    marginBottom: 16, fontFamily: 'inherit', appearance: 'none'
  },
  btn: {
    width: '100%', padding: '15px', background: '#0A84FF',
    color: '#fff', border: 'none', borderRadius: '14px',
    fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8
  },
  error: { color: '#FF3B30', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  roleContainer: {
    display: 'flex', gap: 12, marginBottom: 24
  },
  roleBtn: (active) => ({
    flex: 1, padding: '16px', borderRadius: '16px',
    border: active ? '2px solid #0A84FF' : '2px solid #E5E5EA',
    background: active ? '#EBF4FF' : '#F9F9FB',
    textAlign: 'center', cursor: 'pointer',
    transition: 'all 0.2s ease'
  }),
  roleIcon: { fontSize: 32, marginBottom: 6 },
  roleLabel: (active) => ({
    fontSize: 14, fontWeight: 700,
    color: active ? '#0A84FF' : '#8E8E93'
  }),
  codeDisplay: {
    background: '#F0FFF4', border: '2px dashed #34C759',
    borderRadius: '16px', padding: '16px',
    textAlign: 'center', marginBottom: 20
  },
  codeText: {
    fontSize: 32, fontWeight: 900, color: '#34C759',
    letterSpacing: '6px'
  },
  codeHint: { fontSize: 12, color: '#8E8E93', marginTop: 6 }
}

export default function Register() {
  const navigate = useNavigate()
  const { registerPatient, registerCaregiver } = useUser()
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patientCode, setPatientCode] = useState(null)

  const [patientForm, setPatientForm] = useState({
    name: '', age: '', disability: 'None'
  })

  const [caregiverForm, setCaregiverForm] = useState({
    name: '', email: '', linkCode: ''
  })

  const handlePatientSubmit = async (e) => {
    e.preventDefault()
    if (!patientForm.name || !patientForm.age) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')
    const result = await registerPatient(patientForm)
    setLoading(false)
    if (!result) {
      setError('Failed to save. Check your Supabase connection.')
      return
    }
    setPatientCode(result.patient_code)
  }

  const handleCaregiverSubmit = async (e) => {
    e.preventDefault()
    if (!caregiverForm.name || !caregiverForm.linkCode) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')
    const result = await registerCaregiver(caregiverForm)
    setLoading(false)
    if (!result) {
      setError('Invalid patient code or connection error.')
      return
    }
    navigate('/caregiver')
  }

  const proceedToDashboard = () => {
    navigate('/dashboard')
  }

  // ── Role Selection Screen ──
  if (!role) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.logo}>🛡️</div>
          <div style={s.title}>Elder Guardian</div>
          <div style={s.subtitle}>Choose your role to get started</div>
          <div style={s.roleContainer}>
            <div style={s.roleBtn(false)} onClick={() => setRole('patient')}>
              <div style={s.roleIcon}>👴</div>
              <div style={s.roleLabel(false)}>I'm a Patient</div>
              <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 4 }}>
                Need monitoring & assistance
              </div>
            </div>
            <div style={s.roleBtn(false)} onClick={() => setRole('caregiver')}>
              <div style={s.roleIcon}>👩‍⚕️</div>
              <div style={s.roleLabel(false)}>I'm a Caregiver</div>
              <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 4 }}>
                Monitor & respond to alerts
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Patient Code Success Screen ──
  if (patientCode) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={s.title}>Registration Complete!</div>
            <div style={s.subtitle}>Share this code with your caregiver</div>
          </div>
          <div style={s.codeDisplay}>
            <div style={s.codeText}>{patientCode}</div>
            <div style={s.codeHint}>Your unique Patient Code</div>
          </div>
          <div style={{ fontSize: 13, color: '#8E8E93', textAlign: 'center', marginBottom: 20 }}>
            Your caregiver will use this code to link to your profile and receive your emergency alerts in realtime.
          </div>
          <button style={s.btn} onClick={proceedToDashboard}>
            Go to Dashboard →
          </button>
          <button
            style={{ ...s.btn, background: '#F2F2F7', color: '#1C1C1E', marginTop: 10 }}
            onClick={() => { navigator.clipboard.writeText(patientCode) }}
          >
            📋 Copy Code
          </button>
        </div>
      </div>
    )
  }

  // ── Patient Registration ──
  if (role === 'patient') {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button
              onClick={() => { setRole(null); setError('') }}
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#0A84FF' }}
            >←</button>
            <div style={s.logo}>👴</div>
          </div>
          <div style={s.title}>Patient Registration</div>
          <div style={s.subtitle}>Set up your profile for monitoring</div>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={handlePatientSubmit}>
            <label style={s.label}>Full Name *</label>
            <input style={s.input} placeholder="Enter your name"
              value={patientForm.name}
              onChange={e => setPatientForm(p => ({ ...p, name: e.target.value }))} />

            <label style={s.label}>Age *</label>
            <input style={s.input} type="number" placeholder="Enter your age"
              value={patientForm.age}
              onChange={e => setPatientForm(p => ({ ...p, age: e.target.value }))} />

            <label style={s.label}>Disability Type</label>
            <select style={s.select} value={patientForm.disability}
              onChange={e => setPatientForm(p => ({ ...p, disability: e.target.value }))}>
              <option value="None">None</option>
              <option value="Blind">Blind</option>
              <option value="Deaf">Deaf</option>
              <option value="Mute">Mute</option>
            </select>

            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Register as Patient →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Caregiver Registration ──
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => { setRole(null); setError('') }}
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#0A84FF' }}
          >←</button>
          <div style={{ ...s.logo, background: '#34C759' }}>👩‍⚕️</div>
        </div>
        <div style={s.title}>Caregiver Registration</div>
        <div style={s.subtitle}>Link to a patient to start monitoring</div>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleCaregiverSubmit}>
          <label style={s.label}>Your Name *</label>
          <input style={s.input} placeholder="Enter your name"
            value={caregiverForm.name}
            onChange={e => setCaregiverForm(p => ({ ...p, name: e.target.value }))} />

          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="your@email.com"
            value={caregiverForm.email}
            onChange={e => setCaregiverForm(p => ({ ...p, email: e.target.value }))} />

          <label style={s.label}>Patient Code *</label>
          <input style={{ ...s.input, letterSpacing: '4px', fontSize: 20, fontWeight: 700, textAlign: 'center' }}
            placeholder="000000" maxLength={6}
            value={caregiverForm.linkCode}
            onChange={e => setCaregiverForm(p => ({ ...p, linkCode: e.target.value.toUpperCase() }))} />

          <div style={{ fontSize: 12, color: '#8E8E93', marginBottom: 16, textAlign: 'center' }}>
            Ask the patient for their 6-digit code
          </div>

          <button style={{ ...s.btn, background: '#34C759' }} type="submit" disabled={loading}>
            {loading ? 'Linking...' : 'Link & Start Monitoring →'}
          </button>
        </form>
      </div>
    </div>
  )
}
