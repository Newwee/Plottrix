import React from 'react'
import { useApp } from '../../context/AppContext'
import WarmTooltip from '../react-bits/WarmTooltip'

export default function LeftSidebar() {
  const {
    chapters,
    activeChapterId, setActiveChapterId,
    setActivePageIdx,
    addChapter,
    leftSidebarOpen,
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
    <aside className="workspace-rail w-48 sm:w-56 border-r border-plottrix-line/40 bg-plottrix-panel2/40 flex flex-col justify-between shrink-0 select-none">
      <div className="space-y-4">
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
                  }}
                  className={`rail-item ${isActive ? 'active' : ''}`}
                >
                  <span className="text-plottrix-purple2 text-xs">▣</span>
                  <span className="truncate flex-1">
                    บทที่ {String(ch.number).padStart(2, '0')}
                  </span>
                </div>
              )
            })}

            <button
              onClick={addChapter}
              className="rail-item hover:text-plottrix-purple2 text-plottrix-muted/80 w-full text-left"
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
                onClick={() => setActiveModal('characterBible')}
                className="rail-item"
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
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className={`rail-item ${rightSidebarOpen ? 'active' : ''}`}
              >
                <span>▧</span>
                <span className="flex-1">คลังคำศัพท์</span>
                <span className="text-[10px] text-plottrix-mint">1k+</span>
              </div>
            </WarmTooltip>

            <WarmTooltip content={`สไตล์สำนวน: ${activePersona.name}`} side="right">
              <div
                onClick={() => setActiveModal('stylePersona')}
                className="rail-item"
              >
                <span>✧</span>
                <span className="truncate flex-1">Style Persona</span>
              </div>
            </WarmTooltip>

            <WarmTooltip content="พจนานุกรมคำเฉพาะ (Custom Dictionary)" side="right">
              <div
                onClick={() => setActiveModal('customDictionary')}
                className="rail-item"
              >
                <span>📖</span>
                <span className="flex-1">คำเฉพาะ</span>
              </div>
            </WarmTooltip>

            <WarmTooltip content="Active Skills Guardrails" side="right">
              <div
                onClick={() => setActiveModal('skills')}
                className="rail-item"
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
                onClick={() => setActiveModal('history')}
                className="rail-item"
              >
                <span>⏱</span>
                <span className="flex-1">ประวัติแก้ไข</span>
              </div>
            </WarmTooltip>
          </div>
        </div>
      </div>

      {/* Novel Progress Widget */}
      <div className="p-2.5 rounded-xl bg-plottrix-bg2/80 border border-plottrix-line/30 space-y-1.5 text-[10px] text-plottrix-muted">
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
  )
}
