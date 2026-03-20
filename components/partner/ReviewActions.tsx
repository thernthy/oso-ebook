'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  bookId:    string
  bookTitle: string
}

export default function ReviewActions({ bookId, bookTitle }: Props) {
  const router   = useRouter()
  const [mode,    setMode]    = useState<'idle'|'rejecting'>('idle')
  const [feedback, setFeedback] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState('')

  async function act(action: 'approve' | 'reject') {
    if (action === 'reject' && !feedback.trim()) return
    setLoading(true)
    const res = await fetch(`/api/books/${bookId}/review`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, feedback }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setDone(action === 'approve' ? '✓ Approved' : '✕ Rejected')
      setTimeout(() => router.refresh(), 1200)
    }
  }

  if (done) {
    return (
      <span style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace", color: done.startsWith('✓') ? '#3dd6a3' : '#f07060', padding:'6px 0' }}>
        {done}
      </span>
    )
  }

  if (mode === 'rejecting') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8, width:280 }}>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Explain why the book is being rejected (required)…"
          rows={3}
          style={{ background:'#1b1a28', border:'1px solid #f07060', borderRadius:6, padding:'8px 10px', fontSize:12, color:'#edf0f0', outline:'none', resize:'none', fontFamily:"'Syne',system-ui,sans-serif" }}
        />
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => act('reject')} disabled={loading || !feedback.trim()}
            style={{ padding:'5px 12px', borderRadius:5, background:'rgba(240,112,96,0.15)', border:'1px solid rgba(240,112,96,0.3)', color:'#f07060', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace", opacity:!feedback.trim()?0.5:1 }}>
            {loading ? '…' : 'Confirm Reject'}
          </button>
          <button onClick={() => setMode('idle')}
            style={{ padding:'5px 10px', borderRadius:5, background:'transparent', border:'1px solid #252c30', color:'#5e6b70', fontSize:11, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
      <button onClick={() => act('approve')} disabled={loading}
        style={{ padding:'6px 14px', borderRadius:5, background:'rgba(61,214,163,0.15)', border:'1px solid rgba(61,214,163,0.3)', color:'#3dd6a3', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
        {loading ? '…' : '✓ Approve'}
      </button>
      <button onClick={() => setMode('rejecting')} disabled={loading}
        style={{ padding:'6px 14px', borderRadius:5, background:'rgba(240,112,96,0.1)', border:'1px solid rgba(240,112,96,0.25)', color:'#f07060', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
        ✕ Reject
      </button>
    </div>
  )
}
