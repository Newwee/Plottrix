import React from 'react'
import { useApp } from '../../context/AppContext'

export default function FinalCtaSection() {
  const { navigateTo } = useApp()

  return (
    <section className="final-cta">
      <div className="wrap">
        <span className="eyebrow">YOUR STORY. YOUR CONTROL.</span>
        <h2>
          เรื่องราวของคุณ<br />
          <span className="grad">สมควรได้รับพื้นที่ที่เข้าใจ</span>
        </h2>
        <p>
          เริ่มต้นสร้างสรรค์ต้นฉบับในแบบของคุณ พร้อมผู้ช่วยบรรณาธิการที่อยู่เคียงข้าง ไม่ใช่คนที่เขียนแทนคุณ
        </p>
        <button
          className="btn btn-primary btn-hero-glow"
          onClick={() => navigateTo('workspace')}
        >
          ✦ เริ่มต้นใช้งานฟรี 30 Trix <span>→</span>
        </button>
      </div>
    </section>
  )
}
