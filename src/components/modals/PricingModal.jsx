import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import PricingCards from '../home/PricingCards'
import confetti from 'canvas-confetti'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'

export default function PricingModal() {
  const {
    activeModal, setActiveModal,
    trixBalance, setTrixBalance,
    plan, upgradePlanPrototype,
    addToast
  } = useApp()

  const isOpen = activeModal === 'pricing'

  const handleTopup = (amount, price) => {
    setTrixBalance(b => b + amount)
    confetti({
      particleCount: 70,
      spread: 50,
      origin: { y: 0.5, x: 0.5 },
      colors: ['#9b63ff', '#74d9b4', '#e9c78c']
    })
    addToast({
      title: `เติมสำเร็จ +${amount} Trix!`,
      description: `ยอด Trix รวมปัจจุบันคือ ${trixBalance + amount} Trix`,
      fuseColor: '#74d9b4'
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
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 glass-panel w-full max-w-5xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl bg-[#120d22]/95 text-white my-auto"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-plottrix-line/40 flex items-center justify-between bg-plottrix-panel2/60">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪙</span>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white">
                    Trix Coins & Membership (เหรียญและแพ็กเกจสมาชิก)
                  </h3>
                  <p className="text-xs text-plottrix-muted">
                    อัตราการใช้เหรียญโปร่งใส: ตรวจคำผิด (1 Trix), เกลาสำนวน (3 Trix), พล็อต (4 Trix)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-9 h-9 rounded-xl hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* Membership Pricing Cards */}
              <div>
                <div className="text-xs uppercase tracking-wider text-purple-300 font-bold mb-4">
                  ★ เลือกแพ็กเกจสมาชิก (Plan Tiers)
                </div>
                <PricingCards onSelectPlan={upgradePlanPrototype} currentPlan={plan} />
              </div>

              {/* Trix Coin Top-up Packages */}
              <div className="pt-6 border-t border-plottrix-line/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-amber-300 font-bold">
                      🪙 เติมเหรียญ Trix แยกตามการใช้งาน (Pay-As-You-Go)
                    </div>
                    <div className="text-xs text-plottrix-muted">
                      เหรียญไม่มีวันหมดอายุ ใช้งานได้กับฟีเจอร์ AI ทุกระดับ
                    </div>
                  </div>
                  <div className="text-xs text-purple-300 bg-purple-600/20 border border-purple-500/30 px-3 py-1 rounded-full font-bold">
                    ยอดปัจจุบัน: {trixBalance} Trix
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border border-plottrix-line/50 bg-white/5 hover:border-purple-400/50 transition flex flex-col justify-between">
                    <div>
                      <div className="text-lg font-bold text-amber-300">50 Trix</div>
                      <div className="text-[11px] text-plottrix-muted mb-3">เหมาะสำหรับทดลองเขียน</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTopup(50, 49)}
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-purple-600 hover:text-white text-xs font-bold text-plottrix-text border border-plottrix-line transition cursor-pointer"
                    >
                      ฿49 บาท
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-plottrix-line/50 bg-white/5 hover:border-purple-400/50 transition flex flex-col justify-between">
                    <div>
                      <div className="text-lg font-bold text-amber-300">120 Trix</div>
                      <div className="text-[11px] text-plottrix-muted mb-3">+10 Trix โบนัส</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTopup(120, 99)}
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-purple-600 hover:text-white text-xs font-bold text-plottrix-text border border-plottrix-line transition cursor-pointer"
                    >
                      ฿99 บาท
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-purple-400/50 bg-purple-950/20 transition flex flex-col justify-between relative overflow-hidden">
                    <span className="absolute top-0 right-0 bg-purple-600 text-[9px] font-bold text-white px-2 py-0.5 rounded-bl-lg">
                      ยอดนิยม
                    </span>
                    <div>
                      <div className="text-lg font-bold text-amber-300">260 Trix</div>
                      <div className="text-[11px] text-plottrix-muted mb-3">+40 Trix โบนัส</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTopup(260, 189)}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                    >
                      ฿189 บาท
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-plottrix-line/50 bg-white/5 hover:border-purple-400/50 transition flex flex-col justify-between">
                    <div>
                      <div className="text-lg font-bold text-amber-300">450 Trix</div>
                      <div className="text-[11px] text-plottrix-muted mb-3">+100 Trix จุใจ</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTopup(450, 299)}
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-purple-600 hover:text-white text-xs font-bold text-plottrix-text border border-plottrix-line transition cursor-pointer"
                    >
                      ฿299 บาท
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
