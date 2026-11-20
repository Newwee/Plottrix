/**
 * Smart Thai Manuscript Parser
 * Extracts metadata, chapters, word counts, and character profiles
 * from Markdown (.md), Plain Text (.txt), and Word Document (.docx) files.
 */

import mammoth from 'mammoth'

/**
 * Normalizes text to uniform Unix newlines and removes byte-order marks
 */
export function normalizeText(text) {
  if (!text) return ''
  return text
    .replace(/^\uFEFF/, '') // remove UTF-8 BOM
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
}

/**
 * Reads a File object and returns clean text string
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function readFileToText(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return normalizeText(result.value)
  }

  // .md, .txt, or other text formats
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(normalizeText(e.target.result))
    reader.onerror = (e) => reject(new Error('ไม่สามารถอ่านไฟล์ได้ กรุณาลองใหม่อีกครั้ง'))
    reader.readAsText(file, 'utf-8')
  })
}

/**
 * Parses supplementary character file (e.g. Character_State.md)
 * @param {string} text
 * @returns {Array<object>}
 */
export function parseSupplementaryCharacters(text) {
  if (!text) return []
  const normalized = normalizeText(text)
  const lines = normalized.split('\n')
  const characters = []

  let currentChar = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Detect heading like "### นายธาม กิตติโภคิน" or "## ธาม"
    const headingMatch = line.match(/^#+\s*(.+)$/)
    if (headingMatch) {
      if (currentChar && currentChar.name) {
        characters.push(currentChar)
      }
      const rawName = headingMatch[1].replace(/[*_]/g, '').trim()
      currentChar = {
        name: rawName,
        role: 'ตัวละครหลัก',
        description: '',
        traits: '',
        secrets: ''
      }
      continue
    }

    if (currentChar) {
      if (/^(บทบาท|Role)[:：]/i.test(line)) {
        currentChar.role = line.replace(/^(บทบาท|Role)[:：]\s*/i, '').trim()
      } else if (/^(ลักษณะนิสัย|นิสัย|Traits)[:：]/i.test(line)) {
        currentChar.traits = line.replace(/^(ลักษณะนิสัย|นิสัย|Traits)[:：]\s*/i, '').trim()
      } else if (/^(ความลับ|Secrets)[:：]/i.test(line)) {
        currentChar.secrets = line.replace(/^(ความลับ|Secrets)[:：]\s*/i, '').trim()
      } else {
        currentChar.description = (currentChar.description ? currentChar.description + ' ' : '') + line
      }
    }
  }

  if (currentChar && currentChar.name) {
    characters.push(currentChar)
  }

  return characters
}

/**
 * Main Thai Manuscript Parser
 * @param {string} rawText
 * @param {string|null} supplementaryLoreText
 * @returns {object}
 */
