/**
 * lib/parsers/index.ts
 * Extracts raw text from uploaded book files.
 * Each format has its own parser; all return { text, pageCount? }
 */

export interface ParseResult {
  text:       string
  pageCount?: number
  wordCount:  number
}

// ─── PDF ──────────────────────────────────────────────────────
async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  const pdfParse = (await import('pdf-parse')).default
  const data     = await pdfParse(buffer)
  return {
    text:      data.text,
    pageCount: data.numpages,
    wordCount: data.text.trim().split(/\s+/).length,
  }
}

// ─── DOCX ─────────────────────────────────────────────────────
async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  const mammoth = await import('mammoth')
  const result  = await mammoth.extractRawText({ buffer })
  return {
    text:      result.value,
    wordCount: result.value.trim().split(/\s+/).length,
  }
}

// ─── EPUB ─────────────────────────────────────────────────────
async function parseEpub(buffer: Buffer): Promise<ParseResult> {
  // Write to tmp file — epub parser needs a path
  const { EPub } = await import('epub2')
  const os       = await import('os')
  const fs       = await import('fs/promises')
  const path     = await import('path')

  const tmpPath = path.join(os.tmpdir(), `oso-${Date.now()}.epub`)
  await fs.writeFile(tmpPath, buffer)

  const book = await EPub.createAsync(tmpPath)
  const chapters: string[] = []

  for (const chapter of book.flow) {
    try {
      const text = await new Promise<string>((res, rej) => {
        book.getChapter(chapter.id, (err: any, txt: string) => {
          if (err) rej(err)
          else res(txt.replace(/<[^>]+>/g, ' '))
        })
      })
      chapters.push(text)
    } catch {}
  }

  await fs.unlink(tmpPath).catch(() => {})

  const fullText = chapters.join('\n\n')
  return {
    text:      fullText,
    wordCount: fullText.trim().split(/\s+/).length,
  }
}

// ─── TXT ──────────────────────────────────────────────────────
async function parseTxt(buffer: Buffer): Promise<ParseResult> {
  const text = buffer.toString('utf-8')
  return {
    text,
    wordCount: text.trim().split(/\s+/).length,
  }
}

// ─── Main dispatcher ──────────────────────────────────────────
export async function parseBookFile(
  buffer: Buffer,
  format: 'pdf' | 'epub' | 'docx' | 'txt'
): Promise<ParseResult> {
  switch (format) {
    case 'pdf':  return parsePdf(buffer)
    case 'docx': return parseDocx(buffer)
    case 'epub': return parseEpub(buffer)
    case 'txt':  return parseTxt(buffer)
    default:     throw new Error(`Unsupported format: ${format}`)
  }
}

// ─── Detect format from MIME or extension ─────────────────────
export function detectFormat(
  filename:  string,
  mimeType?: string
): 'pdf' | 'epub' | 'docx' | 'txt' | null {
  const ext  = filename.split('.').pop()?.toLowerCase()
  const mime = mimeType?.toLowerCase() || ''

  if (ext === 'pdf'  || mime.includes('pdf'))                                   return 'pdf'
  if (ext === 'epub' || mime.includes('epub'))                                  return 'epub'
  if (ext === 'docx' || mime.includes('wordprocessingml') || mime.includes('msword')) return 'docx'
  if (ext === 'txt'  || mime.includes('text/plain'))                            return 'txt'
  return null
}
