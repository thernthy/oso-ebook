'use client'

import { useState, useEffect } from 'react'
import PartnerApproval from '@/components/oso/PartnerApproval'

type Tab = 'partners' | 'applications'

export default function PartnersPage() {
  const [tab,       setTab]       = useState<Tab>('partners')
  const [status,    setStatus]    = useState('active')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [data,      setData]      = useState<any>(null)
  const [loading,   setLoading]   = useState(true)

  const limit = 20

  useEffect(() => {
    if (tab === 'partners') {
      setLoading(true)
      const params = new URLSearchParams({ status, search, page: String(page), limit: String(limit) })
      fetch(`/api/partners?${params}`)
        .then(r => r.json())
        .then(j => { setData(j.data); setLoading(false) })
    } else {
      setLoading(true)
      fetch(`/api/partners/applications?status=pending`)
        .then(r => r.json())
        .then(j => { setData(j.data); setLoading(false) })
    }
  }, [tab, status, search, page])

  const totalPages = data ? Math.ceil(Number(data.total) / limit) : 1

  const statusStyle: Record<string, { bg:string; color:string }> = {
    active:    { bg:'rgba(61,214,163,0.12)',  color:'#3dd6a3' },
    suspended: { bg:'rgba(240,112,96,0.12)',  color:'#f07060' },
    pending:   { bg:'rgba(232,197,71,0.12)',  color:'#e8c547' },
    approved:  { bg:'rgba(61,214,163,0.12)',  color:'#3dd6a3' },
    rejected:  { bg:'rgba(240,112,96,0.12)',  color:'#f07060' },
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:'#f0efe8', letterSpacing:'-0.4px' }}>Partners</div>
          <div style={{ fontSize:12, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
            {tab === 'partners' ? `${data?.total || 0} accounts` : `${data?.applications?.length || 0} pending`}
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => setTab('partners')}
            style={{ padding:'7px 16px', borderRadius:6, fontSize:12, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", cursor:'pointer',
              background: tab === 'partners' ? '#e8c547' : '#1a1a1f', color: tab === 'partners' ? '#0c0c0e' : '#6b6b78', border:'1px solid #2a2a32' }}>
            Partner Accounts
          </button>
          <button onClick={() => setTab('applications')}
            style={{ padding:'7px 16px', borderRadius:6, fontSize:12, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", cursor:'pointer',
              background: tab === 'applications' ? '#e8c547' : '#1a1a1f', color: tab === 'applications' ? '#0c0c0e' : '#6b6b78', border:'1px solid #2a2a32' }}>
            Applications
          </button>
        </div>
      </div>

      {tab === 'partners' ? (
        <>
          {/* Filters */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {[
              { label:'All',       value:'' },
              { label:'Active',    value:'active' },
              { label:'Suspended', value:'suspended' },
              { label:'Pending',   value:'pending' },
            ].map(f => (
              <button key={f.value} onClick={() => { setStatus(f.value); setPage(1) }}
                style={{ padding:'5px 12px', borderRadius:5, fontSize:11, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", cursor:'pointer',
                  background: status === f.value ? '#e8c547' : '#1a1a1f', color: status === f.value ? '#0c0c0e' : '#6b6b78', border:'1px solid #2a2a32' }}>
                {f.label}
              </button>
            ))}
            <div style={{ marginLeft:'auto' }}>
              <input type="text" placeholder="Search name or email…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                style={{ background:'#1a1a1f', border:'1px solid #2a2a32', borderRadius:5, padding:'6px 12px', fontSize:12, color:'#f0efe8', outline:'none', fontFamily:"'JetBrains Mono',monospace", width:200 }} />
            </div>
          </div>

          {/* Table */}
          <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:10, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Partner','Status','Authors','Books','Published','Joined'].map(h => (
                    <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10, fontWeight:600, color:'#6b6b78', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", borderBottom:'1px solid #2a2a32' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>Loading…</td></tr>
                ) : (data?.partners || []).length === 0 ? (
                  <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>No partners found</td></tr>
                ) : (data?.partners || []).map((p: any) => {
                  const sc = statusStyle[p.status] || statusStyle.pending
                  return (
                    <tr key={p.id} style={{ borderBottom:'1px solid #2a2a32' }}>
                      <td style={{ padding:'11px 18px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(61,214,163,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#3dd6a3', flexShrink:0 }}>
                            {p.name?.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize:12, fontWeight:600, color:'#f0efe8' }}>{p.name}</div>
                            <div style={{ fontSize:10, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'11px 18px' }}>
                        <span style={{ padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", background:sc.bg, color:sc.color }}>{p.status}</span>
                      </td>
                      <td style={{ padding:'11px 18px', fontSize:12, color:'#f0efe8', fontFamily:"'JetBrains Mono',monospace", textAlign:'center' }}>
                        {p.author_count > 0 ? p.author_count : '—'}
                      </td>
                      <td style={{ padding:'11px 18px', fontSize:12, color:'#f0efe8', fontFamily:"'JetBrains Mono',monospace", textAlign:'center' }}>
                        {p.book_count > 0 ? p.book_count : '—'}
                      </td>
                      <td style={{ padding:'11px 18px', fontSize:12, color:'#3dd6a3', fontFamily:"'JetBrains Mono',monospace", textAlign:'center' }}>
                        {p.published_count > 0 ? p.published_count : '—'}
                      </td>
                      <td style={{ padding:'11px 18px', fontSize:11, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", whiteSpace:'nowrap' }}>
                        {new Date(p.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding:'12px 18px', borderTop:'1px solid #2a2a32', display:'flex', gap:6, alignItems:'center' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width:28, height:28, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontFamily:"'JetBrains Mono',monospace", cursor:'pointer',
                      background: p===page ? '#e8c547' : '#1a1a1f', color: p===page ? '#0c0c0e' : '#6b6b78', border:'1px solid #2a2a32', fontWeight:p===page?700:400 }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Applications */}
          <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:10, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Applicant','Company','Message','Applied','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10, fontWeight:600, color:'#6b6b78', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", borderBottom:'1px solid #2a2a32' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding:40, textAlign:'center', color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>Loading…</td></tr>
                ) : (data?.applications || []).length === 0 ? (
                  <tr><td colSpan={5} style={{ padding:40, textAlign:'center', color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>No pending applications</td></tr>
                ) : (data?.applications || []).map((app: any) => (
                  <tr key={app.id} style={{ borderBottom:'1px solid #2a2a32' }}>
                    <td style={{ padding:'11px 18px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(232,197,71,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#e8c547', flexShrink:0 }}>
                          {app.name?.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#f0efe8' }}>{app.name}</div>
                          <div style={{ fontSize:10, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'11px 18px', fontSize:12, color:'#f0efe8' }}>
                      {app.company || '—'}
                    </td>
                    <td style={{ padding:'11px 18px', fontSize:11, color:'#6b6b78', maxWidth:250, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {app.message || '—'}
                    </td>
                    <td style={{ padding:'11px 18px', fontSize:11, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", whiteSpace:'nowrap' }}>
                      {new Date(app.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    </td>
                    <td style={{ padding:'11px 18px' }}>
                      <PartnerApproval
                        applicationId={app.id}
                        applicantName={app.name}
                        applicantEmail={app.email}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
