'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface ReaderPrefs {
  fontSize: number
  theme: 'dark' | 'light' | 'sepia'
}

const THEMES = {
  dark:  { bg:'#0d0c10', text:'#e8e6f0', muted:'#635e80' },
  light: { bg:'#f5f0e8', text:'#2c2416', muted:'#7a6b54' },
  sepia: { bg:'#f2e8d5', text:'#3d2b1f', muted:'#8a6a52' },
}

interface Props {
  bookId: string
  bookTitle: string
}

export default function BookPreview({ bookId, bookTitle }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pageIdx, setPageIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileFormat, setFileFormat] = useState('')
  const [totalPages, setTotalPages] = useState(0)
  const [pdfScale, setPdfScale] = useState(1.2)
  const [prefs, setPrefs] = useState<ReaderPrefs>({ fontSize: 14, theme: 'dark' })
  const theme = THEMES[prefs.theme]
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (previewOpen && !fileUrl) {
      fetchFile()
    }
  }, [previewOpen])

  async function fetchFile() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/books/${bookId}/files`)
      const data = await res.json()
      if (data.success && data.data.files?.length > 0) {
        const file = data.data.files[0]
        setFileFormat(file.format)
        setTotalPages(file.total_pages || 1)
        // Create URL for the file
        const url = `/uploads/${file.storage_key}`
        setFileUrl(url)
      } else {
        setError('No file found for this book')
      }
    } catch {
      setError('Failed to load file')
    } finally {
      setLoading(false)
    }
  }

  function resetReader() {
    setPageIdx(0)
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      setPageIdx(page - 1)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault()
      goToPage(pageIdx + 2)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goToPage(pageIdx)
    }
  }

  if (!previewOpen) {
    return (
      <button
        onClick={() => setPreviewOpen(true)}
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          background: 'rgba(157, 125, 245, 0.12)',
          color: '#9d7df5',
          border: '1px solid rgba(157, 125, 245, 0.3)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: "'Syne', system-ui, sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        📖 Preview
      </button>
    )
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        position: 'fixed',
        inset: 0,
        background: theme.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 1000,
        outline: 'none',
      }}
    >
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 20, background: `${theme.bg}ee`, backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${theme.muted}22`,
      }}>
        <button onClick={() => { setPreviewOpen(false); resetReader(); }} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted,
          fontSize: 16, padding: '6px 8px', borderRadius: 6,
        }}>←</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontFamily: "'Syne',system-ui,sans-serif" }}>{bookTitle}</div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>
            {loading ? 'Loading...' : `${pageIdx + 1} / ${totalPages || '?'}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPdfScale(s => Math.max(0.5, s - 0.2))} style={{
            background: 'transparent', border: `1px solid ${theme.muted}44`, borderRadius: 6,
            color: theme.muted, fontSize: 12, padding: '4px 10px', cursor: 'pointer',
          }}>−</button>
          <span style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace", padding: '4px 8px' }}>
            {Math.round(pdfScale * 100)}%
          </span>
          <button onClick={() => setPdfScale(s => Math.min(3, s + 0.2))} style={{
            background: 'transparent', border: `1px solid ${theme.muted}44`, borderRadius: 6,
            color: theme.muted, fontSize: 12, padding: '4px 10px', cursor: 'pointer',
          }}>+</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 52, left: 0, right: 0, height: 2, background: `${theme.muted}22`, zIndex: 20 }}>
        <div style={{ height: '100%', width: `${totalPages > 0 ? ((pageIdx + 1) / totalPages) * 100 : 0}%`, background: '#9d7df5', transition: 'width 0.3s' }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', marginTop: 52, color: theme.muted }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
          <div>Loading book...</div>
        </div>
      ) : error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', marginTop: 52, color: theme.muted }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
          <div>{error}</div>
          <button onClick={fetchFile} style={{ marginTop: 16, padding: '8px 16px', background: '#9d7df5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
        </div>
      ) : fileFormat === 'pdf' ? (
        <>
          {/* PDF Viewer */}
          <div style={{ marginTop: 62, flex: 1, width: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <iframe
              key={pageIdx}
              src={`${fileUrl}#page=${pageIdx + 1}&toolbar=0&navpanes=0`}
              style={{
                width: `${595 * pdfScale}px`,
                height: `${842 * pdfScale}px`,
                border: 'none',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                borderRadius: 4,
              }}
              title="Book Preview"
            />
          </div>

          {/* Page navigation */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            background: `${theme.bg}ee`, backdropFilter: 'blur(8px)',
            borderTop: `1px solid ${theme.muted}22`,
          }}>
            <button onClick={() => goToPage(pageIdx)} disabled={pageIdx === 0} style={{
              padding: '8px 16px', borderRadius: 6, border: `1px solid ${theme.muted}44`,
              background: 'transparent', color: theme.muted, fontSize: 12, cursor: 'pointer',
              opacity: pageIdx === 0 ? 0.3 : 1,
            }}>←</button>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageIdx + 1}
              onChange={e => goToPage(parseInt(e.target.value) || 1)}
              style={{
                width: 60, padding: '6px 10px', borderRadius: 6,
                border: `1px solid ${theme.muted}44`, background: 'transparent',
                color: theme.text, fontSize: 14, textAlign: 'center',
                fontFamily: "'JetBrains Mono',monospace",
              }}
            />
            <span style={{ color: theme.muted, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>of {totalPages}</span>
            <button onClick={() => goToPage(pageIdx + 2)} disabled={pageIdx >= totalPages - 1} style={{
              padding: '8px 16px', borderRadius: 6, border: `1px solid ${theme.muted}44`,
              background: 'transparent', color: theme.muted, fontSize: 12, cursor: 'pointer',
              opacity: pageIdx >= totalPages - 1 ? 0.3 : 1,
            }}>→</button>
          </div>
        </>
      ) : (
        /* Non-PDF files */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', marginTop: 52, color: theme.muted }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 8 }}>{fileFormat?.toUpperCase()} File</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Preview not available for this format</div>
          <a href={fileUrl} download style={{
            padding: '10px 20px', background: '#9d7df5', color: '#fff',
            borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600,
          }}>Download to View</a>
        </div>
      )}

      {/* Theme selector */}
      {!loading && !error && (
        <div style={{
          position: 'absolute', top: 60, right: 16, zIndex: 30,
          background: theme.bg, border: `1px solid ${theme.muted}33`,
          borderRadius: 8, padding: 12, display: 'flex', gap: 8,
        }}>
          {(['dark', 'light', 'sepia'] as const).map(t => (
            <button key={t} onClick={() => setPrefs(p => ({ ...p, theme: t }))} style={{
              width: 32, height: 32, borderRadius: 6, border: `2px solid ${prefs.theme === t ? '#9d7df5' : 'transparent'}`,
              background: THEMES[t].bg, cursor: 'pointer',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
