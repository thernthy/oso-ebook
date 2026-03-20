'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CropRect { left: number; top: number; width: number; height: number }

interface Analysis {
  original_width:  number
  original_height: number
  original_ratio:  number
  target_ratio:    number
  ratio_match:     boolean
  needs_crop:      boolean
  warnings:        string[]
  suggested_crop:  CropRect
  target_width:    number
  target_height:   number
  thumb_width:     number
  thumb_height:    number
}

interface Props {
  bookId:       string
  currentCover: string | null
  bookStatus:   string
}

type Stage = 'idle' | 'uploading' | 'preview' | 'confirming' | 'done' | 'error'

export default function CoverUpload({ bookId, currentCover, bookStatus }: Props) {
  const router    = useRouter()
  const inputRef  = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [stage,      setStage]      = useState<Stage>('idle')
  const [dragging,   setDragging]   = useState(false)
  const [analysis,   setAnalysis]   = useState<Analysis | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)      // cropped preview
  const [origSrc,    setOrigSrc]    = useState<string | null>(null)      // original for canvas
  const [imageB64,   setImageB64]   = useState<string>('')
  const [origName,   setOrigName]   = useState<string>('')
  const [crop,       setCrop]       = useState<CropRect | null>(null)    // current crop rect
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const [dragStart,  setDragStart]  = useState({ x: 0, y: 0, cropLeft: 0, cropTop: 0 })
  const [savedCover, setSavedCover] = useState<string | null>(currentCover)
  const [error,      setError]      = useState('')

  const canEdit = ['draft', 'rejected', 'in_review'].includes(bookStatus)

  // Upload file → analyse
  const handleFile = useCallback(async (file: File) => {
    if (!canEdit) return
    setError('')
    setStage('uploading')

    const form = new FormData()
    form.append('file', file)

    const res  = await fetch(`/api/books/${bookId}/cover`, { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Upload failed')
      setStage('error')
      return
    }

    const d = data.data
    setAnalysis(d.analysis)
    setPreviewSrc(d.preview_b64)
    setImageB64(d.image_b64)
    setOrigName(d.original_name)
    setCrop(d.analysis.suggested_crop)

    // Also set original image for canvas overlay
    const origUrl = URL.createObjectURL(file)
    setOrigSrc(origUrl)

    setStage('preview')
  }, [bookId, canEdit])

  // Confirm crop → save
  async function confirmCrop() {
    setStage('confirming')
    setError('')

    const res  = await fetch(`/api/books/${bookId}/cover?action=confirm`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        image_b64:     imageB64,
        crop:          analysis?.needs_crop ? crop : null,
        original_name: origName,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to save cover')
      setStage('error')
      return
    }

    setSavedCover(data.data.cover_url + `?t=${Date.now()}`)
    setStage('done')
    router.refresh()

    // Reset after 2s
    setTimeout(() => setStage('idle'), 2000)
  }

  // Regenerate preview when crop changes
  useEffect(() => {
    if (!imageB64 || !crop || !analysis) return
    regeneratePreview(imageB64, crop, analysis)
  }, [crop])

  async function regeneratePreview(b64: string, cropRect: CropRect, an: Analysis) {
    // Draw on canvas: original image with crop overlay
    const img = new Image()
    img.onload = () => {
      const canvas  = canvasRef.current
      if (!canvas) return
      const ctx     = canvas.getContext('2d')
      if (!ctx) return

      const PREVIEW_W = 300
      const scale     = PREVIEW_W / an.original_width
      const PREVIEW_H = Math.round(an.original_height * scale)

      canvas.width  = PREVIEW_W
      canvas.height = PREVIEW_H

      // Draw original image dimmed
      ctx.globalAlpha = 0.4
      ctx.drawImage(img, 0, 0, PREVIEW_W, PREVIEW_H)
      ctx.globalAlpha = 1.0

      // Draw crop area at full brightness
      const sx = cropRect.left   * scale
      const sy = cropRect.top    * scale
      const sw = cropRect.width  * scale
      const sh = cropRect.height * scale

      ctx.drawImage(img, cropRect.left, cropRect.top, cropRect.width, cropRect.height, sx, sy, sw, sh)

      // Draw crop border
      ctx.strokeStyle = '#9d7df5'
      ctx.lineWidth   = 2
      ctx.setLineDash([])
      ctx.strokeRect(sx, sy, sw, sh)

      // Corner handles
      const hs = 8
      ctx.fillStyle = '#9d7df5'
      for (const [hx, hy] of [[sx,sy],[sx+sw,sy],[sx,sy+sh],[sx+sw,sy+sh]]) {
        ctx.fillRect(hx - hs/2, hy - hs/2, hs, hs)
      }

      // Dimension label
      ctx.fillStyle   = '#9d7df5'
      ctx.font        = '11px JetBrains Mono, monospace'
      ctx.fillText(`${an.target_width}×${an.target_height}px`, sx + 4, sy + 16)

      setPreviewSrc(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.src = `data:image/jpeg;base64,${b64}`
  }

  // Drag crop box
  function onCropMouseDown(e: React.MouseEvent) {
    if (!analysis || !crop) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect  = canvas.getBoundingClientRect()
    const scale = analysis.original_width / canvas.width

    setIsDraggingCrop(true)
    setDragStart({
      x:        (e.clientX - rect.left) * scale,
      y:        (e.clientY - rect.top)  * scale,
      cropLeft: crop.left,
      cropTop:  crop.top,
    })
  }

  function onCropMouseMove(e: React.MouseEvent) {
    if (!isDraggingCrop || !analysis || !crop) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect  = canvas.getBoundingClientRect()
    const scale = analysis.original_width / canvas.width

    const dx   = (e.clientX - rect.left) * scale - dragStart.x
    const dy   = (e.clientY - rect.top)  * scale - dragStart.y

    const newLeft = Math.max(0, Math.min(analysis.original_width  - crop.width,  dragStart.cropLeft + dx))
    const newTop  = Math.max(0, Math.min(analysis.original_height - crop.height, dragStart.cropTop  + dy))

    setCrop(c => c ? { ...c, left: Math.round(newLeft), top: Math.round(newTop) } : c)
  }

  function onCropMouseUp() { setIsDraggingCrop(false) }

  async function deleteCover() {
    if (!confirm('Remove book cover?')) return
    await fetch(`/api/books/${bookId}/cover`, { method: 'DELETE' })
    setSavedCover(null)
    router.refresh()
  }

  function resetCrop() {
    if (analysis) setCrop(analysis.suggested_crop)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  return (
    <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #272635', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#eeecf8' }}>Book Cover</div>
        <div style={{ fontSize:10, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>
          Standard: 1600×2400px · 2:3 ratio · JPG/PNG/WebP
        </div>
      </div>

      <div style={{ padding:18, display:'flex', gap:20, alignItems:'flex-start' }}>

        {/* Current cover or placeholder */}
        <div style={{ flexShrink:0 }}>
          <div style={{ width:100, height:150, borderRadius:8, overflow:'hidden', background:'rgba(157,125,245,0.08)', border:'1px solid #272635', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
            {savedCover ? (
              <img src={savedCover} alt="Cover" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : (
              <div style={{ textAlign:'center', color:'#635e80' }}>
                <div style={{ fontSize:28 }}>📕</div>
                <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>No cover</div>
              </div>
            )}
            {savedCover && stage === 'done' && (
              <div style={{ position:'absolute', inset:0, background:'rgba(61,214,163,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>✓</div>
            )}
          </div>
          {savedCover && canEdit && (
            <button onClick={deleteCover}
              style={{ marginTop:6, width:'100%', padding:'4px', borderRadius:4, background:'transparent', border:'1px solid rgba(240,112,96,0.25)', color:'#f07060', fontSize:10, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
              Remove
            </button>
          )}
        </div>

        <div style={{ flex:1 }}>

          {/* ── Stage: idle / error ── */}
          {(stage === 'idle' || stage === 'error') && canEdit && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border:       `1.5px dashed ${dragging ? '#9d7df5' : '#2e3252'}`,
                  borderRadius: 8,
                  padding:      '22px 16px',
                  textAlign:    'center',
                  cursor:       'pointer',
                  background:   dragging ? 'rgba(157,125,245,0.04)' : 'transparent',
                  transition:   'all .15s',
                }}>
                <div style={{ fontSize:24, marginBottom:8 }}>🖼</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#eeecf8', marginBottom:4 }}>
                  {savedCover ? 'Replace cover' : 'Upload cover image'}
                </div>
                <div style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>
                  JPG, PNG, WebP · max 10MB
                </div>
                <div style={{ fontSize:11, color:'#9d7df5', fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>
                  Recommended: 1600×2400px (2:3)
                </div>
              </div>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
                style={{ display:'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </>
          )}

          {/* ── Stage: uploading ── */}
          {stage === 'uploading' && (
            <div style={{ padding:'24px', textAlign:'center', color:'#635e80' }}>
              <div style={{ fontSize:20, marginBottom:8, animation:'spin 1s linear infinite' }}>⟳</div>
              <div style={{ fontSize:13, fontFamily:"'JetBrains Mono',monospace" }}>Analysing image…</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Stage: preview ── */}
          {stage === 'preview' && analysis && (
            <div>
              {/* Warnings */}
              {analysis.warnings.length > 0 && (
                <div style={{ marginBottom:12, padding:'10px 12px', background: analysis.needs_crop ? 'rgba(232,197,71,0.08)' : 'rgba(61,214,163,0.06)', border:`1px solid ${analysis.needs_crop?'rgba(232,197,71,0.25)':'rgba(61,214,163,0.2)'}`, borderRadius:7 }}>
                  <div style={{ fontSize:10, fontWeight:700, color: analysis.needs_crop ? '#e8c547' : '#3dd6a3', fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>
                    {analysis.needs_crop ? '⚠ CROP REQUIRED' : '✓ RATIO OK'}
                  </div>
                  {analysis.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize:11, color:'#9a9ab0', lineHeight:1.5 }}>{w}</div>
                  ))}
                </div>
              )}

              {/* Original info */}
              <div style={{ display:'flex', gap:8, marginBottom:12, fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:'#635e80' }}>
                <span>Original: {analysis.original_width}×{analysis.original_height}</span>
                <span>·</span>
                <span style={{ color: analysis.ratio_match ? '#3dd6a3' : '#e8c547' }}>
                  Ratio: {analysis.original_ratio.toFixed(3)} {analysis.ratio_match ? '✓' : `→ ${analysis.target_ratio.toFixed(3)}`}
                </span>
                <span>·</span>
                <span style={{ color:'#9d7df5' }}>Output: {analysis.target_width}×{analysis.target_height}</span>
              </div>

              {/* Canvas crop preview */}
              {analysis.needs_crop ? (
                <div>
                  <div style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>
                    Drag the crop box to reposition. Purple area will be used.
                  </div>
                  <canvas
                    ref={canvasRef}
                    onMouseDown={onCropMouseDown}
                    onMouseMove={onCropMouseMove}
                    onMouseUp={onCropMouseUp}
                    onMouseLeave={onCropMouseUp}
                    style={{ borderRadius:6, cursor:isDraggingCrop?'grabbing':'grab', maxWidth:'100%', border:'1px solid #272635', display:'block' }}
                  />
                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
                    <button onClick={resetCrop}
                      style={{ padding:'4px 10px', borderRadius:4, background:'transparent', border:'1px solid #272635', color:'#635e80', fontSize:11, cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
                      Reset to center
                    </button>
                    {crop && (
                      <span style={{ fontSize:10, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", alignSelf:'center' }}>
                        Crop: {crop.left},{crop.top} → {crop.width}×{crop.height}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                // No crop needed — show simple preview
                previewSrc && (
                  <div>
                    <div style={{ fontSize:11, color:'#3dd6a3', fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>
                      ✓ Perfect ratio — no cropping needed
                    </div>
                    <img src={previewSrc} alt="Preview" style={{ maxWidth:160, borderRadius:6, border:'1px solid #272635' }} />
                  </div>
                )
              )}

              {/* Thumbnail preview */}
              <div style={{ marginTop:12, padding:'10px 12px', background:'#1b1a28', borderRadius:7, border:'1px solid #272635' }}>
                <div style={{ fontSize:10, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>
                  CATALOG THUMBNAIL — {analysis.thumb_width}×{analysis.thumb_height}px
                </div>
                {previewSrc && (
                  <img src={previewSrc} alt="Thumbnail preview"
                    style={{ width:64, height:96, objectFit:'cover', borderRadius:4, border:'1px solid #272635' }} />
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                <button onClick={confirmCrop}
                  style={{ padding:'8px 18px', borderRadius:6, background:'#9d7df5', color:'#0d0c10', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',system-ui,sans-serif" }}>
                  {analysis.needs_crop ? '✓ Apply crop & save' : '✓ Save cover'}
                </button>
                <button onClick={() => { setStage('idle'); setAnalysis(null); setPreviewSrc(null) }}
                  style={{ padding:'8px 12px', borderRadius:6, background:'transparent', border:'1px solid #272635', color:'#635e80', fontSize:12, cursor:'pointer', fontFamily:"'Syne',system-ui,sans-serif" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Stage: confirming ── */}
          {stage === 'confirming' && (
            <div style={{ padding:'24px', textAlign:'center', color:'#635e80' }}>
              <div style={{ fontSize:20, marginBottom:8 }}>⟳</div>
              <div style={{ fontSize:13, fontFamily:"'JetBrains Mono',monospace" }}>
                Processing cover image…<br/>
                <span style={{ fontSize:11, marginTop:4, display:'block' }}>Resizing to 1600×2400 + generating thumbnail</span>
              </div>
            </div>
          )}

          {/* ── Stage: done ── */}
          {stage === 'done' && (
            <div style={{ padding:'16px', textAlign:'center' }}>
              <div style={{ fontSize:22, color:'#3dd6a3', marginBottom:6 }}>✓</div>
              <div style={{ fontSize:13, color:'#3dd6a3', fontWeight:600, fontFamily:"'Syne',system-ui,sans-serif" }}>Cover saved!</div>
              <div style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
                Full: 1600×2400px · Thumbnail: 320×480px
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(240,112,96,0.08)', border:'1px solid rgba(240,112,96,0.25)', borderRadius:6, fontSize:12, color:'#f07060' }}>
              ⚠ {error}
            </div>
          )}

          {!canEdit && !savedCover && (
            <div style={{ fontSize:12, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", padding:'12px', background:'rgba(99,94,128,0.1)', borderRadius:7 }}>
              Cover can only be changed while book is in draft or rejected state.
            </div>
          )}
        </div>
      </div>

      {/* Initialise canvas on mount when preview is ready */}
      {stage === 'preview' && analysis?.needs_crop && imageB64 && crop && (
        <canvas style={{ display:'none' }} ref={(el: any) => {
            if (el && imageB64) regeneratePreview(imageB64, crop, analysis)
          }} />
      )}
    </div>
  )
}
