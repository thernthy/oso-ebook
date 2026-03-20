import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { ok, err, requirePermission } from '@/lib/api-helpers'

// ─── GET /api/partners/applications ──────────────────────────
// OSO only — list pending partner applications
export async function GET(req: NextRequest) {
  const { response } = await requirePermission('manage:partners')
  if (response) return response

  const url    = new URL(req.url)
  const status = url.searchParams.get('status') || 'pending'

  const [rows] = await pool.execute(
    `SELECT pa.*, u.name AS reviewed_by_name
     FROM partner_applications pa
     LEFT JOIN users u ON pa.reviewed_by = u.id
     WHERE pa.status = ?
     ORDER BY pa.created_at DESC`,
    [status]
  ) as any[]

  return ok({ applications: rows })
}

// ─── PATCH /api/partners/applications ────────────────────────
// OSO only — approve or reject an application
// On approve: creates the user account and marks application approved
export async function PATCH(req: NextRequest) {
  const { session, response } = await requirePermission('manage:partners')
  if (response) return response

  const body = await req.json()
  const { application_id, action, temp_password } = body

  if (!application_id || !action) {
    return err('application_id and action are required')
  }
  if (!['approve', 'reject'].includes(action)) {
    return err('action must be approve or reject')
  }

  // Fetch the application
  const [rows] = await pool.execute(
    'SELECT * FROM partner_applications WHERE id = ? AND status = ? LIMIT 1',
    [application_id, 'pending']
  ) as any[]
  const app = (rows as any[])[0]
  if (!app) return err('Application not found or already processed', 404)

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    if (action === 'approve') {
      if (!temp_password) return err('temp_password required for approval')

      // Create the partner user account
      const hashed = await bcrypt.hash(temp_password, 12)
      await conn.execute(
        `INSERT INTO users (name, email, password, role, status)
         VALUES (?, ?, ?, 'partner', 'active')`,
        [app.name, app.email, hashed]
      )
    }

    // Update application status
    await conn.execute(
      `UPDATE partner_applications
       SET status = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [action === 'approve' ? 'approved' : 'rejected', session!.user.id, application_id]
    )

    await conn.commit()
    return ok({
      message: action === 'approve'
        ? `Partner account created for ${app.email}`
        : `Application rejected`,
    })
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}
