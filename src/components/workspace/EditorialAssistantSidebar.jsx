import React, { memo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import StatusMark from '../react-bits/StatusMark'
import WarmTooltip from '../react-bits/WarmTooltip'
import PromptBar from '../react-bits/PromptBar'
import SpotlightCard from '../react-bits/SpotlightCard'

function EditorialAssistantSidebar() {
  const {
    characters,
    activePersonaId,
    personas,
    triggerAiTask,
    applyAiResult,
    customDictionary,
    editorialCheckOpen,
    setEditorialCheckOpen,
    activePageIdx,
    setActivePageIdx,
    currentChapter,
    currentPageText,
    updateCurrentPageText,
    trixBalance,
    deductTrix,
    addToast,
    isAIProcessing,
    selection,
    aiDrawer
  } = useApp()

  const [activeTab, setActiveTab] = useState('editorial') // 'editorial' | 'plot' | 'translate' | 'chat'
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [targetContextChips, setTargetContextChips] = useState([
    '@ตัวละคร',
    `@บทที่ ${currentChapter?.number || 1}`,
    '@Story Bible'
  ])

  // Custom AI prompt composer response
  const [aiComposerResponse, setAiComposerResponse] = useState(null)

  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0]

  // Handle PromptBar Submission
  const handlePromptSubmit = async (promptText, modelId) => {
    if (isAIProcessing) return

    const targetText = selection.text || currentPageText
    if (!targetText || !targetText.trim()) {
      addToast({
        title: 'กรุณาเลือกข้อความหรือพิมพ์เนื้อหาก่อน',
        description: 'AI ต้องการเนื้อหาอ้างอิงเพื่อประมวลผลคำสั่งของคุณ'
      })
      return
    }

    if (trixBalance < 1) {
      addToast({ title: 'Trix ไม่เพียงพอ กรุณาเติมเหรียญก่อนใช้งาน' })
      return
    }

    // Trigger AI task through AppContext orchestrator
    try {
      triggerAiTask('polish', `${targetText}\n[คำสั่งพิเศษ: ${promptText}]`)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle Plot intro insertion into current page
  const handleInsertPlotIntro = (introText) => {
    if (deductTrix && !deductTrix(4, 'แทรกแนวทางพล็อตตอนต่อไป')) {
      return
    }
    const newText = (currentPageText ? currentPageText + '\n\n' : '') + introText
    updateCurrentPageText(newText)
    addToast({
      title: '🌿 แทรกย่อหน้าเกริ่นนำพล็อตลงในหน้ากระดาษเรียบร้อย',
      description: 'เชิญคุณเขียนดำเนินเรื่องต่อยอดได้ทันที'
    })
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs cursor-pointer"
        onClick={() => setEditorialCheckOpen(false)}
      />

      <aside className="workspace-ai fixed lg:relative right-0 top-0 bottom-0 z-40 w-80 sm:w-96 panel-surface border-l flex flex-col justify-between shrink-0 select-none h-full overflow-hidden shadow-2xl transition-transform duration-200">
        {/* Top Header with Tab Switcher */}
        <div className="p-3 border-b border-violet-500/20 bg-black/20 shrink-0">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-violet-400 text-sm">✦</span>
              <span className="font-extrabold text-xs tracking-wider text-violet-200 uppercase">
                AI STUDIO • WRITING PARTNER
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <button
              type="button"
              onClick={() => setEditorialCheckOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
              title="ปิดแถบ AI Studio"
            >
              ✕
            </button>
          </div>

          {/* Quick Action Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl elevated-surface border text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('editorial')}
              className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
                activeTab === 'editorial'
                  ? 'bg-violet-600 text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white opacity-80'
              }`}
            >
              ตรวจจุดต่าง
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('plot')}
              className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
                activeTab === 'plot'
                  ? 'bg-violet-600 text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white opacity-80'
              }`}
            >
              เลือกพล็อต
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('translate')}
              className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
                activeTab === 'translate'
                  ? 'bg-violet-600 text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white opacity-80'
              }`}
            >
              แปลภาษา
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-violet-600 text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white opacity-80'
              }`}
            >
              สั่ง AI ↵
            </button>
          </div>
        </div>

        {/* Scrollable Main AI Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: EDITORIAL & CONTINUITY CHECK */}
          {activeTab === 'editorial' && (
            <div className="space-y-3.5 animate-fade-in">
              {/* Continuity Score Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-900/30 via-[#18122c] to-[#120d22] border border-violet-500/30 shadow-md">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">ความสอดคล้องข้ามตอน</span>
                  <span className="text-emerald-400 font-extrabold text-sm">
                    {aiDrawer.actionType === 'continuity' && aiDrawer.result?.consistencyScore !== undefined
                      ? `${aiDrawer.result.consistencyScore}%`
                      : 'พร้อมสแกน'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{
                      width: aiDrawer.actionType === 'continuity' && aiDrawer.result?.consistencyScore !== undefined
                        ? `${aiDrawer.result.consistencyScore}%`
                        : '100%'
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  สแกนตรวจเทียบกับ Story Bible ({characters.length} ตัวละคร, {customDictionary.length} คำเฉพาะ)
                </p>
              </div>

              {/* Status Checks List */}
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl elevated-surface border flex items-center gap-2 text-xs">
                  <StatusMark status="done" size={13} doneColor="#34d399" />
                  <span className="text-slate-200">ตรวจคำผิด & ไวยากรณ์ภาษาไทย</span>
                </div>
                <div className="p-2.5 rounded-xl elevated-surface border flex items-center gap-2 text-xs">
                  <StatusMark status="done" size={13} doneColor="#34d399" />
                  <span className="text-slate-200">
                    คงน้ำเสียงสำนวนตาม {activePersona.name.split(' ')[0]}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl elevated-surface border flex items-center gap-2 text-xs">
                  <StatusMark status="done" size={13} doneColor="#34d399" />
                  <span className="text-slate-200">ตรงตาม Lore & Character Bible</span>
                </div>
              </div>

              {/* Dynamic Continuity Findings from Real AI */}
              {aiDrawer.actionType === 'continuity' && aiDrawer.result ? (
                <div className="space-y-2.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    ผลการตรวจความต่อเนื่อง (โดย AI)
                  </span>

                  {aiDrawer.result.timelineCheck && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 text-xs text-slate-300">
                      <strong className="text-violet-300">ลำดับเวลา: </strong>
                      {aiDrawer.result.timelineCheck}
                    </div>
                  )}

                  {aiDrawer.result.bibleAlignment && (
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 text-xs text-slate-300">
                      <strong className="text-violet-300">ความสอดคล้อง Story Bible: </strong>
                      {aiDrawer.result.bibleAlignment}
                    </div>
                  )}

                  {aiDrawer.result.inconsistencies?.length > 0 ? (
                    aiDrawer.result.inconsistencies.map((issue, idx) => (
                      <SpotlightCard key={idx} className="p-3 space-y-1.5 border-amber-500/40">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-300">⚠️ {issue.issue}</span>
                          {issue.character && (
                            <span className="text-[10px] text-slate-400">({issue.character})</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {issue.solution}
                        </p>
                      </SpotlightCard>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                      <span>✓</span>
                      <span>ไม่พบจุดขัดแย้งในฉากนี้ เนื้อเรื่องมีความต่อเนื่องสมบูรณ์</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl elevated-surface border border-white/5 text-center text-xs text-slate-400">
                  คลิกปุ่มด้านล่างเพื่อให้ AI สแกนตรวจเช็กความต่อเนื่อง ตรรกะ และ Story Bible
                </div>
              )}

              <button
                type="button"
                onClick={() => triggerAiTask('continuity')}
                disabled={isAIProcessing}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>✦</span>
                <span>{isAIProcessing ? 'กำลังสแกน...' : 'สแกนตรวจทั้งบทด้วย AI (3 Trix)'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: PLOT SUGGESTIONS & BRANCHING */}
          {activeTab === 'plot' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300">🌿 ทางเลือกเส้นเรื่องตอนต่อไป</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    4 Trix
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  สร้าง 3 เส้นทางจุดประกายไอเดีย พร้อมย่อหน้าเกริ่นนำให้นำไปเขียนต่อได้ทันที
                </p>
              </div>

              {/* Dynamic Real AI Plot Branches */}
              {aiDrawer.actionType === 'plotBranch' && aiDrawer.result?.branches?.length > 0 ? (
                aiDrawer.result.branches.map((b, idx) => (
                  <SpotlightCard key={idx} className="p-3.5 space-y-2 border-violet-500/50">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                        ⭐ ทางเลือกที่ {idx + 1}
                      </span>
                      {b.hook && <span className="text-[10px] text-purple-300">{b.hook}</span>}
                    </div>
                    <div className="text-xs font-bold text-white">{b.title}</div>
                    {b.summary && (
                      <p className="text-xs text-slate-300 leading-relaxed">{b.summary}</p>
                    )}
                    {b.previewText && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-violet-500/20 text-xs novel-font text-violet-100 leading-relaxed">
                        “{b.previewText}”
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleInsertPlotIntro(b.previewText || b.summary)}
                      className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow transition cursor-pointer"
                    >
                      + แทรกย่อหน้าเกริ่นนำเพื่อเขียนต่อ
                    </button>
                  </SpotlightCard>
                ))
              ) : (
                <div className="p-4 rounded-xl elevated-surface border border-white/5 text-center text-xs text-slate-400 space-y-1">
                  <div>🌱 ยังไม่มีทางเลือกพล็อตที่สร้างไว้</div>
                  <div className="text-[11px] text-slate-500">คลิกปุ่มด้านล่างเพื่อให้ AI ช่วยคิด 3 เส้นทางใหม่ตามบริบทฉากปัจจุบัน</div>
                </div>
              )}

              <button
                type="button"
                onClick={() => triggerAiTask('plotBranch')}
                disabled={isAIProcessing}
                className="w-full py-2.5 rounded-xl elevated-surface border border-violet-500/40 hover:border-violet-400 text-violet-300 text-xs font-bold transition cursor-pointer"
              >
                🌱 {isAIProcessing ? 'กำลังคิดพล็อต...' : 'ขอ 3 เส้นเรื่องใหม่จากบริบทปัจจุบัน (4 Trix)'}
              </button>
            </div>
          )}

          {/* TAB 3: CONTEXT-AWARE TRANSLATION */}
          {activeTab === 'translate' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-300">🌐 แปลภาษาคงบริบทนิยาย</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    2 Trix
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  แปลเฉพาะข้อความที่คุณเลือกหรือเนื้อหาในหน้านี้ โดยไม่ออกนอกเรื่องหรือแต่งเพิ่ม
                </p>
              </div>

              {/* Context Tag indicators */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {characters.length > 0 ? (
                  characters.map(c => (
                    <span key={c.id} className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {c.name}: {c.role || 'ตัวละคร'}
                    </span>
                  ))
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                    Story Bible (0 ตัวละคร)
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  โทน: {activePersona.name.split(' ')[0]}
                </span>
              </div>

              {/* Language Selector */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">ภาษาปลายทาง:</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl elevated-surface border text-xs text-white outline-none cursor-pointer"
                >
                  <option value="en">English (International Fantasy)</option>
                  <option value="jp">日本語 (Japanese Light Novel)</option>
                  <option value="cn">中文 (Wuxia / Xianxia Fantasy)</option>
                </select>
              </div>

              {/* Live Real AI Translation Result Card */}
              {aiDrawer.actionType === 'translate' && aiDrawer.result?.translatedText ? (
                <div className="p-3.5 rounded-xl elevated-surface border border-sky-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-white/5">
                    <span className="text-sky-300 font-bold">ผลการแปลคงบริบท:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(aiDrawer.result.translatedText)
                        addToast({ title: '📋 คัดลอกคำแปลคงบริบทเรียบร้อย' })
                      }}
                      className="text-[11px] text-violet-300 hover:underline cursor-pointer"
                    >
                      📋 คัดลอก
                    </button>
                  </div>
                  <div className="novel-font text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {aiDrawer.result.translatedText}
                  </div>
                  {aiDrawer.result.notes && (
                    <div className="text-[11px] text-slate-400 italic pt-1 border-t border-white/5">
                      💡 {aiDrawer.result.notes}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => applyAiResult(aiDrawer.result.translatedText)}
                    className="w-full mt-2 py-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    ✓ นำไปแทนที่ในหน้ากระดาษ
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl elevated-surface border border-white/5 text-center text-xs text-slate-400">
                  คลุมดำข้อความที่ต้องการแปล หรือกดปุ่มด้านล่างเพื่อแปลเนื้อหาในหน้านี้
                </div>
              )}

              <button
                type="button"
                onClick={() => triggerAiTask('translate', null, { language: selectedLanguage })}
                disabled={isAIProcessing}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>🌐</span>
                <span>{isAIProcessing ? 'กำลังแปลภาษา...' : 'แปลข้อความด้วย AI (2 Trix)'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: INTERACTIVE AI COMPOSER & CHAT */}
          {activeTab === 'chat' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-3 rounded-2xl bg-violet-600/15 border border-violet-500/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-violet-300">✦ ผู้ช่วยบรรณาธิการส่วนตัว</span>
                  <span className="text-[10px] text-slate-400">Gemini 3.8 Flash</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  สั่งให้ AI ช่วยเกลาสำนวน, คิดบทสนทนา, หรือแนะนำฉากต่อสู้ได้โดยตรง
                </p>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handlePromptSubmit('ช่วยเกลาประโยคนี้ให้มีความสละสลวยและเข้ากับโทนแฟนตาซีโบราณ', 'gemini-3.8-flash')
                  }
                  className="w-full text-left p-2.5 rounded-xl elevated-surface border hover:border-violet-400/50 text-xs text-slate-200 transition"
                >
                  💡 "เกลาประโยคนี้ให้สละสลวยตามโทนแฟนตาซีโบราณ"
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePromptSubmit('เพิ่มความรู้สึกทางประสาทสัมผัสและบรรยากาศฝนตกให้ฉากนี้', 'gemini-3.8-flash')
                  }
                  className="w-full text-left p-2.5 rounded-xl elevated-surface border hover:border-violet-400/50 text-xs text-slate-200 transition"
                >
                  🌧️ "เพิ่มประสาทสัมผัสและบรรยากาศฝนตกให้ฉากนี้"
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM AI PROMPT COMPOSER (React Bits <PromptBar />) */}
        <div className="p-3 border-t border-violet-500/20 bg-[#16112a] shrink-0">
          <PromptBar
            onSubmit={handlePromptSubmit}
            isProcessing={isAIProcessing}
            contextChips={targetContextChips}
            onRemoveChip={(chip, idx) => {
              setTargetContextChips(prev => prev.filter((_, i) => i !== idx))
            }}
            onAddChip={() => {
              const customTag = prompt('ระบุแท็กบริบท (เช่น @ตัวละคร หรือ @สถานที่):')
              if (customTag && customTag.trim()) {
                setTargetContextChips(prev => [...prev, customTag.trim()])
              }
            }}
          />
        </div>
      </aside>
    </>
  )
}

export default memo(EditorialAssistantSidebar)
