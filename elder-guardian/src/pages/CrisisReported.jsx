import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export default function CrisisReported() {
  const navigate = useNavigate()
  const { emergency, dismissCrisis, user } = useUser()
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!emergency) {
      const t = setTimeout(() => navigate('/dashboard'), 2000)
      return () => clearTimeout(t)
    }
  }, [emergency])

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const riskColor = {
    HIGH:   { bg: '#FFF0F0', text: '#FF3B30', ring: '#FF3B30' },
    MEDIUM: { bg: '#FFF8E7', text: '#FF9500', ring: '#FF9500' },
    LOW:    { bg: '#F0FFF4', text: '#34C759', ring: '#34C759' }
  }

  const r = emergency?.risk || 'HIGH'
  const rc = riskColor[r]

  const st = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #e8eeff 0%, #f5f0ff 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center'
    },
    pulseRing: {
      width: 140, height: 140, borderRadius: '50%',
      border: `4px solid ${rc?.ring || '#FF3B30'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'crisisPulse 2s ease-in-out infinite',
      marginBottom: 28
    },
    innerCircle: {
      width: 100, height: 100, borderRadius: '50%',
      background: rc?.bg || '#FFF0F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 42
    },
    title: { fontSize: 24, fontWeight: 800, color: '#1C1C1E', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#8E8E93', marginBottom: 28, maxWidth: 300 },
    card: {
      background: '#fff', borderRadius: '24px',
      padding: '24px', width: '100%', maxWidth: 380,
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      marginBottom: 20
    },
    row: {
      display: 'flex', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: '1px solid #F2F2F7'
    },
    rowLabel: { fontSize: 13, color: '#8E8E93' },
    rowVal: { fontSize: 13, fontWeight: 600, color: '#1C1C1E' },
    riskBadge: {
      display: 'inline-block', padding: '4px 14px',
      borderRadius: '20px', fontSize: 13, fontWeight: 700,
      background: rc?.bg, color: rc?.text
    },
    timer: {
      fontSize: 28, fontWeight: 800, color: '#0A84FF',
      marginBottom: 4
    },
    timerLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 24 },
    btn: {
      width: '100%', maxWidth: 380, padding: '15px',
      background: '#0A84FF', color: '#fff',
      border: 'none', borderRadius: '14px',
      fontSize: 16, fontWeight: 700, cursor: 'pointer',
      marginBottom: 10, fontFamily: 'inherit'
    },
    btnSecondary: {
      width: '100%', maxWidth: 380, padding: '15px',
      background: '#F2F2F7', color: '#1C1C1E',
      border: 'none', borderRadius: '14px',
      fontSize: 16, fontWeight: 700, cursor: 'pointer',
      fontFamily: 'inherit'
    },
    statusDot: {
      width: 8, height: 8, borderRadius: '50%',
      background: '#34C759', display: 'inline-block',
      marginRight: 6, animation: 'blink 1.5s infinite'
    }
  }

  return (
    <div style={st.page}>
      <style>{`
        @keyframes crisisPulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%     { transform: scale(1.08); opacity: 0.8; }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.3; }
        }
      `}</style>

      <div style={st.pulseRing}>
        <div style={st.innerCircle}>🚨</div>
      </div>

      <div style={st.title}>Emergency Reported</div>
      <div style={st.subtitle}>
        Your emergency has been sent to your caregiver. Help is on the way.
      </div>

      <div style={st.timer}>{fmt(seconds)}</div>
      <div style={st.timerLabel}>Time since alert</div>

      {emergency && (
        <div style={st.card} className="crisis-card">
          <div style={st.row}>
            <span style={st.rowLabel}>Emergency Type</span>
            <span style={st.rowVal}>{emergency.type}</span>
          </div>
          <div style={st.row}>
            <span style={st.rowLabel}>Risk Level</span>
            <span style={st.riskBadge}>{emergency.risk}</span>
          </div>
          <div style={st.row}>
            <span style={st.rowLabel}>Heart Rate</span>
            <span style={st.rowVal}>{emergency.heartRate} BPM</span>
          </div>
          <div style={st.row}>
            <span style={st.rowLabel}>Time</span>
            <span style={st.rowVal}>
              {new Date(emergency.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div style={{ ...st.row, borderBottom: 'none' }}>
            <span style={st.rowLabel}>Status</span>
            <span style={st.rowVal}>
              <span style={st.statusDot}></span>
              Caregiver Notified
            </span>
          </div>
        </div>
      )}

      <button style={st.btn} onClick={() => navigate('/dashboard')}>
        ← Back to Dashboard
      </button>
      <button style={st.btnSecondary} onClick={dismissCrisis}>
        Dismiss Alert
      </button>
    </div>
  )
}
