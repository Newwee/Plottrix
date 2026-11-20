import React, { memo } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import WarmTooltip from '../react-bits/WarmTooltip'
import StatusMark from '../react-bits/StatusMark'

const GENRES = [
  'แฟนตาซี / กำลังภายใน',
  'สืบสวน / ระทึกขวัญ',
  'โรแมนติก / ดราม่า',
  'วาย / ยูริ (BL / GL)',
  'สยองขวัญ',
  'พีเรียด / ย้อนยุค',
  'เอาชีวิตรอด / ไซไฟ',
  'คอมเมดี้ / ชีวิตประจำวัน',
  'ทั่วไป / ยังไม่ระบุ'
]

function TopNavbar() {
  const { user, profile } = useAuth()
  const {
    novelTitle, setNovelTitle,
    genre, setGenre,
    trixBalance, claimDailyTrix,
    saveStatus,
    rightSidebarOpen, setRightSidebarOpen,
    isFocusMode, setIsFocusMode,
    setActiveModal,
    personas, activePersonaId,
    navigateTo,
    startTour,
    isAIProcessing
  } = useApp()

  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0]

  return (
    <header className="sticky top-0 z-40 px-4 py-2.5 bg-gradient-to-b from-[#120d22]/95 to-[#120d22]/70 backdrop-blur-xl border-b border-plottrix-line/30 flex items-center justify-between gap-4 select-none">
      {/* 1. Left: Authentic PillNav Logo & Novel Navigation */}
      <div className="flex items-center gap-3">
        <nav className="pill-nav" aria-label="Plottrix Brand">
          <div
            className="pill-nav__logo pill-nav__surface cursor-pointer group"
            onClick={() => navigateTo('workspace_home')}
            title="คลิกเพื่อกลับไปยังชั้นวางนิยาย (Workspace Home)"
          >
            <img
              src="/Logo/PlottrixSingleLogo.png"
              alt="Plottrix Logo"
              className="pill-nav__logo-img group-hover:scale-110 transition-transform"
            />
            <span className="bg-gradient-to-r from-white via-purple-200 to-plottrix-purple2 bg-clip-text text-transparent font-bold text-sm tracking-tight">
              Plottrix
            </span>
          </div>
        </nav>

        {/* Back to Workspace Home Button */}
        <WarmTooltip content="กลับสู่ชั้นวางนิยายของคุณ" side="bottom">
          <button
            type="button"
            onClick={() => navigateTo('workspace_home')}
            className="text-xs text-purple-300 hover:text-white px-3 py-1.5 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/25 transition flex items-center gap-1.5 font-semibold"
          >
            <span>📚</span>
            <span className="hidden sm:inline">ชั้นวางนิยาย</span>
          </button>
        </WarmTooltip>

        {/* Novel Title Input */}
        <div className="flex items-center gap-2">
          <span className="text-plottrix-line text-sm hidden sm:inline">/</span>
          <input
            type="text"
            value={novelTitle}
            onChange={(e) => setNovelTitle(e.target.value)}
            placeholder="ตั้งชื่อนิยาย..."
            className="bg-transparent hover:bg-white/5 focus:bg-plottrix-panel border border-transparent hover:border-plottrix-line focus:border-plottrix-purple2/50 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold text-plottrix-text w-48 sm:w-60 transition outline-none"
            title="คลิกเพื่อแก้ไขชื่อเรื่อง"
          />
        </div>

        {/* Custom Glass Genre Selector */}
        <WarmTooltip content="แนวเรื่องนิยาย (จูนคลังคำศัพท์และโทนอัตโนมัติ)" side="bottom">
          <div className="hidden lg:flex items-center relative">
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="bg-[#1e1636] hover:bg-[#261c44] border border-white/15 text-purple-200 text-xs px-3 py-1.5 rounded-xl outline-none cursor-pointer transition font-medium appearance-none pr-7 shadow-sm"
            >
              {GENRES.map(g => (
                <option key={g} value={g} className="bg-[#16102a] text-white">{g}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-purple-300 pointer-events-none">
              ▼
            </span>
          </div>
        </WarmTooltip>

        {/* Debounced Auto-Save Live Status (2.5s) */}
        <div className="hidden md:flex items-center">
          <WarmTooltip content="บันทึกอัตโนมัติลง Supabase 2.5 วินาทีหลังหยุดพิมพ์" side="bottom">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-[11px]">
              <StatusMark
                status={saveStatus === 'saving' ? 'running' : 'done'}
                size={14}
                fontSize={11}
                strokeWidth={2.2}
                label={saveStatus === 'saving' ? 'กำลังบันทึก...' : 'บันทึกแล้ว ✓'}
                color="rgba(203, 183, 255, 0.75)"
                doneColor="#34d399"
              />
            </div>
          </WarmTooltip>
        </div>
      </div>

      {/* 2. Right: AI Lock Status, Persona, Trix Coins, Vocab Toggle, Export, Settings, Tour & Focus */}
      <div id="tour-target-top-actions" className="flex items-center gap-2">
        {/* Global AI Processing Indicator */}
        {isAIProcessing && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/30 border border-purple-400 text-xs font-bold text-purple-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>AI กำลังทำงาน...</span>
          </div>
        )}

        {/* Style Persona Pill */}
        <WarmTooltip content={`สไตล์สำนวน: ${activePersona.name}`} shortcut="⌥P" side="bottom">
          <button
            type="button"
            onClick={() => setActiveModal('stylePersona')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-400/40 text-xs text-plottrix-text transition font-medium"
          >
            <span className="text-purple-300">✦</span>
            <span>{activePersona.name.split(' ')[0]}</span>
          </button>
        </WarmTooltip>

        {/* Trix Coin Indicator & Daily Claim Button */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10">
          <WarmTooltip content="เหรียญ Trix สำหรับใช้งานฟีเจอร์ AI" side="bottom">
            <button
              type="button"
              onClick={() => setActiveModal('pricing')}
              className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white transition"
            >
              <span>🪙</span>
              <span>{trixBalance}</span>
              <span className="text-[10px] text-plottrix-muted font-normal">Trix</span>
            </button>
          </WarmTooltip>

          <WarmTooltip content="รับฟรี +3 Trix ทุกวัน!" side="bottom">
            <button
              type="button"
              onClick={claimDailyTrix}
              className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-[10px] font-bold text-white transition shadow-sm"
            >
              +3 ฟรี
            </button>
          </WarmTooltip>
        </div>

        {/* Vocabulary Sidebar Toggle */}
        <WarmTooltip content="คลังคำศัพท์สำหรับนักเขียน (1,041 คำ)" shortcut="⌘2" side="bottom">
          <button
            type="button"
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition flex items-center gap-1.5 ${
              rightSidebarOpen
                ? 'bg-purple-600/25 text-purple-200 border-purple-400/40 shadow-sm'
                : 'bg-white/5 hover:bg-white/10 text-plottrix-muted hover:text-white border-white/10'
            }`}
          >
            <span>📚</span>
            <span className="hidden md:inline">คลังคำศัพท์</span>
          </button>
        </WarmTooltip>

        {/* Tour Button */}
        <WarmTooltip content="เปิดทัวร์แนะนำการใช้งาน (Tour)" side="bottom">
          <button
            type="button"
            onClick={startTour}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-xs text-purple-300 font-bold transition"
          >
            ?
          </button>
        </WarmTooltip>

        {/* Settings Button & Profile (Auth-Gated) */}
        {user ? (
          <div className="flex items-center gap-1.5">
            <WarmTooltip content={`โปรไฟล์: ${profile?.display_name || user.email?.split('@')[0]}`} side="bottom">
              <button
                type="button"
                onClick={() => setActiveModal('settings')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-purple-600/50 flex items-center justify-center text-[10px] font-bold">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <span className="hidden xl:inline max-w-[100px] truncate text-[11px]">
                  {profile?.display_name || user.email?.split('@')[0]}
                </span>
              </button>
            </WarmTooltip>

            <WarmTooltip content="การตั้งค่าห้องเขียนและโปรไฟล์" side="bottom">
              <button
                type="button"
                onClick={() => setActiveModal('settings')}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-xs text-slate-300 transition cursor-pointer"
              >
                ⚙
              </button>
            </WarmTooltip>
          </div>
        ) : (
          <WarmTooltip content="เข้าสู่ระบบเพื่อซิงก์ข้อมูลและบันทึกลงคลาวด์" side="bottom">
            <button
              type="button"
              onClick={() => setActiveModal('auth')}
              className="px-3 py-1.5 rounded-full bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-xs font-semibold text-purple-200 transition cursor-pointer"
            >
              เข้าสู่ระบบ
            </button>
          </WarmTooltip>
        )}

        {/* Export Button */}
        <WarmTooltip content="ส่งออกต้นฉบับ (ReadAWrite / Dek-D / TXT)" shortcut="⌘E" side="bottom">
          <button
            type="button"
            onClick={() => setActiveModal('export')}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-plottrix-text border border-white/10 text-xs font-semibold transition flex items-center gap-1"
          >
            <span>📤</span>
            <span className="hidden sm:inline">ส่งออก</span>
          </button>
        </WarmTooltip>

        {/* Focus Mode */}
        <WarmTooltip content={isFocusMode ? 'ออกจากโหมดไร้สิ่งรบกวน (Esc)' : 'โหมดไร้สิ่งรบกวน (Focus Mode)'} shortcut="F11" side="bottom">
          <button
            type="button"
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs transition ${
              isFocusMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 hover:bg-white/10 text-plottrix-muted hover:text-white border-white/10'
            }`}
          >
            ⛶
          </button>
        </WarmTooltip>
      </div>
    </header>
  )
}

export default memo(TopNavbar)
