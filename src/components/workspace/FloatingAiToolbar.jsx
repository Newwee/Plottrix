import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import GlassSurface from '../react-bits/GlassSurface'
import AnimatedContent from '../react-bits/AnimatedContent'
import WarmTooltip from '../react-bits/WarmTooltip'

export default function FloatingAiToolbar() {
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
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [activeMenu, setActiveMenu] = useState(null) // null | 'customAssistant' | 'diffPreview'
  const [customPrompt, setCustomPrompt] = useState('')
  const [previewResult, setPreviewResult] = useState(null)

  const toolbarRef = useRef(null)

  // Listen to selection changes within editor
  const handleSelection = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      if (!previewResult) {
        setVisible(false)
        setActiveMenu(null)
      }
      return
    }

    const text = sel.toString().trim()
    if (text.length < 2) {
      if (!previewResult) {
        setVisible(false)
      }
      return
    }

    // Check if selection is within the editor element
    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer
    const editorEl = document.getElementById('tour-target-editor-text') || document.getElementById('tour-target-editor')

    if (!editorEl || (!editorEl.contains(container) && container !== editorEl)) {
      return
    }

    // Save selection in AppContext
    setSelection({
      text,
      start: 0,
      end: text.length
    })

    // Calculate bounding rect and clamp to viewport
    const rect = range.getBoundingClientRect()
    const toolbarWidth = 380
    const toolbarHeight = 52

    let top = rect.top - toolbarHeight - 12
    let left = rect.left + rect.width / 2 - toolbarWidth / 2

    // Viewport clamping
    if (top < 70) {
      top = rect.bottom + 12
    }
    if (left < 16) {
      left = 16
    }
    if (left + toolbarWidth > window.innerWidth - 16) {
      left = window.innerWidth - toolbarWidth - 16
    }

    setPosition({ top, left })
    setVisible(true)
  }, [previewResult, setSelection])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection)
    return () => document.removeEventListener('selectionchange', handleSelection)
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
    }
  }

  const handleRejectDiff = () => {
    setPreviewResult(null)
    setActiveMenu(null)
  }

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 pointer-events-auto transition-all duration-150 select-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      <AnimatedContent distance={8} direction="vertical" duration={0.2}>
        <GlassSurface
          className="rounded-2xl p-1.5 shadow-[0_12px_40px_rgba(147,51,234,0.35)] border border-purple-300/30 bg-gradient-to-r from-white/15 via-purple-100/10 to-indigo-100/15 backdrop-blur-2xl ring-1 ring-white/20"
        >
          {/* Main Toolbar 5 Commands */}
          <div className="flex items-center gap-1">
            {/* Command 1: แก้คำผิด */}
            <WarmTooltip content="ตรวจและแก้ไขคำสะกดผิดเฉพาะท่อนที่เลือก (1 Trix)" side="top">
              <button
                type="button"
                disabled={isAIProcessing}
                onClick={() => handleCommand('proofread')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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
            <WarmTooltip content="เกลาสำนวนและแทรกคลังคำศัพท์เฉพาะแนว (3 Trix)" side="top">
              <button
                type="button"
                disabled={isAIProcessing}
                onClick={() => handleCommand('polish')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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
            <WarmTooltip content="แปลวรรณกรรมไทย-อังกฤษคงน้ำเสียง (2 Trix)" side="top">
              <button
                type="button"
                disabled={isAIProcessing}
                onClick={() => handleCommand('translate')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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
            <WarmTooltip content="เสนอ 3 ทางแยกเนื้อเรื่องต่อจากฉากนี้ (4 Trix)" side="top">
              <button
                type="button"
                disabled={isAIProcessing}
                onClick={() => handleCommand('plotBranch')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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
            <WarmTooltip content="สั่งการ AI ด้วยคำสั่งพิเศษเฉพาะท่อนนี้" side="top">
              <button
                type="button"
                disabled={isAIProcessing}
                onClick={() => setActiveMenu(activeMenu === 'customAssistant' ? null : 'customAssistant')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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

            {/* Cancel / Close button */}
            <button
              type="button"
              onClick={() => {
                if (isAIProcessing) {
                  cancelAITask()
                }
                setVisible(false)
                setActiveMenu(null)
                setPreviewResult(null)
              }}
              className="w-6 h-6 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 flex items-center justify-center text-xs ml-1 transition"
            >
              ✕
            </button>
          </div>

          {/* Submenu: Custom AI Prompt Input */}
          {activeMenu === 'customAssistant' && (
            <form onSubmit={handleCustomSubmit} className="mt-2 pt-2 border-t border-white/15 flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="สั่งการ AI เช่น: ปรับให้ดูเป็นภาษาโบราณ, เพิ่มอารมณ์บีบคั้น..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 text-white text-xs outline-none focus:border-purple-400 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!customPrompt.trim() || isAIProcessing}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition shrink-0"
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
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-300 transition"
                >
                  คงข้อความเดิม
                </button>
                <button
                  type="button"
                  onClick={handleAcceptDiff}
                  className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                >
                  ✓ ยอมรับ (แทนที่)
                </button>
              </div>
            </div>
          )}
        </GlassSurface>
      </AnimatedContent>
    </div>
  )
}
