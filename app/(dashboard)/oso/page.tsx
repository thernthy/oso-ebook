import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import pool                 from '@/lib/db'
import Link                 from 'next/link'
import UserStatusAction     from '@/components/oso/UserStatusAction'
import PartnerApproval      from '@/components/oso/PartnerApproval'
import { getTranslations }  from '@/lib/i18n/server'

export default async function OsoDashboard() {
  const t = getTranslations()
  const session = await getServerSession(authOptions)

  // All queries in parallel
  const [
    [userStats],
    [bookStats],
    [revenueStats],
    [pendingStats],
    [monthlyRevenue],
    [recentUsers],
    [pendingApplications],
    [topBooks],
  ] = await Promise.all([
    pool.execute(`
      SELECT COUNT(*) AS total, SUM(role='partner') AS partners,
             SUM(role='author') AS authors, SUM(role='reader') AS readers,
             SUM(status='suspended') AS suspended,
             SUM(created_at >= DATE_SUB(NOW(),INTERVAL 30 DAY)) AS new_month
      FROM users`),
    pool.execute(`
      SELECT COUNT(*) AS total, SUM(status='published') AS published,
             SUM(status='in_review') AS in_review, SUM(status='draft') AS drafts
      FROM books`),
    pool.execute(`
      SELECT COALESCE(SUM(CASE WHEN role='platform' THEN amount END),0) AS platform_revenue,
             COALESCE(SUM(CASE WHEN created_at>=DATE_SUB(NOW(),INTERVAL 30 DAY) AND role='platform' THEN amount END),0) AS month_revenue,
             COUNT(DISTINCT purchase_id) AS purchases
      FROM earnings`),
    pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM partner_applications WHERE status='pending') AS pending_partners,
        (SELECT COUNT(*) FROM books WHERE status='in_review')              AS books_review,
        (SELECT COUNT(*) FROM users WHERE status='pending')                AS pending_users`),
    pool.execute(`
      SELECT DATE_FORMAT(created_at,'%b') AS month,
             COALESCE(SUM(CASE WHEN role='platform' THEN amount END),0) AS revenue
      FROM earnings GROUP BY DATE_FORMAT(created_at,'%Y-%m')
      ORDER BY MIN(created_at) DESC LIMIT 6`),
    pool.execute(`
      SELECT id, name, email, role, status, created_at FROM users
      ORDER BY created_at DESC LIMIT 6`),
    pool.execute(`
      SELECT id, name, email, company, message, created_at FROM partner_applications
      WHERE status='pending' ORDER BY created_at ASC LIMIT 4`),
    pool.execute(`
      SELECT b.id, b.title, b.total_reads, b.status,
             u.name AS author_name,
             COALESCE(SUM(e.amount),0) AS revenue
      FROM books b JOIN users u ON b.author_id=u.id
      LEFT JOIN earnings e ON e.book_id=b.id AND e.role='platform'
      WHERE b.status='published'
      GROUP BY b.id ORDER BY b.total_reads DESC LIMIT 4`),
  ]) as any[]

  const us  = (userStats as any[])[0]    || {}
  const bs  = (bookStats as any[])[0]    || {}
  const rs  = (revenueStats as any[])[0] || {}
  const ps  = (pendingStats as any[])[0] || {}
  const rev = (monthlyRevenue as any[]).reverse()

  const maxRev = Math.max(...rev.map((r: any) => parseFloat(r.revenue) || 0), 1)

  const roleColor: Record<string, string> = {
    oso:'#e8c547', partner:'#3dd6a3', author:'#9d7df5', reader:'#5ba4f5'
  }
  const statusColor: Record<string, { bg:string; color:string }> = {
    active:    { bg:'rgba(61,214,163,0.12)',  color:'#3dd6a3' },
    suspended: { bg:'rgba(240,112,96,0.12)',  color:'#f07060' },
    pending:   { bg:'rgba(232,197,71,0.12)',  color:'#e8c547' },
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>

      {/* Topbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:'#f0efe8', letterSpacing:'-0.4px' }}>{t('commandCenter')}</div>
          <div style={{ fontSize:12, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {Number(ps.pending_partners) > 0 && (
            <Link href="/oso/partners" style={{ padding:'7px 14px', borderRadius:6, background:'rgba(240,112,96,0.12)', border:'1px solid rgba(240,112,96,0.3)', color:'#f07060', fontSize:12, fontWeight:600, textDecoration:'none', fontFamily:"'JetBrains Mono',monospace" }}>
              ⚠ {ps.pending_partners} partner{Number(ps.pending_partners)>1?'s':''} pending
            </Link>
          )}
          <Link href="/oso/users/new" style={{ padding:'7px 16px', borderRadius:6, background:'#e8c547', color:'#0c0c0e', fontSize:12, fontWeight:700, textDecoration:'none', fontFamily:"'Syne',system-ui,sans-serif" }}>
            + Invite Partner
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:t('totalUsers'),    value:us.total,            color:'#e8c547', sub:`+${us.new_month} this month`,  icon:'👥' },
          { label:t('booksPublished'),value:bs.published,        color:'#3dd6a3', sub:`${bs.in_review} in review`,    icon:'📚' },
          { label:t('platformRevenue'),value:`$${parseFloat(rs.platform_revenue||0).toLocaleString()}`, color:'#9d7df5', sub:`$${parseFloat(rs.month_revenue||0).toFixed(0)} this month`, icon:'💰' },
          { label:t('actionNeeded'),  value:Number(ps.pending_partners)+Number(ps.books_review)+Number(ps.pending_users), color:'#f07060', sub:`${ps.books_review} books · ${ps.pending_partners} partners`, icon:'⏳' },
        ].map(s => (
          <div key={s.label} style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:16, right:16, fontSize:18, opacity:0.4 }}>{s.icon}</div>
            <div style={{ fontSize:11, color:'#6b6b78', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace" }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, letterSpacing:'-1px', margin:'6px 0 4px' }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Users + Revenue chart */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:14 }}>

        {/* Recent Users */}
        <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #2a2a32', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#f0efe8' }}>Recent Users</div>
            <Link href="/oso/users" style={{ fontSize:11, color:'#e8c547', fontFamily:"'JetBrains Mono',monospace", textDecoration:'none' }}>View all →</Link>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['User','Role','Status','Joined',''].map(h => (
                  <th key={h} style={{ padding:'9px 18px', textAlign:'left', fontSize:10, fontWeight:600, color:'#6b6b78', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", borderBottom:'1px solid #2a2a32' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentUsers as any[]).map((u: any) => {
                const sc = statusColor[u.status] || statusColor.pending
                return (
                  <tr key={u.id} style={{ borderBottom:'1px solid #2a2a32' }}>
                    <td style={{ padding:'10px 18px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:`${roleColor[u.role]}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:roleColor[u.role], flexShrink:0 }}>
                          {u.name?.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#f0efe8' }}>{u.name}</div>
                          <div style={{ fontSize:10, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'10px 18px' }}>
                      <span style={{ fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:roleColor[u.role] }}>{u.role}</span>
                    </td>
                    <td style={{ padding:'10px 18px' }}>
                      <span style={{ padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", background:sc.bg, color:sc.color }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding:'10px 18px', fontSize:11, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", whiteSpace:'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                    </td>
                    <td style={{ padding:'10px 18px' }}>
                      <UserStatusAction userId={u.id} currentStatus={u.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Revenue chart */}
        <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #2a2a32', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#f0efe8' }}>Platform Revenue</div>
            <Link href="/oso/revenue" style={{ fontSize:11, color:'#e8c547', fontFamily:"'JetBrains Mono',monospace", textDecoration:'none' }}>Full report →</Link>
          </div>
          <div style={{ padding:18 }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:100, marginBottom:8 }}>
              {rev.map((r: any, i: number) => {
                const h = Math.max(4, (parseFloat(r.revenue) / maxRev) * 90)
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div title={`$${parseFloat(r.revenue).toFixed(0)}`}
                      style={{ width:'100%', height:`${h}px`, borderRadius:'3px 3px 0 0', background: i === rev.length-1 ? 'linear-gradient(to top,#e8c547,rgba(232,197,71,0.35))' : '#222228', cursor:'pointer', transition:'opacity .2s' }} />
                    <div style={{ fontSize:9, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>{r.month}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ paddingTop:12, borderTop:'1px solid #2a2a32', display:'flex', justifyContent:'space-between' }}>
              <div style={{ fontSize:11, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>Total (platform cut)</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#e8c547', fontFamily:"'JetBrains Mono',monospace" }}>
                ${parseFloat(rs.platform_revenue||0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Top Books mini */}
          <div style={{ borderTop:'1px solid #2a2a32' }}>
            <div style={{ padding:'12px 18px 8px', fontSize:11, fontWeight:600, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1px', textTransform:'uppercase' }}>Top Books</div>
            {(topBooks as any[]).map((b: any, i: number) => (
              <div key={b.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 18px', borderBottom: i < (topBooks as any[]).length-1 ? '1px solid #2a2a32' : 'none' }}>
                <div style={{ fontSize:11, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", width:14 }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#f0efe8' }}>{b.title}</div>
                  <div style={{ fontSize:10, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>{b.author_name}</div>
                </div>
                <div style={{ fontSize:11, color:'#3dd6a3', fontFamily:"'JetBrains Mono',monospace" }}>{b.total_reads?.toLocaleString()} reads</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Pending partner applications */}
      {(pendingApplications as any[]).length > 0 && (
        <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #2a2a32', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#f0efe8' }}>Partner Applications</div>
            <span style={{ background:'#f07060', color:'#fff', fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", padding:'2px 7px', borderRadius:10 }}>
              {(pendingApplications as any[]).length} pending
            </span>
          </div>
          {(pendingApplications as any[]).map((app: any) => (
            <div key={app.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderBottom:'1px solid #2a2a32' }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'rgba(61,214,163,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#3dd6a3', flexShrink:0 }}>
                {app.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#f0efe8' }}>{app.name}</div>
                <div style={{ fontSize:11, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace', marginTop:2" }}>
                  {app.email}{app.company ? ` · ${app.company}` : ''}
                </div>
                {app.message && (
                  <div style={{ fontSize:11, color:'#6b6b78', marginTop:4, maxWidth:400 }}>
                    "{app.message.slice(0,100)}{app.message.length>100?'…':''}"
                  </div>
                )}
              </div>
              <div style={{ fontSize:11, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", marginRight:12, whiteSpace:'nowrap' }}>
                {new Date(app.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
              </div>
              <PartnerApproval applicationId={app.id} applicantName={app.name} applicantEmail={app.email} />
            </div>
          ))}
        </div>
      )}

      {/* Role breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { role:'Partners', count:us.partners, color:'#3dd6a3', href:'/oso/partners' },
          { role:'Authors',  count:us.authors,  color:'#9d7df5', href:'/oso/users?role=author' },
          { role:'Readers',  count:us.readers,  color:'#5ba4f5', href:'/oso/users?role=reader' },
          { role:'Suspended',count:us.suspended,color:'#f07060', href:'/oso/users?status=suspended' },
        ].map(r => (
          <Link key={r.role} href={r.href} style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:10, padding:'16px 20px', textDecoration:'none', display:'block' }}>
            <div style={{ fontSize:11, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1px', textTransform:'uppercase' }}>{r.role}</div>
            <div style={{ fontSize:26, fontWeight:800, color:r.color, marginTop:6 }}>{r.count ?? 0}</div>
          </Link>
        ))}
      </div>

    </div>
  )
}
