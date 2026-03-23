import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { requireAuth, ok, err } from '@/lib/api-helpers'

// Available permissions for partners to assign
const AVAILABLE_PERMISSIONS = [
  'upload_books',
  'edit_own_books',
  'delete_own_books',
  'manage_chapters',
  'view_own_earnings',
  'submit_for_review',
  'invite_co_authors',
  'manage_promo_codes',
  'view_reader_stats',
  'access_analytics',
  'export_data',
  'bulk_upload',
]

// GET /api/partner/roles - Get partner's custom roles
export async function GET() {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner' && session!.user.role !== 'oso') {
    return err('Only partners can access roles', 403)
  }

  const partnerId = session!.user.id

  try {
    const [roles] = await pool.execute(
      `SELECT pr.*, 
              COUNT(ara.id) as assigned_count
       FROM partner_roles pr
       LEFT JOIN author_role_assignments ara ON ara.role_id = pr.id
       WHERE pr.partner_id = ?
       GROUP BY pr.id
       ORDER BY pr.created_at DESC`,
      [partnerId]
    ) as any[]

    return ok({ roles, available_permissions: AVAILABLE_PERMISSIONS })
  } catch (error) {
    console.error('Get roles error:', error)
    return err('Failed to fetch roles')
  }
}

// POST /api/partner/roles - Create a new custom role
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner' && session!.user.role !== 'oso') {
    return err('Only partners can create roles', 403)
  }

  try {
    const body = await req.json()
    const { name, description, color, permissions } = body
    const partnerId = session!.user.id

    if (!name || name.trim().length < 2) {
      return err('Role name must be at least 2 characters')
    }

    // Validate permissions
    const validPermissions = (permissions || []).filter((p: string) => 
      AVAILABLE_PERMISSIONS.includes(p)
    )

    const [result] = await pool.execute(
      `INSERT INTO partner_roles (partner_id, name, description, color, permissions) 
       VALUES (?, ?, ?, ?, ?)`,
      [partnerId, name.trim(), description || null, color || '#9d7df5', JSON.stringify(validPermissions)]
    ) as any[]

    return ok({ id: result.insertId, name, description, color, permissions: validPermissions }, 201)
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return err('A role with this name already exists')
    }
    console.error('Create role error:', error)
    return err('Failed to create role')
  }
}

// PATCH /api/partner/roles - Update a role
export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner' && session!.user.role !== 'oso') {
    return err('Only partners can update roles', 403)
  }

  try {
    const body = await req.json()
    const { role_id, name, description, color, permissions, is_active } = body
    const partnerId = session!.user.id

    if (!role_id) return err('role_id is required')

    // Verify ownership
    const [existing] = await pool.execute(
      'SELECT id FROM partner_roles WHERE id = ? AND partner_id = ?',
      [role_id, partnerId]
    ) as any[]

    if (!existing.length) return err('Role not found', 404)

    const updates: string[] = []
    const params: any[] = []

    if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()) }
    if (description !== undefined) { updates.push('description = ?'); params.push(description) }
    if (color !== undefined) { updates.push('color = ?'); params.push(color) }
    if (permissions !== undefined) {
      const validPermissions = (permissions || []).filter((p: string) => 
        AVAILABLE_PERMISSIONS.includes(p)
      )
      updates.push('permissions = ?')
      params.push(JSON.stringify(validPermissions))
    }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active) }

    if (updates.length === 0) return err('No fields to update')

    params.push(role_id)
    await pool.execute(
      `UPDATE partner_roles SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    return ok({ message: 'Role updated' })
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return err('A role with this name already exists')
    }
    console.error('Update role error:', error)
    return err('Failed to update role')
  }
}

// DELETE /api/partner/roles - Delete a role
export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  if (session!.user.role !== 'partner' && session!.user.role !== 'oso') {
    return err('Only partners can delete roles', 403)
  }

  const url = new URL(req.url)
  const roleId = url.searchParams.get('role_id')

  if (!roleId) return err('role_id is required')

  try {
    const partnerId = session!.user.id

    // Verify ownership
    const [existing] = await pool.execute(
      'SELECT id FROM partner_roles WHERE id = ? AND partner_id = ?',
      [roleId, partnerId]
    ) as any[]

    if (!existing.length) return err('Role not found', 404)

    await pool.execute('DELETE FROM partner_roles WHERE id = ?', [roleId])

    return ok({ message: 'Role deleted' })
  } catch (error) {
    console.error('Delete role error:', error)
    return err('Failed to delete role')
  }
}
