import React, { useState } from 'react'

const ACTION_DATA = {
  proof: 'พบจุดที่อาจปรับได้: ตรวจสอบคำพ้องเสียงและวรรคตอน “ช้าๆ” → “ช้า ๆ” และสามารถปรับจังหวะประโยคให้กระชับขึ้น — คุณเลือกนำไปใช้หรือไม่ก็ได้',
  word: '[Style Persona: ดราม่าลึกลับ] แนะนำสำนวน: “แสงไฟดวงสุดท้ายค่อย ๆ วูบไหวราวกับกำลังจะดับลง” โดยยังคงน้ำเสียงตัวเอกเดิมไว้ครบถ้วน',
  translate: 'ตัวอย่างคำแปล: “He turned back to gaze at the slowly dimming light before stepping onward into the dark.” — คงบริบทตัวละครและโทนฉากเดิม',
  plot: 'ตัวเลือกเส้นเรื่อง + ย่อหน้าเกริ่นนำ: 1) แสงไฟดับพรึ่บเผยเงาปริศนา 2) เขาหยิบไฟแช็กขึ้นมาจุดแทน 3) เสียงฝีเท้าดังขึ้นจากด้านหลัง',
  tone: '✓ เช็คจุดต่างเนื้อเรื่อง: สอดคล้องกับฉากที่ตัวละครสูญเสียการมองเห็นในตอนที่ 2 และตรงตามข้อมูลใน Character & Lore Bible',
  summary: 'คำศัพท์แนะนำจากคลังคำศัพท์นิยาย (เปิดใช้ฟรีทุกแพลน): สลัวราง, เลือนราง, อึมครึม, วูบไหว, เงาทะมึน'
}

export default function InteractiveDemoSection() {
  const [activeAction, setActiveAction] = useState('proof')

  return (
    <section className="section action-section">
      <div className="wrap action-grid">
        <div className="action-copy">
          <span className="eyebrow">HIGHLIGHT-TO-ACTION</span>
          <h2>
            คลุมดำข้อความ<br />
            แล้วเรียกใช้คำสั่ง <span className="grad">ได้ทันที</span>
          </h2>
          <p>
            ไม่ต้องเปิดแชตใหม่หรือคัดลอกข้อความไปมา เพียงคลุมดำส่วนที่ต้องการ แถบคำสั่งอัจฉริยะจะพร้อมทำงานตามอัตราการใช้เหรียญที่โปร่งใส
          </p>
          <p className="muted" style={{ fontSize: '11px' }}>
            ลองเลือกคำสั่งด้านขวาเพื่อดูตัวอย่างการทำงาน
          </p>
        </div>

        <div className="action-demo">
          <div className="demo-label">ตัวอย่างข้อความที่คลุมดำในต้นฉบับ</div>
          <div className="selected-text">
            “เขาหันหลังกลับไปมอง <mark>แสงไฟที่ริบหรี่ลงอย่างช้าๆ</mark> ก่อนจะก้าวเดินต่อไปในความมืด”
          </div>
          <div className="action-menu">
            <button
              className={activeAction === 'proof' ? 'active' : ''}
              onClick={() => setActiveAction('proof')}
            >
              ✎ แก้คำผิด/พ้องเสียง (1 Trix)
            </button>
            <button
              className={activeAction === 'word' ? 'active' : ''}
              onClick={() => setActiveAction('word')}
            >
              ✦ เกลาสำนวน (1 Trix)
            </button>
            <button
              className={activeAction === 'translate' ? 'active' : ''}
              onClick={() => setActiveAction('translate')}
            >
              文 แปลภาษาคงบริบท (3 Trix)
            </button>
            <button
              className={activeAction === 'plot' ? 'active' : ''}
              onClick={() => setActiveAction('plot')}
            >
              ⑂ ตัวเลือกเส้นเรื่อง (5 Trix)
            </button>
            <button
              className={activeAction === 'tone' ? 'active' : ''}
              onClick={() => setActiveAction('tone')}
            >
              ◈ เช็คจุดต่างเนื้อเรื่อง (3 Trix)
            </button>
            <button
              className={activeAction === 'summary' ? 'active' : ''}
              onClick={() => setActiveAction('summary')}
            >
              ☷ คลังคำศัพท์นิยาย (ฟรี)
            </button>
          </div>
          <div className="action-result" id="actionResult">
            {ACTION_DATA[activeAction]}
          </div>
        </div>
      </div>
    </section>
  )
}
