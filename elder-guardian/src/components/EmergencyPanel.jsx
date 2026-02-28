import React, { useState } from 'react'
import { useUser } from '../context/UserContext'

/* ── 112 / SOS Widget (Blind mode) ── */
function SOSWidget({ onSOS, on112 }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '24px', padding: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
    }}>
      <div style={{
        width: '200px', height: '220px', background: '#1C1C1E',
        borderRadius: '36px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '10px',
        padding: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      }}>
        <button onClick={on112} style={{
          width: '160px', padding: '16px 0', borderRadius: '18px',
          border: 'none', background: '#FFFFFF', color: '#0D0D0D',
          fontSize: '36px', fontWeight: '800', cursor: 'pointer',
          letterSpacing: '-0.5px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          fontFamily: 'inherit',
        }}>112</button>
        <button onClick={onSOS} style={{
          width: '160px', padding: '14px 0', borderRadius: '18px',
          border: 'none', background: '#E8441A', color: '#FFFFFF',
          fontSize: '28px', fontWeight: '800', cursor: 'pointer',
          letterSpacing: '3px', animation: 'sos-bounce 2s ease-in-out infinite',
          boxShadow: '0 4px 16px rgba(232,68,26,0.55)', fontFamily: 'inherit',
        }}>SOS</button>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: i === 1 ? '20px' : '7px', height: '7px',
            borderRadius: '4px',
            background: i === 1 ? '#0A84FF' : '#D1D1D6',
          }} />
        ))}
      </div>
    </div>
  )
}

export default function EmergencyPanel() {
  const { user, triggerEmergency, heartRate } = useUser()
  const disability = user?.disability || 'None'
  const [fallTriggered, setFallTriggered] = useState(false)

  const handleSOS = async () => { await triggerEmergency('Manual SOS', heartRate) }
  const handleVoice = async () => { await triggerEmergency('Voice Emergency', heartRate) }
  const handleGesture = async () => { await triggerEmergency('Gesture Emergency', heartRate) }
  const handle112 = async () => { await triggerEmergency('Manual SOS', heartRate); alert('📞 Calling 112 — Emergency services alerted!') }
  const handleFall = async () => {
    setFallTriggered(true)
    await triggerEmergency('Fall Detected', heartRate)
  }

  /* ── Blind: show the 112 / SOS widget ── */
  if (disability === 'Blind') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SOSWidget onSOS={handleSOS} on112={handle112} />
        <ActionBtn icon="🫸" label={fallTriggered ? 'Fall Detected!' : 'Simulate Fall'} onClick={handleFall}
          bg={fallTriggered ? '#8E8E93' : '#FF9500'} disabled={fallTriggered} />
      </div>
    )
  }

  /* ── None: all controls ── */
  if (disability === 'None') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SOSWidget onSOS={handleSOS} on112={handle112} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <ActionBtn icon="🎙️" label="Voice Emergency" onClick={handleVoice} bg="#0A84FF" />
          <ActionBtn icon="✋" label="Gesture SOS" onClick={handleGesture} bg="#8e44ad" />
          <ActionBtn icon="🫸" label={fallTriggered ? 'Fall Detected!' : 'Fall Detection'}
            onClick={handleFall} bg={fallTriggered ? '#8E8E93' : '#FF9500'} disabled={fallTriggered} />
          <ActionBtn icon="🆘" label="Manual SOS" onClick={handleSOS} bg="#E8441A" />
        </div>
      </div>
    )
  }

  /* ── Mute ── */
  if (disability === 'Mute') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)', textAlign: 'center',
          fontSize: '14px', color: '#5b2c6f', fontWeight: '600',
        }}>
          ✋ Gesture-based controls active — tap your emergency action below
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <ActionBtn icon="✋" label="Gesture SOS" onClick={handleGesture} bg="#8e44ad" />
          <ActionBtn icon="🆘" label="Manual SOS" onClick={handleSOS} bg="#E8441A" />
          <ActionBtn icon="🫸" label={fallTriggered ? 'Fall Detected!' : 'Fall Detection'}
            onClick={handleFall} bg={fallTriggered ? '#8E8E93' : '#FF9500'} disabled={fallTriggered} />
        </div>
      </div>
    )
  }

  /* ── Deaf: visual-only alert banners ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        background: '#FFF3CD', border: '2px solid #FF9500', borderRadius: '18px',
        padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center',
      }}>
        <span style={{ fontSize: '28px' }}>⚠️</span>
        <div>
          <div style={{ fontWeight: '700', color: '#7D4E00', fontSize: '15px' }}>VISUAL ALERT MODE</div>
          <div style={{ fontSize: '13px', color: '#9A6200', marginTop: '3px' }}>All emergency alerts are shown on-screen. No audio.</div>
        </div>
      </div>
      <ActionBtn icon="🆘" label="Trigger SOS Alert" onClick={handleSOS} bg="#E8441A" />
      <ActionBtn icon="🫸" label={fallTriggered ? '⚠️ Fall Alert Active' : 'Simulate Fall'}
        onClick={handleFall} bg={fallTriggered ? '#8E8E93' : '#FF9500'} disabled={fallTriggered} />
    </div>
  )
}

function ActionBtn({ icon, label, onClick, bg, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '15px 18px', borderRadius: '16px', border: 'none',
      background: bg, color: '#fff', fontSize: '15px', fontWeight: '700',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '8px', opacity: disabled ? 0.65 : 1,
      boxShadow: `0 4px 16px ${bg}55`,
      transition: 'opacity 0.2s, transform 0.15s',
      fontFamily: 'inherit',
    }}>
      {icon} {label}
    </button>
  )
}
