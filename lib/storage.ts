/**
 * lib/storage.ts
 * Storage abstraction — reads provider config from platform_settings at runtime.
 * OSO can switch local ↔ S3 via the admin panel without code changes.
 */
import fs   from 'fs/promises'
import path from 'path'
import pool from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────
export interface StorageFile {
  buffer:       Buffer
  originalName: string
  mimeType:     string
  size:         number
}

export interface UploadResult {
  storageKey: string   // local path or S3 object key
  provider:   'local' | 's3'
}

// ─── Load settings from DB ────────────────────────────────────
async function getSettings(): Promise<Record<string, string>> {
  const [rows] = await pool.execute(
    'SELECT setting_key, value FROM platform_settings'
  ) as any[]
  return Object.fromEntries((rows as any[]).map((r: any) => [r.setting_key, r.value]))
}

// ─── Upload ───────────────────────────────────────────────────
export async function uploadFile(file: StorageFile, subDir = 'books'): Promise<UploadResult> {
  const settings = await getSettings()
  const provider = settings['storage_provider'] as 'local' | 's3'

  const ext      = path.extname(file.originalName).toLowerCase()
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

  if (provider === 's3') {
    return uploadToS3(file, safeName, subDir, settings)
  }

  return uploadToLocal(file, safeName, subDir, settings)
}

// ─── Local ────────────────────────────────────────────────────
async function uploadToLocal(
  file:     StorageFile,
  safeName: string,
  subDir:   string,
  settings: Record<string, string>
): Promise<UploadResult> {
  const baseDir    = settings['storage_local_dir'] || 'uploads/books'
  const uploadDir  = path.join(process.cwd(), baseDir, subDir)
  const storageKey = path.join(subDir, safeName)

  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(path.join(process.cwd(), baseDir, storageKey), file.buffer)

  return { storageKey, provider: 'local' }
}

// ─── S3 ───────────────────────────────────────────────────────
async function uploadToS3(
  file:     StorageFile,
  safeName: string,
  subDir:   string,
  settings: Record<string, string>
): Promise<UploadResult> {
  // Dynamically import AWS SDK — only needed when provider = s3
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')

  const client = new S3Client({
    region:   settings['storage_s3_region'] || 'us-east-1',
    credentials: {
      accessKeyId:     settings['storage_s3_key'],
      secretAccessKey: settings['storage_s3_secret'],
    },
    ...(settings['storage_s3_endpoint']
      ? { endpoint: settings['storage_s3_endpoint'] }
      : {}),
  })

  const storageKey = `${subDir}/${safeName}`

  await client.send(new PutObjectCommand({
    Bucket:      settings['storage_s3_bucket'],
    Key:         storageKey,
    Body:        file.buffer,
    ContentType: file.mimeType,
  }))

  return { storageKey, provider: 's3' }
}

// ─── Delete ───────────────────────────────────────────────────
export async function deleteFile(storageKey: string): Promise<void> {
  const settings = await getSettings()
  const provider = settings['storage_provider'] as 'local' | 's3'

  if (provider === 's3') {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      region:   settings['storage_s3_region'],
      credentials: {
        accessKeyId:     settings['storage_s3_key'],
        secretAccessKey: settings['storage_s3_secret'],
      },
      ...(settings['storage_s3_endpoint'] ? { endpoint: settings['storage_s3_endpoint'] } : {}),
    })
    await client.send(new DeleteObjectCommand({
      Bucket: settings['storage_s3_bucket'],
      Key:    storageKey,
    }))
    return
  }

  // Local
  const baseDir = settings['storage_local_dir'] || 'uploads/books'
  const fullPath = path.join(process.cwd(), baseDir, storageKey)
  await fs.unlink(fullPath).catch(() => {}) // ignore if already gone
}

// ─── Get readable stream / buffer for parsing ─────────────────
export async function readFile(storageKey: string): Promise<Buffer> {
  const settings = await getSettings()
  const provider = settings['storage_provider'] as 'local' | 's3'

  if (provider === 's3') {
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      region: settings['storage_s3_region'],
      credentials: {
        accessKeyId:     settings['storage_s3_key'],
        secretAccessKey: settings['storage_s3_secret'],
      },
      ...(settings['storage_s3_endpoint'] ? { endpoint: settings['storage_s3_endpoint'] } : {}),
    })
    const res    = await client.send(new GetObjectCommand({
      Bucket: settings['storage_s3_bucket'],
      Key:    storageKey,
    }))
    const chunks: Uint8Array[] = []
    for await (const chunk of res.Body as any) chunks.push(chunk)
    return Buffer.concat(chunks)
  }

  const baseDir = settings['storage_local_dir'] || 'uploads/books'
  return fs.readFile(path.join(process.cwd(), baseDir, storageKey))
}
