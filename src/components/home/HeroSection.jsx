import React from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import LogoLoop from '../react-bits/LogoLoop'

export default function HeroSection() {
  const { navigateTo } = useApp()
  const { user } = useAuth()

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
            <div className="text-xs font-bold text-white whitespace-nowrap">AI Assistant Engine</div>
            <div className="text-[11px] text-amber-200/70 whitespace-nowrap">ประมวลผลคำไทยลึกซึ้งระดับวรรณกรรม</div>
          </div>
        </div>
      ),
      title: "AI Engine"
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
    },
    {
      node: (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-purple-500/25 hover:border-purple-400/60 hover:bg-purple-500/15 transition backdrop-blur-md shadow-sm">
          <span className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-sm shadow-inner text-purple-300 shrink-0">📖</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white whitespace-nowrap">Public Reader &amp; ARC</div>
            <div className="text-[11px] text-purple-200/70 whitespace-nowrap">อ่านฟรี 5 ตอนแรก พร้อมระบบคั่นหน้า</div>
          </div>
        </div>
      ),
      title: "Public Reader"
    },
    {
      node: (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-blue-500/25 hover:border-blue-400/60 hover:bg-blue-500/15 transition backdrop-blur-md shadow-sm">
          <span className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-sm shadow-inner text-blue-300 shrink-0">☁️</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white whitespace-nowrap">100% Supabase Cloud</div>
            <div className="text-[11px] text-blue-200/70 whitespace-nowrap">บันทึกข้อมูลเรียลไทม์ ปลอดภัยบนคลาวด์</div>
          </div>
        </div>
      ),
      title: "Supabase Cloud"
    },
    {
      node: (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-emerald-500/25 hover:border-emerald-400/60 hover:bg-emerald-500/15 transition backdrop-blur-md shadow-sm">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-sm shadow-inner text-emerald-300 shrink-0">🍃</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white whitespace-nowrap">Low-Spec 60 FPS Mode</div>
            <div className="text-[11px] text-emerald-200/70 whitespace-nowrap">โหมดอ่านสบายตา ประหยัดพลังงานมือถือ</div>
          </div>
        </div>
      ),
      title: "Low Spec Mode"
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
                onClick={() => navigateTo('workspace_home')}
              >
                <img src="/Logo/TrixCoinLogo.png" alt="Trix Coin" className="w-4 h-4 object-contain inline-block" />
                <span>{user ? 'เข้าสู่ Workspace' : '🔒 เริ่มเขียนเลย (Workspace)'}</span>
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

          {/* Right Hero Visual / Large Glowing Plottrix Brand Crest */}
          <div className="hero-visual flex items-center justify-center relative min-h-[380px] sm:min-h-[440px]">
            {/* Background Multi-layer Radial Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-fuchsia-600/20 to-indigo-600/30 rounded-full blur-[90px] pointer-events-none transform -translate-y-4" />
            <div className="absolute w-72 h-72 rounded-full bg-purple-500/20 blur-[60px] animate-pulse pointer-events-none" />

            {/* Main Holographic Logo Card */}
            <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#1c1236]/85 via-[#120a26]/92 to-[#0c071a]/98 border border-purple-500/35 shadow-[0_25px_70px_rgba(112,48,220,0.35)] backdrop-blur-2xl flex flex-col items-center text-center group hover:border-purple-400/60 transition-all duration-500">
              
              {/* Top Status Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold mb-6 backdrop-blur-md shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>PLOTTRIX PLATFORM</span>
              </div>

              {/* Large Glowing Brand Logo */}
              <div className="relative w-full max-w-[320px] aspect-[16/9] flex items-center justify-center my-2 transform group-hover:scale-105 transition-transform duration-500">
                <img
                  src="/Logo/PlottrixFullLogo.png"
                  alt="Plottrix Brand Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(168,85,247,0.65)]"
                />
              </div>

              {/* Tagline / Subtitle */}
              <h2 className="text-lg sm:text-xl font-black text-white mt-4 tracking-tight">
                AUTHOR-FIRST AI WRITING WORKSPACE
              </h2>
              <p className="text-xs text-plottrix-muted mt-2 max-w-xs leading-relaxed">
                สร้างสรรค์ วางพล็อต และขัดเกลานิยายของคุณด้วยพลังปัญญาประดิษฐ์ระดับวรรณกรรม
              </p>

              {/* Floating Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pt-5 border-t border-white/10 w-full">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300">
                  ✦ Narrative Continuity
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300">
                  ✦ Style Persona
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300">
                  ✦ 100% Thai Literary
                </span>
              </div>
            </div>

            <div className="hero-glow"></div>
          </div>
        </div>
      </section>

      {/* Modern React Bits LogoLoop Infinite Feature Strip */}
      <div className="py-5 sm:py-6 border-y border-white/10 bg-[#0c0817]/70 backdrop-blur-xl relative overflow-hidden z-20 shadow-lg">
        <LogoLoop
          logos={featureLogos}
          speed={60}
          direction="left"
          logoHeight={48}
          gap={32}
          intro={false}
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
