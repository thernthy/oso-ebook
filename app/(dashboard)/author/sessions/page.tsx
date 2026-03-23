'use client'

import { useState, useEffect } from 'react'

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

export default function AuthorSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchSessions()

    const eventSource = new EventSource('/api/sessions?format=sse')
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
      setTimeout(() => {
        const newEs = new EventSource('/api/sessions?format=sse')
        newEs.onmessage = eventSource.onmessage
      }, 5000)
    }

    return () => eventSource.close()
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
    return Date.now() - lastActivity < 60000
  }

  const activeCount = sessions.filter(s => isActive(s.lastActivity)).length

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, background: '#0d0c10', color: '#eeecf8' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#eeecf8', letterSpacing: '-0.4px' }}>My Sessions</div>
          <div style={{ fontSize: 12, color: '#635e80', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
            {activeCount} active · {sessions.length} total
          </div>
        </div>
        <button onClick={fetchSessions}
          style={{ padding: '7px 14px', borderRadius: 6, background: '#1a1820', border: '1px solid #272635', color: '#635e80', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {/* Live Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#9d7df5',
          boxShadow: '0 0 8px #9d7df5',
          animation: 'pulse 2s infinite'
        }} />
        <span style={{ fontSize: 11, color: '#9d7df5', fontFamily: "'JetBrains Mono',monospace" }}>
          Live updates enabled
        </span>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>

      {/* Sessions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#635e80' }}>Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#635e80' }}>No active sessions</div>
        ) : sessions.map(session => {
          const active = isActive(session.lastActivity)
          return (
            <div key={session.id} style={{
              background: '#151420', border: '1px solid #272635', borderRadius: 10,
              padding: 16, position: 'relative'
            }}>
              {active && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 8, height: 8, borderRadius: '50%', background: '#9d7df5',
                  boxShadow: '0 0 6px #9d7df5'
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#9d7df522', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#9d7df5'
                }}>
                  {session.userName?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#eeecf8' }}>{session.userName || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: '#635e80', fontFamily: "'JetBrains Mono',monospace" }}>{session.userEmail || '—'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#635e80' }}>IP</span>
                  <span style={{ color: '#eeecf8' }}>{session.ip}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#635e80' }}>Page</span>
                  <span style={{ color: '#eeecf8', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.page}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#635e80' }}>Connected</span>
                  <span style={{ color: '#eeecf8' }}>{timeAgo(session.connectedAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#635e80' }}>Last Active</span>
                  <span style={{ color: active ? '#9d7df5' : '#635e80' }}>{timeAgo(session.lastActivity)}</span>
                </div>
              </div>

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
