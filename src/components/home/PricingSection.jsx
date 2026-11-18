import React from 'react'
import { useApp } from '../../context/AppContext'
import PricingCards from './PricingCards'

export default function PricingSection() {
  const { plan, upgradePlanPrototype } = useApp()

  return (
    <section className="section pricing py-20 px-4 sm:px-6 relative" id="pricing">
      <div className="wrap max-w-6xl mx-auto">
        <div className="section-head text-center max-w-2xl mx-auto mb-14">
          <span className="eyebrow text-xs font-bold text-purple-400 tracking-widest uppercase block mb-2">
            PLANS &amp; PRICING
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            เลือกแผนที่เหมาะกับ <span className="grad bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-400 bg-clip-text text-transparent">ระดับการเขียนของคุณ</span>
          </h2>
          <p className="text-sm text-plottrix-muted leading-relaxed">
            เริ่มต้นใช้งานฟรีได้ทันที ไม่ต้องใส่ข้อมูลบัตรเครดิต สามารถอัปเกรดหรือเติมเหรียญเพิ่มได้ทุกเมื่อตามปริมาณงานเขียนของคุณ
          </p>
        </div>

        <PricingCards
          currentPlan={plan}
          onSelectPlan={(planName) => upgradePlanPrototype(planName)}
        />

        <div className="pricing-footnote text-center text-xs text-plottrix-muted mt-10">
          Trix Top-Up เติมเหรียญแยกได้ทุกเมื่อสำหรับผู้ใช้ทุกแผน (ไม่มีวันหมดอายุ): 59 บาท (60 Trix) · 149 บาท (180 Trix) · 299 บาท (400 Trix)
        </div>
      </div>
    </section>
  )
}
