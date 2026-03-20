/**
 * POST /api/books/:id/cover          — upload image, get analysis + crop preview
 * POST /api/books/:id/cover/confirm  — apply crop (or accept as-is) and save
 * DELETE /api/books/:id/cover        — remove cover
 */
import { NextRequest }                  from 'next/server'
import pool                             from '@/lib/db'
import { uploadFile, deleteFile }       from '@/lib/storage'
import { analyseCover, generateCropPreview } from '@/lib/cover-processor'
import { ok, err, requirePermission }   from '@/lib/api-helpers'

type Params = { params: { id: string } }

const ALLOWED_MIME = ['image/jpeg','image/jpg','image/png','image/webp']
const MAX_BYTES    = 10 * 1024 * 1024   // 10 MB

// ─── POST /api/books/:id/cover ────────────────────────────────
// Step 1: Upload image → analyse → return warnings + crop preview
// Does NOT save yet. Returns analysis for author to review in UI.
export async function POST(req: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('upload:books')
  if (response) return response

  // Verify ownership
  const [books] = await pool.execute(
    'SELECT id, status, cover_storage_key FROM books WHERE id=? AND author_id=? LIMIT 1',
    [params.id, session!.user.id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found or access denied', 404)

  const url    = new URL(req.url)
  const action = url.searchParams.get('action')

  // ── action=confirm: apply the previously analysed crop + save ──
  if (action === 'confirm') {
    const body = await req.json()
    const { image_b64, crop, original_name } = body

    if (!image_b64) return err('image_b64 required for confirm action')

    // Decode base64 back to buffer
    const buffer = Buffer.from(image_b64, 'base64')

    // Process: crop (if provided) + resize to standard sizes
    const { processCover } = await import('@/lib/cover-processor')
    const processed = await processCover(buffer, crop || undefined)

    // Delete old covers if they exist
    if (book.cover_storage_key) {
      await deleteFile(book.cover_storage_key).catch(() => {})
    }
    const [oldThumb] = await pool.execute(
      'SELECT cover_thumb_key FROM books WHERE id=? LIMIT 1', [params.id]
    ) as any[]
    const thumbKey = (oldThumb as any[])[0]?.cover_thumb_key
    if (thumbKey) await deleteFile(thumbKey).catch(() => {})

    // Upload full cover
    const fullResult = await uploadFile(
      {
        buffer:       processed.fullBuffer,
        originalName: `cover-${params.id}.jpg`,
        mimeType:     'image/jpeg',
        size:         processed.fullBuffer.length,
      },
      `books/covers/${params.id}`
    )

    // Upload thumbnail
    const thumbResult = await uploadFile(
      {
        buffer:       processed.thumbBuffer,
        originalName: `cover-thumb-${params.id}.jpg`,
        mimeType:     'image/jpeg',
        size:         processed.thumbBuffer.length,
      },
      `books/covers/${params.id}`
    )

    // Derive public URLs
    const coverUrl   = `/uploads/${fullResult.storageKey}`
    const thumbUrl   = `/uploads/${thumbResult.storageKey}`

    // Save to DB
    await pool.execute(
      `UPDATE books SET
         cover_url         = ?,
         cover_thumb_url   = ?,
         cover_width       = ?,
         cover_height      = ?,
         cover_storage_key = ?,
         cover_thumb_key   = ?
       WHERE id = ?`,
      [
        coverUrl, thumbUrl,
        processed.width, processed.height,
        fullResult.storageKey, thumbResult.storageKey,
        params.id,
      ]
    )

    return ok({
      message:       'Cover saved successfully.',
      cover_url:     coverUrl,
      thumb_url:     thumbUrl,
      width:         processed.width,
      height:        processed.height,
      thumb_width:   processed.thumbWidth,
      thumb_height:  processed.thumbHeight,
    })
  }

  // ── Default: receive file → analyse → return preview ──────────
  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  if (!file) return err('No file provided')

  // Validate
  if (!ALLOWED_MIME.includes(file.type)) {
    return err(`Unsupported format. Allowed: JPG, PNG, WebP`)
  }
  if (file.size > MAX_BYTES) {
    return err(`File too large. Max size is ${MAX_BYTES / 1024 / 1024}MB`)
  }

  const buffer   = Buffer.from(await file.arrayBuffer())
  const analysis = await analyseCover(buffer)

  // Generate crop preview (small base64 image for UI)
  const previewB64 = await generateCropPreview(buffer, analysis.suggestedCrop, 240)

  return ok({
    // Pass image back as base64 so client can re-send for confirm
    // (avoids re-uploading the file a second time)
    image_b64:      buffer.toString('base64'),
    original_name:  file.name,
    analysis: {
      original_width:  analysis.originalWidth,
      original_height: analysis.originalHeight,
      original_ratio:  parseFloat(analysis.originalRatio.toFixed(4)),
      target_ratio:    parseFloat(analysis.targetRatio.toFixed(4)),
      ratio_match:     analysis.ratioMatch,
      needs_crop:      analysis.needsCrop,
      warnings:        analysis.warnings,
      suggested_crop:  analysis.suggestedCrop,
      target_width:    analysis.targetWidth,
      target_height:   analysis.targetHeight,
      thumb_width:     analysis.thumbWidth,
      thumb_height:    analysis.thumbHeight,
    },
    preview_b64:    previewB64,   // 240px wide JPEG preview of cropped area
  })
}

// ─── DELETE /api/books/:id/cover ─────────────────────────────
export async function DELETE(_: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission('upload:books')
  if (response) return response

  const [books] = await pool.execute(
    'SELECT cover_storage_key, cover_thumb_key FROM books WHERE id=? AND author_id=? LIMIT 1',
    [params.id, session!.user.id]
  ) as any[]
  const book = (books as any[])[0]
  if (!book) return err('Book not found', 404)

  if (book.cover_storage_key) await deleteFile(book.cover_storage_key).catch(() => {})
  if (book.cover_thumb_key)   await deleteFile(book.cover_thumb_key).catch(() => {})

  await pool.execute(
    `UPDATE books SET
       cover_url=NULL, cover_thumb_url=NULL,
       cover_storage_key=NULL, cover_thumb_key=NULL,
       cover_width=NULL, cover_height=NULL
     WHERE id=?`,
    [params.id]
  )

  return ok({ message: 'Cover removed' })
}
