import React, { useState } from 'react'

const BRANCH_DATA = {
  1: ['01 · ตามหาผู้ส่งจดหมาย (ย่อหน้าเกริ่นนำ)', 'เธอสังเกตตราประทับที่มุมซองและตัดสินใจออกตามหาเจ้าของ ก่อนที่เบาะแสเพียงชิ้นเดียวจะหายไป'],
  2: ['02 · ปกปิดเรื่องนี้ไว้ (ย่อหน้าเกริ่นนำ)', 'เธอเก็บจดหมายกลับเข้าซองและเลือกเก็บความลับนี้ไว้ก่อน แต่การตัดสินใจนั้นอาจส่งผลต่อความไว้ใจในภายหลัง'],
  3: ['03 · เผชิญหน้ากับความจริง (ย่อหน้าเกริ่นนำ)', 'เธอเดินตรงไปยังคนที่น่าจะรู้เรื่องนี้มากที่สุด และถามถึงข้อความที่ถูกซ่อนไว้ในจดหมาย']
}

export default function PlotBranchSection() {
  const [activeBranch, setActiveBranch] = useState(1)

  const current = BRANCH_DATA[activeBranch]

  return (
    <section className="section">
      <div className="wrap branch">
        <div className="branch-copy">
          <span className="eyebrow">INTERACTIVE PLOT BRANCHING</span>
          <h2>
            เสนอทางเลือกพล็อต<br />
            <span className="grad">พร้อมย่อหน้าเกริ่นนำ</span>
          </h2>
          <p>
            เมื่อเรื่องราวมาถึงจุดสำคัญ Plottrix ช่วยเสนอทางเลือกพล็อตตอนต่อไปเพื่อจุดประกายไอเดีย พร้อมย่อหน้าเกริ่นนำให้คุณนำไปเขียนต่อด้วยตนเอง
          </p>
        </div>

        <div className="branch-demo">
          <div className="demo-label">ตัวเลือกเส้นเรื่อง (5 Trix / ครั้ง) · ตัวละครพบจดหมายปริศนา</div>
          <div className="branch-start">เธอเปิดซองจดหมาย และพบข้อความที่ไม่คาดคิด</div>
          <div className="branch-choices">
            <button
              className={`branch-choice ${activeBranch === 1 ? 'active' : ''}`}
              onClick={() => setActiveBranch(1)}
            >
              <b>เส้นทาง 01</b> ตามหาผู้ส่งจดหมาย
            </button>
            <button
              className={`branch-choice ${activeBranch === 2 ? 'active' : ''}`}
              onClick={() => setActiveBranch(2)}
            >
              <b>เส้นทาง 02</b> ปกปิดเรื่องนี้ไว้
            </button>
            <button
              className={`branch-choice ${activeBranch === 3 ? 'active' : ''}`}
              onClick={() => setActiveBranch(3)}
            >
              <b>เส้นทาง 03</b> เผชิญหน้ากับความจริง
            </button>
          </div>
          <div className="branch-output" id="branchOutput">
            <strong>{current[0]}</strong> {current[1]}
          </div>
        </div>
      </div>
    </section>
  )
}
