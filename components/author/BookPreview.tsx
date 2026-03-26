'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface Props {
  bookId: string
  bookTitle: string
}

interface PageImage {
  pageNum: number
  dataUrl: string
}

const THEMES = {
  dark:  { bg:'#0d0c10', page:'#141320', text:'#e8e6f0', muted:'#635e80', spine:'#1a1828', shadow:'rgba(0,0,0,0.7)' },
  light: { bg:'#f5f0e8', page:'#f5f0e8', text:'#2c2416', muted:'#7a6b54', spine:'#c4b89a', shadow:'rgba(0,0,0,0.3)' },
  sepia: { bg:'#c9b99a', page:'#f2e8d5', text:'#3d2b1f', muted:'#8a6a52', spine:'#b8a88a', shadow:'rgba(0,0,0,0.35)' },
}

export default function BookPreview({ bookId, bookTitle }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pages, setPages] = useState<PageImage[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [flipping, setFlipping] = useState<'forward' | 'backward' | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark')
  const animating = useRef(false)

  useEffect(() => {
    if (previewOpen && pages.length === 0) {
      fetchAndRenderPdf()
    }
  }, [previewOpen])

  async function fetchAndRenderPdf() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/books/${bookId}/files`)
      const data = await res.json()
      if (data.success && data.data.files?.length > 0) {
        const file = data.data.files[0]
        if (file.format !== 'pdf') {
          setError('Preview is only available for PDF files')
          setLoading(false)
          return
        }
        const url = `/uploads/${file.storage_key}`
        setFileUrl(url)
        await renderPdfPages(url)
      } else {
        setError('No file found for this book')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load PDF')
    } finally {
      setLoading(false)
    }
  }

  async function renderPdfPages(url: string) {
    try {
      const loadingTask = pdfjsLib.getDocument(url)
      const pdf = await loadingTask.promise
      setTotalPages(pdf.numPages)

      const renderedPages: PageImage[] = []
      
      for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
        const page = await pdf.getPage(i)
        const scale = 1.5
        const viewport = page.getViewport({ scale })
        
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise

        renderedPages.push({
          pageNum: i,
          dataUrl: canvas.toDataURL('image/jpeg', 0.9),
        })
      }

      setPages(renderedPages)
    } catch (e: any) {
      setError('Failed to render PDF pages')
      console.error(e)
    }
  }

  function turnPage(dir: 'forward' | 'backward') {
    if (animating.current) return
    if (dir === 'forward' && currentPage >= totalPages) return
    if (dir === 'backward' && currentPage <= 1) return

    animating.current = true
    setFlipping(dir)

    setTimeout(() => {
      setCurrentPage(p => dir === 'forward' ? p + 1 : p - 1)
      setFlipping(null)
      animating.current = false
    }, 600)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault()
      turnPage('forward')
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      turnPage('backward')
    }
  }

  const currentTheme = THEMES[theme]
  const currentPageData = pages.find(p => p.pageNum === currentPage)
  const nextPageData = pages.find(p => p.pageNum === currentPage + 1)

  useEffect(() => {
    if (previewOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [previewOpen, currentPage, totalPages])

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
      onClick={() => turnPage('forward')}
      style={{
        position: 'fixed',
        inset: 0,
        background: currentTheme.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 1000,
        cursor: 'pointer',
      }}
    >
      {/* Top bar */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', zIndex: 20, background: `${currentTheme.bg}ee`, backdropFilter: 'blur(8px)',
        }}
      >
        <button onClick={() => { setPreviewOpen(false); setPages([]); setCurrentPage(1); }} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', color: currentTheme.muted,
          fontSize: 16, padding: '6px 8px', borderRadius: 6,
        }}>←</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: currentTheme.text, fontFamily: "'Syne',system-ui,sans-serif" }}>{bookTitle}</div>
          <div style={{ fontSize: 11, color: currentTheme.muted, fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>
            {loading ? 'Rendering...' : `${currentPage} / ${totalPages}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['dark', 'light', 'sepia'] as const).map(t => (
            <button key={t} onClick={e => { e.stopPropagation(); setTheme(t); }} style={{
              width: 28, height: 28, borderRadius: 6, border: `2px solid ${theme === t ? '#9d7df5' : 'transparent'}`,
              background: THEMES[t].page, cursor: 'pointer',
            }} />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 52, left: 0, right: 0, height: 3, background: `${currentTheme.muted}22`, zIndex: 20 }}>
        <div style={{ height: '100%', width: `${totalPages > 0 ? (currentPage / totalPages) * 100 : 0}%`, background: '#9d7df5', transition: 'width 0.3s' }} />
      </div>

      {/* Content */}
      <div style={{ marginTop: 70, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: currentTheme.muted }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            <div>Rendering pages...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: currentTheme.muted }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <div>{error}</div>
          </div>
        ) : currentPageData ? (
          <div
            style={{
              position: 'relative',
              perspective: '2000px',
              width: 'min(720px, 95vw)',
              height: 'min(540px, 80vh)',
            }}
          >
            <div style={{ position: 'absolute', bottom: -30, left: '10%', right: '10%', height: 40, background: currentTheme.shadow, borderRadius: '50%', filter: 'blur(30px)', opacity: 0.5 }} />
            
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex' }}>
              {/* Left page */}
              <div style={{
                flex: 1,
                background: currentTheme.page,
                borderRadius: '4px 0 0 4px',
                boxShadow: `-6px 0 30px ${currentTheme.shadow}`,
                overflow: 'hidden',
                position: 'relative',
              }}>
                <img
                  src={currentPageData.dataUrl}
                  alt={`Page ${currentPage}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
                />
                <div style={{ position: 'absolute', top: 0, right: 0, width: 20, height: '100%', background: 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)', pointerEvents: 'none' }} />
                <div style={{
                  position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center',
                  fontSize: 11, color: currentTheme.muted, fontFamily: "'JetBrains Mono',monospace",
                }}>
                  {currentPage}
                </div>
              </div>

              {/* Spine */}
              <div style={{
                width: 16,
                background: `linear-gradient(to right, ${currentTheme.spine}, ${currentTheme.page} 40%, ${currentTheme.spine})`,
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)',
                flexShrink: 0,
              }} />

              {/* Right page */}
              <div style={{
                flex: 1,
                position: 'relative',
                transformStyle: 'preserve-3d',
                transform: flipping === 'forward' ? 'rotateY(-160deg)' : flipping === 'backward' ? 'rotateY(160deg)' : 'rotateY(0deg)',
                transition: flipping ? 'transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000)' : 'none',
                transformOrigin: 'left center',
              }}>
                {nextPageData ? (
                  <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    background: currentTheme.page, borderRadius: '0 4px 4px 0',
                    boxShadow: `6px 0 30px ${currentTheme.shadow}`,
                    overflow: 'hidden',
                  }}>
                    <img
                      src={nextPageData.dataUrl}
                      alt={`Page ${currentPage + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: '100%', background: 'linear-gradient(to right, rgba(0,0,0,0.1), transparent)', pointerEvents: 'none' }} />
                    <div style={{
                      position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center',
                      fontSize: 11, color: currentTheme.muted, fontFamily: "'JetBrains Mono',monospace",
                    }}>
                      {currentPage + 1}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    background: currentTheme.page, borderRadius: '0 4px 4px 0',
                    boxShadow: `6px 0 30px ${currentTheme.shadow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: currentTheme.muted,
                  }}>
                    The End
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom navigation */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          background: `${currentTheme.bg}ee`, backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={() => turnPage('backward')}
          disabled={currentPage <= 1 || !!flipping}
          style={{
            padding: '8px 20px', borderRadius: 6, border: `1px solid ${currentTheme.muted}44`,
            background: 'transparent', color: currentTheme.muted, fontSize: 12, cursor: 'pointer',
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, opacity: currentPage <= 1 ? 0.3 : 1,
          }}
        >← Prev</button>
        
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={e => {
            const p = parseInt(e.target.value)
            if (p >= 1 && p <= totalPages) setCurrentPage(p)
          }}
          style={{
            width: 60, padding: '6px 10px', borderRadius: 6,
            border: `1px solid ${currentTheme.muted}44`, background: 'transparent',
            color: currentTheme.text, fontSize: 14, textAlign: 'center',
            fontFamily: "'JetBrains Mono',monospace",
          }}
        />
        
        <span style={{ color: currentTheme.muted, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
          of {totalPages}
        </span>
        
        <button
          onClick={() => turnPage('forward')}
          disabled={currentPage >= totalPages || !!flipping}
          style={{
            padding: '8px 20px', borderRadius: 6, border: `1px solid ${currentTheme.muted}44`,
            background: 'transparent', color: currentTheme.muted, fontSize: 12, cursor: 'pointer',
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, opacity: currentPage >= totalPages ? 0.3 : 1,
          }}
        >Next →</button>
      </div>

      {/* Click zones */}
      <div
        onClick={e => { e.stopPropagation(); turnPage('backward'); }}
        style={{
          position: 'absolute', left: 0, top: 52, width: '20%', bottom: 60,
          cursor: currentPage <= 1 ? 'default' : 'w-resize', zIndex: 5,
        }}
      />
      <div
        onClick={e => { e.stopPropagation(); turnPage('forward'); }}
        style={{
          position: 'absolute', right: 0, top: 52, width: '80%', bottom: 60,
          cursor: currentPage >= totalPages ? 'default' : 'pointer', zIndex: 5,
        }}
      />
    </div>
  )
}
