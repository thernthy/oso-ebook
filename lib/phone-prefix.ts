import pool from '@/lib/db'

const globalForPrefix = global as unknown as { phonePrefix: string | null }

export async function getPhonePrefix(): Promise<string> {
  if (globalForPrefix.phonePrefix) {
    return globalForPrefix.phonePrefix
  }

  try {
    const [rows] = await pool.execute(
      "SELECT value FROM platform_settings WHERE setting_key = 'phone_prefix' LIMIT 1"
    ) as any[]

    const prefix = (rows[0]?.value as string) || '+855'
    
    if (process.env.NODE_ENV !== 'production') {
      globalForPrefix.phonePrefix = prefix
    }
    
    return prefix
  } catch {
    return '+855'
  }
}
