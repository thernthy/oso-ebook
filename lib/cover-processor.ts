/**
 * lib/cover-processor.ts
 * Handles all book cover image processing using sharp.
 *
 * Industry standard: 1600×2400px (2:3 ratio) — used by Amazon KDP, Apple Books, Google Play.
 * Thumbnail:          320×480px  (2:3 ratio) — catalog grid, fast loading.
 *
 * Pipeline:
 *  1. Analyse uploaded image → detect dimensions, ratio, quality issues
 *  2. If ratio matches 2:3 → resize to standard sizes
 *  3. If ratio doesn't match → return warning + crop coordinates for preview
 *  4. Author confirms crop → apply crop then resize
 *  5. Store full + thumb via storage abstraction
 */

import sharp from 'sharp'
import pool  from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────
export interface CoverAnalysis {
  originalWidth:   number
  originalHeight:  number
  originalRatio:   number   // width/height
  targetRatio:     number   // 0.667 for 2:3
  ratioMatch:      boolean  // within 2% tolerance
  needsCrop:       boolean
  warnings:        string[]
  suggestedCrop:   CropRect  // center crop to achieve target ratio
  targetWidth:     number
  targetHeight:    number
  thumbWidth:      number
  thumbHeight:     number
}

export interface CropRect {
  left:   number
  top:    number
  width:  number
  height: number
}

export interface ProcessedCover {
  fullBuffer:   Buffer
  thumbBuffer:  Buffer
  width:        number
  height:       number
  thumbWidth:   number
  thumbHeight:  number
  format:       string
}

// ─── Load target dimensions from platform_settings ───────────
async function getCoverSettings() {
  const [rows] = await pool.execute(
    `SELECT setting_key, value FROM platform_settings
     WHERE setting_key IN
       ('cover_width','cover_height','cover_thumb_width','cover_thumb_height','cover_max_mb')`
  ) as any[]

  const cfg = Object.fromEntries((rows as any[]).map((r: any) => [r.setting_key, parseInt(r.value)]))

  return {
    fullWidth:   cfg.cover_width        || 1600,
    fullHeight:  cfg.cover_height       || 2400,
    thumbWidth:  cfg.cover_thumb_width  || 320,
    thumbHeight: cfg.cover_thumb_height || 480,
    maxMb:       cfg.cover_max_mb       || 10,
  }
}

// ─── Step 1: Analyse — no writing, just inspection ───────────
export async function analyseCover(buffer: Buffer): Promise<CoverAnalysis> {
  const settings = await getCoverSettings()
  const meta     = await sharp(buffer).metadata()

  const origW = meta.width  || 0
  const origH = meta.height || 0

  if (!origW || !origH) throw new Error('Could not read image dimensions')

  const origRatio   = origW / origH
  const targetRatio = settings.fullWidth / settings.fullHeight  // 1600/2400 = 0.6667
  const ratioDiff   = Math.abs(origRatio - targetRatio) / targetRatio

  const warnings: string[] = []

  // Quality checks
  if (origW < settings.fullWidth || origH < settings.fullHeight) {
    warnings.push(`Image is smaller than recommended ${settings.fullWidth}×${settings.fullHeight}px. It will be upscaled which may reduce quality.`)
  }
  if (origW < 600 || origH < 900) {
    warnings.push('Image is very small. Consider uploading a higher resolution version.')
  }

  const needsCrop = ratioDiff > 0.02  // more than 2% off target ratio

  if (needsCrop) {
    warnings.push(
      `Your image is ${origW}×${origH}px (ratio ${origRatio.toFixed(3)}). ` +
      `Standard book cover ratio is 2:3 (${targetRatio.toFixed(3)}). ` +
      `A center crop will be applied — preview below.`
    )
  }

  // Calculate center crop to achieve 2:3
  // Crop the minimum area needed to match ratio
  let cropW = origW
  let cropH = origH

  if (origRatio > targetRatio) {
    // Too wide → crop width
    cropW = Math.round(origH * targetRatio)
  } else {
    // Too tall → crop height
    cropH = Math.round(origW / targetRatio)
  }

  const cropLeft = Math.round((origW - cropW) / 2)
  const cropTop  = Math.round((origH - cropH) / 2)

  return {
    originalWidth:  origW,
    originalHeight: origH,
    originalRatio:  origRatio,
    targetRatio,
    ratioMatch:     !needsCrop,
    needsCrop,
    warnings,
    suggestedCrop: { left: cropLeft, top: cropTop, width: cropW, height: cropH },
    targetWidth:   settings.fullWidth,
    targetHeight:  settings.fullHeight,
    thumbWidth:    settings.thumbWidth,
    thumbHeight:   settings.thumbHeight,
  }
}

// ─── Step 2: Process — crop (if needed) + resize to standard ─
export async function processCover(
  buffer:   Buffer,
  cropRect?: CropRect   // if provided, apply this crop first
): Promise<ProcessedCover> {
  const settings = await getCoverSettings()

  let pipeline = sharp(buffer)

  // Apply crop if provided
  if (cropRect) {
    pipeline = pipeline.extract({
      left:   cropRect.left,
      top:    cropRect.top,
      width:  cropRect.width,
      height: cropRect.height,
    })
  } else {
    // Auto center crop to target ratio
    const analysis = await analyseCover(buffer)
    if (analysis.needsCrop) {
      pipeline = pipeline.extract({
        left:   analysis.suggestedCrop.left,
        top:    analysis.suggestedCrop.top,
        width:  analysis.suggestedCrop.width,
        height: analysis.suggestedCrop.height,
      })
    }
  }

  // Full resolution cover
  const fullBuffer = await pipeline
    .clone()
    .resize(settings.fullWidth, settings.fullHeight, {
      fit:      'fill',
      kernel:   sharp.kernel.lanczos3,   // best quality for text
    })
    .jpeg({ quality: 90, progressive: true })
    .toBuffer()

  // Thumbnail
  const thumbBuffer = await pipeline
    .clone()
    .resize(settings.thumbWidth, settings.thumbHeight, {
      fit:    'fill',
      kernel: sharp.kernel.lanczos3,
    })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer()

  return {
    fullBuffer,
    thumbBuffer,
    width:      settings.fullWidth,
    height:     settings.fullHeight,
    thumbWidth: settings.thumbWidth,
    thumbHeight:settings.thumbHeight,
    format:     'jpeg',
  }
}

// ─── Generate crop preview as base64 JPEG ────────────────────
// Returns a small preview image showing what the crop will look like
export async function generateCropPreview(
  buffer:   Buffer,
  cropRect: CropRect,
  previewWidth = 240
): Promise<string> {
  const previewHeight = Math.round(previewWidth / (cropRect.width / cropRect.height))

  const previewBuffer = await sharp(buffer)
    .extract({
      left:   cropRect.left,
      top:    cropRect.top,
      width:  cropRect.width,
      height: cropRect.height,
    })
    .resize(previewWidth, previewHeight)
    .jpeg({ quality: 75 })
    .toBuffer()

  return `data:image/jpeg;base64,${previewBuffer.toString('base64')}`
}
