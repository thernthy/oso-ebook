import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import pool                 from '@/lib/db'
import { redirect }         from 'next/navigation'
import Link                from 'next/link'

type Params = { params: { bookId: string } }

export default async function ReadPage({ params }: Params) {
  const session = await getServerSession(authOptions)
  const userId  = session!.user.id

  const [access] = await pool.execute(
    `SELECT b.id, b.title, b.is_free
     FROM books b
     LEFT JOIN purchases p ON p.book_id=b.id AND p.user_id=?
     WHERE b.id=? AND b.status='published' AND (b.is_free=1 OR p.id IS NOT NULL)
     LIMIT 1`,
    [userId, params.bookId]
  ) as any[]

  const book = (access as any[])[0]
  if (!book) redirect(`/reader/books/${params.bookId}`)

  return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#0d0c10', color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>📖</div>
        <div style={{ fontSize:18, fontWeight:700, color:'#eeecf8', marginBottom:8 }}>{book.title}</div>
        <div style={{ fontSize:13 }}>Book reader coming soon.</div>
        <Link href="/reader/library" style={{ display:'inline-block', marginTop:20, padding:'10px 20px', background:'#9d7df5', color:'#fff', borderRadius:6, textDecoration:'none', fontSize:13, fontWeight:600 }}>
          Back to Library
        </Link>
      </div>
    </div>
  )
}
