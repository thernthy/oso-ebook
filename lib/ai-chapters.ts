/**
 * lib/ai-chapters.ts
 * Uses OpenAI GPT-4 to:
 *  1. Detect chapters from raw book text
 *  2. Auto-arrange chapters in correct narrative order
 *  3. Validate/clean chapter titles
 */
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ─── Types ────────────────────────────────────────────────────
export interface DetectedChapter {
  chapter_num:  number
  title:        string
  content:      string
  word_count:   number
  confidence:   number  // 0-1, how confident AI is about this split
}

export interface AIChapterResult {
  chapters:       DetectedChapter[]
  total_chapters: number
  summary:        string   // AI's brief summary of the book
  language:       string   // detected language
  warnings:       string[] // any issues found
}

// ─── Detect chapters from raw text ───────────────────────────
export async function detectChapters(rawText: string): Promise<AIChapterResult> {
  // Trim text — GPT-4 has token limits; send first ~60k chars for structure detection
  // then re-split full text based on detected boundaries
  const MAX_CHARS   = 60_000
  const sampleText  = rawText.length > MAX_CHARS
    ? rawText.slice(0, MAX_CHARS) + '\n\n[...text truncated for analysis...]'
    : rawText

  const structureResponse = await openai.chat.completions.create({
    model:       'gpt-4-turbo',
    max_tokens:  4000,
    temperature: 0.1,  // low temperature = consistent, structured output
    messages: [
      {
        role:    'system',
        content: `You are a professional book editor analyzing book manuscripts.
Your task is to identify chapter boundaries and structure from raw book text.

IMPORTANT RULES:
- Always respond with valid JSON only, no markdown, no explanation
- Detect ALL chapters including prologue, epilogue, appendix
- If no clear chapters exist, treat the whole text as one chapter
- Keep titles exactly as they appear in the text
- Detect the book's language
- Note any structural issues (missing chapters, numbering gaps, etc.)`,
      },
      {
        role:    'user',
        content: `Analyze this book text and identify all chapter boundaries.

Return a JSON object with this exact structure:
{
  "language": "English",
  "summary": "Brief 2-sentence book summary",
  "warnings": ["any issues found"],
  "chapters": [
    {
      "chapter_num": 1,
      "title": "Chapter title as it appears",
      "start_marker": "First few words of this chapter to locate it",
      "confidence": 0.95
    }
  ]
}

Book text:
---
${sampleText}`,
      },
    ],
  })

  const raw = structureResponse.choices[0].message.content || '{}'
  let structure: any

  try {
    structure = JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    // Fallback: treat entire text as one chapter
    structure = {
      language: 'Unknown',
      summary:  'Could not parse book structure.',
      warnings: ['AI could not detect chapter structure. Created single chapter.'],
      chapters: [{ chapter_num: 1, title: 'Chapter 1', start_marker: rawText.slice(0, 50), confidence: 0.3 }],
    }
  }

  // Now split the FULL text using detected start markers
  const chapters = splitTextByMarkers(rawText, structure.chapters || [])

  return {
    chapters,
    total_chapters: chapters.length,
    summary:        structure.summary || '',
    language:       structure.language || 'Unknown',
    warnings:       structure.warnings || [],
  }
}

// ─── Auto-arrange: re-order chapters correctly ────────────────
export async function autoArrangeChapters(
  chapters: { id: string; title: string; chapter_num: number; content_preview: string }[]
): Promise<{ id: string; new_chapter_num: number; reason: string }[]> {

  const response = await openai.chat.completions.create({
    model:       'gpt-4-turbo',
    max_tokens:  2000,
    temperature: 0.1,
    messages: [
      {
        role:    'system',
        content: `You are a book editor. Your task is to determine the correct narrative order of chapters.
Respond with valid JSON only. No markdown, no explanation.`,
      },
      {
        role:    'user',
        content: `These book chapters may be out of order. Determine the correct reading sequence.

Chapters:
${chapters.map(c => `ID: ${c.id} | Num: ${c.chapter_num} | Title: "${c.title}" | Preview: "${c.content_preview}"`).join('\n')}

Return JSON array:
[
  { "id": "chapter-id", "new_chapter_num": 1, "reason": "This appears to be the opening chapter because..." },
  ...
]

Sort by correct narrative order. If a chapter is already in the right place, still include it.`,
      },
    ],
  })

  const raw = response.choices[0].message.content || '[]'
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    // Return unchanged order on parse failure
    return chapters.map(c => ({ id: c.id, new_chapter_num: c.chapter_num, reason: 'Unchanged' }))
  }
}

// ─── Validate & clean a single chapter's content ─────────────
export async function validateChapter(
  title:   string,
  content: string
): Promise<{ cleaned_title: string; issues: string[] }> {

  const response = await openai.chat.completions.create({
    model:       'gpt-4-turbo',
    max_tokens:  500,
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: 'You are a book editor. Check chapter titles and flag issues. Respond with JSON only.',
      },
      {
        role: 'user',
        content: `Check this chapter:
Title: "${title}"
Content preview: "${content.slice(0, 500)}"

Return: { "cleaned_title": "corrected title", "issues": ["list of issues or empty array"] }`,
      },
    ],
  })

  try {
    const raw = response.choices[0].message.content || '{}'
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return { cleaned_title: title, issues: [] }
  }
}

// ─── Helper: split raw text into chapter segments ─────────────
function splitTextByMarkers(
  fullText: string,
  detected: { chapter_num: number; title: string; start_marker: string; confidence: number }[]
): DetectedChapter[] {
  if (!detected.length) {
    return [{
      chapter_num: 1,
      title:       'Chapter 1',
      content:     fullText,
      word_count:  fullText.trim().split(/\s+/).length,
      confidence:  0.5,
    }]
  }

  const results: DetectedChapter[] = []

  for (let i = 0; i < detected.length; i++) {
    const current = detected[i]
    const next    = detected[i + 1]

    // Find start position of this chapter
    const startIdx = current.start_marker
      ? fullText.indexOf(current.start_marker)
      : 0

    // Find start position of next chapter (this chapter ends there)
    const endIdx = next?.start_marker
      ? fullText.indexOf(next.start_marker, startIdx + 1)
      : fullText.length

    const content    = fullText.slice(startIdx < 0 ? 0 : startIdx, endIdx < 0 ? fullText.length : endIdx).trim()
    const word_count = content.split(/\s+/).length

    results.push({
      chapter_num: current.chapter_num,
      title:       current.title,
      content,
      word_count,
      confidence:  current.confidence ?? 0.8,
    })
  }

  return results.filter(c => c.content.length > 50) // drop empty segments
}
