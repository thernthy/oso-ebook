import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// Public catalog - no auth required
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const category = url.searchParams.get('category') || ''
  const search = url.searchParams.get('search') || ''
  const sort = url.searchParams.get('sort') || 'newest'
  const free = url.searchParams.get('free') || ''
  const featured = url.searchParams.get('featured') || ''
  const limit = parseInt(url.searchParams.get('limit') || '12')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  try {
    const conditions = ["b.status = 'published'"]
    const params: any[] = []

    if (category) { conditions.push('b.category = ?'); params.push(category) }
    if (search) { 
      conditions.push('(b.title LIKE ? OR b.description LIKE ? OR u.name LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (free) { conditions.push('b.is_free = 1') }
    if (featured) { conditions.push('b.is_featured = 1') }

    const orderMap: Record<string, string> = {
      newest: 'b.created_at DESC',
      popular: 'b.total_reads DESC',
      price_asc: 'b.price ASC',
      price_desc: 'b.price DESC',
      rating: 'avg_rating DESC',
    }
    const orderBy = orderMap[sort] || orderMap.newest

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [books] = await pool.execute(
      `SELECT
         b.id, b.title, b.description, b.cover_url, b.price, b.is_free,
         b.is_featured, b.category, b.total_reads, b.created_at,
         u.name AS author_name,
         COUNT(DISTINCT c.id) AS chapter_count,
         COALESCE(AVG(r.rating), 0) AS avg_rating,
         COUNT(DISTINCT r.id) AS review_count
       FROM books b
       JOIN users u ON b.author_id = u.id
       LEFT JOIN chapters c ON c.book_id = b.id AND c.is_published = 1
       LEFT JOIN reviews r ON r.book_id = b.id
       ${where}
       GROUP BY b.id
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as any[]

    // Get categories
    const [categories] = await pool.execute(
      `SELECT category, COUNT(*) AS count FROM books
       WHERE status='published' AND category IS NOT NULL
       GROUP BY category ORDER BY count DESC`
    ) as any[]

    return NextResponse.json({ books, categories, limit, offset })
  } catch (error) {
    console.error('Public catalog error:', error)
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 })
  }
}
