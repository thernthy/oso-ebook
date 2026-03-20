'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function InviteAuthorPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/session').then(res => res.json()).then(data => {
      if (data?.user?.id) setPartnerId(data.user.id)
    })
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !partnerId) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/partners/${partnerId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: `Invitation sent to ${email}!` })
        setEmail('')
        setTimeout(() => router.push('/partner/authors'), 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send invitation' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>

      <div>
        <div style={{ fontSize:20, fontWeight:800, color:'#edf0f0', letterSpacing:'-0.4px' }}>Invite Author</div>
        <div style={{ fontSize:12, color:'#5e6b70', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
          Send an invitation link to a new author
        </div>
      </div>

      <div style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, padding:'28px', maxWidth:500 }}>
        <form onSubmit={handleInvite} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#5e6b70', marginBottom:8, textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'JetBrains Mono',monospace" }}>
              Author Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="author@example.com"
              required
              style={{ width:'100%', padding:'10px 14px', background:'#0c0e0f', border:'1px solid #252c30', borderRadius:6, fontSize:14, color:'#edf0f0', outline:'none', boxSizing:'border-box' }}
            />
          </div>

          {message && (
            <div style={{ padding:'10px 14px', borderRadius:6, fontSize:13, background: message.type === 'success' ? 'rgba(61,214,163,0.12)' : 'rgba(240,112,96,0.12)', color: message.type === 'success' ? '#3dd6a3' : '#f07060' }}>
              {message.text}
            </div>
          )}

          <div style={{ display:'flex', gap:12 }}>
            <button
              type="submit"
              disabled={loading}
              style={{ padding:'10px 20px', borderRadius:6, background: loading ? '#252c30' : '#3dd6a3', color:'#0c0e0f', fontSize:13, fontWeight:700, border:'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
            <Link href="/partner/authors" style={{ padding:'10px 20px', borderRadius:6, background:'transparent', color:'#5e6b70', fontSize:13, fontWeight:600, border:'1px solid #252c30', textDecoration:'none', display:'flex', alignItems:'center' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>

    </div>
  )
}
