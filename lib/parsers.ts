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
    const EPub = (await import('epub2')).EPub
    return new Promise((resolve) => {
      const parser = new EPub(buffer as any)
      parser.on('end', () => {
        const texts = parser.flow.map((section: any) => section.data || '').join('\n')
        resolve(texts)
      })
      parser.on('error', () => resolve(''))
      parser.parse()
    })
  } catch (e) {
    console.error('EPUB parsing error:', e)
    return ''
  }
}
