import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'

// GET /api/partner/authors/roles - Get author's roles from partner
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner' && session!.user.role !== 'oso') {
    return err('Only partners can access this', 403)
  }

  const url = new URL(req.url)
  const authorId = url.searchParams.get('author_id')
  const partnerId = session!.user.id

  try {
    if (authorId) {
      // Get roles for specific author
      const [rows] = await pool.execute(
        `SELECT ara.*, pr.name as role_name, pr.color, pr.permissions
         FROM author_role_assignments ara
         JOIN partner_roles pr ON pr.id = ara.role_id
         WHERE ara.author_id = ? AND pr.partner_id = ?`,
        [authorId, partnerId]
      ) as any[]

      return ok({ assignments: rows })
    } else {
      // Get all author-role assignments for this partner
      const [rows] = await pool.execute(
        `SELECT ara.*, u.name as author_name, u.email as author_email,
                pr.name as role_name, pr.color, pr.permissions
         FROM author_role_assignments ara
         JOIN partner_roles pr ON pr.id = ara.role_id
         JOIN users u ON u.id = ara.author_id
         WHERE pr.partner_id = ?
         ORDER BY ara.created_at DESC`,
        [partnerId]
      ) as any[]

      return ok({ assignments: rows })
    }
  } catch (error) {
    console.error('Get author roles error:', error)
    return err('Failed to fetch author roles')
  }
}

// POST /api/partner/authors/roles - Assign role to author
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner' && session!.user.role !== 'oso') {
    return err('Only partners can assign roles', 403)
  }

  try {
    const body = await req.json()
    const { author_id, role_id } = body
    const partnerId = session!.user.id

    if (!author_id || !role_id) {
      return err('author_id and role_id are required')
    }

    // Verify role belongs to this partner
    const [roleCheck] = await pool.execute(
      'SELECT id FROM partner_roles WHERE id = ? AND partner_id = ? AND is_active = TRUE',
      [role_id, partnerId]
    ) as any[]

    if (!roleCheck.length) return err('Invalid role or role does not belong to you', 404)

    // Verify author belongs to this partner
    const [authorCheck] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND partner_id = ?',
      [author_id, partnerId]
    ) as any[]

    if (!authorCheck.length) return err('Author not found or does not belong to you', 404)

    await pool.execute(
      `INSERT INTO author_role_assignments (author_id, role_id, assigned_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), assigned_by = VALUES(assigned_by)`,
      [author_id, role_id, partnerId]
    )

    return ok({ message: 'Role assigned to author' }, 201)
  } catch (error) {
    console.error('Assign role error:', error)
    return err('Failed to assign role')
  }
}

// DELETE /api/partner/authors/roles - Remove role from author
export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner' && session!.user.role !== 'oso') {
    return err('Only partners can remove roles', 403)
  }

  const url = new URL(req.url)
  const assignmentId = url.searchParams.get('assignment_id')

  if (!assignmentId) return err('assignment_id is required')

  try {
    const partnerId = session!.user.id

    // Verify ownership through role
    const [check] = await pool.execute(
      `SELECT ara.id FROM author_role_assignments ara
       JOIN partner_roles pr ON pr.id = ara.role_id
       WHERE ara.id = ? AND pr.partner_id = ?`,
      [assignmentId, partnerId]
    ) as any[]

    if (!check.length) return err('Assignment not found', 404)

    await pool.execute('DELETE FROM author_role_assignments WHERE id = ?', [assignmentId])

    return ok({ message: 'Role removed from author' })
  } catch (error) {
    console.error('Remove role error:', error)
    return err('Failed to remove role')
  }
}
