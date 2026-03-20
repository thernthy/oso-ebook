import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

type Params = { params: { path: string[] } }

export async function GET(req: NextRequest, { params }: Params) {
  const filePath = params.path.join('/')
  const baseDir = process.env.UPLOAD_DIR || 'uploads'
  const fullPath = path.join(process.cwd(), baseDir, filePath)

  try {
    const resolved = path.resolve(fullPath)
    const baseResolved = path.resolve(process.cwd(), baseDir)
    
    if (!resolved.startsWith(baseResolved)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stat = await fs.stat(resolved)
    if (!stat.isFile()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const ext = path.extname(resolved).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.epub': 'application/epub+zip',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    }

    const contentType = mimeTypes[ext] || 'application/octet-stream'
    const file = await fs.readFile(resolved)

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
