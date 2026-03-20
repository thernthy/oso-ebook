import { NextRequest }              from 'next/server'
import pool                         from '@/lib/db'
import { ok, err, requirePermission } from '@/lib/api-helpers'

// ─── GET /api/admin/settings ──────────────────────────────────
export async function GET() {
  const { response } = await requirePermission('manage:platform')
  if (response) return response

  const [rows] = await pool.execute(
    'SELECT setting_key, value FROM platform_settings ORDER BY setting_key'
  ) as any[]

  const settings = Object.fromEntries(
    (rows as any[]).map((r: any) => [r.setting_key, r.value])
  )

  // Mask secrets
  if (settings['storage_s3_secret']) settings['storage_s3_secret'] = '••••••••'

  return ok({ settings })
}

// ─── PATCH /api/admin/settings ────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { session, response } = await requirePermission('manage:platform')
  if (response) return response

  const body = await req.json()

  // Whitelist of editable keys
  const allowed = [
    'storage_provider', 'storage_local_dir',
    'storage_s3_bucket', 'storage_s3_region',
    'storage_s3_key', 'storage_s3_secret', 'storage_s3_endpoint',
    'max_upload_mb', 'allowed_formats',
    'cover_width', 'cover_height',
    'cover_thumb_width', 'cover_thumb_height',
    'cover_formats', 'cover_max_mb',
    'revenue_author_pct', 'revenue_partner_pct', 'revenue_platform_pct',
  ]

  // Validate revenue split adds to 100
  const authorPct  = parseFloat(body.revenue_author_pct)
  const partnerPct = parseFloat(body.revenue_partner_pct)
  const platformPct= parseFloat(body.revenue_platform_pct)
  if (!isNaN(authorPct) && !isNaN(partnerPct) && !isNaN(platformPct)) {
    if (authorPct + partnerPct + platformPct !== 100) {
      return err('Revenue split percentages must add up to 100')
    }
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    for (const key of allowed) {
      if (key in body && body[key] !== '••••••••') {
        await conn.execute(
          `INSERT INTO platform_settings (setting_key, value, updated_by)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)`,
          [key, String(body[key]), session!.user.id]
        )
      }
    }
    await conn.commit()
    return ok({ message: 'Settings updated' })
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}
