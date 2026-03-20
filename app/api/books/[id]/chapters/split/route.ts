import { NextRequest }     from 'next/server'
import pool                from '@/lib/db'
import { readFile }        from '@/lib/storage'
import { parseBookFile }   from '@/lib/parsers'
import { detectChapters }  from '@/lib/ai-chapters'
import { ok, err, requireAuth } from '@/lib/api-helpers'

type Params = { params: { id: string } }

// ─── POST /api/books/:id/chapters/split ────────────────────────
// Parse uploaded file and create chapters
export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role   = session!.user.role
  const userId = session!.user.id

  // Verify ownership
  const [books] = await pool.execute(
    'SELECT * FROM books WHERE id = ? LIMIT 1', [params.id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found', 404)

  if (role === 'author' && book.author_id !== userId) return err('Forbidden', 403)
  if (!['draft', 'rejected'].includes(book.status)) {
    return err('Can only modify chapters for books in draft or rejected state')
  }

  // Get the latest uploaded file
  const [files] = await pool.execute(
    `SELECT bf.*, aj.status AS ai_status
     FROM book_files bf
     LEFT JOIN ai_jobs aj ON aj.file_id = bf.id
     WHERE bf.book_id = ?
     ORDER BY bf.uploaded_at DESC LIMIT 1`,
    [params.id]
  ) as any[]
  const file = (files as any[])[0]

  if (!file) {
    return err('No file found. Upload a book file first.', 400)
  }

  try {
    // Read file from storage
    const buffer = await readFile(file.storage_key)

    // Parse the file based on format
    const { parseBookFile } = await import('@/lib/parsers')
    const { text, wordCount } = await parseBookFile(buffer, file.format)

    if (!text || text.length < 100) {
      return err('Could not extract text from file. File may be empty or encrypted.')
    }

    // Use AI to detect chapters
    const result = await detectChapters(text)

    // Delete existing chapters
    await pool.execute('DELETE FROM chapters WHERE book_id = ?', [params.id])

    // Create new chapters from AI detection
    const conn = await pool.getConnection()
    const createdChapters: any[] = []

    try {
      await conn.beginTransaction()

      for (const chapter of result.chapters) {
        const [insertResult] = await conn.execute(
          `INSERT INTO chapters (book_id, chapter_num, title, content, word_count, is_published)
           VALUES (?, ?, ?, ?, ?, 0)`,
          [params.id, chapter.chapter_num, chapter.title, chapter.content, chapter.word_count]
        ) as any[]
        
        createdChapters.push({
          id:           (insertResult as any).insertId,
          chapter_num:  chapter.chapter_num,
          title:        chapter.title,
          word_count:   chapter.word_count,
          confidence:   chapter.confidence,
        })
      }

      await conn.commit()
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }

    // Update book stats
    const totalWords = createdChapters.reduce((sum, c) => sum + c.word_count, 0)
    await pool.execute(
      'UPDATE books SET total_words = ? WHERE id = ?',
      [totalWords, params.id]
    )

    return ok({
      message:         `Created ${createdChapters.length} chapters`,
      chapters:        createdChapters,
      total_words:     totalWords,
      total_chapters: createdChapters.length,
      summary:         result.summary,
      warnings:        result.warnings,
    })

  } catch (e: any) {
    console.error('Chapter split error:', e)
    return err(`Failed to split chapters: ${e.message}`)
  }
}

// ─── GET /api/books/:id/chapters/split ─────────────────────────
// Preview how chapters would be split (without saving)
export async function GET(_: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role   = session!.user.role
  const userId = session!.user.id

  // Verify ownership
  const [books] = await pool.execute(
    'SELECT * FROM books WHERE id = ? LIMIT 1', [params.id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found', 404)

  if (role === 'author' && book.author_id !== userId) return err('Forbidden', 403)

  // Get the latest uploaded file
  const [files] = await pool.execute(
    `SELECT bf.*
     FROM book_files bf
     WHERE bf.book_id = ?
     ORDER BY bf.uploaded_at DESC LIMIT 1`,
    [params.id]
  ) as any[]
  const file = (files as any[])[0]

  if (!file) {
    return err('No file found', 400)
  }

  try {
    const buffer = await readFile(file.storage_key)
    const { parseBookFile } = await import('@/lib/parsers')
    const { text, wordCount } = await parseBookFile(buffer, file.format)

    if (!text || text.length < 100) {
      return err('Could not extract text from file')
    }

    // Get AI chapter detection preview
    const result = await detectChapters(text)

    return ok({
      total_words:      wordCount,
      estimated_chapters: result.chapters.length,
      preview:          result.chapters.slice(0, 10).map((c: any) => ({
        chapter_num: c.chapter_num,
        title:       c.title,
        word_count:  c.word_count,
        confidence:  c.confidence,
      })),
      summary:   result.summary,
      warnings:   result.warnings,
    })

  } catch (e: any) {
    return err(`Preview failed: ${e.message}`)
  }
}
