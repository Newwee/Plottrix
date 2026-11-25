/**
 * Plottrix Production AI Engine
 * Routes through Astracode OpenAI-Compatible Gateway with complexity-based model selection:
 *   - Easy / Fast tasks  -> claude-haiku-5.5-eco (backup: chatgpt-6-luna)
 *   - Hard / Deep tasks  -> chatgpt-6-luna (backup: claude-haiku-5.5-eco)
 * Falls back to direct Google Gemini API only when a Google AIza key is provided.
 */

import https from 'https'

const DEFAULT_ASTRACODE_BASE_URL = 'https://astracode.panderx.xyz/v1'
const DEFAULT_FAST_MODEL = 'claude-haiku-5.5-eco'
const DEFAULT_HARD_MODEL = 'chatgpt-6-luna'

const GEMINI_FALLBACK_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash'
]

/**
 * Determine model priority chain based on task difficulty and input length.
 */
export function selectAstracodeModelChain(actionType, text = '', customSkillPrompt = '') {
  const fastModel = process.env.ASTRACODE_FAST_MODEL || DEFAULT_FAST_MODEL
  const hardModel = process.env.ASTRACODE_HARD_MODEL || DEFAULT_HARD_MODEL
  const cleanText = (text || '').trim()
  const cleanPrompt = (customSkillPrompt || '').trim()

  const hardActions = new Set(['polish', 'continuity', 'plotBranch', 'fullBook'])
  const isLongPayload = cleanText.length > 2500
  const hasComplexInstruction =
    actionType === 'custom' &&
    (cleanText.length > 1500 ||
      /วิเคราะห์|โครงเรื่อง|พล็อต|continuity|plot|chapter|บททั้งหมด/i.test(cleanPrompt))

  const isHardTask = hardActions.has(actionType) || isLongPayload || hasComplexInstruction

  // Always include the counterpart as automatic fallback in case of transient upstream 502/429
  if (isHardTask) {
    return fastModel !== hardModel ? [hardModel, fastModel] : [hardModel]
  }
  return fastModel !== hardModel ? [fastModel, hardModel] : [fastModel]
}

function callGemini(model, apiKey, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload)
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
    }

    const req = https.request(options, (res) => {
      let rawData = ''
      res.setEncoding('utf8')
      res.on('data', chunk => { rawData += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData)
          resolve({ statusCode: res.statusCode, data: parsed, raw: rawData })
        } catch {
          resolve({ statusCode: res.statusCode, data: null, raw: rawData, error: 'JSON parse error' })
        }
      })
    })

    req.on('error', err => reject(err))
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Google Gemini API request timed out (15s)'))
    })

    req.write(postData)
    req.end()
  })
}

function callOpenAiCompatible(baseURL, apiKey, model, systemPrompt, userPrompt, temperature = 0.3, timeoutMs = 40000) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature
    })

    try {
      const cleanBase = (baseURL || DEFAULT_ASTRACODE_BASE_URL).replace(/\/+$/, '')
      const fullUrl = cleanBase.endsWith('/chat/completions') ? cleanBase : `${cleanBase}/chat/completions`
      const parsedUrl = new URL(fullUrl)

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: timeoutMs
      }

      const req = https.request(options, (res) => {
        let rawData = ''
        res.setEncoding('utf8')
        res.on('data', chunk => { rawData += chunk })
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData)
            resolve({ statusCode: res.statusCode, data: parsed, raw: rawData })
          } catch {
            resolve({ statusCode: res.statusCode, data: null, raw: rawData, error: 'JSON parse error' })
          }
        })
      })

      req.on('error', err => reject(err))
      req.on('timeout', () => {
        req.destroy()
        reject(new Error(`Astracode API (${model}) timed out (${Math.round(timeoutMs / 1000)}s)`))
      })

      req.write(postData)
      req.end()
    } catch (err) {
      reject(err)
    }
  })
}

function extractJson(rawText) {
  if (!rawText) return null
  const trimmed = rawText.trim()
  try {
    return JSON.parse(trimmed)
  } catch (_) {}

  // Strip ```json ... ``` markdown fences
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (match) {
    try {
      return JSON.parse(match[1].trim())
    } catch (_) {}
  }

  // Find outermost { ... }
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1))
    } catch (_) {}
  }

  return null
}

