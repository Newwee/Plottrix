import React, { memo, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import WarmTooltip, { WarmTooltipGroup } from '../react-bits/WarmTooltip'
import StatusMark from '../react-bits/StatusMark'
import FloatingAiToolbar from './FloatingAiToolbar'

function StudioEditor() {
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
    saveStatus, setSaveStatus,
    trixBalance,
    addToast,
    isAIProcessing,
    activeAITool
  } = useApp()

  const textareaRef = useRef(null)
  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0]
  const [showSuggestion, setShowSuggestion] = useState(true)

  // Local text state for ultra-fast 60 FPS typing without re-rendering the whole app tree
  const [localText, setLocalText] = useState(currentPageText || '')
  const syncTimerRef = useRef(null)
  const isLocalDirtyRef = useRef(false)

  // Synchronize localText whenever currentPageText changes from outside (e.g. AI replacement or page flip)
  useEffect(() => {
    if (!isLocalDirtyRef.current || currentPageText !== localText) {
      setLocalText(currentPageText || '')
      isLocalDirtyRef.current = false
    }
  }, [currentPageText])

  // Debounced auto-save to AppContext (1.8s debounce)
  const triggerDebouncedSync = useCallback((textToSave) => {
    isLocalDirtyRef.current = true
    if (setSaveStatus) setSaveStatus('saving')

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
    }

    syncTimerRef.current = setTimeout(() => {
      updateCurrentPageText(textToSave)
      isLocalDirtyRef.current = false
    }, 1800)
  }, [updateCurrentPageText, setSaveStatus])

  // Flush on blur or unmount
  const flushSave = useCallback(() => {
    if (isLocalDirtyRef.current) {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      updateCurrentPageText(localText)
      isLocalDirtyRef.current = false
    }
  }, [localText, updateCurrentPageText])

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    }
  }, [])

  // Debounced Word count & reading time (300ms) to avoid running regex on every single keystroke
  const [wordMetrics, setWordMetrics] = useState({ words: 0, time: '0.0' })
  useEffect(() => {
    const timer = setTimeout(() => {
      const words = localText.trim() ? localText.trim().replace(/\s+/g, ' ').length : 0
      const time = (words / 450).toFixed(1)
      setWordMetrics({ words, time })
    }, 300)

    return () => clearTimeout(timer)
  }, [localText])

  // Auto-resize textarea to fit content naturally
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(460, textareaRef.current.scrollHeight)}px`
    }
  }, [localText])

  // Handle typing in textarea
  const handleTextChange = (e) => {
    const val = e.target.value
    setLocalText(val)
    triggerDebouncedSync(val)
  }

  // Track selection
  const handleSelect = (e) => {
    const start = e.target.selectionStart
    const end = e.target.selectionEnd
    const selectedText = localText.substring(start, end)
    setSelection({ text: selectedText, start, end })
  }

  // Quick Format Helpers
  const handleInsertIndent = () => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    const start = el.selectionStart
    const newText = localText.substring(0, start) + '    ' + localText.substring(start)
    setLocalText(newText)
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
    const selected = localText.substring(start, end)
    const replacement = `“${selected || 'คำพูด'}”`
    const newText = localText.substring(0, start) + replacement + localText.substring(end)
    setLocalText(newText)
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
    const newText = localText.substring(0, start) + '\n\n***\n\n' + localText.substring(start)
    setLocalText(newText)
    updateCurrentPageText(newText)
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + 7
      el.focus()
    }, 10)
  }

  // Handle applying persona suggestion card
  const handleApplySuggestion = () => {
    const suggestedText = 'หญิงสาวทอดสายตาผ่านม่านน้ำฝนไปยังเงาร่างลึกลับที่ยืนนิ่งอยู่ใต้ซุ้มไม้เลื้อย'
    let replaced
    if (localText.includes('รินลดาหยุดฝีเท้า')) {
      replaced = localText.replace(
        'รินลดาหยุดฝีเท้า ดวงตาคู่เรียวมองฝ่าม่านน้ำฝนไปยังเงาร่างลึกลับที่ยืนนิ่งอยู่ใต้ซุ้มไม้เลื้อย',
        suggestedText
      )
    } else {
      replaced = localText + '\n\n' + suggestedText
    }
    setLocalText(replaced)
    updateCurrentPageText(replaced)
    setShowSuggestion(false)
    addToast({
      title: 'ปรับใช้สำนวนแนะนำเรียบร้อย!',
      description: 'ข้อความถูกขัดเกลาตาม Style Persona เรียบร้อย',
      fuseColor: '#74d9b4'
    })
  }

  return (
    <div
      id="tour-target-editor"
      className="flex-1 flex flex-col h-full overflow-hidden relative studio-editor-area"
    >
      {/* Floating AI Context Toolbar inside Studio Editor */}
      <FloatingAiToolbar />

      {/* Top Controls Subbar (Responsive scroll on mobile) */}
      <div className="h-12 px-3 sm:px-4 border-b border-plottrix-line/40 bg-plottrix-panel2/50 flex items-center justify-between gap-3 text-xs shrink-0 backdrop-blur-md overflow-x-auto no-scrollbar">
        {/* Left: Chapter & Page Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-plottrix-purple2 whitespace-nowrap">
            บทที่ {currentChapter?.number || 1}
          </span>
          <span className="text-plottrix-line">/</span>
          <div className="flex items-center gap-1 bg-plottrix-panel/80 p-0.5 rounded-lg border border-plottrix-line/40">
            {currentChapter?.pages?.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  flushSave()
                  setActivePageIdx(idx)
                }}
                className={`px-2.5 py-1 min-h-[30px] rounded-md font-medium transition text-[11px] cursor-pointer whitespace-nowrap ${
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
                type="button"
                onClick={() => {
                  flushSave()
                  addPage()
                }}
                className="px-2 py-1 min-h-[30px] rounded text-[11px] text-plottrix-purple2 hover:text-white hover:bg-plottrix-purple/20 font-bold cursor-pointer whitespace-nowrap"
              >
                + หน้า
              </button>
            </WarmTooltip>
          </div>
        </div>

        {/* Center: Formatting Helpers */}
        <WarmTooltipGroup delay={200}>
          <div className="flex items-center gap-1 shrink-0">
            <WarmTooltip content="แทรกย่อหน้า (Tab)" shortcut="Tab" side="bottom">
              <button
                type="button"
                onClick={handleInsertIndent}
                className="px-2.5 py-1.5 min-h-[32px] rounded-md bg-white/5 hover:bg-white/10 text-plottrix-text text-[11px] transition cursor-pointer whitespace-nowrap"
              >
                ⇥ ย่อหน้า
              </button>
            </WarmTooltip>

            <WarmTooltip content="ครอบ “คำพูด”" shortcut="⌘Q" side="bottom">
              <button
                type="button"
                onClick={handleInsertDialogue}
                className="px-2.5 py-1.5 min-h-[32px] rounded-md bg-white/5 hover:bg-white/10 text-plottrix-text text-[11px] font-serif transition cursor-pointer whitespace-nowrap"
              >
                “คำพูด”
              </button>
            </WarmTooltip>

            <WarmTooltip content="แทรกจุดแบ่งฉาก ***" shortcut="⌘B" side="bottom">
              <button
                type="button"
                onClick={handleInsertSceneBreak}
                className="px-2.5 py-1.5 min-h-[32px] rounded-md bg-white/5 hover:bg-white/10 text-plottrix-text text-[11px] font-mono tracking-widest transition cursor-pointer whitespace-nowrap"
              >
                ***
              </button>
            </WarmTooltip>
          </div>
        </WarmTooltipGroup>

        {/* Right: Typography & Theme */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Font Size */}
          <div className="flex items-center bg-plottrix-panel px-1 py-0.5 rounded-md border border-plottrix-line/40">
            <button
              type="button"
              onClick={() => setFontSize(s => Math.max(14, s - 1))}
              className="px-1.5 py-1 min-h-[28px] text-[11px] text-plottrix-muted hover:text-white font-bold cursor-pointer"
            >
              ก-
            </button>
            <span className="text-[11px] font-mono text-plottrix-text w-6 text-center">{fontSize}</span>
            <button
              type="button"
              onClick={() => setFontSize(s => Math.min(24, s + 1))}
              className="px-1.5 py-1 min-h-[28px] text-[11px] text-plottrix-muted hover:text-white font-bold cursor-pointer"
            >
              ก+
            </button>
          </div>

          {/* Theme Dots */}
          <div className="flex items-center gap-1.5">
            <WarmTooltip content="Midnight Obsidian" side="bottom">
              <button
                type="button"
                onClick={() => setPaperTheme('midnight')}
                className={`w-4 h-4 rounded-full bg-[#130e24] border border-plottrix-purple/40 cursor-pointer ${
                  paperTheme === 'midnight' ? 'ring-2 ring-plottrix-purple2' : 'opacity-60'
                }`}
              />
            </WarmTooltip>
            <WarmTooltip content="Velvet Royal" side="bottom">
              <button
                type="button"
                onClick={() => setPaperTheme('velvet')}
                className={`w-4 h-4 rounded-full bg-[#1e1338] border border-plottrix-purple/50 cursor-pointer ${
                  paperTheme === 'velvet' ? 'ring-2 ring-plottrix-purple2' : 'opacity-60'
                }`}
              />
            </WarmTooltip>
            <WarmTooltip content="Sepia Cream" side="bottom">
              <button
                type="button"
                onClick={() => setPaperTheme('cream')}
                className={`w-4 h-4 rounded-full bg-[#f9f6ef] border border-slate-300 cursor-pointer ${
                  paperTheme === 'cream' ? 'ring-2 ring-plottrix-purple2' : 'opacity-60'
                }`}
              />
            </WarmTooltip>
          </div>
        </div>
      </div>

      {/* Main Paper Content Area (Virtualization: Only renders the active page) */}
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
              type="button"
              disabled={isAIProcessing}
              onClick={() => triggerAiTask('proofread')}
              className={`min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer ${activeAITool === 'proofread' ? 'animate-pulse text-purple-400' : ''}`}
              title="ตรวจคำผิด"
            >
              🔍
            </button>
          </WarmTooltip>

          <WarmTooltip content={`ขัดเกลาสำนวนตาม ${activePersona.name} (3 Trix)`} side="top">
            <button
              type="button"
              disabled={isAIProcessing}
              onClick={() => triggerAiTask('polish')}
              className={`min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer ${activeAITool === 'polish' ? 'animate-pulse text-purple-400' : ''}`}
              title="เกลาสำนวน"
            >
              ✦
            </button>
          </WarmTooltip>

          <WarmTooltip content="เสนอ 3 ทางแยกเนื้อเรื่อง (4 Trix)" side="top">
            <button
              type="button"
              disabled={isAIProcessing}
              onClick={() => triggerAiTask('plotBranch')}
              className={`min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer ${activeAITool === 'plotBranch' ? 'animate-pulse text-purple-400' : ''}`}
              title="3 ทางแยกพล็อต"
            >
              🌱
            </button>
          </WarmTooltip>

          <WarmTooltip content="แปลวรรณกรรมภาษาอังกฤษ (2 Trix)" side="top">
            <button
              type="button"
              disabled={isAIProcessing}
              onClick={() => triggerAiTask('translate')}
              className={`min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer ${activeAITool === 'translate' ? 'animate-pulse text-purple-400' : ''}`}
              title="แปลวรรณกรรม"
            >
              🌐
            </button>
          </WarmTooltip>
        </div>

        {/* Core Editable Area (Virtualization: Active page only) */}
        <textarea
          id="tour-target-editor-text"
          ref={textareaRef}
          value={localText}
          onChange={handleTextChange}
          onBlur={flushSave}
          onSelect={handleSelect}
          onKeyUp={handleSelect}
          onMouseUp={handleSelect}
          onTouchEnd={handleSelect}
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
              className="absolute top-2 right-2 w-6 h-6 rounded-full hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
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
            <button type="button" onClick={handleApplySuggestion} className="fix-pill cursor-pointer">
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
          <span>{wordMetrics.words} คำ</span>
          <span>•</span>
          <span>เวลาอ่าน ~{wordMetrics.time} นาที</span>
        </div>
      </div>
    </div>
  )
}

export default memo(StudioEditor)
