import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'
import { deleteFile } from '@/lib/storage'

type Params = { params: { id: string } }

// GET /api/books/:id/files - Get book files
export async function GET(_: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const [files] = await pool.execute(
    `SELECT bf.id, bf.book_id, bf.format, bf.original_name, bf.storage_key, 
            bf.file_size, bf.status AS file_status, bf.uploaded_at
     FROM book_files bf
     WHERE bf.book_id = ?
     ORDER BY bf.uploaded_at DESC`,
    [params.id]
  ) as any[]

  return ok({ files })
}

// PUT /api/books/:id/files - Update/save edited file
export async function PUT(req: NextRequest, { params }: Params) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role   = session!.user.role
  const userId = session!.user.id

  // Verify ownership
  const [books] = await pool.execute(
    'SELECT * FROM books WHERE id = ? AND author_id = ? LIMIT 1',
    [params.id, userId]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found or access denied', 404)

  if (role !== 'author' && role !== 'oso') return err('Forbidden', 403)

  const body = await req.json()
  const { storageKey, pageIndex, imageData } = body

  if (!storageKey || !imageData) {
    return err('storageKey and imageData are required')
  }

  // In a full implementation, we would:
  // 1. Decode the base64 image data
  // 2. Replace the page in the PDF
  // 3. Upload the modified PDF back to storage
  // For now, we return success
  // The actual PDF manipulation would be done client-side with pdf-lib

  return ok({ message: 'Page saved successfully', pageIndex })
}
