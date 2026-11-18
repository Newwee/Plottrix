import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'

const HOTSPOT_DATA = {
  editor: [
    'Distraction-free Editor & Export',
    'นำเข้าไฟล์งานเขียนเดิม เขียนต้นฉบับเป็นตอน พร้อมระบบประวัติแก้ไข 30 วัน และส่งออก ReadAWrite / Dek-D'
  ],
  notes: [
    'Character & Lore Bible',
    'จดข้อมูลตัวละคร ความสัมพันธ์ และโลกนิยายไม่จำกัด เพื่อให้ AI อ้างอิงความต่อเนื่องย้อนหลัง 15 ตอน'
  ],
  assistant: [
    'Style Persona & Custom Dictionary',
    'บันทึกโปรไฟล์สำนวนสูงสุด 3 โปรไฟล์ พร้อมคลังคำศัพท์เฉพาะตัวละครและคลังคำศัพท์นิยายฟรีทุกแพลน'
  ]
}

export default function WorkspaceShowcaseSection() {
  const { navigateTo, addToast } = useApp()
  const [activeHotspot, setActiveHotspot] = useState('editor')

  const currentData = HOTSPOT_DATA[activeHotspot]

  return (
    <section className="section showcase" id="workspace">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">WORKSPACE PREVIEW</span>
          <h2>
            พื้นที่เขียนและ <span className="grad">สตูดิโอบรรณาธิการ</span> ในหน้าเดียว
          </h2>
          <p>
            ไม่ต้องสลับโปรแกรมไปมาระหว่างโปรแกรมพิมพ์งานและแชต AI เพราะ Plottrix รวมทุกอย่างไว้ในที่เดียว ทั้งโครงเรื่อง ตัวละคร และคลังคำศัพท์
          </p>
        </div>

        {/* Hotspot Switchers */}
        <div className="hotspot-strip">
          <button
            className={`hotspot-btn ${activeHotspot === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveHotspot('editor')}
          >
            <span>▤</span> Distraction-free Editor
          </button>
          <button
            className={`hotspot-btn ${activeHotspot === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveHotspot('notes')}
          >
            <span>♙</span> Character &amp; Lore Bible
          </button>
          <button
            className={`hotspot-btn ${activeHotspot === 'assistant' ? 'active' : ''}`}
            onClick={() => setActiveHotspot('assistant')}
          >
            <span>✧</span> Style Persona &amp; Dictionary
          </button>
          <button
            className="hotspot-btn hotspot-btn--primary"
            onClick={() => navigateTo('workspace')}
          >
            <span>✦</span> เข้าสู่เวิร์กสเปซเต็มจอ →
          </button>
        </div>

        {/* Workspace Interactive Mock Window */}
        <div className="workspace-demo">
          <div className="workspace-toolbar">
            <span className="toolbar-brand">
              ✦ Plottrix Workspace · ลองชี้เมาส์ที่ปุ่มเครื่องมือในหน้ากระดาษ
            </span>
            <div className="toolbar-actions">
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-400/30">Pro Workspace</span>
            </div>
          </div>

          <div className="workspace-inner">
            {/* Left Rail */}
            <aside className="workspace-rail">
              <div className="rail-item active">▤ ต้นฉบับ</div>
              <div className="rail-item">♙ ตัวละคร &amp; Lore</div>
              <div className="rail-item">⌘ พล็อตเรื่อง</div>
              <div className="rail-item">▧ คลังคำศัพท์นิยาย</div>
              <div className="rail-item">✧ Style Persona</div>
            </aside>

            {/* Paper Area */}
            <div className="workspace-paper">
              <div className="paper-overline">CHAPTER 04 · THE RAIN</div>
              <div className="paper-title">เงาในสายฝน</div>
              <p className="paper-p">
                เสียงฝนตกกระทบหลังคาไม้เก่าอย่างต่อเนื่อง เธอเดินผ่านประตูบานนั้นอีกครั้ง{' '}
                <span className="paper-highlight">ภาพความทรงจำเริ่มย้อนกลับมา</span> อย่างช้า ๆ พร้อมกับเสียงเรียกชื่อที่คุ้นเคย...
              </p>

              {/* Inline Toolbar */}
              <div className="inline-toolbar">
                <button
                  type="button"
                  title="แก้คำผิด & คำพ้องเสียง (1 Trix)"
                  onClick={() => addToast({ title: 'ตรวจคำผิด (1 Trix)', message: 'ระบบตรวจพบคำว่า “ช้าๆ” ควรเว้นวรรคเป็น “ช้า ๆ”', type: 'info' })}
                >
                  ✎
                </button>
                <button
                  type="button"
                  title="เกลาสำนวนตาม Style Persona (1 Trix)"
                  onClick={() => addToast({ title: 'เกลาสำนวน (1 Trix)', message: 'แนะนำสำนวน: “ความทรงจำเริ่มแจ่มชัดขึ้นทีละน้อย”', type: 'success' })}
                >
                  ✦
                </button>
                <button
                  type="button"
                  title="แปลภาษาคงบริบทตัวละคร (3 Trix)"
                  onClick={() => addToast({ title: 'แปลวรรณกรรม (3 Trix)', message: 'แปลเป็นอังกฤษคงน้ำเสียงตัวละครเสร็จแล้ว', type: 'info' })}
                >
                  文
                </button>
                <button
                  type="button"
                  title="ตัวเลือกเส้นเรื่อง 3 ทาง (5 Trix)"
                  onClick={() => addToast({ title: 'แตกกิ่งพล็อต (5 Trix)', message: 'สร้าง 3 ทางเลือกดำเนินเรื่องต่อพร้อมย่อหน้าเกริ่นนำ', type: 'info' })}
                >
                  ⑂
                </button>
              </div>

              <p className="paper-p">
                เธอหยุดยืน ไม่แน่ใจว่าควรเดินหน้าต่อ หรือหันกลับไปเผชิญหน้ากับอดีต
              </p>
            </div>

            {/* Right Editorial Assistant */}
            <aside className="workspace-ai">
              <div className="ai-box-title">✦ EDITORIAL ASSISTANT</div>
              <div className="ai-suggestion">
                <b>คำแนะนำการเขียน</b>
                <small>ประโยคนี้อาจเพิ่มรายละเอียดทางประสาทสัมผัสเพื่อสร้างบรรยากาศได้</small>
              </div>
              <div className="ai-suggestion">
                <b>เช็คจุดต่างเนื้อเรื่อง</b>
                <small className="good">✓ ชื่อตัวละครตรงกับ Custom Dictionary</small>
              </div>
              <div className="ai-suggestion">
                <b>ตัวเลือกเส้นเรื่อง</b>
                <small>มี 3 แนวทางพร้อมย่อหน้าเกริ่นนำ</small>
              </div>
            </aside>
          </div>

          {/* Hotspot detail */}
          <div className="hotspot-detail" id="hotspotDetail">
            <strong>{currentData[0]}</strong> — {currentData[1]}
          </div>
        </div>
      </div>
    </section>
  )
}
