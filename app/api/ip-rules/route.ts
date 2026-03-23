import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requirePermission } from '@/lib/api-helpers'

async function tableExists(): Promise<boolean> {
  try {
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as cnt FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'ip_rules'
    `) as any[]
    return (rows as any[])[0]?.cnt > 0
  } catch {
    return false
  }
}

// ─── GET /api/ip-rules ───────────────────────────────────────
// OSO only — list all IP rules
export async function GET(req: NextRequest) {
  const { response } = await requirePermission('manage:partners')
  if (response) return response

  const url    = new URL(req.url)
  const search = url.searchParams.get('search') || ''

  try {
    const exists = await tableExists()
    if (!exists) return ok({ rules: [] })

    const [rows] = await pool.execute(
      `SELECT * FROM ip_rules ${search ? 'WHERE ip_address LIKE ?' : ''} ORDER BY created_at DESC`,
      search ? [`%${search}%`] : []
    ) as any[]

    return ok({ rules: rows })
  } catch (e: any) {
    return ok({ rules: [] })
  }
}

// ─── POST /api/ip-rules ─────────────────────────────────────
// OSO only — add a new IP rule
export async function POST(req: NextRequest) {
  const { response } = await requirePermission('manage:partners')
  if (response) return response

  const body = await req.json()
  const { ip_address, action, note } = body

  if (!ip_address || !action) return err('ip_address and action are required')
  if (!['block', 'allow'].includes(action)) return err('action must be block or allow')

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/
  if (!ipRegex.test(ip_address)) return err('Invalid IP address format')

  const exists = await tableExists()
  if (!exists) return err('IP rules table does not exist. Please run the migration.', 500)

  await pool.execute(
    'INSERT INTO ip_rules (ip_address, action, note) VALUES (?, ?, ?)',
    [ip_address, action, note || null]
  )

  return ok({ message: 'IP rule created' }, 201)
}

// ─── DELETE /api/ip-rules ───────────────────────────────────
// OSO only — delete an IP rule
export async function DELETE(req: NextRequest) {
  const { response } = await requirePermission('manage:partners')
  if (response) return response

  const url = new URL(req.url)
  const id  = url.searchParams.get('id')

  if (!id) return err('id is required')

  const [result] = await pool.execute('DELETE FROM ip_rules WHERE id = ?', [id]) as any[]
  if ((result as any).affectedRows === 0) return err('Rule not found', 404)

  return ok({ message: 'IP rule deleted' })
}
