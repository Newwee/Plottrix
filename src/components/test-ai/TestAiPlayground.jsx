import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import {
  DEFAULT_ASTRACODE_CONFIG,
  PRESET_MODELS,
  executeAiCall,
  testConnectionPing
} from '../../lib/testAiService'

// Sample inputs from main Plottrix app
const SAMPLE_PROSE = `เสียงแจ้งเตือนจากโทรศัพท์มือถือดังขึ้นท่ามกลางความเงียบสงัดของห้องชุดชั้นสิบเจ็ด รามไม่ได้ขยับตัวในทันที เขานั่งนิ่งอยู่หน้าโต๊ะทำงานไม้สีเข้ม แสงสลัวจากโคมไฟตั้งโต๊ะทอดเงายาวไปตามแนวกำแพงห้องที่ว่างเปล่า ด้านนอกหน้าต่างบานกระจก กรุงเทพฯ ยามวิกาลจมอยู่ใต้สายฝนพรำ ละอองน้ำเกาะพราวเป็นริ้วยาวบิดเบี้ยวแสงไฟนีออนจากถนนเบื้องล่างให้พร่าเลือน`

const SAMPLE_PROOFREAD = `ในวันนั้นรามสังเกตุเห็นว่ามีคนเดินตามเขามาตั้งแต่ร้านกาแฟ เขาจึงรีบเดินไปที่ป้ายรถเมล์โดยไม่ทันคิดถึงความปลอดภัย ผูกพันธิ์ที่เขามีต่อเพื่อนร่วมงานทำให้เขาไม่อยากเชื่อว่านี่คือโอกาศสุดท้ายที่จะได้พบกันอีก`

const SAMPLE_CHARACTERS = [
  { name: 'ราม', role: 'ตัวเอก / สถาปนิก', description: 'สุขุม ช่างสังเกต เก็บความรู้สึกเก่ง', traits: 'ไม่ชอบที่แคบ, ดื่มกาแฟดำ' },
  { name: 'เจต', role: 'ผู้บริหารร่วม / เพื่อนเก่า', description: 'ทะเยอทะยาน คล่องแคล่ว', traits: 'ชอบความเสี่ยง' }
]