export function parseThaiManuscript(rawText, supplementaryLoreText = null) {
  const normalized = normalizeText(rawText)
  const lines = normalized.split('\n')

  const result = {
    metadata: {
      title: '',
      arc: '',
      author: '',
      genre: '',
      version: ''
    },
    chapters: [],
    characters: []
  }

  // 1. Detect Metadata in first 50 lines before chapters
  const headerLines = lines.slice(0, 50)
  for (let i = 0; i < headerLines.length; i++) {
    const line = headerLines[i].trim()
    if (!line) continue

    // Hit chapter heading -> stop metadata scan
    if (/^(#+\s*)?(ตอนที่|บทที่|Chapter)\s*\d+/i.test(line)) break

    // Title: first level-1 heading
    if (!result.metadata.title) {
      const titleMatch = line.match(/^#\s+(.+)$/)
      if (titleMatch) {
        result.metadata.title = titleMatch[1].replace(/[*_]/g, '').trim()
        continue
      }
    }

    // Arc / Volume
    if (!result.metadata.arc) {
      const arcMatch = line.match(/^(?:##\s*)?(ARC\s*\d+[^:]*:[^\n]+|ภาค\s*\d+[^:]*:[^\n]+|เล่มที่\s*\d+[^:]*:[^\n]+)/i)
      if (arcMatch) {
        result.metadata.arc = arcMatch[1].replace(/^##\s*/, '').replace(/[*_]/g, '').trim()
        continue
      }
    }

    // Author
    const authorMatch = line.match(/(?:\*{1,2})?(?:ผู้เขียน|Author)[:：](?:\*{1,2})?\s*([^\n*]+)/i)
    if (authorMatch && !result.metadata.author) {
      result.metadata.author = authorMatch[1].replace(/[*_]/g, '').trim()
      continue
    }

    // Genre
    const genreMatch = line.match(/(?:\*{1,2})?(?:แนว|หมวดหมู่|Genre)[:：](?:\*{1,2})?\s*([^\n*]+)/i)
    if (genreMatch && !result.metadata.genre) {
      result.metadata.genre = genreMatch[1].replace(/[*_]/g, '').trim()
      continue
    }

    // Version
    const verMatch = line.match(/(?:\*{1,2})?(?:เวอร์ชัน|Version)[:：](?:\*{1,2})?\s*([^\n*]+)/i)
    if (verMatch && !result.metadata.version) {
      result.metadata.version = verMatch[1].replace(/[*_]/g, '').trim()
      continue
    }
  }

  // Fallback title if not found
  if (!result.metadata.title && lines[0]) {
    const firstClean = lines[0].replace(/^[#\s*_-]+/, '').trim()
    if (firstClean.length > 0 && firstClean.length < 100) {
      result.metadata.title = firstClean
    }
  }

  // 2. Chapter Splitting
  const chapterSplits = []
  let currentChapter = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Pattern matches:
    // "# ตอนที่ 1: อีเมลจากตัวเอง"
    // "ตอนที่ 1: อีเมลจากตัวเอง"
    // "## บทที่ 04 — เงาในสายฝน"
    // "Chapter 1: The Beginning"
    const match = trimmed.match(/^(?:#+\s*)?(ตอนที่|บทที่|Chapter)\s*(\d+)[\s:：.-]*(.*)$/i)

    if (match) {
      if (currentChapter) {
        currentChapter.content = currentChapter.contentLines.join('\n').trim()
        currentChapter.wordCount = currentChapter.content.replace(/\s+/g, '').length
        delete currentChapter.contentLines
        chapterSplits.push(currentChapter)
      }

      const rawNumber = parseInt(match[2], 10)
      const rawTitle = match[3] ? match[3].replace(/[*_]/g, '').trim() : `ตอนที่ ${rawNumber}`

      currentChapter = {
        id: `import-ch-${Date.now()}-${chapterSplits.length + 1}`,
        number: rawNumber,
        title: rawTitle,
        heading: trimmed.replace(/^#+\s*/, '').replace(/[*_]/g, '').trim(),
        selected: true,
        contentLines: []
      }
    } else if (currentChapter) {
      currentChapter.contentLines.push(line)
    }
  }

  if (currentChapter) {
    currentChapter.content = currentChapter.contentLines.join('\n').trim()
    currentChapter.wordCount = currentChapter.content.replace(/\s+/g, '').length
    delete currentChapter.contentLines
    chapterSplits.push(currentChapter)
  }

  // Fallback: If no chapter headers were detected, treat the entire document as a single chapter
  if (chapterSplits.length === 0) {
    const fallbackTitle = result.metadata.title || 'บทที่ 1 — ตอนเริ่มต้น'
    chapterSplits.push({
      id: `import-ch-${Date.now()}-1`,
      number: 1,
      title: fallbackTitle,
      heading: 'บทที่ 1',
      selected: true,
      content: normalized.trim(),
      wordCount: normalized.replace(/\s+/g, '').length
    })
  }

  result.chapters = chapterSplits

  // 3. Character Extraction
  const charMap = new Map()

  // First: check supplementary file if uploaded
  if (supplementaryLoreText) {
    const suppChars = parseSupplementaryCharacters(supplementaryLoreText)
    suppChars.forEach(c => {
      charMap.set(c.name, {
        id: `char-imp-${Date.now()}-${charMap.size}`,
        selected: true,
        ...c
      })
    })
  }

  // Pattern A: Numbered list with formal prefix (นาย/นางสาว/นาง/คุณ)
  // e.g. "1. นายเมษ วัฒนากุล", "2. นายธาม กิตติโภคิน", "9. นายวินัย (วิน) วรโชติ"
  const listRegex = /(?:^|\n)\s*(?:\d+[\.\)]\s*)?(นาย|นางสาว|นาง|คุณ)\s*([^\s,\n\)]+)(?:\s*\(([^)]+)\))?(?:\s+([^\s,\n]+))?/g
  let matchA
  while ((matchA = listRegex.exec(normalized)) !== null) {
    const prefix = matchA[1]
    const firstName = matchA[2]
    const nickname = matchA[3] ? matchA[3].trim() : ''
    const lastName = matchA[4] ? matchA[4].trim() : ''

    const fullName = `${prefix}${firstName}${lastName ? ' ' + lastName : ''}${nickname ? ` (${nickname})` : ''}`
    const key = firstName

    if (!charMap.has(key)) {
      charMap.set(key, {
        id: `char-imp-${Date.now()}-${charMap.size}`,
        selected: true,
        name: fullName,
        shortName: nickname || firstName,
        role: firstName === 'ธาม' ? 'ตัวเอก' : 'ตัวละครหลัก',
        description: `ตรวจพบจากรายชื่อผู้ร่วมก่อตั้ง / เอกสารสัญญา (${prefix}${firstName}${lastName ? ' ' + lastName : ''})`,
        traits: '',
        secrets: ''
      })
    }
  }

  // Pattern B: Key recurring character names in text (frequency > 5)
  const candidateNames = ['ธาม', 'เมษ', 'เจต', 'พริม', 'ภาค', 'ขิม', 'ริว', 'นนท์', 'วิน', 'รินลดา', 'ศรุต', 'กรันต์']
  candidateNames.forEach((n, idx) => {
    if (!charMap.has(n)) {
      const reg = new RegExp(`\\b${n}\\b`, 'g')
      const count = (normalized.match(reg) || []).length
      if (count >= 5) {
        charMap.set(n, {
          id: `char-imp-${Date.now()}-${charMap.size}`,
          selected: true,
          name: n,
          shortName: n,
          role: idx === 0 ? 'ตัวเอก' : 'ตัวละครหลัก',
          description: `ตัวละครสำคัญที่ปรากฏบ่อยในเรื่อง (${count} ครั้ง)`,
          traits: '',
          secrets: ''
        })
      }
    }
  })

  result.characters = Array.from(charMap.values())
  return result
}
