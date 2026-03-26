'use client'

import { useState } from 'react'

interface Props {
  bookId: string
  bookTitle: string
}

export default function BookPreview({ bookId, bookTitle }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <>
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

      {previewOpen && (
        <div
          onClick={() => setPreviewOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: 900,
            }}
          >
            <div style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1001,
            }}>
              <button
                onClick={() => setPreviewOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontFamily: "'Syne', system-ui, sans-serif",
                  fontWeight: 600,
                }}
              >
                ✕ Close
              </button>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#635e80',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#eeecf8', marginBottom: 8 }}>{bookTitle}</div>
                <div style={{ fontSize: 13 }}>Book reader coming soon</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
