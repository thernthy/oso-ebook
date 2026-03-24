import pool from '@/lib/db'
import SettingsForm from '@/components/oso/SettingsForm'

export default async function SettingsPage() {
  const [rows] = await pool.execute(
    'SELECT setting_key, value FROM platform_settings ORDER BY setting_key'
  ) as any[]

  const settings = Object.fromEntries(
    (rows as any[]).map((r: any) => [r.setting_key, r.value])
  )
  // Mask secret
  if (settings['storage_s3_secret']) settings['storage_s3_secret'] = ''

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:20, fontWeight:800, color:'#f0efe8', letterSpacing:'-0.4px' }}>Platform Settings</div>
        <div style={{ fontSize:12, color:'#6b6b78', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
          Configure storage provider, upload limits, revenue split, and reader registration
        </div>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  )
}
