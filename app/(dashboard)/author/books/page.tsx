import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool            from '@/lib/db'
import Link            from 'next/link'

const statusStyle: Record<string, { bg: string; color: string }> = {
  published: { bg:'rgba(61,214,163,0.12)',  color:'#3dd6a3' },
  in_review: { bg:'rgba(157,125,245,0.12)', color:'#9d7df5' },
  draft:     { bg:'rgba(99,94,128,0.2)',    color:'#6b6b78'  },
  rejected:  { bg:'rgba(240,112,96,0.12)',  color:'#f07060'  },
}

export default async function AuthorBooksPage() {
  const session = await getServerSession(authOptions)
  const userId  = session!.user.id

  const [books] = await pool.execute(
    `SELECT b.id, b.title, b.status, b.price, b.is_free, b.total_reads,
            b.created_at, b.cover_url,
            bf.status AS file_status
     FROM books b
     LEFT JOIN book_files bf ON bf.book_id = b.id
     WHERE b.author_id = ?
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [userId]
  ) as any[]

  const total     = (books as any[]).length
  const published = (books as any[]).filter((b: any) => b.status === 'published').length
  const drafts    = (books as any[]).filter((b: any) => b.status === 'draft').length
  const inReview  = (books as any[]).filter((b: any) => b.status === 'in_review').length

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:'#eeecf8', letterSpacing:'-0.4px' }}>My Books</div>
          <div style={{ fontSize:12, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
            {total} books total
          </div>
        </div>
        <Link href="/author/books/new"
          style={{ padding:'8px 18px', borderRadius:6, background:'#9d7df5', color:'#0d0c10', fontSize:13, fontWeight:700, textDecoration:'none', fontFamily:"'Syne',system-ui,sans-serif" }}>
          + New Book
        </Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:'Total', value:total,     color:'#9d7df5' },
          { label:'Published', value:published, color:'#3dd6a3' },
          { label:'In Review', value:inReview,  color:'#e8c547' },
          { label:'Drafts',    value:drafts,    color:'#6b6b78' },
        ].map(s => (
          <div key={s.label} style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, padding:'16px 18px' }}>
            <div style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1px', textTransform:'uppercase' }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, letterSpacing:'-1px', marginTop:4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #272635', fontSize:13, fontWeight:700, color:'#eeecf8' }}>
          All Books
        </div>

        {(books as any[]).length === 0 ? (
          <div style={{ padding:'48px', textAlign:'center', color:'#635e80' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📚</div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>No books yet</div>
            <div style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>Upload your first book to get started</div>
            <Link href="/author/books/new" style={{ display:'inline-block', marginTop:16, padding:'8px 18px', borderRadius:6, background:'#9d7df5', color:'#0d0c10', fontSize:13, fontWeight:700, textDecoration:'none' }}>
              + New Book
            </Link>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Title', 'Status', 'Reads', 'Price', 'File', ''].map(h => (
                  <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10, fontWeight:600, color:'#635e80', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", borderBottom:'1px solid #272635', whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(books as any[]).map((book: any) => {
                const s = statusStyle[book.status] || statusStyle.draft
                return (
                  <tr key={book.id} style={{ borderBottom:'1px solid #272635' }}>
                    <td style={{ padding:'12px 18px' }}>
                      <div style={{ fontWeight:600, fontSize:13, color:'#eeecf8' }}>{book.title}</div>
                      <div style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>{book.category || 'Uncategorized'}</div>
                    </td>
                    <td style={{ padding:'12px 18px' }}>
                      <span style={{ padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", background:s.bg, color:s.color }}>
                        {book.status.replace('_',' ')}
                      </span>
                    </td>
                    <td style={{ padding:'12px 18px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#eeecf8' }}>
                      {book.total_reads?.toLocaleString() || '0'}
                    </td>
                    <td style={{ padding:'12px 18px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#3dd6a3' }}>
                      {book.is_free ? 'Free' : `$${parseFloat(book.price || 0).toFixed(2)}`}
                    </td>
                    <td style={{ padding:'12px 18px' }}>
                      {book.file_status === 'processed' && (
                        <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:'#3dd6a3' }}>✓ Ready</span>
                      )}
                      {book.file_status === 'processing' && (
                        <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:'#e8c547' }}>⟳ processing</span>
                      )}
                      {!book.file_status && (
                        <span style={{ fontSize:10, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding:'12px 18px' }}>
                      <Link href={`/author/books/${book.id}`}
                        style={{ padding:'4px 10px', borderRadius:4, border:'1px solid #2e3252', background:'transparent', color:'#635e80', fontSize:11, fontFamily:"'JetBrains Mono',monospace", textDecoration:'none' }}>
                        Manage →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
