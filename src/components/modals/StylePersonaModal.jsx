import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'

export default function StylePersonaModal() {
  const {
    activeModal, setActiveModal,
    personas, activePersonaId, setActivePersonaId,
    addToast
  } = useApp()

  const isOpen = activeModal === 'stylePersona'

  const handleSelect = (id, name) => {
    setActivePersonaId(id)
    addToast({
      title: `เปลี่ยนสไตล์สำนวนเป็น "${name}"`,
      description: 'AI จะใช้โปรไฟล์ภาษานี้ในการขัดเกลาบทบรรยายและบทสนทนา',
      fuseColor: '#c29aff'
    })
    setActiveModal(null)
  }

  const SAMPLES = {
    'persona-1': '“ม่านหมอกสีครามลอยอ้อยอิ่งเหนือผืนน้ำ แสงจันทร์เล็ดลอดผ่านรอยแยกของเมฆหนา สะท้อนประกายระยับราวกับเกล็ดเงินที่โปรยปรายลงสู่พื้นพิภพ...”',
    'persona-2': '“มีดสั้นพุ่งตัดอากาศ เงาร่างเพรียวลมเบี่ยงตัวหลบ คมมีดเฉียดปลายผมเพียงเสี้ยววินาที เธอพลิกตัวตวัดศอกกลับทันควันโดยไม่เสียจังหวะ!”',
    'persona-3': '“เขาสบตาเธอด้วยแววตาที่เปี่ยมไปด้วยความห่วงใย รอยยิ้มบางๆ บนใบหน้านั้นทำให้ความหนาวเหน็บในค่ำคืนนี้จางหายไปจนหมดสิ้น...”'
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
            className="relative z-10 glass-panel w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl bg-[#141024] my-auto text-white"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-plottrix-line/40 flex items-center justify-between bg-plottrix-panel2/60">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🎭</span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Style Persona (สไตล์และน้ำเสียงของ AI)
                  </h3>
                  <p className="text-[11px] text-plottrix-muted">
                    เลือกรูปแบบสำนวนภาษาที่ตรงกับจริตและแนวทางการเขียนนิยายของคุณ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Persona Options */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
              {personas.map(p => {
                const isActive = p.id === activePersonaId
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p.id, p.name)}
                    className={`p-4 rounded-xl cursor-pointer transition border ${
                      isActive
                        ? 'bg-plottrix-purple/20 border-plottrix-purple2 shadow-glow-purple text-white'
                        : 'bg-plottrix-panel2/60 border-plottrix-line/40 hover:border-plottrix-purple2/40 text-plottrix-text'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{isActive ? '✦' : '✧'}</span>
                        <h4 className="font-bold text-sm text-white">{p.name}</h4>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-plottrix-purple text-white shadow-xs">
                          กำลังใช้งาน
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-plottrix-purple2/90 font-medium mb-1">
                      {p.tone}
                    </p>
                    <p className="text-xs text-plottrix-muted leading-relaxed mb-3">
                      {p.desc}
                    </p>

                    {/* Excerpt Sample */}
                    <div className="p-2.5 rounded-lg bg-black/40 text-[11px] text-plottrix-text/80 italic border-l-2 border-plottrix-purple">
                      {SAMPLES[p.id]}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
