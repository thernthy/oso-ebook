import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import pool                 from '@/lib/db'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'
import { getTranslations }  from '@/lib/i18n/server'

export default async function AuthorDashboard() {
  const t = getTranslations()
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  
  const authorId = session.user.id

  // Fetch stats for this specific author
  const [
    [bookStats],
    [readStats],
    [revenueStats],
    [recentBooks],
    [monthlyRevenue],
  ] = await Promise.all([
    pool.execute(`
      SELECT COUNT(*) AS total, SUM(status='published') AS published,
             SUM(status='in_review') AS in_review, SUM(status='draft') AS drafts
      FROM books WHERE author_id = ?`, [authorId]),
    pool.execute(`
      SELECT SUM(total_reads) AS total_reads FROM books WHERE author_id = ?`, [authorId]),
    pool.execute(`
      SELECT COALESCE(SUM(amount), 0) AS total_revenue,
             COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount END), 0) AS month_revenue
      FROM earnings WHERE user_id = ? AND role = 'author'`, [authorId]),
    pool.execute(`
      SELECT id, title, status, total_reads, created_at FROM books 
      WHERE author_id = ? ORDER BY created_at DESC LIMIT 5`, [authorId]),
    pool.execute(`
      SELECT DATE_FORMAT(created_at, '%b') AS month,
             COALESCE(SUM(amount), 0) AS revenue
      FROM earnings WHERE user_id = ? AND role = 'author'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY MIN(created_at) DESC LIMIT 6`, [authorId]),
  ]) as any[]

  const bs = (bookStats as any[])[0] || {}
  const rs = (revenueStats as any[])[0] || {}
  const reads = (readStats as any[])[0]?.total_reads || 0
  const rev = (monthlyRevenue as any[]).reverse()
  const maxRev = Math.max(...rev.map((r: any) => parseFloat(r.revenue) || 0), 1)

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20, background:'#0d0c10', color:'#eeecf8' }}>
      
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.4px' }}>{t('home')}</div>
          <div style={{ fontSize:12, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
            Welcome back, {session.user.name}
          </div>
        </div>
        <Link href="/author/books/new" style={{ padding:'8px 18px', borderRadius:6, background:'#9d7df5', color:'#0d0c10', fontSize:13, fontWeight:700, textDecoration:'none' }}>
          + {t('newBook')}
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:t('books'),   value:bs.total||0,       color:'#9d7df5', sub:`${bs.published||0} published`, icon:'📚' },
          { label:'Total Reads',   value:reads.toLocaleString(), color:'#5ba4f5', sub:`Across all titles`,   icon:'👁' },
          { label:t('revenue'), value:`$${parseFloat(rs.total_revenue||0).toFixed(2)}`, color:'#3dd6a3', sub:`$${parseFloat(rs.month_revenue||0).toFixed(2)} this month`, icon:'💰' },
          { label:t('status'),     value:bs.in_review||0,   color:'#f07060', sub:`Pending approval`,      icon:'⏳' },
        ].map(s => (
          <div key={s.label} style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, padding:'18px 20px', position:'relative' }}>
            <div style={{ position:'absolute', top:16, right:16, fontSize:18, opacity:0.3 }}>{s.icon}</div>
            <div style={{ fontSize:10, color:'#635e80', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace" }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, margin:'6px 0 2px' }}>{s.value}</div>
            <div style={{ fontSize:10, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:14 }}>
        
        {/* Recent Books */}
        <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #272635', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:13, fontWeight:700 }}>Recent Books</div>
            <Link href="/author/books" style={{ fontSize:11, color:'#9d7df5', textDecoration:'none' }}>View all →</Link>
          </div>
          <div style={{ padding:0 }}>
            {(recentBooks as any[]).length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#635e80', fontSize:13 }}>You haven't uploaded any books yet.</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #272635' }}>
                    {['Title', 'Status', 'Reads', 'Created'].map(h => (
                      <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10, color:'#635e80', textTransform:'uppercase', letterSpacing:'1px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recentBooks as any[]).map((book: any) => (
                    <tr key={book.id} style={{ borderBottom:'1px solid #272635' }}>
                      <td style={{ padding:'12px 18px', fontSize:13, fontWeight:600 }}>{book.title}</td>
                      <td style={{ padding:'12px 18px' }}>
                        <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:book.status==='published'?'#3dd6a322':'#f0706022', color:book.status==='published'?'#3dd6a3':'#f07060' }}>{book.status}</span>
                      </td>
                      <td style={{ padding:'12px 18px', fontSize:12 }}>{book.total_reads}</td>
                      <td style={{ padding:'12px 18px', fontSize:11, color:'#635e80' }}>{new Date(book.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, padding:'18px' }}>
           <div style={{ fontSize:13, fontWeight:700, marginBottom:20 }}>Monthly Revenue</div>
           <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120, marginBottom:10 }}>
              {rev.length === 0 ? (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#635e80', fontSize:12 }}>No data yet</div>
              ) : rev.map((r: any, i: number) => {
                const h = Math.max(5, (parseFloat(r.revenue) / maxRev) * 100)
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div title={`$${parseFloat(r.revenue).toFixed(2)}`}
                      style={{ width:'100%', height:`${h}px`, borderRadius:'4px 4px 0 0', background: i === rev.length-1 ? '#9d7df5' : '#272635' }} />
                    <div style={{ fontSize:9, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>{r.month}</div>
                  </div>
                )
              })}
           </div>
           <div style={{ paddingTop:14, borderTop:'1px solid #272635', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:11, color:'#635e80' }}>Total Earnings</div>
              <div style={{ fontSize:15, fontWeight:800, color:'#3dd6a3' }}>${parseFloat(rs.total_revenue||0).toFixed(2)}</div>
           </div>
        </div>

      </div>

    </div>
  )
}
