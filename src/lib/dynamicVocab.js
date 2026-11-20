/**
 * Dynamic Vocabulary Injection & Skill Guardrails
 * Condition 1: Select only base categories (1-4) + genre-matching categories to optimize input tokens
 * Condition 3: Active Skill limit (Max 4 skills active simultaneously)
 */

export const MAX_ACTIVE_SKILLS = 4

export const GENRE_VOCAB_MAP = {
  'โรแมนติก / ดราม่า': [8, 17],
  'แฟนตาซี / กำลังภายใน': [9, 10],
  'วาย / ยูริ (BL / GL)': [8, 18],
  'สืบสวน / ระทึกขวัญ': [11, 14],
  'สยองขวัญ': [11, 18],
  'พีเรียด / ย้อนยุค': [12, 14],
  'เอาชีวิตรอด / ไซไฟ': [10, 20],
  'คอมเมดี้ / ชีวิตประจำวัน': [16, 19],
  'ทั่วไป / ยังไม่ระบุ': [5, 6]
}

export async function getDynamicVocabularyPrompt(genre) {
  // Dynamically load VOCABULARY_BANK only when this function is actually called
  const { VOCABULARY_BANK } = await import('./vocabularyBank')

  // Base categories (1: Movement, 2: Gaze & Facial, 3: Speech & Voice, 4: Emotion)
  const baseCategoryNumbers = [1, 2, 3, 4]
  const extraCategories = GENRE_VOCAB_MAP[genre] || [5, 6]
  const targetCategorySet = new Set([...baseCategoryNumbers, ...extraCategories])

  const selectedCategories = VOCABULARY_BANK.filter(cat => targetCategorySet.has(cat.number))

  let vocabPrompt = `คลังคำศัพท์แนะนำเฉพาะแนวเรื่อง (ดึงเฉพาะหมวดพื้นฐาน 1-4 และหมวด '${genre || "ทั่วไป"}'):\n`
  selectedCategories.forEach(cat => {
    vocabPrompt += `[หมวดที่ ${cat.number}: ${cat.name}]:\n`
    cat.entries.slice(0, 3).forEach(entry => {
      vocabPrompt += `  - ${entry.original}: ${entry.synonyms.slice(0, 85)}\n`
    })
  })

  // Add rule to avoid repetitive words and vary prose naturally based on user feedback
  vocabPrompt += `\n*คำแนะนำสไตล์:* กระจายการใช้คำศัพท์ให้หลากหลาย หลีกเลี่ยงการใช้คำซ้ำในระยะใกล้กัน (เช่น คำว่า ซีด หรือ บานประตู) เพื่อให้สำนวนสละสลวยและมีมิติ`

  return vocabPrompt.trim()
}
