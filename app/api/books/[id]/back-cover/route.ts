/**
 * POST /api/books/:id/back-cover  — upload back cover image
 * DELETE /api/books/:id/back-cover — remove back cover
 */
import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { uploadFile, deleteFile } from '@/lib/storage'
import { ok, err, requirePermission } from '@/lib/api-helpers'

type Params = { params: { id: string } }

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('upload:books')
  if (response) return response

  const [books] = await pool.execute(
    'SELECT id, back_cover_key FROM books WHERE id=? AND author_id=? LIMIT 1',
    [params.id, session!.user.id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found or access denied', 404)

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return err('No file provided')

  if (!ALLOWED_MIME.includes(file.type)) {
    return err('Unsupported format. Allowed: JPG, PNG, WebP')
  }
  if (file.size > MAX_BYTES) {
    return err('File too large. Max 10MB')
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (book.back_cover_key) {
    await deleteFile(book.back_cover_key).catch(() => {})
  }

  const result = await uploadFile(
    {
      buffer,
      originalName: `back-cover-${params.id}.jpg`,
      mimeType: 'image/jpeg',
      size: buffer.length,
    },
    `books/covers/${params.id}`
  )

  const url = `/uploads/${result.storageKey}`

  await pool.execute(
    'UPDATE books SET back_cover_url = ?, back_cover_key = ? WHERE id = ?',
    [url, result.storageKey, params.id]
  )

  return ok({ url, storageKey: result.storageKey })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('upload:books')
  if (response) return response

  const [books] = await pool.execute(
    'SELECT back_cover_key FROM books WHERE id=? AND author_id=? LIMIT 1',
    [params.id, session!.user.id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found', 404)

  if (book.back_cover_key) {
    await deleteFile(book.back_cover_key).catch(() => {})
  }

  await pool.execute(
    'UPDATE books SET back_cover_url = NULL, back_cover_key = NULL WHERE id = ?',
    [params.id]
  )

  return ok({ message: 'Back cover removed' })
}
