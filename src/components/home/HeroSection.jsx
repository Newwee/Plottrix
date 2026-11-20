import React from 'react'
import { useApp } from '../../context/AppContext'

export default function HeroSection() {
  const { navigateTo } = useApp()

  return (
    <>
      <section className="hero" id="heroSection">
        <div className="wrap hero-grid">
          {/* Left Hero Copy */}
          <div className="hero-copy">
            <div className="hero-brand-top">
              <div className="hero-brand-badge">
                <img
                  src="/Logo/PlottrixFullLogo.png"
                  alt="Plottrix AI Platform"
                  className="hero-brand-logo-img"
                />
                <span className="hero-brand-tag">PREMIUM AI WRITING PLATFORM</span>
              </div>
            </div>

            <div className="hero-kicker">
              <span className="dot"></span> AUTHOR-FIRST WRITING WORKSPACE
            </div>

            <h1 className="hero-title">
              <span>AI</span> <span>ผู้ช่วยบรรณาธิการ</span><br />
              <span className="grad">ที่เข้าใจนิยายของคุณ</span>
            </h1>

            <p className="hero-desc">
              ไม่ใช่ AI ที่แย่งนักเขียนแต่งนิยาย แต่เป็นผู้ช่วยที่แก้คำผิด เกลาสำนวนตามโปรไฟล์ของคุณ และเช็คความต่อเนื่อง — ให้คุณเป็นเจ้าของไอเดียและลงมือเขียนเอง 100%
            </p>

            <div className="hero-actions flex-wrap gap-3">
              {/* #1 Primary Hero Action: Read Novels */}
              <button
                type="button"
                className="btn btn-primary btn-hero-glow flex items-center gap-2.5 text-base sm:text-lg font-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl shadow-[0_0_35px_rgba(168,85,247,0.5)] border border-purple-300/60 bg-gradient-to-r from-purple-500 via-indigo-500 to-fuchsia-500 hover:brightness-110 cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => {
                  const target = document.getElementById('public-novels')
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    navigateTo('read')
                  }
                }}
              >
                <span className="text-xl">📖</span>
                <span>อ่านนิยาย (Read Novels)</span>
                <span>→</span>
              </button>

              {/* Secondary Action: Start Writing */}
              <button
                type="button"
                className="btn btn-ghost flex items-center gap-2 font-bold px-5 py-3.5 rounded-2xl border border-white/15 hover:border-purple-400/50 hover:bg-white/5 cursor-pointer text-xs sm:text-sm"
                onClick={() => navigateTo('workspace')}
              >
                <img src="/Logo/TrixCoinLogo.png" alt="Trix Coin" className="w-4 h-4 object-contain inline-block" />
                <span>เริ่มเขียนเลย (Workspace)</span>
              </button>

              <a className="btn btn-ghost text-xs hidden md:flex items-center gap-1.5" href="#coin-trix">
                <span>ทำความรู้จัก Coin Trix</span>
              </a>
            </div>

            <div className="trial-note">
              <img src="/Logo/TrixCoinLogo.png" alt="Trix Coin" className="w-3.5 h-3.5 object-contain inline-block mr-1" />
              <span>เริ่มต้นฟรีทันที 30 Trix แรกเข้า + รับเพิ่มฟรีทุกวัน · ไม่ต้องผูกบัตร</span>
            </div>
          </div>

          {/* Right Hero Visual / Interactive Editor Preview */}
          <div className="hero-visual">
            <div className="floating-tag"><em>✦</em> ผู้ช่วยบรรณาธิการ AI พร้อมทำงาน</div>
            <div className="editor-window">
              <div className="editor-top">
                <div className="editor-title">
                  <span className="file-dot"></span> Plottrix Studio{' '}
                  <span style={{ color: '#766b88', fontWeight: 400 }}>/ บทที่ 04 — เงาในสายฝน</span>
                </div>
                <div className="window-controls">
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-400/30">Studio</span>
                </div>
              </div>

              <div className="editor-body">
                {/* Editor Left Rail */}
                <aside className="editor-side">
                  <div className="side-label">PROJECT</div>
                  <div className="chapter active"><b>▤</b> บทที่ 04</div>
                  <div className="chapter">▤ บทที่ 05</div>
                  <div className="chapter">▤ บทที่ 06</div>
                  <div className="chapter">＋ เพิ่มตอนใหม่</div>
                  <div className="side-label" style={{ marginTop: '21px' }}>STORY BIBLE</div>
                  <div className="chapter">♙ ตัวละคร &amp; Lore</div>
                  <div className="chapter">✧ Style Persona</div>
                </aside>

                {/* Editor Center Document */}
                <div className="editor-main">
                  <div className="doc-meta">
                    <span>ต้นฉบับ · บันทึกอัตโนมัติ</span>
                    <span>1,248 คำ</span>
                  </div>
                  <h3 className="doc-heading">เงาในสายฝน</h3>
                  <p className="doc-text">
                    เสียงฝนตกกระทบหลังคาไม้เก่าอย่างต่อเนื่อง <span className="spell">หญิงสาวยืนมอง</span> เงาสะท้อนของตัวเองในบานหน้าต่าง ก่อนจะนึกถึงคำสัญญาที่เขาเคยให้ไว้...
                  </p>
                  <p className="doc-text">
                    เธอสูดหายใจลึก ความทรงจำในคืนนั้นยังคงชัดเจนราวกับเพิ่งเกิดขึ้นเมื่อวาน
                  </p>
                  <div className="suggestion">
                    <small>✦ STYLE PERSONA · ดราม่าลึกลับ</small>
                    <strong>คำแนะนำการเกลาสำนวนตามโปรไฟล์</strong>
                    <span>ลองพิจารณา “หญิงสาวทอดสายตา...”</span>
                    <b className="fix-pill cursor-pointer" onClick={() => navigateTo('workspace')}>ใช้คำนี้ ↗</b>
                  </div>
                </div>

                {/* Editor Right Editorial Check */}
                <aside className="editor-right">
                  <div className="ai-head">EDITORIAL CHECK</div>
                  <div className="scan-card">
                    <small>ความต่อเนื่องข้ามตอน</small>
                    <strong>98%</strong>
                    <div className="scan-bars">
                      <i style={{ height: '45%' }}></i>
                      <i style={{ height: '70%' }}></i>
                      <i style={{ height: '56%' }}></i>
                      <i style={{ height: '90%' }}></i>
                      <i style={{ height: '75%' }}></i>
                      <i style={{ height: '100%' }}></i>
                    </div>
                  </div>
                  <div className="scan-check"><b>✓</b> ตรวจคำผิด &amp; คำพ้องเสียง</div>
                  <div className="scan-check"><b>✓</b> คงเสียงตาม Style Persona</div>
                  <div className="scan-check"><b>✓</b> ตรงกับ Lore Bible</div>
                </aside>
              </div>

              {/* Editor Bottom Bar */}
              <div className="editor-bottom">
                <span className="live-status"><i></i> บันทึกแล้ว</span>
                <span>ภาษาไทย · บทที่ 04</span>
                <span className="text-plottrix-purple2 font-semibold">คงเหลือ 30 Trix ✦</span>
              </div>
            </div>
            <div className="hero-glow"></div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <div className="feature-strip">
        <div className="wrap strip-grid">
          <div className="strip-item">
            <div className="strip-icon">⌕</div>
            <div>
              <strong>Proofread &amp; Batch Check</strong>
              <span>แก้คำผิด คำพ้องเสียง &amp; ตรวจทั้งตอน</span>
            </div>
          </div>
          <div className="strip-item">
            <div className="strip-icon">✧</div>
            <div>
              <strong>Style Persona (3 Profiles)</strong>
              <span>บันทึกโปรไฟล์สำนวนเฉพาะตัว</span>
            </div>
          </div>
          <div className="strip-item">
            <div className="strip-icon">⑂</div>
            <div>
              <strong>15 Chapters Memory</strong>
              <span>จำบริบทตัวละครย้อนหลังต่อเนื่อง</span>
            </div>
          </div>
          <div className="strip-item">
            <div className="strip-icon">◎</div>
            <div>
              <strong>Context Translation</strong>
              <span>แปลภาษาโดยรักษาบริบทตัวละคร</span>
            </div>
          </div>
          <div className="strip-item">
            <div className="strip-icon">◇</div>
            <div>
              <strong>Novel Vocabulary Bank</strong>
              <span>คลังคำศัพท์นิยายเปิดใช้ฟรีทุกแพลน</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
