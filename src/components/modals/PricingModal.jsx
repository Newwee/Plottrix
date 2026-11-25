import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import PricingCards from '../home/PricingCards'
import { modalBackdropVariants, modalContentVariants } from '../../lib/animations'
import { formatExpiryDateTime } from '../../lib/subscription'

export default function PricingModal() {
  const {
    activeModal, setActiveModal,
    trixBalance,
    plan,
    planTier,
    trialCountdown,
    activeSubscription,
    recentOrders,
    topupTrix
  } = useApp()

  const isOpen = activeModal === 'pricing'
  const isProTrial = planTier === 'pro_trial'
  const isPaidActive = planTier === 'pro' || planTier === 'ultra'

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
                <img src="/Logo/TrixCoinLogo.png" alt="Trix Coin" className="w-8 h-8 object-contain" />
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                    <span>Trix Coins & Membership (เหรียญและแพ็กเกจสมาชิก)</span>
                    {isProTrial && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                        Pro Trial Active
                      </span>
                    )}
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

            {/* Pro Trial Live Countdown Banner (If in trial) */}
            {isProTrial && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-purple-600/20 border border-purple-400/40 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-lg shadow-sm">
                    ⏱️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>คุณกำลังอยู่ในช่วงทดลองใช้ Pro Plan++ ฟรี 3 วัน</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded-full font-semibold border border-emerald-500/30">
                        สิทธิ์พิเศษ
                      </span>
                    </div>
                    <div className="text-[11px] text-purple-200 mt-0.5">
                      ปลดล็อกโควต้านิยายไม่จำกัด, Character Bible ลึกซึ้ง และความเร็ว AI สูงสุด
                    </div>
                  </div>
                </div>

                <div className="text-right bg-black/40 px-3.5 py-1.5 rounded-lg border border-purple-400/30">
                  <div className="text-[10px] text-purple-300 uppercase font-bold tracking-wider">
                    เหลือเวลาทดลองใช้
                  </div>
                  <div className="text-xs sm:text-sm font-black text-amber-300">
                    {trialCountdown || 'กำลังคำนวณ...'}
                  </div>
                </div>
              </div>
            )}

            {isPaidActive && activeSubscription?.expires_at && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-emerald-300">
                    ✓ แพ็กเกจ {plan} กำลังใช้งานอยู่
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    ใช้งานได้ต่อเนื่องถึง {formatExpiryDateTime(activeSubscription.expires_at)}
                  </div>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                  Active Membership
                </span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* Membership Pricing Cards */}
              <div>
                <div className="text-xs uppercase tracking-wider text-purple-300 font-bold mb-4 flex items-center justify-between">
                  <span>★ เลือกแพ็กเกจสมาชิก (Plan Tiers)</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    * นโยบายไม่อนุญาตให้ลดระดับแพลน (Strict No-Downgrade)
                  </span>
                </div>
                <PricingCards currentPlan={plan} />
              </div>

              {Array.isArray(recentOrders) && recentOrders.length > 0 && (
                <div className="pt-4 border-t border-plottrix-line/30">
                  <div className="text-xs uppercase tracking-wider text-purple-300 font-bold mb-3">
                    ประวัติคำสั่งซื้อล่าสุดของคุณ
                  </div>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {recentOrders.slice(0, 5).map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{ord.order_code}</span>
                          <span className="text-slate-400 ml-2">
                            {ord.plan_snapshot?.name || 'Membership'} • ฿{Number(ord.amount || 0).toLocaleString()}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ord.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                              : ord.status === 'MANUAL_REVIEW' || ord.status === 'VERIFYING'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                              : ord.status === 'REJECTED' || ord.status === 'EXPIRED'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                              : 'bg-white/10 text-slate-300 border-white/20'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trix Coin Top-up Packages (Temporarily Disabled for Real Payment Gateway) */}
              <div className="pt-6 border-t border-plottrix-line/30">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                      <img src="/Logo/TrixCoinLogo.png" alt="Trix Coin" className="w-4 h-4 object-contain inline-block" />
                      <span>เติมเหรียญ Trix แยกตามการใช้งาน (Pay-As-You-Go)</span>
                    </div>
                    <div className="text-xs text-plottrix-muted">
                      เหรียญไม่มีวันหมดอายุ ใช้งานได้กับฟีเจอร์ AI ทุกระดับ
                    </div>
                  </div>
                  <div className="text-xs text-purple-300 bg-purple-600/20 border border-purple-500/30 px-3 py-1 rounded-full font-bold">
                    ยอดปัจจุบัน: {trixBalance} Trix
                  </div>
                </div>

                {/* Disabled Notice Banner */}
                <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <div className="text-xs">
                    <span className="font-bold text-amber-300">
                      ระบบเติมเหรียญ Trix แบบ Pay-As-You-Go อยู่ระหว่างพัฒนาเพิ่มเติม
                    </span>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      คุณสามารถสมัครแพ็กเกจ Pro Plan++ หรือ Ultra Plan เพื่อรับเหรียญ Trix ประจำเดือนและสิทธิ์สมาชิกผ่านระบบชำระเงินอัตโนมัติได้ทันทีด้านบน
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border border-plottrix-line/30 bg-white/5 opacity-60 flex flex-col justify-between">
                    <div>
                      <div className="text-lg font-bold text-amber-300/80">50 Trix</div>
                      <div className="text-[11px] text-plottrix-muted mb-3">เหมาะสำหรับทดลองเขียน</div>
                    </div>
                    <button
                      type="button"
                      disabled
                      onClick={topupTrix}
                      className="w-full py-2.5 rounded-xl bg-white/5 text-[11px] font-bold text-slate-400 border border-white/10 cursor-not-allowed transition"
                    >
                      ปิดให้บริการชั่วคราว
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-plottrix-line/30 bg-white/5 opacity-60 flex flex-col justify-between">
                    <div>
                      <div className="text-lg font-bold text-amber-300/80">120 Trix</div>
                      <div className="text-[11px] text-plottrix-muted mb-3">+10 Trix โบนัส</div>
                    </div>
                    <button
                      type="button"
                      disabled
                      onClick={topupTrix}
                      className="w-full py-2.5 rounded-xl bg-white/5 text-[11px] font-bold text-slate-400 border border-white/10 cursor-not-allowed transition"
                    >
                      ปิดให้บริการชั่วคราว
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-purple-400/20 bg-purple-950/10 opacity-60 flex flex-col justify-between relative overflow-hidden">
                    <span className="absolute top-0 right-0 bg-purple-600/60 text-[9px] font-bold text-white px-2 py-0.5 rounded-bl-lg">
                      ยอดนิยม
                    </span>
                    <div>
                      <div className="text-lg font-bold text-amber-300/80">260 Trix</div>
                      <div className="text-[11px] text-plottrix-muted mb-3">+40 Trix โบนัส</div>
                    </div>
                    <button
                      type="button"
                      disabled
                      onClick={topupTrix}
                      className="w-full py-2.5 rounded-xl bg-purple-600/30 text-purple-200/60 text-[11px] font-bold border border-purple-500/20 cursor-not-allowed transition"
                    >
                      ปิดให้บริการชั่วคราว
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-plottrix-line/30 bg-white/5 opacity-60 flex flex-col justify-between">
                    <div>
                      <div className="text-lg font-bold text-amber-300/80">450 Trix</div>
                      <div className="text-[11px] text-plottrix-muted mb-3">+100 Trix จุใจ</div>
                    </div>
                    <button
                      type="button"
                      disabled
                      onClick={topupTrix}
                      className="w-full py-2.5 rounded-xl bg-white/5 text-[11px] font-bold text-slate-400 border border-white/10 cursor-not-allowed transition"
                    >
                      ปิดให้บริการชั่วคราว
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
