import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import pool                 from '@/lib/db'
import Link                 from 'next/link'

export default async function ReaderHomePage() {
  const session = await getServerSession(authOptions)
  const userId  = session!.user.id

  // In-progress books
  const [inProgress] = await pool.execute(
    `SELECT b.id, b.title, b.cover_url, u.name AS author_name,
            rp.scroll_pct, rp.chapter_id,
            c.chapter_num AS current_chapter_num, c.title AS current_chapter_title,
            COUNT(DISTINCT ch.id) AS total_chapters
     FROM reading_progress rp
     JOIN books b ON rp.book_id = b.id
     JOIN users u ON b.author_id = u.id
     JOIN chapters c ON rp.chapter_id = c.id
     LEFT JOIN chapters ch ON ch.book_id = b.id AND ch.is_published = 1
     WHERE rp.user_id = ? AND rp.scroll_pct < 100
     GROUP BY b.id, rp.scroll_pct, rp.chapter_id, c.chapter_num, c.title
     ORDER BY rp.updated_at DESC LIMIT 3`,
    [userId]
  ) as any[]

  // Reading stats
  const [[stats]] = await pool.execute(
    `SELECT
       COUNT(DISTINCT pu.book_id)                   AS books_owned,
       COALESCE(SUM(rp.time_spent_s), 0)            AS time_spent_s,
       COUNT(DISTINCT bm.id)                        AS bookmarks,
       COUNT(DISTINCT CASE WHEN rp.scroll_pct>=95 THEN rp.book_id END) AS completed
     FROM purchases pu
     LEFT JOIN reading_progress rp ON rp.user_id=pu.user_id AND rp.book_id=pu.book_id
     LEFT JOIN bookmarks bm ON bm.user_id=pu.user_id
     WHERE pu.user_id=?`,
    [userId]
  ) as any[]

  const hoursRead = Math.floor((stats?.time_spent_s || 0) / 3600)

  // Recent purchases
  const [recentBooks] = await pool.execute(
    `SELECT b.id, b.title, b.cover_url, b.category, u.name AS author_name,
            pu.price_paid, pu.created_at AS purchased_at,
            COALESCE(rp.scroll_pct, 0) AS progress
     FROM purchases pu
     JOIN books b ON pu.book_id=b.id
     JOIN users u ON b.author_id=u.id
     LEFT JOIN reading_progress rp ON rp.user_id=pu.user_id AND rp.book_id=b.id
     WHERE pu.user_id=? ORDER BY pu.created_at DESC LIMIT 6`,
    [userId]
  ) as any[]

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:'#e8eaf8', letterSpacing:'-0.4px' }}>My Library</div>
          <div style={{ fontSize:12, color:'#5a5e80', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
            Welcome back, {session!.user.name?.split(' ')[0]}
          </div>
        </div>
        <Link href="/dashboard/reader/browse" style={{ padding:'8px 18px', borderRadius:6, background:'#5ba4f5', color:'#0c0d10', fontSize:12, fontWeight:700, textDecoration:'none' }}>
          Browse Books
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { label:'Books Owned', value:stats?.books_owned || 0,  color:'#5ba4f5' },
          { label:'Hours Read',  value:`${hoursRead}h`,          color:'#3dd6a3' },
          { label:'Completed',   value:stats?.completed || 0,    color:'#9d7df5' },
          { label:'Bookmarks',   value:stats?.bookmarks || 0,    color:'#e8c547' },
        ].map(s => (
          <div key={s.label} style={{ background:'#131520', border:'1px solid #252840', borderRadius:10, padding:'16px 18px' }}>
            <div style={{ fontSize:11, color:'#5a5e80', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1px', textTransform:'uppercase' }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, marginTop:4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Continue reading */}
      {(inProgress as any[]).length > 0 && (
        <div style={{ background:'#131520', border:'1px solid #252840', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #252840', fontSize:13, fontWeight:700, color:'#e8eaf8' }}>Continue Reading</div>
          {(inProgress as any[]).map((b: any) => (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderBottom:'1px solid #252840' }}>
              <div style={{ width:44, height:60, borderRadius:6, background:'rgba(91,164,245,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📘</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf8' }}>{b.title}</div>
                <div style={{ fontSize:11, color:'#5a5e80', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
                  {b.author_name} · Ch.{b.current_chapter_num} — {b.current_chapter_title}
                </div>
                <div style={{ marginTop:6, height:3, background:'#1f2232', borderRadius:2, overflow:'hidden', maxWidth:200 }}>
                  <div style={{ height:'100%', width:`${b.scroll_pct}%`, background:'linear-gradient(to right,#5ba4f5,#9d7df5)', borderRadius:2 }} />
                </div>
                <div style={{ fontSize:10, color:'#5a5e80', fontFamily:"'JetBrains Mono',monospace", marginTop:3 }}>{b.scroll_pct}% complete</div>
              </div>
              <Link href={`/dashboard/reader/read/${b.id}`}
                style={{ padding:'8px 18px', borderRadius:6, background:'#5ba4f5', color:'#0c0d10', fontSize:12, fontWeight:700, textDecoration:'none', flexShrink:0 }}>
                Read →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* All books grid */}
      <div style={{ background:'#131520', border:'1px solid #252840', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #252840', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf8' }}>All Books</div>
          <Link href="/dashboard/reader/library" style={{ fontSize:11, color:'#5ba4f5', fontFamily:"'JetBrains Mono',monospace", textDecoration:'none' }}>View all →</Link>
        </div>
        {(recentBooks as any[]).length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:'#5a5e80' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>📚</div>
            <div style={{ fontSize:13, marginBottom:6 }}>No books yet</div>
            <Link href="/dashboard/reader/browse" style={{ fontSize:12, color:'#5ba4f5', fontFamily:"'JetBrains Mono',monospace" }}>Browse the catalog →</Link>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, padding:16 }}>
            {(recentBooks as any[]).map((b: any) => (
              <div key={b.id} style={{ background:'#1b1c2e', border:'1px solid #252840', borderRadius:8, overflow:'hidden' }}>
                <div style={{ height:100, background:'rgba(91,164,245,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>📘</div>
                <div style={{ padding:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf8', marginBottom:2 }}>{b.title}</div>
                  <div style={{ fontSize:11, color:'#5a5e80', fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>{b.author_name}</div>
                  <div style={{ height:3, background:'#252840', borderRadius:2, overflow:'hidden', marginBottom:6 }}>
                    <div style={{ height:'100%', width:`${b.progress}%`, background:'#5ba4f5', borderRadius:2 }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:10, color:'#5a5e80', fontFamily:"'JetBrains Mono',monospace" }}>{b.progress}%</span>
                    <Link href={`/dashboard/reader/read/${b.id}`}
                      style={{ fontSize:11, fontWeight:700, color:'#5ba4f5', textDecoration:'none', fontFamily:"'JetBrains Mono',monospace" }}>
                      {b.progress > 0 ? 'Continue →' : 'Start →'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
