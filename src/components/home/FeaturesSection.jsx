import React, { useState } from 'react'

const FEATURES = [
  {
    id: 'proofread',
    icon: '✎',
    title: 'Thai Editorial & Grammar Engine',
    badge: 'Realtime NLP',
    desc: 'ตรวจจับคำผิด คำพ้องเสียง (น่า/หน้า, ผูก/ผูกมัด) เกลาวรรคตอน และตรวจความสละสลวยของประโยคตามบริบทภาษาไทย',
    tag: 'ความแม่นยำภาษาไทย 99%'
  },
  {
    id: 'style',
    icon: '✧',
    title: 'Style Persona & Voice Lock',
    badge: 'Tone Guardian',
    desc: 'จดจำและล็อกสไตล์การเขียนเฉพาะตัว (ได้ถึง 3 โปรไฟล์) ไม่ว่าจะเป็นแนวพีเรียด กำลังภายใน หรือไซไฟ ให้ AI เกลาโดยไม่เปลี่ยนเสียงของคุณ',
    tag: 'คงเอกลักษณ์นักเขียน 100%'
  },
  {
    id: 'memory',
    icon: '⌘',
    title: 'Story Bible & 15+ Chapters Deep Memory',
    badge: 'Deep Memory',
    desc: 'คลังความจำอัจฉริยะ จดจำปม ประวัติตัวละคร และความสัมพันธ์ย้อนหลังกว่า 15 บท ช่วยเตือนทันทีหากมีจุดขัดแย้งกับบทก่อนหน้า',
    tag: 'เช็คความต่อเนื่องข้ามบท'
  },
  {
    id: 'branch',
    icon: '⑂',
    title: 'Smart Branching & Plot Experimenter',
    badge: 'Multi-Branch',
    desc: 'ทดลองแตกเส้นเรื่อง 3 ทางเลือกเมื่อคิดพล็อตไม่ออก พร้อมย่อหน้าเกริ่นนำเพื่อจุดประกายและส่งต่อจินตนาการให้นักเขียนนำไปต่อยอดเอง',
    tag: 'จุดประกายไอเดียพล็อต'
  }
]

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState('proofread')

  return (
    <section className="section why" id="features">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">WHY PLOTTRIX INTELLIGENCE</span>
          <h2>
            AI ควรเป็น <span className="grad">ผู้ช่วยบรรณาธิการ</span><br />
            ไม่ใช่คนแย่งแต่งนิยาย
          </h2>
          <p>
            Plottrix ถูกออกแบบโดยยึดนักเขียนเป็นศูนย์กลาง ทุกคำแนะนำมีไว้เพื่อช่วยให้ต้นฉบับสมบูรณ์ขึ้น โดยที่คุณยังคงเป็นเจ้าของไอเดียและลงมือเขียนเอง 100%
          </p>
        </div>

        {/* Core Capabilities Interactive Feed */}
        <div className="features-animated-list-wrap">
          <div className="features-list-header">
            <div className="features-list-badge">✦ CORE CAPABILITIES</div>
            <h3>ฟีเจอร์เด่นที่ขับเคลื่อนด้วยระบบอัจฉริยะ</h3>
          </div>

          <div className="animated-list-container">
            {FEATURES.map((feat) => {
              const isActive = activeFeature === feat.id
              return (
                <div
                  key={feat.id}
                  className={`animated-list-item cursor-pointer transition ${isActive ? 'is-active' : ''}`}
                  onMouseEnter={() => setActiveFeature(feat.id)}
                  onClick={() => setActiveFeature(feat.id)}
                >
                  <div className="animated-list-icon">{feat.icon}</div>
                  <div className="animated-list-body">
                    <div className="animated-list-title-row">
                      <span className="animated-list-title">{feat.title}</span>
                      <span className="animated-list-badge">{feat.badge}</span>
                    </div>
                    <p className="animated-list-desc">{feat.desc}</p>
                    <span className="animated-list-tag">{feat.tag}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 3 Pillar Cards */}
        <div className="pillars-grid" style={{ marginTop: '56px' }}>
          <article className="pillar-card pixel-card">
            <div className="pillar-num">01</div>
            <h3>คงความเป็นเจ้าของเรื่อง 100%</h3>
            <p>
              AI จะไม่เขียนแทรกหรือเปลี่ยนโครงเรื่องของคุณตามใจ ทุกข้อความที่แนะนำต้องผ่านการกดยืนยันจากคุณเสมอ
            </p>
          </article>

          <article className="pillar-card pixel-card">
            <div className="pillar-num">02</div>
            <h3>คุมโทนนิยายด้วย Style Persona</h3>
            <p>
              กำหนดน้ำเสียง ความเป็นทางการ หรือแนวทางวรรณศิลป์เฉพาะของนิยายแต่ละเรื่อง เพื่อให้ AI ช่วยเกลาสำนวนได้ตรงใจ
            </p>
          </article>

          <article className="pillar-card pixel-card">
            <div className="pillar-num">03</div>
            <h3>ไม่ลืมรายละเอียดในอดีต</h3>
            <p>
              ด้วย Story Bible และระบบจำบริบท AI จะช่วยเตือนเมื่อสีตาตัวละครเปลี่ยน หรือปมที่เคยทิ้งไว้เมื่อ 10 ตอนก่อนไม่ตรงกัน
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
