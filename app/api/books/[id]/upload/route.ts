import { NextRequest } from 'next/server'
import pool               from '@/lib/db'
import { uploadFile }     from '@/lib/storage'
import { detectFormat }   from '@/lib/parsers'
import { ok, err, requirePermission } from '@/lib/api-helpers'

type Params = { params: { id: string } }

const ALLOWED_FORMATS = ['pdf', 'epub', 'docx', 'txt'] as const
const MAX_SIZE_BYTES  = 50 * 1024 * 1024  // 50 MB default

// ─── POST /api/books/:id/upload ───────────────────────────────
// Author uploads a book file. Stores it and queues AI processing.
export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('upload:books')
  if (response) return response

  // Verify book ownership
  const [books] = await pool.execute(
    'SELECT * FROM books WHERE id = ? AND author_id = ? LIMIT 1',
    [params.id, session!.user.id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found or access denied', 404)
  if (!['draft', 'rejected'].includes(book.status)) {
    return err('Can only upload files to books in draft or rejected state')
  }

  // Parse multipart form
  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  if (!file) return err('No file provided')

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    return err(`File too large. Max size is ${MAX_SIZE_BYTES / 1024 / 1024}MB`)
  }

  // Detect format
  const format = detectFormat(file.name, file.type)
  if (!format || !ALLOWED_FORMATS.includes(format as any)) {
    return err(`Unsupported format. Allowed: ${ALLOWED_FORMATS.join(', ')}`)
  }

  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  // Upload to storage (local or S3 — decided by platform_settings)
  const { storageKey, provider } = await uploadFile(
    { buffer, originalName: file.name, mimeType: file.type, size: file.size },
    `books/${params.id}`
  )

  // Record in DB
  const [fileResult] = await pool.execute(
    `INSERT INTO book_files (book_id, format, original_name, storage_key, file_size, status)
     VALUES (?, ?, ?, ?, ?, 'uploaded')`,
    [params.id, format, file.name, storageKey, file.size]
  ) as any[]

  const fileId = (fileResult as any).insertId

  // Queue AI processing job
  const [jobResult] = await pool.execute(
    `INSERT INTO ai_jobs (book_id, file_id, status) VALUES (?, ?, 'queued')`,
    [params.id, fileId]
  ) as any[]

  const jobId = (jobResult as any).insertId

  // Trigger AI processing async (non-blocking)
  // In production use a queue (BullMQ, SQS etc.)
  // For now: process in background and don't await
  processBookAsync(params.id, fileId, jobId, format, buffer).catch(console.error)

  return ok({
    message:    'File uploaded. AI is now processing your book to detect chapters.',
    file_id:    fileId,
    job_id:     jobId,
    format,
    provider,
    storage_key: storageKey,
  }, 201)
}

// ─── GET /api/books/:id/upload ────────────────────────────────
// Check upload/processing status
export async function GET(_: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('upload:books')
  if (response) return response

  const [files] = await pool.execute(
    `SELECT bf.*, aj.status AS job_status, aj.chapters_found, aj.error_msg AS job_error,
            aj.started_at, aj.finished_at, aj.id AS job_id
     FROM book_files bf
     LEFT JOIN ai_jobs aj ON aj.file_id = bf.id
     WHERE bf.book_id = ?
     ORDER BY bf.uploaded_at DESC`,
    [params.id]
  ) as any[]

  return ok({ files })
}

// ─── Background: parse + AI detect chapters ───────────────────
async function processBookAsync(
  bookId:  string,
  fileId:  number,
  jobId:   number,
  format:  string,
  buffer:  Buffer
) {
  try {
    // Mark job as running
    await pool.execute(
      `UPDATE ai_jobs SET status = 'running', started_at = NOW() WHERE id = ?`,
      [jobId]
    )
    await pool.execute(
      `UPDATE book_files SET status = 'processing' WHERE id = ?`,
      [fileId]
    )

    // Step 1: Extract text
    const { parseBookFile } = await import('@/lib/parsers')
    const parsed = await parseBookFile(buffer, format as any)

    // Step 2: AI chapter detection via GPT-4
    const { detectChapters } = await import('@/lib/ai-chapters')
    const result = await detectChapters(parsed.text)

    // Step 3: Delete any existing chapters for this book
    await pool.execute(
      `DELETE FROM chapters WHERE book_id = ?`,
      [bookId]
    )

    // Step 4: Insert detected chapters into DB
    for (const ch of result.chapters) {
      await pool.execute(
        `INSERT INTO chapters
           (book_id, chapter_num, title, content, word_count, is_published)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [bookId, ch.chapter_num, ch.title, ch.content, ch.word_count]
      )
    }

    // Step 5: Update job + file status
    await pool.execute(
      `UPDATE ai_jobs
       SET status = 'done', chapters_found = ?, result = ?, finished_at = NOW()
       WHERE id = ?`,
      [result.chapters.length, JSON.stringify({ summary: result.summary, warnings: result.warnings }), jobId]
    )
    await pool.execute(
      `UPDATE book_files SET status = 'processed' WHERE id = ?`, [fileId]
    )

    // Step 6: Update book word count
    await pool.execute(
      `UPDATE books SET total_words = ? WHERE id = ?`,
      [parsed.wordCount, bookId]
    )

  } catch (e: any) {
    await pool.execute(
      `UPDATE ai_jobs SET status = 'failed', error_msg = ?, finished_at = NOW() WHERE id = ?`,
      [e.message, jobId]
    )
    await pool.execute(
      `UPDATE book_files SET status = 'failed', error_msg = ? WHERE id = ?`,
      [e.message, fileId]
    )
  }
}
