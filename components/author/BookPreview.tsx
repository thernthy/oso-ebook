'use client'

import { useState, useRef, useCallback } from 'react'

interface ReaderPrefs {
  fontSize: number
  fontFamily: string
  theme: 'dark' | 'light' | 'sepia'
  lineHeight: number
}

const THEMES = {
  dark:  { bg:'#0d0c10', page:'#141320', text:'#e8e6f0', muted:'#635e80', spine:'#1a1828', shadow:'rgba(0,0,0,0.7)' },
  light: { bg:'#d4c9b0', page:'#f5f0e8', text:'#2c2416', muted:'#7a6b54', spine:'#c4b89a', shadow:'rgba(0,0,0,0.3)' },
  sepia: { bg:'#c9b99a', page:'#f2e8d5', text:'#3d2b1f', muted:'#8a6a52', spine:'#b8a88a', shadow:'rgba(0,0,0,0.35)' },
}

const FONTS = [
  { label:'Serif',    value:"'Georgia', 'Times New Roman', serif" },
  { label:'Sans',     value:"'Syne', system-ui, sans-serif" },
  { label:'Mono',     value:"'JetBrains Mono', monospace" },
  { label:'Palatino', value:"'Palatino Linotype', Palatino, serif" },
]

const WORDS_PER_PAGE = 280

function paginateContent(content: string, wordsPerPage: number): string[] {
  const words = content.trim().split(/\s+/)
  const pages: string[] = []
  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push(words.slice(i, i + wordsPerPage).join(' '))
  }
  return pages.length ? pages : ['']
}

const PLACEHOLDER_CONTENT = `Welcome to your book preview!

This is a preview of how your book will appear to readers. The 3D flip book reader provides an immersive reading experience with customizable themes, fonts, and adjustable text size.

Features:
• Dark, Light, and Sepia themes
• Multiple font choices
• Adjustable font size and line height
• Page navigation with keyboard support
• Progress tracking

Upload your book content to see the actual text here. The reader will display your book chapters with smooth page-turn animations.

Happy writing!`

interface Props {
  bookId: string
  bookTitle: string
}

