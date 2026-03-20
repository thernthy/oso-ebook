import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { ok, err, requirePermission, parsePagination } from '@/lib/api-helpers'

// ─── GET /api/users ───────────────────────────────────────────
// OSO only. Supports ?role=, ?status=, ?page=, ?limit=, ?search=
export async function GET(req: NextRequest) {
  const { session, response } = await requirePermission('manage:users')
  if (response) return response

  const url    = new URL(req.url)
  const role   = url.searchParams.get('role')   || ''
  const status = url.searchParams.get('status') || ''
  const search = url.searchParams.get('search') || ''
  const { limit, offset } = parsePagination(url)

  // Build dynamic WHERE clause
  const conditions: string[] = []
  const params: unknown[]    = []

  if (role)   { conditions.push('role = ?');   params.push(role) }
  if (status) { conditions.push('status = ?'); params.push(status) }
  if (search) {
    conditions.push('(name LIKE ? OR email LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await pool.execute(
    `SELECT id, name, email, role, status, partner_id, created_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  ) as any[]

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) as total FROM users ${where}`,
    params
  ) as any[]

  return ok({ users: rows, total, limit, offset })
}

// ─── POST /api/users ──────────────────────────────────────────
// OSO only — create any user type directly
export async function POST(req: NextRequest) {
  const { response } = await requirePermission('manage:users')
  if (response) return response

  const body = await req.json()
  const { name, email, password, role, partner_id, status = 'active' } = body

  // Validate required fields
  if (!name || !email || !password || !role) {
    return err('name, email, password, and role are required')
  }
  const validRoles = ['oso', 'partner', 'author', 'reader']
  if (!validRoles.includes(role)) {
    return err(`role must be one of: ${validRoles.join(', ')}`)
  }

  // Check duplicate email
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ?', [email]
  ) as any[]
  if ((existing as any[]).length > 0) {
    return err('Email already in use', 409)
  }

  // Hash password
  const hashed = await bcrypt.hash(password, 12)

  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password, role, partner_id, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, hashed, role, partner_id || null, status]
  ) as any[]

  return ok({ message: 'User created', id: result.insertId }, 201)
}
