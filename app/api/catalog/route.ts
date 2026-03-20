import { NextRequest }           from 'next/server'
import pool                      from '@/lib/db'
import { ok, requireAuth, parsePagination } from '@/lib/api-helpers'

// GET /api/catalog — published books with reader-friendly metadata
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const url       = new URL(req.url)
  const category  = url.searchParams.get('category') || ''
  const search    = url.searchParams.get('search')   || ''
  const sort      = url.searchParams.get('sort')     || 'newest' // newest|popular|price_asc|price_desc|rating
  const free      = url.searchParams.get('free')     || ''
  const { limit, offset } = parsePagination(url)
  const userId    = session!.user.id

  const conditions = ["b.status = 'published'"]
  const params: unknown[] = []

  if (category) { conditions.push('b.category = ?'); params.push(category) }
  if (search)   { conditions.push('(b.title LIKE ? OR b.description LIKE ? OR u.name LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`) }
  if (free)     { conditions.push('b.is_free = 1') }

  const orderMap: Record<string, string> = {
    newest:     'b.created_at DESC',
    popular:    'b.total_reads DESC',
    price_asc:  'b.price ASC',
    price_desc: 'b.price DESC',
    rating:     'avg_rating DESC',
  }
  const orderBy = orderMap[sort] || orderMap.newest

  const [books] = await pool.execute(
    `SELECT
       b.id, b.title, b.description, b.cover_url, b.price, b.is_free,
       b.is_featured, b.category, b.total_reads, b.created_at,
       u.name  AS author_name,
       p.name  AS partner_name,
       COUNT(DISTINCT c.id)              AS chapter_count,
       COALESCE(AVG(r.rating), 0)        AS avg_rating,
       COUNT(DISTINCT r.id)              AS review_count,
       MAX(CASE WHEN pu.user_id = ? THEN 1 ELSE 0 END) AS is_owned
     FROM books b
     JOIN users u  ON b.author_id  = u.id
     JOIN users p  ON b.partner_id = p.id
     LEFT JOIN chapters c  ON c.book_id = b.id AND c.is_published = 1
     LEFT JOIN reviews r   ON r.book_id = b.id
     LEFT JOIN purchases pu ON pu.book_id = b.id AND pu.user_id = ?
     WHERE ${conditions.join(' AND ')}
     GROUP BY b.id
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [userId, userId, ...params, limit, offset]
  ) as any[]

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(DISTINCT b.id) AS total FROM books b
     JOIN users u ON b.author_id = u.id
     WHERE ${conditions.join(' AND ')}`, params
  ) as any[]

  // Categories for filter sidebar
  const [categories] = await pool.execute(
    `SELECT category, COUNT(*) AS count FROM books
     WHERE status='published' AND category IS NOT NULL
     GROUP BY category ORDER BY count DESC`
  ) as any[]

  return ok({ books, total, categories, limit, offset })
}
