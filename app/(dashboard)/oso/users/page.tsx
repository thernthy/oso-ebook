import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import pool                 from '@/lib/db'
import UserStatusAction     from '@/components/oso/UserStatusAction'
import Link                 from 'next/link'

type SearchParams = { role?: string; status?: string; search?: string; page?: string }

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const role   = searchParams.role   || ''
  const status = searchParams.status || ''
  const search = searchParams.search || ''
  const page   = Math.max(1, parseInt(searchParams.page || '1'))
  const limit  = 20
  const offset = (page - 1) * limit

  const conditions: string[] = []
  const params: unknown[]    = []

  if (role)   { conditions.push('u.role = ?');   params.push(role) }
  if (status) { conditions.push('u.status = ?'); params.push(status) }
  if (search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const [users] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.created_at,
            COUNT(DISTINCT b.id) AS book_count
     FROM users u
     LEFT JOIN books b ON b.author_id = u.id
     ${where}
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  ) as any[]

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) as total FROM users u ${where}`, params
  ) as any[]

  const totalPages = Math.ceil(Number(total) / limit)

  const roleColor: Record<string, string> = {
    oso:'#e8c547', partner:'#3dd6a3', author:'#9d7df5', reader:'#5ba4f5'
  }
  const statusStyle: Record<string, { bg:string; color:string }> = {
    active:    { bg:'rgba(61,214,163,0.12)',  color:'#3dd6a3' },
    suspended: { bg:'rgba(240,112,96,0.12)',  color:'#f07060' },
    pending:   { bg:'rgba(232,197,71,0.12)',  color:'#e8c547' },
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:'#f0efe8', letterSpacing:'-0.4px' }}>All Users</div>
          <div style={{ fontSize:12, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>{total} total</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[
          { label:'All',       href:'?' },
          { label:'Partners',  href:'?role=partner' },
          { label:'Authors',   href:'?role=author' },
          { label:'Readers',   href:'?role=reader' },
          { label:'Suspended', href:'?status=suspended' },
          { label:'Pending',   href:'?status=pending' },
        ].map(f => (
          <Link key={f.href} href={f.href}
            style={{ padding:'5px 12px', borderRadius:5, fontSize:11, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", textDecoration:'none', background:'#1a1a1f', border:'1px solid #2a2a32', color:'#6b6b78' }}>
            {f.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['User','Role','Status','Books','Joined','Actions'].map(h => (
                <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10, fontWeight:600, color:'#6b6b78', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", borderBottom:'1px solid #2a2a32' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(users as any[]).map((u: any) => {
              const rc = roleColor[u.role]   || '#6b6b78'
              const sc = statusStyle[u.status] || statusStyle.pending
              return (
                <tr key={u.id} style={{ borderBottom:'1px solid #2a2a32' }}>
                  <td style={{ padding:'11px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:`${rc}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:rc, flexShrink:0 }}>
                        {u.name?.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:'#f0efe8' }}>{u.name}</div>
                        <div style={{ fontSize:10, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'11px 18px' }}>
                    <span style={{ fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:rc, textTransform:'uppercase' }}>{u.role}</span>
                  </td>
                  <td style={{ padding:'11px 18px' }}>
                    <span style={{ padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", background:sc.bg, color:sc.color }}>{u.status}</span>
                  </td>
                  <td style={{ padding:'11px 18px', fontSize:12, color:'#f0efe8', fontFamily:"'JetBrains Mono',monospace" }}>
                    {u.book_count > 0 ? u.book_count : '—'}
                  </td>
                  <td style={{ padding:'11px 18px', fontSize:11, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", whiteSpace:'nowrap' }}>
                    {new Date(u.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </td>
                  <td style={{ padding:'11px 18px' }}>
                    <UserStatusAction userId={u.id} currentStatus={u.status} />
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
              <Link key={p} href={`?page=${p}${role?`&role=${role}`:''}${status?`&status=${status}`:''}`}
                style={{ width:28, height:28, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontFamily:"'JetBrains Mono',monospace", textDecoration:'none', background: p===page ? '#e8c547' : '#1a1a1f', color: p===page ? '#0c0c0e' : '#6b6b78', border:'1px solid #2a2a32', fontWeight:p===page?700:400 }}>
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
