'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface Props {
  bookId:     string
  bookStatus: string
  latestFile: any | null
}

export default function BookUploadPanel({ bookId, bookStatus, latestFile }: Props) {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState('')
  const [aiStatus,  setAiStatus]  = useState(latestFile?.ai_status || '')
  const [error,     setError]     = useState('')
  const [allowedFormats, setAllowedFormats] = useState('pdf,epub,docx,txt')
  const [maxUploadMb, setMaxUploadMb] = useState(50)
  const inputRef = useRef<HTMLInputElement>(null)

  const canUpload = ['draft', 'rejected'].includes(bookStatus)

  // Fetch admin upload settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings?key=allowed_formats')
        const data = await res.json()
        if (data.data?.settings?.allowed_formats) {
          setAllowedFormats(data.data.settings.allowed_formats)
        }
      } catch {}
      try {
        const res = await fetch('/api/admin/settings?key=max_upload_mb')
        const data = await res.json()
        if (data.data?.settings?.max_upload_mb) {
          setMaxUploadMb(parseInt(data.data.settings.max_upload_mb, 10))
        }
      } catch {}
    }
    fetchSettings()
  }, [])

  // Poll AI job status every 3s while processing
  useEffect(() => {
    if (!['queued', 'running'].includes(aiStatus)) return
    const interval = setInterval(async () => {
      const res  = await fetch(`/api/books/${bookId}/upload`)
      const data = await res.json()
      const file = data.data?.files?.[0]
      if (file) {
        setAiStatus(file.ai_status)
        if (['done', 'failed'].includes(file.ai_status)) {
          clearInterval(interval)
          window.location.reload() // refresh to show new chapters
        }
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [aiStatus, bookId])

  const handleFile = useCallback(async (file: File) => {
    if (!canUpload) return
    setError('')
    setUploading(true)
    setProgress('Uploading file…')

    const form = new FormData()
    form.append('file', file)

    const res  = await fetch(`/api/books/${bookId}/upload`, { method:'POST', body:form })
    const data = await res.json()

    setUploading(false)

    if (!res.ok) {
      setError(data.error || 'Upload failed')
      setProgress('')
      return
    }

    setProgress('File uploaded! AI is now detecting chapters…')
    setAiStatus('queued')
  }, [bookId, canUpload])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #272635', fontSize:13, fontWeight:700, color:'#eeecf8' }}>
        Book File
      </div>

      <div style={{ padding:18 }}>

        {/* Existing file */}
        {latestFile && (
          <div style={{ marginBottom:16, padding:'12px 14px', background:'#1b1a28', borderRadius:8, border:'1px solid #272635' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#eeecf8' }}>{latestFile.original_name}</div>
                <div style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
                  {latestFile.format?.toUpperCase()} · {formatBytes(latestFile.file_size || 0)}
                </div>
              </div>
              <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", padding:'3px 8px', borderRadius:4,
                background: latestFile.file_status === 'processed' ? 'rgba(61,214,163,0.12)' : 'rgba(232,197,71,0.12)',
                color:      latestFile.file_status === 'processed' ? '#3dd6a3' : '#e8c547' }}>
                {latestFile.file_status}
              </span>
            </div>

            {/* AI status */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:10, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>AI:</span>
              {aiStatus === 'done' && <span style={{ fontSize:11, color:'#3dd6a3', fontFamily:"'JetBrains Mono',monospace" }}>✓ {latestFile.chapters_found} chapters detected</span>}
              {(aiStatus === 'queued' || aiStatus === 'running') && (
                <span style={{ fontSize:11, color:'#e8c547', fontFamily:"'JetBrains Mono',monospace" }}>
                  ⟳ Processing… (auto-refreshes)
                </span>
              )}
              {aiStatus === 'failed' && <span style={{ fontSize:11, color:'#f07060', fontFamily:"'JetBrains Mono',monospace" }}>⚠ Failed — try uploading again</span>}
              {!aiStatus && <span style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>—</span>}
            </div>
          </div>
        )}

        {/* Upload area */}
        {canUpload && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border:         `1.5px dashed ${dragging ? '#9d7df5' : '#2e3252'}`,
                borderRadius:   8,
                padding:        '28px 20px',
                textAlign:      'center',
                cursor:         'pointer',
                background:     dragging ? 'rgba(157,125,245,0.04)' : 'transparent',
                transition:     'all .15s',
              }}>
              <div style={{ fontSize:28, marginBottom:10 }}>📤</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#eeecf8', marginBottom:4 }}>
                {uploading ? progress : 'Drop file here or click to browse'}
              </div>
              <div style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>
                {allowedFormats.toUpperCase()} · max {maxUploadMb}MB
              </div>
              {latestFile && (
                <div style={{ fontSize:11, color:'#9d7df5', fontFamily:"'JetBrains Mono',monospace", marginTop:6 }}>
                  Re-upload to replace existing file
                </div>
              )}
            </div>
            <input ref={inputRef} type="file" accept={allowedFormats.split(',').map(f => `.${f.trim()}`).join(',')} style={{ display:'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </>
        )}

        {!canUpload && (
          <div style={{ padding:'12px 14px', background:'rgba(99,94,128,0.1)', borderRadius:8, fontSize:12, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>
            Files can only be replaced while book is in draft or rejected state.
          </div>
        )}

        {error && (
          <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(240,112,96,0.1)', border:'1px solid rgba(240,112,96,0.3)', borderRadius:8, fontSize:12, color:'#f07060' }}>
            ⚠ {error}
          </div>
        )}
        {progress && !error && !uploading && (
          <div style={{ marginTop:12, fontSize:12, color:'#e8c547', fontFamily:"'JetBrains Mono',monospace" }}>
            {progress}
          </div>
        )}
      </div>
    </div>
  )
}
