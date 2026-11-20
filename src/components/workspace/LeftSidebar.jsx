import React, { memo } from 'react'
import { useApp } from '../../context/AppContext'
import WarmTooltip from '../react-bits/WarmTooltip'

function LeftSidebar() {
  const {
    chapters,
    activeChapterId,
    setActiveChapterId,
    setActivePageIdx,
    addChapter,
    leftSidebarOpen,
    setLeftSidebarOpen,
    setActiveModal,
    characters,
    customDictionary,
    rightSidebarOpen,
    setRightSidebarOpen
  } = useApp()

  if (!leftSidebarOpen) return null

  // Calculate total project word count estimation
  const totalChaptersCount = chapters.length
  const totalPagesCount = chapters.reduce((sum, ch) => sum + (ch.pages?.length || 1), 0)
  const estTotalWords = totalPagesCount * 285
  const goalWords = 20000
  const progressPercent = Math.min(100, Math.round((estTotalWords / goalWords) * 100))

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden cursor-pointer"
        onClick={() => setLeftSidebarOpen(false)}
      />

      <aside className="panel-surface border-r w-64 shrink-0 flex flex-col justify-between p-3.5 overflow-y-auto z-20 h-full select-none shadow-xl transition-all duration-200">
        <div className="space-y-5">
          {/* Mobile Header */}
          <div className="flex lg:hidden items-center justify-between pb-2 border-b border-white/10 mb-1">
            <span className="font-bold text-xs text-violet-300">สารบัญ & Story Bible</span>
            <button
              type="button"
              onClick={() => setLeftSidebarOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>

          {/* CHAPTERS SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                PROJECT • สารบัญตอน
              </span>
              <span className="text-[11px] text-violet-400 font-semibold px-2 py-0.2 rounded-full bg-violet-500/10 border border-violet-500/20">
                {totalChaptersCount} ตอน
              </span>
            </div>

            <div className="space-y-1">
              {chapters.map((ch, idx) => {
                const isActive = ch.id === activeChapterId
                const pageCount = ch.pages?.length || 1
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setActiveChapterId(ch.id)
                      setActivePageIdx(0)
                      if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                      isActive
                        ? 'bg-violet-600/25 border border-violet-500/50 text-violet-100 font-semibold shadow-sm'
                        : 'hover:bg-violet-500/10 text-slate-300 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-violet-400 text-sm">📄</span>
                      <span className="truncate">
                        {ch.code || `บทที่ ${String(ch.number || idx + 1).padStart(2, '0')}`}
                      </span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-black/30 text-[10px] text-violet-300 border border-white/5">
                      {pageCount} หน้า
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Add Chapter Button */}
            <button
              type="button"
              onClick={addChapter}
              className="mt-2.5 w-full py-2 px-3 rounded-xl border border-dashed border-violet-500/40 hover:border-violet-400 hover:bg-violet-500/10 text-violet-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>+</span>
              <span>เพิ่มตอนใหม่ (รันเลขอัตโนมัติ)</span>
            </button>
          </div>

          {/* STORY BIBLE & TOOLS SECTION */}
          <div>
            <div className="px-1 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                STORY BIBLE & เครื่องมือ
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {/* Characters & Lore */}
              <WarmTooltip content="คลังข้อมูลตัวละครและโลกนิยายเพื่อเชื่อมต่อบริบท AI" side="right">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('characterBible')
                    if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                  }}
                  className="elevated-surface border hover:border-violet-500/60 p-2.5 rounded-xl flex items-center justify-between text-xs transition cursor-pointer w-full text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-violet-400 text-sm">👤</span>
                    <span className="font-medium text-slate-200">ตัวละคร & Lore</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[11px] font-bold border border-violet-500/30">
                    {characters.length}
                  </span>
                </button>
              </WarmTooltip>

              {/* Chapter Plot Summaries */}
              <WarmTooltip content="พล็อตย่อรายตอนสำหรับส่งเป็นบริบทอ้างอิงให้ AI" side="right">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('characterBible')
                    if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                  }}
                  className="elevated-surface border hover:border-violet-500/60 p-2.5 rounded-xl flex items-center justify-between text-xs transition cursor-pointer w-full text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm">🗺️</span>
                    <span className="font-medium text-slate-200">พล็อตย่อรายตอน</span>
                  </span>
                  <span className="text-[10px] text-amber-300/80 font-medium">บริบท AI</span>
                </button>
              </WarmTooltip>

              {/* Vocabulary Bank */}
              <WarmTooltip content="คลังคำศัพท์นิยายกว่า 1,000+ คำ (ฟรีทุกแพลน)" side="right">
                <button
                  type="button"
                  onClick={() => {
                    setRightSidebarOpen(!rightSidebarOpen)
                    if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                  }}
                  className="elevated-surface border hover:border-emerald-500/60 p-2.5 rounded-xl flex items-center justify-between text-xs transition cursor-pointer w-full text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-400 text-sm">📚</span>
                    <span className="font-medium text-slate-200">คลังคำศัพท์นิยาย</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold">1k+ ฟรี</span>
                </button>
              </WarmTooltip>

              {/* Version History */}
              <WarmTooltip content="ประวัติการแก้ไขและกู้คืนฉบับร่างย้อนหลัง" side="right">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('history')
                    if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                  }}
                  className="elevated-surface border hover:border-sky-500/60 p-2.5 rounded-xl flex items-center justify-between text-xs transition cursor-pointer w-full text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sky-400 text-sm">🕒</span>
                    <span className="font-medium text-slate-200">ประวัติแก้ไข</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Pro
                  </span>
                </button>
              </WarmTooltip>
            </div>
          </div>
        </div>

        {/* BOTTOM NOVEL PROGRESS CARD */}
        <div className="mt-6 p-3.5 rounded-2xl elevated-surface border border-violet-500/30">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-white">ความคืบหน้านิยาย</span>
            <span className="text-violet-400 font-bold">{totalChaptersCount} ตอน</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>เป้าหมาย 20k คำ (~{estTotalWords.toLocaleString()} คำ)</span>
            <span className="text-emerald-400 font-semibold">{progressPercent}%</span>
          </div>
        </div>
      </aside>
    </>
  )
}

export default memo(LeftSidebar)
