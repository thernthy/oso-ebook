'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const DocumentEditor = dynamic(() => import('./DocumentEditor'), { ssr: false })

interface Props {
  bookId: string
}

interface BookFile {
  id: string
  format: string
  original_name: string
  file_size: number
  storage_key: string
  uploaded_at: string
}

export default function FileViewer({ bookId }: Props) {
  const [file, setFile] = useState<BookFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    fetchFile()
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }
  }, [bookId])

  async function fetchFile() {
    try {
      const res = await fetch(`/api/books/${bookId}/files`)
      const data = await res.json()
      if (data.success && data.data.files?.length > 0) {
        const latestFile = data.data.files[0]
        setFile(latestFile)
        
        // Create URL for PDF
        if (latestFile.storage_key) {
          const url = `/uploads/${latestFile.storage_key}`
          setPdfUrl(url)
        }
      }
    } catch (e) {
      console.error('Failed to fetch file:', e)
    } finally {
      setLoading(false)
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #272635', fontSize:13, fontWeight:700, color:'#eeecf8' }}>
          Book File
        </div>
        <div style={{ padding:32, textAlign:'center', color:'#635e80' }}>Loading...</div>
      </div>
    )
  }

  if (!file) {
    return (
      <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #272635', fontSize:13, fontWeight:700, color:'#eeecf8' }}>
          Book File
        </div>
        <div style={{ padding:32, textAlign:'center', color:'#635e80' }}>
          <div style={{ fontSize:24, marginBottom:8 }}>📄</div>
          <div style={{ fontSize:12 }}>No file uploaded yet</div>
        </div>
      </div>
    )
  }

  if (showEditor && pdfUrl && file) {
    return (
      <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #272635', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => setShowEditor(false)} style={{ padding:'6px 12px', borderRadius:6, background:'transparent', border:'1px solid #272635', color:'#635e80', fontSize:12, cursor:'pointer' }}>
              ← Back to Preview
            </button>
            <span style={{ fontSize:14, fontWeight:700, color:'#eeecf8' }}>Edit Mode</span>
          </div>
        </div>
        <DocumentEditor
          bookId={bookId}
          fileUrl={pdfUrl}
          storageKey={file.storage_key}
          onSave={() => {
            setShowEditor(false)
            fetchFile()
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #272635', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#eeecf8' }}>Book File</div>
        <div style={{ display:'flex', gap:8 }}>
          {file.format === 'pdf' && pdfUrl && (
            <button onClick={() => setShowEditor(true)}
              style={{ padding:'4px 10px', borderRadius:4, background:'rgba(157,125,245,0.12)', color:'#9d7df5', fontSize:11, fontWeight:600, border:'none', cursor:'pointer', fontFamily:"'JetBrains Mono',monospace" }}>
              ✏️ Edit
            </button>
          )}
          {pdfUrl && (
            <a href={pdfUrl} download={file.original_name}
              style={{ padding:'4px 10px', borderRadius:4, background:'rgba(61,214,163,0.12)', color:'#3dd6a3', fontSize:11, fontWeight:600, textDecoration:'none', fontFamily:"'JetBrains Mono',monospace" }}>
              ↓ Download
            </a>
          )}
        </div>
      </div>

      <div style={{ padding:18 }}>
        {/* File info */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:40, height:40, borderRadius:8, background:'rgba(240,112,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
            📕
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#eeecf8' }}>{file.original_name}</div>
            <div style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>
              {file.format.toUpperCase()} · {formatBytes(file.file_size)}
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        {file.format === 'pdf' && pdfUrl && (
          <div style={{ border:'1px solid #272635', borderRadius:8, overflow:'hidden', background:'#1b1a28' }}>
            {/* Toolbar */}
            <div style={{ padding:'8px 12px', borderBottom:'1px solid #272635', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0c0a14' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                  style={{ padding:'4px 8px', borderRadius:4, background:'#272635', border:'none', color:'#635e80', cursor:'pointer', fontSize:12 }}>−</button>
                <span style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace", minWidth:50, textAlign:'center' }}>
                  {Math.round(scale * 100)}%
                </span>
                <button onClick={() => setScale(s => Math.min(2, s + 0.25))}
                  style={{ padding:'4px 8px', borderRadius:4, background:'#272635', border:'none', color:'#635e80', cursor:'pointer', fontSize:12 }}>+</button>
              </div>
              <div style={{ fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>
                {currentPage} / {totalPages || '?'}
              </div>
            </div>
            
            {/* PDF Embed */}
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&page=${currentPage}`}
              style={{ 
                width: '100%', 
                height: 500, 
                border: 'none',
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
              }}
              title="PDF Viewer"
            />
          </div>
        )}

        {/* Non-PDF files */}
        {file.format !== 'pdf' && (
          <div style={{ padding:24, textAlign:'center', background:'#1b1a28', borderRadius:8 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📄</div>
            <div style={{ fontSize:12, color:'#635e80' }}>
              {file.format.toUpperCase()} file - Download to view
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
