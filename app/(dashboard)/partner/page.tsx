import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import pool                 from '@/lib/db'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'

export default async function PartnerDashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  
  const partnerId = session.user.id

  const [
    [authorStats],
    [bookStats],
    [readStats],
    [revenueStats],
    [recentAuthors],
    [reviewQueue],
    [monthlyRevenue],
  ] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS total FROM users WHERE partner_id = ? AND role = 'author'`, [partnerId]),
    pool.execute(`SELECT COUNT(*) AS total FROM books b JOIN users u ON b.author_id = u.id WHERE u.partner_id = ? AND b.status = 'in_review'`, [partnerId]),
    pool.execute(`SELECT SUM(b.total_reads) AS total_reads FROM books b JOIN users u ON b.author_id = u.id WHERE u.partner_id = ?`, [partnerId]),
    pool.execute(`
      SELECT COALESCE(SUM(amount), 0) AS total_revenue,
             COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount END), 0) AS month_revenue
      FROM earnings WHERE user_id = ? AND role = 'partner'`, [partnerId]),
    pool.execute(`SELECT id, name, email, created_at FROM users WHERE partner_id = ? AND role = 'author' ORDER BY created_at DESC LIMIT 5`, [partnerId]),
    pool.execute(`
      SELECT b.id, b.title, u.name AS author_name, b.created_at 
      FROM books b JOIN users u ON b.author_id = u.id 
      WHERE u.partner_id = ? AND b.status = 'in_review' 
      ORDER BY b.created_at ASC LIMIT 5`, [partnerId]),
    pool.execute(`
      SELECT DATE_FORMAT(created_at, '%b') AS month,
             COALESCE(SUM(amount), 0) AS revenue
      FROM earnings WHERE user_id = ? AND role = 'partner'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY MIN(created_at) DESC LIMIT 6`, [partnerId]),
  ]) as any[]

  const as = (authorStats as any[])[0] || {}
  const bs = (bookStats as any[])[0] || {}
  const reads = (readStats as any[])[0]?.total_reads || 0
  const rs = (revenueStats as any[])[0] || {}
  const rev = (monthlyRevenue as any[]).reverse()
  const maxRev = Math.max(...rev.map((r: any) => parseFloat(r.revenue) || 0), 1)

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20, background:'#0c0e0f', color:'#edf0f0' }}>
      
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.4px' }}>Partner Dashboard</div>
          <div style={{ fontSize:12, color:'#5e6b70', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
            Managing {as.total || 0} authors
          </div>
        </div>
        <Link href="/partner/authors/invite" style={{ padding:'8px 18px', borderRadius:6, background:'#3dd6a3', color:'#0c0e0f', fontSize:13, fontWeight:700, textDecoration:'none' }}>
          + Invite New Author
        </Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:'Total Authors',   value:as.total||0,       color:'#3dd6a3', sub:`Active collaborators`, icon:'👥' },
          { label:'Books In Review', value:bs.total||0,       color:'#f07060', sub:`Awaiting approval`,   icon:'⏳' },
          { label:'Total Network Reads', value:reads.toLocaleString(), color:'#5ba4f5', sub:`Across all authors`, icon:'📈' },
          { label:'Partner Revenue', value:`$${parseFloat(rs.total_revenue||0).toFixed(2)}`, color:'#e8c547', sub:`$${parseFloat(rs.month_revenue||0).toFixed(2)} this month`, icon:'💰' },
        ].map(s => (
          <div key={s.label} style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, padding:'18px 20px', position:'relative' }}>
            <div style={{ position:'absolute', top:16, right:16, fontSize:18, opacity:0.3 }}>{s.icon}</div>
            <div style={{ fontSize:10, color:'#5e6b70', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace" }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, margin:'6px 0 2px' }}>{s.value}</div>
            <div style={{ fontSize:10, color:'#5e6b70', fontFamily:"'JetBrains Mono',monospace" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        
        {/* Review Queue */}
        <div style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #252c30', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:13, fontWeight:700 }}>Review Queue</div>
            <Link href="/partner/books" style={{ fontSize:11, color:'#3dd6a3', textDecoration:'none' }}>View queue →</Link>
          </div>
          {(reviewQueue as any[]).length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#5e6b70', fontSize:12 }}>No books pending review.</div>
          ) : (
            <div style={{ padding:0 }}>
              {(reviewQueue as any[]).map((book: any) => (
                <div key={book.id} style={{ padding:'12px 18px', borderBottom:'1px solid #252c30', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{book.title}</div>
                    <div style={{ fontSize:11, color:'#5e6b70' }}>by {book.author_name}</div>
                  </div>
                  <Link href={`/partner/books/${book.id}`} style={{ fontSize:11, padding:'4px 10px', borderRadius:4, border:'1px solid #3dd6a3', color:'#3dd6a3', textDecoration:'none' }}>Review</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, padding:'18px' }}>
           <div style={{ fontSize:13, fontWeight:700, marginBottom:20 }}>Network Earnings</div>
           <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120, marginBottom:10 }}>
              {rev.length === 0 ? (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#5e6b70', fontSize:12 }}>No data yet</div>
              ) : rev.map((r: any, i: number) => {
                const h = Math.max(5, (parseFloat(r.revenue) / maxRev) * 100)
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div title={`$${parseFloat(r.revenue).toFixed(2)}`}
                      style={{ width:'100%', height:`${h}px`, borderRadius:'4px 4px 0 0', background: i === rev.length-1 ? '#3dd6a3' : '#252c30' }} />
                    <div style={{ fontSize:9, color:'#5e6b70', fontFamily:"'JetBrains Mono',monospace" }}>{r.month}</div>
                  </div>
                )
              })}
           </div>
           <div style={{ paddingTop:14, borderTop:'1px solid #252c30', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:11, color:'#5e6b70' }}>Your Total Cut</div>
              <div style={{ fontSize:15, fontWeight:800, color:'#3dd6a3' }}>${parseFloat(rs.total_revenue||0).toFixed(2)}</div>
           </div>
        </div>

      </div>

    </div>
  )
}
