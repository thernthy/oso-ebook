'use client'

import { useState } from 'react'

interface Props {
  initialSettings: Record<string, string>
}

export default function SettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')

  function set(key: string, value: string) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  const authorPct  = parseFloat(settings.revenue_author_pct  || '70')
  const partnerPct = parseFloat(settings.revenue_partner_pct || '20')
  const platformPct= parseFloat(settings.revenue_platform_pct|| '10')
  const splitTotal = authorPct + partnerPct + platformPct

  async function save() {
    if (splitTotal !== 100) { setMsg('⚠ Revenue split must total 100%'); return }
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/admin/settings', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(settings),
    })
    setSaving(false)
    const data = await res.json()
    setMsg(res.ok ? '✓ Settings saved successfully' : `⚠ ${data.error}`)
  }

  const inp: React.CSSProperties = {
    background:'#1a1a1f', border:'1px solid #2a2a32', borderRadius:7,
    padding:'9px 13px', fontSize:13, color:'#f0efe8', outline:'none',
    width:'100%', fontFamily:"'Syne',system-ui,sans-serif",
  }
  const label: React.CSSProperties = {
    fontSize:11, fontWeight:600, color:'#9a9aa8',
    fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.5px', marginBottom:6, display:'block',
  }
  const section: React.CSSProperties = {
    background:'#131316', border:'1px solid #2a2a32', borderRadius:10, overflow:'hidden', marginBottom:16,
  }
  const sectionHead: React.CSSProperties = {
    padding:'13px 18px', borderBottom:'1px solid #2a2a32',
    fontSize:13, fontWeight:700, color:'#f0efe8',
  }
  const sectionBody: React.CSSProperties = {
    padding:18, display:'flex', flexDirection:'column', gap:14,
  }

  return (
    <div>

      {/* Storage */}
      <div style={section}>
        <div style={sectionHead}>📦 Storage Provider</div>
        <div style={sectionBody}>
          <div>
            <label style={label}>Provider</label>
            <div style={{ display:'flex', gap:10 }}>
              {['local','s3'].map(p => (
                <label key={p} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px 14px', borderRadius:6, border:`1px solid ${settings.storage_provider===p?'#e8c547':'#2a2a32'}`, background: settings.storage_provider===p?'rgba(232,197,71,0.06)':'transparent', flex:1 }}>
                  <input type="radio" value={p} checked={settings.storage_provider===p}
                    onChange={() => set('storage_provider',p)}
                    style={{ accentColor:'#e8c547' }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#f0efe8' }}>{p === 'local' ? 'Local Filesystem' : 'AWS S3 / Compatible'}</div>
                    <div style={{ fontSize:11, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
                      {p === 'local' ? 'Good for development' : 'Recommended for production'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {settings.storage_provider === 'local' && (
            <div>
              <label style={label}>Upload Directory</label>
              <input value={settings.storage_local_dir||''} onChange={e=>set('storage_local_dir',e.target.value)} style={inp} placeholder="uploads/books" />
            </div>
          )}

          {settings.storage_provider === 's3' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { key:'storage_s3_bucket',   label:'S3 Bucket',    placeholder:'my-ebook-bucket' },
                { key:'storage_s3_region',   label:'Region',        placeholder:'us-east-1' },
                { key:'storage_s3_key',      label:'Access Key ID', placeholder:'AKIA…' },
                { key:'storage_s3_secret',   label:'Secret Key',    placeholder:'Enter to update…' },
                { key:'storage_s3_endpoint', label:'Custom Endpoint (optional)', placeholder:'https://…' },
              ].map(f => (
                <div key={f.key} style={f.key==='storage_s3_endpoint'?{gridColumn:'1/-1'}:{}}>
                  <label style={label}>{f.label}</label>
                  <input
                    value={settings[f.key]||''}
                    onChange={e=>set(f.key,e.target.value)}
                    type={f.key==='storage_s3_secret'?'password':'text'}
                    placeholder={f.placeholder}
                    style={inp}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={label}>Max Upload Size (MB)</label>
              <input type="number" value={settings.max_upload_mb||'50'} onChange={e=>set('max_upload_mb',e.target.value)} style={inp} />
            </div>
            <div>
              <label style={label}>Allowed Formats</label>
              <input value={settings.allowed_formats||'pdf,epub,docx,txt'} onChange={e=>set('allowed_formats',e.target.value)} style={inp} placeholder="pdf,epub,docx,txt" />
            </div>
          </div>
        </div>
      </div>

      {/* Cover image standards */}
      <div style={section}>
        <div style={sectionHead}>🖼 Book Cover Standards</div>
        <div style={sectionBody}>
          <div style={{ fontSize:12, color:'#6b6b78', lineHeight:1.6, padding:'8px 12px', background:'rgba(157,125,245,0.06)', borderRadius:6, border:'1px solid rgba(157,125,245,0.15)' }}>
            Industry standard is <strong style={{color:'#9d7df5'}}>1600×2400px (2:3 ratio)</strong> — used by Amazon KDP, Apple Books, and Google Play. Authors will be warned and shown a crop preview if their image doesn't match.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { key:'cover_width',        label:'Full Cover Width (px)'  },
              { key:'cover_height',       label:'Full Cover Height (px)' },
              { key:'cover_thumb_width',  label:'Thumbnail Width (px)'   },
              { key:'cover_thumb_height', label:'Thumbnail Height (px)'  },
              { key:'cover_max_mb',       label:'Max Cover Size (MB)'    },
            ].map(f => (
              <div key={f.key}>
                <label style={label}>{f.label}</label>
                <input type="number" value={settings[f.key]||''} onChange={e=>set(f.key,e.target.value)} style={inp} />
              </div>
            ))}
            <div>
              <label style={label}>Allowed Formats</label>
              <input value={settings.cover_formats||'jpg,jpeg,png,webp'} onChange={e=>set('cover_formats',e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ fontSize:11, color:'#6b6b78' }}>
            Current ratio: {settings.cover_width && settings.cover_height
              ? `${(parseInt(settings.cover_width)/parseInt(settings.cover_height)).toFixed(4)} (${parseInt(settings.cover_width)}:${parseInt(settings.cover_height)})`
              : '—'}
          </div>
        </div>
      </div>

      {/* Revenue split */}
      <div style={section}>
        <div style={sectionHead}>💰 Revenue Split</div>
        <div style={sectionBody}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {[
              { key:'revenue_author_pct',   label:'Author %',   color:'#9d7df5' },
              { key:'revenue_partner_pct',  label:'Partner %',  color:'#3dd6a3' },
              { key:'revenue_platform_pct', label:'Platform %', color:'#e8c547' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ ...label, color: f.color }}>{f.label}</label>
                <input
                  type="number" min="0" max="100" step="1"
                  value={settings[f.key]||''}
                  onChange={e=>set(f.key,e.target.value)}
                  style={{ ...inp, borderColor: f.color+'44' }}
                />
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 14px', borderRadius:7, background: splitTotal===100?'rgba(61,214,163,0.08)':'rgba(240,112,96,0.08)', border:`1px solid ${splitTotal===100?'rgba(61,214,163,0.2)':'rgba(240,112,96,0.2)'}`, fontSize:12, fontFamily:"'JetBrains Mono',monospace", color: splitTotal===100?'#3dd6a3':'#f07060' }}>
            Total: {splitTotal}% {splitTotal===100 ? '✓ Valid' : `— must equal 100% (${100-splitTotal > 0 ? `${100-splitTotal}% short` : `${splitTotal-100}% over`})`}
          </div>
          <div style={{ fontSize:12, color:'#6b6b78', lineHeight:1.6 }}>
            On a $10 book: Author gets <strong style={{color:'#9d7df5'}}>${(10*authorPct/100).toFixed(2)}</strong>, Partner gets <strong style={{color:'#3dd6a3'}}>${(10*partnerPct/100).toFixed(2)}</strong>, Platform keeps <strong style={{color:'#e8c547'}}>${(10*platformPct/100).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Registration settings */}
      <div style={section}>
        <div style={sectionHead}>👤 Reader Registration</div>
        <div style={sectionBody}>
          <div>
            <label style={label}>Phone Country Code</label>
            <input
              value={settings.phone_prefix||'+855'}
              onChange={e=>set('phone_prefix',e.target.value)}
              style={{ ...inp, maxWidth: 140 }}
              placeholder="+855"
            />
            <div style={{ fontSize:11, color:'#6b6b78', marginTop:4 }}>
              Default prefix for reader phone numbers during signup (e.g., +855 for Cambodia, +66 for Thailand)
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      {msg && (
        <div style={{ marginBottom:14, padding:'10px 14px', borderRadius:7, background: msg.startsWith('✓')?'rgba(61,214,163,0.08)':'rgba(240,112,96,0.08)', border:`1px solid ${msg.startsWith('✓')?'rgba(61,214,163,0.25)':'rgba(240,112,96,0.25)'}`, fontSize:12, fontFamily:"'JetBrains Mono',monospace", color: msg.startsWith('✓')?'#3dd6a3':'#f07060' }}>
          {msg}
        </div>
      )}

      <button onClick={save} disabled={saving || splitTotal !== 100}
        style={{ padding:'11px 28px', borderRadius:7, background:'#e8c547', color:'#0c0c0e', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',system-ui,sans-serif", opacity:saving||splitTotal!==100?0.6:1 }}>
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}
