import React, { memo, useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import AnimatedContent from '../react-bits/AnimatedContent'
import WarmTooltip, { WarmTooltipGroup } from '../WarmTooltip'
import StatusMark from '../react-bits/StatusMark'

function FloatingAiToolbar() {
  const {
    triggerAiTask,
    applyAiResult,
    selection,
    setSelection,
    isAIProcessing,
    activeAITool,
    cancelAITask,
    aiDrawer
  } = useApp()

  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 120, left: 100 })
  const [activeMenu, setActiveMenu] = useState(null) // null | 'customAssistant' | 'diffPreview'
  const [customPrompt, setCustomPrompt] = useState('')
  const [previewResult, setPreviewResult] = useState(null)

  // Dragging State & Pointer Capture
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, startTop: 0, startLeft: 0 })
  const userHasDraggedRef = useRef(false)

  const toolbarRef = useRef(null)

  // Pointer Event Drag Handlers
  const handlePointerDown = (e) => {
    // Avoid dragging when clicking interactive elements
    if (e.target.closest('button, input, textarea, a, select')) return
    e.preventDefault()
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (_) {}
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTop: position.top,
      startLeft: position.left
    }
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const el = toolbarRef.current
    const w = el?.offsetWidth || 380
    const h = el?.offsetHeight || 60

    const clampedTop = Math.max(16, Math.min(window.innerHeight - h - 16, dragRef.current.startTop + dy))
    const clampedLeft = Math.max(16, Math.min(window.innerWidth - w - 16, dragRef.current.startLeft + dx))

    setPosition({ top: clampedTop, left: clampedLeft })
    userHasDraggedRef.current = true
  }

  const handlePointerUp = (e) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch (_) {}
      setIsDragging(false)
    }
  }

  // Listen to selection changes within editor (textarea & DOM selection)
  const handleSelection = useCallback(() => {
    let selectedText = ''
    let rect = null

    // 1. Check textarea first
    const editorEl = document.getElementById('tour-target-editor-text')
    if (editorEl && typeof editorEl.selectionStart === 'number' && typeof editorEl.selectionEnd === 'number') {
      const start = editorEl.selectionStart
      const end = editorEl.selectionEnd
      if (end > start) {
        const val = editorEl.value || ''
        const candidate = val.substring(start, end).trim()
        if (candidate.length >= 2) {
          selectedText = candidate
          setSelection({ text: candidate, start, end })

          const editorRect = editorEl.getBoundingClientRect()
          const lines = val.substring(0, start).split('\n').length
          const approxLineHeight = 28
          const relativeY = Math.min(editorRect.height - 40, lines * approxLineHeight)

          rect = {
            top: Math.max(editorRect.top + 20, Math.min(window.innerHeight - 120, editorRect.top + relativeY)),
            bottom: Math.min(window.innerHeight - 60, editorRect.top + relativeY + 40),
            left: editorRect.left + 40,
            right: editorRect.right - 40,
            width: Math.min(500, editorRect.width - 80)
          }
        }
      }
    }

    // 2. Fallback to DOM selection
    if (!selectedText) {
      const sel = window.getSelection()
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        const text = sel.toString().trim()
        if (text.length >= 2) {
          const range = sel.getRangeAt(0)
          const rangeRect = range.getBoundingClientRect()
          if (rangeRect.width > 0 && rangeRect.height > 0) {
            selectedText = text
            setSelection({ text, start: 0, end: text.length })
            rect = rangeRect
          }
        }
      }
    }

    if (!selectedText || !rect) {
      if (!previewResult && !isAIProcessing) {
        setVisible(false)
        setActiveMenu(null)
        userHasDraggedRef.current = false
      }
      return
    }

    // Only compute default position if user has NOT manually dragged the toolbar
    if (!userHasDraggedRef.current) {
      const isTouch = (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0))
      const toolbarWidth = Math.min(420, window.innerWidth - 32)
      const toolbarHeight = 52
      const extraOffset = isTouch ? 28 : 12

      let top = rect.top - toolbarHeight - extraOffset
      let left = rect.left + rect.width / 2 - toolbarWidth / 2

      if (top < 70) {
        top = rect.bottom + extraOffset
      }
      if (left < 16) left = 16
      if (left + toolbarWidth > window.innerWidth - 16) {
        left = window.innerWidth - toolbarWidth - 16
      }

      setPosition({ top, left })
    }

    setVisible(true)
  }, [previewResult, isAIProcessing, setSelection])

  // Sync when selection text changes in AppContext
  useEffect(() => {
    if (selection?.text && selection.text.trim().length >= 2) {
      if (!userHasDraggedRef.current) {
        const editorEl = document.getElementById('tour-target-editor-text')
        if (editorEl) {
          const editorRect = editorEl.getBoundingClientRect()
          const toolbarWidth = Math.min(420, window.innerWidth - 32)
          let top = Math.max(90, Math.min(window.innerHeight - 100, editorRect.top + 70))
          let left = Math.max(16, Math.min(window.innerWidth - toolbarWidth - 16, editorRect.left + (editorRect.width - toolbarWidth) / 2))
          setPosition({ top, left })
        }
      }
      setVisible(true)
    }
  }, [selection?.text])

  useEffect(() => {
    let timeoutId = null
    const debouncedSelection = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleSelection, 70)
    }

    document.addEventListener('selectionchange', debouncedSelection)
    document.addEventListener('mouseup', debouncedSelection)
    document.addEventListener('keyup', debouncedSelection)
    document.addEventListener('touchend', debouncedSelection, { passive: true })

    const editorEl = document.getElementById('tour-target-editor-text')
    if (editorEl) {
      editorEl.addEventListener('select', debouncedSelection)
      editorEl.addEventListener('mouseup', debouncedSelection)
      editorEl.addEventListener('keyup', debouncedSelection)
    }

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('selectionchange', debouncedSelection)
      document.removeEventListener('mouseup', debouncedSelection)
      document.removeEventListener('keyup', debouncedSelection)
      document.removeEventListener('touchend', debouncedSelection)
      if (editorEl) {
        editorEl.removeEventListener('select', debouncedSelection)
        editorEl.removeEventListener('mouseup', debouncedSelection)
        editorEl.removeEventListener('keyup', debouncedSelection)
      }
    }
  }, [handleSelection])

  // Sync AI result when completed
  useEffect(() => {
    if (aiDrawer.result && visible) {
      if (aiDrawer.result.correctedText) {
        setPreviewResult(aiDrawer.result.correctedText)
        setActiveMenu('diffPreview')
      } else if (aiDrawer.result.polishedText) {
        setPreviewResult(aiDrawer.result.polishedText)
        setActiveMenu('diffPreview')
      } else if (aiDrawer.result.translatedText) {
        setPreviewResult(aiDrawer.result.translatedText)
        setActiveMenu('diffPreview')
      }
    }
  }, [aiDrawer.result, visible])

  if (!visible) return null

  const handleCommand = (actionType) => {
    if (isAIProcessing) return
    triggerAiTask(actionType, selection.text)
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (!customPrompt.trim() || isAIProcessing) return
    triggerAiTask('polish', `${selection.text}\n[คำสั่งพิเศษ: ${customPrompt.trim()}]`)
    setCustomPrompt('')
  }

  const handleAcceptDiff = () => {
    if (previewResult) {
      applyAiResult(previewResult)
      setPreviewResult(null)
      setVisible(false)
      setActiveMenu(null)
      userHasDraggedRef.current = false
    }
  }

  const handleRejectDiff = () => {
    setPreviewResult(null)
    setActiveMenu(null)
  }

  const handleClose = () => {
    if (isAIProcessing) {
      cancelAITask()
    }
    setVisible(false)
    setActiveMenu(null)
    setPreviewResult(null)
    userHasDraggedRef.current = false
  }

  return (
    <div
      ref={toolbarRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`fixed z-50 pointer-events-auto select-none max-w-[calc(100vw-32px)] ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        touchAction: 'none'
      }}
    >
      <AnimatedContent distance={8} direction="vertical" duration={0.2}>
        <div className="rounded-2xl p-2 shadow-[0_16px_50px_rgba(147,51,234,0.45)] border border-purple-400/40 bg-[#16102a]/95 backdrop-blur-2xl ring-1 ring-white/15 min-w-[340px]">
          {/* Main Toolbar 5 Commands Wrapped with WarmTooltipGroup */}
          <WarmTooltipGroup delay={250} warmWindow={300} travel={280} lean={2}>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {/* 6-dot drag grip handle */}
              <div
                className="flex items-center justify-center pl-1.5 pr-1 py-1.5 cursor-grab active:cursor-grabbing text-purple-400/60 hover:text-purple-300 transition shrink-0 select-none"
                title="คลิกค้างเพื่อลากย้ายแถบ AI ไปที่ใดก็ได้"
              >
                <svg width="10" height="18" viewBox="0 0 10 18" fill="currentColor">
                  <circle cx="2.5" cy="2.5" r="1.5" />
                  <circle cx="7.5" cy="2.5" r="1.5" />
                  <circle cx="2.5" cy="9" r="1.5" />
                  <circle cx="7.5" cy="9" r="1.5" />
                  <circle cx="2.5" cy="15.5" r="1.5" />
                  <circle cx="7.5" cy="15.5" r="1.5" />
                </svg>
              </div>

              {/* Command 1: แก้คำผิด */}
              <WarmTooltip content="ตรวจและแก้ไขคำสะกดผิดเฉพาะท่อนที่เลือก (1 Trix) · ⌘1" side="top" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
                <button
                  type="button"
                  disabled={isAIProcessing}
                  onClick={() => handleCommand('proofread')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeAITool === 'proofread'
                      ? 'bg-purple-600 text-white animate-pulse'
                      : isAIProcessing
                      ? 'opacity-40 cursor-not-allowed text-slate-300'
                      : 'text-slate-100 hover:text-white hover:bg-white/15 active:scale-95'
                  }`}
                >
                  <span>✍️</span>
                  <span>แก้คำผิด</span>
                </button>
              </WarmTooltip>

              {/* Command 2: เช็คคำ / เกลาสำนวน */}
              <WarmTooltip content="เกลาสำนวนและแทรกคลังคำศัพท์เฉพาะแนว (3 Trix) · ⌘2" side="top" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
                <button
                  type="button"
                  disabled={isAIProcessing}
                  onClick={() => handleCommand('polish')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeAITool === 'polish'
                      ? 'bg-purple-600 text-white animate-pulse'
                      : isAIProcessing
                      ? 'opacity-40 cursor-not-allowed text-slate-300'
                      : 'text-slate-100 hover:text-white hover:bg-white/15 active:scale-95'
                  }`}
                >
                  <span>🔍</span>
                  <span>เกลาสำนวน</span>
                </button>
              </WarmTooltip>

              {/* Command 3: แปลภาษา */}
              <WarmTooltip content="แปลวรรณกรรมไทย-อังกฤษคงน้ำเสียง (2 Trix) · ⌘3" side="top" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
                <button
                  type="button"
                  disabled={isAIProcessing}
                  onClick={() => handleCommand('translate')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeAITool === 'translate'
                      ? 'bg-purple-600 text-white animate-pulse'
                      : isAIProcessing
                      ? 'opacity-40 cursor-not-allowed text-slate-300'
                      : 'text-slate-100 hover:text-white hover:bg-white/15 active:scale-95'
                  }`}
                >
                  <span>🌐</span>
                  <span>แปลภาษา</span>
                </button>
              </WarmTooltip>

              {/* Command 4: คิดทางเลือกพล็อต */}
              <WarmTooltip content="เสนอ 3 ทางแยกเนื้อเรื่องต่อจากฉากนี้ (4 Trix) · ⌘4" side="top" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
                <button
                  type="button"
                  disabled={isAIProcessing}
                  onClick={() => handleCommand('plotBranch')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeAITool === 'plotBranch'
                      ? 'bg-purple-600 text-white animate-pulse'
                      : isAIProcessing
                      ? 'opacity-40 cursor-not-allowed text-slate-300'
                      : 'text-slate-100 hover:text-white hover:bg-white/15 active:scale-95'
                  }`}
                >
                  <span>💡</span>
                  <span>คิดพล็อต</span>
                </button>
              </WarmTooltip>

              {/* Command 5: AI Assistant */}
              <WarmTooltip content="พิมพ์คำสั่งปรับแต่งเฉพาะจุดได้อย่างอิสระ · ⌘5" side="top" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
                <button
                  type="button"
                  disabled={isAIProcessing}
                  onClick={() => setActiveMenu(activeMenu === 'customAssistant' ? null : 'customAssistant')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeMenu === 'customAssistant'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : isAIProcessing
                      ? 'opacity-40 cursor-not-allowed text-purple-300'
                      : 'text-purple-300 hover:text-white hover:bg-purple-600/20 active:scale-95'
                  }`}
                >
                  <span>✨</span>
                  <span>AI สั่งการ</span>
                </button>
              </WarmTooltip>

              {/* StatusMark indicator when AI processing */}
              {isAIProcessing && (
                <div className="flex items-center px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-400/30 text-[11px] shrink-0">
                  <StatusMark
                    status="running"
                    size={12}
                    fontSize={10}
                    label="กำลังประมวลผล..."
                    color="#c084fc"
                  />
                </div>
              )}

              {/* Cancel / Close button */}
              <WarmTooltip content="ปิดแถบ AI ลอยชั่วคราว · Esc" side="top" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 flex items-center justify-center text-xs ml-1 transition cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </WarmTooltip>
            </div>
          </WarmTooltipGroup>

          {/* Submenu: Custom AI Prompt Input */}
          {activeMenu === 'customAssistant' && (
            <form onSubmit={handleCustomSubmit} className="mt-2 pt-2 border-t border-white/15 flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="สั่งการ AI เช่น: ปรับให้ดูเป็นภาษาโบราณ, เพิ่มอารมณ์บีบคั้น..."
                className="flex-1 px-3 py-2 min-h-[38px] rounded-xl bg-black/40 border border-white/20 text-white text-xs outline-none focus:border-purple-400 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!customPrompt.trim() || isAIProcessing}
                className="px-3.5 py-2 min-h-[38px] rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition shrink-0 cursor-pointer"
              >
                ส่งคำสั่ง
              </button>
            </form>
          )}

          {/* Submenu: Diff Preview & Confirmation (Safety Guard) */}
          {activeMenu === 'diffPreview' && previewResult && (
            <div className="mt-2.5 pt-2.5 border-t border-white/15 max-w-sm space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-300">
                <span>ผลลัพธ์จาก AI (ตรวจสอบก่อนแทนที่):</span>
              </div>
              <div className="max-h-36 overflow-y-auto p-2.5 rounded-xl bg-black/50 border border-purple-400/30 text-xs text-slate-200 leading-relaxed font-sans select-text">
                {previewResult}
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRejectDiff}
                  className="px-3.5 py-2 min-h-[36px] rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-300 transition cursor-pointer"
                >
                  คงข้อความเดิม
                </button>
                <button
                  type="button"
                  onClick={handleAcceptDiff}
                  className="px-4 py-2 min-h-[36px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  ✓ ยอมรับ (แทนที่)
                </button>
              </div>
            </div>
          )}
        </div>
      </AnimatedContent>
    </div>
  )
}

export default memo(FloatingAiToolbar)
