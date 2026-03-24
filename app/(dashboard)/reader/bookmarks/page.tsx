import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import pool                 from '@/lib/db'
import Link                 from 'next/link'

export default async function BookmarksPage() {
  const session = await getServerSession(authOptions)
  const userId  = session!.user.id

  const [bookmarks] = await pool.execute(
    `SELECT bm.id, bm.page_num, bm.note, bm.highlight, bm.created_at,
            b.id AS book_id, b.title AS book_title,
            u.name AS author_name,
            c.id AS chapter_id, c.title AS chapter_title, c.chapter_num
     FROM bookmarks bm
     JOIN books b    ON bm.book_id    = b.id
     JOIN users u    ON b.author_id   = u.id
     JOIN chapters c ON bm.chapter_id = c.id
     WHERE bm.user_id = ?
     ORDER BY bm.created_at DESC`,
    [userId]
  ) as any[]

  // Group by book
  const byBook = (bookmarks as any[]).reduce((acc: any, bm: any) => {
    if (!acc[bm.book_id]) acc[bm.book_id] = { title: bm.book_title, author: bm.author_name, items: [] }
    acc[bm.book_id].items.push(bm)
    return acc
  }, {})

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:16 }}>
      <div>
        <div style={{ fontSize:20, fontWeight:800, color:'#e8eaf8', letterSpacing:'-0.4px' }}>Bookmarks</div>
        <div style={{ fontSize:12, color:'#5a5e80', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
          {(bookmarks as any[]).length} saved across {Object.keys(byBook).length} books
        </div>
      </div>

      {Object.keys(byBook).length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px', color:'#5a5e80', background:'#131520', borderRadius:10, border:'1px solid #252840' }}>
          <div style={{ fontSize:28, marginBottom:10 }}>☆</div>
          <div>No bookmarks yet. Tap ☆ while reading to save your spot.</div>
        </div>
      ) : (
        Object.entries(byBook).map(([bookId, book]: any) => (
          <div key={bookId} style={{ background:'#131520', border:'1px solid #252840', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'13px 18px', borderBottom:'1px solid #252840', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf8' }}>{book.title}</div>
                <div style={{ fontSize:11, color:'#5a5e80', fontFamily:"'JetBrains Mono',monospace" }}>{book.author}</div>
              </div>
              <Link href={`/reader/read/${bookId}`}
                style={{ fontSize:11, color:'#5ba4f5', fontFamily:"'JetBrains Mono',monospace", textDecoration:'none' }}>
                Continue →
              </Link>
            </div>
            {book.items.map((bm: any) => (
              <div key={bm.id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 18px', borderBottom:'1px solid #25284022' }}>
                <div style={{ fontSize:18, flexShrink:0, marginTop:2 }}>★</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:'#e8eaf8', fontWeight:600 }}>
                    Ch.{bm.chapter_num} — {bm.chapter_title}
                    <span style={{ color:'#5a5e80', fontFamily:"'JetBrains Mono',monospace", fontWeight:400, marginLeft:8 }}>p.{bm.page_num}</span>
                  </div>
                  {bm.note && <div style={{ fontSize:12, color:'#5a5e80', marginTop:4, fontStyle:'italic' }}>"{bm.note}"</div>}
                  {bm.highlight && <div style={{ fontSize:12, color:'#e8c547', marginTop:4, background:'rgba(232,197,71,0.08)', padding:'4px 8px', borderRadius:4, borderLeft:'2px solid #e8c547' }}>"{bm.highlight}"</div>}
                  <div style={{ fontSize:10, color:'#5a5e80', fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>
                    {new Date(bm.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </div>
                </div>
                <Link href={`/reader/read/${bookId}`}
                  style={{ padding:'4px 10px', borderRadius:4, background:'rgba(91,164,245,0.1)', border:'1px solid rgba(91,164,245,0.2)', color:'#5ba4f5', fontSize:11, fontFamily:"'JetBrains Mono',monospace", textDecoration:'none', flexShrink:0 }}>
                  Jump →
                </Link>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
