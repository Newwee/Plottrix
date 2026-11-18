import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import StatusMark from '../react-bits/StatusMark'
import WarmTooltip from '../react-bits/WarmTooltip'

export default function EditorialAssistantSidebar() {
  const {
    characters,
    activePersonaId, personas,
    triggerAiTask,
    customDictionary
  } = useApp()

  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0]
  const [activeSuggestionTab, setActiveSuggestionTab] = useState(0)

  return (
    <aside className="workspace-ai w-60 sm:w-64 border-l border-plottrix-line/40 bg-plottrix-panel2/30 flex flex-col justify-between shrink-0 select-none">
      <div className="space-y-4">
        {/* Header */}
        <div className="ai-head flex items-center justify-between pb-2 border-b border-plottrix-line/30">
          <span>✦ EDITORIAL CHECK</span>
          <span className="w-2 h-2 rounded-full bg-plottrix-mint animate-pulse" />
        </div>

        {/* Scan Card (Exactly matching ChangeSingleToTrio) */}
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
          <div className="scan-check">
            <StatusMark status="done" size={13} doneColor="#74d9b4" />
            <span>ตรวจคำผิด & คำพ้องเสียง</span>
          </div>
          <div className="scan-check">
            <StatusMark status="done" size={13} doneColor="#74d9b4" />
            <span>คงเสียงตาม {activePersona.name.split(' ')[0]}</span>
          </div>
          <div className="scan-check">
            <StatusMark status="done" size={13} doneColor="#74d9b4" />
            <span>ตรงกับ Lore Bible ({characters.length} ตัว)</span>
          </div>
        </div>

        {/* Live Editorial Suggestions Cards (Matching ChangeSingleToTrio) */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] uppercase font-bold text-plottrix-muted tracking-wider block">
            ข้อเสนอแนะแบบเรียลไทม์
          </span>

          <div
            onClick={() => triggerAiTask('polish')}
            className="ai-suggestion hover:border-plottrix-purple2/40 cursor-pointer transition"
          >
            <b>คำแนะนำการเขียน</b>
            <small>ประโยคนี้อาจเพิ่มรายละเอียดทางประสาทสัมผัสเพื่อสร้างบรรยากาศ</small>
          </div>

          <div className="ai-suggestion">
            <b>เช็คจุดต่างเนื้อเรื่อง</b>
            <small className="good">✓ ชื่อตัวละครตรงกับ Custom Dictionary ({customDictionary.length} คำ)</small>
          </div>

          <div
            onClick={() => triggerAiTask('plotBranch')}
            className="ai-suggestion hover:border-plottrix-purple2/40 cursor-pointer transition"
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
            onClick={() => triggerAiTask('continuity')}
            className="w-full py-2.5 rounded-xl btn-primary-purple text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
          >
            <span>✦ ตรวจความสมเหตุสมผล</span>
          </button>
        </WarmTooltip>
      </div>
    </aside>
  )
}
