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
  dark:  { bg: '#0d0c10', page: '#141320', text: '#e8e6f0', muted: '#635e80', spine: '#1a1828', shadow: 'rgba(0,0,0,0.5)' },
  light: { bg: '#f5f0e8', page: '#f5f0e8', text: '#2c2416', muted: '#7a6b54', spine: '#c4b89a', shadow: 'rgba(0,0,0,0.2)' },
  sepia: { bg: '#c9b99a', page: '#f2e8d5', text: '#3d2b1f', muted: '#8a6a52', spine: '#b8a88a', shadow: 'rgba(0,0,0,0.25)' },
}

export default function BookPreview({ bookId, bookTitle }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pages, setPages] = useState<PageImage[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [animState, setAnimState] = useState<{ dir: 'next' | 'prev'; progress: number } | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark')
  const animRef = useRef<number>()

  useEffect(() => {
    if (previewOpen && pages.length === 0) {
      fetchAndRenderPdf()
    }
  }, [previewOpen])

  useEffect(() => {
    if (animState) {
      const startTime = Date.now()
      const duration = 600

      const animate = () => {
        const elapsed = Date.now() - startTime
        let progress = Math.min(elapsed / duration, 1)
        
        if (progress < 0.5) {
          progress = 2 * progress * progress
        } else {
          progress = 1 - Math.pow(-2 * progress + 2, 2) / 2
        }
        
        setAnimState(prev => prev ? { ...prev, progress } : null)

        if (elapsed < duration) {
          animRef.current = requestAnimationFrame(animate)
        } else {
          setAnimState(null)
          setCurrentPage(p => animState.dir === 'next' ? p + 1 : p - 1)
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [animState?.dir])

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

        await page.render({ canvasContext: context, viewport }).promise
        renderedPages.push({ pageNum: i, dataUrl: canvas.toDataURL('image/jpeg', 0.9) })
      }

      setPages(renderedPages)
    } catch (e: any) {
      setError('Failed to render PDF pages')
    }
  }

  function turnPage(dir: 'next' | 'prev') {
    if (animState) return
    if (dir === 'next' && currentPage >= totalPages) return
    if (dir === 'prev' && currentPage <= 1) return
    setAnimState({ dir, progress: 0 })
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); turnPage('next') }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); turnPage('prev') }
  }

  const currentTheme = THEMES[theme]
  const p = currentPage
  const leftPage = pages.find(x => x.pageNum === p)
  const rightPage = pages.find(x => x.pageNum === p + 1)
  const prevLeftPage = pages.find(x => x.pageNum === p - 1)

  const isNextAnim = animState?.dir === 'next'
  const isPrevAnim = animState?.dir === 'prev'
  const prog = animState?.progress ?? 0

  useEffect(() => {
    if (previewOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [previewOpen, currentPage, totalPages, animState])

  if (!previewOpen) {
    return (
      <button onClick={() => setPreviewOpen(true)} style={{
        padding: '8px 16px', borderRadius: 6, background: 'rgba(157, 125, 245, 0.12)', color: '#9d7df5',
        border: '1px solid rgba(157, 125, 245, 0.3)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        fontFamily: "'Syne', system-ui, sans-serif", display: 'flex', alignItems: 'center', gap: 6,
      }}>
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
            {loading ? 'Rendering...' : `${p} / ${totalPages}`}
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
        <div style={{ height: '100%', width: `${totalPages > 0 ? (p / totalPages) * 100 : 0}%`, background: '#9d7df5', transition: 'width 0.3s' }} />
      </div>

      {/* Book */}
      <div style={{
        marginTop: 70, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', perspective: '1800px',
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
        ) : leftPage ? (
          <div style={{
            position: 'relative', width: 'min(900px, 90vw)', height: 'min(600px, 75vh)',
          }}>
            {/* Shadow */}
            <div style={{
              position: 'absolute', bottom: -45, left: '5%', right: '5%', height: 60,
              background: currentTheme.shadow, borderRadius: '50%', filter: 'blur(45px)', opacity: 0.4,
            }} />

            <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
              
              {/* LEFT SIDE */}
              <div style={{
                position: 'absolute', left: 0, top: 0, width: 'calc(50% - 10px)', height: '100%',
                perspective: '1200px', perspectiveOrigin: 'right center', zIndex: 2,
              }}>
                {/* Left page (static or animating backward) */}
                <div style={{
                  position: 'absolute', inset: 0,
                  transformOrigin: 'right center',
                  transform: isPrevAnim 
                    ? `rotateY(${(1 - prog) * -180}deg)`
                    : 'rotateY(0deg)',
                  transition: isNextAnim ? 'none' : 'transform 0.01s',
                  transformStyle: 'preserve-3d',
                  borderRadius: '3px 0 0 3px',
                  boxShadow: isNextAnim ? `${8 - prog * 8}px 0 ${25 - prog * 20}px rgba(0,0,0,${0.18 - prog * 0.15})` : '6px 0 25px rgba(0,0,0,0.15)',
                  background: '#fff',
                }}>
                  {/* Page front */}
                  <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
                    <img src={leftPage.dataUrl} alt="" style={{ 
                      width: '100%', height: '100%', objectFit: 'contain', background: '#fff',
                      borderRadius: '3px 0 0 3px',
                    }} />
                    <div style={{ 
                      position: 'absolute', top: 0, right: 0, width: 20, height: '100%',
                      background: 'linear-gradient(to left, rgba(0,0,0,0.06), transparent)',
                      pointerEvents: 'none', borderRadius: '0 0 0 3px',
                    }} />
                  </div>
                  {/* Page back */}
                  <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)', background: '#f8f8f8',
                    borderRadius: '0 3px 3px 0',
                  }}>
                    <img src={leftPage.dataUrl} alt="" style={{ 
                      width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0.95)',
                      borderRadius: '0 3px 3px 0',
                    }} />
                  </div>
                </div>
              </div>

              {/* SPINE */}
              <div style={{
                position: 'absolute', left: 'calc(50% - 10px)', top: 0, width: 20, height: '100%',
                background: `linear-gradient(to right, ${currentTheme.spine} 0%, ${currentTheme.page} 30%, ${currentTheme.page} 70%, ${currentTheme.spine} 100%)`,
                boxShadow: '-2px 0 20px rgba(0,0,0,0.15), 2px 0 20px rgba(0,0,0,0.15)',
                zIndex: 3,
              }} />

              {/* RIGHT SIDE */}
              <div style={{
                position: 'absolute', right: 0, top: 0, width: 'calc(50% - 10px)', height: '100%',
                perspective: '1200px', perspectiveOrigin: 'left center', zIndex: 1,
              }}>
                {/* Right page (static or animating forward) */}
                <div style={{
                  position: 'absolute', inset: 0,
                  transformOrigin: 'left center',
                  transform: isNextAnim
                    ? `rotateY(${180 + prog * 180}deg)`
                    : 'rotateY(180deg)',
                  transition: isPrevAnim ? 'none' : 'transform 0.01s',
                  transformStyle: 'preserve-3d',
                  borderRadius: '0 3px 3px 0',
                  boxShadow: isPrevAnim ? `${-8 + prog * 8}px 0 ${25 - prog * 20}px rgba(0,0,0,${0.18 - prog * 0.15})` : '-6px 0 25px rgba(0,0,0,0.15)',
                  background: '#fff',
                }}>
                  {/* Page front (next page content) */}
                  <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    {rightPage ? (
                      <>
                        <img src={rightPage.dataUrl} alt="" style={{ 
                          width: '100%', height: '100%', objectFit: 'contain', background: '#fff',
                          borderRadius: '0 3px 3px 0',
                        }} />
                        <div style={{ 
                          position: 'absolute', top: 0, left: 0, width: 20, height: '100%',
                          background: 'linear-gradient(to right, rgba(0,0,0,0.05), transparent)',
                          pointerEvents: 'none',
                        }} />
                      </>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: currentTheme.muted, fontSize: 20, borderRadius: '0 3px 3px 0' }}>
                        The End
                      </div>
                    )}
                  </div>
                  {/* Page back */}
                  <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)', background: '#f8f8f8',
                    borderRadius: '3px 0 0 3px',
                  }}>
                    {rightPage && (
                      <img src={rightPage.dataUrl} alt="" style={{ 
                        width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0.95)',
                        borderRadius: '3px 0 0 3px',
                      }} />
                    )}
                  </div>
                </div>
              </div>

              {/* Page curl shadow */}
              {animState && (
                <div style={{
                  position: 'absolute',
                  left: isNextAnim ? `${50 - 5 + prog * 40}%` : `${50 - 5 - prog * 40}%`,
                  top: '50%', width: 100, height: '120%',
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  zIndex: 10,
                  opacity: Math.sin(prog * Math.PI) * 0.5,
                }} />
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 65,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
        background: `${currentTheme.bg}ee`, backdropFilter: 'blur(8px)',
        borderTop: `1px solid ${currentTheme.muted}22`,
      }}>
        <button onClick={() => turnPage('prev')} disabled={p <= 1 || !!animState} style={{
          padding: '10px 24px', borderRadius: 8, border: `1px solid ${currentTheme.muted}44`,
          background: 'transparent', color: currentTheme.muted, fontSize: 13, cursor: 'pointer',
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, opacity: p <= 1 ? 0.3 : 1,
        }}>← Prev</button>
        
        <input
          type="number" min={1} max={totalPages} value={p}
          onChange={e => {
            const num = parseInt(e.target.value)
            if (num >= 1 && num <= totalPages) setCurrentPage(num)
          }}
          style={{
            width: 70, padding: '8px 12px', borderRadius: 8,
            border: `1px solid ${currentTheme.muted}44`, background: 'transparent',
            color: currentTheme.text, fontSize: 14, textAlign: 'center',
            fontFamily: "'JetBrains Mono',monospace",
          }}
        />
        <span style={{ color: currentTheme.muted, fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>/ {totalPages}</span>
        
        <button onClick={() => turnPage('next')} disabled={p >= totalPages || !!animState} style={{
          padding: '10px 24px', borderRadius: 8, border: `1px solid ${currentTheme.muted}44`,
          background: 'transparent', color: currentTheme.muted, fontSize: 13, cursor: 'pointer',
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, opacity: p >= totalPages ? 0.3 : 1,
        }}>Next →</button>
      </div>

      {/* Click zones */}
      <div onClick={() => turnPage('prev')} style={{
        position: 'absolute', left: 0, top: 52, width: '25%', bottom: 65,
        cursor: p <= 1 || animState ? 'default' : 'pointer', zIndex: 15,
      }} />
      <div onClick={() => turnPage('next')} style={{
        position: 'absolute', right: 0, top: 52, width: '75%', bottom: 65,
        cursor: p >= totalPages || animState ? 'default' : 'pointer', zIndex: 15,
      }} />
    </div>
  )
}
