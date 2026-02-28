import React from 'react'
import { useUser } from '../context/UserContext'

const modes = {
  Blind: { icon: '👁️', label: 'Voice Mode Active', color: '#FF9500', bg: '#FFF8E7', desc: 'UI optimized for voice commands' },
  Deaf:  { icon: '👂', label: 'Visual Mode Active', color: '#0A84FF', bg: '#EBF4FF', desc: 'All alerts shown as visual text' },
  Mute:  { icon: '🤐', label: 'Gesture Mode Active', color: '#AF52DE', bg: '#F5EEFF', desc: 'Gesture-based emergency controls' },
  None:  { icon: '✅', label: 'All Features Active', color: '#34C759', bg: '#F0FFF4', desc: 'Full access to all features' }
}

export default function AdaptiveUI() {
  const { user } = useUser()
  const m = modes[user?.disability] || modes.None

  return (
    <div style={{
      background: m.bg, borderRadius: '16px',
      padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      border: `1.5px solid ${m.color}20`
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '12px',
        background: '#fff', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0
      }}>{m.icon}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.label}</div>
        <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>{m.desc}</div>
      </div>
    </div>
  )
}
