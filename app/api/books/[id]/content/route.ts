import { NextRequest } from 'next/server'
import pool            from '@/lib/db'
import { readFile }    from '@/lib/storage'
import { parseBookFile } from '@/lib/parsers'
import { ok, err }   from '@/lib/api-helpers'

type Params = { params: { id: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const [files] = await pool.execute(
    `SELECT bf.id, bf.format, bf.storage_key, bf.original_name
     FROM book_files bf
     WHERE bf.book_id = ? AND bf.status = 'processed'
     ORDER BY bf.uploaded_at DESC LIMIT 1`,
    [params.id]
  ) as any[]

  const file = (files as any[])[0]
  if (!file) return err('No file found for this book', 404)

  try {
    const buffer = await readFile(file.storage_key)
    const parsed = await parseBookFile(buffer, file.format)

    return ok({
      bookId: params.id,
      format: file.format,
      originalName: file.original_name,
      content: parsed.text,
      wordCount: parsed.wordCount,
    })
  } catch (e: any) {
    return err(`Failed to read file: ${e.message}`)
  }
}
