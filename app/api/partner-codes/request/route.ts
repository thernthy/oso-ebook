import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'

// POST /api/partner-codes/request - Author requests partnership using partner code
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'author') {
    return err('Only authors can request partnerships', 403)
  }

  try {
    const authorId = session!.user.id
    const body = await req.json()
    const { partner_code } = body

    if (!partner_code) {
      return err('Partner code is required', 400)
    }

    // Find partner by code
    const [partners] = await pool.execute(
      `SELECT pc.partner_id, u.name as partner_name, pc.is_active
       FROM partner_codes pc
       JOIN users u ON u.id = pc.partner_id
       WHERE pc.code = ?`,
      [partner_code]
    ) as any[]

    if (!partners.length || !partners[0].is_active) {
      return err('Invalid or inactive partner code', 400)
    }

    const partnerId = partners[0].partner_id
    const partnerName = partners[0].partner_name

    // Check if already in a partnership
    const [existing] = await pool.execute(
      `SELECT id, status FROM author_partner_relations 
       WHERE author_id = ? AND partner_id = ?`,
      [authorId, partnerId]
    ) as any[]

    if (existing.length) {
      if (existing[0].status === 'active') {
        return err('You are already partnered with this partner', 400)
      }
      if (existing[0].status === 'paused') {
        // Resume the partnership
        await pool.execute(
          `UPDATE author_partner_relations 
           SET status = 'active' 
           WHERE id = ?`,
          [existing[0].id]
        )
        return ok({ message: 'Partnership resumed successfully', partner_name: partnerName })
      }
      if (existing[0].status === 'terminated') {
        return err('This partnership was terminated. Please contact the partner.', 400)
      }
    }

    // Create new partnership
    const [result] = await pool.execute(
      `INSERT INTO author_partner_relations (author_id, partner_id, status) 
       VALUES (?, ?, 'active')`,
      [authorId, partnerId]
    ) as any[]

    return ok({ 
      message: 'Partnership request accepted', 
      partner_name: partnerName,
      relation_id: result.insertId 
    }, 201)
  } catch (error) {
    console.error('Partner code request error:', error)
    return err('Failed to process partnership request')
  }
}
