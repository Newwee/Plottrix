import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { MAX_ACTIVE_SKILLS } from '../../lib/dynamicVocab'

const PRESET_HINTS = [
  { label: '+ สำนวนพีเรียด/โบราณ', text: 'ใช้สำนวนภาษาไทยโบราณ เน้นคำสละสลวย ใช้สรรพนาม ข้า-เจ้า ไม่ใช้คำสแลงสมัยใหม่' },
  { label: '+ ช็อตแอ็กชันกระชับ', text: 'ตัดประโยคให้สั้น กระชับ จังหวะการเคลื่อนไหวฉับไว เน้นกริยาและการต่อสู้ที่ดุดัน' },
  { label: '+ เน้นประสาทสัมผัส 5 ด้าน', text: 'ขับเน้นรายละเอียด รูป รส กลิ่น เสียง และอุณหภูมิในฉากให้ผู้อ่านเห็นภาพชัดเจน' },
  { label: '+ อารมณ์บีบคั้น/ระทึกขวัญ', text: 'สร้างบรรยากาศกดดัน บรรยายความเงียบ จังหวะการเต้นของหัวใจ และความหวาดระแวง' }
]

export default function SkillManagerModal() {
  const {
    activeModal, setActiveModal,
    skills, setSkills,
    customSkillPrompt, setCustomSkillPrompt,
    addToast
  } = useApp()

  const [promptText, setPromptText] = useState(customSkillPrompt || '')

  if (activeModal !== 'skills') return null

  const activeCount = skills.filter(s => s.active).length

  const handleToggle = (id) => {
    const target = skills.find(s => s.id === id)
    if (!target.active && activeCount >= MAX_ACTIVE_SKILLS) {
      addToast({
        title: `จำกัดเปิดใช้งานสูงสุด ${MAX_ACTIVE_SKILLS} สกิลพร้อมกัน`,
        description: 'เพื่อคุมจำนวน Token ขาเข้าและความแม่นยำในการเกลาสำนวน',
        fuseColor: '#e9c78c'
      })
      return
    }

    setSkills(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, active: !s.active }
      }
      return s
    }))
  }

  const handleSavePrompt = () => {
    setCustomSkillPrompt(promptText.trim())
    addToast({
      title: 'บันทึก Custom AI Skill เรียบร้อย!',
      description: promptText.trim() ? 'AI จะนำคำสั่งนี้ไปเป็นกฎสำคัญอันดับหนึ่งในการเขียน' : 'สลับกลับไปใช้เอนจินมาตรฐานของ Plottrix',
      fuseColor: '#74d9b4'
    })
    setActiveModal(null)
  }

  const handleAppendPreset = (text) => {
    setPromptText(prev => {
      if (!prev.trim()) return text
      return `${prev.trim()}\n- ${text}`
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fade-in">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl bg-[#130e24]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-plottrix-panel2/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="font-bold text-base text-white">
                AI Skill & Custom Instructions (คลังสกิลและคำสั่งเฉพาะตัว)
              </h3>
              <p className="text-xs text-plottrix-muted">
                ใส่คำสั่งกำหนดสไตล์การเขียนได้อิสระ หรือเลือกเปิด-ปิดสกิลมาตรฐานของระบบ
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Section 1: Free-form Text Prompt (User requested priority) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <span>📝</span> คำสั่งและสไตล์เฉพาะตัว (Custom Free-form Prompt)
              </label>
              {promptText.trim() && (
                <button
                  type="button"
                  onClick={() => setPromptText('')}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline"
                >
                  ล้างคำสั่ง (ใช้ Default AI)
                </button>
              )}
            </div>

            <p className="text-xs text-plottrix-muted leading-relaxed">
              ปล่อยว่างไว้ = ทำงานด้วยสมองมาตรฐานของ AI ตามปกติ <br />
              หากใส่ข้อความ = AI จะอ่านสกิลนี้เป็น <strong>กฎสำคัญสูงสุด (Priority #1)</strong> ก่อนทำงานเสมอ
            </p>

            <textarea
              rows={4}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="พิมพ์คำสั่งหรือข้อกำหนด เช่น: 'เน้นบรรยายฉากด้วยภาษาโบราณ สรรพนามข้า-เจ้า ห้ามใช้คำศัพท์สแลงสมัยใหม่เด็ดขาด และเน้นบรรยายกลิ่นอายฝนตกบีบคั้น'..."
              className="w-full p-3.5 rounded-xl bg-black/40 border border-white/15 focus:border-purple-400 text-white text-xs leading-relaxed outline-none transition resize-none placeholder:text-slate-500"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-plottrix-muted">ตัวอย่างคำสั่งด่วน:</span>
              {PRESET_HINTS.map((hint, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAppendPreset(hint.text)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/20 text-purple-200 border border-white/10 text-[11px] font-medium transition"
                >
                  {hint.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* Section 2: Built-in Core Skills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <span>🛠️</span> สกิลเขียนมาตรฐานของระบบ (Built-in Skills)
              </label>
              <span className="text-xs text-plottrix-muted">
                เปิดใช้งาน: <strong className="text-purple-300">{activeCount}</strong> / {MAX_ACTIVE_SKILLS}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.map(skill => (
                <div
                  key={skill.id}
                  onClick={() => handleToggle(skill.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                    skill.active
                      ? 'border-purple-400/60 bg-purple-600/15 text-white'
                      : 'border-white/10 bg-black/25 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <h5 className="font-bold text-xs truncate flex items-center gap-1.5">
                      <span>{skill.active ? '🟢' : '⚪'}</span>
                      <span>{skill.name}</span>
                    </h5>
                    <p className="text-[11px] text-plottrix-muted leading-relaxed line-clamp-2">
                      {skill.desc}
                    </p>
                  </div>

                  <div className={`w-8 h-4 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                    skill.active ? 'bg-purple-600' : 'bg-white/10'
                  }`}>
                    <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${
                      skill.active ? 'translate-x-4' : 'translate-x-0.5'
                    } top-0.5 absolute`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 bg-black/30">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSavePrompt}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition"
          >
            ✓ บันทึกสกิลและคำสั่ง
          </button>
        </div>
      </div>
    </div>
  )
}
