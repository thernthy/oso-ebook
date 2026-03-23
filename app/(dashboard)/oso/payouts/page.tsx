'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'all' | 'pending' | 'processing' | 'completed' | 'failed'

export default function PayoutsPage() {
  const router = useRouter()
  const [status,    setStatus]    = useState<Status>('all')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [data,      setData]      = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [action,    setAction]    = useState<{ id: string; label: string } | null>(null)
  const [reference, setReference] = useState('')
  const [processing, setProcessing] = useState(false)

  const limit = 20

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ status, search, page: String(page), limit: String(limit) })
    fetch(`/api/payouts?${params}`)
      .then(r => r.json())
      .then(j => { setData(j.data); setLoading(false) })
  }, [status, search, page])

  async function updatePayout(payoutId: string, actionName: string, ref?: string) {
    setProcessing(true)
    await fetch('/api/payouts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payout_id: payoutId, action: actionName, reference: ref }),
    })
    setProcessing(false)
    setAction(null)
    setReference('')
    const params = new URLSearchParams({ status, search, page: String(page), limit: String(limit) })
    const res = await fetch(`/api/payouts?${params}`)
    const j = await res.json()
    setData(j.data)
  }

  const summary = data?.summary || {}
  const totalPages = data ? Math.ceil(Number(data.total) / limit) : 1

  const statusStyle: Record<string, { bg: string; color: string }> = {
    pending:    { bg: 'rgba(232,197,71,0.12)',  color: '#e8c547' },
    processing: { bg: 'rgba(91,164,245,0.12)',  color: '#5ba4f5' },
    completed:  { bg: 'rgba(61,214,163,0.12)',  color: '#3dd6a3' },
    failed:     { bg: 'rgba(240,112,96,0.12)',  color: '#f07060' },
  }

  const roleColor: Record<string, string> = {
    partner: '#3dd6a3', author: '#9d7df5', oso: '#e8c547', reader: '#5ba4f5'
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f0efe8', letterSpacing: '-0.4px' }}>Payouts</div>
          <div style={{ fontSize: 12, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
            {data?.total || 0} total requests
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Pending', count: summary.pending_count || 0, amount: summary.pending_total || 0, color: '#e8c547', icon: '⏳' },
          { label: 'Processing', count: summary.processing_count || 0, amount: summary.processing_total || 0, color: '#5ba4f5', icon: '⚙' },
          { label: 'Completed', count: summary.completed_count || 0, amount: summary.completed_total || 0, color: '#3dd6a3', icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{ background: '#131316', border: '1px solid #2a2a32', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#6b6b78', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</span>
              <span style={{ fontSize: 16, opacity: 0.4 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: '6px 0 2px' }}>${parseFloat(s.amount).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace" }}>{s.count} requests</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'All',         value: 'all' as Status },
          { label: 'Pending',     value: 'pending' as Status },
          { label: 'Processing',  value: 'processing' as Status },
          { label: 'Completed',   value: 'completed' as Status },
          { label: 'Failed',      value: 'failed' as Status },
        ].map(f => (
          <button key={f.value} onClick={() => { setStatus(f.value); setPage(1) }}
            style={{ padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer',
              background: status === f.value ? '#e8c547' : '#1a1a1f', color: status === f.value ? '#0c0c0e' : '#6b6b78', border: '1px solid #2a2a32' }}>
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <input type="text" placeholder="Search name or email…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ background: '#1a1a1f', border: '1px solid #2a2a32', borderRadius: 5, padding: '6px 12px', fontSize: 12, color: '#f0efe8', outline: 'none', fontFamily: "'JetBrains Mono',monospace", width: 200 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#131316', border: '1px solid #2a2a32', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Recipient', 'Role', 'Amount', 'Status', 'Reference', 'Created', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#6b6b78', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", borderBottom: '1px solid #2a2a32' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace" }}>Loading…</td></tr>
            ) : (data?.payouts || []).length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace" }}>No payouts found</td></tr>
            ) : (data?.payouts || []).map((p: any) => {
              const sc = statusStyle[p.status] || statusStyle.pending
              const rc = roleColor[p.user_role] || '#6b6b78'
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #2a2a32' }}>
                  <td style={{ padding: '11px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${rc}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: rc, flexShrink: 0 }}>
                        {p.user_name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#f0efe8' }}>{p.user_name}</div>
                        <div style={{ fontSize: 10, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace" }}>{p.user_email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '11px 18px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: rc, textTransform: 'uppercase' }}>{p.user_role}</span>
                  </td>
                  <td style={{ padding: '11px 18px', fontSize: 13, fontWeight: 700, color: '#3dd6a3', fontFamily: "'JetBrains Mono',monospace" }}>
                    ${parseFloat(p.amount).toLocaleString()}
                  </td>
                  <td style={{ padding: '11px 18px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", background: sc.bg, color: sc.color }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '11px 18px', fontSize: 11, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace" }}>
                    {p.reference || '—'}
                  </td>
                  <td style={{ padding: '11px 18px', fontSize: 11, color: '#6b6b78', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>
                    {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '11px 18px' }}>
                    {p.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setAction({ id: p.id, label: 'processing' })}
                          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(91,164,245,0.3)', background: 'transparent', color: '#5ba4f5', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>
                          Process
                        </button>
                        <button onClick={() => setAction({ id: p.id, label: 'failed' })}
                          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(240,112,96,0.3)', background: 'transparent', color: '#f07060', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>
                          Fail
                        </button>
                      </div>
                    )}
                    {p.status === 'processing' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {action && action.id === p.id && action.label === 'completed' ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="text" placeholder="Ref #" value={reference} onChange={e => setReference(e.target.value)}
                              style={{ background: '#1a1a1f', border: '1px solid #3dd6a3', borderRadius: 4, padding: '3px 8px', fontSize: 11, color: '#f0efe8', outline: 'none', fontFamily: "'JetBrains Mono',monospace", width: 80 }} />
                            <button onClick={() => updatePayout(p.id, 'completed', reference)} disabled={processing}
                              style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(61,214,163,0.3)', background: 'rgba(61,214,163,0.1)', color: '#3dd6a3', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>
                              {processing ? '…' : 'Confirm'}
                            </button>
                            <button onClick={() => { setAction(null); setReference('') }}
                              style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #2a2a32', background: 'transparent', color: '#6b6b78', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setAction({ id: p.id, label: 'completed' })}
                            style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(61,214,163,0.3)', background: 'transparent', color: '#3dd6a3', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer' }}>
                            Mark Complete
                          </button>
                        )}
                      </div>
                    )}
                    {p.status === 'completed' && (
                      <span style={{ fontSize: 11, color: '#3dd6a3', fontFamily: "'JetBrains Mono',monospace" }}>Paid</span>
                    )}
                    {p.status === 'failed' && (
                      <span style={{ fontSize: 11, color: '#f07060', fontFamily: "'JetBrains Mono',monospace" }}>Failed</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

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
