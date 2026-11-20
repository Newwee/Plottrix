import React, { memo } from 'react'
import { useApp } from '../../context/AppContext'
import WarmTooltip from '../react-bits/WarmTooltip'

function LeftSidebar() {
  const {
    chapters,
    activeChapterId, setActiveChapterId,
    setActivePageIdx,
    addChapter,
    leftSidebarOpen, setLeftSidebarOpen,
    setActiveModal,
    characters,
    activePersonaId, personas,
    skills,
    rightSidebarOpen, setRightSidebarOpen
  } = useApp()

  if (!leftSidebarOpen) return null

  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0]
  const activeSkillsCount = skills.filter(s => s.active).length

  return (
    <>
      {/* Mobile Backdrop for Slide-over Drawer (<1024px) */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden cursor-pointer"
        onClick={() => setLeftSidebarOpen(false)}
      />

      <aside className="workspace-rail fixed lg:relative inset-y-0 left-0 z-40 w-64 sm:w-60 border-r border-plottrix-line/40 bg-[#140f25] lg:bg-plottrix-panel2/40 flex flex-col justify-between shrink-0 select-none shadow-2xl lg:shadow-none overflow-y-auto transition-transform duration-200">
        <div className="space-y-4 p-2 sm:p-0">
          {/* Mobile Header with Close button */}
          <div className="flex lg:hidden items-center justify-between pb-2 border-b border-plottrix-line/30 mb-2">
            <span className="font-bold text-xs text-purple-300">สารบัญ & Story Bible</span>
            <button
              type="button"
              onClick={() => setLeftSidebarOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>

          {/* Project Section */}
          <div>
            <div className="side-label">PROJECT</div>
            <div className="space-y-1">
              {chapters.map((ch) => {
                const isActive = ch.id === activeChapterId
                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      setActiveChapterId(ch.id)
                      setActivePageIdx(0)
                      if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                    }}
                    className={`rail-item min-h-[40px] ${isActive ? 'active' : ''}`}
                  >
                    <span className="text-plottrix-purple2 text-xs">▣</span>
                    <span className="truncate flex-1">
                      บทที่ {String(ch.number).padStart(2, '0')}
                    </span>
                  </div>
                )
              })}

              <button
                type="button"
                onClick={addChapter}
                className="rail-item min-h-[40px] hover:text-plottrix-purple2 text-plottrix-muted/80 w-full text-left"
              >
                <span>＋</span>
                <span>เพิ่มตอนใหม่</span>
              </button>
            </div>
          </div>

          {/* Story Bible Section */}
          <div id="tour-target-sidebar-tools">
            <div className="side-label">STORY BIBLE</div>
            <div className="space-y-1">
              <WarmTooltip content="ข้อมูลตัวละครและโลกนิยาย" side="right">
                <div
                  onClick={() => {
                    setActiveModal('characterBible')
                    if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                  }}
                  className="rail-item min-h-[40px]"
                >
                  <span>♟</span>
                  <span className="flex-1">ตัวละคร & Lore</span>
                  <span className="text-[10px] text-plottrix-purple2 bg-plottrix-purple/20 px-1.5 py-0.2 rounded-full">
                    {characters.length}
                  </span>
                </div>
              </WarmTooltip>

              <WarmTooltip content="คลังคำศัพท์สำหรับนักเขียน (1,041 คำ)" side="right">
                <div
                  onClick={() => {
                    setRightSidebarOpen(!rightSidebarOpen)
                    if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                  }}
                  className={`rail-item min-h-[40px] ${rightSidebarOpen ? 'active' : ''}`}
                >
                  <span>▧</span>
                  <span className="flex-1">คลังคำศัพท์</span>
                  <span className="text-[10px] text-plottrix-mint">1k+</span>
                </div>
              </WarmTooltip>

              <WarmTooltip content={`สไตล์สำนวน: ${activePersona.name}`} side="right">
                <div
                  onClick={() => {
                    setActiveModal('stylePersona')
                    if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                  }}
                  className="rail-item min-h-[40px]"
                >
                  <span>✧</span>
                  <span className="truncate flex-1">Style Persona</span>
                </div>
              </WarmTooltip>

              <WarmTooltip content="พจนานุกรมคำเฉพาะ (Custom Dictionary)" side="right">
                <div
                  onClick={() => {
                    setActiveModal('customDictionary')
                    if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                  }}
                  className="rail-item min-h-[40px]"
                >
                  <span>📖</span>
                  <span className="flex-1">คำเฉพาะ</span>
                </div>
              </WarmTooltip>

              <WarmTooltip content="Active Skills Guardrails" side="right">
                <div
                  onClick={() => {
                    setActiveModal('skills')
                    if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                  }}
                  className="rail-item min-h-[40px]"
                >
                  <span>⚡</span>
                  <span className="flex-1">Active Skills</span>
                  <span className="text-[10px] text-plottrix-mint bg-plottrix-mint/15 px-1.5 py-0.2 rounded-full">
                    {activeSkillsCount}
                  </span>
                </div>
              </WarmTooltip>

              <WarmTooltip content="ประวัติเวอร์ชันและจุดย้อนกลับ" side="right">
                <div
                  onClick={() => {
                    setActiveModal('history')
                    if (window.innerWidth < 1024) setLeftSidebarOpen(false)
                  }}
                  className="rail-item min-h-[40px]"
                >
                  <span>⏱</span>
                  <span className="flex-1">ประวัติแก้ไข</span>
                </div>
              </WarmTooltip>
            </div>
          </div>
        </div>

        {/* Novel Progress Widget */}
        <div className="m-2 p-2.5 rounded-xl bg-plottrix-bg2/80 border border-plottrix-line/30 space-y-1.5 text-[10px] text-plottrix-muted">
          <div className="flex items-center justify-between font-bold text-plottrix-text">
            <span>ความคืบหน้านิยาย</span>
            <span className="text-plottrix-purple2">{chapters.length} ตอน</span>
          </div>
          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-plottrix-purple to-plottrix-mint w-3/5 rounded-full" />
          </div>
          <div className="flex items-center justify-between text-[9px]">
            <span>เป้าหมาย 20k คำ</span>
            <span>พร้อมส่งออก</span>
          </div>
        </div>
      </aside>
    </>
  )
}

export default memo(LeftSidebar)
