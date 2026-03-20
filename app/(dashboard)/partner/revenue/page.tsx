import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import pool                 from '@/lib/db'

export default async function PartnerRevenuePage() {
  const session   = await getServerSession(authOptions)
  const partnerId = session!.user.id

  const [
    [summary],
    [monthlyRevenue],
    [earningsByAuthor],
    [recentTransactions],
    [pendingPayouts],
  ] = await Promise.all([
    pool.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN role = 'partner' THEN amount ELSE 0 END), 0) AS total_earnings,
        COALESCE(SUM(CASE WHEN role = 'partner' AND status = 'pending' THEN amount ELSE 0 END), 0) AS pending_amount,
        COALESCE(SUM(CASE WHEN role = 'partner' AND status = 'paid' THEN amount ELSE 0 END), 0) AS paid_amount,
        COALESCE(SUM(CASE WHEN role = 'partner' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END), 0) AS this_month
      FROM earnings WHERE user_id = ?`, [partnerId]),
    pool.execute(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
             DATE_FORMAT(created_at, '%b %Y') AS month_label,
             COALESCE(SUM(amount), 0) AS revenue
      FROM earnings WHERE user_id = ? AND role = 'partner'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY MIN(created_at) DESC LIMIT 12`, [partnerId]),
    pool.execute(`
      SELECT 
        u.id AS author_id, u.name AS author_name,
        COUNT(DISTINCT e.book_id) AS book_count,
        COALESCE(SUM(e.amount), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN e.status = 'pending' THEN e.amount ELSE 0 END), 0) AS pending_revenue,
        COALESCE(SUM(CASE WHEN e.status = 'paid' THEN e.amount ELSE 0 END), 0) AS paid_revenue
      FROM earnings e
      JOIN books b ON e.book_id = b.id
      JOIN users u ON b.author_id = u.id
      WHERE e.user_id = ? AND e.role = 'partner'
      GROUP BY u.id, u.name
      ORDER BY total_revenue DESC`, [partnerId]),
    pool.execute(`
      SELECT e.*, b.title AS book_title, u.name AS author_name
      FROM earnings e
      JOIN books b ON e.book_id = b.id
      JOIN users u ON b.author_id = u.id
      WHERE e.user_id = ? AND e.role = 'partner'
      ORDER BY e.created_at DESC LIMIT 10`, [partnerId]),
    pool.execute(`
      SELECT id, amount, status, created_at
      FROM payouts
      WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 5`, [partnerId]),
  ]) as any[]

  const s = (summary as any[])[0] || {}
  const rev = (monthlyRevenue as any[]).reverse()
  const maxRev = Math.max(...rev.map((r: any) => parseFloat(r.revenue) || 0), 1)

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20, background:'#0c0e0f', color:'#edf0f0' }}>

      <div>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.4px' }}>Revenue Overview</div>
        <div style={{ fontSize:12, color:'#5e6b70', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
          Track your earnings from the author network
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:'Total Earnings', value:`$${parseFloat(s.total_earnings||0).toFixed(2)}`, color:'#3dd6a3', icon:'💰' },
          { label:'This Month', value:`$${parseFloat(s.this_month||0).toFixed(2)}`, color:'#9d7df5', icon:'📅' },
          { label:'Pending Payout', value:`$${parseFloat(s.pending_amount||0).toFixed(2)}`, color:'#e8c547', icon:'⏳' },
          { label:'Paid Out', value:`$${parseFloat(s.paid_amount||0).toFixed(2)}`, color:'#5ba4f5', icon:'✓' },
        ].map(stat => (
          <div key={stat.label} style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, padding:'18px 20px', position:'relative' }}>
            <div style={{ position:'absolute', top:16, right:16, fontSize:18, opacity:0.3 }}>{stat.icon}</div>
            <div style={{ fontSize:10, color:'#5e6b70', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace" }}>{stat.label}</div>
            <div style={{ fontSize:24, fontWeight:800, color:stat.color, margin:'6px 0 2px' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

        <div style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, padding:'20px' }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Monthly Revenue</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:140, marginBottom:12 }}>
            {rev.length === 0 ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#5e6b70', fontSize:12, height:'100%' }}>No revenue data yet</div>
            ) : rev.map((r: any, i: number) => {
              const h = Math.max(5, (parseFloat(r.revenue) / maxRev) * 100)
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div title={`$${parseFloat(r.revenue).toFixed(2)}`}
                    style={{ width:'100%', height:`${h}px`, borderRadius:'4px 4px 0 0', background: i === rev.length-1 ? '#3dd6a3' : '#252c30' }} />
                  <div style={{ fontSize:8, color:'#5e6b70', fontFamily:"'JetBrains Mono',monospace" }}>{r.month_label?.split(' ')[0]}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #252c30', fontSize:14, fontWeight:700 }}>Earnings by Author</div>
          {(earningsByAuthor as any[]).length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'#5e6b70', fontSize:12 }}>No author earnings yet</div>
          ) : (
            <div style={{ padding:0 }}>
              {(earningsByAuthor as any[]).map((row: any, i: number) => (
                <div key={i} style={{ padding:'12px 18px', borderBottom:i < (earningsByAuthor as any[]).length - 1 ? '1px solid #252c30' : 'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{row.author_name}</div>
                    <div style={{ fontSize:11, color:'#5e6b70' }}>{row.book_count} books</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#3dd6a3' }}>${parseFloat(row.total_revenue).toFixed(2)}</div>
                    <div style={{ fontSize:10, color:'#e8c547' }}>${parseFloat(row.pending_revenue).toFixed(2)} pending</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:14 }}>

        <div style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #252c30', fontSize:14, fontWeight:700 }}>Recent Transactions</div>
          {(recentTransactions as any[]).length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'#5e6b70', fontSize:12 }}>No transactions yet</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Book','Author','Amount','Status','Date'].map(h => (
                    <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10, color:'#5e6b70', textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'JetBrains Mono',monospace", borderBottom:'1px solid #252c30' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentTransactions as any[]).map((tx: any, i: number) => {
                  const statusColors: Record<string, { bg:string; color:string }> = {
                    pending: { bg:'rgba(232,197,71,0.12)', color:'#e8c547' },
                    paid:    { bg:'rgba(61,214,163,0.12)', color:'#3dd6a3' },
                  }
                  const sc = statusColors[tx.status] || statusColors.pending
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid #252c30' }}>
                      <td style={{ padding:'12px 18px', fontSize:12, fontWeight:600, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.book_title}</td>
                      <td style={{ padding:'12px 18px', fontSize:12, color:'#5e6b70' }}>{tx.author_name}</td>
                      <td style={{ padding:'12px 18px', fontSize:12, fontWeight:700, color:'#3dd6a3' }}>${parseFloat(tx.amount).toFixed(2)}</td>
                      <td style={{ padding:'12px 18px' }}>
                        <span style={{ padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700, background:sc.bg, color:sc.color }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding:'12px 18px', fontSize:11, color:'#5e6b70' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background:'#131618', border:'1px solid #252c30', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #252c30', fontSize:14, fontWeight:700 }}>Payout History</div>
          {(pendingPayouts as any[]).length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'#5e6b70', fontSize:12 }}>No payouts yet</div>
          ) : (
            <div style={{ padding:0 }}>
              {(pendingPayouts as any[]).map((p: any, i: number) => {
                const pStatusColors: Record<string, { bg:string; color:string }> = {
                  pending:    { bg:'rgba(232,197,71,0.12)', color:'#e8c547' },
                  processing: { bg:'rgba(91,164,245,0.12)', color:'#5ba4f5' },
                  completed:  { bg:'rgba(61,214,163,0.12)', color:'#3dd6a3' },
                  failed:     { bg:'rgba(240,112,96,0.12)', color:'#f07060' },
                }
                const pc = pStatusColors[p.status] || pStatusColors.pending
                return (
                  <div key={i} style={{ padding:'14px 18px', borderBottom:i < (pendingPayouts as any[]).length - 1 ? '1px solid #252c30' : 'none' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:'#3dd6a3' }}>${parseFloat(p.amount).toFixed(2)}</span>
                      <span style={{ padding:'2px 6px', borderRadius:4, fontSize:9, fontWeight:700, background:pc.bg, color:pc.color }}>{p.status}</span>
                    </div>
                    <div style={{ fontSize:11, color:'#5e6b70' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
