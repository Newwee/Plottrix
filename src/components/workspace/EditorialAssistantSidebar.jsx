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
    selection
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
                  <span className="text-emerald-400 font-extrabold text-sm">98%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full w-[98%]" />
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

              {/* Actionable Continuity Findings with Direct Jump-to-Page Buttons */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  จุดสังเกตความต่อเนื่องรายหน้า (คลิกเพื่อกระโดดไป)
                </span>

                <SpotlightCard className="p-3 space-y-1.5 border-amber-500/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300">⚠️ สรรพนาม / อาวุธ (หน้าที่ 14)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePageIdx(13)
                        addToast({ title: 'นำทางไปยังหน้าที่ 14 แล้ว' })
                      }}
                      className="px-2 py-0.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold shadow transition cursor-pointer"
                    >
                      ไปหน้า 14 →
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ในหน้าที่ 14 ระบุว่ารินลดาถือตะเกียงมือซ้าย แต่ย่อหน้าถัดมาชักกระบี่สั้นด้วยมือซ้าย แนะนำให้แก้เป็นถือตะเกียงด้วยมือขวา
                  </p>
                </SpotlightCard>

                <SpotlightCard className="p-3 space-y-1.5 border-amber-500/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300">⚠️ ลำดับการแนะนำตัว (หน้าที่ 52)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePageIdx(51)
                        addToast({ title: 'นำทางไปยังหน้าที่ 52 แล้ว' })
                      }}
                      className="px-2 py-0.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold shadow transition cursor-pointer"
                    >
                      ไปหน้า 52 →
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    มีการเอ่ยชื่อตัวละครก่อนฉากเปิดเผยชื่อ แนะนำให้ใช้สรรพนามบุรุษที่ 3 หรือฉายาแทนในจุดนี้
                  </p>
                </SpotlightCard>
              </div>

              <button
                type="button"
                onClick={() => triggerAiTask('continuity')}
                disabled={isAIProcessing}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>✦</span>
                <span>สแกนตรวจทั้งบทอีกครั้ง (3 Trix)</span>
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

              {/* Ranked Plot Direction 1 */}
              <SpotlightCard className="p-3.5 space-y-2 border-violet-500/50">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                    ⭐ แนะนำอันดับ 1 • ปมลึกลับ
                  </span>
                  <span className="text-[10px] text-slate-400">เข้ากับ Persona</span>
                </div>
                <div className="text-xs font-bold text-white">แนวทาง A: เปิดเผยผนึกปานจันทร์เสี้ยว</div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-violet-500/20 text-xs novel-font text-violet-100 leading-relaxed">
                  “ชายหนุ่มชะงักสายตาลงที่ข้อมือซ้ายของรินลดา เมื่อแสงตะเกียงส่องกระทบปานรูปจันทร์เสี้ยวที่ซ่อนอยู่ใต้แขนเสื้อคลุม แววตาที่เคยเย็นชาพลันสั่นไหวชั่วครู่...”
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleInsertPlotIntro(
                      'ชายหนุ่มชะงักสายตาลงที่ข้อมือซ้ายของรินลดา เมื่อแสงตะเกียงส่องกระทบปานรูปจันทร์เสี้ยวที่ซ่อนอยู่ใต้แขนเสื้อคลุม แววตาที่เคยเย็นชาพลันสั่นไหวชั่วครู่'
                    )
                  }
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow transition cursor-pointer"
                >
                  + แทรกย่อหน้าเกริ่นนำเพื่อเขียนต่อ
                </button>
              </SpotlightCard>

              {/* Ranked Plot Direction 2 */}
              <SpotlightCard className="p-3.5 space-y-2 border-white/10">
                <div className="text-xs font-bold text-sky-300">แนวทาง B: การปะทะคารมและหยั่งเชิงพลัง</div>
                <div className="p-2.5 rounded-xl bg-black/40 text-xs novel-font text-slate-200 leading-relaxed">
                  “ปลายกระบี่สั้นถูกตวัดขึ้นจ่อห่างจากลำคอของชายหนุ่มเพียงคืบเดียว ทว่าเขากลับไม่แม้แต่จะกะพริบตา ละอองน้ำที่ลอยคว้างรอบตัวเริ่มก่อตัวเป็นม่านหมอกหนาทึบ...”
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleInsertPlotIntro(
                      'ปลายกระบี่สั้นถูกตวัดขึ้นจ่อห่างจากลำคอของชายหนุ่มเพียงคืบเดียว ทว่าเขากลับไม่แม้แต่จะกะพริบตา ละอองน้ำที่ลอยคว้างรอบตัวเริ่มก่อตัวเป็นม่านหมอกหนาทึบ'
                    )
                  }
                  className="w-full py-1.5 rounded-xl elevated-surface border hover:border-violet-500 text-xs text-slate-200 transition cursor-pointer"
                >
                  + แทรกย่อหน้าเกริ่นนำ
                </button>
              </SpotlightCard>

              <button
                type="button"
                onClick={() => triggerAiTask('plotBranch')}
                disabled={isAIProcessing}
                className="w-full py-2.5 rounded-xl elevated-surface border border-violet-500/40 hover:border-violet-400 text-violet-300 text-xs font-bold transition cursor-pointer"
              >
                🌱 ขอ 3 เส้นเรื่องใหม่จากบริบทปัจจุบัน (4 Trix)
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
                  อ้างอิงสรรพนามตัวละครและโทนเรื่องจาก Story Bible อัตโนมัติ ไม่แปลแข็งทื่อ
                </p>
              </div>

              {/* Context Tag indicators */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  รินลดา = She/Her
                </span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  ศรุต = He/Him
                </span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  โทน: วรรณกรรมกวีนิพนธ์
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

              {/* Live Translation Preview Card */}
              <div className="p-3.5 rounded-xl elevated-surface border border-sky-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <span className="text-sky-300 font-bold">ตัวอย่างผลลัพธ์คงบริบท:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const text =
                        selectedLanguage === 'en'
                          ? `Rinlada tightened her grip on the short sword beneath her cloak. Though her heart pounded with trepidation, her gaze remained resolute.\n\n"I came to demand answers regarding my clan, not to become a slave to a demon's promise," she replied in an icy tone.`
                          : `リンラダは外套の下で短剣の柄を強く握りしめた。恐怖に鼓動が早鐘を打ちながらも、その瞳は揺るぎない決意を宿していた。`
                      navigator.clipboard.writeText(text)
                      addToast({ title: '📋 คัดลอกคำแปลคงบริบทเรียบร้อย' })
                    }}
                    className="text-[11px] text-violet-300 hover:underline cursor-pointer"
                  >
                    📋 คัดลอก
                  </button>
                </div>
                <div className="novel-font text-slate-200 leading-relaxed">
                  {selectedLanguage === 'en' ? (
                    <>
                      Rinlada tightened her grip on the short sword beneath her cloak. Though her heart pounded with trepidation, her gaze remained resolute.<br /><br />
                      "I came to demand answers regarding my clan, not to become a slave to a demon's promise," she replied in an icy tone.
                    </>
                  ) : selectedLanguage === 'jp' ? (
                    <>
                      リンラダは外套の下で短剣の柄を強く握りしめた。恐怖に鼓動が早鐘を打ちながらも、その瞳は揺るぎない決意を宿していた。<br /><br />
                      「一族の真実を問うために来たのです。悪魔の契約の奴隷になるためではありません」彼女は冷ややかな声で答えた。
                    </>
                  ) : (
                    <>
                      琳拉达在披风下紧紧握住短剑剑柄。尽管心跳如鼓，她的眼神却依旧坚定不移。<br /><br />
                      “我此行是为追寻家族真相而来，绝非为了沦为妖魔契约的奴仆。”她声音冰冷地答道。
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => triggerAiTask('translate')}
                disabled={isAIProcessing}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>🌐</span>
                <span>แปลหน้านี้ด้วยบริบทตัวละคร (2 Trix)</span>
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
              const customTag = prompt('ระบุแท็กบริบท (เช่น @ศรุต หรือ @ปมศิลาจันทรา):')
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
