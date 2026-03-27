'use client'

import React, { useState, useEffect, useRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface Props {
  bookId: string
  bookTitle: string
  coverUrl?: string | null
  backCoverUrl?: string | null
}

interface PageImage {
  pageNum: number
  dataUrl: string
}

const PageCover = React.forwardRef((props: { children?: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => (
  <div ref={ref} data-density="hard" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
    {props.children}
  </div>
))
PageCover.displayName = 'PageCover'

const Page = React.forwardRef((props: { number: number; children?: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => (
  <div ref={ref} style={{ 
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: '#fff',
  }}>
    {props.children}
  </div>
))
Page.displayName = 'Page'

export default function BookPreview({ bookId, bookTitle, coverUrl, backCoverUrl }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState('')
  const [pages, setPages] = useState<PageImage[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalSheets, setTotalSheets] = useState(0)
  const flipBookRef = useRef<any>(null)
  const coverRef = useRef<HTMLDivElement>(null)
  const backCoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (previewOpen && pages.length === 0) {
      fetchAndRenderPdf()
    }
  }, [previewOpen])

  useEffect(() => {
    if (pages.length > 0 && flipBookRef.current) {
      setTimeout(() => {
        flipBookRef.current.flip(0)
      }, 100)
    }
  }, [pages.length])

  async function fetchAndRenderPdf() {
    setLoading(true)
    setLoadProgress(0)
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
      setLoadProgress(0)
    }
  }

  async function renderPdfPages(url: string) {
    try {
      const loadingTask = pdfjsLib.getDocument(url)
      const pdf = await loadingTask.promise
      const numPages = pdf.numPages
      setTotalPages(numPages)

      const sheets = Math.ceil((numPages + 2) / 2)
      setTotalSheets(sheets)

      const renderedPages: PageImage[] = []
      const maxPages = Math.min(numPages, 100)
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i)
        const scale = 1.5
        const viewport = page.getViewport({ scale })
        
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({ canvasContext: context, viewport }).promise
        renderedPages.push({ pageNum: i, dataUrl: canvas.toDataURL('image/jpeg', 0.9) })
        setLoadProgress(Math.round((i / maxPages) * 100))
      }

      setPages(renderedPages)
    } catch (e: any) {
      setError('Failed to render PDF pages')
    }
  }

  function onFlip(e: { data: number }) {
    setCurrentPage(e.data)
  }

  function prevPage() {
    if (flipBookRef.current) {
      flipBookRef.current.flipPrev()
    }
  }

  function nextPage() {
    if (flipBookRef.current) {
      flipBookRef.current.flipNext()
    }
  }

  function goToPage(num: number) {
    if (flipBookRef.current) {
      flipBookRef.current.flip(num - 1)
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextPage() }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prevPage() }
  }

  useEffect(() => {
    if (previewOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [previewOpen])

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
      position: 'fixed', inset: 0, background: '#1a1a2e',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', zIndex: 1000,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 30, background: 'rgba(26,26,46,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <button onClick={() => { setPreviewOpen(false); setPages([]); setCurrentPage(0); }} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', color: '#888',
          fontSize: 16, padding: '6px 8px', borderRadius: 6,
        }}>✕</button>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: "'Syne',system-ui" }}>{bookTitle}</div>
          <div style={{ fontSize: 11, color: '#666', fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>
            {loading ? `Loading ${loadProgress}%` : `Page ${currentPage + 1} / ${totalSheets}`}
          </div>
        </div>
        
        <div style={{ width: 60 }} />
      </div>

      {loading && (
        <div style={{ position: 'absolute', top: 52, left: 0, right: 0, height: 3, background: '#333', zIndex: 30 }}>
          <div style={{ height: '100%', width: `${loadProgress}%`, background: '#9d7df5', transition: 'width 0.2s' }} />
        </div>
      )}

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
            <div>Rendering pages... {loadProgress}%</div>
            <div style={{ width: 200, height: 4, background: '#333', borderRadius: 2, marginTop: 16, overflow: 'hidden' }}>
              <div style={{ width: `${loadProgress}%`, height: '100%', background: '#9d7df5', transition: 'width 0.2s' }} />
            </div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚠</div>
            <div>{error}</div>
            <button onClick={fetchAndRenderPdf} style={{ marginTop: 16, padding: '10px 20px', background: '#9d7df5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
          </div>
        ) : pages.length > 0 ? (
          // @ts-expect-error - react-pageflip types are incomplete
          <HTMLFlipBook
            ref={flipBookRef}
            width={500}
            height={700}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={false}
            drawShadow={true}
            flippingTime={800}
            onFlip={onFlip}
            className="flip-book"
            style={{ 
              background: '#1a1a2e',
            }}
          >
            <PageCover ref={coverRef}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: '#8b1a1a',
              }}>
                {coverUrl ? (
                  <img 
                    src={coverUrl} 
                    alt="Cover" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                    }} 
                  />
                ) : (
                  <div style={{ color: '#fff', fontSize: 24, fontFamily: "'Georgia',serif", textAlign: 'center', padding: 40 }}>
                    {bookTitle}
                  </div>
                )}
              </div>
            </PageCover>

            {pages.map((page) => (
              <Page key={page.pageNum} number={page.pageNum}>
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                  <img 
                    src={page.dataUrl} 
                    alt={`Page ${page.pageNum}`}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain',
                    }} 
                  />
                </div>
              </Page>
            ))}

            <PageCover ref={backCoverRef}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: '#1a1a3a',
              }}>
                {backCoverUrl ? (
                  <img 
                    src={backCoverUrl} 
                    alt="Back Cover" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                    }} 
                  />
                ) : (
                  <div style={{ color: '#fff', fontSize: 24, fontFamily: "'Georgia',serif", fontStyle: 'italic' }}>
                    The End
                  </div>
                )}
              </div>
            </PageCover>
          </HTMLFlipBook>
        ) : null}
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 65,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'rgba(26,26,46,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <button onClick={prevPage} disabled={currentPage <= 0} style={{
          padding: '8px 20px', borderRadius: 6, border: '1px solid #444',
          background: 'transparent', color: currentPage <= 0 ? '#444' : '#fff', fontSize: 13, cursor: currentPage <= 0 ? 'default' : 'pointer',
          fontFamily: "'JetBrains Mono',monospace",
        }}>
          ◀ Prev
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number" min={1} max={totalSheets} value={currentPage + 1}
            onChange={e => {
              const num = parseInt(e.target.value)
              if (num >= 1 && num <= totalSheets) {
                goToPage(num)
              }
            }}
            style={{
              width: 60, padding: '6px 10px', borderRadius: 6,
              border: '1px solid #444', background: 'transparent',
              color: '#fff', fontSize: 14, textAlign: 'center',
              fontFamily: "'JetBrains Mono',monospace",
            }}
          />
          <span style={{ color: '#666', fontSize: 13 }}>/ {totalSheets}</span>
        </div>
        
        <button onClick={nextPage} disabled={currentPage >= totalSheets - 1} style={{
          padding: '8px 20px', borderRadius: 6, border: '1px solid #444',
          background: 'transparent', color: currentPage >= totalSheets - 1 ? '#444' : '#fff', fontSize: 13, cursor: currentPage >= totalSheets - 1 ? 'default' : 'pointer',
          fontFamily: "'JetBrains Mono',monospace",
        }}>
          Next ▶
        </button>
      </div>
    </div>
  )
}
