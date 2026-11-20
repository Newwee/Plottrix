import React, { memo, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import WarmTooltip, { WarmTooltipGroup } from '../react-bits/WarmTooltip'
import StatusMark from '../react-bits/StatusMark'
import FloatingAiToolbar from './FloatingAiToolbar'

function StudioEditor() {
  const {
    chapters,
    addChapter,
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
  const [showPageGridPopover, setShowPageGridPopover] = useState(false)
  const [quickJumpVal, setQuickJumpVal] = useState('')
  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0]

  // Adaptive action frequency counters for adaptive toolbar
  const [adaptiveCounts, setAdaptiveCounts] = useState({
    proofread: 12,
    wordcheck: 7,
    plot: 4,
    translate: 3
  })

  // Pages with AI editorial notes (mocked flagged pages for demonstration: pages 2, 14, 38, 52)
  const flaggedPages = useMemo(() => new Set([2, 14, 38, 52]), [])

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

  // Debounced Word count & reading time (300ms)
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
      textareaRef.current.style.height = `${Math.max(520, textareaRef.current.scrollHeight)}px`
    }
  }, [localText])

  // Keyboard shortcut Alt + Left / Right for page navigation
  useEffect(() => {
    const handleKeyNav = (e) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        handleStepPage(-1)
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        handleStepPage(1)
      }
    }
    window.addEventListener('keydown', handleKeyNav)
    return () => window.removeEventListener('keydown', handleKeyNav)
  }, [activePageIdx, currentChapter?.pages?.length])

  // Listen to file import event from TopNavbar
  useEffect(() => {
    const handleImportText = (e) => {
      if (e.detail && typeof e.detail === 'string') {
        const text = e.detail
        setLocalText(text)
        updateCurrentPageText(text)
        addToast({
          title: '📥 นำเข้าเนื้อหาต้นฉบับสำเร็จ',
          description: 'เนื้อหาถูกโหลดลงในหน้ากระดาษปัจจุบันเรียบร้อยแล้ว'
        })
      }
    }
    window.addEventListener('plottrix-import-text', handleImportText)
    return () => window.removeEventListener('plottrix-import-text', handleImportText)
  }, [updateCurrentPageText, addToast])

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setShowPageGridPopover(false)
    if (showPageGridPopover) {
      window.addEventListener('click', handleOutsideClick)
      return () => window.removeEventListener('click', handleOutsideClick)
    }
  }, [showPageGridPopover])

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
  const handleWrapFormat = (prefix, suffix, placeholder = 'ข้อความ') => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = localText.substring(start, end)
    const content = selected || placeholder
    const replacement = `${prefix}${content}${suffix}`
    const newText = localText.substring(0, start) + replacement + localText.substring(end)
    setLocalText(newText)
    updateCurrentPageText(newText)
    setTimeout(() => {
      el.selectionStart = start + prefix.length
      el.selectionEnd = start + prefix.length + content.length
      el.focus()
    }, 10)
  }

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

  // Smart Pagination Helpers
  const totalPages = currentChapter?.pages?.length || 1
  const currentPageNumber = activePageIdx + 1

  const handleStepPage = (delta) => {
    const target = activePageIdx + delta
    if (target >= 0 && target < totalPages) {
      flushSave()
      setActivePageIdx(target)
    }
  }

  const handleJumpToPage = (e) => {
    e.preventDefault()
    const pageNum = parseInt(quickJumpVal, 10)
    if (pageNum && pageNum >= 1 && pageNum <= totalPages) {
      flushSave()
      setActivePageIdx(pageNum - 1)
      setQuickJumpVal('')
      setShowPageGridPopover(false)
    } else {
      addToast({ title: `กรุณาระบุเลขหน้าระหว่าง 1 ถึง ${totalPages}` })
    }
  }

  // Build Compact Smart Ellipsis Page Pills (max 7 items even for 500+ pages)
  const smartPills = useMemo(() => {
    const items = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
    } else {
      items.push(1)
      if (currentPageNumber > 3) items.push('...')

      const start = Math.max(2, currentPageNumber - 1)
      const end = Math.min(totalPages - 1, currentPageNumber + 1)
      for (let i = start; i <= end; i++) items.push(i)

      if (currentPageNumber < totalPages - 2) items.push('...')
      items.push(totalPages)
    }
    return items
  }, [totalPages, currentPageNumber])

  // Total words calculation
  const totalChapterWords = useMemo(() => {
    if (!currentChapter?.pages) return 0
    return currentChapter.pages.reduce((acc, p) => acc + (p.trim() ? p.trim().replace(/\s+/g, ' ').length : 0), 0)
  }, [currentChapter, localText])

  // Clean empty state when project has 0 chapters
  if (!chapters || chapters.length === 0) {
    return (
      <div
        id="tour-target-editor"
        className="flex-1 flex flex-col items-center justify-center h-full studio-editor-area app-surface p-6 select-none"
      >
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl elevated-surface border border-violet-500/20 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-3xl">
            📖
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              ยังไม่มีตอนในนิยายเรื่องนี้ (0 ตอน)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              คุณสามารถสร้างตอนแรกเพื่อเริ่มต้นเขียนต้นฉบับ หรือจัดการโครงเรื่องได้ทันที
            </p>
          </div>
          <button
            type="button"
            onClick={addChapter}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-2"
          >
            <span>+</span>
            <span>สร้างตอนแรก</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      id="tour-target-editor"
      className="flex-1 flex flex-col h-full overflow-hidden relative studio-editor-area app-surface"
    >
      {/* Floating AI Context Toolbar */}
      <FloatingAiToolbar />

      {/* ========================================================================= */}
      {/* SCALABLE 50+ PAGE NAVIGATION & TOOLBAR (SINGLE-LINE ZERO OVERFLOW) */}
      {/* ========================================================================= */}
      <div className="panel-surface border-b px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 relative z-20 shrink-0">
        {/* Left: Chapter Code & Smart Pagination */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-violet-300 mr-1 whitespace-nowrap">
            บทที่ {currentChapter?.number || 1}
          </span>

          {/* Compact Smart Pagination */}
          <div className="flex items-center gap-1 p-1 rounded-xl elevated-surface border">
            {/* Prev Page Button */}
            <button
              type="button"
              onClick={() => handleStepPage(-1)}
              disabled={currentPageNumber <= 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs hover:bg-violet-500/20 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer font-bold text-slate-200"
              title="หน้าก่อนหน้า (Alt + ←)"
            >
              ‹
            </button>

            {/* Smart Ellipsis Pills */}
            <div className="flex items-center gap-0.5">
              {smartPills.map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1 text-xs opacity-45 select-none">
                      …
                    </span>
                  )
                }
                const isCurrent = item === currentPageNumber
                const hasFlag = flaggedPages.has(item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      flushSave()
                      setActivePageIdx(item - 1)
                    }}
                    className={`relative min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isCurrent
                        ? 'bg-violet-600 text-white font-bold shadow'
                        : 'hover:bg-violet-500/20 text-slate-300 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {item}
                    {hasFlag && !isCurrent && (
                      <span
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400"
                        title="มีจุดสังเกตจาก AI"
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Next Page Button */}
            <button
              type="button"
              onClick={() => handleStepPage(1)}
              disabled={currentPageNumber >= totalPages}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs hover:bg-violet-500/20 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer font-bold text-slate-200"
              title="หน้าถัดไป (Alt + →)"
            >
              ›
            </button>

            <div className="h-4 w-[1px] bg-violet-500/25 mx-0.5" />

            {/* 10-Column Page Grid Popover Trigger ("หน้า X / Y ▾") */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPageGridPopover(!showPageGridPopover)
                }}
                className="px-2.5 h-7 rounded-lg bg-violet-600/20 hover:bg-violet-600/35 border border-violet-500/35 text-violet-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="เปิดสารบัญหน้าทั้งหมดและค้นหาเลขหน้า"
              >
                <span>หน้า {currentPageNumber} / {totalPages}</span>
                <span className="text-[10px] opacity-80">▾</span>
              </button>

              {/* INTERACTIVE 10-COLUMN PAGE GRID MATRIX POPOVER */}
              {showPageGridPopover && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full mt-2 w-[320px] sm:w-[420px] rounded-2xl panel-surface border border-violet-500/50 shadow-2xl shadow-black/80 p-3.5 z-50 animate-float-in"
                >
                  {/* Header & Quick Page Jump */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-violet-500/20">
                    <div>
                      <div className="text-xs font-bold text-violet-200">
                        📑 สารบัญหน้ากระดาษ ({totalPages} หน้า)
                      </div>
                      <div className="text-[10px] opacity-65">
                        คลิกเลือกหน้า หรือพิมพ์เลขหน้าเพื่อกระโดดไปทันที
                      </div>
                    </div>
                    <form onSubmit={handleJumpToPage} className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={quickJumpVal}
                        onChange={(e) => setQuickJumpVal(e.target.value)}
                        placeholder="ไปหน้า..."
                        className="w-20 px-2.5 py-1 rounded-lg elevated-surface border border-violet-500/40 text-xs text-white focus:outline-none focus:border-violet-400"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium cursor-pointer"
                      >
                        ไป
                      </button>
                    </form>
                  </div>

                  {/* First & Last Page Shortcuts */}
                  <div className="flex items-center justify-between gap-1.5 mb-2.5 text-[11px]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          flushSave()
                          setActivePageIdx(0)
                          setShowPageGridPopover(false)
                        }}
                        className="px-2 py-1 rounded-lg elevated-surface border hover:border-violet-500/50 text-slate-300"
                      >
                        ⇤ หน้าแรก (1)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          flushSave()
                          setActivePageIdx(totalPages - 1)
                          setShowPageGridPopover(false)
                        }}
                        className="px-2 py-1 rounded-lg elevated-surface border hover:border-violet-500/50 text-slate-300"
                      >
                        หน้าสุดท้าย ({totalPages}) ⇥
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] opacity-75">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        หน้าปัจจุบัน
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        จุดสังเกต AI
                      </span>
                    </div>
                  </div>

                  {/* Scrollable 10-Column Matrix Grid */}
                  <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {Array.from({ length: totalPages }).map((_, pIdx) => {
                      const pNum = pIdx + 1
                      const isCurr = pIdx === activePageIdx
                      const isFlagged = flaggedPages.has(pNum)
                      return (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => {
                            flushSave()
                            setActivePageIdx(pIdx)
                            setShowPageGridPopover(false)
                          }}
                          className={`relative h-8 rounded-lg text-xs font-medium flex items-center justify-center transition cursor-pointer ${
                            isCurr
                              ? 'bg-violet-600 text-white font-bold ring-2 ring-violet-400/60 shadow'
                              : 'elevated-surface border hover:border-violet-400 hover:bg-violet-500/20 text-slate-200'
                          }`}
                        >
                          {pNum}
                          {isFlagged && (
                            <span
                              className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400"
                              title="มีจุดสังเกตจาก AI"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Popover Footer */}
                  <div className="mt-2.5 pt-2 border-t border-violet-500/20 flex items-center justify-between text-[11px] opacity-75">
                    <span>รวมทั้งตอน ~{totalChapterWords.toLocaleString()} คำ</span>
                    <button
                      type="button"
                      onClick={() => {
                        flushSave()
                        addPage()
                        setShowPageGridPopover(false)
                      }}
                      className="text-violet-300 hover:underline font-semibold cursor-pointer"
                    >
                      + เพิ่มหน้าใหม่ต่อท้าย
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Page (+ หน้า) */}
            <WarmTooltip content="เพิ่มหน้ากระดาษใหม่ต่อท้ายบท" side="bottom">
              <button
                type="button"
                onClick={() => {
                  flushSave()
                  addPage()
                }}
                className="px-2.5 h-7 rounded-lg text-xs text-violet-300 hover:bg-violet-500/20 font-bold transition whitespace-nowrap cursor-pointer"
              >
                + หน้า
              </button>
            </WarmTooltip>
          </div>
        </div>

        {/* Middle Group: Quick Formatting Snippets Wrapped with WarmTooltipGroup */}
        <WarmTooltipGroup delay={250} warmWindow={300} travel={280} lean={2}>
          <div className="flex items-center gap-1.5">
            {/* Bold */}
            <WarmTooltip content="ตัวหนา · ⌘B" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
              <button
                type="button"
                onClick={() => handleWrapFormat('**', '**', 'ข้อความตัวหนา')}
                className="elevated-surface border hover:border-violet-500/50 px-2 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                title="ตัวหนา"
              >
                B
              </button>
            </WarmTooltip>

            {/* Italic */}
            <WarmTooltip content="ตัวเอียง · ⌘I" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
              <button
                type="button"
                onClick={() => handleWrapFormat('*', '*', 'ข้อความตัวเอียง')}
                className="elevated-surface border hover:border-violet-500/50 px-2 py-1.5 rounded-xl text-xs italic transition cursor-pointer font-serif"
                title="ตัวเอียง"
              >
                I
              </button>
            </WarmTooltip>

            {/* Underline */}
            <WarmTooltip content="ขีดเส้นใต้ · ⌘U" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
              <button
                type="button"
                onClick={() => handleWrapFormat('<u>', '</u>', 'ข้อความขีดเส้นใต้')}
                className="elevated-surface border hover:border-violet-500/50 px-2 py-1.5 rounded-xl text-xs underline underline-offset-2 transition cursor-pointer"
                title="ขีดเส้นใต้"
              >
                U
              </button>
            </WarmTooltip>

            {/* Indent */}
            <WarmTooltip content="เพิ่มย่อหน้ามาตรฐาน 4 เคาะตามหลักวรรณกรรม · Tab" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
              <button
                type="button"
                onClick={handleInsertIndent}
                className="elevated-surface border hover:border-violet-500/50 px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
              >
                ⇥ ย่อหน้า
              </button>
            </WarmTooltip>

            {/* Dialogue */}
            <WarmTooltip content="แทรกเครื่องหมายคำพูด “...” พร้อมจัดเคอร์เซอร์ตรงกลาง · ⌘&quot;" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
              <button
                type="button"
                onClick={handleInsertDialogue}
                className="elevated-surface border hover:border-violet-500/50 px-2.5 py-1.5 rounded-xl text-xs font-serif transition cursor-pointer"
              >
                “คำพูด”
              </button>
            </WarmTooltip>

            {/* Floating AI Toolbar Trigger */}
            <WarmTooltip content="เปิดแถบเครื่องมือด่วน AI ผู้ช่วยบรรณาธิการ · ⌘J" side="bottom" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
              <button
                type="button"
                onClick={() => {
                  if (textareaRef.current) {
                    textareaRef.current.focus()
                    const len = localText.length
                    textareaRef.current.selectionStart = Math.max(0, len - 80)
                    textareaRef.current.selectionEnd = len
                    handleSelect({ target: textareaRef.current })
                  }
                }}
                className="elevated-surface border hover:border-violet-500/50 px-2.5 py-1.5 rounded-xl text-xs text-violet-300 transition cursor-pointer"
              >
                ✦ แถบ AI
              </button>
            </WarmTooltip>
          </div>
        </WarmTooltipGroup>

        {/* Right Group: Font Size & 3 Themes (Obsidian, Midnight, Paper) */}
        <div className="flex items-center gap-2.5">
          {/* Font Size */}
          <WarmTooltip content="ปรับขนาดตัวอักษรของกระดาษพิมพ์" side="bottom">
            <div className="flex items-center px-2 py-1 rounded-xl elevated-surface border text-xs">
              <button
                type="button"
                onClick={() => setFontSize(s => Math.max(14, s - 1))}
                className="hover:text-violet-400 px-1 font-bold cursor-pointer"
                title="ลดขนาดตัวอักษร"
              >
                ก-
              </button>
              <span className="font-bold w-6 text-center text-slate-200">{fontSize}</span>
              <button
                type="button"
                onClick={() => setFontSize(s => Math.min(24, s + 1))}
                className="hover:text-violet-400 px-1 font-bold cursor-pointer"
                title="เพิ่มขนาดตัวอักษร"
              >
                ก+
              </button>
            </div>
          </WarmTooltip>

          {/* Theme Switcher Dots */}
          <div className="flex items-center gap-1.5" title="เปลี่ยนโทนสีหน้ากระดาษ">
            <WarmTooltip content="Dark Obsidian (ม่วงเข้ม)" side="bottom">
              <button
                type="button"
                onClick={() => setPaperTheme('obsidian')}
                className={`w-4 h-4 rounded-full bg-[#161224] border border-violet-500/40 transition cursor-pointer ${
                  paperTheme === 'obsidian' ? 'ring-2 ring-violet-400 scale-110' : 'opacity-60'
                }`}
              />
            </WarmTooltip>
            <WarmTooltip content="Midnight Blue (น้ำเงินค่ำ)" side="bottom">
              <button
                type="button"
                onClick={() => setPaperTheme('midnight')}
                className={`w-4 h-4 rounded-full bg-[#1e293b] border border-slate-500 transition cursor-pointer ${
                  paperTheme === 'midnight' ? 'ring-2 ring-violet-400 scale-110' : 'opacity-60'
                }`}
              />
            </WarmTooltip>
            <WarmTooltip content="Warm Paper (กระดาษถนอมสายตา)" side="bottom">
              <button
                type="button"
                onClick={() => setPaperTheme('paper')}
                className={`w-4 h-4 rounded-full bg-[#f5f2eb] border border-stone-400 transition cursor-pointer ${
                  paperTheme === 'paper' ? 'ring-2 ring-violet-400 scale-110' : 'opacity-60'
                }`}
              />
            </WarmTooltip>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCROLLABLE WRITING CANVAS (DISTRACTION-FREE THAI MANUSCRIPT) */}
      {/* ========================================================================= */}
      <div
        id="editorScrollArea"
        className="flex-1 overflow-y-auto px-4 sm:px-10 lg:px-16 py-8 relative"
      >
        <div className="max-w-3xl mx-auto">
          {/* Chapter & Page Header */}
          <div className="mb-4 flex items-end justify-between gap-2 border-b border-white/5 pb-2">
            <div className="flex-1">
              <div className="text-[11px] font-bold tracking-widest uppercase text-violet-400/80 mb-1">
                CHAPTER {String(currentChapter?.number || 1).padStart(2, '0')} • PAGE {currentPageNumber} OF {totalPages}
              </div>
              <input
                type="text"
                value={currentChapter?.title || ''}
                onChange={(e) => {
                  const newTitle = e.target.value
                  setChapters(prev => prev.map(c => c.id === activeChapterId ? { ...c, title: newTitle } : c))
                }}
                placeholder="ชื่อตอน..."
                className="w-full bg-transparent text-xl sm:text-2xl font-bold focus:outline-none border-b border-transparent focus:border-violet-500/40 pb-1 text-white"
              />
            </div>
          </div>

          {/* Actual Manuscript Textarea Editor */}
          <textarea
            ref={textareaRef}
            id="tour-target-editor-text"
            value={localText}
            onChange={handleTextChange}
            onSelect={handleSelect}
            onBlur={flushSave}
            style={{ fontSize: `${fontSize}px` }}
            placeholder="เริ่มต้นจรดปลายปากกาเขียนนิยายของคุณที่นี่..."
            className="w-full bg-transparent resize-none outline-none novel-font text-white placeholder-slate-500 min-h-[520px] focus:ring-0 border-none leading-relaxed tracking-wide select-text"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM STATUS BAR */}
      {/* ========================================================================= */}
      <footer className="panel-surface border-t px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs opacity-85 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span>✓</span>
            <span>{saveStatus === 'saving' ? 'กำลังบันทึกอัตโนมัติ...' : 'บันทึกแล้วอัตโนมัติ'}</span>
          </span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="hidden md:inline text-violet-300/80">
            คีย์ลัดเปลี่ยนหน้า: Alt + ← / →
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 font-medium text-slate-300">
          <span>หน้านี้ {wordMetrics.words.toLocaleString()} คำ</span>
          <span className="text-violet-300">
            ทั้งตอน ~{totalChapterWords.toLocaleString()} คำ ({totalPages} หน้า)
          </span>
          <span className="hidden sm:inline opacity-70">
            เวลาอ่าน ~{wordMetrics.time} นาที
          </span>
        </div>
      </footer>
    </div>
  )
}

export default memo(StudioEditor)
