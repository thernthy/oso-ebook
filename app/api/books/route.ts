import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requireAuth, requirePermission, parsePagination } from '@/lib/api-helpers'
import { Role } from '@/lib/permissions'

// ─── GET /api/books ───────────────────────────────────────────
// Public-ish: readers see published books only.
// Partners see their catalog. OSO sees all.
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const role      = session!.user.role as Role
  const userId    = session!.user.id
  const partnerId = session!.user.partner_id

  const url      = new URL(req.url)
  const status   = url.searchParams.get('status')   || ''
  const category = url.searchParams.get('category') || ''
  const search   = url.searchParams.get('search')   || ''
  const featured = url.searchParams.get('featured') || ''
  const { limit, offset } = parsePagination(url)

  const conditions: string[] = []
  const params: unknown[]    = []

  // Role-scoped visibility
  if (role === 'oso') {
    // Sees everything — no filter
  } else if (role === 'partner') {
    conditions.push('b.partner_id = ?')
    params.push(userId)
  } else if (role === 'author') {
    conditions.push('b.author_id = ?')
    params.push(userId)
  } else {
    // Reader: published only
    conditions.push("b.status = 'published'")
  }

  // Additional filters
  if (status   && role !== 'reader') { conditions.push('b.status = ?');     params.push(status) }
  if (category) { conditions.push('b.category = ?');   params.push(category) }
  if (featured) { conditions.push('b.is_featured = 1') }
  if (search)   {
    conditions.push('(b.title LIKE ? OR b.description LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await pool.execute(
    `SELECT
       b.id, b.title, b.description, b.cover_url,
       b.status, b.price, b.is_free, b.is_featured,
       b.category, b.total_reads, b.created_at,
       u.name  AS author_name,
       u.id    AS author_id,
       p.name  AS partner_name
     FROM books b
     JOIN users u ON b.author_id  = u.id
     JOIN users p ON b.partner_id = p.id
     ${where}
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  ) as any[]

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) as total FROM books b ${where}`,
    params
  ) as any[]

  return ok({ books: rows, total, limit, offset })
}

// ─── POST /api/books ──────────────────────────────────────────
// Authors create books (status = draft by default)
export async function POST(req: NextRequest) {
  const { session, response } = await requirePermission('upload:books')
  if (response) return response

  const body = await req.json()
  const { title, description, cover_url, price = 0, is_free = false, category } = body

  if (!title) return err('title is required')

  const authorId  = session!.user.id
  const partnerId = session!.user.partner_id

  // Authors must belong to a partner
  if (!partnerId) return err('Author must be linked to a partner', 422)

  const [result] = await pool.execute(
    `INSERT INTO books (title, description, cover_url, author_id, partner_id, price, is_free, category)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description || null, cover_url || null, authorId, partnerId, price, is_free ? 1 : 0, category || null]
  ) as any[]

  return ok({ message: 'Book created', id: (result as any).insertId }, 201)
}
