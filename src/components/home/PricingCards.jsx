import React from 'react'
import PixelCard from '../react-bits/PixelCard'
import CountUp from '../react-bits/CountUp'
import { useApp } from '../../context/AppContext'
import { getTierInfo } from '../../lib/subscription'

export const PRICING_PLANS = [
  {
    tierId: 'free',
    name: 'Free Plan',
    sub: 'สำหรับทดลองเขียน & นิยายสั้น',
    priceNum: 0,
    priceStr: '฿0',
    cycle: '/ ตลอดชีพ',
    trixBadge: '✦ 30 Trix แรกเข้า + 3 Trix/วัน',
    trixCount: 30,
    desc: 'เครื่องมือพื้นฐานครบครันสำหรับเริ่มเขียนนิยายเรื่องแรก',
    features: [
      'สร้างนิยายได้ 1 เรื่อง สูงสุด 5 ตอน',
      'แก้คำผิด & เช็คคำพ้องเสียง (1 Trix / ครั้ง)',
      'เกลาสำนวนประโยคตามบริบท (1 Trix / ครั้ง)',
      'คลังคำศัพท์นิยายเปิดใช้ฟรีทุกแพลน',
      'ระบบบันทึกงานเขียนอัตโนมัติบนคลาวด์'
    ],
    buttonText: 'เริ่มต้นใช้งานฟรี',
    isPrimary: false,
    badge: null,
    pixelColors: ['#cbd5e1', '#94a3b8', '#64748b'],
    glowHex: '#94a3b8'
  },
  {
    tierId: 'pro',
    name: 'Pro Plan++',
    sub: 'แผนยอดนิยมสำหรับนักเขียนนิยายยาว',
    priceNum: 249,
    priceStr: '฿249',
    cycle: '/ เดือน',
    trixBadge: '✦ รับ 400 Trix / เดือน',
    trixCount: 400,
    desc: 'ปลดล็อกผู้ช่วยบรรณาธิการและระบบจำบริบทข้ามตอนเต็มรูปแบบ',
    features: [
      'สร้างนิยายและตอนไม่จำกัด + AI จำบริบท 15 ตอน',
      'Character & Lore Bible ไม่จำกัดตัวละคร',
      'Style Persona บันทึกโปรไฟล์สำนวนได้ 3 โปรไฟล์',
      'Batch Proofread ตรวจทั้งตอน & Custom Dictionary',
      'ประวัติการแก้ไข (Version History) ย้อนหลัง 30 วัน',
      'ลดระยะเวลา Cooldown เหลือเพียง 2 วินาที'
    ],
    buttonText: 'เลือก Pro Plan++ →',
    isPrimary: true,
    badge: '⭐ ยอดนิยม - Best Value',
    pixelColors: ['#f3e8ff', '#c084fc', '#9333ea'],
    glowHex: '#a855f7'
  },
  {
    tierId: 'ultra',
    name: 'Ultra Plan',
    sub: 'สำหรับนักเขียนมืออาชีพ & ทำ E-Book',
    priceNum: 599,
    priceStr: '฿599',
    cycle: '/ เดือน',
    trixBadge: '✦ รับ 1,000 Trix / เดือน',
    trixCount: 1000,
    desc: 'ได้สิทธิ์ทั้งหมดของ Pro Plan++ พร้อมเครื่องมือระดับมืออาชีพ',
    features: [
      'ได้สิทธิ์ทั้งหมดของ Pro Plan++ ครบถ้วน',
      'วิเคราะห์พล็อตทั้งเล่ม (ฟรี 10 ครั้ง/เดือน)',
      'แปลภาษาทั้งตอนโดยคงบริบทตัวละคร',
      'จัดหน้าและส่งออกไฟล์ E-Book (EPUB / PDF)',
      'เข้าถึงโมเดล Gemini Flash ความเร็วสูงพิเศษ'
    ],
    Overwrite: true,
    buttonText: 'เลือก Ultra Plan',
    isPrimary: false,
    badge: null,
    pixelColors: ['#fef3c7', '#fde047', '#ca8a04'],
    glowHex: '#eab308'
  }
]

