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
  const EPub = (await import('epub')).default
  const parser = new EPub(buffer)
  await parser.parse()

  const chapters: string[] = []
  for (const item of parser.spine.contents) {
    try {
      const text = await parser.getChapter(item.id)
      chapters.push(text.replace(/<[^>]+>/g, ' '))
    } catch {}
  }

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
