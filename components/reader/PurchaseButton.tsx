'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'

interface Props {
  bookId:  string | number
  price:   number
  isFree:  boolean
  compact?: boolean
}

export default function PurchaseButton({ bookId, price, isFree, compact }: Props) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  async function purchase() {
    setLoading(true)
    setErr('')
    const res  = await fetch('/api/purchases', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ book_id: bookId }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      router.push(`/reader/read/${bookId}`)
    } else {
      setErr(data.error || 'Purchase failed')
    }
  }

  return (
    <div>
      <button 
        onClick={purchase} 
        disabled={loading}
        style={{ 
          padding: compact ? '6px 12px' : '8px 16px', 
          borderRadius: compact ? '6px' : '8px', 
          background: isFree ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #7c3aed, #a78bfa)', 
          color:'#ffffff', 
          border:'none', 
          fontSize: compact ? '11px' : '12px', 
          fontWeight:700, 
          cursor: loading ? 'wait' : 'pointer', 
          opacity: loading ? 0.6 : 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      >
        {loading ? '…' : isFree ? 'Get Free' : `Buy $${parseFloat(String(price)).toFixed(2)}`}
      </button>
      {err && <div style={{ fontSize:10, color:'#f07060', marginTop:4 }}>{err}</div>}
    </div>
  )
}
