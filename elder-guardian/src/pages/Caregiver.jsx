import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { supabase } from '../supabaseClient'

const riskColor = {
  HIGH:   { bg: '#FFF0F0', text: '#FF3B30' },
  MEDIUM: { bg: '#FFF8E7', text: '#FF9500' },
  LOW:    { bg: '#F0FFF4', text: '#34C759' }
}

const eventIcon = {
  'Heart Rate Critical': '❤️',
  'Fall Detected':       '🩺',
  'Manual SOS':          '🆘',
  'Voice Emergency':     '🎙️',
  'Gesture Emergency':   '✋'
}

export default function Caregiver() {
  const navigate = useNavigate()
  const { user, linkedPatients, logoutUser } = useUser()
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [newAlert, setNewAlert]   = useState(false)
  const [patients, setPatients]   = useState(linkedPatients || [])

  // ── Fetch linked patients if not in state ──────────────────────
  const fetchLinkedPatients = async () => {
    if (!user?.id) return []
    const { data: links } = await supabase
      .from('caregiver_links')
      .select('patient_id')
      .eq('caregiver_id', user.id)

    if (!links || links.length === 0) return []

    const patientIds = links.map(l => l.patient_id)
    const { data: pts } = await supabase
      .from('users')
      .select('id, name, age, disability_type, patient_code')
      .in('id', patientIds)

    const pList = (pts || []).map(p => ({
      id: p.id, name: p.name, age: p.age,
      disability: p.disability_type,
      patient_code: p.patient_code
    }))
    setPatients(pList)
    return pList
  }

  // ── Fetch events for all linked patients ───────────────────────
  const fetchEvents = async (patientList) => {
    const ids = patientList.map(p => p.id)
    if (ids.length === 0) { setLoading(false); return }

    const { data } = await supabase
      .from('emergency_events')
      .select('*')
      .in('user_id', ids)
      .order('triggered_at', { ascending: false })
      .limit(100)

    setEvents(data || [])
    setLoading(false)
  }

  // ── Init + Realtime ────────────────────────────────────────────
  useEffect(() => {
    let channel
    const init = async () => {
      const pts = patients.length > 0 ? patients : await fetchLinkedPatients()
      await fetchEvents(pts)

      // Subscribe to realtime for each patient
      const ids = pts.map(p => p.id)
      if (ids.length === 0) return

      channel = supabase
        .channel('caregiver_feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'emergency_events' },
          (payload) => {
            if (ids.includes(payload.new.user_id)) {
              setEvents(prev => [payload.new, ...prev])
              setNewAlert(true)
              setTimeout(() => setNewAlert(false), 5000)
            }
          }
        )
        .subscribe()
    }
    init()

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [user?.id])

  // ── Resolve ────────────────────────────────────────────────────
  const handleResolve = async (eventId) => {
    await supabase
      .from('emergency_events')
      .update({ resolved: true, notes: 'Resolved by caregiver' })
      .eq('id', eventId)
    setEvents(prev =>
      prev.map(e => e.id === eventId ? { ...e, resolved: true } : e)
    )
  }

  const fmt = ts => new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  const getPatientName = (userId) => {
    const p = patients.find(pt => pt.id === userId)
    return p ? p.name : 'Unknown'
  }

  const activeCount = events.filter(e => !e.resolved).length

  const s = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #e8eeff 0%, #f5f0ff 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      paddingBottom: 30
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
      background: '#34C759',
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
    body: { padding: '16px' },
    alertBanner: {
      background: '#FF3B30', color: '#fff',
      borderRadius: '16px', padding: '14px 20px',
      marginBottom: 16, textAlign: 'center',
      fontWeight: 700, fontSize: 16,
      animation: 'cgPulse 1s infinite',
      display: newAlert ? 'block' : 'none'
    },
    statsRow: {
      display: 'flex', gap: 12, marginBottom: 20
    },
    statCard: (color) => ({
      flex: 1, background: '#fff', borderRadius: '16px',
      padding: '16px', textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      borderTop: `3px solid ${color}`
    }),
    statNum: { fontSize: 28, fontWeight: 800 },
    statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
    sectionTitle: {
      fontSize: 15, fontWeight: 700, color: '#1C1C1E',
      marginBottom: 10, marginLeft: 4
    },
    patientCard: {
      background: '#fff', borderRadius: '16px',
      padding: '14px 18px', marginBottom: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center', gap: 12
    },
    patientAvatar: {
      width: 40, height: 40, borderRadius: '50%',
      background: '#0A84FF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, color: '#fff', fontWeight: 700, flexShrink: 0
    },
    patientName: { fontSize: 15, fontWeight: 700, color: '#1C1C1E' },
    patientMeta: { fontSize: 12, color: '#8E8E93' },
    eventCard: {
      background: '#fff', borderRadius: '18px',
      padding: '16px', marginBottom: 10,
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      position: 'relative'
    },
    eventHeader: {
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 6
    },
    eventType: {
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 14, fontWeight: 700, color: '#1C1C1E'
    },
    riskPill: (risk) => ({
      padding: '3px 10px', borderRadius: '20px',
      fontSize: 11, fontWeight: 700,
      background: riskColor[risk]?.bg || '#F2F2F7',
      color: riskColor[risk]?.text || '#666'
    }),
    eventMeta: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 },
    metaItem: { fontSize: 11, color: '#8E8E93' },
    resolvedBadge: {
      position: 'absolute', top: 10, right: 10,
      background: '#E8F5E9', color: '#34C759',
      borderRadius: '10px', padding: '2px 8px',
      fontSize: 10, fontWeight: 600
    },
    resolveBtn: {
      marginTop: 8, background: '#34C759',
      color: '#fff', border: 'none',
      borderRadius: '10px', padding: '7px 14px',
      fontSize: 12, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'inherit'
    },
    empty: {
      textAlign: 'center', padding: '40px',
      background: '#fff', borderRadius: '20px',
      color: '#8E8E93', fontSize: 14
    }
  }

  return (
    <div style={s.page} className="caregiver-page">
      <style>{`
        @keyframes cgPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:.85; transform:scale(1.01); }
        }
      `}</style>

      {/* Top Bar */}
      <div style={s.topBar} className="caregiver-topbar">
        <div style={s.topLeft}>
          <div style={s.avatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={s.greeting}>Hi, {user?.name}</div>
            <div style={s.greetSub}>Caregiver Dashboard</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={() => { logoutUser(); navigate('/') }}>
          ✕
        </button>
      </div>

      <div style={s.body} className="caregiver-body">
        {/* Alert Banner */}
        <div style={s.alertBanner}>🚨 NEW EMERGENCY ALERT!</div>

        {/* Stats */}
        <div style={s.statsRow} className="caregiver-stats">
          <div style={s.statCard('#0A84FF')}>
            <div style={s.statNum}>{patients.length}</div>
            <div style={s.statLabel}>Patients</div>
          </div>
          <div style={s.statCard('#FF3B30')}>
            <div style={{ ...s.statNum, color: '#FF3B30' }}>{activeCount}</div>
            <div style={s.statLabel}>Active Alerts</div>
          </div>
          <div style={s.statCard('#34C759')}>
            <div style={{ ...s.statNum, color: '#34C759' }}>
              {events.filter(e => e.resolved).length}
            </div>
            <div style={s.statLabel}>Resolved</div>
          </div>
        </div>

        <div className="caregiver-content">
          <div className="caregiver-patients">
            {/* Linked Patients */}
            <div style={s.sectionTitle}>👥 Linked Patients</div>
            {patients.length === 0 ? (
              <div style={s.empty}>No patients linked yet.</div>
            ) : (
              patients.map(p => (
                <div key={p.id} style={s.patientCard}>
                  <div style={s.patientAvatar}>
                    {p.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={s.patientName}>{p.name}</div>
                    <div style={s.patientMeta}>
                      Age {p.age} • {p.disability} • Code: {p.patient_code}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="caregiver-events">
            {/* Event Log */}
            <div style={s.sectionTitle}>
              📋 Emergency Events ({events.length})
            </div>

            {loading ? (
              <div style={s.empty}>Loading events...</div>
            ) : events.length === 0 ? (
              <div style={s.empty}>
                ✅ No emergency events yet.<br />
                <span style={{ fontSize: 12 }}>Events appear here in realtime.</span>
              </div>
            ) : (
              events.map(ev => (
                <div key={ev.id} style={s.eventCard}>
                  {ev.resolved && <div style={s.resolvedBadge}>✓ Resolved</div>}
                  <div style={s.eventHeader}>
                    <div style={s.eventType}>
                      <span>{eventIcon[ev.event_type] || '⚠️'}</span>
                      {ev.event_type}
                    </div>
                    <div style={s.riskPill(ev.risk_level)}>{ev.risk_level}</div>
                  </div>
                  <div style={s.eventMeta}>
                    <span style={s.metaItem}>👤 {getPatientName(ev.user_id)}</span>
                    <span style={s.metaItem}>💓 {ev.heart_rate || 'N/A'} bpm</span>
                    <span style={s.metaItem}>♿ {ev.disability_type}</span>
                    <span style={s.metaItem}>🕐 {fmt(ev.triggered_at)}</span>
                  </div>
                  {!ev.resolved && (
                    <button style={s.resolveBtn} onClick={() => handleResolve(ev.id)}>
                      ✓ Mark Resolved
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

