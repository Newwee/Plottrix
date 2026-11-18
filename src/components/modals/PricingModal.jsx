import React from 'react'
import { useApp } from '../../context/AppContext'
import PricingCards from '../home/PricingCards'
import confetti from 'canvas-confetti'

export default function PricingModal() {
  const {
    activeModal, setActiveModal,
    trixBalance, setTrixBalance,
    plan, upgradePlanPrototype,
    addToast
  } = useApp()

  if (activeModal !== 'pricing') return null

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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fade-in">
      <div className="glass-panel w-full max-w-5xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden border border-plottrix-line shadow-2xl bg-[#120d22]/95">
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
            onClick={() => setActiveModal(null)}
            className="w-9 h-9 rounded-xl hover:bg-white/10 text-plottrix-muted hover:text-white flex items-center justify-center text-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-8">
          {/* Current Balance Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-plottrix-panel2 to-plottrix-panel2 border border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl sm:text-4xl">🪙</span>
              <div>
                <span className="text-xs text-plottrix-muted block">ยอดเหรียญ Trix ของคุณ</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-300">{trixBalance} Trix</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-plottrix-muted block mb-1">แพ็กเกจปัจจุบัน</span>
              <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-3 py-1.5 rounded-full border border-purple-400/30">
                {plan}
              </span>
            </div>
          </div>

          {/* Pricing Cards (Identical with Home) */}
          <div>
            <div className="text-center mb-6">
              <h4 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                เลือกแผนสมาชิกรายเดือน
              </h4>
              <p className="text-xs text-plottrix-muted mt-1">
                อัปเกรดเพื่อรับ Trix รายเดือน ปลดล็อกความจุตอน และลดเวลา Cooldown
              </p>
            </div>

            <PricingCards
              currentPlan={plan}
              onSelectPlan={(newPlan) => {
                upgradePlanPrototype(newPlan)
                setActiveModal(null)
              }}
            />
          </div>

          {/* Trix Coin Packs */}
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-4">
              หรือเติมเหรียญ Trix รายครั้ง (ไม่มีวันหมดอายุ)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-plottrix-panel2/60 border border-plottrix-line/40 hover:border-purple-400/40 transition flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs text-plottrix-muted font-bold">ชุดเริ่มต้น (Starter)</span>
                  <div className="text-xl font-bold text-white mt-1">60 Trix</div>
                  <span className="text-xs text-plottrix-muted">เหมาะสำหรับทดลองเขียน 2-3 บท</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTopup(60, 59)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-purple-600 hover:text-white text-xs font-bold text-plottrix-text border border-plottrix-line transition"
                >
                  ฿59 บาท
                </button>
              </div>

              <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-400/40 relative flex flex-col justify-between space-y-3 shadow-lg">
                <span className="absolute -top-2.5 right-3 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  ยอดนิยม
                </span>
                <div>
                  <span className="text-xs text-purple-300 font-bold">ชุดคุ้มค่า (Author)</span>
                  <div className="text-xl font-bold text-white mt-1">180 Trix <span className="text-xs text-emerald-400">+20 โบนัส</span></div>
                  <span className="text-xs text-plottrix-muted">พอสำหรับแต่งนิยายจบเล่มสั้น</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTopup(200, 149)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition"
                >
                  ฿149 บาท
                </button>
              </div>

              <div className="p-4 rounded-xl bg-plottrix-panel2/60 border border-plottrix-line/40 hover:border-purple-400/40 transition flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs text-amber-300 font-bold">ชุดสุดคุ้ม (Pro Writer)</span>
                  <div className="text-xl font-bold text-white mt-1">400 Trix <span className="text-xs text-emerald-400">+50 โบนัส</span></div>
                  <span className="text-xs text-plottrix-muted">สำหรับนักเขียนมืออาชีพเขียนรายวัน</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTopup(450, 299)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-purple-600 hover:text-white text-xs font-bold text-plottrix-text border border-plottrix-line transition"
                >
                  ฿299 บาท
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