export async function processAiRequest(body, defaultKey = '') {
  const {
    actionType = 'polish',
    payload = {},
    apiKey: clientApiKey,
    text: directText,
    genre: directGenre,
    pov: directPov,
    persona: directPersona,
    characters: directChars,
    dictionary: directDict,
    customSkillPrompt: directSkill,
    language: directLang,
    prompt: directPrompt
  } = body || {}

  const text = (payload.text !== undefined ? payload.text : directText) || ''
  const genre = payload.genre || directGenre || 'ทั่วไป'
  const pov = payload.pov || directPov || 'มุมมองบุคคลที่ 3'
  const persona = payload.persona || directPersona || 'พรรณนาลึกซึ้ง'
  const characters = payload.characters || directChars || []
  const dictionary = payload.dictionary || directDict || []
  const customSkillPrompt = payload.customSkillPrompt || directSkill || payload.prompt || directPrompt || ''
  const language = payload.language || directLang || 'en'

  // Resolve Astracode key first, then Google Gemini key
  const candidates = [
    clientApiKey,
    process.env.ASTRACODE_API_KEY,
    defaultKey,
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY
  ].filter(Boolean)

  const astraKey = candidates.find(k => typeof k === 'string' && k.trim().startsWith('sk-'))?.trim() || null
  const geminiKey = candidates.find(k => typeof k === 'string' && !k.trim().startsWith('sk-'))?.trim() || null

  if (!astraKey && !geminiKey) {
    throw new Error('ASTRACODE_API_KEY is not configured on server.')
  }

  if (!text || !text.trim()) {
    throw new Error('Missing input text to process.')
  }

  // Format context tags
  const charContext = characters.length > 0
    ? `<characters_bible>\n${characters.map(c => `- ${c.name} (${c.role || 'ตัวละคร'}): ${c.description || ''}; นิสัย: ${c.traits || ''}`).join('\n')}\n</characters_bible>`
    : ''

  const dictContext = dictionary.length > 0
    ? `<custom_dictionary>\n${dictionary.map(d => typeof d === 'string' ? d : d.word).join(', ')}\n</custom_dictionary>`
    : ''

  let systemInstructionText = ''
  let userPromptText = ''

  if (actionType === 'translate') {
    const langNames = {
      en: 'Literary English (International Fiction)',
      jp: 'Japanese (Light Novel literary style)',
      cn: 'Chinese (Wuxia / Xianxia literary style)'
    }
    const targetLang = langNames[language] || 'Literary English'

    systemInstructionText = `You are an expert literary translator specializing in translating fictional literature.
CRITICAL RULES:
1. Translate ONLY the exact text provided inside <user_text>...</user_text>.
2. UNDER NO CIRCUMSTANCES hallucinate, invent, or append additional paragraphs, sentences, chapters, or characters not present in the input.
3. If the input is a short phrase or single sentence, translate ONLY that exact phrase or sentence.
4. Maintain the literary tone, mood, and nuanced metaphors of the original text faithfully in ${targetLang}.
5. If character names or terms from the Story Bible appear in the input, translate or transliterate them consistently.
6. Return ONLY a valid JSON object matching this schema (no extra commentary):
{
  "translatedText": "<exact translation of user text in target language>",
  "notes": "<brief 1-sentence note in Thai explaining the literary tone or word choices>"
}`

    userPromptText = `<target_language>${targetLang}</target_language>
<genre>${genre}</genre>
${charContext}
${dictContext}
<user_text>
${text}
</user_text>`

  } else if (actionType === 'proofread') {
    systemInstructionText = `You are an expert copyeditor and proofreader specializing in Thai and English novel manuscripts.
CRITICAL RULES:
1. Carefully audit ONLY the text inside <user_text>...</user_text>.
2. Identify actual misspelled words, typos, incorrect spacing, and punctuation errors according to standard Thai orthography and Royal Society of Thailand guidelines, or English grammar.
3. Respect all specialized terms inside <custom_dictionary> — NEVER mark words in the custom dictionary as errors.
4. Preserve the author's intentional literary style, character voices, and colloquial idioms.
5. Return ONLY a valid JSON object matching this schema (no extra commentary):
{
  "explanation": "<summary in Thai of typos and grammar issues found (1-2 sentences)>",
  "corrections": [
    {
      "original": "<misspelled word or phrase>",
      "replacement": "<corrected word or phrase>",
      "reason": "<clear concise explanation in Thai of why it is an error>"
    }
  ],
  "correctedText": "<complete input text with all corrections applied, preserving 100% of surrounding content>"
}
If no errors are found, set corrections to empty array [], explanation to "ไม่พบคำสะกดผิดหรือข้อผิดพลาดทางไวยากรณ์ในข้อความนี้ ต้นฉบับถูกต้องสมบูรณ์", and correctedText to the exact input text.`

    userPromptText = `<genre>${genre}</genre>
${dictContext}
<user_text>
${text}
</user_text>`

  } else if (actionType === 'polish') {
    systemInstructionText = `You are an elite fiction manuscript editor and prose stylist.
CRITICAL RULES:
1. Polish, refine, and elevate the literary rhythm, evocative imagery, and vocabulary of ONLY the text inside <user_text>...</user_text>.
2. Strictly align with the specified Genre (<genre>), POV (<pov>), and Style Persona (<persona>).
3. If <custom_instruction> is provided, integrate and obey it fully.
4. Do NOT change plot facts, character names, or invent unrelated narrative developments. Keep the core scene intact.
5. Return ONLY a valid JSON object matching this schema (no extra commentary):
{
  "changesSummary": "<concise summary in Thai of polish improvements made, e.g., enhanced sensory details, refined cadence, removed redundancies>",
  "polishedText": "<fully polished and rewritten version of the input text>",
  "suggestions": [
    "<editorial tip or literary suggestion 1 in Thai>",
    "<editorial tip or literary suggestion 2 in Thai>"
  ]
}`

    userPromptText = `<genre>${genre}</genre>
<pov>${pov}</pov>
<persona>${persona}</persona>
${customSkillPrompt ? `<custom_instruction>${customSkillPrompt}</custom_instruction>` : ''}
${charContext}
${dictContext}
<user_text>
${text}
</user_text>`

  } else if (actionType === 'plotBranch') {
    systemInstructionText = `You are a master story architect and creative writing mentor.
CRITICAL RULES:
1. Analyze the scene and narrative context inside <user_text>...</user_text>, considering <genre>, <characters>, and <story_context>.
2. Generate exactly 3 distinct, compelling, and dramatically engaging plot directions for what could happen next in the story.
3. Direction 1: Character-driven conflict or emotional revelation.
   Direction 2: Unexpected complication, external danger, or mystery twist.
   Direction 3: Strategic dilemma, thematic crossroads, or moral choice.
4. For each direction, write a short opening paragraph (previewText) of 2-3 sentences that the author can directly insert and continue writing from.
5. Return ONLY a valid JSON object matching this schema (no extra commentary):
{
  "branches": [
    {
      "title": "ทางเลือกที่ 1: <ชื่อทางเลือกที่กระชับน่าสนใจ>",
      "summary": "<สรุปทิศทางการดำเนินเรื่องของทางเลือกนี้ 1-2 ประโยค>",
      "hook": "<ปมดึงดูดหรือผลกระทบสำคัญ>",
      "previewText": "<ย่อหน้าเปิดฉาก 2-3 ประโยคเพื่อนำไปเขียนต่อได้ทันที>"
    },
    {
      "title": "ทางเลือกที่ 2: <ชื่อทางเลือกที่กระชับน่าสนใจ>",
      "summary": "...",
      "hook": "...",
      "previewText": "..."
    },
    {
      "title": "ทางเลือกที่ 3: <ชื่อทางเลือกที่กระชับน่าสนใจ>",
      "summary": "...",
      "hook": "...",
      "previewText": "..."
    }
  ]
}`

    userPromptText = `<genre>${genre}</genre>
${charContext}
${dictContext}
<user_text>
${text}
</user_text>`

  } else if (actionType === 'continuity') {
    systemInstructionText = `You are an editorial continuity supervisor and logic analyst for novel manuscripts.
CRITICAL RULES:
1. Audit the text inside <user_text>...</user_text> against the provided <characters_bible>, <lore>, and <custom_dictionary>.
2. Check for character trait inconsistencies, timeline discrepancies, physical logic issues, and tone violations.
3. Return ONLY a valid JSON object matching this schema (no extra commentary):
{
  "consistencyScore": <integer between 0 and 100 representing logical coherence>,
  "timelineCheck": "<สรุปการตรวจลำดับเวลาและเหตุการณ์ในฉากเป็นภาษาไทย>",
  "bibleAlignment": "<สรุปความสอดคล้องกับ Story Bible และประวัติตัวละครเป็นภาษาไทย>",
  "inconsistencies": [
    {
      "issue": "<ชื่อจุดสังเกตหรือความขัดแย้งที่พบ>",
      "character": "<ตัวละครที่เกี่ยวข้อง หรือ 'ภาพรวมฉาก'>",
      "solution": "<คำแนะนำในการปรับแก้ให้สมเหตุสมผล>"
    }
  ]
}`

    userPromptText = `<genre>${genre}</genre>
${charContext}
${dictContext}
<user_text>
${text}
</user_text>`

  } else if (actionType === 'fullBook') {
    systemInstructionText = `You are an executive book editor.
CRITICAL RULES:
1. Analyze the chapters, pacing, and overall story arc provided inside <user_text>.
2. Return ONLY a valid JSON object matching this schema (no extra commentary):
{
  "plotArcScore": <integer between 0 and 100>,
  "majorPacingIssues": ["<ปัญหาจังหวะเล่าเรื่อง 1 เป็นภาษาไทย>"],
  "characterArcAnalysis": "<การวิเคราะห์พัฒนาการตัวละครเป็นภาษาไทย>",
  "plotHoles": ["<ช่องโหว่พล็อตที่ควรระวัง 1 เป็นภาษาไทย>"],
  "recommendations": ["<คำแนะนำเชิงบรรณาธิการ 1 เป็นภาษาไทย>"]
}`

    userPromptText = `<genre>${genre}</genre>
<user_text>
${text}
</user_text>`

  } else {
    // Custom instruction / AI สั่งการ
    systemInstructionText = `You are Plottrix AI writing assistant.
CRITICAL RULES:
1. Execute the user's instruction faithfully on the text inside <user_text>...</user_text>.
2. Return ONLY a valid JSON object matching this schema (no extra commentary):
{
  "changesSummary": "<สรุปผลการปฏิบัติตามคำสั่งเป็นภาษาไทย 1 ประโยค>",
  "polishedText": "<เนื้อหาผลลัพธ์ที่นำไปใช้ได้ทันที>",
  "suggestions": ["<ข้อสังเกตเพิ่มเติมเป็นภาษาไทย>"]
}`

    userPromptText = `<user_instruction>${customSkillPrompt || 'ช่วยเกลาเนื้อหานี้ให้สละสลวยยิ่งขึ้น'}</user_instruction>
<genre>${genre}</genre>
<pov>${pov}</pov>
<persona>${persona}</persona>
${charContext}
<user_text>
${text}
</user_text>`
  }

  const temperature = actionType === 'translate' || actionType === 'proofread' ? 0.2 : 0.7

  // 1. Astracode OpenAI-Compatible Gateway with complexity routing + automatic failover
  if (astraKey) {
    const astraBase = process.env.ASTRACODE_BASE_URL || DEFAULT_ASTRACODE_BASE_URL
    const modelChain = selectAstracodeModelChain(actionType, text, customSkillPrompt)
    let astraLastError = null

    const engineStart = Date.now()

    for (const model of modelChain) {
      const elapsedMs = Date.now() - engineStart
      const remainingBudget = 55000 - elapsedMs
      if (remainingBudget < 3000) break

      // Give fast Haiku up to 15s and reasoning 6 Luna up to remaining budget (capped at 42s)
      const perModelTimeout = model.includes('haiku')
        ? Math.min(15000, remainingBudget)
        : Math.min(42000, remainingBudget)

      try {
        const resp = await callOpenAiCompatible(
          astraBase,
          astraKey,
          model,
          systemInstructionText,
          userPromptText,
          temperature,
          perModelTimeout
        )

        if (resp.statusCode === 200 && resp.data?.choices?.[0]?.message?.content) {
          const rawContent = resp.data.choices[0].message.content
          const parsed = extractJson(rawContent)
          if (parsed) {
            return {
              success: true,
              model: resp.data.model || model,
              result: parsed
            }
          }
        }

        const errMsg = resp.data?.error?.message_th || resp.data?.error?.message || `HTTP ${resp.statusCode}`
        astraLastError = new Error(`[Astracode / ${model}] ${errMsg}`)
        console.warn(`[aiEngine] Model ${model} failed (${errMsg}), switching to fallback model if available.`)
      } catch (err) {
        astraLastError = err
        console.warn(`[aiEngine] Model ${model} exception:`, err.message)
      }
    }

    if (!geminiKey) {
      throw astraLastError || new Error('Failed to generate response from Astracode API.')
    }
  }

  // 2. Legacy Google Gemini API fallback (only if an AIza key is explicitly configured)
  const geminiPayload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPromptText }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstructionText }]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature
    }
  }

  let lastError = null

  for (const model of GEMINI_FALLBACK_CHAIN) {
    try {
      const resp = await callGemini(model, geminiKey, geminiPayload)
      if (resp.statusCode === 200 && resp.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const rawReply = resp.data.candidates[0].content.parts[0].text
        const parsed = extractJson(rawReply)
        if (parsed) {
          return {
            success: true,
            model,
            result: parsed
          }
        }
      }

      const errMsg = resp.data?.error?.message || `HTTP ${resp.statusCode}`
      lastError = new Error(`[Model ${model}] ${errMsg}`)

      if (resp.statusCode === 400) {
        break
      }
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error('Failed to generate response from AI Engine.')
}
