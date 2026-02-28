import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import HealthMonitor from '../components/HealthMonitor'
import EmergencyPanel from '../components/EmergencyPanel'
import AdaptiveUI from '../components/AdaptiveUI'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, emergency, logoutUser } = useUser()

  // Redirect to crisis reported page on emergency (patient only)
  useEffect(() => {
    if (emergency && user?.role === 'patient') {
      navigate('/crisis-reported')
    }
  }, [emergency])

  if (!user) return null

  const s = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #e8eeff 0%, #f5f0ff 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      paddingBottom: 80
    },
    topBar: {
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 20px 16px',
      background: '#fff',
      borderRadius: '0 0 24px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
    },
    topLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    avatar: {
      width: 44, height: 44, borderRadius: '50%',
      background: '#0A84FF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, color: '#fff', fontWeight: 700
    },
    greeting: { fontSize: 18, fontWeight: 700, color: '#1C1C1E' },
    greetSub: { fontSize: 12, color: '#8E8E93' },
    logoutBtn: {
      width: 38, height: 38, borderRadius: '50%',
      background: '#F2F2F7', border: 'none',
      fontSize: 16, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    body: { padding: '16px 16px 0' },
    section: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 15, fontWeight: 700, color: '#1C1C1E',
      marginBottom: 10, marginLeft: 4
    },
    codeCard: {
      background: '#fff', borderRadius: '16px',
      padding: '14px 18px', marginBottom: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between'
    },
    codeLabel: { fontSize: 12, color: '#8E8E93' },
    codeVal: {
      fontSize: 20, fontWeight: 900, color: '#34C759',
      letterSpacing: '4px'
    },
    bottomNav: {
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '480px',
      background: '#0A84FF', padding: '12px 0 16px',
      borderRadius: '20px 20px 0 0',
      display: 'flex', justifyContent: 'space-around',
      boxShadow: '0 -4px 24px rgba(10,132,255,0.3)',
      zIndex: 100
    },
    navItem: {
      textAlign: 'center', color: 'rgba(255,255,255,0.7)',
      fontSize: 10, cursor: 'pointer', background: 'none',
      border: 'none', fontFamily: 'inherit'
    },
    navIcon: { fontSize: 20, marginBottom: 2 },
    navActive: { color: '#fff' }
  }

  return (
    <div style={s.page} className="dashboard-page">
      {/* Top Bar */}
      <div style={s.topBar} className="dashboard-topbar">
        <div style={s.topLeft}>
          <div style={s.avatar}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={s.greeting}>Hi, {user.name}</div>
            <div style={s.greetSub}>Patient Dashboard</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={() => { logoutUser(); navigate('/') }}>
          ✕
        </button>
      </div>

      <div style={s.body} className="dashboard-body">
        {/* Patient Code */}
        {user.patient_code && (
          <div style={s.codeCard}>
            <div>
              <div style={s.codeLabel}>Your Patient Code</div>
              <div style={s.codeVal}>{user.patient_code}</div>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(user.patient_code)}
              style={{
                background: '#F0FFF4', border: 'none',
                borderRadius: '10px', padding: '8px 12px',
                fontSize: 13, cursor: 'pointer', color: '#34C759', fontWeight: 600
              }}
            >📋 Copy</button>
          </div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-col">
            {/* Adaptive mode */}
            <div style={s.section}>
              <div style={s.sectionTitle}>♿ Accessibility Mode</div>
              <AdaptiveUI />
            </div>

            {/* Emergency Panel */}
            <div style={s.section}>
              <div style={s.sectionTitle}>🚨 Emergency Controls</div>
              <EmergencyPanel />
            </div>
          </div>

          <div className="dashboard-col">
            {/* Health Monitor */}
            <div style={s.section}>
              <div style={s.sectionTitle}>📊 Health Monitor</div>
              <HealthMonitor />
            </div>

            {/* Quick Cards */}
            <div style={s.section}>
              <div style={s.sectionTitle}>⚡ Quick Access</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { icon: '📱', label: 'My Device' },
                  { icon: '🗂️', label: 'Archive' },
                  { icon: '💊', label: 'Medication' },
                  { icon: '📍', label: 'Location' }
                ].map((item, i) => (
                  <div key={i} style={{
                    background: '#fff', borderRadius: '18px',
                    padding: '18px 16px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '8px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: '24px' }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0D0D0D' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={s.bottomNav} className="dashboard-bottomnav">
        {[
          { icon: '📍', label: 'Map' },
          { icon: '📋', label: 'Feed' },
          { icon: '💬', label: 'Chat' },
          { icon: '⚙️', label: 'More' }
        ].map((item, i) => (
          <button key={i} style={{ ...s.navItem, ...(i === 1 ? s.navActive : {}) }}>
            <div style={s.navIcon}>{item.icon}</div>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
