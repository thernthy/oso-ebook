/**
 * lib/parsers.ts
 * File format detection and parsing utilities
 */

export function detectFormat(filename: string, mimeType: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const formatMap: Record<string, string> = {
    pdf: 'pdf',
    epub: 'epub',
    docx: 'docx',
    txt: 'txt',
  }
  
  if (ext && formatMap[ext]) return formatMap[ext]
  
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('epub')) return 'epub'
  if (mimeType.includes('word')) return 'docx'
  if (mimeType.includes('text')) return 'txt'
  
  return null
}

export async function parseBookFile(buffer: Buffer, format: string): Promise<{ text: string; wordCount: number }> {
  let text = ''
  
  switch (format) {
    case 'txt':
      text = buffer.toString('utf-8')
      break
    case 'pdf':
      text = await parsePDF(buffer)
      break
    case 'docx':
      text = await parseDOCX(buffer)
      break
    case 'epub':
      text = await parseEPUB(buffer)
      break
    default:
      text = buffer.toString('utf-8')
  }
  
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  return { text, wordCount }
}

async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text
  } catch (e) {
    console.error('PDF parsing error:', e)
    return ''
  }
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (e) {
    console.error('DOCX parsing error:', e)
    return ''
  }
}

async function parseEPUB(buffer: Buffer): Promise<string> {
  try {
    const epub = (await import('epub')).default
    const parser = new epub(buffer as any)
    await parser.parse()
    const chapters: string[] = []
    for (const item of parser.spine.contents) {
      try {
        const text = await parser.getChapter(item.id)
        chapters.push(text.replace(/<[^>]+>/g, ' '))
      } catch {}
    }
    return chapters.join('\n\n')
  } catch (e) {
    console.error('EPUB parsing error:', e)
    return ''
  }
}
