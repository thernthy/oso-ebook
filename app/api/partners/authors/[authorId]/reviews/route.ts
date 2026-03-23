import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'

// POST /api/partners/authors/[authorId]/reviews - Create review for author
export async function POST(
  req: NextRequest,
  { params }: { params: { authorId: string } }
) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner') {
    return err('Only partners can create reviews', 403)
  }

  try {
    const partnerId = session!.user.id
    const authorId = params.authorId
    const body = await req.json()

    const {
      communication_rating,
      quality_rating,
      reliability_rating,
      professionalism_rating,
      review_title,
      review_text
    } = body

    // Verify the author is under this partner
    const [relations] = await pool.execute(
      `SELECT id FROM author_partner_relations 
       WHERE author_id = ? AND partner_id = ?`,
      [authorId, partnerId]
    ) as any[]

    if (!relations.length) {
      return err('Author not found under your partnership', 404)
    }

    const relationId = relations[0].id

    // Calculate overall rating
    const ratings = [communication_rating, quality_rating, reliability_rating, professionalism_rating]
      .filter(r => r)
    const overall_rating = ratings.length 
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : 0

    // Insert review
    const [result] = await pool.execute(
      `INSERT INTO author_reviews 
       (relation_id, author_id, partner_id, communication_rating, quality_rating, 
        reliability_rating, professionalism_rating, overall_rating, review_title, review_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [relationId, authorId, partnerId, communication_rating, quality_rating,
       reliability_rating, professionalism_rating, overall_rating, review_title, review_text]
    ) as any[]

    return ok({ id: result.insertId, message: 'Review created successfully' }, 201)
  } catch (error) {
    console.error('Create author review error:', error)
    return err('Failed to create review')
  }
}

// GET /api/partners/authors/[authorId]/reviews - Get reviews for author from this partner
export async function GET(
  req: NextRequest,
  { params }: { params: { authorId: string } }
) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner') {
    return err('Only partners can view reviews', 403)
  }

  try {
    const partnerId = session!.user.id
    const authorId = params.authorId

    const [reviews] = await pool.execute(
      `SELECT ar.*, u.name as partner_name
       FROM author_reviews ar
       JOIN users u ON ar.partner_id = u.id
       WHERE ar.author_id = ? AND ar.partner_id = ?
       ORDER BY ar.created_at DESC`,
      [authorId, partnerId]
    ) as any[]

    return ok({ reviews })
  } catch (error) {
    console.error('Get author reviews error:', error)
    return err('Failed to fetch reviews')
  }
}
