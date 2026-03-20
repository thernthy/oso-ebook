'use client'

import { useState } from 'react'

interface Chapter {
  id:            string
  chapter_num:   number
  title:         string
  word_count:    number
  is_published:  number
}

interface Props {
  bookId:     string
  chapters:   Chapter[]
  bookStatus: string
}

export default function ChapterList({ bookId, chapters: initial, bookStatus }: Props) {
  const [chapters,  setChapters]  = useState<Chapter[]>(initial)
  const [arranging, setArranging] = useState(false)
  const [editing,   setEditing]   = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState('')

  const canEdit = ['draft', 'rejected', 'in_review'].includes(bookStatus)

  async function aiArrange() {
    setArranging(true)
    setMsg('')
    const res  = await fetch(`/api/books/${bookId}/chapters/arrange`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ mode: 'ai' }),
    })
    const data = await res.json()
    setArranging(false)
    if (res.ok) {
      setMsg('✓ AI has rearranged your chapters')
      // Re-fetch chapters
      const r2   = await fetch(`/api/books/${bookId}/chapters`)
      const d2   = await r2.json()
      if (d2.data?.chapters) setChapters(d2.data.chapters)
    } else {
      setMsg(`⚠ ${data.error}`)
    }
  }

  async function togglePublish(chapter: Chapter) {
    const res = await fetch(`/api/books/${bookId}/chapters/${chapter.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_published: !chapter.is_published }),
    })
    if (res.ok) {
      setChapters(chs => chs.map(c => c.id === chapter.id ? { ...c, is_published: chapter.is_published ? 0 : 1 } : c))
    }
  }

  async function saveTitle(chapter: Chapter) {
    setSaving(true)
    const res = await fetch(`/api/books/${bookId}/chapters/${chapter.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: editTitle }),
    })
    setSaving(false)
    if (res.ok) {
      setChapters(chs => chs.map(c => c.id === chapter.id ? { ...c, title: editTitle } : c))
      setEditing(null)
    }
  }

  async function deleteChapter(chapter: Chapter) {
    if (!confirm(`Delete chapter "${chapter.title}"?`)) return
    const res = await fetch(`/api/books/${bookId}/chapters/${chapter.id}`, { method:'DELETE' })
    if (res.ok) {
      setChapters(chs => chs.filter(c => c.id !== chapter.id))
    }
  }

  return (
    <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #272635', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#eeecf8' }}>
          Chapters <span style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", marginLeft:6 }}>{chapters.length} total</span>
        </div>
        {canEdit && chapters.length > 1 && (
          <button onClick={aiArrange} disabled={arranging}
            style={{ padding:'5px 12px', borderRadius:5, background:'rgba(157,125,245,0.15)', border:'1px solid rgba(157,125,245,0.3)', color:'#9d7df5', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace", opacity:arranging?0.6:1 }}>
            {arranging ? '⟳ AI arranging…' : '✦ AI Auto-Arrange'}
          </button>
        )}
      </div>

      {msg && (
        <div style={{ padding:'10px 18px', fontSize:12, color: msg.startsWith('✓') ? '#3dd6a3' : '#f07060', fontFamily:"'JetBrains Mono',monospace", borderBottom:'1px solid #272635', background: msg.startsWith('✓') ? 'rgba(61,214,163,0.05)' : 'rgba(240,112,96,0.05)' }}>
          {msg}
        </div>
      )}

      {chapters.length === 0 ? (
        <div style={{ padding:'32px', textAlign:'center', color:'#635e80' }}>
          <div style={{ fontSize:24, marginBottom:8 }}>📄</div>
          <div style={{ fontSize:13 }}>No chapters yet. Upload a book file to auto-detect chapters.</div>
        </div>
      ) : (
        <div style={{ maxHeight:520, overflowY:'auto' }}>
          {chapters.map((ch, idx) => (
            <div key={ch.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 18px', borderBottom:'1px solid #272635', transition:'background .12s' }}>

              {/* Chapter number */}
              <div style={{ width:28, height:28, borderRadius:5, background:'#1b1a28', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:'#635e80', flexShrink:0 }}>
                {ch.chapter_num}
              </div>

              {/* Title */}
              <div style={{ flex:1 }}>
                {editing === ch.id ? (
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveTitle(ch); if (e.key === 'Escape') setEditing(null) }}
                    autoFocus
                    style={{ background:'#1b1a28', border:'1px solid #9d7df5', borderRadius:5, padding:'4px 10px', fontSize:12, color:'#eeecf8', outline:'none', width:'100%', fontFamily:"'Syne',system-ui,sans-serif" }}
                  />
                ) : (
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#eeecf8' }}>{ch.title}</div>
                    <div style={{ fontSize:10, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", marginTop:1 }}>
                      {ch.word_count.toLocaleString()} words
                    </div>
                  </div>
                )}
              </div>

              {/* Published toggle */}
              <div onClick={() => canEdit && togglePublish(ch)}
                style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", padding:'3px 7px', borderRadius:4, cursor:canEdit?'pointer':'default',
                  background: ch.is_published ? 'rgba(61,214,163,0.12)' : 'rgba(99,94,128,0.15)',
                  color:      ch.is_published ? '#3dd6a3' : '#635e80' }}>
                {ch.is_published ? 'live' : 'draft'}
              </div>

              {/* Actions */}
              {canEdit && (
                <div style={{ display:'flex', gap:4 }}>
                  {editing === ch.id ? (
                    <button onClick={() => saveTitle(ch)} disabled={saving}
                      style={{ padding:'3px 8px', borderRadius:4, background:'rgba(157,125,245,0.2)', border:'none', color:'#9d7df5', fontSize:10, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
                      {saving ? '…' : 'Save'}
                    </button>
                  ) : (
                    <button onClick={() => { setEditing(ch.id); setEditTitle(ch.title) }}
                      style={{ padding:'3px 8px', borderRadius:4, background:'transparent', border:'1px solid #272635', color:'#635e80', fontSize:10, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
                      Edit
                    </button>
                  )}
                  <button onClick={() => deleteChapter(ch)}
                    style={{ padding:'3px 8px', borderRadius:4, background:'transparent', border:'1px solid #272635', color:'#635e80', fontSize:10, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
