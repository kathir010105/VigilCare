import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useUser } from '../context/UserContext'

export default function FallDetection() {
  const { triggerEmergency, heartRate } = useUser()
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 9.8 })
  const [totalG, setTotalG] = useState(1.0)
  const [status, setStatus] = useState('Monitoring')
  const [sensorStatus, setSensorStatus] = useState('checking') // checking | active | blocked | desktop
  const [simulating, setSimulating] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [history, setHistory] = useState([])
  const [shakeCount, setShakeCount] = useState(0)
  const [peakG, setPeakG] = useState(1.0)

  const freeFallRef = useRef(false)
  const freeFallTimeRef = useRef(null)
  const cooldownRef = useRef(false)
  const cooldownTimerRef = useRef(null)
  const statusResetRef = useRef(null)
  const shakeCountRef = useRef(0)
  const shakeResetTimerRef = useRef(null)
  const lastShakeTimeRef = useRef(0)
  const eventCountRef = useRef(0) // track if we receive any accelerometer events

  // Thresholds
  const FREE_FALL_THRESHOLD = 0.4
  const IMPACT_THRESHOLD = 2.5
  // Android shake detection — Samsung S21 FE produces ~2-4g on a firm shake
  const SHAKE_G_THRESHOLD = 2.0     // single shake threshold
  const SHAKE_COUNT_TRIGGER = 3     // need 3 shakes within window
  const SHAKE_WINDOW_MS = 2000      // 2 second window
  const SHAKE_COOLDOWN_MS = 500     // min time between shake counts

  const fireFallAlert = useCallback(() => {
    if (cooldownRef.current) return
    cooldownRef.current = true
    setCooldown(true)
    setStatus('🚨 FALL DETECTED')
    triggerEmergency('Fall Detected', heartRate)
    cooldownTimerRef.current = setTimeout(() => {
      cooldownRef.current = false
      setCooldown(false)
    }, 15000)
  }, [triggerEmergency, heartRate])

  const processReading = useCallback((x, y, z) => {
    const g = Math.sqrt(x * x + y * y + z * z) / 9.8
    const gFixed = parseFloat(g.toFixed(2))
    setAccel({ x: x.toFixed(2), y: y.toFixed(2), z: z.toFixed(2) })
    setTotalG(gFixed)
    setPeakG(prev => gFixed > prev ? gFixed : prev)
    setHistory(prev => [...prev.slice(-19), { g: gFixed, t: Date.now() }])

    // ── Method 1: Classic fall detection (free-fall → impact) ──
    if (g < FREE_FALL_THRESHOLD) {
      if (!freeFallRef.current) {
        freeFallRef.current = true
        freeFallTimeRef.current = Date.now()
        setStatus('Free-Fall ⬇️')
      }
    }

    if (g > IMPACT_THRESHOLD && freeFallRef.current) {
      const elapsed = Date.now() - (freeFallTimeRef.current || 0)
      if (elapsed < 1000) {
        freeFallRef.current = false
        fireFallAlert()
        return
      }
    }

    if (freeFallRef.current && g >= FREE_FALL_THRESHOLD && g <= IMPACT_THRESHOLD) {
      const elapsed = Date.now() - (freeFallTimeRef.current || 0)
      if (elapsed > 1000) {
        freeFallRef.current = false
        setStatus('Monitoring')
      }
    }

    // ── Method 2: Shake detection (for Android testing) ──
    // Detects 3 strong shakes within 2 seconds
    const now = Date.now()
    if (g > SHAKE_G_THRESHOLD && (now - lastShakeTimeRef.current) > SHAKE_COOLDOWN_MS) {
      lastShakeTimeRef.current = now
      shakeCountRef.current += 1
      setShakeCount(shakeCountRef.current)
      setStatus(`Shaking... (${shakeCountRef.current}/${SHAKE_COUNT_TRIGGER})`)

      // Reset shake count after window expires
      if (shakeResetTimerRef.current) clearTimeout(shakeResetTimerRef.current)
      shakeResetTimerRef.current = setTimeout(() => {
        shakeCountRef.current = 0
        setShakeCount(0)
        setStatus(prev => prev.startsWith('Shaking') ? 'Monitoring' : prev)
      }, SHAKE_WINDOW_MS)

      // Trigger if enough shakes
      if (shakeCountRef.current >= SHAKE_COUNT_TRIGGER) {
        shakeCountRef.current = 0
        setShakeCount(0)
        if (shakeResetTimerRef.current) clearTimeout(shakeResetTimerRef.current)
        fireFallAlert()
        return
      }
    }

    // Back to normal
    if (g >= 0.8 && g <= 1.3 && !freeFallRef.current && shakeCountRef.current === 0) {
      setStatus(prev => prev === '🚨 FALL DETECTED' ? prev : 'Monitoring')
    }
  }, [fireFallAlert])

  // ── Sensor setup ──
  useEffect(() => {
    let handler = null
    const isSecure = window.isSecureContext

    // Check if we're on desktop (no touch = likely desktop)
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    if (!isMobile) {
      setSensorStatus('desktop')
      return
    }

    if (!isSecure) {
      setSensorStatus('blocked')
      return
    }

    const startSensor = () => {
      if (window.DeviceMotionEvent) {
        handler = (event) => {
          // Use acceleration (without gravity) for better shake detection on Android
          const aGravity = event.accelerationIncludingGravity
          const aNoGravity = event.acceleration

          if (aGravity && aGravity.x !== null) {
            eventCountRef.current += 1
            if (eventCountRef.current >= 3) {
              setSensorStatus('active')
            }
            processReading(aGravity.x, aGravity.y, aGravity.z)
          }
        }
        window.addEventListener('devicemotion', handler, true)

        // If no events after 2s, sensor is likely blocked
        setTimeout(() => {
          if (eventCountRef.current === 0) {
            setSensorStatus('blocked')
          }
        }, 2000)
      } else {
        setSensorStatus('blocked')
      }
    }

    // iOS 13+ permission flow
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(permission => {
          if (permission === 'granted') startSensor()
          else setSensorStatus('blocked')
        })
        .catch(() => setSensorStatus('blocked'))
    } else {
      // Android — just start, no permission needed (but needs HTTPS)
      startSensor()
    }

    return () => {
      if (handler) window.removeEventListener('devicemotion', handler, true)
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
      if (statusResetRef.current) clearTimeout(statusResetRef.current)
      if (shakeResetTimerRef.current) clearTimeout(shakeResetTimerRef.current)
    }
  }, [processReading])

  // Desktop simulation
  const simulateFall = () => {
    if (simulating || cooldown) return
    setSimulating(true)

    const steps = [
      { delay: 0,    x: 0.5,  y: 0.3,  z: 9.5  },
      { delay: 200,  x: 0.3,  y: 0.2,  z: 8.0  },
      { delay: 400,  x: 0.1,  y: 0.1,  z: 4.0  },
      { delay: 600,  x: 0.1,  y: 0.05, z: 1.5  },
      { delay: 800,  x: 0.05, y: 0.02, z: 0.5  },
      { delay: 1000, x: 0.02, y: 0.01, z: 0.2  },
      { delay: 1200, x: 8,    y: 12,   z: 28   },
      { delay: 1400, x: 5,    y: 3,    z: 18   },
      { delay: 1600, x: 1,    y: 0.5,  z: 11   },
      { delay: 2000, x: 0.1,  y: 0.1,  z: 9.8  },
      { delay: 3000, x: 0.05, y: 0.05, z: 9.8  },
    ]

    steps.forEach(step => {
      setTimeout(() => processReading(step.x, step.y, step.z), step.delay)
    })

    setTimeout(() => {
      setSimulating(false)
      statusResetRef.current = setTimeout(() => setStatus('Monitoring'), 5000)
    }, 4000)
  }

  const gVal = parseFloat(totalG)
  const barColor =
    gVal < FREE_FALL_THRESHOLD ? '#FF9500' :
    gVal > IMPACT_THRESHOLD    ? '#FF3B30' :
    gVal > 1.5                 ? '#FFCC00' : '#34C759'

  const statusColor =
    status === '🚨 FALL DETECTED' ? '#FF3B30' :
    status.startsWith('Free-Fall') ? '#FF9500' :
    status.startsWith('Shaking')   ? '#FF9500' : '#34C759'

  const sensorBadge = {
    checking: { bg: '#FFF8E7', color: '#FF9500', text: '⏳ Checking...' },
    active:   { bg: '#F0FFF4', color: '#34C759', text: '📡 Live Sensor' },
    blocked:  { bg: '#FFF0F0', color: '#FF3B30', text: '⚠️ Sensor Blocked' },
    desktop:  { bg: '#FFF8E7', color: '#FF9500', text: '🖥️ Desktop Mode' },
  }[sensorStatus]

  return (
    <div style={{
      background: '#fff', borderRadius: '20px',
      padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
    }}>
      <style>{`
        @keyframes fdPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.5; transform:scale(1.3); }
        }
        @keyframes fdSimPulse {
          0%,100% { opacity:1; }
          50%     { opacity:0.7; }
        }
        @keyframes shakeProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16
      }}>
        <div style={{ fontSize: 13, color: '#8E8E93' }}>📱 Fall Detection</div>
        <div style={{
          fontSize: 10, padding: '3px 8px',
          borderRadius: '10px', fontWeight: 600,
          background: sensorBadge.bg, color: sensorBadge.color
        }}>
          {sensorBadge.text}
        </div>
      </div>

      {/* Sensor blocked warning */}
      {sensorStatus === 'blocked' && (
        <div style={{
          background: '#FFF0F0', borderRadius: '12px',
          padding: '12px 14px', marginBottom: 16,
          border: '1px solid #FFD4D4'
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FF3B30', marginBottom: 4 }}>
            ⚠️ Accelerometer Not Available
          </div>
          <div style={{ fontSize: 11, color: '#8E8E93', lineHeight: 1.4 }}>
            Your browser needs <strong>HTTPS</strong> to access the accelerometer.
            Make sure you're using <strong>https://</strong> (not http://).
            Use the simulate button below to demo.
          </div>
        </div>
      )}

      {/* Status */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 8, marginBottom: 16,
        padding: '10px 14px', borderRadius: '12px',
        background: status === '🚨 FALL DETECTED' ? '#FFF0F0' :
                    status.startsWith('Shaking') ? '#FFF8E7' : '#F9F9FB'
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: statusColor,
          animation: status !== 'Monitoring' ? 'fdPulse 1s infinite' : 'none'
        }}></div>
        <div style={{ fontSize: 14, fontWeight: 700, color: statusColor, flex: 1 }}>
          {status}
        </div>
        {sensorStatus === 'active' && (
          <div style={{ fontSize: 10, color: '#8E8E93' }}>
            Peak: {peakG}g
          </div>
        )}
      </div>

      {/* Shake progress bar (when shaking) */}
      {shakeCount > 0 && (
        <div style={{
          marginBottom: 12, background: '#F2F2F7',
          borderRadius: 6, overflow: 'hidden', height: 8
        }}>
          <div style={{
            height: '100%', borderRadius: 6,
            background: '#FF9500',
            width: `${(shakeCount / SHAKE_COUNT_TRIGGER) * 100}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}

      {/* G-Force Display */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: barColor }}>
          {totalG}g
        </div>
        <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
          Total G-Force (1.0g = normal)
        </div>
      </div>

      {/* G-Force Bar */}
      <div style={{
        height: 8, background: '#F2F2F7',
        borderRadius: 4, overflow: 'hidden', marginBottom: 12
      }}>
        <div style={{
          height: '100%', borderRadius: 4,
          background: barColor,
          width: `${Math.min((gVal / 4) * 100, 100)}%`,
          transition: 'width 0.3s ease, background 0.3s ease'
        }} />
      </div>

      {/* Axis Values */}
      <div style={{
        display: 'flex', justifyContent: 'space-around', marginBottom: 16
      }}>
        {[
          { label: 'X-Axis', val: accel.x, color: '#FF3B30' },
          { label: 'Y-Axis', val: accel.y, color: '#34C759' },
          { label: 'Z-Axis', val: accel.z, color: '#0A84FF' }
        ].map((a, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 12 }}>
            <div style={{ color: '#8E8E93', fontSize: 10 }}>{a.label}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: a.color }}>{a.val}</div>
          </div>
        ))}
      </div>

      {/* Mini Graph */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        gap: 2, height: 40, marginBottom: 16, padding: '0 4px'
      }}>
        {history.length === 0 ? (
          <div style={{
            width: '100%', textAlign: 'center',
            fontSize: 11, color: '#C7C7CC', alignSelf: 'center'
          }}>
            {sensorStatus === 'active' ? 'Waiting for movement...' : 'Waiting for data...'}
          </div>
        ) : (
          history.map((h, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 2, minHeight: 2,
              height: `${Math.min((h.g / 4) * 100, 100)}%`,
              background:
                h.g < FREE_FALL_THRESHOLD ? '#FF9500' :
                h.g > IMPACT_THRESHOLD    ? '#FF3B30' :
                h.g > 1.5                 ? '#FFCC00' : '#34C759',
              transition: 'height 0.2s ease'
            }} />
          ))
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        gap: 14, marginTop: 12, marginBottom: 16, flexWrap: 'wrap'
      }}>
        {[
          { label: 'Normal', color: '#34C759' },
          { label: 'Free-Fall', color: '#FF9500' },
          { label: 'Impact/Shake', color: '#FF3B30' }
        ].map((l, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center',
            gap: 4, fontSize: 10, color: '#8E8E93'
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: l.color
            }}></div>
            {l.label}
          </div>
        ))}
      </div>

      {/* Info for phone users */}
      {sensorStatus === 'active' && (
        <div style={{
          background: '#EBF4FF', borderRadius: '12px',
          padding: '10px 14px', marginBottom: 12,
          fontSize: 12, color: '#0A84FF', fontWeight: 500
        }}>
          📱 <strong>Shake your phone firmly 3 times</strong> within 2 seconds to trigger fall detection.
          Current threshold: {SHAKE_G_THRESHOLD}g
        </div>
      )}

      {/* Simulate Button */}
      <button
        onClick={simulateFall}
        disabled={simulating || cooldown}
        style={{
          width: '100%', padding: '14px',
          borderRadius: '14px', border: 'none',
          fontSize: 15, fontWeight: 700,
          cursor: simulating || cooldown ? 'not-allowed' : 'pointer',
          background: simulating ? '#FF9500' : cooldown ? '#E5E5EA' : '#1C1C1E',
          color: cooldown ? '#8E8E93' : '#fff',
          fontFamily: 'inherit',
          animation: simulating ? 'fdSimPulse 0.8s infinite' : 'none',
          opacity: cooldown ? 0.6 : 1
        }}
      >
        {simulating ? '⏳ Simulating Fall Pattern...' :
         cooldown   ? '⏱️ Cooldown (15s)...' :
                      '🧪 Simulate Fall (Demo)'}
      </button>
    </div>
  )
}
