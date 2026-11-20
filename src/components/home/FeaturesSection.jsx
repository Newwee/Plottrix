import React from 'react'
import AnimatedList from '../react-bits/AnimatedList'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiEditingIcon,
  SparklesIcon,
  AiBrain01Icon,
  GitBranchIcon
} from '@hugeicons/core-free-icons'

const FEATURE_ITEMS = [
  {
    id: 'proofread',
    icon: <HugeiconsIcon icon={AiEditingIcon} size={20} strokeWidth={1.8} />,
    title: 'Thai Editorial & Grammar Engine',
    description: 'ตรวจจับคำผิด คำพ้องเสียง (น่า/หน้า, ผูก/ผูกมัด) เกลาวรรคตอน และตรวจความสละสลวยของประโยคตามบริบทภาษาไทย',
    meta: 'Realtime NLP'
  },
  {
    id: 'style',
    icon: <HugeiconsIcon icon={SparklesIcon} size={20} strokeWidth={1.8} />,
    title: 'Style Persona & Voice Lock',
    description: 'จดจำและล็อกสไตล์การเขียนเฉพาะตัว (ได้ถึง 3 โปรไฟล์) ไม่ว่าจะเป็นแนวพีเรียด กำลังภายใน หรือไซไฟ ให้ AI เกลาโดยไม่เปลี่ยนเสียงของคุณ',
    meta: 'Tone Guardian'
  },
  {
    id: 'memory',
    icon: <HugeiconsIcon icon={AiBrain01Icon} size={20} strokeWidth={1.8} />,
    title: 'Story Bible & 15+ Chapters Deep Memory',
    description: 'คลังความจำอัจฉริยะ จดจำปม ประวัติตัวละคร และความสัมพันธ์ย้อนหลังกว่า 15 บท ช่วยเตือนทันทีหากมีจุดขัดแย้งกับบทก่อนหน้า',
    meta: 'Deep Memory'
  },
  {
    id: 'branch',
    icon: <HugeiconsIcon icon={GitBranchIcon} size={20} strokeWidth={1.8} />,
    title: 'Smart Branching & Plot Experimenter',
    description: 'ทดลองแตกเส้นเรื่อง 3 ทางเลือกเมื่อคิดพล็อตไม่ออก พร้อมย่อหน้าเกริ่นนำเพื่อจุดประกายและส่งต่อจินตนาการให้นักเขียนนำไปต่อยอดเอง',
    meta: 'Multi-Branch'
  }
]

export default function FeaturesSection() {
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

        {/* Core Capabilities Interactive Feed powered by React Bits AnimatedList */}
        <div className="features-animated-list-wrap">
          <div className="features-list-header">
            <div className="features-list-badge">✦ CORE CAPABILITIES</div>
            <h3>ฟีเจอร์เด่นที่ขับเคลื่อนด้วยระบบอัจฉริยะ</h3>
          </div>

          <AnimatedList
            items={FEATURE_ITEMS}
            animation="pop"
            theme="dark"
            width="100%"
            maxHeight={520}
            gap={10}
            radius={14}
            accentColor="#c29aff"
          />
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
