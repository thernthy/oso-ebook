'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface Chapter {
  id:          string
  chapter_num: number
  title:       string
  content:     string
  word_count:  number
}

interface ReaderPrefs {
  fontSize:   number
  fontFamily: string
  theme:      'dark' | 'light' | 'sepia'
  lineHeight: number
}

interface Props {
  bookId:          string
  bookTitle:       string
  chapters:        Chapter[]
  initialChapterId?: string
  initialPage?:    number
}

const WORDS_PER_PAGE = 280

const THEMES = {
  dark:  { bg:'#0d0c10', page:'#141320', text:'#e8e6f0', muted:'#635e80', spine:'#1a1828', shadow:'rgba(0,0,0,0.7)' },
  light: { bg:'#d4c9b0', page:'#f5f0e8', text:'#2c2416', muted:'#7a6b54', spine:'#c4b89a', shadow:'rgba(0,0,0,0.3)' },
  sepia: { bg:'#c9b99a', page:'#f2e8d5', text:'#3d2b1f', muted:'#8a6a52', spine:'#b8a88a', shadow:'rgba(0,0,0,0.35)' },
}

const FONTS = [
  { label:'Serif',      value:"'Georgia', 'Times New Roman', serif" },
  { label:'Sans',       value:"'Syne', system-ui, sans-serif" },
  { label:'Mono',       value:"'JetBrains Mono', monospace" },
  { label:'Palatino',   value:"'Palatino Linotype', Palatino, serif" },
]

function paginateContent(content: string, wordsPerPage: number): string[] {
  const words  = content.trim().split(/\s+/)
  const pages: string[] = []
  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push(words.slice(i, i + wordsPerPage).join(' '))
  }
  return pages.length ? pages : ['']
}