export default function PricingCards({ currentPlan: propPlan, onSelectPlan }) {
  const {
    plan: contextPlan,
    planTier: contextPlanTier,
    trialUsed,
    trialCountdown,
    activateProTrial,
    changePlan
  } = useApp()

  const activePlan = propPlan || contextPlan || 'Free Plan'
  const activeTier = getTierInfo(contextPlanTier || activePlan)
  const isProTrial = activeTier.id === 'pro_trial'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto items-stretch">
      {PRICING_PLANS.map((planItem) => {
        const itemTier = getTierInfo(planItem.tierId)
        
        // Exact state calculation
        const isCurrentActive = isProTrial
          ? planItem.tierId === 'pro'
          : activeTier.id === itemTier.id

        // Strict No-Downgrade calculation
        const isLowerTier = activeTier.rank > itemTier.rank

        return (
          <PixelCard
            key={planItem.name}
            className={`price-card relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl transition-all duration-300 ${
              planItem.isPrimary
                ? 'featured border border-purple-500/50 shadow-[0_12px_40px_rgba(147,51,234,0.28)] ring-1 ring-purple-400/40 bg-gradient-to-b from-[#2a1745] to-[#140d24]'
                : 'border border-plottrix-line/40 bg-plottrix-panel2/60 hover:border-purple-400/30'
            }`}
            colors={planItem.pixelColors}
            glowHex={planItem.glowHex}
          >
            {/* Badges */}
            <div className="flex items-center justify-between mb-3 min-h-[26px]">
              {planItem.badge && !isProTrial && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md border border-purple-300/30">
                  {planItem.badge}
                </div>
              )}
              {isProTrial && planItem.tierId === 'pro' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-amber-200 bg-amber-500/20 border border-amber-400/40 animate-pulse">
                  <span>⏱️</span>
                  <span>ช่วงทดลองใช้ Pro 3 วัน</span>
                </div>
              )}
              {isCurrentActive && !isProTrial && (
                <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  แผนปัจจุบัน
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="plan-name text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {planItem.name}
                </h3>
              </div>

              <div className="plan-sub text-xs text-plottrix-muted mt-1 mb-4">
                {planItem.sub}
              </div>

              <div className="plan-price flex items-baseline gap-1 text-3xl sm:text-4xl font-extrabold text-white mb-2">
                <span>
                  {planItem.priceNum === 0 ? '฿0' : (
                    <>
                      <span>฿</span>
                      <CountUp to={planItem.priceNum} duration={1000} />
                    </>
                  )}
                </span>
                <span className="text-xs text-plottrix-muted font-normal">
                  {planItem.cycle}
                </span>
              </div>

              <div className="plan-trix-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-400/30 text-amber-200 mb-4">
                <img src="/Logo/TrixCoinLogo.png" alt="Trix Coin" className="w-4 h-4 object-contain inline-block" />
                <span>{planItem.trixBadge}</span>
              </div>

              {/* Live Trial Countdown Box for Pro Plan card when in trial */}
              {isProTrial && planItem.tierId === 'pro' && (
                <div className="mb-4 p-3 rounded-xl bg-purple-500/20 border border-purple-400/40 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-purple-300 font-bold mb-0.5 flex items-center justify-center gap-1">
                    <span>⏱️</span>
                    <span>เหลือเวลาทดลองใช้ Pro ฟรี</span>
                  </div>
                  <div className="text-sm font-extrabold text-white tracking-wide text-amber-300">
                    {trialCountdown || 'กำลังคำนวณ...'}
                  </div>
                </div>
              )}

              <p className="plan-desc text-xs text-plottrix-text/80 mb-5 leading-relaxed">
                {planItem.desc}
              </p>

              <div className="border-t border-white/10 my-4" />

              <ul className="plan-list space-y-2.5 text-xs text-plottrix-text/90 mb-6">
                {planItem.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto pt-4 space-y-1.5">
              {/* Card Action Buttons with Production Business Logic */}
              {(() => {
                // Case 1: Currently active plan
                if (isCurrentActive) {
                  if (isProTrial) {
                    return (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-purple-500/20 text-purple-200 border border-purple-400/40 cursor-default shadow-sm"
                      >
                        ✓ กำลังทดลองใช้ Pro ({trialCountdown || '3 วัน'})
                      </button>
                    )
                  }
                  return (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white/10 text-plottrix-muted cursor-default border border-white/5"
                    >
                      กำลังใช้งานแผนนี้
                    </button>
                  )
                }

                // Case 2: Lower tier (Strict No-Downgrade Rule)
                if (isLowerTier) {
                  return (
                    <div>
                      <button
                        type="button"
                        disabled
                        className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-black/40 text-rose-300/80 border border-rose-500/30 cursor-not-allowed opacity-60"
                        title="ไม่สามารถลดระดับแพลนได้ตามนโยบายระบบ (Strict No-Downgrade Policy)"
                      >
                        🔒 ไม่สามารถลดระดับแพลนได้
                      </button>
                      <div className="text-[10px] text-center text-slate-400 mt-1">
                        ระบบไม่อนุญาตให้ลดระดับลงสู่แผนที่ต่ำกว่า
                      </div>
                    </div>
                  )
                }

                // Case 3: Pro Plan for Free-tier users
                if (planItem.tierId === 'pro' && activeTier.id === 'free') {
                  if (!trialUsed) {
                    return (
                      <div>
                        <button
                          type="button"
                          onClick={() => activateProTrial()}
                          className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-purple-500 via-indigo-500 to-fuchsia-500 hover:brightness-110 text-white shadow-lg shadow-purple-600/40 border border-purple-300/50 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>⚡</span>
                          <span>ทดลองใช้ Pro ฟรี 3 วัน</span>
                        </button>
                        <div className="text-[10px] text-center text-purple-300 mt-1.5 font-medium">
                          ✦ สิทธิ์ทดลองใช้ 72 ชม. (1 บัญชี / 1 ครั้ง ไม่ต้องใส่บัตร)
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <div>
                        <button
                          type="button"
                          onClick={() => changePlan('pro')}
                          disabled
                          className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white/5 text-slate-400 border border-white/10 cursor-not-allowed opacity-70"
                        >
                          ระบบชำระเงินกำลังเปิดให้บริการเร็วๆ นี้
                        </button>
                        <div className="text-[10px] text-center text-amber-400/90 mt-1">
                          คุณใช้สิทธิ์ทดลองใช้ 3 วันไปแล้ว (รอเปิดตัว Payment Gateway)
                        </div>
                      </div>
                    )
                  }
                }

                // Case 4: Ultra Plan (Paid - Coming soon)
                if (planItem.tierId === 'ultra') {
                  return (
                    <div>
                      <button
                        type="button"
                        onClick={() => changePlan('ultra')}
                        disabled
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white/5 text-amber-200/80 border border-amber-400/20 cursor-not-allowed opacity-75 flex items-center justify-center gap-1.5"
                      >
                        <span>🔒</span>
                        <span>ระบบชำระเงินเปิดบริการเร็วๆ นี้</span>
                      </button>
                      <div className="text-[10px] text-center text-slate-400 mt-1">
                        กำลังเชื่อมต่อ Payment Gateway เพื่อรับชำระเงินจริง
                      </div>
                    </div>
                  )
                }

                // Fallback
                return (
                  <button
                    type="button"
                    onClick={() => onSelectPlan ? onSelectPlan(planItem.name) : changePlan(planItem.name)}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white/5 hover:bg-purple-600/20 text-white border border-white/15"
                  >
                    {planItem.buttonText}
                  </button>
                )
              })()}
            </div>
          </PixelCard>
        )
      })}
    </div>
  )
}
