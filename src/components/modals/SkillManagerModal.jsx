import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { MAX_ACTIVE_SKILLS } from '../../lib/dynamicVocab'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'

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
  const isOpen = activeModal === 'skills'

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

  const handleApplyHint = (text) => {
    setPromptText(prev => {
      const trimmed = prev.trim()
      if (!trimmed) return text
      return `${trimmed}\n- ${text}`
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Dialog Card */}
          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 glass-panel w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl bg-[#141024] my-auto text-white"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-plottrix-panel2/60">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-bold text-base text-white">
                    AI Skill Manager (จัดการสกิลและคำสั่ง AI เฉพาะตัว)
                  </h3>
                  <p className="text-xs text-plottrix-muted">
                    เปิด/ปิดชุดคำสั่งเฉพาะ และกำหนด Custom Prompt เพื่อควบคุมลีลาภาษาตามใจสั่ง
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* 1. Free-Form Custom Prompt Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300 font-bold text-xs uppercase tracking-wider">
                      ✦ กฎและสไตล์เฉพาะตัวของนักเขียน (Custom Rule)
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                      สำคัญสูงสุด
                    </span>
                  </div>
                  {promptText.trim() && (
                    <button
                      type="button"
                      onClick={() => setPromptText('')}
                      className="text-[11px] text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      ล้างคำสั่ง
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="ใส่คำสั่งพิเศษ เช่น 'ใช้สรรพนาม ข้า-เจ้า ตลอดทั้งเรื่อง', 'หลีกเลี่ยงการพรรณนาด้วยคำว่า สวยงาม หรือ น่ารัก แต่ให้บรรยายรายละเอียดแทน' (หากเว้นว่าง ระบบจะใช้มาตรฐานสมดุลของ Plottrix)"
                    rows={4}
                    className="w-full p-4 rounded-xl bg-black/40 border border-purple-500/30 focus:border-purple-400 text-xs sm:text-sm text-slate-100 placeholder:text-zinc-600 outline-none leading-relaxed resize-none transition"
                  />
                  <div className="absolute right-3 bottom-3 text-[10px] text-zinc-500">
                    {promptText.length} ตัวอักษร
                  </div>
                </div>

                {/* Preset Suggestions Quick Insertion */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-zinc-400 mr-1">ทางลัดคำสั่ง:</span>
                  {PRESET_HINTS.map((hint, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyHint(hint.text)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/30 border border-white/10 hover:border-purple-400/40 text-purple-200 transition cursor-pointer"
                    >
                      {hint.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Specialized Modular Skills Toggles */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 font-bold text-xs uppercase tracking-wider">
                    ชุดสกิลวรรณกรรมมาตรฐาน (Modular Skills)
                  </span>
                  <span className="text-xs text-zinc-400">
                    เปิดใช้งาน {activeCount} / {MAX_ACTIVE_SKILLS} สกิล
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      onClick={() => handleToggle(skill.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                        skill.active
                          ? 'bg-purple-600/15 border-purple-400/50 text-white'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/15'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center text-[10px] font-bold ${
                        skill.active ? 'bg-purple-500 text-white' : 'border border-zinc-600'
                      }`}>
                        {skill.active && '✓'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-white mb-0.5">{skill.name}</div>
                        <div className="text-[11px] text-zinc-400 leading-snug">{skill.desc}</div>
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
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSavePrompt}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                ✓ บันทึกสกิลและคำสั่ง
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
