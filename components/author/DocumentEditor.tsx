'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PDFDocument, rgb } from 'pdf-lib'

interface Page {
  id: string
  elements: CanvasElement[]
  background: string
}

interface CanvasElement {
  id: string
  type: 'text' | 'rect' | 'circle' | 'image' | 'line'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  src?: string
}

interface Props {
  bookId: string
  fileUrl: string
  storageKey: string
  onSave?: (edited: boolean) => void
}

type Tool = 'select' | 'text' | 'rect' | 'circle' | 'line' | 'image' | 'delete' | 'pan'

export default function DocumentEditor({ bookId, fileUrl, storageKey, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<any>(null)
  
  const [tool, setTool] = useState<Tool>('select')
  const [pages, setPages] = useState<Page[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [hasChanges, setHasChanges] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [selectedColor, setSelectedColor] = useState('#9d7df5')
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState('Arial')
  
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pdfPages, setPdfPages] = useState<any[]>([])

  // Load PDF and initialize fabric.js
  useEffect(() => {
    initEditor()
    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose()
      }
    }
  }, [fileUrl])

  async function initEditor() {
    setLoading(true)
    try {
      // Fetch PDF from URL
      const response = await fetch(fileUrl)
      const arrayBuffer = await response.arrayBuffer()
      
      // Load with pdf-lib for manipulation
      const pdf = await PDFDocument.load(arrayBuffer)
      setPdfDoc(pdf)
      
      const pageCount = pdf.getPageCount()
      const loadedPages: any[] = []
      
      for (let i = 0; i < pageCount; i++) {
        loadedPages.push(pdf.getPage(i))
      }
      setPdfPages(loadedPages)
      
      // Initialize pages with empty elements
      const initialPages: Page[] = Array.from({ length: pageCount }, (_, i) => ({
        id: `page-${i}`,
        elements: [],
        background: '#ffffff'
      }))
      setPages(initialPages)
      
      // Initialize fabric canvas
      if (canvasRef.current) {
        const { fabric } = await import('fabric')
        
        const canvas = new fabric.Canvas(canvasRef.current, {
          width: 612,  // Letter size width in points
          height: 792, // Letter size height in points
          backgroundColor: '#ffffff',
          selection: true,
          preserveObjectStacking: true
        })
        
        fabricRef.current = canvas
        
        // Handle object selection
        canvas.on('selection:created', () => setTool('select'))
        canvas.on('selection:updated', () => setTool('select'))
        canvas.on('selection:cleared', () => {})
        
        // Track changes
        canvas.on('object:modified', () => setHasChanges(true))
        canvas.on('object:added', () => setHasChanges(true))
        canvas.on('object:removed', () => setHasChanges(true))
        
        // Render first page
        await renderPage(0)
      }
    } catch (error) {
      console.error('Failed to load PDF:', error)
    }
    setLoading(false)
  }

  async function renderPage(pageIndex: number) {
    const canvas = fabricRef.current
    if (!canvas || !pdfPages[pageIndex]) return
    
    canvas.clear()
    
    const page = pages[pageIndex]
    
    // Render background
    canvas.backgroundColor = page?.background || '#ffffff'
    
    // Re-add all elements for this page
    if (page?.elements) {
      const { fabric } = await import('fabric')
      
      for (const el of page.elements) {
        let obj: any
        switch (el.type) {
          case 'text':
            obj = new fabric.IText(el.text || 'Text', {
              left: el.x,
              top: el.y,
              fontSize: el.fontSize || 16,
              fontFamily: el.fontFamily || 'Arial',
              fill: el.fill || '#000000'
            })
            break
          case 'rect':
            obj = new fabric.Rect({
              left: el.x,
              top: el.y,
              width: el.width || 100,
              height: el.height || 100,
              fill: el.fill || 'transparent',
              stroke: el.stroke || '#000000',
              strokeWidth: el.strokeWidth || 1
            })
            break
          case 'circle':
            obj = new fabric.Circle({
              left: el.x,
              top: el.y,
              radius: el.radius || 50,
              fill: el.fill || 'transparent',
              stroke: el.stroke || '#000000',
              strokeWidth: el.strokeWidth || 1
            })
            break
          case 'line':
            obj = new fabric.Line([el.x, el.y, (el.x || 0) + (el.width || 100), el.y + (el.height || 0)], {
              stroke: el.stroke || '#000000',
              strokeWidth: el.strokeWidth || 1
            })
            break
        }
        if (obj) {
          canvas.add(obj)
        }
      }
    }
    
    canvas.renderAll()
  }

  function handleCanvasClick(e: any) {
    const canvas = fabricRef.current
    if (!canvas) return
    
    const pointer = canvas.getPointer(e.e)
    
    if (tool === 'text') {
      addText(pointer.x, pointer.y)
    } else if (tool === 'rect') {
      addRect(pointer.x, pointer.y)
    } else if (tool === 'circle') {
      addCircle(pointer.x, pointer.y)
    }
  }

  async function addText(x: number, y: number) {
    const { fabric } = await import('fabric')
    const canvas = fabricRef.current
    
    const text = new fabric.IText('Click to edit', {
      left: x,
      top: y,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: selectedColor
    })
    
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    setHasChanges(true)
    
    updatePageElements(currentPage, canvas.getObjects())
  }

  async function addRect(x: number, y: number) {
    const { fabric } = await import('fabric')
    const canvas = fabricRef.current
    
    const rect = new fabric.Rect({
      left: x,
      top: y,
      width: 150,
      height: 100,
      fill: 'transparent',
      stroke: selectedColor,
      strokeWidth: 2
    })
    
    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
    setHasChanges(true)
    
    updatePageElements(currentPage, canvas.getObjects())
  }

  async function addCircle(x: number, y: number) {
    const { fabric } = await import('fabric')
    const canvas = fabricRef.current
    
    const circle = new fabric.Circle({
      left: x,
      top: y,
      radius: 50,
      fill: 'transparent',
      stroke: selectedColor,
      strokeWidth: 2
    })
    
    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
    setHasChanges(true)
    
    updatePageElements(currentPage, canvas.getObjects())
  }

  function updatePageElements(pageIndex: number, objects: any[]) {
    const elements: CanvasElement[] = objects.map((obj: any, i: number) => {
      const base = {
        id: `el-${i}`,
        x: obj.left || 0,
        y: obj.top || 0
      }
      
      if (obj.type === 'i-text' || obj.type === 'text') {
        return { ...base, type: 'text' as const, text: obj.text, fontSize: obj.fontSize, fontFamily: obj.fontFamily, fill: obj.fill }
      } else if (obj.type === 'rect') {
        return { ...base, type: 'rect' as const, width: obj.width, height: obj.height, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth }
      } else if (obj.type === 'circle') {
        return { ...base, type: 'circle' as const, radius: obj.radius, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth }
      } else if (obj.type === 'line') {
        return { ...base, type: 'line' as const, width: obj.width, height: obj.height, stroke: obj.stroke, strokeWidth: obj.strokeWidth }
      }
      return base
    })
    
    setPages(prev => {
      const updated = [...prev]
      updated[pageIndex] = { ...updated[pageIndex], elements }
      return updated
    })
  }

  function deleteSelected() {
    const canvas = fabricRef.current
    if (!canvas) return
    
    const active = canvas.getActiveObjects()
    if (active.length > 0) {
      active.forEach(obj => canvas.remove(obj))
      canvas.discardActiveObject()
      canvas.renderAll()
      setHasChanges(true)
      updatePageElements(currentPage, canvas.getObjects())
    }
  }

  async function saveDocument() {
    setSaving(true)
    try {
      const canvas = fabricRef.current
      if (!canvas || !pdfDoc) {
        alert('No document to save')
        return
      }
      
      // Export canvas as PNG
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      })
      
      // Convert data URL to array buffer
      const base64 = dataUrl.split(',')[1]
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // Embed the edited page into the PDF
      const editedPdf = await PDFDocument.create()
      const editedPageImage = await editedPdf.embedPng(bytes)
      
      const newPage = editedPdf.addPage([612, 792])
      newPage.drawImage(editedPageImage, {
        x: 0,
        y: 0,
        width: 612,
        height: 792
      })
      
      // Save to server
      const pdfBytes = await newPage.doc.save()
      
      const formData = new FormData()
      formData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'edited-book.pdf')
      
      const res = await fetch(`/api/books/${bookId}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storageKey: storageKey,
          pageIndex: currentPage,
          imageData: dataUrl
        })
      })
      
      if (res.ok) {
        setHasChanges(false)
        alert('Page saved successfully!')
        onSave?.(true)
      } else {
        throw new Error('Failed to save')
      }
      
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save document')
    }
    setSaving(false)
  }

  async function exportPdf() {
    const canvas = fabricRef.current
    if (!canvas) return
    
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    })
    
    // Trigger download
    const link = document.createElement('a')
    link.download = `edited-page-${currentPage + 1}.png`
    link.href = dataUrl
    link.click()
  }

  function zoomIn() {
    setZoom(z => Math.min(z + 0.25, 3))
  }

  function zoomOut() {
    setZoom(z => Math.max(z - 0.25, 0.5))
  }

  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.setZoom(zoom)
      fabricRef.current.renderAll()
    }
  }, [zoom])

  useEffect(() => {
    renderPage(currentPage)
  }, [currentPage])

  const colors = ['#9d7df5', '#3dd6a3', '#f07060', '#e8c547', '#5ba4f5', '#000000', '#ffffff']

  if (loading) {
    return (
      <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, padding:40, textAlign:'center' }}>
        <div style={{ fontSize:20, marginBottom:12 }}>⟳</div>
        <div style={{ color:'#635e80' }}>Loading document editor...</div>
      </div>
    )
  }

  return (
    <div style={{ background:'#151420', border:'1px solid #272635', borderRadius:10, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #272635', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14, fontWeight:700, color:'#eeecf8' }}>📝 Document Editor</span>
          {hasChanges && <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'rgba(232,197,71,0.2)', color:'#e8c547' }}>Unsaved</span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportPdf} style={{ padding:'6px 12px', borderRadius:6, background:'transparent', border:'1px solid #272635', color:'#635e80', fontSize:12, cursor:'pointer' }}>
            ↓ Export PNG
          </button>
          <button onClick={saveDocument} disabled={saving} style={{ padding:'6px 12px', borderRadius:6, background: saving ? '#272635' : '#3dd6a3', border:'none', color: saving ? '#635e80' : '#0c0c10', fontSize:12, fontWeight:600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '⟳ Saving...' : '💾 Save'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding:'8px 12px', borderBottom:'1px solid #272635', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        {/* Tools */}
        <div style={{ display:'flex', gap:4 }}>
          {[
            { key: 'select', icon: '⬚', label: 'Select' },
            { key: 'text', icon: 'T', label: 'Text' },
            { key: 'rect', icon: '▢', label: 'Rectangle' },
            { key: 'circle', icon: '○', label: 'Circle' },
            { key: 'line', icon: '/', label: 'Line' },
            { key: 'delete', icon: '✕', label: 'Delete' },
          ].map(t => (
            <button key={t.key} onClick={() => t.key === 'delete' ? deleteSelected() : setTool(t.key as Tool)}
              style={{ width:36, height:36, borderRadius:6, background: tool === t.key ? 'rgba(157,125,245,0.2)' : 'transparent', border:`1px solid ${tool === t.key ? '#9d7df5' : '#272635'}`, color: tool === t.key ? '#9d7df5' : '#635e80', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
              title={t.label}>
              {t.icon}
            </button>
          ))}
        </div>

        <div style={{ width:1, height:24, background:'#272635' }} />

        {/* Colors */}
        <div style={{ display:'flex', gap:4 }}>
          {colors.map(c => (
            <button key={c} onClick={() => setSelectedColor(c)}
              style={{ width:24, height:24, borderRadius:4, background:c, border:`2px solid ${selectedColor === c ? '#ffffff' : 'transparent'}`, cursor:'pointer' }} />
          ))}
        </div>

        <div style={{ width:1, height:24, background:'#272635' }} />

        {/* Font size */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:'#635e80' }}>Size:</span>
          <input type="range" min={10} max={72} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
            style={{ width:80, accentColor:'#9d7df5' }} />
          <span style={{ fontSize:11, color:'#eeecf8', width:30 }}>{fontSize}</span>
        </div>

        <div style={{ width:1, height:24, background:'#272635' }} />

        {/* Zoom */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={zoomOut} style={{ width:28, height:28, borderRadius:4, background:'#272635', border:'none', color:'#635e80', cursor:'pointer' }}>−</button>
          <span style={{ fontSize:11, color:'#eeecf8', minWidth:50, textAlign:'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} style={{ width:28, height:28, borderRadius:4, background:'#272635', border:'none', color:'#635e80', cursor:'pointer' }}>+</button>
        </div>
      </div>

      {/* Editor Area */}
      <div style={{ display:'flex', height:500 }}>
        {/* Page Thumbnails */}
        <div style={{ width:100, background:'#0c0a14', borderRight:'1px solid #272635', overflowY:'auto', padding:8 }}>
          {pages.map((_, i) => (
            <div key={i} onClick={() => setCurrentPage(i)}
              style={{ padding:4, marginBottom:8, borderRadius:6, background: currentPage === i ? 'rgba(157,125,245,0.2)' : 'transparent', border:`2px solid ${currentPage === i ? '#9d7df5' : 'transparent'}`, cursor:'pointer' }}>
              <div style={{ width:'100%', aspectRatio:'8.5/11', background:'#ffffff', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#999' }}>
                {i + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div ref={containerRef} style={{ flex:1, background:'#2a2a32', overflow:'auto', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ transform:`scale(${zoom})`, transformOrigin:'center' }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{ boxShadow:'0 8px 32px rgba(0,0,0,0.5)', cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ padding:'8px 16px', borderTop:'1px solid #272635', display:'flex', justifyContent:'space-between', fontSize:11, color:'#635e80', fontFamily:"'JetBrains Mono',monospace" }}>
        <span>Page {currentPage + 1} of {pages.length}</span>
        <span>Tool: {tool} | Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  )
}
