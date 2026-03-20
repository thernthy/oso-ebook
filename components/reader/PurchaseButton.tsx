'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'

interface Props {
  bookId:  string
  price:   number
  isFree:  boolean
}

export default function PurchaseButton({ bookId, price, isFree }: Props) {
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
      <button onClick={purchase} disabled={loading}
        style={{ padding:'5px 10px', borderRadius:5, background: isFree ? '#3dd6a3' : '#e8c547', color:'#0c0d10', border:'none', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',system-ui,sans-serif", opacity:loading?0.6:1 }}>
        {loading ? '…' : isFree ? 'Get Free' : `Buy $${parseFloat(String(price)).toFixed(2)}`}
      </button>
      {err && <div style={{ fontSize:10, color:'#f07060', fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>{err}</div>}
    </div>
  )
}
