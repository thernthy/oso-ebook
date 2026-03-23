import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import pool                 from '@/lib/db'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'

interface Props {
  searchParams: {
    status?: string
    search?: string
    page?:   string
  }
}

export default async function OsoBooksCatalog({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'oso') redirect('/auth/login')

  const { status = '', search = '', page = '1' } = searchParams
  const limit  = 20
  const offset = (parseInt(page) - 1) * limit

  const conditions: string[] = []
  const params:     any[]    = []

  if (status) {
    conditions.push('b.status = ?')
    params.push(status)
  }
  if (search) {
    conditions.push('(b.title LIKE ? OR u.name LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  // Fetch books with author and partner info
  const [
    [books],
    [[{ total }]],
  ] = await Promise.all([
    pool.execute(`
      SELECT b.*, u.name AS author_name, p.name AS partner_name
      FROM books b
      JOIN users u ON b.author_id = u.id
      LEFT JOIN users p ON b.partner_id = p.id
      ${where}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?`, [...params, limit, offset]),
    pool.execute(`SELECT COUNT(*) as total FROM books b JOIN users u ON b.author_id = u.id ${where}`, params),
  ]) as any[]

  const statusColors: Record<string, { bg:string, color:string }> = {
    published: { bg:'rgba(61,214,163,0.12)', color:'#3dd6a3' },
    in_review: { bg:'rgba(157,125,245,0.12)', color:'#9d7df5' },
    draft:     { bg:'rgba(107,107,120,0.12)', color:'#6b6b78' },
    rejected:  { bg:'rgba(240,112,96,0.12)',  color:'#f07060' },
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20, background:'#0c0c0e', color:'#f0efe8' }}>
      
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.4px' }}>Platform Catalog</div>
          <div style={{ fontSize:12, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
            Managing {total} total titles
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, alignItems:'center', background:'#131316', padding:'12px 16px', borderRadius:10, border:'1px solid #2a2a32' }}>
        <form style={{ display:'flex', gap:10, flex:1 }}>
          <input 
            name="search"
            defaultValue={search}
            placeholder="Search title or author..."
            style={{ flex:1, background:'#1a1a20', border:'1px solid #2a2a32', borderRadius:6, padding:'7px 12px', fontSize:13, color:'#f0efe8', outline:'none' }}
          />
          <select 
            name="status"
            defaultValue={status}
            style={{ background:'#1a1a20', border:'1px solid #2a2a32', borderRadius:6, padding:'7px 12px', fontSize:13, color:'#f0efe8', outline:'none' }}
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="in_review">In Review</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="submit" style={{ padding:'7px 16px', borderRadius:6, background:'#e8c547', color:'#0c0c0e', fontSize:12, fontWeight:700, border:'none', cursor:'pointer' }}>
            Filter
          </button>
          { (status || search) && (
            <Link href="/oso/books" style={{ padding:'7px 12px', color:'#6b6b78', fontSize:12, textDecoration:'none', alignSelf:'center' }}>Clear</Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div style={{ background:'#131316', border:'1px solid #2a2a32', borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #2a2a32', background:'rgba(255,255,255,0.02)' }}>
              {['Book Details', 'Owner/Partner', 'Status', 'Stats', 'Price', ''].map(h => (
                <th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:10, color:'#6b6b78', textTransform:'uppercase', letterSpacing:'1px', fontFamily:"'JetBrains Mono',monospace" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(books as any[]).map((book: any) => {
              const sc = statusColors[book.status] || statusColors.draft
              return (
                <tr key={book.id} style={{ borderBottom:'1px solid #2a2a32' }}>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <div style={{ width:36, height:52, background:'#1a1a20', borderRadius:4, overflow:'hidden', flexShrink:0, border:'1px solid #2a2a32' }}>
                        {book.cover_url && <img src={book.cover_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#f0efe8' }}>{book.title}</div>
                        <div style={{ fontSize:10, color:'#6b6b78', marginTop:2 }}>ID: {book.id.slice(0,8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>{book.author_name}</div>
                    <div style={{ fontSize:10, color:'#3dd6a3', marginTop:2 }}>{book.partner_name || 'Direct'}</div>
                  </td>
                  <td style={{ padding:'14px 18px' }}>
                    <span style={{ padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700, textTransform:'uppercase', background:sc.bg, color:sc.color, fontFamily:"'JetBrains Mono',monospace" }}>
                      {book.status}
                    </span>
                  </td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#5ba4f5' }}>{book.total_reads.toLocaleString()} <span style={{ fontSize:10, color:'#6b6b78', fontWeight:400 }}>reads</span></div>
                  </td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontSize:12, fontWeight:700 }}>{book.is_free ? 'Free' : `$${parseFloat(book.price).toFixed(2)}`}</div>
                  </td>
                  <td style={{ padding:'14px 18px', textAlign:'right' }}>
                    <Link href={`/oso/books/${book.id}`} style={{ padding:'5px 12px', borderRadius:4, border:'1px solid #2a2a32', color:'#6b6b78', fontSize:11, textDecoration:'none', transition:'all .2s' }}>
                      Details
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {total > limit && (
          <div style={{ padding:'14px 18px', display:'flex', justifyContent:'center', gap:10, borderTop:'1px solid #2a2a32' }}>
             {Array.from({ length: Math.ceil(total/limit) }).map((_, i) => (
               <Link key={i} href={`/oso/books?page=${i+1}&status=${status}&search=${search}`} 
                 style={{ padding:'4px 10px', borderRadius:4, background: parseInt(page) === (i+1) ? '#e8c547' : '#1a1a20', color: parseInt(page) === (i+1) ? '#0c0c0e' : '#6b6b78', fontSize:12, textDecoration:'none', fontWeight:700 }}>
                 {i+1}
               </Link>
             ))}
          </div>
        )}
      </div>

    </div>
  )
}
