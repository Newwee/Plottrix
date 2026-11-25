export const DEFAULT_FAST_MODEL = 'claude-haiku-5.5-eco'
export const DEFAULT_HARD_MODEL = 'chatgpt-6-luna'

export const ACTION_LABELS = {
  proofread: 'ตรวจคำผิดและวรรคตอน',
  polish: 'ขัดเกลาสำนวนตาม Persona',
  continuity: 'ตรวจความต่อเนื่องและ Character Bible',
  plotBranch: 'คิดทางเลือกดำเนินเรื่อง 3 แนวทาง',
  translate: 'แปลวรรณกรรมภาษาอังกฤษ',
  fullBook: 'วิเคราะห์โครงเรื่องทั้งเล่ม',
  custom: 'ประมวลผลคำสั่ง AI พิเศษ'
}

export const MODEL_PROFILES = {
  'claude-haiku-5.5-eco': {
    id: 'claude-haiku-5.5-eco',
    label: 'Claude Haiku 5.5 Eco',
    badge: 'Fast & Eco',
    tierLabel: 'โหมดรวดเร็ว (ความจำฉับไว)',
    roleDesc: 'เหมาะกับตรวจคำผิด แปลภาษา และข้อความสั้นกระชับ',
    minSec: 4,
    maxSec: 14,
    timeoutSec: 15,
    toneClass: 'emerald'
  },
  'chatgpt-6-luna': {
    id: 'chatgpt-6-luna',
    label: 'ChatGPT 6 Luna',
    badge: 'Deep Reasoning',
    tierLabel: 'โหมดวิเคราะห์เชิงลึก',
    roleDesc: 'เหมาะกับเกลาสำนวน วิเคราะห์ตรรกะ และวางพล็อตซับซ้อน',
    minSec: 18,
    maxSec: 45,
    timeoutSec: 52,
    toneClass: 'purple'
  }
}

export function getModelDisplayInfo(modelId) {
  const id = String(modelId || '').trim()
  if (!id) {
    return MODEL_PROFILES[DEFAULT_HARD_MODEL]
  }
  if (MODEL_PROFILES[id]) {
    return MODEL_PROFILES[id]
  }
  const lower = id.toLowerCase()
  if (lower.includes('haiku')) {
    return {
      ...MODEL_PROFILES['claude-haiku-5.5-eco'],
      id,
      label: id === 'claude-haiku-5.5-eco' ? 'Claude Haiku 5.5 Eco' : id
    }
  }
  if (lower.includes('luna') || lower.includes('chatgpt-6')) {
    return {
      ...MODEL_PROFILES['chatgpt-6-luna'],
      id,
      label: id === 'chatgpt-6-luna' ? 'ChatGPT 6 Luna' : id
    }
  }
  if (lower.includes('gemini')) {
    return {
      id,
      label: id,
      badge: 'Gemini Fallback',
      tierLabel: 'โมเดลสำรองอัตโนมัติ',
      roleDesc: 'ระบบสำรองเมื่อ Gateway หลักขัดข้อง',
      minSec: 5,
      maxSec: 18,
      timeoutSec: 20,
      toneClass: 'amber'
    }
  }
  return {
    id,
    label: id,
    badge: 'AI Model',
    tierLabel: 'ประมวลผลผ่าน AI Gateway',
    roleDesc: 'ประมวลผลตามชุดคำสั่งที่เลือก',
    minSec: 8,
    maxSec: 25,
    timeoutSec: 35,
    toneClass: 'purple'
  }
}

export function selectModelRoute(
  actionType,
  text = '',
  customSkillPrompt = '',
  fastModel = DEFAULT_FAST_MODEL,
  hardModel = DEFAULT_HARD_MODEL
) {
  const cleanText = String(text || '').trim()
  const cleanPrompt = String(customSkillPrompt || '').trim()
  const textLen = cleanText.length

  const hardActions = new Set(['polish', 'continuity', 'plotBranch', 'fullBook'])
  const isLongPayload = textLen > 2500
  const hasComplexInstruction =
    actionType === 'custom' &&
    (textLen > 1500 ||
      /วิเคราะห์|โครงเรื่อง|พล็อต|continuity|plot|chapter|บททั้งหมด/i.test(cleanPrompt))

  const isHardTask = hardActions.has(actionType) || isLongPayload || hasComplexInstruction
  const primaryModel = isHardTask ? hardModel : fastModel
  const backupModel = primaryModel === hardModel ? fastModel : hardModel
  const chain = fastModel !== hardModel ? [primaryModel, backupModel] : [primaryModel]

  let routeReason = 'งานมาตรฐานความเร็วสูง ใช้โหมด Fast & Eco'
  if (actionType === 'polish') {
    routeReason = 'งานเกลาสำนวนต้องคุมน้ำเสียงและโวหาร จึงจัดเข้าโหมดวิเคราะห์ลึก'
  } else if (actionType === 'continuity') {
    routeReason = 'ต้องเทียบเหตุการณ์และ Character Bible ข้ามบริบท ใช้โมเดลวิเคราะห์ลึก'
  } else if (actionType === 'plotBranch') {
    routeReason = 'ต้องวางเหตุ-ผลของทางแยกเนื้อเรื่อง 3 แบบ ใช้โมเดลวิเคราะห์ลึก'
  } else if (actionType === 'fullBook') {
    routeReason = 'วิเคราะห์โครงเรื่องขนาดยาวทั้งเล่ม ใช้โมเดลวิเคราะห์ลึก'
  } else if (isLongPayload) {
    routeReason = `ต้นฉบับยาว ${textLen.toLocaleString()} ตัวอักษร ใช้โมเดลความจุบริบทลึก`
  } else if (hasComplexInstruction) {
    routeReason = 'คำสั่งเฉพาะทางมีเงื่อนไขซับซ้อน ใช้โมเดลวิเคราะห์ลึก'
  } else if (actionType === 'proofread') {
    routeReason = 'ตรวจคำสะกดและวรรคตอนเน้นความไว ตอบกลับรวดเร็ว'
  } else if (actionType === 'translate') {
    routeReason = 'แปลภาษาแบบคงบริบทเน้นความคล่องตัว ตอบกลับรวดเร็ว'
  }

  return {
    chain,
    primaryModel,
    backupModel: chain.length > 1 ? backupModel : null,
    isHardTask,
    routeReason
  }
}

export function estimateAiDuration({
  actionType = 'polish',
  textLength = 0,
  characterCount = 0,
  dictionaryCount = 0,
  modelId = DEFAULT_HARD_MODEL
}) {
  const info = getModelDisplayInfo(modelId)
  const chars = Math.max(0, Number(textLength) || 0)
  const charUnits = Math.min(8, Math.floor(chars / 700))
  const contextAdd = Math.min(3, Math.floor(((Number(characterCount) || 0) + (Number(dictionaryCount) || 0) * 0.2) / 5))
  const actionExtra = actionType === 'plotBranch' || actionType === 'fullBook' ? 4 : actionType === 'polish' || actionType === 'continuity' ? 2 : 0

  const minSec = Math.min(info.timeoutSec - 3, Math.max(3, info.minSec + Math.floor(charUnits * 0.6)))
  const maxSec = Math.min(
    info.timeoutSec,
    Math.max(minSec + 5, info.maxSec + Math.round(charUnits * 0.9) + contextAdd + actionExtra)
  )
  const expectedSec = Math.round((minSec + maxSec) / 2)

  return {
    minSec,
    maxSec,
    expectedSec,
    timeoutSec: info.timeoutSec,
    label: `~${minSec}–${maxSec} วินาที`
  }
}
