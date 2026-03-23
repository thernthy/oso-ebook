'use client'

import { useState, useEffect, useRef } from 'react'

interface Session {
  id: string
  userId: string
  userName: string
  userRole: string
  userEmail: string
  ip: string
  userAgent: string
  connectedAt: number
  lastActivity: number
  page: string
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // Initial fetch
    fetchSessions()

    // Connect to SSE for real-time updates
    const connectSSE = () => {
      const eventSource = new EventSource('/api/sessions?format=sse')
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'sessions') {
            setSessions(data.sessions)
            setLastUpdate(new Date())
          }
        } catch (e) {
          console.error('SSE parse error:', e)
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000)
      }
    }

    connectSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  async function fetchSessions() {
    try {
      const res = await fetch('/api/sessions')
      const j = await res.json()
      if (j.success) {
        setSessions(j.data.sessions || [])
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e)
    } finally {
      setLoading(false)
    }
  }

  async function disconnectSession(sessionId: string) {
    await fetch(`/api/sessions?sessionId=${sessionId}`, { method: 'DELETE' })
    // The SSE will automatically update the list
  }

  async function disconnectAllSessions() {
    if (!confirm('Disconnect all sessions? Users will be logged out.')) return
    for (const session of sessions) {
      await fetch(`/api/sessions?sessionId=${session.id}`, { method: 'DELETE' })
    }
  }

  function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  function isActive(lastActivity: number): boolean {
    return Date.now() - lastActivity < 60000 // Active within last minute
  }

  const roleColor: Record<string, string> = {
    oso: '#e8c547',
    partner: '#3dd6a3',
    author: '#9d7df5',
    reader: '#5ba4f5'
  }

  const activeCount = sessions.filter(s => isActive(s.lastActivity)).length

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f0efe8', letterSpacing: '-0.4px' }}>Active Sessions</div>
          <div style={{ fontSize: 12, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
            {activeCount} active · {sessions.length} total · Updated {timeAgo(lastUpdate.getTime())}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchSessions}
            style={{ padding: '7px 14px', borderRadius: 6, background: '#1a1a1f', border: '1px solid #2a2a32', color: '#6b6b78', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>
            Refresh
          </button>
          {sessions.length > 0 && (
            <button onClick={disconnectAllSessions}
              style={{ padding: '7px 14px', borderRadius: 6, background: 'rgba(240,112,96,0.1)', border: '1px solid rgba(240,112,96,0.3)', color: '#f07060', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>
              Disconnect All
            </button>
          )}
        </div>
      </div>

      {/* Live Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#3dd6a3',
          boxShadow: '0 0 8px #3dd6a3',
          animation: 'pulse 2s infinite'
        }} />
        <span style={{ fontSize: 11, color: '#3dd6a3', fontFamily: "'JetBrains Mono',monospace" }}>
          Live updates enabled
        </span>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>

      {/* Sessions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#6b6b78' }}>Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#6b6b78' }}>No active sessions</div>
        ) : sessions.map(session => {
          const rc = roleColor[session.userRole] || '#6b6b78'
          const active = isActive(session.lastActivity)
          return (
            <div key={session.id} style={{
              background: '#131316', border: '1px solid #2a2a32', borderRadius: 10,
              padding: 16, position: 'relative', overflow: 'hidden'
            }}>
              {/* Active indicator */}
              {active && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 8, height: 8, borderRadius: '50%', background: '#3dd6a3',
                  boxShadow: '0 0 6px #3dd6a3'
                }} />
              )}

              {/* User info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `${rc}22`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, fontWeight: 700, color: rc
                }}>
                  {session.userName?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f0efe8' }}>{session.userName || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace" }}>{session.userEmail || '—'}</div>
                </div>
              </div>

              {/* Role badge */}
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                  fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
                  background: `${rc}22`, color: rc
                }}>
                  {session.userRole}
                </span>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b6b78' }}>IP</span>
                  <span style={{ color: '#f0efe8' }}>{session.ip}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b6b78' }}>Page</span>
                  <span style={{ color: '#f0efe8', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.page}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b6b78' }}>Connected</span>
                  <span style={{ color: '#f0efe8' }}>{timeAgo(session.connectedAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b6b78' }}>Last Active</span>
                  <span style={{ color: active ? '#3dd6a3' : '#6b6b78' }}>{timeAgo(session.lastActivity)}</span>
                </div>
              </div>

              {/* Disconnect button */}
              <button
                onClick={() => disconnectSession(session.id)}
                style={{
                  marginTop: 12, width: '100%', padding: '8px',
                  borderRadius: 6, background: 'rgba(240,112,96,0.1)',
                  border: '1px solid rgba(240,112,96,0.3)', color: '#f07060',
                  fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Disconnect
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
