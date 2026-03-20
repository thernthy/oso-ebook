'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'

interface Props {
  book:         any
  chapterCount: number
}

export default function BookActions({ book, chapterCount }: Props) {
  const router   = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState('')

  async function submitForReview() {
    if (chapterCount === 0) {
      setMsg('⚠ Upload a file first — no chapters detected yet')
      return
    }
    setLoading(true)
    const res = await fetch(`/api/books/${book.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'in_review' }),
    })
    setLoading(false)
    if (res.ok) {
      setMsg('✓ Submitted for partner review!')
      router.refresh()
    } else {
      const d = await res.json()
      setMsg(`⚠ ${d.error}`)
    }
  }

  async function deleteBook() {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return
    setLoading(true)
    const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) router.push('/dashboard/author/books')
    else {
      const d = await res.json()
      setMsg(`⚠ ${d.error}`)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
      <div style={{ display:'flex', gap:8 }}>
        {['draft', 'rejected'].includes(book.status) && (
          <button onClick={submitForReview} disabled={loading}
            style={{ padding:'8px 18px', borderRadius:6, background:'#9d7df5', color:'#0d0c10', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',system-ui,sans-serif", opacity:loading?0.7:1 }}>
            {loading ? '…' : '→ Submit for Review'}
          </button>
        )}
        {book.status === 'draft' && (
          <button onClick={deleteBook} disabled={loading}
            style={{ padding:'8px 14px', borderRadius:6, background:'transparent', border:'1px solid rgba(240,112,96,0.3)', color:'#f07060', fontSize:12, cursor:'pointer', fontFamily:"'Syne',system-ui,sans-serif" }}>
            Delete
          </button>
        )}
        {book.status === 'in_review' && (
          <span style={{ fontSize:12, color:'#9d7df5', fontFamily:"'JetBrains Mono',monospace", padding:'8px 0' }}>
            ⟳ Awaiting partner review
          </span>
        )}
        {book.status === 'published' && (
          <span style={{ fontSize:12, color:'#3dd6a3', fontFamily:"'JetBrains Mono',monospace", padding:'8px 0' }}>
            ✓ Live
          </span>
        )}
      </div>
      {msg && (
        <div style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", color: msg.startsWith('✓') ? '#3dd6a3' : '#f07060' }}>
          {msg}
        </div>
      )}
    </div>
  )
}
