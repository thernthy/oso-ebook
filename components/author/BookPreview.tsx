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
  const [flipping, setFlipping] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark')

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
      for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
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

  function goNext() {
    if (flipping || currentPage >= totalPages) return
    setFlipping(true)
    setTimeout(() => {
      setCurrentPage(p => p + 1)
      setFlipping(false)
    }, 600)
  }

  function goPrev() {
    if (flipping || currentPage <= 1) return
    setFlipping(true)
    setTimeout(() => {
      setCurrentPage(p => p - 1)
      setFlipping(false)
    }, 600)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
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
  }, [previewOpen, currentPage, totalPages, flipping])

  if (!previewOpen) {
    return (
      <button
        onClick={() => setPreviewOpen(true)}
        style={{
          padding: '8px 16px', borderRadius: 6,
          background: 'rgba(157, 125, 245, 0.12)', color: '#9d7df5',
          border: '1px solid rgba(157, 125, 245, 0.3)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'Syne', system-ui, sans-serif", display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        📖 Preview
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: currentTheme.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', zIndex: 1000, userSelect: 'none',
    }}>
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

      {/* Book container */}
      <div style={{
        marginTop: 70, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', perspective: '2000px', perspectiveOrigin: '50% 50%',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: currentTheme.muted }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
            <div>Rendering pages...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: currentTheme.muted }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠</div>
            <div>{error}</div>
            <button onClick={fetchAndRenderPdf} style={{ marginTop: 16, padding: '10px 20px', background: '#9d7df5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
          </div>
        ) : currentPageData ? (
          <div style={{
            position: 'relative', width: 'min(900px, 92vw)', height: 'min(580px, 75vh)',
          }}>
            {/* Shadow under book */}
            <div style={{
              position: 'absolute', bottom: -40, left: '5%', right: '5%', height: 50,
              background: currentTheme.shadow, borderRadius: '50%', filter: 'blur(40px)', opacity: 0.4,
            }} />

            {/* Pages container */}
            <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
              
              {/* LEFT PAGE (current page) */}
              <div style={{
                position: 'absolute', left: 0, top: 0, width: 'calc(50% - 12px)', height: '100%',
                transformStyle: 'preserve-3d', zIndex: 2,
              }}>
                {/* The page that flips to the left when going NEXT */}
                <div style={{
                  position: 'absolute', inset: 0,
                  transformOrigin: 'right center',
                  transform: flipping && !prevPageData
                    ? 'rotateY(-90deg)'
                    : 'rotateY(0deg)',
                  transition: flipping && !prevPageData ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                  transformStyle: 'preserve-3d',
                  boxShadow: '6px 0 20px rgba(0,0,0,0.15)',
                  borderRadius: '4px 0 0 4px',
                  background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img src={currentPageData.dataUrl} alt={`Page ${currentPage}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  {/* Shadow gradient on right edge */}
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 25, height: '100%', background: 'linear-gradient(to left, rgba(0,0,0,0.1), transparent)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* SPINE */}
              <div style={{
                position: 'absolute', left: 'calc(50% - 12px)', top: 0, width: 24, height: '100%',
                background: `linear-gradient(to right, ${currentTheme.spine}, ${currentTheme.page} 35%, ${currentTheme.page} 65%, ${currentTheme.spine})`,
                boxShadow: '-2px 0 15px rgba(0,0,0,0.1), 2px 0 15px rgba(0,0,0,0.1)',
                zIndex: 3,
              }} />

              {/* RIGHT PAGE (next page) */}
              <div style={{
                position: 'absolute', right: 0, top: 0, width: 'calc(50% - 12px)', height: '100%',
                transformStyle: 'preserve-3d', zIndex: 1,
              }}>
                {/* The page that slides in from right when going NEXT */}
                <div style={{
                  position: 'absolute', inset: 0,
                  transformOrigin: 'left center',
                  transform: flipping && !prevPageData
                    ? 'translateX(-100%)'
                    : 'translateX(0)',
                  transition: flipping && !prevPageData ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                  borderRadius: '0 4px 4px 0',
                  background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {nextPageData ? (
                    <img src={nextPageData.dataUrl} alt={`Page ${currentPage + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ color: currentTheme.muted, fontSize: 20 }}>The End</span>
                  )}
                </div>
              </div>

              {/* SLIDE ANIMATION - The current page slides left, next page slides in from right */}
              {flipping && !prevPageData && (
                <>
                  {/* Current page slides left */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, width: 'calc(50% - 12px)', height: '100%',
                    zIndex: 10,
                    animation: 'slideLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  }}>
                    <div style={{
                      width: '100%', height: '100%',
                      boxShadow: '6px 0 20px rgba(0,0,0,0.15)',
                      borderRadius: '4px 0 0 4px',
                      background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img src={currentPageData.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>
                  {/* Next page slides in from right */}
                  <div style={{
                    position: 'absolute', right: 0, top: 0, width: 'calc(50% - 12px)', height: '100%',
                    zIndex: 11,
                    animation: 'slideInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  }}>
                    <div style={{
                      width: '100%', height: '100%',
                      borderRadius: '0 4px 4px 0',
                      background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {nextPageData && <img src={nextPageData.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
                    </div>
                  </div>
                </>
              )}

              {/* Backward flip animation */}
              {flipping && prevPageData && (
                <>
                  {/* Previous page slides in from left */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, width: 'calc(50% - 12px)', height: '100%',
                    zIndex: 10,
                    animation: 'slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  }}>
                    <div style={{
                      width: '100%', height: '100%',
                      boxShadow: '6px 0 20px rgba(0,0,0,0.15)',
                      borderRadius: '4px 0 0 4px',
                      background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img src={prevPageData.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>
                  {/* Current page slides out to right */}
                  <div style={{
                    position: 'absolute', right: 0, top: 0, width: 'calc(50% - 12px)', height: '100%',
                    zIndex: 11,
                    animation: 'slideRight 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  }}>
                    <div style={{
                      width: '100%', height: '100%',
                      borderRadius: '0 4px 4px 0',
                      background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img src={currentPageData.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>
                </>
              )}
            </div>

            <style>{`
              @keyframes slideLeft {
                from { transform: translateX(0); }
                to { transform: translateX(-120%); opacity: 0; }
              }
              @keyframes slideInRight {
                from { transform: translateX(120%); }
                to { transform: translateX(0); }
              }
              @keyframes slideInLeft {
                from { transform: translateX(-120%); }
                to { transform: translateX(0); }
              }
              @keyframes slideRight {
                from { transform: translateX(0); }
                to { transform: translateX(120%); opacity: 0; }
              }
            `}</style>
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
        <button onClick={goPrev} disabled={currentPage <= 1 || flipping} style={{
          padding: '10px 24px', borderRadius: 8, border: `1px solid ${currentTheme.muted}44`,
          background: 'transparent', color: currentTheme.muted, fontSize: 13, cursor: 'pointer',
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, opacity: currentPage <= 1 ? 0.3 : 1,
        }}>← Prev</button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number" min={1} max={totalPages} value={currentPage}
            onChange={e => {
              const p = parseInt(e.target.value)
              if (p >= 1 && p <= totalPages) setCurrentPage(p)
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
        
        <button onClick={goNext} disabled={currentPage >= totalPages || flipping} style={{
          padding: '10px 24px', borderRadius: 8, border: `1px solid ${currentTheme.muted}44`,
          background: 'transparent', color: currentTheme.muted, fontSize: 13, cursor: 'pointer',
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, opacity: currentPage >= totalPages ? 0.3 : 1,
        }}>Next →</button>
      </div>

      {/* Click zones */}
      <div onClick={goPrev} style={{
        position: 'absolute', left: 0, top: 52, width: '25%', bottom: 65,
        cursor: currentPage <= 1 || flipping ? 'default' : 'pointer', zIndex: 15,
      }} />
      <div onClick={goNext} style={{
        position: 'absolute', right: 0, top: 52, width: '75%', bottom: 65,
        cursor: currentPage >= totalPages || flipping ? 'default' : 'pointer', zIndex: 15,
      }} />
    </div>
  )
}
