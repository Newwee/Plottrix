import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'

export default function VersionHistoryModal() {
  const {
    activeModal, setActiveModal,
    snapshots, saveSnapshot,
    updateCurrentPageText,
    addToast
  } = useApp()

  const [selectedSnap, setSelectedSnap] = useState(snapshots[0] || null)
  const isOpen = activeModal === 'history'

  const handleRollback = () => {
    if (!selectedSnap) return
    updateCurrentPageText(selectedSnap.preview)
    addToast({
      title: 'ย้อนกลับต้นฉบับสำเร็จ',
      description: `กู้คืนเนื้อหาจากเวอร์ชัน "${selectedSnap.label}"`,
      fuseColor: '#74d9b4'
    })
    setActiveModal(null)
  }

  const handleCreateSnapshot = () => {
    saveSnapshot('บันทึกด้วยมือ')
    addToast({ title: 'สร้างจุดย้อนกลับใหม่เรียบร้อย', fuseColor: '#74d9b4' })
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
            className="relative z-10 glass-panel w-full max-w-3xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl bg-[#141024] my-auto text-white"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-plottrix-line/40 flex items-center justify-between bg-plottrix-panel2/60">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⏱</span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Version History (ประวัติการแก้ไขและจุดย้อนกลับ)
                  </h3>
                  <p className="text-[11px] text-plottrix-muted">
                    ระบบสำรองข้อมูลอัตโนมัติก่อนเรียกใช้งาน AI และเมื่อสั่งบันทึก
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateSnapshot}
                  className="px-3 py-1.5 rounded-xl btn-primary-purple text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  + บันทึกจุดย้อนกลับตอนนี้
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-lg transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body Split */}
            <div className="flex-1 flex overflow-hidden">
              {/* Timeline List */}
              <div className="w-64 sm:w-72 border-r border-plottrix-line/40 p-3 overflow-y-auto space-y-2 bg-plottrix-bg2/40">
                {snapshots.map(s => {
                  const isSelected = s.id === selectedSnap?.id
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSnap(s)}
                      className={`p-3 rounded-xl cursor-pointer transition border text-xs ${
                        isSelected
                          ? 'bg-plottrix-purple/20 border-plottrix-purple2 text-white shadow-xs'
                          : 'bg-plottrix-panel2/40 border-transparent hover:bg-white/5 text-plottrix-muted hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-white mb-0.5">{s.label}</div>
                      <div className="text-[10px] text-plottrix-muted/80">{s.timestamp}</div>
                    </div>
                  )
                })}
              </div>

              {/* Preview & Rollback */}
              <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between space-y-4 bg-plottrix-panel/40">
                {selectedSnap ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-plottrix-line/30">
                      <div>
                        <h4 className="font-bold text-sm text-white">{selectedSnap.label}</h4>
                        <span className="text-[11px] text-plottrix-muted">{selectedSnap.timestamp}</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleRollback}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold transition cursor-pointer"
                      >
                        ↺ กู้คืนเวอร์ชันนี้
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-plottrix-bg2/80 border border-plottrix-line/40 text-xs leading-relaxed text-plottrix-text whitespace-pre-wrap font-thai max-h-[340px] overflow-y-auto">
                      {selectedSnap.preview}
                    </div>
                  </div>
                ) : (
                  <div className="m-auto text-center text-xs text-plottrix-muted">
                    เลือกจุดย้อนกลับเพื่อดูตัวอย่างเนื้อหา
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
