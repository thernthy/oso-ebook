import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'

// PATCH /api/partners/authors/[authorId] - Update author relationship (pause/stop work)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { authorId: string } }
) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner') {
    return err('Only partners can manage authors', 403)
  }

  try {
    const partnerId = session!.user.id
    const authorId = params.authorId
    const body = await req.json()
    const { action, reason } = body

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

    if (action === 'pause') {
      await pool.execute(
        `UPDATE author_partner_relations 
         SET status = 'paused' 
         WHERE id = ?`,
        [relationId]
      )
      return ok({ message: 'Author partnership paused' })
    }

    if (action === 'resume') {
      await pool.execute(
        `UPDATE author_partner_relations 
         SET status = 'active' 
         WHERE id = ?`,
        [relationId]
      )
      return ok({ message: 'Author partnership resumed' })
    }

    if (action === 'terminate') {
      if (!reason) {
        return err('Termination reason is required', 400)
      }
      await pool.execute(
        `UPDATE author_partner_relations 
         SET status = 'terminated', 
             termination_reason = ?, 
             terminated_by = ?,
             terminated_at = NOW()
         WHERE id = ?`,
        [reason, partnerId, relationId]
      )
      return ok({ message: 'Author partnership terminated' })
    }

    return err('Invalid action')
  } catch (error) {
    console.error('Update author relation error:', error)
    return err('Failed to update author relationship')
  }
}
