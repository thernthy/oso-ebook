import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import pool                 from '@/lib/db'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'

export default async function OsoRevenue() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'oso') redirect('/auth/login')

  // Fetch all revenue-related data
  const [
    [platformStats],
    [recentEarnings],
    [payoutSummary],
    [topEarningBooks],
    [monthlyTrend],
  ] = await Promise.all([
    // 1. Overall Platform Stats
    pool.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN role='platform' THEN amount ELSE 0 END), 0) AS total_platform,
        COALESCE(SUM(CASE WHEN role='platform' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END), 0) AS month_platform,
        COUNT(DISTINCT purchase_id) AS total_sales
      FROM earnings
    `),
    // 2. Recent Earnings Ledger
    pool.execute(`
      SELECT e.*, b.title AS book_title, u.name AS recipient_name, u.role AS recipient_role
      FROM earnings e
      JOIN books b ON e.book_id = b.id
      JOIN users u ON e.user_id = u.id
      ORDER BY e.created_at DESC
      LIMIT 15
    `),
    // 3. Payout Status Summary
    pool.execute(`
      SELECT status, COUNT(*) AS count, SUM(amount) AS total_amount
      FROM payouts
      GROUP BY status
    `),
    // 4. Top Earning Books (Platform Cut)
    pool.execute(`
      SELECT b.title, u.name AS author_name, SUM(e.amount) AS total_earned
      FROM earnings e
      JOIN books b ON e.book_id = b.id
      JOIN users u ON b.author_id = u.id
      WHERE e.role = 'platform'
      GROUP BY b.id
      ORDER BY total_earned DESC
      LIMIT 5
    `),
    // 5. Monthly Trend
    pool.execute(`
      SELECT DATE_FORMAT(created_at, '%b') AS month,
             SUM(CASE WHEN role='platform' THEN amount ELSE 0 END) AS platform_rev,
             SUM(CASE WHEN role IN ('author', 'partner') THEN amount ELSE 0 END) AS payouts
      FROM earnings
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY MIN(created_at) DESC
      LIMIT 12
    `),
  ]) as any[]

  const stats = (platformStats as any[])[0] || {}
  const ledger = recentEarnings as any[]
  const payouts = payoutSummary as any[]
  const topBooks = topEarningBooks as any[]
  const trend = (monthlyTrend as any[]).reverse()

  const maxRev = Math.max(...trend.map(t => parseFloat(t.platform_rev) + parseFloat(t.payouts)), 1)

  const roleColor: Record<string, string> = {
    platform: '#e8c547',
    partner: '#3dd6a3',
    author: '#9d7df5'
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:24, background:'#0c0c0e', color:'#f0efe8' }}>
      
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.5px' }}>Financial Ledger</div>
          <div style={{ fontSize:12, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>
            Platform earnings and payout management
          </div>
        </div>
        <Link href="/oso/payouts" style={{ padding:'8px 16px', borderRadius:6, background:'#e8c547', color:'#0c0c0e', fontSize:12, fontWeight:700, textDecoration:'none' }}>
          Process Payouts →
        </Link>
      </div>

      {/* Main Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:'Platform Revenue', value:`$${parseFloat(stats.total_platform).toLocaleString()}`, color:'#e8c547', sub:`$${parseFloat(stats.month_platform).toLocaleString()} this month`, icon:'🏛' },
          { label:'Total Sales',     value:stats.total_sales, color:'#5ba4f5', sub:'Lifetime purchases', icon:'🛒' },
          { label:'Pending Payouts', value:`$${parseFloat(payouts.find(p => p.status==='pending')?.total_amount || 0).toLocaleString()}`, color:'#f07060', sub:`${payouts.find(p => p.status==='pending')?.count || 0} requests`, icon:'⏳' },
          { label:'Paid to Date',    value:`$${parseFloat(payouts.find(p => p.status==='completed')?.total_amount || 0).toLocaleString()}`, color:'#3dd6a3', sub:'Total creator payouts', icon:'✅' },
        ].map(s => (
          <div key={s.label} style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:10, padding:'18px 20px', position:'relative' }}>
            <div style={{ position:'absolute', top:16, right:16, fontSize:18, opacity:0.3 }}>{s.icon}</div>
            <div style={{ fontSize:10, color:'#6b6b78', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace" }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, margin:'6px 0 2px' }}>{s.value}</div>
            <div style={{ fontSize:10, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:20 }}>
        
        {/* Left Column: Top Books + Trend */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
           {/* Top Books */}
           <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:12, overflow:'hidden' }}>
             <div style={{ padding:'14px 18px', borderBottom:'1px solid #2a2a32', fontSize:14, fontWeight:700 }}>Top Revenue Titles</div>
             {topBooks.map((b, i) => (
               <div key={i} style={{ padding:'12px 18px', borderBottom: i < topBooks.length -1 ? '1px solid #2a2a32' : 'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                 <div>
                   <div style={{ fontSize:13, fontWeight:600 }}>{b.title}</div>
                   <div style={{ fontSize:11, color:'#6b6b78' }}>{b.author_name}</div>
                 </div>
                 <div style={{ fontSize:13, fontWeight:700, color:'#e8c547' }}>${parseFloat(b.total_earned).toLocaleString()}</div>
               </div>
             ))}
           </div>

           {/* Trend Chart */}
           <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:12, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:20 }}>Revenue Trend</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120, paddingBottom:20 }}>
                {trend.map((t, i) => {
                  const h1 = (parseFloat(t.platform_rev) / maxRev) * 100
                  const h2 = (parseFloat(t.payouts) / maxRev) * 100
                  return (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                        <div title={`Platform: $${parseFloat(t.platform_rev).toFixed(0)}`} style={{ width:'100%', height:Math.max(2, h1), background:'#e8c547', borderRadius:'2px 2px 0 0' }} />
                        <div title={`Payouts: $${parseFloat(t.payouts).toFixed(0)}`} style={{ width:'100%', height:Math.max(2, h2), background:'#2a2a32', borderRadius:'0 0 2px 2px' }} />
                      </div>
                      <div style={{ fontSize:9, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>{t.month}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display:'flex', gap:12, marginTop:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#6b6b78' }}><div style={{ width:8, height:8, background:'#e8c547', borderRadius:2 }} /> Platform Rev</div>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#6b6b78' }}><div style={{ width:8, height:8, background:'#2a2a32', borderRadius:2 }} /> Creator Share</div>
              </div>
           </div>
        </div>

        {/* Right Column: Earnings Ledger */}
        <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #2a2a32', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
             <div style={{ fontSize:14, fontWeight:700 }}>Recent Earnings Ledger</div>
             <div style={{ fontSize:10, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>Real-time updates</div>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#1a1a1f' }}>
                {['Date', 'Book', 'Recipient', 'Role', 'Amount'].map(h => (
                  <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10, color:'#6b6b78', textTransform:'uppercase', letterSpacing:'1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledger.map(e => (
                <tr key={e.id} style={{ borderBottom:'1px solid #2a2a32' }}>
                  <td style={{ padding:'12px 18px', fontSize:11, color:'#6b6b78' }}>{new Date(e.created_at).toLocaleDateString()}</td>
                  <td style={{ padding:'12px 18px', fontSize:12, fontWeight:600 }}>{e.book_title}</td>
                  <td style={{ padding:'12px 18px', fontSize:12 }}>{e.recipient_name}</td>
                  <td style={{ padding:'12px 18px' }}>
                    <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:`${roleColor[e.role]}22`, color:roleColor[e.role], textTransform:'uppercase', fontWeight:700, letterSpacing:'0.5px' }}>{e.role}</span>
                  </td>
                  <td style={{ padding:'12px 18px', fontSize:13, fontWeight:700, color: e.role === 'platform' ? '#e8c547' : '#eeecf8' }}>
                    ${parseFloat(e.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  )
}
