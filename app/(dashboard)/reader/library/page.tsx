'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Book = {
  id: number
  title: string
  description: string | null
  cover_url: string | null
  category: string | null
  author_name: string
  purchased_at: string
  price_paid: number
  current_chapter_id: number | null
  current_chapter_num: number | null
  current_chapter_title: string | null
  scroll_pct: number | null
  total_chapters: number
  avg_rating: number
}

export default function LibraryPage() {
  const [books,   setBooks]   = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<'all' | 'reading' | 'completed'>('all')

  useEffect(() => {
    fetch('/api/purchases')
      .then(r => r.json())
      .then(d => {
        if (d.success) setBooks(d.books)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredBooks = books.filter(book => {
    if (filter === 'reading') return book.scroll_pct && book.scroll_pct > 0 && book.scroll_pct < 100
    if (filter === 'completed') return book.scroll_pct === 100
    return true
  })

  const stats = {
    total: books.length,
    reading: books.filter(b => b.scroll_pct && b.scroll_pct > 0 && b.scroll_pct < 100).length,
    completed: books.filter(b => b.scroll_pct === 100).length,
  }

  if (loading) {
    return (
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>Loading...</span>
      </div>
    )
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'32px', background:'#0a0a0f', minHeight:'100vh' }}>
      {/* Header */}
      <div style={{ maxWidth:1200, margin:'0 auto', marginBottom:32 }}>
        <h1 style={{ fontSize:28, fontWeight:800, color:'#f0efe8', marginBottom:8 }}>My Library</h1>
        <p style={{ fontSize:14, color:'#6b6b78' }}>All your books in one place</p>
      </div>

      {/* Stats */}
      <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:32 }}>
        {[
          { label:'Total Books', value:stats.total, color:'#5ba4f5' },
          { label:'Reading', value:stats.reading, color:'#f97316' },
          { label:'Completed', value:stats.completed, color:'#34d399' },
        ].map(s => (
          <div key={s.label} style={{
            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
            borderRadius:12, padding:'20px 24px', display:'flex', alignItems:'center', gap:16
          }}>
            <div style={{ width:44, height:44, borderRadius:10, background:`${s.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
              {s.label === 'Total Books' ? '📚' : s.label === 'Reading' ? '📖' : '✓'}
            </div>
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:'#fff' }}>{s.value}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', gap:12, marginBottom:24 }}>
        {(['all','reading','completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding:'8px 20px', borderRadius:8, border:'1px solid',
              borderColor: filter === f ? '#5ba4f5' : '#2a2a32',
              background: filter === f ? 'rgba(91,164,245,0.1)' : 'transparent',
              color: filter === f ? '#5ba4f5' : '#6b6b78',
              fontSize:13, fontWeight:600, cursor:'pointer',
              fontFamily:"'Syne',system-ui,sans-serif",
              textTransform:'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div style={{ maxWidth:1200, margin:'0 auto', textAlign:'center', padding:'80px 20px' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>📚</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#f0efe8', marginBottom:8 }}>
            {filter === 'all' ? 'No books yet' : `No ${filter} books`}
          </h2>
          <p style={{ fontSize:14, color:'#6b6b78', marginBottom:24 }}>
            {filter === 'all' ? 'Browse the catalog and start your reading journey' : 'Keep reading to see your progress here'}
          </p>
          <Link href="/reader/browse" style={{
            display:'inline-block', padding:'12px 28px', borderRadius:10,
            background:'#5ba4f5', color:'#0c0c0e', fontWeight:700, textDecoration:'none',
            fontSize:14,
          }}>
            Browse Books
          </Link>
        </div>
      ) : (
        <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:24 }}>
          {filteredBooks.map(book => (
            <Link
              key={book.id}
              href={`/reader/read/${book.id}`}
              style={{ textDecoration:'none' }}
            >
              <div style={{
                background:'#131316', border:'1px solid #2a2a32', borderRadius:16,
                overflow:'hidden', transition:'all 0.2s', cursor:'pointer',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#5ba4f5')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a32')}
              >
                {/* Cover */}
                <div style={{ height:200, background: book.cover_url ? `url(${book.cover_url}) center/cover` : 'linear-gradient(135deg, #6366f1, #8b5cf6)', position:'relative' }}>
                  {!book.cover_url && (
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:48, opacity:0.5 }}>📖</div>
                  )}
                  {book.scroll_pct !== null && book.scroll_pct > 0 && (
                    <div style={{
                      position:'absolute', bottom:0, left:0, right:0, height:4,
                      background:'rgba(0,0,0,0.3)',
                    }}>
                      <div style={{ height:'100%', width:`${book.scroll_pct}%`, background:'#5ba4f5', transition:'width 0.3s' }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding:20 }}>
                  <h3 style={{ fontSize:16, fontWeight:700, color:'#f0efe8', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {book.title}
                  </h3>
                  <p style={{ fontSize:13, color:'#9d7df5', marginBottom:8 }}>{book.author_name}</p>
                  
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'#6b6b78' }}>
                      {book.scroll_pct ? `${Math.round(book.scroll_pct)}% complete` : 'Not started'}
                    </span>
                    {book.avg_rating > 0 && (
                      <span style={{ fontSize:12, color:'#fbbf24' }}>★ {book.avg_rating.toFixed(1)}</span>
                    )}
                  </div>

                  {book.scroll_pct && book.scroll_pct > 0 && book.scroll_pct < 100 && book.current_chapter_title && (
                    <p style={{ fontSize:12, color:'#6b6b78', marginTop:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      Continue: {book.current_chapter_title}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
