import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'
import { RowDataPacket } from 'mysql2'

// GET /api/partners/authors - Get all authors under this partner
export async function GET() {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner') {
    return err('Only partners can access this', 403)
  }

  try {
    const partnerId = session!.user.id

    // Get all authors with their relationship status
    const [authors] = await pool.execute(
      `SELECT 
        u.id as author_id,
        u.name as author_name,
        u.email as author_email,
        u.created_at as joined_at,
        apr.id as relation_id,
        apr.status,
        apr.termination_reason,
        apr.terminated_at,
        apr.started_at,
        COUNT(DISTINCT b.id) as total_books,
        COUNT(DISTINCT CASE WHEN b.status = 'published' THEN b.id END) as published_books,
        COALESCE(AVG(ar.overall_rating), 0) as partner_rating,
        COUNT(DISTINCT ar.id) as review_count
       FROM author_partner_relations apr
       JOIN users u ON apr.author_id = u.id
       LEFT JOIN books b ON b.author_id = u.id
       LEFT JOIN author_reviews ar ON ar.author_id = u.id AND ar.partner_id = ?
       WHERE apr.partner_id = ?
       GROUP BY u.id, apr.id
       ORDER BY apr.status = 'active' DESC, apr.created_at DESC`,
      [partnerId, partnerId]
    ) as any[]

    return ok({ authors })
  } catch (error) {
    console.error('Partner authors error:', error)
    return err('Failed to fetch authors')
  }
}
