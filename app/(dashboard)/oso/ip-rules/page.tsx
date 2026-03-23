'use client'

import { useState, useEffect } from 'react'

export default function IPRulesPage() {
  const [rules,      setRules]      = useState<any[]>([])
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [ipAddress,  setIpAddress]  = useState('')
  const [action,     setAction]     = useState<'block' | 'allow'>('block')
  const [note,       setNote]       = useState('')
  const [submitting,  setSubmitting] = useState(false)
  const [error,       setError]      = useState('')

  useEffect(() => { loadRules() }, [search])

  async function loadRules() {
    setLoading(true)
    const params = new URLSearchParams({ search })
    const res = await fetch(`/api/ip-rules?${params}`)
    const j = await res.json()
    setRules(j.data?.rules || [])
    setLoading(false)
  }

  async function addRule() {
    if (!ipAddress.trim()) { setError('IP address required'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/ip-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip_address: ipAddress, action, note }),
    })
    const j = await res.json()
    setSubmitting(false)
    if (j.success) {
      setShowForm(false)
      setIpAddress('')
      setNote('')
      loadRules()
    } else {
      setError(j.error || 'Failed to add rule')
    }
  }

  async function deleteRule(id: string) {
    await fetch(`/api/ip-rules?id=${id}`, { method: 'DELETE' })
    loadRules()
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f0efe8', letterSpacing: '-0.4px' }}>IP Rules</div>
          <div style={{ fontSize: 12, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
            {rules.length} rules configured
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '8px 16px', borderRadius: 6, background: '#e8c547', color: '#0c0c0e', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
          + Add Rule
        </button>
      </div>

      {/* Add Rule Form */}
      {showForm && (
        <div style={{ background: '#131316', border: '1px solid #2a2a32', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Add IP Rule</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 10, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>IP Address</label>
              <input type="text" value={ipAddress} onChange={e => setIpAddress(e.target.value)} placeholder="e.g. 192.168.1.1 or 10.0.0.0/8"
                style={{ width: '100%', background: '#1a1a1f', border: '1px solid #2a2a32', borderRadius: 5, padding: '8px 12px', fontSize: 12, color: '#f0efe8', outline: 'none', fontFamily: "'JetBrains Mono',monospace", marginTop: 4, boxSizing: 'border-box' }} />
            </div>
            <div style={{ minWidth: 120 }}>
              <label style={{ fontSize: 10, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Action</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setAction('block')}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: action === 'block' ? 'rgba(240,112,96,0.15)' : '#1a1a1f', color: action === 'block' ? '#f07060' : '#6b6b78',
                    border: `1px solid ${action === 'block' ? 'rgba(240,112,96,0.4)' : '#2a2a32'}`, fontFamily: "'JetBrains Mono',monospace" }}>
                  Block
                </button>
                <button onClick={() => setAction('allow')}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: action === 'allow' ? 'rgba(61,214,163,0.15)' : '#1a1a1f', color: action === 'allow' ? '#3dd6a3' : '#6b6b78',
                    border: `1px solid ${action === 'allow' ? 'rgba(61,214,163,0.4)' : '#2a2a32'}`, fontFamily: "'JetBrains Mono',monospace" }}>
                  Allow
                </button>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 10, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Note (optional)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason or description"
                style={{ width: '100%', background: '#1a1a1f', border: '1px solid #2a2a32', borderRadius: 5, padding: '8px 12px', fontSize: 12, color: '#f0efe8', outline: 'none', fontFamily: "'JetBrains Mono',monospace", marginTop: 4, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addRule} disabled={submitting}
                style={{ padding: '8px 16px', borderRadius: 5, background: '#3dd6a3', color: '#0c0c0e', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Adding…' : 'Add Rule'}
              </button>
              <button onClick={() => { setShowForm(false); setError('') }}
                style={{ padding: '8px 16px', borderRadius: 5, background: 'transparent', color: '#6b6b78', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid #2a2a32' }}>
                Cancel
              </button>
            </div>
          </div>
          {error && <div style={{ marginTop: 12, fontSize: 12, color: '#f07060', fontFamily: "'JetBrains Mono',monospace" }}>{error}</div>}
        </div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" placeholder="Search by IP address…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: '#1a1a1f', border: '1px solid #2a2a32', borderRadius: 5, padding: '8px 12px', fontSize: 12, color: '#f0efe8', outline: 'none', fontFamily: "'JetBrains Mono',monospace", width: 280 }} />
      </div>

      {/* Table */}
      <div style={{ background: '#131316', border: '1px solid #2a2a32', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['IP Address', 'Action', 'Note', 'Created', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#6b6b78', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", borderBottom: '1px solid #2a2a32' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace" }}>Loading…</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace" }}>No IP rules configured</td></tr>
            ) : rules.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #2a2a32' }}>
                <td style={{ padding: '11px 18px', fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: '#f0efe8' }}>
                  {r.ip_address}
                </td>
                <td style={{ padding: '11px 18px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
                    background: r.action === 'block' ? 'rgba(240,112,96,0.12)' : 'rgba(61,214,163,0.12)',
                    color: r.action === 'block' ? '#f07060' : '#3dd6a3',
                    textTransform: 'uppercase'
                  }}>
                    {r.action}
                  </span>
                </td>
                <td style={{ padding: '11px 18px', fontSize: 12, color: '#6b6b78' }}>
                  {r.note || '—'}
                </td>
                <td style={{ padding: '11px 18px', fontSize: 11, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>
                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td style={{ padding: '11px 18px' }}>
                  <button onClick={() => deleteRule(r.id)}
                    style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(240,112,96,0.3)', background: 'transparent', color: '#f07060', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
