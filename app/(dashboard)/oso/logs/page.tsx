'use client'

import { useState, useEffect } from 'react'

type Level = '' | 'info' | 'warn' | 'error' | 'debug'

export default function LogsPage() {
  const [level,     setLevel]     = useState<Level>('')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [data,      setData]      = useState<any>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ level, search, page: String(page) })
    fetch(`/api/logs?${params}`)
      .then(r => r.json())
      .then(j => { setData(j.data); setLoading(false) })
  }, [level, search, page])

  async function clearOld(days: number) {
    if (!confirm(`Delete all logs older than ${days} days?`)) return
    const res = await fetch(`/api/logs?days=${days}`, { method: 'DELETE' })
    const j = await res.json()
    if (j.success) {
      const params = new URLSearchParams({ level, search, page: String(page) })
      const res2 = await fetch(`/api/logs?${params}`)
      const j2 = await res2.json()
      setData(j2.data)
    }
  }

  const totalPages = data ? Math.ceil(Number(data.total) / data.limit) : 1

  const levelStyle: Record<string, { bg: string; color: string }> = {
    info:    { bg: 'rgba(91,164,245,0.12)',   color: '#5ba4f5' },
    warn:    { bg: 'rgba(232,197,71,0.12)',   color: '#e8c547' },
    error:   { bg: 'rgba(240,112,96,0.12)',   color: '#f07060' },
    debug:   { bg: 'rgba(107,107,120,0.15)',  color: '#6b6b78' },
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f0efe8', letterSpacing: '-0.4px' }}>Logs</div>
          <div style={{ fontSize: 12, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
            {data?.total || 0} entries
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => clearOld(d)}
              style={{ padding: '6px 12px', borderRadius: 5, background: 'transparent', border: '1px solid #2a2a32', color: '#6b6b78', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>
              Clear {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'All',    value: '' },
          { label: 'Info',   value: 'info' },
          { label: 'Warn',   value: 'warn' },
          { label: 'Error',  value: 'error' },
          { label: 'Debug',  value: 'debug' },
        ].map(f => (
          <button key={f.value} onClick={() => { setLevel(f.value as Level); setPage(1) }}
            style={{ padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer',
              background: level === f.value ? '#e8c547' : '#1a1a1f', color: level === f.value ? '#0c0c0e' : '#6b6b78', border: '1px solid #2a2a32' }}>
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <input type="text" placeholder="Search message or context…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ background: '#1a1a1f', border: '1px solid #2a2a32', borderRadius: 5, padding: '6px 12px', fontSize: 12, color: '#f0efe8', outline: 'none', fontFamily: "'JetBrains Mono',monospace", width: 260 }} />
        </div>
      </div>

      {/* Log List */}
      <div style={{ background: '#131316', border: '1px solid #2a2a32', borderRadius: 10, overflow: 'hidden', fontFamily: "'JetBrains Mono',monospace" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b6b78' }}>Loading…</div>
        ) : (data?.logs || []).length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b6b78' }}>No logs found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {(data?.logs || []).map((log: any, i: number) => {
              const ls = levelStyle[log.level] || levelStyle.info
              return (
                <div key={log.id} style={{ padding: '10px 18px', borderBottom: i < data.logs.length - 1 ? '1px solid #2a2a32' : 'none', display: 'grid', gridTemplateColumns: '80px 60px 1fr auto', gap: 12, alignItems: 'start' }}>
                  <div style={{ fontSize: 10, color: '#6b6b78', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, background: ls.bg, color: ls.color, textTransform: 'uppercase' }}>
                      {log.level}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#f0efe8' }}>{log.message}</div>
                    {log.context && <div style={{ fontSize: 10, color: '#6b6b78', marginTop: 2 }}>{log.context}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid #2a2a32', display: 'flex', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer',
                  background: p === page ? '#e8c547' : '#1a1a1f', color: p === page ? '#0c0c0e' : '#6b6b78', border: '1px solid #2a2a32', fontWeight: p === page ? 700 : 400 }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
