import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import pool                 from '@/lib/db'
import Link                 from 'next/link'
import PurchaseButton       from '@/components/reader/PurchaseButton'

type SearchParams = { category?: string; sort?: string; free?: string; search?: string }

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const session  = await getServerSession(authOptions)
  const userId   = session!.user.id
  const category = searchParams.category || ''
  const sort     = searchParams.sort     || 'newest'
  const free     = searchParams.free     || ''
  const search   = searchParams.search   || ''

  const conditions = ["b.status='published'"]
  const params: unknown[] = [userId, userId]
  if (category) { conditions.push('b.category=?');  params.push(category) }
  if (search)   { conditions.push('(b.title LIKE ? OR u.name LIKE ?)'); params.push(`%${search}%`,`%${search}%`) }
  if (free)     { conditions.push('b.is_free=1') }

  const orderMap: Record<string,string> = {
    newest:'b.created_at DESC', popular:'b.total_reads DESC',
    price_asc:'b.price ASC', price_desc:'b.price DESC',
  }
  const order = orderMap[sort] || orderMap.newest

  const [books] = await pool.execute(
    `SELECT b.id, b.title, b.description, b.cover_url, b.price, b.is_free,
            b.is_featured, b.category, b.total_reads,
            u.name AS author_name,
            COUNT(DISTINCT c.id) AS chapter_count,
            COALESCE(AVG(r.rating),0) AS avg_rating,
            COUNT(DISTINCT r.id) AS review_count,
            MAX(CASE WHEN pu.user_id=? THEN 1 ELSE 0 END) AS is_owned
     FROM books b
     JOIN users u ON b.author_id=u.id
     LEFT JOIN chapters c ON c.book_id=b.id AND c.is_published=1
     LEFT JOIN reviews r ON r.book_id=b.id
     LEFT JOIN purchases pu ON pu.book_id=b.id AND pu.user_id=?
     WHERE ${conditions.join(' AND ')}
     GROUP BY b.id ORDER BY ${order} LIMIT 24`,
    params
  ) as any[]

  const [categories] = await pool.execute(
    `SELECT category, COUNT(*) AS count FROM books WHERE status='published' AND category IS NOT NULL
     GROUP BY category ORDER BY count DESC`
  ) as any[]

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:20, fontWeight:800, color:'#e8eaf8', letterSpacing:'-0.4px' }}>Browse Books</div>
        <div style={{ display:'flex', gap:8 }}>
          <form><input name="search" defaultValue={search} placeholder="Search…"
            style={{ background:'#1b1c2e', border:'1px solid #252840', borderRadius:6, padding:'7px 12px', fontSize:12, color:'#e8eaf8', outline:'none', fontFamily:"'JetBrains Mono',monospace", width:180 }} /></form>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <Link href="/dashboard/reader/browse" style={filterChip(!category && !free)}>All</Link>
        <Link href="?free=1" style={filterChip(!!free)}>Free</Link>
        {(categories as any[]).map((c: any) => (
          <Link key={c.category} href={`?category=${c.category}`} style={filterChip(category===c.category)}>
            {c.category} <span style={{ opacity:0.5, marginLeft:3 }}>{c.count}</span>
          </Link>
        ))}
      </div>

      {/* Sort */}
      <div style={{ display:'flex', gap:6 }}>
        {[['newest','Newest'],['popular','Popular'],['price_asc','Price ↑'],['price_desc','Price ↓']].map(([val,lbl]) => (
          <Link key={val} href={`?sort=${val}${category?`&category=${category}`:''}`}
            style={{ padding:'4px 10px', borderRadius:4, fontSize:11, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", textDecoration:'none', background: sort===val?'rgba(91,164,245,0.15)':'transparent', border:`1px solid ${sort===val?'rgba(91,164,245,0.4)':'#252840'}`, color: sort===val?'#5ba4f5':'#5a5e80' }}>
            {lbl}
          </Link>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:16 }}>
        {(books as any[]).map((b: any) => (
          <div key={b.id} style={{ background:'#131520', border:'1px solid #252840', borderRadius:10, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            {b.is_featured && (
              <div style={{ background:'rgba(232,197,71,0.15)', padding:'3px 10px', fontSize:10, fontWeight:700, color:'#e8c547', fontFamily:"'JetBrains Mono',monospace", textAlign:'center' }}>✦ FEATURED</div>
            )}
            <div style={{ height:110, background:'rgba(91,164,245,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>📘</div>
            <div style={{ padding:12, flex:1, display:'flex', flexDirection:'column' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf8', marginBottom:2, lineHeight:1.3 }}>{b.title}</div>
              <div style={{ fontSize:11, color:'#5a5e80', fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>{b.author_name}</div>
              {b.avg_rating > 0 && (
                <div style={{ fontSize:11, color:'#e8c547', marginBottom:4 }}>
                  {'★'.repeat(Math.round(b.avg_rating))}{'☆'.repeat(5-Math.round(b.avg_rating))}
                  <span style={{ color:'#5a5e80', marginLeft:4 }}>({b.review_count})</span>
                </div>
              )}
              <div style={{ flex:1 }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color: b.is_free ? '#3dd6a3' : '#e8eaf8', fontFamily:"'JetBrains Mono',monospace" }}>
                  {b.is_free ? 'Free' : `$${parseFloat(b.price).toFixed(2)}`}
                </span>
                {b.is_owned ? (
                  <Link href={`/dashboard/reader/read/${b.id}`}
                    style={{ padding:'5px 10px', borderRadius:5, background:'#5ba4f5', color:'#0c0d10', fontSize:11, fontWeight:700, textDecoration:'none' }}>
                    Read →
                  </Link>
                ) : (
                  <PurchaseButton bookId={b.id} price={b.price} isFree={b.is_free} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {(books as any[]).length === 0 && (
        <div style={{ textAlign:'center', padding:'48px', color:'#5a5e80' }}>
          <div style={{ fontSize:28, marginBottom:10 }}>📭</div>
          <div style={{ fontSize:14 }}>No books found</div>
        </div>
      )}
    </div>
  )
}

function filterChip(active: boolean): React.CSSProperties {
  return {
    padding:'5px 12px', borderRadius:5, fontSize:11, fontWeight:600,
    fontFamily:"'JetBrains Mono',monospace", textDecoration:'none',
    background: active ? 'rgba(91,164,245,0.15)' : '#131520',
    border: `1px solid ${active ? 'rgba(91,164,245,0.4)' : '#252840'}`,
    color: active ? '#5ba4f5' : '#5a5e80',
  }
}
