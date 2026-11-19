import React, { useRef, useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import WarmTooltip, { WarmTooltipGroup } from '../react-bits/WarmTooltip'
import StatusMark from '../react-bits/StatusMark'
import FloatingAiToolbar from './FloatingAiToolbar'

export default function StudioEditor() {
  const {
    currentChapter,
    activeChapterId,
    setChapters,
    activePageIdx, setActivePageIdx,
    currentPageText, updateCurrentPageText,
    addPage, deletePage,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    paperTheme, setPaperTheme,
    selection, setSelection,
    triggerAiTask,
    personas, activePersonaId,
    saveStatus,
    trixBalance,
    addToast,
    isAIProcessing,
    activeAITool
  } = useApp()

  const textareaRef = useRef(null)
  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0]
  const [showSuggestion, setShowSuggestion] = useState(true)

  // Auto-resize textarea to fit content naturally
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(460, textareaRef.current.scrollHeight)}px`
    }
  }, [currentPageText])

  // Track selection
  const handleSelect = (e) => {
    const start = e.target.selectionStart
    const end = e.target.selectionEnd
    const selectedText = currentPageText.substring(start, end)
    setSelection({ text: selectedText, start, end })
  }

  // Quick Format Helpers
  const handleInsertIndent = () => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    const start = el.selectionStart
    const newText = currentPageText.substring(0, start) + '    ' + currentPageText.substring(start)
    updateCurrentPageText(newText)
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + 4
      el.focus()
    }, 10)
  }

  const handleInsertDialogue = () => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = currentPageText.substring(start, end)
    const replacement = `“${selected || 'คำพูด'}”`
    const newText = currentPageText.substring(0, start) + replacement + currentPageText.substring(end)
    updateCurrentPageText(newText)
    setTimeout(() => {
      el.selectionStart = start + 1
      el.selectionEnd = start + 1 + (selected.length || 6)
      el.focus()
    }, 10)
  }

  const handleInsertSceneBreak = () => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    const start = el.selectionStart
    const newText = currentPageText.substring(0, start) + '\n\n***\n\n' + currentPageText.substring(start)
    updateCurrentPageText(newText)
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + 7
      el.focus()
    }, 10)
  }

  // Handle applying persona suggestion card
  const handleApplySuggestion = () => {
    const suggestedText = 'หญิงสาวทอดสายตาผ่านม่านน้ำฝนไปยังเงาร่างลึกลับที่ยืนนิ่งอยู่ใต้ซุ้มไม้เลื้อย'
    if (currentPageText.includes('รินลดาหยุดฝีเท้า')) {
      const replaced = currentPageText.replace(
        'รินลดาหยุดฝีเท้า ดวงตาคู่เรียวมองฝ่าม่านน้ำฝนไปยังเงาร่างลึกลับที่ยืนนิ่งอยู่ใต้ซุ้มไม้เลื้อย',
        suggestedText
      )
      updateCurrentPageText(replaced)
    } else {
      updateCurrentPageText(currentPageText + '\n\n' + suggestedText)
    }
    setShowSuggestion(false)
    addToast({
      title: 'ปรับใช้สำนวนแนะนำเรียบร้อย!',
      description: 'ข้อความถูกขัดเกลาตาม Style Persona เรียบร้อย',
      fuseColor: '#74d9b4'
    })
  }

  // Word count & reading time
  const pageWords = currentPageText.trim() ? currentPageText.trim().replace(/\s+/g, ' ').length : 0
  const readingTime = (pageWords / 450).toFixed(1)

  return (
    <div
      id="tour-target-editor"
      className="flex-1 flex flex-col h-full overflow-hidden relative studio-editor-area"
    >
      {/* Floating AI Context Toolbar inside Studio Editor */}
      <FloatingAiToolbar />

      {/* Top Controls Subbar */}
      <div className="h-11 px-4 border-b border-plottrix-line/40 bg-plottrix-panel2/50 flex items-center justify-between gap-3 text-xs shrink-0 backdrop-blur-md">
        {/* Left: Chapter & Page Tabs */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-plottrix-purple2">
            บทที่ {currentChapter?.number || 1}
          </span>
          <span className="text-plottrix-line">/</span>
          <div className="flex items-center gap-1 bg-plottrix-panel/80 p-0.5 rounded-lg border border-plottrix-line/40">
            {currentChapter?.pages?.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActivePageIdx(idx)}
                className={`px-2 py-0.5 rounded-md font-medium transition text-[11px] ${
                  activePageIdx === idx
                    ? 'bg-plottrix-purple text-white font-bold shadow-xs'
                    : 'text-plottrix-muted hover:text-white'
                }`}
              >
                หน้า {idx + 1}
              </button>
            ))}
            <WarmTooltip content="เพิ่มหน้าใหม่" shortcut="⌘P" side="bottom">
              <button
                onClick={addPage}
                className="px-1.5 py-0.5 rounded text-[11px] text-plottrix-purple2 hover:text-white hover:bg-plottrix-purple/20 font-bold"
              >
                + หน้า
              </button>
            </WarmTooltip>
          </div>
        </div>

        {/* Center: Formatting Helpers */}
        <WarmTooltipGroup delay={200}>
          <div className="flex items-center gap-1">
            <WarmTooltip content="แทรกย่อหน้า (Tab)" shortcut="Tab" side="bottom">
              <button
                onClick={handleInsertIndent}
                className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-plottrix-text text-[11px] transition"
              >
                ⇥ ย่อหน้า
              </button>
            </WarmTooltip>

            <WarmTooltip content="ครอบ “คำพูด”" shortcut="⌘Q" side="bottom">
              <button
                onClick={handleInsertDialogue}
                className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-plottrix-text text-[11px] font-serif transition"
              >
                “คำพูด”
              </button>
            </WarmTooltip>

            <WarmTooltip content="แทรกจุดแบ่งฉาก ***" shortcut="⌘B" side="bottom">
              <button
                onClick={handleInsertSceneBreak}
                className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-plottrix-text text-[11px] font-mono tracking-widest transition"
              >
                ***
              </button>
            </WarmTooltip>
          </div>
        </WarmTooltipGroup>

        {/* Right: Typography & Theme */}
        <div className="flex items-center gap-2">
          {/* Font Size */}
          <div className="flex items-center bg-plottrix-panel px-1 py-0.5 rounded-md border border-plottrix-line/40">
            <button
              onClick={() => setFontSize(s => Math.max(14, s - 1))}
              className="px-1 text-[11px] text-plottrix-muted hover:text-white font-bold"
            >
              ก-
            </button>
            <span className="text-[11px] font-mono text-plottrix-text w-6 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize(s => Math.min(24, s + 1))}
              className="px-1 text-[11px] text-plottrix-muted hover:text-white font-bold"
            >
              ก+
            </button>
          </div>

          {/* Theme Dots */}
          <div className="flex items-center gap-1">
            <WarmTooltip content="Midnight Obsidian" side="bottom">
              <button
                onClick={() => setPaperTheme('midnight')}
                className={`w-3.5 h-3.5 rounded-full bg-[#130e24] border border-plottrix-purple/40 ${
                  paperTheme === 'midnight' ? 'ring-2 ring-plottrix-purple2' : 'opacity-60'
                }`}
              />
            </WarmTooltip>
            <WarmTooltip content="Velvet Royal" side="bottom">
              <button
                onClick={() => setPaperTheme('velvet')}
                className={`w-3.5 h-3.5 rounded-full bg-[#1e1338] border border-plottrix-purple/50 ${
                  paperTheme === 'velvet' ? 'ring-2 ring-plottrix-purple2' : 'opacity-60'
                }`}
              />
            </WarmTooltip>
            <WarmTooltip content="Sepia Cream" side="bottom">
              <button
                onClick={() => setPaperTheme('cream')}
                className={`w-3.5 h-3.5 rounded-full bg-[#f9f6ef] border border-slate-300 ${
                  paperTheme === 'cream' ? 'ring-2 ring-plottrix-purple2' : 'opacity-60'
                }`}
              />
            </WarmTooltip>
          </div>
        </div>
      </div>

      {/* Main Paper Content Area */}
      <div className={`workspace-paper flex-1 min-h-0 overflow-y-auto paper-theme-${paperTheme} relative`}>
        {/* Document Overline & Title */}
        <div className="paper-overline">
          CHAPTER {String(currentChapter?.number || 1).padStart(2, '0')} • PAGE {activePageIdx + 1}
        </div>

        <input
          type="text"
          value={currentChapter?.title || ''}
          onChange={(e) => {
            const val = e.target.value
            setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: val } : c))
          }}
          placeholder="ตั้งชื่อตอนที่นี่..."
          className="paper-title bg-transparent border-0 outline-none w-full p-0 text-plottrix-text hover:opacity-90 focus:opacity-100"
        />

        {/* Inline AI Action Toolbar */}
        <div className="inline-toolbar">
          <WarmTooltip content="ตรวจคำผิด & ไวยากรณ์ (1 Trix)" side="top">
            <button
              disabled={isAIProcessing}
              onClick={() => triggerAiTask('proofread')}
              className={activeAITool === 'proofread' ? 'animate-pulse text-purple-400' : ''}
              title="ตรวจคำผิด"
            >
              🔍
            </button>
          </WarmTooltip>

          <WarmTooltip content={`ขัดเกลาสำนวนตาม ${activePersona.name} (3 Trix)`} side="top">
            <button
              disabled={isAIProcessing}
              onClick={() => triggerAiTask('polish')}
              className={activeAITool === 'polish' ? 'animate-pulse text-purple-400' : ''}
              title="เกลาสำนวน"
            >
              ✦
            </button>
          </WarmTooltip>

          <WarmTooltip content="เสนอ 3 ทางแยกเนื้อเรื่อง (4 Trix)" side="top">
            <button
              disabled={isAIProcessing}
              onClick={() => triggerAiTask('plotBranch')}
              className={activeAITool === 'plotBranch' ? 'animate-pulse text-purple-400' : ''}
              title="3 ทางแยกพล็อต"
            >
              🌱
            </button>
          </WarmTooltip>

          <WarmTooltip content="แปลวรรณกรรมภาษาอังกฤษ (2 Trix)" side="top">
            <button
              disabled={isAIProcessing}
              onClick={() => triggerAiTask('translate')}
              className={activeAITool === 'translate' ? 'animate-pulse text-purple-400' : ''}
              title="แปลวรรณกรรม"
            >
              🌐
            </button>
          </WarmTooltip>
        </div>

        {/* Core Editable Area */}
        <textarea
          id="tour-target-editor-text"
          ref={textareaRef}
          value={currentPageText}
          onChange={(e) => updateCurrentPageText(e.target.value)}
          onSelect={handleSelect}
          onKeyUp={handleSelect}
          onMouseUp={handleSelect}
          placeholder="จรดปลายนิ้ว เขียนเรื่องราวของคุณที่นี่..."
          style={{ fontSize: `${fontSize}px`, lineHeight: 2.1 }}
          className="w-full bg-transparent resize-none outline-none leading-relaxed tracking-wide text-inherit placeholder:opacity-35 min-h-[460px]"
        />

        {/* Floating Style Persona Suggestion Card */}
        {showSuggestion && (
          <div className="suggestion relative group">
            <button
              type="button"
              onClick={() => setShowSuggestion(false)}
              className="absolute top-2 right-2 w-5 h-5 rounded-full hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-[10px] transition cursor-pointer"
              title="ปิดการ์ดคำแนะนำ"
            >
              ✕
            </button>
            <small>
              <span>✦</span>
              <span>STYLE PERSONA · {activePersona.name.split(' ')[0]}</span>
            </small>
            <strong>คำแนะนำการเกลาสำนวนตามโปรไฟล์</strong>
            <span>ลองพิจารณา: "หญิงสาวทอดสายตาผ่านม่านน้ำฝน..."</span>
            <button onClick={handleApplySuggestion} className="fix-pill">
              ใช้คำนี้ ↗
            </button>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="editor-bottom shrink-0 flex items-center justify-between px-4 py-2 border-t border-plottrix-line/30 bg-[#120d22]/80 text-[11px] text-plottrix-muted">
        <div className="flex items-center gap-2">
          <StatusMark
            status={saveStatus === 'saving' ? 'running' : 'done'}
            size={12}
            fontSize={11}
            label={saveStatus === 'saving' ? 'กำลังบันทึก...' : 'บันทึกแล้ว ✓'}
            doneColor="#34d399"
          />
        </div>

        <div className="flex items-center gap-3">
          <span>{pageWords} คำ</span>
          <span>•</span>
          <span>เวลาอ่าน ~{readingTime} นาที</span>
        </div>
      </div>
    </div>
  )
}
