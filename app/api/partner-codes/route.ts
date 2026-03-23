import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'

// GET /api/partner-codes - Get partner's own code
export async function GET() {
  const { session, response } = await requireAuth()
  if (response) return response

  try {
    const partnerId = session!.user.id

    const [codes] = await pool.execute(
      `SELECT id, code, is_active, created_at 
       FROM partner_codes 
       WHERE partner_id = ?`,
      [partnerId]
    ) as any[]

    return ok({ codes })
  } catch (error) {
    console.error('Partner codes error:', error)
    return err('Failed to fetch partner codes')
  }
}

// POST /api/partner-codes - Create new partner code
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner' && session!.user.role !== 'oso') {
    return err('Only partners can create codes', 403)
  }

  try {
    const body = await req.json()
    const partnerId = session!.user.id
    const code = body.code || `PART-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    const [result] = await pool.execute(
      `INSERT INTO partner_codes (partner_id, code) VALUES (?, ?)`,
      [partnerId, code]
    ) as any[]

    return ok({ id: result.insertId, code }, 201)
  } catch (error) {
    console.error('Create partner code error:', error)
    return err('Failed to create partner code')
  }
}
