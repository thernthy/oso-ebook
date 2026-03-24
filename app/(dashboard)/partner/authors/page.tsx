import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import pool                 from '@/lib/db'
import Link                 from 'next/link'

export default async function PartnerAuthorsPage() {
  const session   = await getServerSession(authOptions)
  const partnerId = session!.user.id

  const [authors] = await pool.execute(
    `SELECT 
       u.id, u.name, u.email, u.status, u.created_at,
       COUNT(DISTINCT b.id) AS book_count,
       COALESCE(SUM(b.total_reads), 0) AS total_reads,
       COALESCE(SUM(CASE WHEN b.status = 'published' THEN 1 ELSE 0 END), 0) AS published_count,
       COALESCE(SUM(CASE WHEN b.status = 'in_review' THEN 1 ELSE 0 END), 0) AS in_review_count,
       COALESCE((SELECT SUM(e.amount) FROM earnings e WHERE e.user_id = u.id AND e.role = 'author'), 0) AS total_revenue
     FROM users u
     LEFT JOIN books b ON b.author_id = u.id
     WHERE u.partner_id = ? AND u.role = 'author'
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
    [partnerId]
  ) as any[]

  const statusColor: Record<string, { bg:string; color:string }> = {
    active:    { bg:'rgba(61,214,163,0.12)',  color:'#3dd6a3' },
    suspended: { bg:'rgba(240,112,96,0.12)',  color:'#f07060' },
    pending:   { bg:'rgba(232,197,71,0.12)',  color:'#e8c547' },
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:'#edf0f0', letterSpacing:'-0.4px' }}>My Authors</div>
          <div style={{ fontSize:12, color:'#5e6b70', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
            {authors.length} author{(authors as any[]).length !== 1 ? 's' : ''} in your network
          </div>
        </div>
        <Link href="/partner/authors/invite" style={{ padding:'8px 18px', borderRadius:6, background:'#3dd6a3', color:'#0c0e0f', fontSize:13, fontWeight:700, textDecoration:'none' }}>
          + Invite Author
        </Link>
      </div>

      <div style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['Author','Status','Books','Published','In Review','Reads','Revenue'].map(h => (
                <th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:10, fontWeight:600, color:'#5e6b70', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", borderBottom:'1px solid #252c30', background:'#131618' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(authors as any[]).length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding:'48px', textAlign:'center', color:'#5e6b70' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>👥</div>
                  <div style={{ fontSize:14 }}>No authors yet</div>
                  <div style={{ fontSize:12, marginTop:4 }}>Invite authors to join your network</div>
                </td>
              </tr>
            ) : (
              (authors as any[]).map((author: any) => {
                const s = statusColor[author.status] || statusColor.pending
                return (
                  <tr key={author.id} style={{ borderBottom:'1px solid #252c30', transition:'background 0.15s' }}>
                    <td style={{ padding:'14px 18px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(157,125,245,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#9d7df5', flexShrink:0 }}>
                          {author.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:'#edf0f0' }}>{author.name}</div>
                          <div style={{ fontSize:11, color:'#5e6b70', fontFamily:"'JetBrains Mono',monospace" }}>{author.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'14px 18px' }}>
                      <span style={{ padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", background:s.bg, color:s.color }}>
                        {author.status}
                      </span>
                    </td>
                    <td style={{ padding:'14px 18px', fontSize:13, fontFamily:"'JetBrains Mono',monospace", color:'#edf0f0' }}>{author.book_count}</td>
                    <td style={{ padding:'14px 18px', fontSize:13, fontFamily:"'JetBrains Mono',monospace", color:'#3dd6a3' }}>{author.published_count}</td>
                    <td style={{ padding:'14px 18px', fontSize:13, fontFamily:"'JetBrains Mono',monospace", color: author.in_review_count > 0 ? '#e8c547' : '#5e6b70' }}>
                      {author.in_review_count}
                    </td>
                    <td style={{ padding:'14px 18px', fontSize:13, fontFamily:"'JetBrains Mono',monospace", color:'#edf0f0' }}>{Number(author.total_reads).toLocaleString()}</td>
                    <td style={{ padding:'14px 18px', fontSize:13, fontFamily:"'JetBrains Mono',monospace", color:'#3dd6a3' }}>
                      ${parseFloat(author.total_revenue || 0).toFixed(2)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
