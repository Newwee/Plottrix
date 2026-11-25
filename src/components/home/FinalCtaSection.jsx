import React from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

export default function FinalCtaSection() {
  const { navigateTo, setActiveModal } = useApp()
  const { user } = useAuth()

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
          onClick={() => (user ? navigateTo('workspace_home') : setActiveModal('auth'))}
        >
          ✦ {user ? 'เข้าสู่สตูดิโองานเขียน' : 'เข้าสู่ระบบ / สมัครรับฟรี 30 Trix'} <span>→</span>
        </button>
      </div>
    </section>
  )
}
