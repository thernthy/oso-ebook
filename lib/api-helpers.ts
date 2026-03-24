import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { can, Role } from '@/lib/permissions'

// ─── Standard JSON responses ──────────────────────────────────
export const ok = (data: unknown, status = 200) =>
  NextResponse.json({ success: true, data }, { status })

export const err = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status })

// ─── Auth guard ───────────────────────────────────────────────
/**
 * Get the current session or return a 401 response.
 * Usage:
 *   const { session, response } = await requireAuth()
 *   if (response) return response
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { session: null, response: err('Unauthorized', 401) }
  }
  return { session, response: null }
}

/**
 * Get session AND verify the user has a specific permission.
 * Usage:
 *   const { session, response } = await requirePermission('approve:books')
 *   if (response) return response
 */
export async function requirePermission(permission: string) {
  const { session, response } = await requireAuth()
  if (response) return { session: null, response }

  if (!can(session!.user.role as Role, permission)) {
    return { session: null, response: err('Forbidden', 403) }
  }
  return { session, response: null }
}

// ─── Pagination helper ────────────────────────────────────────
export function parsePagination(url: URL) {
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  || '1'))
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '20'))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}