export default function BookReader({ bookId, bookTitle, chapters, initialChapterId, initialPage }: Props) {
  // Find initial chapter index
  const initChIdx = Math.max(0, chapters.findIndex(c => c.id === initialChapterId))

  const [chapterIdx, setChapterIdx] = useState(initChIdx)
  const [pageIdx,    setPageIdx]    = useState(initialPage ? initialPage - 1 : 0)
  const [flipping,   setFlipping]   = useState<'forward'|'backward'|null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showChapters, setShowChapters] = useState(false)
  const [showBookmark, setShowBookmark] = useState(false)
  const [bookmarked,   setBookmarked]   = useState(false)
  const [prefs, setPrefs] = useState<ReaderPrefs>({
    fontSize: 16, fontFamily: FONTS[0].value, theme: 'dark', lineHeight: 1.85,
  })
  const [timeStart]   = useState(Date.now())
  const saveTimer     = useRef<NodeJS.Timeout>()
  const animating     = useRef(false)

  const chapter    = chapters[chapterIdx]
  const pages      = paginateContent(chapter?.content || '', WORDS_PER_PAGE)
  const totalPages = pages.length
  const theme      = THEMES[prefs.theme]

  // Global progress: total pages across all chapters
  const chapterPageOffsets = chapters.map((ch, i) => {
    const prev = chapters.slice(0, i)
    return prev.reduce((sum, c) => sum + Math.ceil(c.word_count / WORDS_PER_PAGE), 0)
  })
  const totalBookPages = chapters.reduce((s, c) => s + Math.ceil(c.word_count / WORDS_PER_PAGE), 0)
  const currentBookPage = chapterPageOffsets[chapterIdx] + pageIdx + 1
  const progressPct = Math.round((currentBookPage / totalBookPages) * 100)

  // Auto-save progress every 10s
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      if (!chapter) return
      await fetch(`/api/progress/${bookId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          chapter_id:  chapter.id,
          page_num:    pageIdx + 1,
          total_pages: totalPages,
          scroll_pct:  progressPct,
          time_spent_s: Math.round((Date.now() - timeStart) / 1000),
        }),
      })
    }, 10_000)
    return () => clearTimeout(saveTimer.current)
  }, [chapterIdx, pageIdx])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showSettings || showChapters) return
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); turnPage('forward') }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); turnPage('backward') }
      if (e.key === 'Escape')     { setShowSettings(false); setShowChapters(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [chapterIdx, pageIdx, showSettings, showChapters, totalPages])

  const turnPage = useCallback((dir: 'forward'|'backward') => {
    if (animating.current) return
    animating.current = true
    setFlipping(dir)

    setTimeout(() => {
      if (dir === 'forward') {
        if (pageIdx < totalPages - 1) {
          setPageIdx(p => p + 1)
        } else if (chapterIdx < chapters.length - 1) {
          setChapterIdx(i => i + 1)
          setPageIdx(0)
        }
      } else {
        if (pageIdx > 0) {
          setPageIdx(p => p - 1)
        } else if (chapterIdx > 0) {
          const prevChapter  = chapters[chapterIdx - 1]
          const prevPages    = paginateContent(prevChapter.content, WORDS_PER_PAGE)
          setChapterIdx(i => i - 1)
          setPageIdx(prevPages.length - 1)
        }
      }
      setFlipping(null)
      animating.current = false
    }, 600)
  }, [pageIdx, totalPages, chapterIdx, chapters])

  const isFirstPage = chapterIdx === 0 && pageIdx === 0
  const isLastPage  = chapterIdx === chapters.length - 1 && pageIdx === totalPages - 1

  async function addBookmark() {
    await fetch('/api/bookmarks', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ book_id: bookId, chapter_id: chapter.id, page_num: pageIdx + 1 }),
    })
    setBookmarked(true)
    setTimeout(() => setBookmarked(false), 2000)
  }

  function setP(key: keyof ReaderPrefs, val: any) {
    setPrefs(p => ({ ...p, [key]: val }))
  }

  const currentText  = pages[pageIdx]  || ''
  const nextText     = pages[pageIdx + 1] || (chapters[chapterIdx + 1] ? paginateContent(chapters[chapterIdx + 1].content, WORDS_PER_PAGE)[0] : '')

  return (
    <div style={{ position:'fixed', inset:0, background:theme.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden', transition:'background 0.4s' }}>

      {/* ── Top bar ── */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:52, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', zIndex:20, background:`${theme.bg}cc`, backdropFilter:'blur(8px)' }}>
        <button onClick={() => history.back()} style={{ ...iconBtn(theme), fontSize:18 }}>←</button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:13, fontWeight:700, color:theme.text, fontFamily:"'Syne',system-ui,sans-serif" }}>{bookTitle}</div>
          <div style={{ fontSize:11, color:theme.muted, fontFamily:"'JetBrains Mono',monospace", marginTop:1 }}>
            {chapter?.title} · p.{pageIdx+1}/{totalPages}
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={addBookmark} title="Bookmark" style={{ ...iconBtn(theme), color: bookmarked ? '#e8c547' : theme.muted }}>
            {bookmarked ? '★' : '☆'}
          </button>
          <button onClick={() => { setShowChapters(v=>!v); setShowSettings(false) }} style={iconBtn(theme)}>☰</button>
          <button onClick={() => { setShowSettings(v=>!v); setShowChapters(false) }} style={iconBtn(theme)}>Aa</button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ position:'absolute', top:52, left:0, right:0, height:2, background:`${theme.muted}33`, zIndex:20 }}>
        <div style={{ height:'100%', width:`${progressPct}%`, background:'#9d7df5', transition:'width 0.5s', borderRadius:1 }} />
      </div>

      {/* ── The Book ── */}
      <div style={{ position:'relative', perspective:'2000px', width:'min(700px, 90vw)', height:'min(520px, 75vh)', marginTop:16 }}>

        {/* Book shadow */}
        <div style={{ position:'absolute', bottom:-20, left:'10%', right:'10%', height:30, background:theme.shadow, borderRadius:'50%', filter:'blur(20px)', opacity:0.6, zIndex:0 }} />

        {/* Book container */}
        <div style={{ position:'relative', width:'100%', height:'100%', display:'flex', transformStyle:'preserve-3d' }}>

          {/* Left page (current or previous) */}
          <div style={{
            flex:1, background:theme.page, borderRadius:'4px 0 0 4px',
            boxShadow:`-4px 0 20px ${theme.shadow}, inset -8px 0 20px rgba(0,0,0,0.08)`,
            padding:'36px 28px 36px 36px', overflow:'hidden', position:'relative',
            transform: flipping === 'backward' ? 'rotateY(0deg)' : undefined,
          }}>
            <PageContent
              text={currentText}
              fontSize={prefs.fontSize}
              fontFamily={prefs.fontFamily}
              lineHeight={prefs.lineHeight}
              color={theme.text}
              muted={theme.muted}
              pageNum={pageIdx + 1}
              side="left"
              chapterTitle={pageIdx === 0 ? chapter?.title : undefined}
            />
            {/* Page edge shadow */}
            <div style={{ position:'absolute', top:0, right:0, width:24, height:'100%', background:'linear-gradient(to left, rgba(0,0,0,0.12), transparent)', pointerEvents:'none' }} />
          </div>

          {/* Spine */}
          <div style={{ width:14, background:`linear-gradient(to right, ${theme.spine}, ${theme.page} 40%, ${theme.spine})`, boxShadow:'inset 0 0 8px rgba(0,0,0,0.2)', flexShrink:0 }} />

          {/* Right page — with 3D flip animation */}
          <div style={{
            flex:1, position:'relative', transformStyle:'preserve-3d',
            transform: flipping === 'forward' ? 'rotateY(-180deg)' : 'rotateY(0deg)',
            transition: flipping ? 'transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000)' : undefined,
            transformOrigin: 'left center',
          }}>
            {/* Front of turning page */}
            <div style={{
              position:'absolute', inset:0, backfaceVisibility:'hidden',
              background:theme.page, borderRadius:'0 4px 4px 0',
              boxShadow:`4px 0 20px ${theme.shadow}, inset 8px 0 20px rgba(0,0,0,0.05)`,
              padding:'36px 36px 36px 28px', overflow:'hidden',
            }}>
              <PageContent
                text={nextText}
                fontSize={prefs.fontSize}
                fontFamily={prefs.fontFamily}
                lineHeight={prefs.lineHeight}
                color={theme.text}
                muted={theme.muted}
                pageNum={pageIdx + 2}
                side="right"
                chapterTitle={pageIdx + 1 === 0 && chapterIdx < chapters.length - 1 ? chapters[chapterIdx + 1]?.title : undefined}
              />
              {/* Page edge shadow */}
              <div style={{ position:'absolute', top:0, left:0, width:24, height:'100%', background:'linear-gradient(to right, rgba(0,0,0,0.08), transparent)', pointerEvents:'none' }} />
            </div>

            {/* Back of turning page (underside revealed during flip) */}
            <div style={{
              position:'absolute', inset:0, backfaceVisibility:'hidden',
              background:theme.page, borderRadius:'4px 0 0 4px',
              transform:'rotateY(180deg)',
              padding:'36px 28px 36px 36px', overflow:'hidden',
              boxShadow:`-4px 0 20px ${theme.shadow}`,
            }}>
              <div style={{ color:theme.muted, fontSize:12, fontFamily:"'JetBrains Mono',monospace", opacity:0.4, textAlign:'center', paddingTop:'40%' }}>
                ◂
              </div>
            </div>
          </div>
        </div>

        {/* Backward flip animation overlay */}
        {flipping === 'backward' && (
          <div style={{
            position:'absolute', top:0, left:0, width:'50%', height:'100%',
            transformOrigin:'right center',
            animation:'flipBackward 0.6s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards',
            background:theme.page, zIndex:10, borderRadius:'4px 0 0 4px',
            boxShadow:`-4px 0 20px ${theme.shadow}`,
            padding:'36px 28px 36px 36px', overflow:'hidden',
          }}>
            <style>{`@keyframes flipBackward { from { transform: rotateY(180deg); } to { transform: rotateY(0deg); } }`}</style>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div style={{ display:'flex', alignItems:'center', gap:20, marginTop:20, zIndex:10 }}>
        <button
          onClick={() => turnPage('backward')}
          disabled={isFirstPage || !!flipping}
          style={{ ...navBtn(theme), opacity: isFirstPage ? 0.2 : 1 }}>
          ← Prev
        </button>

        <div style={{ fontSize:12, color:theme.muted, fontFamily:"'JetBrains Mono',monospace", minWidth:100, textAlign:'center' }}>
          {progressPct}% · {currentBookPage}/{totalBookPages}
        </div>

        <button
          onClick={() => turnPage('forward')}
          disabled={isLastPage || !!flipping}
          style={{ ...navBtn(theme), opacity: isLastPage ? 0.2 : 1 }}>
          Next →
        </button>
      </div>

      {/* ── Chapter list panel ── */}
      {showChapters && (
        <div style={{ position:'absolute', top:54, right:0, width:280, bottom:0, background:theme.page, borderLeft:`1px solid ${theme.muted}33`, zIndex:30, overflowY:'auto', boxShadow:`-8px 0 24px ${theme.shadow}` }}>
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${theme.muted}22`, fontSize:13, fontWeight:700, color:theme.text, fontFamily:"'Syne',system-ui,sans-serif" }}>
            Chapters
          </div>
          {chapters.map((ch, i) => (
            <button key={ch.id}
              onClick={() => { setChapterIdx(i); setPageIdx(0); setShowChapters(false) }}
              style={{ width:'100%', textAlign:'left', padding:'12px 18px', background: i===chapterIdx ? `${theme.muted}22` : 'transparent', border:'none', borderBottom:`1px solid ${theme.muted}11`, cursor:'pointer', color: i===chapterIdx ? '#9d7df5' : theme.text, fontFamily:"'Syne',system-ui,sans-serif", fontSize:12, fontWeight: i===chapterIdx ? 700 : 400 }}>
              <div style={{ fontSize:10, color:theme.muted, fontFamily:"'JetBrains Mono',monospace", marginBottom:3 }}>Ch. {ch.chapter_num}</div>
              {ch.title}
            </button>
          ))}
        </div>
      )}

      {/* ── Settings panel ── */}
      {showSettings && (
        <div style={{ position:'absolute', top:54, right:0, width:280, background:theme.page, border:`1px solid ${theme.muted}33`, borderTop:'none', zIndex:30, boxShadow:`-8px 8px 24px ${theme.shadow}`, padding:18 }}>
          {/* Theme */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:theme.muted, fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Theme</div>
            <div style={{ display:'flex', gap:8 }}>
              {(['dark','light','sepia'] as const).map(t => (
                <button key={t} onClick={() => setP('theme', t)}
                  style={{ flex:1, padding:'6px 0', borderRadius:5, border:`1px solid ${prefs.theme===t?'#9d7df5':'#44444466'}`, background: THEMES[t].page, color: THEMES[t].text, fontSize:11, cursor:'pointer', fontWeight: prefs.theme===t?700:400, fontFamily:"'Syne',system-ui,sans-serif" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:theme.muted, fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>
              Font Size — {prefs.fontSize}px
            </div>
            <input type="range" min={12} max={24} value={prefs.fontSize}
              onChange={e => setP('fontSize', Number(e.target.value))}
              style={{ width:'100%', accentColor:'#9d7df5' }} />
          </div>

          {/* Font family */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:theme.muted, fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Font</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {FONTS.map(f => (
                <button key={f.value} onClick={() => setP('fontFamily', f.value)}
                  style={{ padding:'6px 10px', borderRadius:5, border:`1px solid ${prefs.fontFamily===f.value?'#9d7df5':'#44444433'}`, background: prefs.fontFamily===f.value ? `${theme.muted}22` : 'transparent', color:theme.text, fontSize:12, cursor:'pointer', textAlign:'left', fontFamily:f.value }}>
                  {f.label} — The quick brown fox
                </button>
              ))}
            </div>
          </div>

          {/* Line height */}
          <div>
            <div style={{ fontSize:11, color:theme.muted, fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>
              Line Height — {prefs.lineHeight}
            </div>
            <input type="range" min={1.4} max={2.4} step={0.1} value={prefs.lineHeight}
              onChange={e => setP('lineHeight', Number(e.target.value))}
              style={{ width:'100%', accentColor:'#9d7df5' }} />
          </div>
        </div>
      )}

      {/* Click zones for page turn */}
      <div onClick={() => !showSettings && !showChapters && turnPage('backward')}
        style={{ position:'absolute', left:0, top:52, width:'25%', bottom:80, cursor: isFirstPage ? 'default' : 'w-resize', zIndex:5 }} />
      <div onClick={() => !showSettings && !showChapters && turnPage('forward')}
        style={{ position:'absolute', right:0, top:52, width:'25%', bottom:80, cursor: isLastPage ? 'default' : 'e-resize', zIndex:5 }} />
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────
function PageContent({ text, fontSize, fontFamily, lineHeight, color, muted, pageNum, side, chapterTitle }: any) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {chapterTitle && (
        <div style={{ fontSize: fontSize * 0.85, fontWeight:700, color, fontFamily, marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${muted}33`, letterSpacing:'-0.3px' }}>
          {chapterTitle}
        </div>
      )}
      <div style={{ flex:1, fontSize, fontFamily, lineHeight, color, textAlign:'justify', wordBreak:'break-word', overflow:'hidden' }}>
        {text}
      </div>
      <div style={{ fontSize:11, color:muted, fontFamily:"'JetBrains Mono',monospace", textAlign: side==='left' ? 'left' : 'right', marginTop:8 }}>
        {pageNum}
      </div>
    </div>
  )
}

function iconBtn(theme: typeof THEMES.dark): React.CSSProperties {
  return {
    background:'transparent', border:'none', cursor:'pointer',
    color:theme.muted, fontSize:16, padding:'6px 8px', borderRadius:6,
    fontFamily:"'Syne',system-ui,sans-serif", fontWeight:600,
  }
}

function navBtn(theme: typeof THEMES.dark): React.CSSProperties {
  return {
    padding:'8px 20px', borderRadius:6, border:`1px solid ${theme.muted}44`,
    background:'transparent', color:theme.muted, fontSize:12, cursor:'pointer',
    fontFamily:"'JetBrains Mono',monospace", fontWeight:600, transition:'all .15s',
  }
}
