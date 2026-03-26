'use client'

import { useState, useEffect } from 'react'
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
      <button
        onClick={() => setPreviewOpen(true)}
        style={{
          padding:      '9px 18px',
          borderRadius: 7,
          background:   'rgba(157, 125, 245, 0.12)',
          color:        '#9d7df5',
          border:       '1px solid rgba(157, 125, 245, 0.3)',
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
        Preview Book
      </button>

      {previewOpen && (
        <div
          onClick={() => setPreviewOpen(false)}
          style={{
            position:   'fixed',
            inset:      0,
            background:  'rgba(0, 0, 0, 0.85)',
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
                  border:       'none',
                  borderRadius: 8,
                  color:        '#fff',
                  fontSize:     16,
                  padding:      '8px 14px',
                  cursor:       'pointer',
                  fontFamily:   "'Syne', system-ui, sans-serif",
                }}
              >
                Close Preview
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
