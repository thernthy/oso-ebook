import { NextRequest } from 'next/server'
import pool               from '@/lib/db'
import { uploadFile }     from '@/lib/storage'
import { detectFormat }   from '@/lib/parsers'
import { ok, err, requirePermission } from '@/lib/api-helpers'

type Params = { params: { id: string } }

const DEFAULT_FORMATS = ['pdf', 'epub', 'docx', 'txt']
const DEFAULT_MAX_MB = 50

async function getUploadSettings() {
  const [rows] = await pool.execute(
    'SELECT setting_key, value FROM platform_settings WHERE setting_key IN (?, ?)',
    ['allowed_formats', 'max_upload_mb']
  ) as any[]
  const settings: Record<string, string> = {}
  for (const row of rows as any[]) {
    settings[row.setting_key] = row.value
  }
  const formats = settings.allowed_formats
    ? settings.allowed_formats.split(',').map((f: string) => f.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_FORMATS
  const maxMb = settings.max_upload_mb ? parseInt(settings.max_upload_mb, 10) : DEFAULT_MAX_MB
  return { formats, maxMb }
}

// ─── POST /api/books/:id/upload ───────────────────────────────
// Author uploads a book file. Stores it for reading.
export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('upload:books')
  if (response) return response

  const [books] = await pool.execute(
    'SELECT * FROM books WHERE id = ? AND author_id = ? LIMIT 1',
    [params.id, session!.user.id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found or access denied', 404)
  if (!['draft', 'rejected'].includes(book.status)) {
    return err('Can only upload files to books in draft or rejected state')
  }

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  if (!file) return err('No file provided')

  const { formats: allowedFormats, maxMb } = await getUploadSettings()
  const maxSizeBytes = maxMb * 1024 * 1024

  if (file.size > maxSizeBytes) {
    return err(`File too large. Max size is ${maxMb}MB`)
  }

  const format = detectFormat(file.name, file.type)
  if (!format || !allowedFormats.includes(format.toLowerCase())) {
    return err(`Unsupported format. Allowed: ${allowedFormats.join(', ')}`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const { storageKey, provider } = await uploadFile(
    { buffer, originalName: file.name, mimeType: file.type, size: file.size },
    `books/${params.id}`
  )

  const [fileResult] = await pool.execute(
    `INSERT INTO book_files (book_id, format, original_name, storage_key, file_size, status)
     VALUES (?, ?, ?, ?, ?, 'processed')`,
    [params.id, format, file.name, storageKey, file.size]
  ) as any[]

  const fileId = (fileResult as any).insertId

  await pool.execute(
    `UPDATE book_files SET status = 'processed' WHERE book_id = ? AND id != ?`,
    [params.id, fileId]
  )

  return ok({
    message:    'File uploaded successfully.',
    file_id:    fileId,
    format,
    provider,
    storage_key: storageKey,
  }, 201)
}

// ─── GET /api/books/:id/upload ───────────────────────────────
// Check upload status
export async function GET(_: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('upload:books')
  if (response) return response

  const [files] = await pool.execute(
    `SELECT bf.*, aj.status AS job_status, aj.error_msg AS job_error,
            aj.started_at, aj.finished_at, aj.id AS job_id
     FROM book_files bf
     LEFT JOIN ai_jobs aj ON aj.file_id = bf.id
     WHERE bf.book_id = ?
     ORDER BY bf.uploaded_at DESC`,
    [params.id]
  ) as any[]

  return ok({ files })
}
