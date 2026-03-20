import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requireAuth } from '@/lib/api-helpers'

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
