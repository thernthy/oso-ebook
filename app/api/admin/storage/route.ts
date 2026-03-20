import { NextRequest }              from 'next/server'
import pool                         from '@/lib/db'
import { ok, err, requirePermission } from '@/lib/api-helpers'

// ─── GET /api/admin/storage ───────────────────────────────────
// OSO views current storage configuration
export async function GET() {
  const { response } = await requirePermission('manage:platform')
  if (response) return response

  const [rows] = await pool.execute(
    `SELECT setting_key, value FROM platform_settings
     WHERE setting_key LIKE 'storage%' OR setting_key IN ('max_upload_mb','allowed_formats')`
  ) as any[]

  const settings = Object.fromEntries(
    (rows as any[]).map((r: any) => [r.setting_key, r.value])
  )

  // Mask S3 secret key
  if (settings['storage_s3_secret']) {
    settings['storage_s3_secret'] = '••••••••'
  }

  return ok({ settings })
}

// ─── PATCH /api/admin/storage ─────────────────────────────────
// OSO switches storage provider or updates config
export async function PATCH(req: NextRequest) {
  const { session, response } = await requirePermission('manage:platform')
  if (response) return response

  const body = await req.json()

  const allowedKeys = [
    'storage_provider',
    'storage_local_dir',
    'storage_s3_bucket',
    'storage_s3_region',
    'storage_s3_key',
    'storage_s3_secret',
    'storage_s3_endpoint',
    'max_upload_mb',
    'allowed_formats',
  ]

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    for (const key of allowedKeys) {
      if (key in body) {
        await conn.execute(
          `UPDATE platform_settings SET value = ?, updated_by = ? WHERE setting_key = ?`,
          [String(body[key]), session!.user.id, key]
        )
      }
    }

    // Validate provider value
    if (body.storage_provider && !['local', 's3'].includes(body.storage_provider)) {
      await conn.rollback()
      return err('storage_provider must be "local" or "s3"')
    }

    await conn.commit()
    return ok({ message: 'Storage settings updated' })
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}
