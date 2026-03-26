'use client'

import { useState } from 'react'
import BookReader from '@/components/reader/BookReader'

interface Chapter {
  id:          string
  chapter_num: number
  title:       string
  content:     string
  word_count:  number
}

interface Props {
  bookId:    string
  bookTitle: string
  chapters:  Chapter[]
}

export default function AuthorBookPreview({ bookId, bookTitle, chapters }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const hasChapters = chapters.length > 0 && chapters.some(ch => ch.content)

  if (!hasChapters) return null

  return (
    <>
      <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #272635', fontSize:13, fontWeight:700, color:'#eeecf8' }}>
          Book Preview
        </div>
        <div style={{ padding:18, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:12, color:'#635e80' }}>
            Preview your book with 3D page flip reader
          </div>
          <button
            onClick={() => setPreviewOpen(true)}
            style={{
              padding:      '8px 16px',
              borderRadius: 7,
              background:   'rgba(157, 125, 245, 0.15)',
              color:        '#9d7df5',
              border:       '1px solid rgba(157, 125, 245, 0.4)',
              fontSize:     12,
              fontWeight:   600,
              cursor:       'pointer',
              fontFamily:   "'Syne', system-ui, sans-serif",
              display:      'flex',
              alignItems:   'center',
              gap:          6,
            }}
          >
            <span style={{ fontSize: 14 }}>📖</span>
            Preview
          </button>
        </div>
      </div>

      {previewOpen && (
        <div
          onClick={() => setPreviewOpen(false)}
          style={{
            position:   'fixed',
            inset:      0,
            background:  'rgba(0, 0, 0, 0.9)',
            zIndex:     1000,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:   '100%',
              height:  '100%',
              maxWidth: 900,
            }}
          >
            <div style={{
              position:   'absolute',
              top:        16,
              right:      16,
              zIndex:     1001,
            }}>
              <button
                onClick={() => setPreviewOpen(false)}
                style={{
                  background:  'rgba(255, 255, 255, 0.1)',
                  border:       '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  color:        '#fff',
                  fontSize:     14,
                  padding:      '10px 18px',
                  cursor:       'pointer',
                  fontFamily:   "'Syne', system-ui, sans-serif",
                  fontWeight:   600,
                }}
              >
                ✕ Close Preview
              </button>
            </div>
            <BookReader
              bookId={bookId}
              bookTitle={`${bookTitle} (Preview)`}
              chapters={chapters}
            />
          </div>
        </div>
      )}
    </>
  )
}
