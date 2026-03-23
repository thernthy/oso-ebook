import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'

// GET /api/authors/reviews - Get all reviews for this author from partners
export async function GET() {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'author') {
    return err('Only authors can access their reviews', 403)
  }

  try {
    const authorId = session!.user.id

    const [reviews] = await pool.execute(
      `SELECT 
        ar.id,
        ar.communication_rating,
        ar.quality_rating,
        ar.reliability_rating,
        ar.professionalism_rating,
        ar.overall_rating,
        ar.review_title,
        ar.review_text,
        ar.author_response,
        ar.author_responded_at,
        ar.created_at,
        u.name as partner_name,
        u.email as partner_email,
        apr.status as relationship_status,
        apr.termination_reason
       FROM author_reviews ar
       JOIN users u ON ar.partner_id = u.id
       JOIN author_partner_relations apr ON apr.id = ar.relation_id
       WHERE ar.author_id = ?
       ORDER BY ar.created_at DESC`,
      [authorId]
    ) as any[]

    // Calculate average ratings
    const avgRatings = {
      communication: 0,
      quality: 0,
      reliability: 0,
      professionalism: 0,
      overall: 0
    }

    if (reviews.length > 0) {
      avgRatings.communication = reviews.reduce((sum: number, r: any) => sum + (r.communication_rating || 0), 0) / reviews.length
      avgRatings.quality = reviews.reduce((sum: number, r: any) => sum + (r.quality_rating || 0), 0) / reviews.length
      avgRatings.reliability = reviews.reduce((sum: number, r: any) => sum + (r.reliability_rating || 0), 0) / reviews.length
      avgRatings.professionalism = reviews.reduce((sum: number, r: any) => sum + (r.professionalism_rating || 0), 0) / reviews.length
      avgRatings.overall = reviews.reduce((sum: number, r: any) => sum + (parseFloat(r.overall_rating) || 0), 0) / reviews.length
    }

    return ok({ reviews, averages: avgRatings })
  } catch (error) {
    console.error('Get author reviews error:', error)
    return err('Failed to fetch reviews')
  }
}

// POST /api/authors/reviews/[reviewId]/respond - Author responds to a review
export async function POST(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'author') {
    return err('Only authors can respond to reviews', 403)
  }

  try {
    const authorId = session!.user.id
    const reviewId = params.reviewId
    const body = await req.json()
    const { response_text } = body

    // Verify the review belongs to this author
    const [reviews] = await pool.execute(
      `SELECT id FROM author_reviews WHERE id = ? AND author_id = ?`,
      [reviewId, authorId]
    ) as any[]

    if (!reviews.length) {
      return err('Review not found', 404)
    }

    await pool.execute(
      `UPDATE author_reviews 
       SET author_response = ?, author_responded_at = NOW()
       WHERE id = ?`,
      [response_text, reviewId]
    )

    return ok({ message: 'Response submitted successfully' })
  } catch (error) {
    console.error('Respond to review error:', error)
    return err('Failed to submit response')
  }
}
