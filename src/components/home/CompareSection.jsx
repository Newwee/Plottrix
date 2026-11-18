import React from 'react'

export default function CompareSection() {
  return (
    <section className="section compare-section" id="about">
      <div className="wrap compare-grid">
        <div className="section-head" style={{ margin: 0 }}>
          <span className="eyebrow">WRITER IN CONTROL</span>
          <h2>
            AI ทั่วไปแต่งแทน<br />
            แต่ <span className="grad">Plottrix ช่วยขัดเกลา</span>
          </h2>
          <p>
            ความแตกต่างอยู่ที่การวางบทบาท AI เป็นผู้ช่วยบรรณาธิการ ลดปัญหาเนื้อหาใหม่เสียเอกลักษณ์ และช่วยเช็คจุดขัดแย้งระหว่างตอนโดยที่คุณคุมเกมเองทั้งหมด
          </p>
        </div>

        <div className="compare-table">
          <table>
            <thead>
              <tr>
                <th>สิ่งที่นักเขียนต้องการ</th>
                <th>Generic AI</th>
                <th>Plottrix</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ไม่แต่งเนื้อหาแทรกจนเสียเอกลักษณ์</td>
                <td className="no">✕</td>
                <td className="yes">✓</td>
              </tr>
              <tr>
                <td>แก้คำผิด คำพ้องเสียง &amp; ตรวจทั้งตอน (Batch Proofread)</td>
                <td className="partial">บางกรณี</td>
                <td className="yes">✓</td>
              </tr>
              <tr>
                <td>จำบริบทตัวละครและพล็อตย้อนหลัง 15 ตอน</td>
                <td className="partial">ต้องป้อนใหม่</td>
                <td className="yes">✓</td>
              </tr>
              <tr>
                <td>บันทึกโปรไฟล์สำนวน (Style Persona 3 โปรไฟล์)</td>
                <td className="no">✕</td>
                <td className="yes">✓</td>
              </tr>
              <tr>
                <td>Export ลง ReadAWrite, Dek-D และทำ E-Book</td>
                <td className="no">✕</td>
                <td className="yes">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
