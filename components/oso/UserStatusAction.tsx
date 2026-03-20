'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userId:        string
  currentStatus: string
}

export default function UserStatusAction({ userId, currentStatus }: Props) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(newStatus: string) {
    setLoading(true)
    await fetch(`/api/users/${userId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
    })
    setLoading(false)
    router.refresh()
  }

  if (currentStatus === 'active') {
    return (
      <button onClick={() => updateStatus('suspended')} disabled={loading}
        style={{ padding:'4px 10px', borderRadius:4, border:'1px solid rgba(240,112,96,0.3)', background:'transparent', color:'#f07060', fontSize:11, fontFamily:"'JetBrains Mono',monospace", cursor:'pointer', opacity:loading?0.5:1 }}>
        {loading ? '…' : 'Suspend'}
      </button>
    )
  }

  if (currentStatus === 'suspended') {
    return (
      <button onClick={() => updateStatus('active')} disabled={loading}
        style={{ padding:'4px 10px', borderRadius:4, border:'1px solid rgba(61,214,163,0.3)', background:'transparent', color:'#3dd6a3', fontSize:11, fontFamily:"'JetBrains Mono',monospace", cursor:'pointer', opacity:loading?0.5:1 }}>
        {loading ? '…' : 'Reactivate'}
      </button>
    )
  }

  if (currentStatus === 'pending') {
    return (
      <button onClick={() => updateStatus('active')} disabled={loading}
        style={{ padding:'4px 10px', borderRadius:4, border:'1px solid rgba(232,197,71,0.3)', background:'transparent', color:'#e8c547', fontSize:11, fontFamily:"'JetBrains Mono',monospace", cursor:'pointer', opacity:loading?0.5:1 }}>
        {loading ? '…' : 'Approve'}
      </button>
    )
  }

  return null
}
