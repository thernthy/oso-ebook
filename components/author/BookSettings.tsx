'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  book: any
}

export default function BookSettings({ book }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(book.title || '')
  const [description, setDescription] = useState(book.description || '')
  const [price, setPrice] = useState(book.price || '0.00')
  const [isFree, setIsFree] = useState(book.is_free === 1 || book.is_free === true)
  const [category, setCategory] = useState(book.category || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const canEdit = ['draft', 'rejected'].includes(book.status)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit) return

    setSaving(true)
    setMsg('')

    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          is_free: isFree ? 1 : 0,
          category: category.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMsg('✓ Settings saved')
        router.refresh()
      } else {
        setMsg(`⚠ ${data.error || 'Failed to save'}`)
      }
    } catch {
      setMsg('⚠ An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #272635', fontSize:13, fontWeight:700, color:'#eeecf8' }}>
        Book Settings
      </div>

      {canEdit ? (
        <form onSubmit={handleSave} style={{ padding:18, display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:600, color:'#635e80', marginBottom:6, textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'JetBrains Mono',monospace" }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width:'100%', padding:'8px 12px', background:'#1b1a28', border:'1px solid #272635', borderRadius:6, fontSize:13, color:'#eeecf8', outline:'none', boxSizing:'border-box' }}
            />
          </div>

          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:600, color:'#635e80', marginBottom:6, textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'JetBrains Mono',monospace" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of your book..."
              style={{ width:'100%', padding:'8px 12px', background:'#1b1a28', border:'1px solid #272635', borderRadius:6, fontSize:13, color:'#eeecf8', outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:"inherit" }}
            />
          </div>

          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:600, color:'#635e80', marginBottom:6, textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'JetBrains Mono',monospace" }}>
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g., Fiction, Fantasy, Romance"
              style={{ width:'100%', padding:'8px 12px', background:'#1b1a28', border:'1px solid #272635', borderRadius:6, fontSize:13, color:'#eeecf8', outline:'none', boxSizing:'border-box' }}
            />
          </div>

          <div>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input
                type="checkbox"
                checked={isFree}
                onChange={e => setIsFree(e.target.checked)}
                style={{ width:16, height:16, accentColor:'#9d7df5' }}
              />
              <span style={{ fontSize:12, color:'#eeecf8' }}>Free book</span>
            </label>
          </div>

          {!isFree && (
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:600, color:'#635e80', marginBottom:6, textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'JetBrains Mono',monospace" }}>
                Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                style={{ width:'100%', padding:'8px 12px', background:'#1b1a28', border:'1px solid #272635', borderRadius:6, fontSize:13, color:'#eeecf8', outline:'none', boxSizing:'border-box' }}
              />
            </div>
          )}

          {msg && (
            <div style={{ fontSize:12, color: msg.startsWith('✓') ? '#3dd6a3' : '#f07060', fontFamily:"'JetBrains Mono',monospace" }}>
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{ padding:'8px 16px', borderRadius:6, background: saving ? '#272635' : '#9d7df5', color:'#0d0c10', border:'none', fontSize:12, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:"'Syne',system-ui,sans-serif" }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      ) : (
        <div style={{ padding:18 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <div style={{ fontSize:10, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", textTransform:'uppercase', letterSpacing:'1px' }}>Title</div>
              <div style={{ fontSize:13, color:'#eeecf8', marginTop:2 }}>{book.title}</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", textTransform:'uppercase', letterSpacing:'1px' }}>Category</div>
              <div style={{ fontSize:13, color:'#eeecf8', marginTop:2 }}>{book.category || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", textTransform:'uppercase', letterSpacing:'1px' }}>Price</div>
              <div style={{ fontSize:13, color:'#3dd6a3', marginTop:2 }}>{book.is_free ? 'Free' : `$${parseFloat(book.price || 0).toFixed(2)}`}</div>
            </div>
          </div>
          <div style={{ marginTop:16, padding:'10px 12px', background:'rgba(99,94,128,0.1)', borderRadius:6, fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>
            Settings can only be edited while the book is in draft or rejected state.
          </div>
        </div>
      )}
    </div>
  )
}
