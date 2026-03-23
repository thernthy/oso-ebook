import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { ok, err, requirePermission } from '@/lib/api-helpers'

async function tableExists(): Promise<boolean> {
  try {
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as cnt FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'logs'
    `) as any[]
    return (rows as any[])[0]?.cnt > 0
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const { response } = await requirePermission('manage:partners')
  if (response) return response

  const url     = new URL(req.url)
  const level   = url.searchParams.get('level') || ''
  const search  = url.searchParams.get('search') || ''
  const page    = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit   = 50
  const offset  = (page - 1) * limit

  try {
    const exists = await tableExists()
    if (!exists) return ok({ logs: [], total: 0, page, limit })

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (level)  { conditions.push('level = ?'); params.push(level) }
    if (search) { conditions.push('(message LIKE ? OR context LIKE ?)'); params.push(`%${search}%`, `%${search}%`) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows] = await pool.execute(
      `SELECT * FROM logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as any[]

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM logs ${where}`, params
    ) as any[]

    return ok({ logs: rows, total, page, limit })
  } catch {
    return ok({ logs: [], total: 0, page, limit })
  }
}

export async function DELETE(req: NextRequest) {
  const { response } = await requirePermission('manage:partners')
  if (response) return response

  const url     = new URL(req.url)
  const days    = parseInt(url.searchParams.get('days') || '30')

  try {
    const [result] = await pool.execute('DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [days]) as any[]
    return ok({ message: `Deleted ${(result as any).affectedRows} logs older than ${days} days` })
  } catch {
    return ok({ message: 'No logs to delete' })
  }
}