export default function TestAiPlayground() {
  const { navigateTo } = useApp()

  // API Config State (persisted in localStorage)
  const [baseURL, setBaseURL] = useState(() => {
    return localStorage.getItem('plottrix_test_ai_base_url') || DEFAULT_ASTRACODE_CONFIG.baseURL
  })
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('plottrix_test_ai_api_key') || DEFAULT_ASTRACODE_CONFIG.apiKey || ''
  })
  const [model, setModel] = useState(() => {
    return localStorage.getItem('plottrix_test_ai_model') || DEFAULT_ASTRACODE_CONFIG.model
  })
  const [showApiKey, setShowApiKey] = useState(false)

  const handleClearApiKey = () => {
    setApiKey('')
    localStorage.removeItem('plottrix_test_ai_api_key')
  }

  // Ping Test State
  const [pingStatus, setPingStatus] = useState(null) // null | 'testing' | 'success' | 'error'
  const [pingResult, setPingResult] = useState(null)

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState('polish') // polish | proofread | translate | plotBranch | continuity | expand | custom

  // Shared / Tab-Specific Inputs
  const [inputText, setInputText] = useState(SAMPLE_PROSE)
  const [genre, setGenre] = useState('สืบสวน / ระทึกขวัญ')
  const [pov, setPov] = useState('บุรุษที่ 3 (เขา/เธอ)')
  const [persona, setPersona] = useState('พรรณนาลึกซึ้ง (Poetic & Atmospheric)')
  const [customInstruction, setCustomInstruction] = useState('')
  const [targetLang, setTargetLang] = useState('en')
  const [customDictionary, setCustomDictionary] = useState(['Plottrix', 'ราม', 'เจตน์'])

  // Execution State
  const [isProcessing, setIsProcessing] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [showRawInspector, setShowRawInspector] = useState(false)

  // Save Config Changes
  useEffect(() => {
    localStorage.setItem('plottrix_test_ai_base_url', baseURL)
  }, [baseURL])

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('plottrix_test_ai_api_key', apiKey)
    } else {
      localStorage.removeItem('plottrix_test_ai_api_key')
    }
  }, [apiKey])

  useEffect(() => {
    localStorage.setItem('plottrix_test_ai_model', model)
  }, [model])

  // Run Quick Connection Ping
  const handlePingTest = async () => {
    setPingStatus('testing')
    setPingResult(null)

    const res = await testConnectionPing(baseURL, apiKey, model)
    if (res.success) {
      setPingStatus('success')
      setPingResult(res)
    } else {
      setPingStatus('error')
      setPingResult(res)
    }
  }

  // Handle Tab Switch & Preset text
  const handleSelectTab = (tabId) => {
    setActiveTab(tabId)
    setExecutionResult(null)

    if (tabId === 'proofread') {
      setInputText(SAMPLE_PROOFREAD)
    } else {
      setInputText(SAMPLE_PROSE)
    }
  }

  // Execute Main AI System Test
  const handleRunTest = async () => {
    if (!inputText.trim()) return

    setIsProcessing(true)
    setExecutionResult(null)

    let systemPrompt = ''
    let userPrompt = ''
    let responseFormat = null

    if (activeTab === 'polish') {
      systemPrompt = `You are an elite fiction manuscript editor and prose stylist.
CRITICAL RULES:
1. Polish, refine, and elevate the literary rhythm, evocative imagery, and vocabulary of the provided text.
2. Strictly align with Genre (${genre}), POV (${pov}), and Style Persona (${persona}).
3. Return ONLY a valid JSON object matching this schema:
{
  "changesSummary": "<concise summary in Thai of polish improvements made>",
  "polishedText": "<fully polished and rewritten version of the input text>",
  "suggestions": [
    "<editorial tip or literary suggestion 1 in Thai>",
    "<editorial tip or literary suggestion 2 in Thai>"
  ]
}`
      userPrompt = `<genre>${genre}</genre>\n<pov>${pov}</pov>\n<persona>${persona}</persona>\n${customInstruction ? `<custom_instruction>${customInstruction}</custom_instruction>\n` : ''}<user_text>\n${inputText}\n</user_text>`
      responseFormat = { type: 'json_object' }

    } else if (activeTab === 'proofread') {
      systemPrompt = `You are an expert copyeditor and proofreader specializing in Thai and English novel manuscripts.
CRITICAL RULES:
1. Audit the text for misspelled words, typos, punctuation, and spacing according to Royal Society of Thailand guidelines.
2. Respect custom dictionary words: ${customDictionary.join(', ')}.
3. Return ONLY a valid JSON object matching this schema:
{
  "explanation": "<summary in Thai of typos and grammar issues found (1-2 sentences)>",
  "corrections": [
    {
      "original": "<misspelled word>",
      "replacement": "<corrected word>",
      "reason": "<clear explanation in Thai>"
    }
  ],
  "correctedText": "<complete input text with all corrections applied>"
}`
      userPrompt = `<genre>${genre}</genre>\n<user_text>\n${inputText}\n</user_text>`
      responseFormat = { type: 'json_object' }

    } else if (activeTab === 'translate') {
      const langNames = {
        en: 'Literary English (International Fiction Style)',
        jp: 'Japanese (Light Novel literary style)',
        cn: 'Chinese (Wuxia / Xianxia literary style)'
      }
      const langLabel = langNames[targetLang] || 'Literary English'

      systemPrompt = `You are an expert literary translator specializing in translating fictional literature into ${langLabel}.
CRITICAL RULES:
1. Translate ONLY the exact text provided, preserving nuanced tone, sensory metaphors, and rhythm.
2. Return ONLY a valid JSON object matching this schema:
{
  "translatedText": "<exact translation of user text in target language>",
  "notes": "<brief 1-sentence note in Thai explaining the literary tone or word choices>"
}`
      userPrompt = `<target_language>${langLabel}</target_language>\n<genre>${genre}</genre>\n<user_text>\n${inputText}\n</user_text>`
      responseFormat = { type: 'json_object' }

    } else if (activeTab === 'plotBranch') {
      systemPrompt = `You are a master story architect and creative writing mentor.
CRITICAL RULES:
1. Generate exactly 3 distinct, compelling, and dramatically engaging plot directions for what could happen next in the scene:
   - Branch 1: Character-driven emotional conflict
   - Branch 2: Unexpected complication / mystery twist
   - Branch 3: Strategic crossroads / moral dilemma
2. For each direction, write a short opening paragraph (previewText) of 2-3 sentences.
3. Return ONLY a valid JSON object matching this schema:
{
  "branches": [
    {
      "title": "<ชื่อทางเลือกที่ 1>",
      "summary": "<สรุปทิศทาง 1-2 ประโยค>",
      "hook": "<ปมดึงดูดสำคัญ>",
      "previewText": "<ย่อหน้าเปิดฉาก 2-3 ประโยคเพื่อนำไปเขียนต่อได้ทันที>"
    },
    {
      "title": "<ชื่อทางเลือกที่ 2>",
      "summary": "...",
      "hook": "...",
      "previewText": "..."
    },
    {
      "title": "<ชื่อทางเลือกที่ 3>",
      "summary": "...",
      "hook": "...",
      "previewText": "..."
    }
  ]
}`
      userPrompt = `<genre>${genre}</genre>\n<user_text>\n${inputText}\n</user_text>`
      responseFormat = { type: 'json_object' }

    } else if (activeTab === 'continuity') {
      systemPrompt = `You are an editorial continuity supervisor and logic auditor for novel manuscripts.
CRITICAL RULES:
1. Audit the text against the Character Bible provided.
2. Check for character trait inconsistencies, physical logic issues, and timeline discrepancies.
3. Return ONLY a valid JSON object matching this schema:
{
  "consistencyScore": <integer between 0 and 100>,
  "timelineCheck": "<สรุปการตรวจลำดับเวลาและเหตุการณ์ในฉากเป็นภาษาไทย>",
  "bibleAlignment": "<สรุปความสอดคล้องกับประวัติตัวละครเป็นภาษาไทย>",
  "inconsistencies": [
    {
      "issue": "<ชื่อจุดสังเกตหรือความขัดแย้งที่พบ>",
      "character": "<ตัวละครที่เกี่ยวข้อง หรือ 'ภาพรวมฉาก'>",
      "solution": "<คำแนะนำในการปรับแก้ให้สมเหตุสมผล>"
    }
  ]
}`
      userPrompt = `<characters_bible>\n${SAMPLE_CHARACTERS.map(c => `- ${c.name} (${c.role}): ${c.description}; นิสัย: ${c.traits}`).join('\n')}\n</characters_bible>\n<genre>${genre}</genre>\n<user_text>\n${inputText}\n</user_text>`
      responseFormat = { type: 'json_object' }

    } else if (activeTab === 'expand') {
      systemPrompt = `You are a professional creative fiction co-writer.
CRITICAL RULES:
1. Continue the story smoothly and seamlessly from where the user's text leaves off.
2. Maintain the exact mood, tone, genre (${genre}), and POV (${pov}).
3. Write 2-3 atmospheric paragraphs advancing the scene.
4. Return ONLY a valid JSON object matching this schema:
{
  "continuation": "<เนื้อเรื่องตอนต่อ 2-3 ย่อหน้าที่นำไปใช้ได้ทันที>",
  "narrativeFocus": "<จุดเน้นของการดำเนินเรื่องในฉากนี้>"
}`
      userPrompt = `<genre>${genre}</genre>\n<pov>${pov}</pov>\n<current_scene>\n${inputText}\n</current_scene>`
      responseFormat = { type: 'json_object' }

    } else {
      // Custom / Freeform
      systemPrompt = customInstruction || 'You are an intelligent AI creative writing assistant. Respond directly and helpfully.'
      userPrompt = inputText
      responseFormat = null
    }

    const res = await executeAiCall({
      baseURL,
      apiKey,
      model,
      systemPrompt,
      userPrompt,
      temperature: activeTab === 'proofread' || activeTab === 'translate' ? 0.2 : 0.7,
      responseFormat
    })

    setIsProcessing(false)

    // Parse JSON response if expected
    let parsedContent = null
    if (res.success && res.content) {
      try {
        const trimmed = res.content.trim()
        const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        const jsonStr = fenceMatch ? fenceMatch[1].trim() : trimmed
        parsedContent = JSON.parse(jsonStr)
      } catch {
        parsedContent = res.content
      }
    }

    setExecutionResult({
      ...res,
      parsedContent
    })
  }

  const TABS = [
    { id: 'polish', name: '✍️ ขัดเกลาสำนวน', sub: 'Prose Polish & Persona' },
    { id: 'proofread', name: '🔍 ตรวจคำผิด', sub: 'Proofread & Grammar' },
    { id: 'translate', name: '🌐 แปลวรรณกรรม', sub: 'Context Translation' },
    { id: 'plotBranch', name: '🌿 แตกกิ่งพล็อต 3 ทาง', sub: 'Plot Branching' },
    { id: 'continuity', name: '🛡️ ตรวจความต่อเนื่อง', sub: 'Story Bible & Logic' },
    { id: 'expand', name: '🤖 เขียนต่ออัตโนมัติ', sub: 'Scene Expansion' },
    { id: 'custom', name: '💬 ทดสอบคำสั่งอิสระ', sub: 'Custom / Raw Chat' }
  ]

  return (
    <div className="min-h-screen bg-[#0a0714] text-slate-100 font-thai select-none relative overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px]" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 bg-[#0e0a1e]/90 backdrop-blur-2xl border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-600/40">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                <span>Plottrix AI Lab</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Test AI Hub
                </span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                ● localhost:5173
              </span>
            </div>
            <p className="text-[11px] text-plottrix-muted">
              เว็บไซต์ทดสอบระบบ AI ทั้งหมดในเว็บหลัก พร้อมแสดงโมเดลจริง &amp; ค่า Latency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateTo('workspace_home')}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-400/30 text-xs font-semibold text-purple-200 hover:text-white transition cursor-pointer"
          >
            ✍️ เข้าสู่ Workspace
          </button>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            ← กลับหน้าแรก
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. Global API & Model Connection Bar */}
        <div className="rounded-3xl border border-purple-500/30 bg-[#140e2b]/95 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-base">⚙️</span>
              <span className="text-xs sm:text-sm font-bold text-white">
                การตั้งค่า API &amp; โมเดล (OpenAI-Compatible &amp; Astracode Gateway)
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setBaseURL(DEFAULT_ASTRACODE_CONFIG.baseURL)
                  setModel('gemini-3.8-flash')
                }}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-600/30 text-purple-200 border border-purple-400/40 hover:bg-purple-600/50 transition cursor-pointer"
              >
                ✦ ใช้ค่า Astracode (แนะนำ)
              </button>
              <button
                type="button"
                onClick={() => {
                  setBaseURL('https://api.openai.com/v1')
                  setModel('gpt-4o-mini')
                }}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition cursor-pointer"
              >
                OpenAI
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Base URL */}
            <div className="md:col-span-4 space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Base URL:</span>
                <span className="text-[9px] text-plottrix-muted font-mono">/v1/chat/completions</span>
              </label>
              <input
                type="text"
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder="https://astracode.panderx.xyz/v1"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white font-mono text-xs focus:border-purple-400 outline-none"
              />
            </div>

            {/* API Key */}
            <div className="md:col-span-4 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span>API Key:</span>
                  {apiKey ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      🔒 ซ่อนอยู่ในเครื่อง
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      ⚠️ ยังไม่มีคีย์ (ปลอดภัย)
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {apiKey && (
                    <button
                      type="button"
                      onClick={handleClearApiKey}
                      className="text-[10px] text-rose-300 hover:text-rose-200 hover:underline cursor-pointer"
                      title="ลบ API Key ออกจากเบราว์เซอร์ทันที"
                    >
                      ล้างคีย์
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] text-purple-300 hover:underline cursor-pointer"
                  >
                    {showApiKey ? 'ซ่อน' : 'แสดงรหัส'}
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="ใส่ API Key หรือใช้ค่าจาก .env.local ในเครื่องคุณ"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white font-mono text-xs focus:border-purple-400 outline-none pr-8"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Model Selector */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                โมเดล (Model):
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-white font-mono text-xs focus:border-purple-400 outline-none cursor-pointer"
              >
                {PRESET_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Ping Test Button */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handlePingTest}
                disabled={pingStatus === 'testing' || !apiKey.trim()}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {pingStatus === 'testing' ? (
                  <span>กำลังทดสอบ Ping...</span>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>ทดสอบเชื่อมต่อ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Ping Result Banner */}
          {pingResult && (
            <div className={`mt-3 p-3 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 animate-fadeIn ${
              pingResult.success
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                <span>{pingResult.success ? '✅' : '❌'}</span>
                <span>
                  {pingResult.success
                    ? `เชื่อมต่อสำเร็จ! ตอบกลับใน ${pingResult.durationMs} ms — โมเดล: "${pingResult.reportedModel}"`
                    : `เชื่อมต่อไม่สำเร็จ: ${pingResult.error} (${pingResult.durationMs} ms)`}
                </span>
              </div>
              {pingResult.reportedModel && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/40 text-purple-300">
                  Model: {pingResult.reportedModel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 2. System Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/50 shadow-lg shadow-purple-600/30 scale-102'
                  : 'bg-[#140e2b]/80 hover:bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* 3. Main Playground Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Form & Configurations */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-purple-500/25 bg-[#140e2b]/90 p-5 space-y-4 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>📝</span>
                  <span>ข้อความต้นฉบับที่จะให้ AI ประมวลผล</span>
                </span>
                <span className="text-[10px] font-mono text-plottrix-muted">
                  {inputText.length} ตัวอักษร
                </span>
              </div>

              {/* Text Area */}
              <div>
                <textarea
                  rows={8}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="พิมพ์ข้อความที่ต้องการทดสอบ..."
                  className="w-full p-3.5 rounded-2xl bg-black/40 border border-purple-500/30 text-white text-xs sm:text-sm focus:border-purple-400 outline-none transition leading-relaxed resize-none custom-scrollbar"
                />
              </div>

              {/* Tab-Specific Control Options */}
              {activeTab === 'polish' && (
                <div className="space-y-3 pt-1 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">หมวดหมู่ (Genre):</label>
                      <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full p-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs outline-none"
                      >
                        <option>สืบสวน / ระทึกขวัญ</option>
                        <option>แฟนตาซี / กำลังภายใน</option>
                        <option>โรแมนติก / ดราม่า</option>
                        <option>ไซไฟ / เอาชีวิตรอด</option>
                        <option>สยองขวัญ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">มุมมอง (POV):</label>
                      <select
                        value={pov}
                        onChange={(e) => setPov(e.target.value)}
                        className="w-full p-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs outline-none"
                      >
                        <option>บุรุษที่ 3 (เขา/เธอ)</option>
                        <option>บุรุษที่ 1 (ฉัน/ผม)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">สไตล์นักเขียน (Style Persona):</label>
                    <input
                      type="text"
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                      placeholder="เช่น พรรณนาลึกซึ้ง, หักมุมเฉียบคม..."
                      className="w-full p-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">คำสั่งเสริมเฉพาะ (Custom Prompt):</label>
                    <input
                      type="text"
                      value={customInstruction}
                      onChange={(e) => setCustomInstruction(e.target.value)}
                      placeholder="เช่น เน้นบรรยากาศฝนตก, ใช้คำสละสลวยขึ้น..."
                      className="w-full p-2 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'translate' && (
                <div className="pt-1 border-t border-white/10 space-y-2">
                  <label className="text-[11px] text-slate-300 block">ภาษาเป้าหมาย (Target Language):</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'en', label: '🇬🇧 English (วรรณกรรม)' },
                      { id: 'jp', label: '🇯🇵 ญี่ปุ่น (Light Novel)' },
                      { id: 'cn', label: '🇨🇳 จีน (Wuxia)' }
                    ].map(l => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setTargetLang(l.id)}
                        className={`p-2 rounded-xl text-xs font-bold border transition ${
                          targetLang === l.id
                            ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                            : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'proofread' && (
                <div className="pt-1 border-t border-white/10 space-y-2 text-xs">
                  <span className="text-[11px] text-slate-300 block">
                    พจนานุกรมคำเฉพาะ (จะไม่ถูกตรวจว่าเป็นคำผิด):
                  </span>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-black/40 border border-white/10">
                    {customDictionary.map((w, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px]">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'custom' && (
                <div className="pt-1 border-t border-white/10 space-y-2 text-xs">
                  <label className="text-[11px] text-slate-300 block">System Instruction กำหนดเอง:</label>
                  <input
                    type="text"
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="เช่น คุณคือนักประพันธ์นิยายสืบสวนรางวัลซีไรต์..."
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs outline-none"
                  />
                </div>
              )}

              {/* Action Trigger Button */}
              <button
                type="button"
                onClick={handleRunTest}
                disabled={isProcessing || !inputText.trim() || !apiKey.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:brightness-110 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-600/30 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังยิง API และประมวลผล...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>รันการทดสอบ ({TABS.find(t => t.id === activeTab)?.name})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Execution Output, Active Model Badge, and Inspection */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl border border-purple-500/25 bg-[#140e2b]/90 p-5 backdrop-blur-xl min-h-[460px] flex flex-col justify-between">
              <div>
                {/* Result Header: Model Badge, Latency, and Tokens */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📊</span>
                    <span className="text-xs sm:text-sm font-bold text-white">ผลลัพธ์การประมวลผล</span>
                  </div>

                  {executionResult && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Reported Model Badge */}
                      <span className="px-2.5 py-1 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-400/40 font-mono font-bold flex items-center gap-1">
                        <span>🤖 โมเดล:</span>
                        <strong className="text-white">{executionResult.reportedModel || model}</strong>
                      </span>

                      {/* Response Time Badge */}
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono font-semibold flex items-center gap-1">
                        <span>⏱️</span>
                        <span>{executionResult.durationMs} ms</span>
                      </span>

                      {/* Token usage if returned */}
                      {executionResult.usage && (
                        <span className="px-2 py-1 rounded-xl bg-black/40 text-slate-300 border border-white/10 font-mono text-[11px] hidden sm:inline">
                          Tokens: {executionResult.usage.total_tokens || 0}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Processing State */}
                {isProcessing ? (
                  <div className="p-16 text-center text-purple-300 space-y-3">
                    <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold">ส่งคำขอไปยัง {baseURL} ...</p>
                    <p className="text-[11px] text-plottrix-muted font-mono">Model: {model}</p>
                  </div>
                ) : !executionResult ? (
                  <div className="p-16 text-center text-slate-400 space-y-2">
                    <span className="text-3xl block">🧪</span>
                    <h4 className="text-sm font-bold text-white">พร้อมสำหรับการทดสอบ</h4>
                    <p className="text-xs text-plottrix-muted max-w-sm mx-auto">
                      คลิกปุ่ม &quot;รันการทดสอบ&quot; ด้านซ้ายเพื่อส่ง Prompt เข้าไปยังโมเดล ระบบจะจับเวลา Latency และแสดงชื่อโมเดลจริงที่ตอบกลับมา
                    </p>
                  </div>
                ) : !executionResult.success ? (
                  <div className="p-6 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 space-y-2">
                    <div className="font-bold text-sm flex items-center gap-2">
                      <span>⚠️</span>
                      <span>เกิดข้อผิดพลาดในการเรียก API</span>
                    </div>
                    <p className="text-xs font-mono break-all">{executionResult.error}</p>
                    <p className="text-[11px] text-rose-300/80">
                      ตรวจสอบว่า API Key ถูกต้อง และ Base URL สามารถเข้าถึงได้
                    </p>
                  </div>
                ) : (
                  /* Formatted Results View */
                  <div className="space-y-4">
                    {/* POLISH RESULT */}
                    {activeTab === 'polish' && executionResult.parsedContent?.polishedText && (
                      <div className="space-y-3">
                        {executionResult.parsedContent.changesSummary && (
                          <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-400/30 text-xs text-purple-200">
                            <strong>สรุปการเกลา:</strong> {executionResult.parsedContent.changesSummary}
                          </div>
                        )}

                        <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 text-slate-100 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-thai">
                          {executionResult.parsedContent.polishedText}
                        </div>

                        {Array.isArray(executionResult.parsedContent.suggestions) && (
                          <div className="space-y-1 pt-1">
                            <span className="text-xs font-semibold text-purple-300">💡 ข้อแนะนำเพิ่มเติม:</span>
                            {executionResult.parsedContent.suggestions.map((s, idx) => (
                              <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                                <span>•</span>
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* PROOFREAD RESULT */}
                    {activeTab === 'proofread' && executionResult.parsedContent?.corrections && (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200">
                          <strong>ผลการตรวจ:</strong> {executionResult.parsedContent.explanation || 'ตรวจวิเคราะห์เรียบร้อย'}
                        </div>

                        {/* Corrections Table */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-purple-300">
                            รายการคำผิดที่พบ ({executionResult.parsedContent.corrections.length}):
                          </span>
                          {executionResult.parsedContent.corrections.map((c, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="line-through text-rose-300 font-bold">{c.original}</span>
                                <span>→</span>
                                <span className="text-emerald-300 font-bold">{c.replacement}</span>
                              </div>
                              <span className="text-[11px] text-plottrix-muted">{c.reason}</span>
                            </div>
                          ))}
                        </div>

                        {/* Corrected Text */}
                        <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30 text-slate-100 text-xs sm:text-sm leading-relaxed font-thai">
                          {executionResult.parsedContent.correctedText}
                        </div>
                      </div>
                    )}

                    {/* TRANSLATE RESULT */}
                    {activeTab === 'translate' && executionResult.parsedContent?.translatedText && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 text-slate-100 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                          {executionResult.parsedContent.translatedText}
                        </div>
                        {executionResult.parsedContent.notes && (
                          <p className="text-xs text-plottrix-muted">
                            <strong>บันทึกวรรณกรรม:</strong> {executionResult.parsedContent.notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* PLOT BRANCH RESULT */}
                    {activeTab === 'plotBranch' && Array.isArray(executionResult.parsedContent?.branches) && (
                      <div className="space-y-3">
                        {executionResult.parsedContent.branches.map((b, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-2">
                            <h5 className="font-bold text-xs sm:text-sm text-purple-300">{b.title}</h5>
                            <p className="text-xs text-slate-300">{b.summary}</p>
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-200 font-thai italic">
                              &ldquo;{b.previewText}&rdquo;
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CONTINUITY RESULT */}
                    {activeTab === 'continuity' && executionResult.parsedContent?.consistencyScore !== undefined && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/40 border border-purple-500/30">
                          <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center font-black text-lg text-white">
                            {executionResult.parsedContent.consistencyScore}%
                          </div>
                          <div className="text-xs">
                            <div className="font-bold text-white">คะแนนความสมเหตุสมผลของเนื้อเรื่อง</div>
                            <div className="text-[11px] text-plottrix-muted">{executionResult.parsedContent.timelineCheck}</div>
                          </div>
                        </div>

                        {Array.isArray(executionResult.parsedContent.inconsistencies) && (
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-purple-300">จุดสังเกตความขัดแย้ง:</span>
                            {executionResult.parsedContent.inconsistencies.map((item, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1">
                                <div className="font-bold text-amber-300">{item.issue} ({item.character})</div>
                                <div className="text-slate-300">{item.solution}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* EXPAND OR RAW FALLBACK */}
                    {(!executionResult.parsedContent || typeof executionResult.parsedContent === 'string' || (!executionResult.parsedContent.polishedText && !executionResult.parsedContent.corrections && !executionResult.parsedContent.translatedText && !executionResult.parsedContent.branches && !executionResult.parsedContent.consistencyScore)) && (
                      <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-thai">
                        {typeof executionResult.parsedContent === 'string'
                          ? executionResult.parsedContent
                          : executionResult.content || JSON.stringify(executionResult.parsedContent, null, 2)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Inspector Footer Toggle */}
              {executionResult && (
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowRawInspector(!showRawInspector)}
                    className="text-xs text-purple-300 hover:text-white underline cursor-pointer font-mono"
                  >
                    {showRawInspector ? '▲ ซ่อน JSON Raw Inspector' : '▼ ตรวจสอบ JSON Request & Response ละเอียด'}
                  </button>

                  <span className="text-[10px] text-plottrix-muted font-mono">
                    Provider: {baseURL.replace('https://', '')}
                  </span>
                </div>
              )}
            </div>

            {/* RAW JSON INSPECTOR */}
            {showRawInspector && executionResult && (
              <div className="rounded-3xl border border-white/10 bg-black/90 p-5 space-y-3 font-mono text-xs animate-fadeIn">
                <div className="font-bold text-purple-300 flex items-center justify-between">
                  <span>RAW PAYLOAD INSPECTION</span>
                  <span className="text-[10px] text-slate-400">{executionResult.reportedModel}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Request Body:</span>
                  <pre className="p-3 rounded-xl bg-white/[0.03] border border-white/5 overflow-x-auto text-[11px] text-emerald-300">
                    {JSON.stringify(executionResult.rawRequest, null, 2)}
                  </pre>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Response Data:</span>
                  <pre className="p-3 rounded-xl bg-white/[0.03] border border-white/5 overflow-x-auto text-[11px] text-purple-200">
                    {JSON.stringify(executionResult.rawResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
