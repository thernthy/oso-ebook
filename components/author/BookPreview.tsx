'use client'

import { useState, useEffect, useRef } from 'react'
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
  dark:  { bg: '#0d0c10', page: '#141320', text: '#e8e6f0', muted: '#635e80', spine: '#1a1828', shadow: 'rgba(0,0,0,0.7)' },
  light: { bg: '#f5f0e8', page: '#f5f0e8', text: '#2c2416', muted: '#7a6b54', spine: '#c4b89a', shadow: 'rgba(0,0,0,0.3)' },
  sepia: { bg: '#c9b99a', page: '#f2e8d5', text: '#3d2b1f', muted: '#8a6a52', spine: '#b8a88a', shadow: 'rgba(0,0,0,0.35)' },
}

export default function BookPreview({ bookId, bookTitle }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pages, setPages] = useState<PageImage[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [flipProgress, setFlipProgress] = useState(0)
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward' | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark')
  const animating = useRef(false)
  const flipRef = useRef<number>()

  useEffect(() => {
    if (previewOpen && pages.length === 0) {
      fetchAndRenderPdf()
    }
  }, [previewOpen])

  useEffect(() => {
    if (flipDirection) {
      const startTime = Date.now()
      const duration = 500

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        const eased = 1 - Math.pow(1 - progress, 3)
        setFlipProgress(flipDirection === 'forward' ? eased : 1 - eased)

        if (progress < 1) {
          flipRef.current = requestAnimationFrame(animate)
        } else {
          setFlipProgress(0)
          setFlipDirection(null)
          animating.current = false
          if (flipDirection === 'forward') {
            setCurrentPage(p => p + 1)
          } else {
            setCurrentPage(p => p - 1)
          }
        }
      }

      flipRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (flipRef.current) cancelAnimationFrame(flipRef.current)
    }
  }, [flipDirection])

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
    }
  }

  function turnPage(dir: 'forward' | 'backward') {
    if (animating.current) return
    if (dir === 'forward' && currentPage >= totalPages) return
    if (dir === 'backward' && currentPage <= 1) return

    animating.current = true
    setFlipDirection(dir)
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
  const prevPageData = pages.find(p => p.pageNum === currentPage - 1)

  useEffect(() => {
    if (previewOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [previewOpen, currentPage, totalPages])

  function getPageTransform(progress: number, isForward: boolean) {
    if (!isForward) {
      return {
        rotateY: -180 + (progress * 180),
        translateX: 0,
        scale: 1,
        opacity: 1 - progress * 0.3,
      }
    }
    return {
      rotateY: progress * -180,
      translateX: progress * 30,
      scale: 1 - progress * 0.05,
      opacity: 1 - progress * 0.1,
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

  const flipTransform = flipDirection ? getPageTransform(flipProgress, flipDirection === 'forward') : null

  return (
    <div
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
        userSelect: 'none',
      }}
    >
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 30, background: `${currentTheme.bg}ee`, backdropFilter: 'blur(8px)',
      }}>
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
            <button key={t} onClick={() => setTheme(t)} style={{
              width: 28, height: 28, borderRadius: 6, border: `2px solid ${theme === t ? '#9d7df5' : 'transparent'}`,
              background: THEMES[t].page, cursor: 'pointer',
            }} />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 52, left: 0, right: 0, height: 3, background: `${currentTheme.muted}22`, zIndex: 30 }}>
        <div style={{ height: '100%', width: `${totalPages > 0 ? (currentPage / totalPages) * 100 : 0}%`, background: '#9d7df5', transition: 'width 0.3s' }} />
      </div>

      {/* Book */}
      <div style={{
        marginTop: 70, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', perspective: '2500px', perspectiveOrigin: '50% 30%',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: currentTheme.muted }}>
            <div style={{ fontSize: 64, marginBottom: 16, animation: 'pulse 2s infinite' }}>📖</div>
            <div>Rendering pages...</div>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: currentTheme.muted }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠</div>
            <div>{error}</div>
            <button onClick={fetchAndRenderPdf} style={{ marginTop: 16, padding: '10px 20px', background: '#9d7df5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
          </div>
        ) : currentPageData ? (
          <div style={{
            position: 'relative',
            width: 'min(800px, 92vw)',
            height: 'min(600px, 78vh)',
            transformStyle: 'preserve-3d',
          }}>
            {/* Shadow under book */}
            <div style={{
              position: 'absolute', bottom: -40, left: '8%', right: '8%', height: 50,
              background: currentTheme.shadow, borderRadius: '50%', filter: 'blur(40px)', opacity: 0.6, zIndex: 0,
            }} />

            <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
              {/* Left side */}
              <div style={{
                position: 'absolute', left: 0, top: 0, width: '50%', height: '100%',
                perspective: '1500px', perspectiveOrigin: 'right center', overflow: 'hidden', zIndex: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fff',
              }}>
                {/* Back of previous page (visible during flip) */}
                {flipDirection === 'backward' && prevPageData && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    transform: `rotateY(${90 + flipProgress * 90}deg)`,
                    transformOrigin: 'right center',
                    background: currentTheme.page,
                    backfaceVisibility: 'hidden',
                    boxShadow: `inset -5px 0 20px rgba(0,0,0,0.15)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img src={prevPageData.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: 'rotateY(180deg)' }} />
                  </div>
                )}
                
                {/* Current page */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                  transform: flipTransform ? `rotateY(${-flipTransform.rotateY}deg) translateX(${-flipTransform.translateX}px)` : 'rotateY(0deg)',
                  transformOrigin: 'right center',
                  transition: flipDirection ? 'none' : 'transform 0.1s',
                  boxShadow: flipTransform ? `inset -${10 + flipProgress * 10}px 0 ${30 - flipProgress * 20}px rgba(0,0,0,${0.3 - flipProgress * 0.2})` : `inset -10px 0 30px rgba(0,0,0,0.15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#fff',
                }}>
                  <img src={currentPageData.dataUrl} alt={`Page ${currentPage}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  {/* Page gradient for depth */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 85%, rgba(0,0,0,0.08))', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Spine */}
              <div style={{
                position: 'absolute', left: '50%', top: 0, width: 20, height: '100%',
                transform: 'translateX(-50%)',
                background: `linear-gradient(to right, ${currentTheme.spine} 0%, ${currentTheme.page} 30%, ${currentTheme.page} 70%, ${currentTheme.spine} 100%)`,
                boxShadow: '0 0 20px rgba(0,0,0,0.2), inset 0 0 15px rgba(0,0,0,0.1)',
                zIndex: 5,
              }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.1), transparent)' }} />
              </div>

              {/* Right side */}
              <div style={{
                position: 'absolute', right: 0, top: 0, width: '50%', height: '100%',
                perspective: '1500px', perspectiveOrigin: 'left center', overflow: 'hidden', zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fff',
              }}>
                {/* Current right page */}
                <div style={{
                  position: 'absolute', right: 0, top: 0, width: '100%', height: '100%',
                  transform: flipTransform ? `rotateY(${-180 - flipTransform.rotateY}deg)` : 'rotateY(0deg)',
                  transformOrigin: 'left center',
                  transition: flipDirection ? 'none' : 'transform 0.1s',
                  opacity: 1,
                }}>
                  {nextPageData ? (
                  <>
                    <img src={nextPageData.dataUrl} alt={`Page ${currentPage + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, transparent 85%, rgba(0,0,0,0.06))', pointerEvents: 'none' }} />
                    </>
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: currentTheme.page, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTheme.muted, fontSize: 24 }}>
                      The End
                    </div>
                  )}
                </div>

                {/* Back of current page during forward flip */}
                {flipDirection === 'forward' && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    transform: `rotateY(${180 + flipProgress * 180}deg)`,
                    transformOrigin: 'left center',
                    background: currentTheme.page,
                    backfaceVisibility: 'hidden',
                    boxShadow: `inset 5px 0 20px rgba(0,0,0,0.1)`,
                  }}>
                    <img src={currentPageData.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: 'rotateY(180deg)' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Page curl effect during flip */}
            {flipDirection && flipProgress > 0.3 && flipProgress < 0.7 && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: flipDirection === 'forward' ? '50%' : '50%',
                width: 60,
                height: 120,
                transform: 'translate(-50%, -50%)',
                background: `linear-gradient(${flipDirection === 'forward' ? 90 : -90}deg, rgba(255,255,255,0.15), rgba(0,0,0,0.1))`,
                borderRadius: '50%',
                filter: 'blur(8px)',
                zIndex: 10,
                opacity: Math.sin(flipProgress * Math.PI) * 0.5,
              }} />
            )}
          </div>
        ) : null}
      </div>

      {/* Bottom navigation */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 65,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
        background: `${currentTheme.bg}ee`, backdropFilter: 'blur(8px)',
        borderTop: `1px solid ${currentTheme.muted}22`,
      }}>
        <button
          onClick={() => turnPage('backward')}
          disabled={currentPage <= 1 || !!flipDirection}
          style={{
            padding: '10px 24px', borderRadius: 8, border: `1px solid ${currentTheme.muted}44`,
            background: 'transparent', color: currentTheme.muted, fontSize: 13, cursor: 'pointer',
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, opacity: currentPage <= 1 ? 0.3 : 1,
          }}
        >← Prev</button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={e => {
              const p = parseInt(e.target.value)
              if (p >= 1 && p <= totalPages) {
                setCurrentPage(p)
                setPages([])
                fetchAndRenderPdf()
              }
            }}
            style={{
              width: 70, padding: '8px 12px', borderRadius: 8,
              border: `1px solid ${currentTheme.muted}44`, background: 'transparent',
              color: currentTheme.text, fontSize: 14, textAlign: 'center',
              fontFamily: "'JetBrains Mono',monospace",
            }}
          />
          <span style={{ color: currentTheme.muted, fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>/ {totalPages}</span>
        </div>
        
        <button
          onClick={() => turnPage('forward')}
          disabled={currentPage >= totalPages || !!flipDirection}
          style={{
            padding: '10px 24px', borderRadius: 8, border: `1px solid ${currentTheme.muted}44`,
            background: 'transparent', color: currentTheme.muted, fontSize: 13, cursor: 'pointer',
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, opacity: currentPage >= totalPages ? 0.3 : 1,
          }}
        >Next →</button>
      </div>

      {/* Click zones */}
      <div onClick={() => turnPage('backward')} style={{
        position: 'absolute', left: 0, top: 52, width: '25%', bottom: 65,
        cursor: currentPage <= 1 ? 'default' : 'pointer', zIndex: 15,
      }} />
      <div onClick={() => turnPage('forward')} style={{
        position: 'absolute', right: 0, top: 52, width: '75%', bottom: 65,
        cursor: currentPage >= totalPages ? 'default' : 'pointer', zIndex: 15,
      }} />
    </div>
  )
}
