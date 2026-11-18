import React from 'react'
import PixelCard from '../react-bits/PixelCard'
import CountUp from '../react-bits/CountUp'

export const PRICING_PLANS = [
  {
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
      'Batch Proofread ตรวจทั้งตอน (3 Trix) & Custom Dictionary',
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
      'วิเคราะห์พล็อตทั้งเล่ม (ฟรี 10 ครั้ง/เดือน เกินคิด 15 Trix/ครั้ง)',
      'แปลภาษาทั้งตอนโดยคงบริบทตัวละคร',
      'จัดหน้าและส่งออกไฟล์ E-Book (EPUB / PDF)',
      'เข้าถึงโมเดล Gemini 4 Hydrogen เร็วพิเศษ'
    ],
    buttonText: 'เลือก Ultra Plan',
    isPrimary: false,
    badge: null,
    pixelColors: ['#fef3c7', '#fde047', '#ca8a04'],
    glowHex: '#eab308'
  }
]

export default function PricingCards({ currentPlan = 'Free Plan', onSelectPlan }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto items-stretch">
      {PRICING_PLANS.map((planItem) => {
        const isCurrent = currentPlan === planItem.name
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
            {/* Best Value Badge: width fit-content, not stretched, positioned cleanly above plan title */}
            {planItem.badge && (
              <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md border border-purple-300/30 w-fit">
                {planItem.badge}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h3 className="plan-name text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {planItem.name}
                </h3>
                {isCurrent && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    แผนปัจจุบัน
                  </span>
                )}
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

              <div className="plan-trix-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-400/25 text-purple-200 mb-4">
                {planItem.trixBadge}
              </div>

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

            <div className="mt-auto pt-4">
              <button
                type="button"
                onClick={() => onSelectPlan && onSelectPlan(planItem.name)}
                disabled={isCurrent}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md ${
                  isCurrent
                    ? 'bg-white/10 text-plottrix-muted cursor-default'
                    : planItem.isPrimary
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white shadow-purple-600/30'
                    : 'bg-white/5 hover:bg-purple-600/20 text-white border border-white/15 hover:border-purple-400/40'
                }`}
              >
                {isCurrent ? 'กำลังใช้งานแผนนี้' : planItem.buttonText}
              </button>
            </div>
          </PixelCard>
        )
      })}
    </div>
  )
}