export default function BookPreview({ bookId, bookTitle }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pageIdx, setPageIdx] = useState(0)
  const [flipping, setFlipping] = useState<'forward'|'backward'|null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [prefs, setPrefs] = useState<ReaderPrefs>({
    fontSize: 16, fontFamily: FONTS[0].value, theme: 'dark', lineHeight: 1.85,
  })
  const animating = useRef(false)

  const pages = paginateContent(PLACEHOLDER_CONTENT, WORDS_PER_PAGE)
  const totalPages = pages.length
  const theme = THEMES[prefs.theme]
  const currentText = pages[pageIdx] || ''
  const nextText = pages[pageIdx + 1] || ''

  const turnPage = useCallback((dir: 'forward'|'backward') => {
    if (animating.current) return
    animating.current = true
    setFlipping(dir)

    setTimeout(() => {
      if (dir === 'forward' && pageIdx < totalPages - 1) {
        setPageIdx(p => p + 1)
      } else if (dir === 'backward' && pageIdx > 0) {
        setPageIdx(p => p - 1)
      }
      setFlipping(null)
      animating.current = false
    }, 600)
  }, [pageIdx, totalPages])

  const isFirstPage = pageIdx === 0
  const isLastPage = pageIdx === totalPages - 1

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
      style={{
        position: 'fixed',
        inset: 0,
        background: theme.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 20, background: `${theme.bg}cc`, backdropFilter: 'blur(8px)',
      }}>
        <button onClick={() => setPreviewOpen(false)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted,
          fontSize: 16, padding: '6px 8px', borderRadius: 6,
        }}>←</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontFamily: "'Syne',system-ui,sans-serif" }}>{bookTitle}</div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace", marginTop: 1 }}>
            Preview Mode · p.{pageIdx + 1}/{totalPages}
          </div>
        </div>
        <button onClick={() => setShowSettings(v => !v)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', color: theme.muted,
          fontSize: 16, padding: '6px 8px', borderRadius: 6, fontFamily: "'Syne',system-ui,sans-serif",
        }}>Aa</button>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 52, left: 0, right: 0, height: 2, background: `${theme.muted}33`, zIndex: 20 }}>
        <div style={{ height: '100%', width: `${((pageIdx + 1) / totalPages) * 100}%`, background: '#9d7df5', transition: 'width 0.5s', borderRadius: 1 }} />
      </div>

      {/* The Book */}
      <div style={{
        position: 'relative', perspective: '2000px',
        width: 'min(700px, 90vw)', height: 'min(520px, 75vh)', marginTop: 16,
      }}>
        <div style={{ position: 'absolute', bottom: -20, left: '10%', right: '10%', height: 30, background: theme.shadow, borderRadius: '50%', filter: 'blur(20px)', opacity: 0.6, zIndex: 0 }} />
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', transformStyle: 'preserve-3d' }}>
          {/* Left page */}
          <div style={{
            flex: 1, background: theme.page, borderRadius: '4px 0 0 4px',
            boxShadow: `-4px 0 20px ${theme.shadow}, inset -8px 0 20px rgba(0,0,0,0.08)`,
            padding: '36px 28px 36px 36px', overflow: 'hidden', position: 'relative',
          }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, fontSize: prefs.fontSize, fontFamily: prefs.fontFamily, lineHeight: prefs.lineHeight, color: theme.text, textAlign: 'justify', wordBreak: 'break-word', overflow: 'hidden' }}>
                {currentText}
              </div>
              <div style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace", marginTop: 8 }}>{pageIdx + 1}</div>
            </div>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 24, height: '100%', background: 'linear-gradient(to left, rgba(0,0,0,0.12), transparent)', pointerEvents: 'none' }} />
          </div>

          {/* Spine */}
          <div style={{ width: 14, background: `linear-gradient(to right, ${theme.spine}, ${theme.page} 40%, ${theme.spine})`, boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2)', flexShrink: 0 }} />

          {/* Right page */}
          <div style={{
            flex: 1, position: 'relative', transformStyle: 'preserve-3d',
            transform: flipping === 'forward' ? 'rotateY(-180deg)' : 'rotateY(0deg)',
            transition: flipping ? 'transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000)' : undefined,
            transformOrigin: 'left center',
          }}>
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              background: theme.page, borderRadius: '0 4px 4px 0',
              boxShadow: `4px 0 20px ${theme.shadow}, inset 8px 0 20px rgba(0,0,0,0.05)`,
              padding: '36px 36px 36px 28px', overflow: 'hidden',
            }}>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, fontSize: prefs.fontSize, fontFamily: prefs.fontFamily, lineHeight: prefs.lineHeight, color: theme.text, textAlign: 'justify', wordBreak: 'break-word', overflow: 'hidden' }}>
                  {nextText}
                </div>
                <div style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace", textAlign: 'right', marginTop: 8 }}>{pageIdx + 2}</div>
              </div>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: '100%', background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)', pointerEvents: 'none' }} />
            </div>
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              background: theme.page, borderRadius: '4px 0 0 4px',
              transform: 'rotateY(180deg)',
              padding: '36px 28px 36px 36px', overflow: 'hidden',
              boxShadow: `-4px 0 20px ${theme.shadow}`,
            }}>
              <div style={{ color: theme.muted, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", opacity: 0.4, textAlign: 'center', paddingTop: '40%' }}>◂</div>
            </div>
          </div>
        </div>

        {flipping === 'backward' && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
            transformOrigin: 'right center',
            animation: 'flipBackward 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards',
            background: theme.page, zIndex: 10, borderRadius: '4px 0 0 4px',
            boxShadow: `-4px 0 20px ${theme.shadow}`,
            padding: '36px 28px 36px 36px', overflow: 'hidden',
          }}>
            <style>{`@keyframes flipBackward { from { transform: rotateY(180deg); } to { transform: rotateY(0deg); } }`}</style>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20, zIndex: 10 }}>
        <button onClick={() => turnPage('backward')} disabled={isFirstPage || !!flipping} style={{
          padding: '8px 20px', borderRadius: 6, border: `1px solid ${theme.muted}44`,
          background: 'transparent', color: theme.muted, fontSize: 12, cursor: 'pointer',
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, opacity: isFirstPage ? 0.2 : 1,
        }}>← Prev</button>
        <div style={{ fontSize: 12, color: theme.muted, fontFamily: "'JetBrains Mono',monospace", minWidth: 100, textAlign: 'center' }}>
          {Math.round(((pageIdx + 1) / totalPages) * 100)}%
        </div>
        <button onClick={() => turnPage('forward')} disabled={isLastPage || !!flipping} style={{
          padding: '8px 20px', borderRadius: 6, border: `1px solid ${theme.muted}44`,
          background: 'transparent', color: theme.muted, fontSize: 12, cursor: 'pointer',
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, opacity: isLastPage ? 0.2 : 1,
        }}>Next →</button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{
          position: 'absolute', top: 54, right: 0, width: 280, background: theme.page,
          border: `1px solid ${theme.muted}33`, borderTop: 'none', zIndex: 30,
          boxShadow: `-8px 8px 24px ${theme.shadow}`, padding: 18,
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Theme</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['dark', 'light', 'sepia'] as const).map(t => (
                <button key={t} onClick={() => setPrefs(p => ({ ...p, theme: t }))} style={{
                  flex: 1, padding: '6px 0', borderRadius: 5,
                  border: `1px solid ${prefs.theme === t ? '#9d7df5' : '#44444466'}`,
                  background: THEMES[t].page, color: THEMES[t].text, fontSize: 11, cursor: 'pointer',
                  fontWeight: prefs.theme === t ? 700 : 400, fontFamily: "'Syne',system-ui,sans-serif",
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
              Font Size — {prefs.fontSize}px
            </div>
            <input type="range" min={12} max={24} value={prefs.fontSize} onChange={e => setPrefs(p => ({ ...p, fontSize: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#9d7df5' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
              Line Height — {prefs.lineHeight}
            </div>
            <input type="range" min={1.4} max={2.4} step={0.1} value={prefs.lineHeight} onChange={e => setPrefs(p => ({ ...p, lineHeight: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#9d7df5' }} />
          </div>
        </div>
      )}

      {/* Click zones */}
      <div onClick={() => !showSettings && turnPage('backward')} style={{
        position: 'absolute', left: 0, top: 52, width: '25%', bottom: 80,
        cursor: isFirstPage ? 'default' : 'w-resize', zIndex: 5,
      }} />
      <div onClick={() => !showSettings && turnPage('forward')} style={{
        position: 'absolute', right: 0, top: 52, width: '25%', bottom: 80,
        cursor: isLastPage ? 'default' : 'e-resize', zIndex: 5,
      }} />
    </div>
  )
}
