import React from 'react'
import { useApp } from '../../context/AppContext'
import LogoLoop from '../react-bits/LogoLoop'

export default function HeroSection() {
  const { navigateTo } = useApp()

  const featureLogos = [
    {
      node: (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-purple-500/25 hover:border-purple-400/60 hover:bg-purple-500/15 transition backdrop-blur-md shadow-sm">
          <span className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-sm shadow-inner text-purple-300 shrink-0">⌕</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white whitespace-nowrap">Proofread &amp; Batch Check</div>
            <div className="text-[11px] text-purple-200/70 whitespace-nowrap">แก้คำผิด คำพ้องเสียง &amp; ตรวจทั้งตอน</div>
          </div>
        </div>
      ),
      title: "Proofread & Batch Check"
    },
    {
      node: (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-pink-500/25 hover:border-pink-400/60 hover:bg-pink-500/15 transition backdrop-blur-md shadow-sm">
          <span className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-sm shadow-inner text-pink-300 shrink-0">✧</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white whitespace-nowrap">Style Persona (3 Profiles)</div>
            <div className="text-[11px] text-pink-200/70 whitespace-nowrap">บันทึกโปรไฟล์สำนวนเฉพาะตัว</div>
          </div>
        </div>
      ),
      title: "Style Persona"
    },
    {
      node: (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-indigo-500/25 hover:border-indigo-400/60 hover:bg-indigo-500/15 transition backdrop-blur-md shadow-sm">
          <span className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-sm shadow-inner text-indigo-300 shrink-0">⑂</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white whitespace-nowrap">15 Chapters Memory</div>
            <div className="text-[11px] text-indigo-200/70 whitespace-nowrap">จำบริบทตัวละครย้อนหลังต่อเนื่อง</div>
          </div>
        </div>
      ),
      title: "Story Memory"
    },
    {
      node: (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-cyan-500/25 hover:border-cyan-400/60 hover:bg-cyan-500/15 transition backdrop-blur-md shadow-sm">
          <span className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-sm shadow-inner text-cyan-300 shrink-0">◎</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white whitespace-nowrap">Context Translation</div>
            <div className="text-[11px] text-cyan-200/70 whitespace-nowrap">แปลภาษาโดยรักษาบริบทตัวละคร</div>
          </div>
        </div>
      ),
      title: "Context Translation"
    },
    {
      node: (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-emerald-500/25 hover:border-emerald-400/60 hover:bg-emerald-500/15 transition backdrop-blur-md shadow-sm">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-sm shadow-inner text-emerald-300 shrink-0">◇</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white whitespace-nowrap">Novel Vocabulary Bank</div>
            <div className="text-[11px] text-emerald-200/70 whitespace-nowrap">คลังคำศัพท์นิยายเปิดใช้ฟรีทุกแพลน</div>
          </div>
        </div>
      ),
      title: "Novel Vocabulary Bank"
    },
    {
      node: (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-amber-500/25 hover:border-amber-400/60 hover:bg-amber-500/15 transition backdrop-blur-md shadow-sm">
          <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-sm shadow-inner text-amber-300 shrink-0">⚡</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white whitespace-nowrap">Gemini 2.5 AI Engine</div>
            <div className="text-[11px] text-amber-200/70 whitespace-nowrap">ประมวลผลคำไทยลึกซึ้งระดับวรรณกรรม</div>
          </div>
        </div>
      ),
      title: "Gemini 2.5 AI Engine"
    },
    {
      node: (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-fuchsia-500/25 hover:border-fuchsia-400/60 hover:bg-fuchsia-500/15 transition backdrop-blur-md shadow-sm">
          <span className="w-8 h-8 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/30 flex items-center justify-center text-sm shadow-inner text-fuchsia-300 shrink-0">📥</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white whitespace-nowrap">Smart Manuscript Import</div>
            <div className="text-[11px] text-fuchsia-200/70 whitespace-nowrap">นำเข้า .docx / .md ซิงค์บทและตัวละคร</div>
          </div>
        </div>
      ),
      title: "Smart Manuscript Import"
    }
  ]

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

      {/* Modern React Bits LogoLoop Infinite Feature Strip */}
      <div className="py-7 border-y border-white/10 bg-[#0c0817]/70 backdrop-blur-xl relative overflow-hidden z-20">
        <LogoLoop
          logos={featureLogos}
          speed={65}
          direction="left"
          logoHeight={48}
          gap={28}
          pauseOnHover
          scaleOnHover
          fadeOut
          fadeOutWidth={0.12}
          draggable
          ariaLabel="Plottrix Core Features Loop"
        />
      </div>
    </>
  )
}
