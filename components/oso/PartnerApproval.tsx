'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  applicationId:  string
  applicantName:  string
  applicantEmail: string
}

export default function PartnerApproval({ applicationId, applicantName, applicantEmail }: Props) {
  const router  = useRouter()
  const [mode,     setMode]     = useState<'idle'|'approving'|'rejecting'>('idle')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState('')

  async function approve() {
    if (!password.trim()) return
    setLoading(true)
    const res = await fetch('/api/partners/applications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ application_id: applicationId, action: 'approve', temp_password: password }),
    })
    setLoading(false)
    if (res.ok) { setDone('✓ Approved'); setTimeout(() => router.refresh(), 1000) }
  }

  async function reject() {
    setLoading(true)
    const res = await fetch('/api/partners/applications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ application_id: applicationId, action: 'reject' }),
    })
    setLoading(false)
    if (res.ok) { setDone('✕ Rejected'); setTimeout(() => router.refresh(), 1000) }
  }

  if (done) {
    return <span style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace", color: done.startsWith('✓') ? '#3dd6a3' : '#f07060' }}>{done}</span>
  }

  if (mode === 'approving') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8, width:260 }}>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Set temp password for partner…"
          style={{ background:'#1a1a1f', border:'1px solid #3dd6a3', borderRadius:5, padding:'6px 10px', fontSize:12, color:'#f0efe8', outline:'none', fontFamily:"'Syne',system-ui,sans-serif" }}
        />
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={approve} disabled={loading || !password.trim()}
            style={{ padding:'5px 12px', borderRadius:5, background:'rgba(61,214,163,0.15)', border:'1px solid rgba(61,214,163,0.3)', color:'#3dd6a3', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace", opacity:!password.trim()?0.5:1 }}>
            {loading ? '…' : '✓ Confirm Approve'}
          </button>
          <button onClick={() => setMode('idle')}
            style={{ padding:'5px 10px', borderRadius:5, background:'transparent', border:'1px solid #2a2a32', color:'#6b6b78', fontSize:11, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
      <button onClick={() => setMode('approving')}
        style={{ padding:'6px 14px', borderRadius:5, background:'rgba(61,214,163,0.12)', border:'1px solid rgba(61,214,163,0.3)', color:'#3dd6a3', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
        ✓ Approve
      </button>
      <button onClick={reject} disabled={loading}
        style={{ padding:'6px 14px', borderRadius:5, background:'rgba(240,112,96,0.1)', border:'1px solid rgba(240,112,96,0.25)', color:'#f07060', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
        {loading ? '…' : '✕ Reject'}
      </button>
    </div>
  )
}
