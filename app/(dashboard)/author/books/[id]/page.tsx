import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import pool                 from '@/lib/db'
import { notFound }         from 'next/navigation'
import Link                 from 'next/link'
import BookUploadPanel      from '@/components/author/BookUploadPanel'
import ChapterList          from '@/components/author/ChapterList'
import BookActions          from '@/components/author/BookActions'
import CoverUpload          from '@/components/author/CoverUpload'
import BookSettings         from '@/components/author/BookSettings'
import FileViewer            from '@/components/author/FileViewer'
import AuthorBookPreview    from '@/components/author/AuthorBookPreview'

type Params = { params: { id: string } }

export default async function BookDetailPage({ params }: Params) {
  const session = await getServerSession(authOptions)
  const userId  = session!.user.id

  const [
    [books],
    [chapters],
    [files],
    [statsRows],
    [readingStatsRows],
  ] = await Promise.all([
    // 1. Core book data
    pool.execute(
      `SELECT b.*, p.name AS partner_name
       FROM books b
       LEFT JOIN users p ON b.partner_id = p.id
       WHERE b.id = ? AND b.author_id = ? LIMIT 1`,
      [params.id, userId]
    ),
    // 2. Chapters list
    pool.execute(
      `SELECT id, chapter_num, title, word_count, is_published, created_at
       FROM chapters WHERE book_id = ? ORDER BY chapter_num ASC`,
      [params.id]
    ),
    // 3. Latest file/AI job
    pool.execute(
      `SELECT bf.id, bf.format, bf.original_name, bf.file_size, bf.status AS file_status,
              aj.id AS job_id, aj.status AS ai_status, aj.chapters_found,
              aj.error_msg AS ai_error, aj.finished_at
       FROM book_files bf
       LEFT JOIN ai_jobs aj ON aj.file_id = bf.id
       WHERE bf.book_id = ?
       ORDER BY bf.uploaded_at DESC LIMIT 1`,
      [params.id]
    ),
    // 4. Chapter stats
    pool.execute(
      `SELECT 
         SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) AS published_chapters,
         COALESCE(SUM(word_count), 0) AS total_words
       FROM chapters WHERE book_id = ?`,
      [params.id]
    ),
    // 5. Reading stats
    pool.execute(
      `SELECT COUNT(*) AS total_reading_sessions FROM reading_progress WHERE book_id = ?`,
      [params.id]
    ),
  ]) as any[]

  const book = (books as any[])[0]
  if (!book) notFound()

  const latestFile = (files as any[])[0] || null
  const chStats = (statsRows as any[])[0] || {}
  const rStats = (readingStatsRows as any[])[0] || {}

  const bookStats = {
    published_chapters: chStats.published_chapters || 0,
    total_words: chStats.total_words || 0,
    total_reading_sessions: rStats.total_reading_sessions || 0,
  }

  const statusColors: Record<string, string> = {
    published: '#3dd6a3', in_review: '#9d7df5', draft: '#6b6b78', rejected: '#f07060',
  }
  const statusColor = statusColors[book.status] || '#6b6b78'

  const formatSessions = (count: number) => {
    if (count === 0) return '—'
    if (count === 1) return '1 session'
    return `${count.toLocaleString()} sessions`
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>

      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#635e80' }}>
        <Link href="/author/books" style={{ color:'#635e80', textDecoration:'none' }}>My Books</Link>
        <span>›</span>
        <span style={{ color:'#9d7df5' }}>{book.title}</span>
      </div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <span style={{ fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", padding:'3px 8px', borderRadius:4, background:`rgba(${statusColor === '#3dd6a3' ? '61,214,163' : statusColor === '#9d7df5' ? '157,125,245' : statusColor === '#f07060' ? '240,112,96' : '99,94,128'},0.12)`, color:statusColor }}>
              {book.status.replace('_', ' ')}
            </span>
            {book.partner_name && (
              <span style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>
                via {book.partner_name}
              </span>
            )}
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:'#eeecf8', letterSpacing:'-0.5px' }}>{book.title}</div>
          {book.description && (
            <div style={{ fontSize:13, color:'#635e80', marginTop:6, maxWidth:500, lineHeight:1.6 }}>{book.description}</div>
          )}
        </div>

        {/* Action buttons */}
        <BookActions book={book} chapterCount={(chapters as any[]).length} />
      </div>

      {/* Stats Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
        {[
          { label:'Total Reads', value:book.total_reads?.toLocaleString() || '0', color:'#5ba4f5', icon:'👁' },
          { label:'Chapters', value:`${bookStats.published_chapters}/${(chapters as any[]).length}`, color:'#9d7df5', icon:'📄' },
          { label:'Words', value:(bookStats.total_words as number)?.toLocaleString() || '0', color:'#3dd6a3', icon:'✎' },
          { label:'Readers', value:formatSessions(bookStats.total_reading_sessions || 0), color:'#e8c547', icon:'👤' },
          { label:'Price', value:book.is_free ? 'Free' : `$${parseFloat(book.price || 0).toFixed(2)}`, color:'#3dd6a3', icon:'💰' },
        ].map(stat => (
          <div key={stat.label} style={{ background:'#151420', border:'1px solid #272635', borderRadius:8, padding:'12px 14px' }}>
            <div style={{ fontSize:10, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", textTransform:'uppercase', letterSpacing:'0.5px' }}>{stat.label}</div>
            <div style={{ fontSize:18, fontWeight:800, color:stat.color, marginTop:2 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Review feedback banner */}
      {book.status === 'rejected' && book.review_feedback && (
        <div style={{ background:'rgba(240,112,96,0.08)', border:'1px solid rgba(240,112,96,0.25)', borderRadius:8, padding:'14px 18px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#f07060', fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>REJECTION FEEDBACK</div>
          <div style={{ fontSize:13, color:'#eeecf8', lineHeight:1.6 }}>{book.review_feedback}</div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:20, alignItems:'start' }}>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Cover upload */}
          <CoverUpload
            bookId={params.id}
            currentCover={book.cover_url || null}
            bookStatus={book.status}
          />
          {/* Book file upload */}
          <BookUploadPanel bookId={params.id} bookStatus={book.status} latestFile={latestFile} />
          {/* Preview button for book */}
          <AuthorBookPreview
            bookId={params.id}
            bookTitle={book.title}
            chapters={chapters as any[]}
          />
          {/* File viewer for PDF */}
          <FileViewer bookId={params.id} />
          {/* Book settings */}
          <BookSettings book={book} />
        </div>

        {/* Chapter list */}
        <ChapterList bookId={params.id} chapters={chapters as any[]} bookStatus={book.status} />
      </div>
    </div>
  )
}
