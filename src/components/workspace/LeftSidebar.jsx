import React, { memo, useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import WarmTooltip, { WarmTooltipGroup } from '../react-bits/WarmTooltip'

function LeftSidebar() {
  const {
    chapters,
    activeChapterId,
    setActiveChapterId,
    setActivePageIdx,
    addChapter,
    reorderChapters,
    deleteChapter,
    renameChapter,
    leftSidebarOpen,
    setLeftSidebarOpen,
    setActiveModal,
    characters,
    customDictionary,
    rightSidebarOpen,
    setRightSidebarOpen
  } = useApp()

  const [draggedIdx, setDraggedIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [editingChapter, setEditingChapter] = useState(null)
  const [newTitleInput, setNewTitleInput] = useState('')
  const [chapterToDelete, setChapterToDelete] = useState(null)

  // Close context menu on outside click or scroll
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null)
    window.addEventListener('click', handleOutsideClick)
    window.addEventListener('scroll', handleOutsideClick, true)
    return () => {
      window.removeEventListener('click', handleOutsideClick)
      window.removeEventListener('scroll', handleOutsideClick, true)
    }
  }, [])

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
                const isDragging = draggedIdx === idx
                const isDragOver = dragOverIdx === idx

                return (
                  <div
                    key={ch.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(idx))
                      e.dataTransfer.effectAllowed = 'move'
                      setDraggedIdx(idx)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      if (dragOverIdx !== idx) setDragOverIdx(idx)
                    }}
                    onDragLeave={() => {
                      if (dragOverIdx === idx) setDragOverIdx(null)
                    }}
                    onDragEnd={() => {
                      setDraggedIdx(null)
                      setDragOverIdx(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedIdx !== null && draggedIdx !== idx) {
                        reorderChapters(draggedIdx, idx)
                      }
                      setDraggedIdx(null)
                      setDragOverIdx(null)
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setContextMenu({
                        x: Math.min(e.clientX, window.innerWidth - 190),
                        y: Math.min(e.clientY, window.innerHeight - 150),
                        chapter: ch
                      })
                    }}
                    className={`w-full group relative transition-all duration-200 select-none ${
                      isDragging ? 'opacity-40 scale-95' : ''
                    } ${
                      isDragOver ? 'border-t-2 border-purple-400 scale-[1.02]' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveChapterId(ch.id)
                        setActivePageIdx(0)
                        if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-grab active:cursor-grabbing ${
                        isActive
                          ? 'bg-violet-600/25 border border-violet-500/50 text-violet-100 font-semibold shadow-sm'
                          : 'hover:bg-violet-500/10 text-slate-300 opacity-80 hover:opacity-100'
                      }`}
                      title="คลิกเพื่อเปิดบทนี้ / ลากเพื่อสลับลำดับ / คลิกขวาเพื่อตั้งค่า"
                    >
                      <span className="flex items-center gap-2 truncate flex-1 min-w-0">
                        <span className="text-violet-400 text-sm shrink-0">📄</span>
                        <span className="truncate">
                          {ch.code || `บทที่ ${String(ch.number || idx + 1).padStart(2, '0')}`}
                          {ch.title && ch.title !== `บทที่ ${ch.number || idx + 1} — ตอนใหม่` && !ch.title.startsWith('บทที่ ') ? ` • ${ch.title}` : ''}
                        </span>
                      </span>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="px-1.5 py-0.5 rounded-md bg-black/30 text-[10px] text-violet-300 border border-white/5">
                          {pageCount} หน้า
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            setContextMenu({
                              x: Math.min(rect.left, window.innerWidth - 190),
                              y: Math.min(rect.bottom + 4, window.innerHeight - 150),
                              chapter: ch
                            })
                          }}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
                          title="เมนูตัวเลือก"
                        >
                          ⋯
                        </button>
                      </div>
                    </button>
                  </div>
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

            <WarmTooltipGroup delay={250} warmWindow={300} travel={280} lean={2}>
              <div className="grid grid-cols-1 gap-1.5">
                {/* Characters & Lore */}
                <WarmTooltip content="คลังข้อมูลตัวละครและโลกนิยายเพื่อเชื่อมต่อบริบท AI" side="right" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
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
                <WarmTooltip content="พล็อตย่อรายตอนสำหรับส่งเป็นบริบทอ้างอิงให้ AI" side="right" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
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
                <WarmTooltip content="คลังคำศัพท์นิยายกว่า 1,000+ คำ (ฟรีทุกแพลน)" side="right" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
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
                <WarmTooltip content="ประวัติการแก้ไขและกู้คืนฉบับร่างย้อนหลัง" side="right" surfaceColor="#1e1b2e" inkColor="#f4f4f5">
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
            </WarmTooltipGroup>
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

      {/* Context Menu for Chapters */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded-xl bg-[#1a1233] border border-white/20 p-1.5 shadow-2xl min-w-[180px] animate-fade-in text-xs select-none backdrop-blur-xl"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[10px] text-purple-300 font-bold border-b border-white/10 mb-1 truncate">
            {contextMenu.chapter.title || `บทที่ ${contextMenu.chapter.number}`}
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingChapter(contextMenu.chapter)
              setNewTitleInput(contextMenu.chapter.title || '')
              setContextMenu(null)
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white flex items-center gap-2 transition cursor-pointer"
          >
            <span>✏️</span>
            <span>เปลี่ยนชื่อตอน</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setChapterToDelete(contextMenu.chapter)
              setContextMenu(null)
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-300 hover:text-red-200 flex items-center gap-2 transition cursor-pointer"
          >
            <span>🗑</span>
            <span>ลบตอนนี้</span>
          </button>
        </div>
      )}

      {/* Modal: Rename Chapter */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#16102a] border border-white/20 p-5 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
              <span>✏️</span> เปลี่ยนชื่อตอน
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              กำหนดชื่อตอนใหม่สำหรับ {editingChapter.code || `บทที่ ${editingChapter.number}`}
            </p>
            <input
              type="text"
              autoFocus
              value={newTitleInput}
              onChange={(e) => setNewTitleInput(e.target.value)}
              placeholder="ระบุชื่อตอน..."
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 focus:border-purple-400 text-white text-xs outline-none mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  renameChapter(editingChapter.id, newTitleInput)
                  setEditingChapter(null)
                }
              }}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingChapter(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  renameChapter(editingChapter.id, newTitleInput)
                  setEditingChapter(null)
                }}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Chapter Confirmation */}
      {chapterToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#16102a] border border-red-500/30 p-5 shadow-2xl animate-fade-in text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-xl text-red-400">
              ⚠️
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">
              ยืนยันการลบตอนนี้?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              คุณแน่ใจหรือไม่ว่าต้องการลบ <span className="text-purple-300 font-bold">"{chapterToDelete.title || `บทที่ ${chapterToDelete.number}`}"</span>? หน้ากระดาษทั้งหมดในบทนี้จะถูกลบออก
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setChapterToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteChapter(chapterToDelete.id)
                  setChapterToDelete(null)
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                ลบตอนนี้ถาวร
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default memo(LeftSidebar)
