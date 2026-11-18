import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function TranslationSection() {
  const { addToast } = useApp()
  const [isReversed, setIsReversed] = useState(false)

  const handleToggle = () => {
    setIsReversed(!isReversed)
    addToast({
      title: 'สลับภาษา',
      message: !isReversed ? 'สลับเป็น English → Thai' : 'สลับเป็น Thai → English',
      type: 'info'
    })
  }

  const thaiText = '“แม้สายฝนจะกลบเสียงทุกอย่าง แต่เธอยังคงจำคำสัญญานั้นได้”'
  const engText = '“Even as the rain drowned out every sound, she still remembered that promise.”'

  return (
    <section className="section translation-section">
      <div className="wrap">
        <div className="translation-header">
          <div>
            <span className="eyebrow">LITERARY CONTEXT TRANSLATION</span>
            <h2>
              แปลวรรณกรรมไทย-อังกฤษ<br />
              <span className="grad">แบบไม่แข็งทื่อ</span>
            </h2>
          </div>
          <button
            className="btn btn-ghost btn-small"
            id="translationToggle"
            onClick={handleToggle}
          >
            สลับตัวอย่างภาษา ↔
          </button>
        </div>

        <div className="translation-grid">
          {/* Card 1: Source */}
          <div className="translation-card">
            <div className="translation-lang">
              <span>{isReversed ? 'ENGLISH · SOURCE' : 'THAI · ต้นฉบับ'}</span>
              <span>01</span>
            </div>
            <div className="translation-text">
              {isReversed ? engText : thaiText}
            </div>
          </div>

          {/* Card 2: Target */}
          <div className="translation-card">
            <div className="translation-lang">
              <span>{isReversed ? 'THAI · คำแปล' : 'ENGLISH · คำแปล'}</span>
              <span style={{ color: 'var(--mint)' }}>Context Locked ✓</span>
            </div>
            <div className="translation-text">
              {isReversed ? thaiText : engText}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
