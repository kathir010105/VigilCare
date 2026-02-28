import React, { useEffect, useRef, useState } from 'react'
import { useUser } from '../context/UserContext'

export default function HealthMonitor() {
  const { user, heartRate, setHeartRate, triggerEmergency, logHeartRate } = useUser()
  const emergencyFiredRef = useRef(false)
  const [simulating, setSimulating] = useState(false)
  const simRef = useRef(false)

  // Normal fluctuation (60–95 BPM)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (simRef.current) return // skip normal tick during simulation
      const rate = Math.floor(Math.random() * 36) + 60 // 60–95
      setHeartRate(rate)
      await logHeartRate(rate, user?.id)
    }, 2000)
    return () => clearInterval(interval)
  }, [user?.id])

  // Simulation: ramp heart rate up to critical
  const startSimulation = () => {
    if (simulating) return
    setSimulating(true)
    simRef.current = true
    let current = heartRate
    const ramp = setInterval(async () => {
      current += Math.floor(Math.random() * 8) + 5 // +5 to +12 each tick
      setHeartRate(current)
      await logHeartRate(current, user?.id)

      if (current > 120 && !emergencyFiredRef.current) {
        emergencyFiredRef.current = true
        await triggerEmergency('Heart Rate Critical', current)
        setTimeout(() => { emergencyFiredRef.current = false }, 10000)
      }

      if (current >= 150) {
        clearInterval(ramp)
        // Cool down back to normal over a few seconds
        const cooldown = setInterval(() => {
          current -= Math.floor(Math.random() * 10) + 5
          if (current <= 80) {
            current = Math.floor(Math.random() * 16) + 70
            clearInterval(cooldown)
            setSimulating(false)
            simRef.current = false
          }
          setHeartRate(current)
        }, 800)
      }
    }, 700)
  }

  const status =
    heartRate < 50 || heartRate > 120 ? 'Critical' :
    heartRate < 60 || heartRate > 100 ? 'Warning' : 'Normal'

  const color =
    status === 'Critical' ? '#FF3B30' :
    status === 'Warning'  ? '#FF9500' : '#34C759'

  return (
    <div className="health-monitor" style={{
      background: '#fff', borderRadius: '20px',
      padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: '#8E8E93' }}>❤️ Heart Rate Monitor</div>
        <button onClick={startSimulation} disabled={simulating} style={{
          padding: '6px 14px', borderRadius: '10px', border: 'none',
          background: simulating ? '#8E8E93' : '#FF3B30', color: '#fff',
          fontSize: 12, fontWeight: 700, cursor: simulating ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', opacity: simulating ? 0.7 : 1,
          animation: simulating ? 'simPulse 1s infinite' : 'none',
        }}>
          {simulating ? '⏳ Simulating...' : '⚡ Simulate Crisis'}
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color }}>{heartRate}</div>
        <div style={{ fontSize: 16, color: '#8E8E93' }}>BPM</div>
      </div>
      <div style={{
        height: 6, background: '#F2F2F7',
        borderRadius: 3, marginTop: 12, overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', borderRadius: 3, background: color,
          width: `${Math.min(((heartRate - 40) / 100) * 100, 100)}%`,
          transition: 'width 0.5s ease'
        }} />
      </div>
      <div style={{
        display: 'inline-block', marginTop: 10,
        padding: '4px 12px', borderRadius: '20px',
        fontSize: 12, fontWeight: 700,
        background: status === 'Critical' ? '#FFF0F0' :
                    status === 'Warning'  ? '#FFF8E7' : '#F0FFF4',
        color
      }}>{status}</div>
      <style>{`
        @keyframes simPulse {
          0%,100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
