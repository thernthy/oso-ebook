'use client'

import { useState, FormEvent } from 'react'
import { useRouter }           from 'next/navigation'

const CATEGORIES = ['Fiction','Non-Fiction','Mystery','Romance','Science','History','Biography','Poetry','Children','Self-Help','Technology','Business']

export default function NewBookPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    '',
    price:       '',
    is_free:     false,
  })

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/books', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:       form.title,
        description: form.description,
        category:    form.category,
        price:       form.is_free ? 0 : parseFloat(form.price) || 0,
        is_free:     form.is_free,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to create book')
      return
    }

    // Redirect to the book page to upload file
    router.push(`/dashboard/author/books/${data.data.id}`)
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'32px 28px', maxWidth:640 }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:20, fontWeight:800, color:'#eeecf8', letterSpacing:'-0.4px' }}>New Book</div>
        <div style={{ fontSize:12, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>Fill in the details then upload your manuscript</div>
      </div>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>

        {/* Title */}
        <Field label="Book Title *">
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Enter book title"
            required
            style={inputStyle}
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Brief description of your book"
            rows={4}
            style={{ ...inputStyle, resize:'vertical' }}
          />
        </Field>

        {/* Category */}
        <Field label="Category">
          <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        {/* Pricing */}
        <Field label="Pricing">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input
                type="checkbox"
                checked={form.is_free}
                onChange={e => set('is_free', e.target.checked)}
                style={{ width:16, height:16, accentColor:'#9d7df5' }}
              />
              <span style={{ fontSize:13, color:'#eeecf8' }}>Free book (no purchase required)</span>
            </label>

            {!form.is_free && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:14, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>$</span>
                <input
                  type="number"
                  min="0.99"
                  step="0.01"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  placeholder="4.99"
                  style={{ ...inputStyle, width:140 }}
                />
              </div>
            )}
          </div>
        </Field>

        {error && (
          <div style={{ background:'rgba(240,112,96,0.1)', border:'1px solid rgba(240,112,96,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#f07060' }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display:'flex', gap:10, paddingTop:4 }}>
          <button type="submit" disabled={loading}
            style={{ padding:'10px 24px', borderRadius:6, background:'#9d7df5', color:'#0d0c10', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',system-ui,sans-serif", opacity:loading?0.7:1 }}>
            {loading ? 'Creating…' : 'Create Book →'}
          </button>
          <button type="button" onClick={() => router.back()}
            style={{ padding:'10px 18px', borderRadius:6, background:'transparent', color:'#635e80', border:'1px solid #272635', fontSize:13, cursor:'pointer', fontFamily:"'Syne',system-ui,sans-serif" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
      <label style={{ fontSize:12, fontWeight:600, color:'#9a9ab0', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.3px' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background:   '#1b1a28',
  border:       '1px solid #272635',
  borderRadius: '8px',
  padding:      '10px 14px',
  fontSize:     '13px',
  color:        '#eeecf8',
  outline:      'none',
  width:        '100%',
  fontFamily:   "'Syne',system-ui,sans-serif",
}
