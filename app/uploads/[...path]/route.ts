import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

type Params = { params: { path: string[] } }

export async function GET(req: NextRequest, { params }: Params) {
  const filePath = params.path.join('/')
  const projectRoot = process.cwd()
  
  const possiblePaths = [
    path.join(projectRoot, 'uploads', 'books', filePath),
    path.join(projectRoot, 'uploads', filePath),
  ]

  let resolved = ''
  for (const p of possiblePaths) {
    try {
      const stat = await fs.stat(p)
      if (stat.isFile()) {
        resolved = p
        break
      }
    } catch {}
  }

  if (!resolved) {
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
}
