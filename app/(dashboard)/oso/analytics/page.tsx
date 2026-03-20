import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import pool                 from '@/lib/db'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'

export default async function OsoAnalytics() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'oso') redirect('/auth/login')

  // Fetch all analytics data
  const [
    [userGrowth],
    [revenueSplit],
    [bookPerformance],
    [categoryStats],
    [partnerPerformance],
  ] = await Promise.all([
    // User growth (last 6 months)
    pool.execute(`
      SELECT DATE_FORMAT(created_at, '%b') AS month,
             COUNT(*) AS total,
             SUM(role='reader') AS readers,
             SUM(role='author') AS authors
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY MIN(created_at) ASC
    `),
    // Revenue split summary
    pool.execute(`
      SELECT role, SUM(amount) AS total
      FROM earnings
      GROUP BY role
    `),
    // Book performance metrics
    pool.execute(`
      SELECT status, COUNT(*) AS count, SUM(total_reads) AS total_reads
      FROM books
      GROUP BY status
    `),
    // Category distribution
    pool.execute(`
      SELECT category, COUNT(*) AS count, SUM(total_reads) AS reads
      FROM books
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY reads DESC
      LIMIT 5
    `),
    // Partner performance (top 5 by author count)
    pool.execute(`
      SELECT u.name, COUNT(a.id) AS author_count
      FROM users u
      LEFT JOIN users a ON a.partner_id = u.id AND a.role = 'author'
      WHERE u.role = 'partner'
      GROUP BY u.id
      ORDER BY author_count DESC
      LIMIT 5
    `),
  ]) as any[]

  const ug = userGrowth as any[]
  const rs = revenueSplit as any[]
  const bp = bookPerformance as any[]
  const cs = categoryStats as any[]
  const pp = partnerPerformance as any[]

  const maxUserGrowth = Math.max(...ug.map(u => u.total), 1)
  const totalRev = rs.reduce((acc, r) => acc + parseFloat(r.total), 0)

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:24, background:'#0c0c0e', color:'#f0efe8' }}>
      
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.5px' }}>Platform Analytics</div>
          <div style={{ fontSize:12, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>
            Comprehensive performance metrics for OSO Ebook
          </div>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button style={{ padding:'8px 16px', borderRadius:6, background:'#131316', border:'1px solid #2a2a32', color:'#6b6b78', fontSize:12, fontWeight:600, cursor:'pointer' }}>Export PDF</button>
          <button style={{ padding:'8px 16px', borderRadius:6, background:'#e8c547', color:'#0c0c0e', fontSize:12, fontWeight:700, border:'none', cursor:'pointer' }}>Refresh Data</button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
        
        {/* User Acquisition Trend */}
        <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:12, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>User Acquisition Growth</div>
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#6b6b78' }}>
                <div style={{ width:8, height:8, borderRadius:2, background:'#5ba4f5' }} /> Readers
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#6b6b78' }}>
                <div style={{ width:8, height:8, borderRadius:2, background:'#9d7df5' }} /> Authors
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:180, paddingBottom:20 }}>
            {ug.map((m, i) => {
              const h = (m.total / maxUserGrowth) * 160
              const rh = (m.readers / m.total) * h
              const ah = (m.authors / m.total) * h
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                  <div style={{ width:'100%', position:'relative', height:h }}>
                    <div style={{ position:'absolute', bottom:0, width:'100%', height:rh, background:'#5ba4f5', borderRadius:'2px 2px 0 0' }} />
                    <div style={{ position:'absolute', bottom:rh, width:'100%', height:ah, background:'#9d7df5', borderRadius:'2px 2px 0 0' }} />
                  </div>
                  <div style={{ fontSize:10, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>{m.month}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Revenue Distribution */}
        <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:20 }}>Revenue Distribution</div>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {rs.map(r => {
              const pct = (parseFloat(r.total) / totalRev) * 100
              const color = r.role === 'platform' ? '#e8c547' : r.role === 'author' ? '#9d7df5' : '#3dd6a3'
              return (
                <div key={r.role}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ fontSize:11, color:'#6b6b78', textTransform:'uppercase', letterSpacing:'1px' }}>{r.role}</div>
                    <div style={{ fontSize:11, fontWeight:700 }}>{pct.toFixed(1)}%</div>
                  </div>
                  <div style={{ height:6, background:'#222228', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:color }} />
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, marginTop:4 }}>${parseFloat(r.total).toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20 }}>
        
        {/* Book Health */}
        <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Library Health</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {bp.map(b => (
              <div key={b.status} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background: b.status === 'published' ? '#3dd6a3' : b.status === 'in_review' ? '#f07060' : '#6b6b78' }} />
                <div style={{ flex:1, fontSize:12, color:'#6b6b78' }}>{b.status.replace('_', ' ')}</div>
                <div style={{ fontSize:13, fontWeight:700 }}>{b.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Top Categories</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {cs.map(c => (
              <div key={c.category} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:12, color:'#6b6b78' }}>{c.category}</div>
                <div style={{ fontSize:11, color:'#5ba4f5', fontFamily:"'JetBrains Mono',monospace" }}>{c.reads.toLocaleString()} reads</div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Engagement */}
        <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Partner Engagement</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {pp.map(p => (
              <div key={p.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:12, color:'#6b6b78' }}>{p.name}</div>
                <div style={{ fontSize:11, fontWeight:700, color:'#3dd6a3' }}>{p.author_count} authors</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
