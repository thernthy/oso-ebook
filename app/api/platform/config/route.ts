import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  try {
    let rows: any[]
    if (key) {
      const [result] = await pool.execute(
        'SELECT value FROM platform_settings WHERE setting_key = ?',
        [key]
      ) as any[]
      rows = result
    } else {
      const [result] = await pool.execute(
        "SELECT setting_key, value FROM platform_settings WHERE setting_key IN ('phone_prefix')"
      ) as any[]
      rows = result
    }

    const settings = Object.fromEntries(
      (rows as any[]).map((r: any) => [r.setting_key, r.value])
    )

    return NextResponse.json({ success: true, settings })
  } catch {
    return NextResponse.json(
      { success: false, settings: { phone_prefix: '+855' } }
    )
  }
}
