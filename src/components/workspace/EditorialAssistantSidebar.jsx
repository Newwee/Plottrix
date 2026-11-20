import React, { memo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import StatusMark from '../react-bits/StatusMark'
import WarmTooltip from '../react-bits/WarmTooltip'

function EditorialAssistantSidebar() {
  const {
    characters,
    activePersonaId, personas,
    triggerAiTask,
    customDictionary,
    setEditorialCheckOpen
  } = useApp()

  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0]

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs cursor-pointer"
        onClick={() => setEditorialCheckOpen(false)}
      />

      <aside className="workspace-ai fixed lg:relative right-0 top-0 bottom-0 z-40 w-72 sm:w-80 border-l border-plottrix-line/40 bg-[#16102a]/95 backdrop-blur-xl flex flex-col justify-between shrink-0 select-none h-full overflow-y-auto p-4 shadow-2xl transition-transform duration-200">
        <div className="space-y-4">
          {/* Header with Close Button */}
          <div className="ai-head flex items-center justify-between pb-2.5 border-b border-plottrix-line/30">
            <div className="flex items-center gap-2">
              <span className="text-purple-400">✦</span>
              <span className="font-bold text-xs tracking-wider text-purple-200">EDITORIAL CHECK</span>
              <span className="w-2 h-2 rounded-full bg-plottrix-mint animate-pulse" />
            </div>
            <button
              type="button"
              onClick={() => setEditorialCheckOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
              title="ปิดแผงตรวจบรรณาธิการ"
            >
              ✕
            </button>
          </div>

          {/* Scan Card */}
          <div className="scan-card">
            <small>ความต่อเนื่องข้ามตอน</small>
            <strong>98%</strong>
            <div className="scan-bars">
              <i style={{ height: '45%' }}></i>
              <i style={{ height: '70%' }}></i>
              <i style={{ height: '56%' }}></i>
              <i style={{ height: '90%' }}></i>
              <i style={{ height: '75%' }}></i>
              <i style={{ height: '100%' }}></i>
            </div>
          </div>

          {/* Checklist with StatusMark */}
          <div className="space-y-1.5">
            <div className="scan-check min-h-[36px] flex items-center">
              <StatusMark status="done" size={13} doneColor="#74d9b4" />
              <span>ตรวจคำผิด & คำพ้องเสียง</span>
            </div>
            <div className="scan-check min-h-[36px] flex items-center">
              <StatusMark status="done" size={13} doneColor="#74d9b4" />
              <span>คงเสียงตาม {activePersona.name.split(' ')[0]}</span>
            </div>
            <div className="scan-check min-h-[36px] flex items-center">
              <StatusMark status="done" size={13} doneColor="#74d9b4" />
              <span>ตรงกับ Lore Bible ({characters.length} ตัว)</span>
            </div>
          </div>

          {/* Live Editorial Suggestions Cards */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] uppercase font-bold text-plottrix-muted tracking-wider block">
              ข้อเสนอแนะแบบเรียลไทม์
            </span>

            <div
              onClick={() => triggerAiTask('polish')}
              className="ai-suggestion min-h-[44px] hover:border-plottrix-purple2/40 cursor-pointer transition p-2.5"
            >
              <b>คำแนะนำการเขียน</b>
              <small>ประโยคนี้อาจเพิ่มรายละเอียดทางประสาทสัมผัสเพื่อสร้างบรรยากาศ</small>
            </div>

            <div className="ai-suggestion min-h-[44px] p-2.5">
              <b>เช็คจุดต่างเนื้อเรื่อง</b>
              <small className="good">✓ ชื่อตัวละครตรงกับ Custom Dictionary ({customDictionary.length} คำ)</small>
            </div>

            <div
              onClick={() => triggerAiTask('plotBranch')}
              className="ai-suggestion min-h-[44px] hover:border-plottrix-purple2/40 cursor-pointer transition p-2.5"
            >
              <b>ตัวเลือกเส้นเรื่อง</b>
              <small>มี 3 แนวทางพร้อมย่อหน้าเกริ่นนำเพื่อขับเคลื่อนพล็อต</small>
            </div>
          </div>
        </div>

        {/* Quick Launch Editorial AI */}
        <div className="pt-3 border-t border-plottrix-line/40">
          <WarmTooltip content="เรียกตัวช่วยบรรณาธิการตรวจทั้งบท" side="top">
            <button
              type="button"
              onClick={() => triggerAiTask('continuity')}
              className="w-full py-3 min-h-[42px] rounded-xl btn-primary-purple text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>✦ ตรวจความสมเหตุสมผล</span>
            </button>
          </WarmTooltip>
        </div>
      </aside>
    </>
  )
}

export default memo(EditorialAssistantSidebar)
