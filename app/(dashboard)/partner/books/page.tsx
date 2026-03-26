import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool            from '@/lib/db'
import ReviewActions   from '@/components/partner/ReviewActions'

export default async function PartnerBooksPage() {
  const session   = await getServerSession(authOptions)
  const partnerId = session!.user.id

  const [inReview] = await pool.execute(
    `SELECT b.id, b.title, b.description, b.category, b.created_at,
            u.name AS author_name, u.email AS author_email
     FROM books b
     JOIN users u ON b.author_id = u.id
     WHERE b.partner_id = ? AND b.status = 'in_review'
     ORDER BY b.updated_at DESC`,
    [partnerId]
  ) as any[]

  const [allBooks] = await pool.execute(
    `SELECT b.id, b.title, b.status, b.price, b.is_free,
            b.total_reads, b.created_at,
            u.name AS author_name
     FROM books b
     JOIN users u ON b.author_id = u.id
     WHERE b.partner_id = ?
     ORDER BY b.created_at DESC LIMIT 20`,
    [partnerId]
  ) as any[]

  const statusColor: Record<string, { bg:string; color:string }> = {
    published: { bg:'rgba(61,214,163,0.12)',  color:'#3dd6a3' },
    in_review: { bg:'rgba(61,214,163,0.12)',  color:'#e8c547' },
    draft:     { bg:'rgba(99,94,128,0.2)',    color:'#5e6b70' },
    rejected:  { bg:'rgba(240,112,96,0.12)',  color:'#f07060' },
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>

      <div>
        <div style={{ fontSize:20, fontWeight:800, color:'#edf0f0', letterSpacing:'-0.4px' }}>Book Management</div>
        <div style={{ fontSize:12, color:'#5e6b70', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
          Review submissions and manage your catalog
        </div>
      </div>

      {/* Review Queue */}
      <div style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #252c30', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#edf0f0' }}>Review Queue</div>
          {(inReview as any[]).length > 0 && (
            <span style={{ background:'#f07060', color:'#fff', fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", padding:'2px 7px', borderRadius:10 }}>
              {(inReview as any[]).length} pending
            </span>
          )}
        </div>

        {(inReview as any[]).length === 0 ? (
          <div style={{ padding:'32px', textAlign:'center', color:'#5e6b70' }}>
            <div style={{ fontSize:22, marginBottom:8 }}>✓</div>
            <div style={{ fontSize:13 }}>No books pending review</div>
          </div>
        ) : (
          (inReview as any[]).map((book: any) => (
            <div key={book.id} style={{ padding:'16px 18px', borderBottom:'1px solid #252c30', display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:44, height:56, borderRadius:6, background:'rgba(157,125,245,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>📕</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#edf0f0' }}>{book.title}</div>
                <div style={{ fontSize:11, color:'#5e6b70', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
                  {book.author_name}
                </div>
                {book.description && (
                  <div style={{ fontSize:12, color:'#5e6b70', marginTop:6, lineHeight:1.5, maxWidth:500 }}>
                    {book.description.slice(0, 140)}{book.description.length > 140 ? '…' : ''}
                  </div>
                )}
              </div>
              <ReviewActions bookId={book.id} bookTitle={book.title} />
            </div>
          ))
        )}
      </div>

      {/* Full catalog */}
      <div style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #252c30', fontSize:13, fontWeight:700, color:'#edf0f0' }}>
          Full Catalog
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['Title','Author','Status','Reads','Price'].map(h => (
                <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10, fontWeight:600, color:'#5e6b70', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", borderBottom:'1px solid #252c30' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(allBooks as any[]).map((b: any) => {
              const s = statusColor[b.status] || statusColor.draft
              return (
                <tr key={b.id} style={{ borderBottom:'1px solid #252c30' }}>
                  <td style={{ padding:'11px 18px', fontSize:13, fontWeight:600, color:'#edf0f0' }}>{b.title}</td>
                  <td style={{ padding:'11px 18px', fontSize:12, color:'#5e6b70', fontFamily:"'JetBrains Mono',monospace" }}>{b.author_name}</td>
                  <td style={{ padding:'11px 18px' }}>
                    <span style={{ padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", background:s.bg, color:s.color }}>
                      {b.status.replace('_',' ')}
                    </span>
                  </td>
                  <td style={{ padding:'11px 18px', fontSize:12, fontFamily:"'JetBrains Mono',monospace", color:'#edf0f0' }}>{b.total_reads?.toLocaleString()}</td>
                  <td style={{ padding:'11px 18px', fontSize:12, fontFamily:"'JetBrains Mono',monospace", color:'#3dd6a3' }}>
                    {b.is_free ? 'Free' : `$${parseFloat(b.price).toFixed(2)}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
